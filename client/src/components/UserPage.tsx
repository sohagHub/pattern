import { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import sortBy from 'lodash/sortBy';
import LoadingSpinner from 'plaid-threads/LoadingSpinner';
import Callout from 'plaid-threads/Callout';
import Button from 'plaid-threads/Button';
import { applyRulesForUser, syncAllForUser } from '../services/api';
import { TransactionsTable } from '.';

import { RouteInfo, ItemType, AccountType, AssetType } from './types';
import {
  useItems,
  useAccounts,
  useTransactions,
  useUsers,
  useAssets,
  useLink,
} from '../services';

import { pluralize } from '../util';

import {
  Banner,
  LaunchLink,
  SpendingInsights,
  NetWorth,
  ItemCard,
  UserCard,
  LoadingCallout,
  ErrorMessage,
} from '.';

// provides view of user's net worth, spending by category and allows them to explore
// account and transactions details for linked items

const UserPage = ({ match }: RouteComponentProps<RouteInfo>) => {
  const [user, setUser] = useState({
    id: 0,
    username: '',
    created_at: '',
    updated_at: '',
    token: '',
  });
  const [items, setItems] = useState<ItemType[]>([]);
  const [token, setToken] = useState('');
  const [numOfItems, setNumOfItems] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [assets, setAssets] = useState<AssetType[]>([]);

  const { transactionsByUser, getTransactionsByUser } = useTransactions();
  const { getAccountsByUser, accountsByUser } = useAccounts();
  const { assetsByUser, getAssetsByUser } = useAssets();
  const { usersById, getUserById } = useUsers();
  const { itemsByUser, getItemsByUser } = useItems();
  const userId = Number(match.params.userId);
  const { generateLinkToken, linkTokens } = useLink();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setSelectedMonth('');
  }, [selectedAccount]);

  const initiateLink = async () => {
    // only generate a link token upon a click from enduser to add a bank;
    // if done earlier, it may expire before enduser actually activates Link to add a bank.
    await generateLinkToken(userId, null);
  };

  const applyRules = async () => {
    // only generate a link token upon a click from enduser to add a bank;
    // if done earlier, it may expire before enduser actually activates Link to add a bank.
    await applyRulesForUser(userId);
  };

  // update data store with user
  useEffect(() => {
    getUserById(userId, false);
  }, [getUserById, userId]);

  // set state user from data store
  useEffect(() => {
    setUser(usersById[userId] || {});
  }, [usersById, userId]);

  useEffect(() => {
    // This gets transactions from the database only.
    // Note that calls to Plaid's transactions/get endpoint are only made in response
    // to receipt of a transactions webhook.
    getTransactionsByUser(userId);
  }, [getTransactionsByUser, userId]);

  useEffect(() => {
    setTransactions(transactionsByUser[userId] || []);
  }, [transactionsByUser, userId]);

  // update data store with the user's assets
  useEffect(() => {
    getAssetsByUser(userId);
  }, [getAssetsByUser, userId]);

  useEffect(() => {
    setAssets(assetsByUser.assets || []);
  }, [assetsByUser, userId]);

  // update data store with the user's items
  useEffect(() => {
    if (userId != null) {
      getItemsByUser(userId, true);
    }
  }, [getItemsByUser, userId]);

  // update state items from data store
  useEffect(() => {
    const newItems: Array<ItemType> = itemsByUser[userId] || [];
    const orderedItems = sortBy(
      newItems,
      item => new Date(item.updated_at)
    ).reverse();
    setItems(orderedItems);
  }, [itemsByUser, userId]);

  // update no of items from data store
  useEffect(() => {
    if (itemsByUser[userId] != null) {
      setNumOfItems(itemsByUser[userId].length);
    } else {
      setNumOfItems(0);
    }
  }, [itemsByUser, userId]);

  // update data store with the user's accounts
  useEffect(() => {
    getAccountsByUser(userId);
  }, [getAccountsByUser, userId]);

  useEffect(() => {
    setAccounts(accountsByUser[userId] || []);
  }, [accountsByUser, userId]);

  useEffect(() => {
    setToken(linkTokens.byUser[userId]);
  }, [linkTokens, userId, numOfItems]);

  const handleSyncClick = async () => {
    try {
      await syncAllForUser(userId); //syncAll();
    } catch (error) {
      console.error('Sync failed', error);
    }
  };

  document.getElementsByTagName('body')[0].style.overflow = 'auto'; // to override overflow:hidden from link pane
  return (
    <div>
      <div>
        <Banner />
        {linkTokens.error.error_code != null && (
          <Callout warning>
            <div>
              Unable to fetch link_token: please make sure your backend server
              is running and that your .env file has been configured correctly.
            </div>
            <div>
              Error Code: <code>{linkTokens.error.error_code}</code>
            </div>
            <div>
              Error Type: <code>{linkTokens.error.error_type}</code>{' '}
            </div>
            <div>Error Message: {linkTokens.error.error_message}</div>
          </Callout>
        )}
      </div>
      <div className="container">
        <div className="left-section">
          <UserCard
            user={user}
            userId={userId}
            removeButton={false}
            linkButton
          />
          <div>
            <>
              {numOfItems > 0 && (
                <>
                  <div className="item__header">
                    <div>
                      <h2 className="item__header-heading">
                        {`${items.length} ${pluralize(
                          'Bank',
                          items.length
                        )} Linked`}{' '}
                        <button
                          className="plus-button"
                          onClick={() => setIsExpanded(!isExpanded)}
                        >
                          {isExpanded ? '- ' : ' + '}
                        </button>
                      </h2>
                    </div>

                    {token != null && token.length > 0 && (
                      <LaunchLink token={token} userId={userId} itemId={null} />
                    )}
                  </div>
                  <ErrorMessage />

                  {isExpanded &&
                    items.map(item => (
                      <div id="itemCards" key={item.id}>
                        <ItemCard
                          item={item}
                          userId={userId}
                          onShowAccountTransactions={setSelectedAccount}
                        />
                      </div>
                    ))}
                </>
              )}
            </>
          </div>
          <div>
            <Button
              large
              inline
              className="add-account-button"
              onClick={handleSyncClick} // Assign the onClick event to handleSyncClick
            >
              Sync
            </Button>
            <Button
              large
              inline
              className="add-account-button"
              onClick={initiateLink}
            >
              Add another bank
            </Button>
            <Button
              large
              inline
              className="add-account-button"
              onClick={applyRules}
            >
              Apply Rules
            </Button>
            <br />
            <Link to="/settings" className="rule-link-button">
              Show Rules
            </Link>
          </div>
        </div>

        <div className="right-section">
          {numOfItems === 0 && <ErrorMessage />}
          {numOfItems > 0 && transactions.length === 0 && (
            <div className="loading">
              <LoadingSpinner />
              <LoadingCallout />
            </div>
          )}
          {numOfItems > 0 && transactions.length > 0 && (
            <>
              <NetWorth
                accounts={accounts}
                numOfItems={numOfItems}
                personalAssets={assets}
                userId={userId}
                assetsOnly={false}
              />
              <SpendingInsights
                numOfItems={numOfItems}
                transactions={transactions}
                onMonthClick={setSelectedMonth}
                selectedMonth={selectedMonth}
              />
            </>
          )}
          {numOfItems === 0 && transactions.length === 0 && assets.length > 0 && (
            <>
              <NetWorth
                accounts={accounts}
                numOfItems={numOfItems}
                personalAssets={assets}
                userId={userId}
                assetsOnly
              />
            </>
          )}
          <div>
            <h2 className="header">Transactions</h2>
            <TransactionsTable
              transactions={transactions}
              filterText={
                selectedAccount
                  ? selectedAccount
                  : selectedMonth
                  ? selectedMonth
                  : ''
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
