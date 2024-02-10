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

    ({ transactionName, category, subcategory } = await applyRulesForCategory(
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

const rules = [
  { name: 'Costco Gas',                         newName: 'Costco Gas',            newCategory: 'Transport',     newSubcategory: 'Gas'             },
  { name: 'Costco',                             newName: 'Costco',                newCategory: 'Food',          newSubcategory: 'Groceries'       },
  { name: 'Trader Joe\'s',                      newName: 'Trader Joe\'s',         newCategory: 'Food',          newSubcategory: 'Groceries'       },
  { name: 'APNAR BAZAR',                        newName: 'APNAR BAZAR',           newCategory: 'Food',          newSubcategory: 'Groceries'       },
  { name: 'FOOD.APPLE.COM',                     newName: 'FOOD.APPLE.COM',        newCategory: 'Food',          newSubcategory: 'Lunch-SH'        },
  { name: 'AMAZON',                             newName: 'Amazon',                newCategory: 'Shops',         newSubcategory: 'Online Shopping' },
  { name: 'USBANK LOAN PAYMENT',                newName: 'USBANK LOAN PAYMENT',   newCategory: 'Transport',     newSubcategory: 'Auto Loan'       },
  { name: 'IC* INSTACART',                      newName: 'IC* INSTACART',         newCategory: 'Food',          newSubcategory: 'Groceries'       },
  { name: 'TRUSTMARKBENEFIT',                   newName: 'TRUSTMARKBENEFIT',      newCategory: 'Healthcare',    newSubcategory: 'Health Insurance'},
  { name: 'MICROSOFT EDIPAYMENT',               newName: 'MICROSOFT EDIPAYMENT',  newCategory: 'Income',        newSubcategory: 'Payroll'         },
  { name: 'Robinhood',                          newName: 'Robinhood',             newCategory: 'Investment',    newSubcategory: 'Robinhood'       },
  { name: 'APPLE INC', subcategory: 'Payroll',  newName: 'APPLE INC',             newCategory: 'Income',        newSubcategory: 'Payroll'         },
  { name: 'DISNEY PLUS',                        newName: 'DISNEY PLUS',           newCategory: 'Entertainment', newSubcategory: 'TV'              },
  { name: 'BANK OF AMERICA MORTGAGE',           newName: 'BofA MORTGAGE',         newCategory: 'Home',          newSubcategory: 'Mortgage'        },
  { name: 'Metropolitan Market',                newName: 'Metropolitan Market',   newCategory: 'Food',          newSubcategory: 'Groceries'       },
  { name: 'KinderCare',                         newName: 'KinderCare',            newCategory: 'Childcare',     newSubcategory: 'KinderCare'      },
  { name: 'FID BKG SVC LLC',                                                      newCategory: 'Investment',    newSubcategory: 'Fidelity'        },
  { name: 'Western Union',                      newName: 'Western Union',         newCategory: 'Gift',          newSubcategory: 'Parents'         },
  { name: 'SOUPSON@COMMONS',                    newName: 'SOUPSON@COMMONS',       newCategory: 'Food',          newSubcategory: 'Lunch-TS'        },
  { name: 'ZELLE PAYMENT TO SAJID SHARLEMIN',   newName: 'ZELLE PAYMENT TO SAJID SHARLEMIN',    newCategory: 'Utility',  newSubcategory: 'Mobile'        },
  { category: 'Food and Drink',                                                   newCategory: 'Food',                                            },
];

const applyRulesForCategory = async (transactionName, category, subcategory) => {
  for (const rule of rules) {
    if ((transactionName || '').toLowerCase().includes((rule.name || '').toLowerCase()) && 
        (category || '').toLowerCase().includes((rule.category || '').toLowerCase()) && 
        (subcategory || '').toLowerCase().includes((rule.subcategory || '').toLowerCase())) {
      
      const newTransactionName = rule.newName || transactionName;
      const newCategory = rule.newCategory || category;
      const newSubcategory = rule.newSubcategory || subcategory;

      return { transactionName: newTransactionName, category: newCategory, subcategory: newSubcategory };
    }
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
  applyRulesForCategory,
};
