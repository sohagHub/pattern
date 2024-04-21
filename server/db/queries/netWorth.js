const { retrieveAccountsByUserId } = require('./accounts');
const db = require('../');

/*
CREATE TABLE IF NOT EXISTS financial_snapshots
(
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users_table(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_assets NUMERIC(28, 10),
  total_liabilities NUMERIC(28, 10),
  net_worth NUMERIC(28, 10),
  UNIQUE (user_id, snapshot_date)
); 
 */

const updateNetWorth = async userId => {
  // read all accounts and use the current balances to calculate financial snapshot
  const accounts = await retrieveAccountsByUserId(userId);

  // if the account type is depository or investment then asset, else liability
  let totalAssets = 0;
  let totalLiabilities = 0;
  for (const account of accounts) {
    if (account.type === 'depository' || account.type === 'investment') {
      totalAssets += account.current_balance;
    } else {
      totalLiabilities += account.current_balance;
    }
  }

  // insert the snapshot into the database
  const query = {
    text: `
      INSERT INTO financial_snapshots
        (user_id, snapshot_date, total_assets, total_liabilities, net_worth)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING
        *
    `,
    values: [
      userId,
      new Date(),
      totalAssets,
      totalLiabilities,
      totalAssets - totalLiabilities,
    ],
  };

  const { rows } = await db.query(query);
  return rows[0];
};

module.exports = {
  updateNetWorth,
};
