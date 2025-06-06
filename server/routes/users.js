/**
 * @file Defines all routes for the Users route.
 */

const express = require('express');
const Boom = require('@hapi/boom');
const {
  retrieveUsers,
  retrieveUserByUsername,
  retrieveAccountsByUserId,
  createUser,
  deleteUsers,
  retrieveItemsByUser,
  retrieveTransactionsByUserId,
  retrieveUserById,
  retrieveRulesByUserId,
  updateNetWorth,
  processWithConcurrencyLimit,
} = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const {
  sanitizeAccounts,
  sanitizeItems,
  sanitizeUsers,
  sanitizeTransactions,
  getInstitutionById,
  getPasswordHash,
} = require('../util');

const updateTransactions = require('../update_transactions');

const router = express.Router();

const plaid = require('../plaid');

/**
 * Retrieves all users.
 *
 * @returns {Object[]} an array of users.
 */
router.get(
  '/',
  asyncWrapper(async (req, res) => {
    const users = await retrieveUsers();
    res.json(sanitizeUsers(users));
  })
);

/**
 * Creates a new user (unless the username is already taken).
 *
 * @TODO make this return an array for consistency.
 *
 * @param {string} username the username of the new user.
 * @returns {Object[]} an array containing the new user.
 */
router.post(
  '/',
  asyncWrapper(async (req, res) => {
    const { username, password } = req.body;
    const usernameExists = await retrieveUserByUsername(username);
    const hashedPassword = await getPasswordHash(password);

    // prevent duplicates
    if (usernameExists)
      throw new Boom('Username already exists', { statusCode: 409 });
    const newUser = await createUser(username, hashedPassword);
    res.json(sanitizeUsers(newUser));
  })
);

/**
 * Retrieves user information for a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array containing a single user.
 */
router.get(
  '/:userId',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const user = await retrieveUserById(userId);
    res.json(sanitizeUsers(user));
  })
);

/**
 * Retrieves all items associated with a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of items.
 */
router.get(
  '/:userId/items',
  asyncWrapper(async (req, res) => {
    const userId = req.user.userId;
    const items = await retrieveItemsByUser(userId);
    res.json(sanitizeItems(items));
  })
);

/**
 * Retrieves all accounts associated with a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of accounts.
 */
router.get(
  '/:userId/accounts',
  asyncWrapper(async (req, res) => {
    const userId = req.user.userId;
    const accounts = await retrieveAccountsByUserId(userId);
    res.json(sanitizeAccounts(accounts));
  })
);

/**
 * Retrieves all transactions associated with a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of transactions
 */
router.get(
  '/:userId/transactions',
  asyncWrapper(async (req, res) => {
    const userId = req.user.userId;
    const transactions = await retrieveTransactionsByUserId(userId);
    res.json(sanitizeTransactions(transactions));
  })
);

/**
 * Deletes a user and its related items
 *
 * @param {string} userId the ID of the user.
 */
router.delete(
  '/:userId',
  asyncWrapper(async (req, res) => {
    const userId = req.user.userId;

    // removes all items from Plaid services associated with the user. Once removed, the access_token
    // associated with an Item is no longer valid and cannot be used to
    // access any data that was associated with the Item.

    // @TODO wrap promise in a try catch block once proper error handling introduced
    const items = await retrieveItemsByUser(userId);
    await Promise.all(
      items.map(({ plaid_access_token: token }) =>
        plaid.itemRemove({ access_token: token })
      )
    );

    // delete from the db
    await deleteUsers(userId);
    res.sendStatus(204);
  })
);

/**
 * Retrieves all rules associated with a single user.
 *
 * @param {string} userId the ID of the user.
 * @returns {Object[]} an array of rules
 */
router.get(
  '/:userId/rules',
  asyncWrapper(async (req, res) => {
    const userId = req.user.userId;
    const rules = await retrieveRulesByUserId(userId);
    res.json(rules);
  })
);

router.post(
  '/:userId/transactions/sync',
  asyncWrapper(async (req, res) => {
    const userId = req.user.userId;

    try {  
      const items = await retrieveItemsByUser(userId);

      await Promise.all(items.map(async (item) => {
        let institution;
        let plaidItemId;
        try {
          ({ plaid_item_id: plaidItemId } = item);
          institution = await getInstitutionById(item.plaid_institution_id);
          const {
            addedCount,
            modifiedCount,
            removedCount,
          } = await updateTransactions(plaidItemId);
          const logMessage = `Bank: ${
            institution.name
          }, Transactions: ${addedCount} added, ${modifiedCount} modified, ${removedCount} removed, ItemId: ${
            item.id
          }`;
          console.log(logMessage);
          req.io.emit('SYNC_HAPPENED', {
            itemId: plaidItemId,
            userId: userId,
            log: logMessage,
          });
        } catch (err) {
          const logMessage = `Bank: ${institution ? institution.name : 'Unknown'}, ItemId: ${
            item.id
          }, Error: ${JSON.stringify(err.response.data)}`;
          console.log(logMessage);
          //console.error(err.response.data);
          req.io.emit('SYNC_ERROR', {
            itemId: plaidItemId,
            userId: item.user_id,
            log: logMessage,
            error: err,
          });
        }
      }));

      res.json({ status: 'ok' });
    } catch (err) {
      console.error(err);
      res.json({ status: 'error' });
    }
    
    console.log('Sync completed. Now update net worth');
    await updateNetWorth(userId);
    console.log('Net worth updated');

    req.io.emit('SYNC_COMPLETED', {
      userId: userId,
      log: 'Full sync completed',
    });
  })
);

/*
router.put(
  '/updateTransactionsByRule/:userId',
  asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const transactions = await retrieveTransactionsByUserId(userId);
    const concurrency = 30; // Concurrency limit
    const batchSize = 100;   // Batch size

    await processWithConcurrencyLimit(transactions, concurrency, batchSize, async (batch) => {
      const updatedTransactions = await Promise.all(batch.map(async (transaction) => {
        let { transactionName: name, category, subcategory } = await applyRulesForCategory(
          transaction.name, transaction.category, transaction.subcategory
        );

        if (name !== transaction.name || category !== transaction.category || subcategory !== transaction.subcategory) {
          transaction.name = name;

          if (transaction.category !== 'Duplicate') {
            transaction.category = category;
          }

          transaction.subcategory = subcategory;
        }

        return transaction;
      }));

      await justUpdateTransactions(updatedTransactions);
    });

    req.io.emit('SYNC_COMPLETED', {
      userId: userId,
      log: 'Rules are applied',
    });

    console.log('done');
    res.json({ status: 'ok' });
  })
);*/

module.exports = router;
