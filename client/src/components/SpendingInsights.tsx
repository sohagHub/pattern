import { useEffect, useMemo, useRef, useState } from 'react';

import {
  currencyFilter,
  isCostCategory,
  isIncomeCategory,
  getOneMonthTransactions,
  getMonthYear,
} from '../util';
import { CategoriesChart } from '.';
import { TransactionType, Categories } from './types';
import MonthlyCostChart from './MonthlyCostChart';
import SelectedCategoryChart from './SelectedCategoryChart';
import { useCurrentSelection } from '../services/currentSelection';
import useTransactions from '../services/transactions';

export default function SpendingInsights() {
  // grab transactions from most recent month and filter out transfers and payments
  const { allTransactions } = useTransactions();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  useEffect(() => {
    setTransactions(allTransactions);
  }, [allTransactions]);

  //const [selectedMonth, setSelectedMonth] = useState<string>('');
  //const [costType, setCostType] = useState<string>('SpendingType'); // income or spending

  // Use the hook to get access to onCategorySelect
  const {
    selectedMonth,
    onMonthSelect,
    selectedCostType,
    selectedCategory,
    onCategorySelect,
    selectedSubCategory,
    onSubCategorySelect,
  } = useCurrentSelection();

  useEffect(() => {
    if (
      (selectedCostType === 'IncomeType' && isCostCategory(selectedCategory)) ||
      (selectedCostType === 'SpendingType' &&
        isIncomeCategory(selectedCategory))
    ) {
      onCategorySelect('');
      onSubCategorySelect('');
    }
  }, [
    selectedCostType,
    selectedCategory,
    selectedSubCategory,
    onCategorySelect,
    onSubCategorySelect,
  ]);

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
        selectedCostType
      );
    } else {
      result = getOneMonthTransactions(
        transactions,
        date => getMonthYear(date) === getMonthYear(today),
        selectedCostType
      );
      //setSelectedMonth(getMonthYear(today));
      onMonthSelect(getMonthYear(today));
      if (result.length <= 0 && transactions.length > 0) {
        result = getOneMonthTransactions(
          transactions,
          date => getMonthYear(date) === getMonthYear(oneMonthAgo),
          selectedCostType
        );
        //setSelectedMonth(getMonthYear(oneMonthAgo));
        onMonthSelect(getMonthYear(oneMonthAgo));
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedCostType, transactions]);

  const namesObject = useMemo((): Categories => {
    return monthlyTransactions.reduce((obj: Categories, tx) => {
      if (selectedCategory && tx.category !== selectedCategory) {
        return obj;
      }

      if (selectedSubCategory && tx.subcategory !== selectedSubCategory) {
        return obj;
      }

      tx.name in obj
        ? (obj[tx.name] = tx.amount + obj[tx.name])
        : (obj[tx.name] = tx.amount);
      return obj;
    }, {});
  }, [monthlyTransactions, selectedCategory, selectedSubCategory]);

  // sort names by spending totals
  const sortedNames = useMemo(() => {
    // if selectedType is IncomeType, convert all values to positive
    if (selectedCostType === 'IncomeType') {
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
  }, [namesObject, selectedCostType]);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <MonthlyCostChart width={width} />
          </div>
        )}
      </div>
      <div className="monthlySpendingContainer">
        <div className="userDataBoxPieChart">
          <CategoriesChart />
        </div>
        <div className="userDataBoxVendor">
          <div className="holdingsListVendor">
            <h5 className="holdingsHeading">
              {selectedCostType === 'IncomeType' ? 'Income' : 'Spending'}{' '}
              Sources
            </h5>
            <div className="spendingInsightData">
              <p className="title">Source</p> <p className="title">Amount</p>
              {sortedNames
                .filter((vendor: any[]) => Number(vendor[1]) !== 0)
                .map((vendor: any[]) => (
                  <>
                    <div>{vendor[0]}</div>
                    <div>{currencyFilter(vendor[1])}</div>
                  </>
                ))}
            </div>
          </div>
        </div>
      </div>
      {selectedCostType !== 'IncomeType1' && (
        <div className="userDataBoxBarChart">
          <SelectedCategoryChart width={width} indexForColor={0} />
        </div>
      )}
    </div>
  );
}
