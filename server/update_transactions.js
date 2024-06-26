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

const FiveDaysInMillis = 1 * 24 * 60 * 60 * 1000;
/**
 * Fetches transactions from the Plaid API for a given item.
 *
 * @param {string} plaidItemId the Plaid ID for the item.
 * @returns {Object{}} an object containing transactions and a cursor.
 */
const fetchTransactionUpdates = async (plaidItemId) => {
  // the transactions endpoint is paginated, so we may need to hit it multiple times to
  // retrieve all available transactions.

  // get the access token based on the plaid item id
  const {
    plaid_access_token: accessToken,
    last_transactions_update_cursor: lastCursor,
    is_prod: isProd,
    updated_at: updatedAt,
    is_archived: isArchived,
  } = await retrieveItemByPlaidItemId(
    plaidItemId
  );

  let cursor = lastCursor;

  // New transaction updates since "cursor"
  let added = [];
  let modified = [];
  // Removed transaction ids
  let removed = [];
  let hasMore = true;

  const batchSize = 100;
  try {
    // Iterate through each page of new transaction updates for item
    /* eslint-disable no-await-in-loop */
    while (hasMore) {
      const request = {
        access_token: accessToken,
        cursor: cursor,
        count: batchSize,
      };

      const plaidClient = isProd ? prodClient : plaid;
      const updatedAtDate = new Date(updatedAt);
      let response;
      if ((isProd && updatedAtDate.getTime() > Date.now() - FiveDaysInMillis) || isArchived) {
        response = { data: { added: [], modified: [], removed: [], has_more: false, next_cursor: cursor, isUpdated: false} };
      } else {
        response = await plaidClient.transactionsSync(request);
        response.data.isUpdated = true;
      }
      
      const data = response.data;
      // Add this page of results
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
      // Update cursor to the next cursor
      cursor = data.next_cursor;
      isUpdated = data.isUpdated;
    }
  } catch (err) {
    console.error(`Error fetching transactions: ${err.message}`);
    cursor = lastCursor;
  }
  return { added, modified, removed, cursor, accessToken, isUpdated, isArchived };
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
