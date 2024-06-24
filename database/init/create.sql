-- This trigger updates the value in the updated_at column. It is used in the tables below to log
-- when a row was last updated.

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- USERS
-- This table is used to store the users of our application. The view returns the same data as the
-- table, we're just creating it to follow the pattern used in other tables.

CREATE TABLE users_table
(
  id SERIAL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER users_updated_at_timestamp
BEFORE UPDATE ON users_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW users
AS
  SELECT
    id,
    username,
    created_at,
    updated_at
  FROM
    users_table;


-- ITEMS
-- This table is used to store the items associated with each user. The view returns the same data
-- as the table, we're just using both to maintain consistency with our other tables. For more info
-- on the Plaid Item schema, see the docs page: https://plaid.com/docs/#item-schema

CREATE TABLE items_table
(
  id SERIAL PRIMARY KEY,
  user_id integer REFERENCES users_table(id) ON DELETE CASCADE,
  plaid_access_token text UNIQUE NOT NULL,
  plaid_item_id text UNIQUE NOT NULL,
  plaid_institution_id text NOT NULL,
  status text NOT NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  transactions_cursor text
);

CREATE TRIGGER items_updated_at_timestamp
BEFORE UPDATE ON items_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW items
AS
  SELECT
    id,
    plaid_item_id,
    user_id,
    plaid_access_token,
    plaid_institution_id,
    status,
    created_at,
    updated_at,
    transactions_cursor
  FROM
    items_table;


-- -- ASSETS
-- -- This table is used to store the assets associated with each user. The view returns the same data
-- -- as the table, we're just using both to maintain consistency with our other tables.

CREATE TABLE assets_table
(
  id SERIAL PRIMARY KEY,
  user_id integer REFERENCES users_table(id) ON DELETE CASCADE,
  value numeric(28,2),
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER assets_updated_at_timestamp
BEFORE UPDATE ON assets_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW assets
AS
  SELECT
    id,
    user_id,
    value,
    description,
    created_at,
    updated_at
  FROM
    assets_table;




-- ACCOUNTS
-- This table is used to store the accounts associated with each item. The view returns all the
-- data from the accounts table and some data from the items view. For more info on the Plaid
-- Accounts schema, see the docs page:  https://plaid.com/docs/#account-schema

CREATE TABLE accounts_table
(
  id SERIAL PRIMARY KEY,
  item_id integer REFERENCES items_table(id) ON DELETE CASCADE,
  plaid_account_id text UNIQUE NOT NULL,
  name text NOT NULL,
  mask text NOT NULL,
  official_name text,
  current_balance numeric(28,10),
  available_balance numeric(28,10),
  iso_currency_code text,
  unofficial_currency_code text,
  type text NOT NULL,
  subtype text NOT NULL,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER accounts_updated_at_timestamp
BEFORE UPDATE ON accounts_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW accounts
AS
  SELECT
    a.id,
    a.plaid_account_id,
    a.item_id,
    i.plaid_item_id,
    i.user_id,
    a.name,
    a.mask,
    a.official_name,
    a.current_balance,
    a.available_balance,
    a.iso_currency_code,
    a.unofficial_currency_code,
    a.type,
    a.subtype,
    a.created_at,
    a.updated_at
  FROM
    accounts_table a
    LEFT JOIN items i ON i.id = a.item_id;


-- TRANSACTIONS
-- This table is used to store the transactions associated with each account. The view returns all
-- the data from the transactions table and some data from the accounts view. For more info on the
-- Plaid Transactions schema, see the docs page: https://plaid.com/docs/#transaction-schema

CREATE TABLE transactions_table
(
  id SERIAL PRIMARY KEY,
  account_id integer REFERENCES accounts_table(id) ON DELETE CASCADE,
  plaid_transaction_id text UNIQUE NOT NULL,
  plaid_category_id text,
  category text,
  subcategory text,
  type text NOT NULL,
  name text NOT NULL,
  amount numeric(28,10) NOT NULL,
  iso_currency_code text,
  unofficial_currency_code text,
  date date NOT NULL,
  pending boolean NOT NULL,
  account_owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER transactions_updated_at_timestamp
BEFORE UPDATE ON transactions_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE VIEW transactions
AS
  SELECT
    t.id,
    t.plaid_transaction_id,
    t.account_id,
    a.plaid_account_id,
    a.item_id,
    a.plaid_item_id,
    a.user_id,
    t.category,
    t.subcategory,
    t.type,
    t.name,
    t.amount,
    t.iso_currency_code,
    t.unofficial_currency_code,
    t.date,
    t.pending,
    t.account_owner,
    t.created_at,
    t.updated_at
  FROM
    transactions_table t
    LEFT JOIN accounts a ON t.account_id = a.id;


-- The link_events_table is used to log responses from the Plaid API for client requests to the
-- Plaid Link client. This information is useful for troubleshooting.

CREATE TABLE link_events_table
(
  id SERIAL PRIMARY KEY,
  type text NOT NULL,
  user_id integer,
  link_session_id text,
  request_id text UNIQUE,
  error_type text,
  error_code text,
  status text,
  created_at timestamptz default now()
);


-- The plaid_api_events_table is used to log responses from the Plaid API for server requests to
-- the Plaid client. This information is useful for troubleshooting.

CREATE TABLE plaid_api_events_table
(
  id SERIAL PRIMARY KEY,
  item_id integer,
  user_id integer,
  plaid_method text NOT NULL,
  arguments text,
  request_id text UNIQUE,
  error_type text,
  error_code text,
  created_at timestamptz default now()
);


ALTER TABLE transactions_table ADD COLUMN manually_updated BOOLEAN DEFAULT false;


ALTER TABLE transactions_table ADD column original_category text default null;
ALTER TABLE transactions_table ADD column original_subcategory text default null;
ALTER TABLE transactions_table ADD column original_name text default null;

CREATE TABLE transaction_rules_table
(
  id SERIAL PRIMARY KEY,
  user_id integer,
  serial integer,
  name text,
  category text,
  subcategory text,
  new_name text,
  new_category text,
  new_subcategory text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER transaction_rules_updated_at_timestamp
BEFORE UPDATE ON transaction_rules_table
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

ALTER TABLE items_table ADD COLUMN is_prod BOOLEAN DEFAULT false;

CREATE OR REPLACE VIEW public.items AS
SELECT items_table.id,
  items_table.plaid_item_id,
  items_table.user_id,
  items_table.plaid_access_token,
  items_table.plaid_institution_id,
  items_table.status,
  items_table.created_at,
  items_table.updated_at,
  items_table.transactions_cursor,
  items_table.is_prod
FROM items_table;


ALTER TABLE items_table ADD COLUMN is_archived BOOLEAN DEFAULT false;

CREATE OR REPLACE VIEW public.items AS
SELECT items_table.id,
  items_table.plaid_item_id,
  items_table.user_id,
  items_table.plaid_access_token,
  items_table.plaid_institution_id,
  items_table.status,
  items_table.created_at,
  items_table.updated_at,
  items_table.transactions_cursor,
  items_table.is_prod,
  items_table.is_archived
FROM items_table;


ALTER TABLE users_table ADD column pass_word text default null;

CREATE OR REPLACE VIEW users AS
SELECT id,
  username,
  created_at,
  updated_at,
  pass_word
FROM users_table;


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


CREATE OR REPLACE FUNCTION update_financial_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  thirty_days_ago DATE;
BEGIN
  thirty_days_ago := CURRENT_DATE - INTERVAL '30 days';

  -- Insert new snapshot or update existing snapshot for today
  IF (NEW.snapshot_date = CURRENT_DATE) THEN
    IF EXISTS (SELECT 1 FROM financial_snapshots WHERE user_id = NEW.user_id AND snapshot_date = CURRENT_DATE) THEN
      -- Update existing snapshot for today
      UPDATE financial_snapshots
      SET total_assets = NEW.total_assets, total_liabilities = NEW.total_liabilities, net_worth = NEW.net_worth
      WHERE user_id = NEW.user_id AND snapshot_date = CURRENT_DATE;
      RETURN NULL; -- Prevent insertion of a new row
    END IF;
  END IF;

  -- Perform cleanup for entries beyond 30 days
  -- First, find the date of the last snapshot of each month for snapshots older than 30 days
  -- Then, delete all other snapshots that are not these last snapshots and are older than 30 days
  DELETE FROM financial_snapshots
  WHERE user_id = NEW.user_id AND snapshot_date < thirty_days_ago
    AND snapshot_date NOT IN (
      SELECT MAX(snapshot_date)
      FROM financial_snapshots
      WHERE user_id = NEW.user_id 
        AND snapshot_date < thirty_days_ago
      GROUP BY DATE_TRUNC('month', snapshot_date)
    );

  -- Allow the insertion of the new row if not already inserted/updated for today
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger (if it's already created, first drop it as below)
DROP TRIGGER IF EXISTS trg_update_snapshot ON financial_snapshots;
CREATE TRIGGER trg_update_snapshot
BEFORE INSERT ON financial_snapshots
FOR EACH ROW EXECUTE FUNCTION update_financial_snapshot();



CREATE TABLE IF NOT EXISTS public.account_balance_history_table (
  id SERIAL PRIMARY KEY,
  account_id INT NOT NULL REFERENCES public.accounts_table(id) ON DELETE CASCADE,
  balance_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_balance NUMERIC(28, 10),
  available_balance NUMERIC(28, 10),
  -- Include if tracking of available balance is also needed
  UNIQUE (account_id, balance_date)
);
CREATE OR REPLACE FUNCTION fn_capture_balance_change() RETURNS TRIGGER AS $$
DECLARE latest_snapshot RECORD;
BEGIN -- Retrieve the most recent snapshot for comparison
SELECT current_balance,
  available_balance INTO latest_snapshot
FROM public.account_balance_history_table
WHERE account_id = NEW.id
ORDER BY balance_date DESC
LIMIT 1;
-- Check if there is a need to create a new snapshot
IF latest_snapshot IS NULL
OR NEW.current_balance IS DISTINCT
FROM latest_snapshot.current_balance
  OR NEW.available_balance IS DISTINCT
FROM latest_snapshot.available_balance THEN -- Insert snapshot into account_balance_history_table
INSERT INTO public.account_balance_history_table (
    account_id,
    balance_date,
    current_balance,
    available_balance
  )
VALUES (
    NEW.id,
    NOW(),
    NEW.current_balance,
    NEW.available_balance
  );
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_capture_balance_update ON public.accounts_table;
-- Remove old trigger if it exists
CREATE TRIGGER trg_capture_balance_update
AFTER
UPDATE ON public.accounts_table FOR EACH ROW EXECUTE FUNCTION fn_capture_balance_change();


ALTER TABLE public.items_table ADD institution_name varchar NULL;

ALTER TABLE public.accounts_table ADD is_closed boolean NULL DEFAULT false;

ALTER TABLE public.transactions_table ADD mark_delete boolean NULL DEFAULT false;

-- public.transactions source
CREATE OR REPLACE VIEW public.transactions AS
SELECT t.id,
  t.plaid_transaction_id,
  t.account_id,
  a.plaid_account_id,
  a.item_id,
  a.plaid_item_id,
  a.user_id,
  t.category,
  t.subcategory,
  t.type,
  t.name,
  t.amount,
  t.iso_currency_code,
  t.unofficial_currency_code,
  t.date,
  t.pending,
  t.account_owner,
  t.created_at,
  t.updated_at,
  a.name AS account_name
FROM transactions_table t
  LEFT JOIN accounts a ON t.account_id = a.id
where t.mark_delete is not TRUE;