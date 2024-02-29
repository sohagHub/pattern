/**
 * @file Defines all routes for the Users route.
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const { retrieveUserByUsername } = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const { sanitizeUsers, getPasswordHash, verifyPassword } = require('../util');

const router = express.Router();

const { PLAID_SECRET_PRODUCTION } = process.env;

const SECRET_KEY = PLAID_SECRET_PRODUCTION; // Store securely

/**
 * Retrieves user information for a single user.
 *
 * @param {string} username the name of the user.
 * @returns {Object[]} an array containing a single user.
 */
router.post(
  '/',
  asyncWrapper(async (req, res) => {
    const { username, password } = req.body;

    const user = await retrieveUserByUsername(username);
    const passwordMatch = await verifyPassword(password, user.pass_word);
    if (user != null && passwordMatch) {
      const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
        expiresIn: '10m',
      });
      let returnUser = sanitizeUsers(user);
      returnUser[0].token = token;
      res.json(returnUser);
    } else {
      res.json(null);
    }
  })
);

module.exports = router;
