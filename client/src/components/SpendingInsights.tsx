import React, { useMemo, useState } from 'react';

import { currencyFilter, pluralize } from '../util';
import { CategoriesChart } from '.';
import { TransactionType } from './types';
import { Bar } from 'recharts';
import MonthlyCostChart from './MonthlyCost';

interface Props {
  transactions: TransactionType[];
  numOfItems: number;
}

interface Categories {
  [key: string]: number;
}

export default function SpendingInsights(props: Props) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // grab transactions from most recent month and filter out transfers and payments
  const transactions = props.transactions;
  const monthlyTransactions = useMemo(
    () =>
      transactions.filter(tx => {
        const date = new Date(tx.date);
        const today = new Date();
        const oneMonthAgo = new Date(new Date().setDate(today.getDate() - 30));
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthYear = `${month} ${year}`;
        return (
          tx.category !== 'Payment' &&
          tx.category !== 'Transfer' &&
          tx.category !== 'Interest' &&
          tx.category !== 'Income' &&
          (selectedMonth ? monthYear === selectedMonth : date > oneMonthAgo)
        );
      }),
    [selectedMonth, transactions]
  );

  const monthlyCosts = useMemo(
    () =>
      // calculate monthly total cost by month from transactions
      // and send as as monthlyCosts: {
      //   month: string;
      //   cost: number;
      // }[]; to MonthlyCostChart
      transactions.reduce((acc: any[], tx) => {
        if (
          tx.category === 'Payment' ||
          tx.category === 'Transfer' ||
          tx.category === 'Interest' ||
          tx.category === 'Income'
        )
          return acc;
        const date = new Date(tx.date);
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthYear = `${month} ${year}`;
        const index = acc.findIndex(item => item.month === monthYear);
        if (index === -1) {
          acc.push({ month: monthYear, cost: tx.amount });
        } else {
          acc[index].cost = acc[index].cost + tx.amount;
        }
        return acc;
      }, []),

    [transactions]
  );

  // create category and name objects from transactions
  const categoriesObject = useMemo((): Categories => {
    return monthlyTransactions.reduce((obj: Categories, tx) => {
      tx.category in obj
        ? (obj[tx.category] = tx.amount + obj[tx.category])
        : (obj[tx.category] = tx.amount);
      return obj;
    }, {});
  }, [monthlyTransactions]);

  const namesObject = useMemo((): Categories => {
    return monthlyTransactions.reduce((obj: Categories, tx) => {
      tx.name in obj
        ? (obj[tx.name] = tx.amount + obj[tx.name])
        : (obj[tx.name] = tx.amount);
      return obj;
    }, {});
  }, [monthlyTransactions]);

  // sort names by spending totals
  const sortedNames = useMemo(() => {
    const namesArray = [];
    for (const name in namesObject) {
      namesArray.push([name, namesObject[name]]);
    }
    namesArray.sort((a: any[], b: any[]) => b[1] - a[1]);
    //namesArray.splice(5); // top 5
    return namesArray;
  }, [namesObject]);

  return (
    <div>
      <h2 className="monthlySpendingHeading">Monthly Spending</h2>
      <div className="monthlySpendingContainer">
        <div className="userDataBox">
          <CategoriesChart categories={categoriesObject} />
        </div>
        <div className="userDataBox">
          <div className="holdingsList">
            <h4 className="holdingsHeading">Vendors</h4>
            <div className="spendingInsightData">
              <p className="title">Vendor</p> <p className="title">Amount</p>
              {sortedNames.map((vendor: any[]) => (
                <>
                  <div>{vendor[0]}</div>
                  <div>{currencyFilter(vendor[1])}</div>
                </>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="monthlySpendingContainer">
        <div className="userDataBoxBarChart">
          <MonthlyCostChart
            monthlyCosts={monthlyCosts}
            onMonthClick={setSelectedMonth}
          />
        </div>
      </div>
    </div>
  );
}
