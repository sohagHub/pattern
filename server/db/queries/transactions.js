/**
 * @file Defines the queries for the transactions table.
 */

const { retrieveAccountByPlaidAccountId } = require('./accounts');
const db = require('../');

/**
 * Creates or updates multiple transactions.
 *
 * @param {Object[]} transactions an array of transactions.
 */
const createOrUpdateTransactions = async transactions => {
  const pendingQueries = transactions.map(async transaction => {
    let {
      account_id: plaidAccountId,
      transaction_id: plaidTransactionId,
      category_id: plaidCategoryId,
      category: categories,
      transaction_type: transactionType,
      name: transactionName,
      amount,
      iso_currency_code: isoCurrencyCode,
      unofficial_currency_code: unofficialCurrencyCode,
      date: transactionDate,
      pending,
      account_owner: accountOwner,
    } = transaction;
    const { id: accountId } = await retrieveAccountByPlaidAccountId(
      plaidAccountId
    );
    let [category, subcategory] = categories;

    ({ transactionName, category, subcategory } = applyRulesForCategory(
      transactionName,
      category,
      subcategory
    ));

    try {
      const query = {
        text: `
          INSERT INTO transactions_table
            (
              account_id,
              plaid_transaction_id,
              plaid_category_id,
              category,
              subcategory,
              type,
              name,
              amount,
              iso_currency_code,
              unofficial_currency_code,
              date,
              pending,
              account_owner
            )
          VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (plaid_transaction_id) DO UPDATE 
            SET 
              plaid_category_id = EXCLUDED.plaid_category_id,
              category = CASE WHEN transactions_table.manually_updated THEN transactions_table.category ELSE EXCLUDED.category END,
              subcategory = CASE WHEN transactions_table.manually_updated THEN transactions_table.subcategory ELSE EXCLUDED.subcategory END,
              type = EXCLUDED.type,
              name = CASE WHEN transactions_table.manually_updated THEN transactions_table.name ELSE EXCLUDED.name END,
              amount = EXCLUDED.amount,
              iso_currency_code = EXCLUDED.iso_currency_code,
              unofficial_currency_code = EXCLUDED.unofficial_currency_code,
              date = EXCLUDED.date,
              pending = EXCLUDED.pending,
              account_owner = EXCLUDED.account_owner;
        `,
        values: [
          accountId,
          plaidTransactionId,
          plaidCategoryId,
          category,
          subcategory,
          transactionType,
          transactionName,
          amount,
          isoCurrencyCode,
          unofficialCurrencyCode,
          transactionDate,
          pending,
          accountOwner,
        ],
      };
      await db.query(query);
    } catch (err) {
      console.error(err);
    }
  });
  await Promise.all(pendingQueries);
};

const justUpdateTransactions = async transactions => {
  const pendingQueries = transactions.map(async transaction => {
    // I have the updatred transaction object, just update it in the db
    try {
      const query = {
        text: `
          UPDATE transactions_table
          SET
            name = $2,
            category = $3,
            subcategory = $4,
            manually_updated = true
          WHERE id = $1
          RETURNING *
        `,
        values: [
          transaction.id,
          transaction.name,
          transaction.category,
          transaction.subcategory
        ],
      };  
      await db.query(query);
    } catch (err) {
      console.error(err);
    }
  });
  await Promise.all(pendingQueries);
}


/**
 * Retrieves a single transaction by its ID.
 * 
 * @param {number} transactionId the ID of the transaction.
 * @returns {Object} the transaction.
 */
const retrieveTransactionById = async transactionId => {
  const query = {
    text: 'SELECT * FROM transactions WHERE id = $1',
    values: [transactionId],
  };
  const { rows: transactions } = await db.query(query);
  return transactions[0];
}

/**
 * Retrieves all transactions for a single account.
 *
 * @param {number} accountId the ID of the account.
 * @returns {Object[]} an array of transactions.
 */
const retrieveTransactionsByAccountId = async accountId => {
  const query = {
    text: 'SELECT * FROM transactions WHERE account_id = $1 ORDER BY date DESC',
    values: [accountId],
  };
  const { rows: transactions } = await db.query(query);
  return transactions;
};

/**
 * Retrieves all transactions for a single item.
 *
 *
 * @param {number} itemId the ID of the item.
 * @returns {Object[]} an array of transactions.
 */
const retrieveTransactionsByItemId = async itemId => {
  const query = {
    text: 'SELECT * FROM transactions WHERE item_id = $1 ORDER BY date DESC',
    values: [itemId],
  };
  const { rows: transactions } = await db.query(query);
  return transactions;
};

/**
 * Retrieves all transactions for a single user.
 *
 *
 * @param {number} userId the ID of the user.
 * @returns {Object[]} an array of transactions.
 */
const retrieveTransactionsByUserId = async userId => {
  const query = {
    text: 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
    values: [userId],
  };
  const { rows: transactions } = await db.query(query);
  return transactions;
};

/**
 * Removes one or more transactions.
 *
 * @param {string[]} plaidTransactionIds the Plaid IDs of the transactions.
 */
const deleteTransactions = async plaidTransactionIds => {
  const pendingQueries = plaidTransactionIds.map(async transactionId => {
    const query = {
      text: 'DELETE FROM transactions_table WHERE plaid_transaction_id = $1',
      values: [transactionId],
    };
    await db.query(query);
  });
  await Promise.all(pendingQueries);
};

const applyRulesForCategory = (transactionName, category, subcategory) => {
  if (transactionName === 'Costco' || transactionName === 'Trader Joe\'s') {
    category = 'Food and Drink';
    subcategory = 'Groceries';
  } else if (transactionName.includes('FOOD.APPLE.COM')) {
    transactionName = 'FOOD.APPLE.COM';
    category = 'Food and Drink';
    subcategory = 'Lunch SH';
  } else if (transactionName.includes('AMAZON')) {
    transactionName = 'AMAZON';
    category = 'Shops';
    subcategory = 'Digital Purchase';
  } else if (transactionName.includes('USBANK LOAN PAYMENT')) {
    transactionName = 'USBANK LOAN PAYMENT';
    category = 'Transport';
    subcategory = 'Auto Loan';
  } else if (transactionName.includes('IC* INSTACART')) {
    category = 'Food and Drink';
    subcategory = 'Groceries';
  } else if (transactionName.includes('TRUSTMARKBENEFIT')) {
    transactionName = 'TRUSTMARKBENEFIT';
    category = 'Healthcare';
    subcategory = 'Health Insurance';
  }

  return { transactionName, category, subcategory };
}

module.exports = {
  createOrUpdateTransactions,
  retrieveTransactionById,
  retrieveTransactionsByAccountId,
  retrieveTransactionsByItemId,
  retrieveTransactionsByUserId,
  deleteTransactions,
  justUpdateTransactions,
};
