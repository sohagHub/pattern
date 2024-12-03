/**
 * @file Defines helpers for updating transactions on an item
 */

const plaid = require('./plaid');
const { prodClient } = require('./plaid');
const {
  retrieveItemByPlaidItemId,
  createAccounts,
  createOrUpdateTransactions,
  deleteTransactions,
  updateItemTransactionsCursor,
} = require('./db/queries');

const FiveDaysInMillis = 0 * 24 * 60 * 60 * 1000;
const OneMonthInMillis = 1 * 30 * 24 * 60 * 60 * 1000; // Approx. 1 month

/**
 * Fetches transactions from the Plaid API for a given item.
 *
 * @param {string} plaidItemId the Plaid ID for the item.
 * @returns {Object{}} an object containing transactions and a cursor.
 */
const fetchTransactionUpdates = async plaidItemId => {
  // Retrieve item details based on plaidItemId
  const {
    plaid_access_token: accessToken,
    last_transactions_update_cursor: lastCursor,
    is_prod: isProd,
    updated_at: updatedAt,
    is_archived: isArchived,
  } = await retrieveItemByPlaidItemId(plaidItemId);

  let cursor = lastCursor;

  // Initialize arrays to hold transaction updates
  let added = [];
  let modified = [];
  let removed = [];
  let isUpdated = false;

  try {
    const plaidClient = isProd ? prodClient : plaid;
    const updatedAtDate = new Date(updatedAt);

    let response;

    if (
      (isProd && updatedAtDate.getTime() > Date.now() - FiveDaysInMillis) ||
      isArchived
    ) {
      // If the last update was within five days in production or the item is archived, skip fetching
      response = {
        data: {
          added: [],
          modified: [],
          removed: [],
          has_more: false,
          next_cursor: cursor,
          isUpdated: false,
        },
      };
    } else {
      // Fetch transactions by date (last 1 month)
      const transactionsByDate = await getTransactionsByDate(
        plaidClient,
        accessToken
      );
      added = [...new Set([...added, ...transactionsByDate])];

      // Sync transactions
      const syncResult = await syncTransactions(
        plaidClient,
        accessToken,
        cursor
      );
      added = [...new Set([...added, ...syncResult.added])];
      modified = modified.concat(syncResult.modified);
      removed = removed.concat(syncResult.removed);
      cursor = syncResult.nextCursor;
      isUpdated = true; // Assuming sync was successful
    }

    response = { data: { isUpdated } };
  } catch (err) {
    console.error(`Error fetching transactions: ${err.message}`);
    cursor = lastCursor; // Reset cursor on error
  }

  return {
    added,
    modified,
    removed,
    cursor,
    accessToken,
    isUpdated,
    isArchived,
  };
};


// Helper Function: Sync Transactions with Pagination
const syncTransactions = async (plaidClient, accessToken, cursor, batchSize = 100) => {
  let hasMore = true;
  let currentCursor = cursor;
  let added = [];
  let modified = [];
  let removed = [];

  while (hasMore) {
    const syncRequest = {
      access_token: accessToken,
      cursor: currentCursor,
      count: batchSize,
    };

    try {
      const response = await plaidClient.transactionsSync(syncRequest);
      const data = response.data;

      added = added.concat(data.added || []);
      modified = modified.concat(data.modified || []);
      removed = removed.concat(data.removed || []);
      hasMore = data.has_more;
      currentCursor = data.next_cursor;
    } catch (err) {
      console.error(`Error syncing transactions: ${err.message}`);
      throw err; // Rethrow error to be handled in the main function
    }
  }

  return { added, modified, removed, nextCursor: currentCursor, hasMore };
};

// Helper Function: Fetch Transactions by Date with Pagination
const getTransactionsByDate = async (
  plaidClient,
  accessToken
) => {
  let transactions = [];
  
  // Calculate dynamic date range inside the function
  const endDateObj = new Date();
  const endDate = endDateObj.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  const startDateObj = new Date(endDateObj.getTime() - OneMonthInMillis);
  const startDate = startDateObj.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  const request = {
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
  };

  try {
    const response = await plaidClient.transactionsGet(request);
    transactions = response.data.transactions;
    const total_transactions = response.data.total_transactions;

    // Manipulate the offset parameter to paginate transactions and retrieve all available data
    while (transactions.length < total_transactions) {
      const paginatedRequest = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          offset: transactions.length,
        },
      };
      const paginatedResponse = await plaidClient.transactionsGet(paginatedRequest);
      transactions = transactions.concat(paginatedResponse.data.transactions);
    }
  } catch (err) {
    console.error(`Error fetching transactions by date: ${err.message}`);
    throw err; // Rethrow error to be handled in the main function
  }

  return transactions;
};

/**
 * Handles the fetching and storing of new, modified, or removed transactions
 *
 * @param {string} plaidItemId the Plaid ID for the item.
 */
const updateTransactions = async (plaidItemId) => {
  // Fetch new transactions from plaid api.
  const {
    added,
    modified,
    removed,
    cursor,
    accessToken,
    isUpdated,
    isArchived,
  } = await fetchTransactionUpdates(plaidItemId);
  
  const request = {
    access_token: accessToken,
  };

  // if access token contains production string, use prod client
  const plaidClient = accessToken.includes('production') ? prodClient : plaid;

  if (!isArchived) {
    const { data: { accounts } } = await plaidClient.accountsGet(request);
  
    // Update the DB.
    await createAccounts(plaidItemId, accounts);
    await createOrUpdateTransactions(added.concat(modified));
    await deleteTransactions(removed);
    if (isUpdated) {
      await updateItemTransactionsCursor(plaidItemId, cursor);
    }
  }
  
  return {
    addedCount: added.length,
    modifiedCount: modified.length,
    removedCount: removed.length,
  };
};

module.exports = updateTransactions;
