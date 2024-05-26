import { useEffect, useMemo, useRef, useState } from 'react';

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

const isIncomeCategory = (category: string): boolean => {
  const includedCategory = ['Interest', 'Income'];
  return includedCategory.includes(category);
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
  const [selectedType, setSelectedType] = useState<string>('');

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

  type DateMatcher = (date: Date) => boolean;

  const getOneMonthTransactions = (
    transactions: TransactionType[],
    dateMatcher: DateMatcher,
    type: string
  ): TransactionType[] => {
    return transactions.filter(tx => {
      const date = new Date(tx.date);

      if (type === 'IncomeType') {
        return isIncomeCategory(tx.category) && dateMatcher(date);
      }

      return isCostCategory(tx.category) && dateMatcher(date);
    });
  };

  const monthlyTransactions = useMemo(() => {
    const today = new Date();
    const oneMonthAgo = new Date(
      new Date().setMonth(new Date().getMonth() - 1)
    );
    let result;
    if (selectedMonth) {
      result = getOneMonthTransactions(
        transactions,
        date => getMonthYear(date) === selectedMonth,
        selectedType
      );
    } else {
      result = getOneMonthTransactions(
        transactions,
        date => getMonthYear(date) === getMonthYear(today),
        selectedType
      );
      if (result.length <= 0) {
        result = getOneMonthTransactions(
          transactions,
          date => getMonthYear(date) === getMonthYear(oneMonthAgo),
          selectedType
        );
        setSelectedMonth(getMonthYear(oneMonthAgo));
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedType, transactions]);

  const monthlyCosts = useMemo(
    () =>
      // calculate monthly total cost by month from transactions
      // and send as as monthlyCosts: {
      //   month: string;
      //   cost: number;
      // }[]; to MonthlyCostChart
      transactions.reduce((acc: any[], tx) => {
        if (!isCostCategory(tx.category) && !isIncomeCategory(tx.category)) {
          return acc;
        }

        const cost = isCostCategory(tx.category) ? tx.amount : 0;
        const income = isIncomeCategory(tx.category) ? tx.amount : 0;

        const date = new Date(tx.date);
        const monthYear = getMonthYear(date);
        const index = acc.findIndex(item => item.month === monthYear);

        if (index === -1) {
          acc.push({ month: monthYear, cost: cost, income: -income });
        } else {
          acc[index].cost = acc[index].cost + cost;
          acc[index].income = acc[index].income - income;
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
        //console.log('acc', acc);
        return acc;
      }, []),

    [transactions]
  );

  // create category and name objects from transactions
  const categoriesObject = useMemo((): Categories => {
    //console.log('monthlyTransactions', monthlyTransactions);
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
    // if selectedType is IncomeType, convert all values to positive
    if (selectedType === 'IncomeType') {
      for (const name in namesObject) {
        namesObject[name] = Math.abs(namesObject[name]);
      }
    }

    const namesArray = [];
    for (const name in namesObject) {
      namesArray.push([name, namesObject[name]]);
    }
    namesArray.sort((a: any[], b: any[]) => b[1] - a[1]);
    //namesArray.splice(5); // top 5
    return namesArray;
  }, [namesObject, selectedType]);

  const onMonthClickSetMonth = (month: string, type: string) => {
    props.onMonthClick(month);
    setSelectedMonth(month);
    setSelectedType(type);
  };

  const [width, setWidth] = useState(0);
  const spendingContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spendingContainerRef.current) {
      setWidth(spendingContainerRef.current.offsetWidth);
      console.log(
        'spendingContainerRef.current.offsetWidth',
        spendingContainerRef.current.offsetWidth
      );
    }

    const resizeObserver = new ResizeObserver(entries => {
      if (!Array.isArray(entries) || !entries.length) {
        return;
      }
      setWidth(entries[0].contentRect.width);
      console.log('entries[0].contentRect.width', entries[0].contentRect.width);
    });

    if (spendingContainerRef.current) {
      resizeObserver.observe(spendingContainerRef.current);
    }

    return () => {
      if (spendingContainerRef.current) {
        resizeObserver.unobserve(spendingContainerRef.current);
      }
    };
  }, []); // Dependency array remains empty if no props/state affect sizing

  return (
    <div>
      <h4 className="monthlySpendingHeading">
        <strong>Trends</strong>
      </h4>
      <div ref={spendingContainerRef} className="monthlySpendingContainer">
        {width > 0 && (
          <div className="userDataBoxBarChart">
            <MonthlyCostChart
              monthlyCosts={monthlyCosts}
              onMonthClick={onMonthClickSetMonth}
              width={width}
            />
          </div>
        )}
      </div>
      <div className="monthlySpendingContainer">
        <div className="userDataBoxPieChart">
          <CategoriesChart
            categories={categoriesObject}
            selectedMonth={selectedMonth}
            selectedType={selectedType}
            onCategoryClick={onCategoryClick}
          />
        </div>
        <div className="userDataBoxVendor">
          <div className="holdingsList">
            <h5 className="holdingsHeading">
              {selectedType === 'IncomeType' ? 'Income' : 'Spending'} Sources
            </h5>
            <div className="spendingInsightData">
              <p className="title">Source</p> <p className="title">Amount</p>
              {sortedNames
                .filter((vendor: any[]) => Number(vendor[1]) !== 0)
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
