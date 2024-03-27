import { useMemo, useState } from 'react';

import { currencyFilter } from '../util';
import { CategoriesChart } from '.';
import { TransactionType } from './types';
import MonthlyCostChart from './MonthlyCostChart';

interface Props {
  transactions: TransactionType[];
  numOfItems: number;
  onMonthClick: (month: string) => void;
  onCategoryClick: (category: string) => void;
}

interface Categories {
  [key: string]: number;
}

// Function to check if a transaction category is excluded
const isCostCategory = (category: string): boolean => {
  const excludedCategories = [
    'Payment',
    'Transfer',
    'Interest',
    'Income',
    'Investment',
    'Duplicate',
  ];
  return !excludedCategories.includes(category);
};

type MonthMap = { [key: string]: string };

// Mapping of month names to month numbers
const months: MonthMap = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
};

export default function SpendingInsights(props: Props) {
  // grab transactions from most recent month and filter out transfers and payments
  const transactions = props.transactions;
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const onCategoryClick = (category: string) => {
    setSelectedCategory(category);
    props.onCategoryClick(category);
    if (category) {
      props.onMonthClick(selectedMonth);
    } else {
      props.onMonthClick('');
    }
  };

  const getOneMonthTransactions = (
    transactions: TransactionType[],
    targetMonthYear: string
  ): TransactionType[] => {
    return transactions.filter(tx => {
      const date = new Date(tx.date);
      const monthYear = getMonthYear(date);
      return isCostCategory(tx.category) && monthYear === targetMonthYear;
    });
  };

  const monthlyTransactions = useMemo(() => {
    const today = new Date();
    const oneMonthAgo = new Date(
      new Date().setMonth(new Date().getMonth() - 1)
    );
    let result;
    if (selectedMonth) {
      result = getOneMonthTransactions(transactions, selectedMonth);
    } else {
      result = getOneMonthTransactions(transactions, getMonthYear(today));
      if (result.length <= 0) {
        result = getOneMonthTransactions(
          transactions,
          getMonthYear(oneMonthAgo)
        );
        setSelectedMonth(getMonthYear(oneMonthAgo));
      } else {
        setSelectedMonth(getMonthYear(today));
      }
    }
    return result;
  }, [selectedMonth, transactions]);

  const monthlyCosts = useMemo(
    () =>
      // calculate monthly total cost by month from transactions
      // and send as as monthlyCosts: {
      //   month: string;
      //   cost: number;
      // }[]; to MonthlyCostChart
      transactions.reduce((acc: any[], tx) => {
        if (!isCostCategory(tx.category)) {
          return acc;
        }
        const date = new Date(tx.date);
        const monthYear = getMonthYear(date);
        const index = acc.findIndex(item => item.month === monthYear);
        if (index === -1) {
          acc.push({ month: monthYear, cost: tx.amount });
        } else {
          acc[index].cost = acc[index].cost + tx.amount;
        }

        // sort the acc by year and month
        acc.sort((a, b) => {
          // a and b are like "Jan 2021"
          const aMonth = a.month.split(' ')[0];
          const aYear = a.month.split(' ')[1];
          const bMonth = b.month.split(' ')[0];
          const bYear = b.month.split(' ')[1];
          const aMonthNumber = months[aMonth];
          const bMonthNumber = months[bMonth];
          if (aYear === bYear) {
            return Number(aMonthNumber) - Number(bMonthNumber);
          }
          return aYear - bYear;
        });
        console.log('acc', acc);
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
      if (selectedCategory && tx.category !== selectedCategory) {
        return obj;
      }

      tx.name in obj
        ? (obj[tx.name] = tx.amount + obj[tx.name])
        : (obj[tx.name] = tx.amount);
      return obj;
    }, {});
  }, [monthlyTransactions, selectedCategory]);

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

  const onMonthClickSetMonth = (month: string) => {
    props.onMonthClick(month);
    setSelectedMonth(month);
  };

  return (
    <div>
      <h2 className="monthlySpendingHeading">Monthly Spending</h2>
      <div className="monthlySpendingContainer">
        <div className="userDataBoxBarChart">
          <MonthlyCostChart
            monthlyCosts={monthlyCosts}
            onMonthClick={onMonthClickSetMonth}
          />
        </div>
      </div>
      <div className="monthlySpendingContainer">
        <div className="userDataBoxPieChart">
          <CategoriesChart
            categories={categoriesObject}
            selectedMonth={selectedMonth}
            onCategoryClick={onCategoryClick}
          />
        </div>
        <div className="userDataBoxVendor">
          <div className="holdingsList">
            <h4 className="holdingsHeading">Vendors</h4>
            <div className="spendingInsightData">
              <p className="title">Vendor</p> <p className="title">Amount</p>
              {sortedNames
                .filter((vendor: any[]) => Number(vendor[1]) > 0)
                .map((vendor: any[], index) => (
                  <>
                    <div>{vendor[0]}</div>
                    <div>{currencyFilter(vendor[1])}</div>
                  </>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const getMonthYear = (date: Date) => {
  const month = date.toLocaleString('default', {
    month: 'short',
    timeZone: 'UTC',
  });
  const year = date.getFullYear();
  const monthYear = `${month} ${year}`;
  return monthYear;
};
