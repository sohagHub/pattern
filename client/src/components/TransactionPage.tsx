import { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import Modal from 'plaid-threads/Modal';
import sortBy from 'lodash/sortBy';
import LoadingSpinner from 'plaid-threads/LoadingSpinner';
import Callout from 'plaid-threads/Callout';
import Button from 'plaid-threads/Button';
import { applyRulesForUser, syncAllForUser } from '../services/api';
import { TransactionsTable } from '.';
import { useCurrentUser } from '../services';

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

const TransactionPage = ({ match }: RouteComponentProps<RouteInfo>) => {
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
  const { getAccountsByUser, accountsByUser, accountsByItem } = useAccounts();
  const { assetsByUser, getAssetsByUser } = useAssets();
  const { usersById, getUserById } = useUsers();
  const { itemsByUser, getItemsByUser } = useItems();
  const { userState } = useCurrentUser();
  const userId = Number(userState.currentUser.id);
  const { generateLinkToken, linkTokens } = useLink();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
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

  useEffect(() => {
    // Assuming accountsByUser[userId] contains all accounts for the user
    const newItems: ItemType[] = itemsByUser[userId] || [];

    // Calculate total balance for each item
    newItems.forEach(item => {
      const itemAccounts = accountsByItem[item.id] || [];
      const totalBalance = itemAccounts.reduce((acc, account) => {
        if (account.type === 'credit' || account.type === 'loan') {
          return acc - (account.current_balance || 0);
        } else {
          //if (account.type === 'depository') {
          return acc + (account.current_balance || 0);
        }
      }, 0);
      item.total = totalBalance; // Assign total balance to the item
    });

    // Sort items based on total balance
    const orderedItems = newItems.sort((a, b) => a.total! - b.total!);

    setItems(orderedItems);
  }, [accountsByItem, itemsByUser, userId]);

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
      <div >
        <div>
          <div>
            <h4 className="transaction-header">
              <strong>Transactions</strong>
            </h4>
            <TransactionsTable
              transactions={transactions}
              filterText={
                (selectedMonth ? "'" + selectedMonth + "'" : '') +
                ' ' +
                (selectedAccount ? "'" + selectedAccount + "'" : '') +
                ' ' +
                (selectedCategory ? "'category:" + selectedCategory + "'" : '')
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
