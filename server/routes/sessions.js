/**
 * @file Defines all routes for the Users route.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { retrieveUserByUsername, retrieveUserById } = require('../db/queries');
const { asyncWrapper } = require('../middleware');
const { sanitizeUsers, verifyPassword } = require('../util');

const router = express.Router();

const { PLAID_SECRET_PRODUCTION } = process.env;

const SECRET_KEY = PLAID_SECRET_PRODUCTION; // Store securely
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY ? process.env.REFRESH_SECRET_KEY: SECRET_KEY; // Store securely

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

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await verifyPassword(password, user.pass_word);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    handleAuthentication(res, user);
  })
);

router.post(
  '/refresh_token',
  asyncWrapper(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
    } catch (e) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = await retrieveUserById(payload.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    handleAuthentication(res, user);
  })
);

const handleAuthentication = (res, user) => {
  generateAndSetToken(res, 'token', user, SECRET_KEY, '10m');
  generateAndSetToken(res, 'refreshToken', user, REFRESH_SECRET_KEY, '2d');

  let returnUser = sanitizeUsers(user);
  res.json(returnUser);
}

const generateAndSetToken = (res, name, user, secret, expiresIn) => {
  const token = generateToken({ userId: user.id }, secret, expiresIn);
  setCookie(res, name, token);
}

const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
}

const setCookie = (res, name, value) => { 
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    path: '/',
  });
}

module.exports = router;
