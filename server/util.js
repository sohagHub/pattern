const isArray = require('lodash/isArray');
const pick = require('lodash/pick');
const plaid = require('./plaid');
const NodeCache = require('node-cache');
const bcrypt = require('bcrypt');

// Create a new cache instance
const myCache = new NodeCache({ stdTTL: 60 * 60 * 4, checkperiod: 60 * 60 * 4 });

/**
 * Wraps input in an array if needed.
 *
 * @param {*} input the data to be wrapped in array if needed.
 * @returns {*[]} an array based on the input.
 */
const toArray = input => (isArray(input) ? [...input] : [input]);

/**
 * Returns an array of objects that have only the given keys present.
 *
 * @param {(Object|Object[])} input a single object or an array of objects.
 * @param {string[]} keysToKeep the keys to keep in the sanitized objects.
 */
const sanitizeWith = (input, keysToKeep) =>
  toArray(input).map(obj => pick(obj, keysToKeep));

/**
 * Returns an array of sanitized accounts.
 *
 * @param {(Object|Object[])} accounts a single account or an array of accounts.
 */
const sanitizeAccounts = accounts =>
  sanitizeWith(accounts, [
    'id',
    'item_id',
    'user_id',
    'name',
    'mask',
    'official_name',
    'current_balance',
    'available_balance',
    'iso_currency_code',
    'unofficial_currency_code',
    'type',
    'subtype',
    'created_at',
    'updated_at',
  ]);

/**
 * Returns an array of sanitized items.
 *
 * @param {(Object|Object[])} items a single item or an array of items.
 */
const sanitizeItems = items =>
  sanitizeWith(items, [
    'id',
    'user_id',
    'plaid_institution_id',
    'status',
    'created_at',
    'updated_at',
    'is_archived'
  ]);

/**
 * Returns an array of sanitized users.
 *
 * @param {(Object|Object[])} users a single user or an array of users.
 */
const sanitizeUsers = users =>
  sanitizeWith(users, ['id', 'username', 'created_at', 'updated_at']);

/**
 * Returns an array of transactions
 *
 * @param {(Object|Object[])} transactions a single transaction of an array of transactions.
 */
const sanitizeTransactions = transactions =>
  sanitizeWith(transactions, [
    'id',
    'account_id',
    'item_id',
    'user_id',
    'name',
    'type',
    'date',
    'category',
    'subcategory',
    'amount',
    'created_at',
    'updated_at',
    'account_name',
    'original_name',
  ]);

const validItemStatuses = new Set(['good', 'bad']);
const isValidItemStatus = status => validItemStatuses.has(status);

/**
 * Fetches a single institution from the Plaid API by ID.
 *
 * @param {string} instId The ins_id of the institution to be returned.
 * @returns {Object[]} an array containing a single institution.
 */
const getInstitutionById = async (instId) => {
  const request = {
    institution_id: instId,
    country_codes: ['US'],
    options: {
      include_optional_metadata: true,
    },
  };
  try {
    if (myCache.has(instId)) {
      return myCache.get(instId);
    }
    const response = await plaid.institutionsGetById(request);
    const institution = response.data.institution;
    myCache.set(instId, institution);
    return institution;
  } catch (error) {
    console.error(error);
    // Handle error
  }
};


// pasword hashing and verification
const saltRounds = 10;

const getPasswordHash = async password => {
  const hash = await bcrypt.hash(password, saltRounds);
  return hash; // The hash includes both the salt and the hashed password
};

const verifyPassword = async (passwordAttempt, storedHash) => {
  const match = await bcrypt.compare(passwordAttempt, storedHash);
  return match; // true if the password matches, false otherwise
};

// Helper function to process tasks with limited concurrency and batch size
async function processWithConcurrencyLimit(tasks, concurrency, batchSize, taskFn) {
  const batches = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    batches.push(tasks.slice(i, i + batchSize));
  }

  const results = [];
  const executing = [];

  for (const batch of batches) {
    const p = taskFn(batch);
    results.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }

    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);
  }

  return Promise.all(results);
}

module.exports = {
  toArray,
  sanitizeAccounts,
  sanitizeItems,
  sanitizeUsers,
  sanitizeTransactions,
  validItemStatuses,
  isValidItemStatus,
  getInstitutionById,
  myCache,
  getPasswordHash,
  verifyPassword,
  processWithConcurrencyLimit,
};
