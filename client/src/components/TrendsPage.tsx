import { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Modal from 'plaid-threads/Modal';
import sortBy from 'lodash/sortBy';
import { applyRulesForUser, syncAllForUser } from '../services/api';
import { TransactionsTable } from '.';
import { useCurrentUser } from '../services';

import { RouteInfo, ItemType, AccountType, AssetType } from './types';
import {
  useItems,
  useAccounts,
  useTransactions,
  //useUsers,
  useAssets,
  useLink,
} from '../services';

import { Banner, SpendingInsights } from '.';

// provides view of user's net worth, spending by category and allows them to explore
// account and transactions details for linked items

const UserPage = () => {
  const [items, setItems] = useState<ItemType[]>([]);
  const [token, setToken] = useState('');
  const [numOfItems, setNumOfItems] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [assets, setAssets] = useState<AssetType[]>([]);

  const { transactionsByUser, getTransactionsByUser } = useTransactions();
  const { getAccountsByUser, accountsByUser, accountsByItem } = useAccounts();
  const { assetsByUser, getAssetsByUser } = useAssets();
  //const { usersById, getUserById } = useUsers();
  const { itemsByUser, getItemsByUser } = useItems();
  const { userState } = useCurrentUser();
  const userId = Number(userState.currentUser.id);
  const { linkTokens } = useLink();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);



  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAccount('');
  };



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


  const [selectedItem, setSelectedItem] = useState('item1');

  return (
    <div>
      <div>
        <Banner />
      </div>
      <div className="container">
        <div className="left-section">
          <div>
            <ul>
              <li onClick={() => setSelectedItem('item1')}>Item 1</li>
              <li onClick={() => setSelectedItem('item2')}>Item 2</li>
              <li onClick={() => setSelectedItem('item3')}>Item 3</li>
              {/* Add more items as needed */}
            </ul>
          </div>
        </div>

        <div className="right-section">
          {numOfItems > 0 && transactions.length > 0 && (
            <>
              <SpendingInsights
                numOfItems={numOfItems}
                transactions={transactions}
                onMonthClick={setSelectedMonth}
                onCategoryClick={setSelectedCategory}
                onSubCategoryClick={setSelectedSubCategory}
                //selectedMonth={selectedMonth}
              />
            </>
          )}
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
            <Modal
              className="transactions-modal"
              isOpen={isModalOpen}
              onRequestClose={closeModal}
            >
              <TransactionsTable
                transactions={transactions}
                filterText={selectedAccount}
                rows={10}
              />
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
