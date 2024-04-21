import { useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { TransactionsTable } from '.';
import { useCurrentUser } from '../services';

import { RouteInfo } from './types';
import { useTransactions } from '../services';

import { Banner } from '.';

const TransactionPage = ({ match }: RouteComponentProps<RouteInfo>) => {
  const [transactions, setTransactions] = useState([]);
  const { transactionsByUser, getTransactionsByUser } = useTransactions();
  const { userState } = useCurrentUser();
  const userId = Number(userState.currentUser.id);

  useEffect(() => {
    getTransactionsByUser(userId);
  }, [getTransactionsByUser, userId]);

  useEffect(() => {
    setTransactions(transactionsByUser[userId] || []);
  }, [transactionsByUser, userId]);

  return (
    <div>
      <div>
        <Banner />
      </div>
      <div >
        <div>
          <div>
            <h4 className="transaction-header">
              <strong>Transactions</strong>
            </h4>
            <TransactionsTable transactions={transactions} filterText={''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionPage;
