import { useEffect, useMemo, useRef, useState } from 'react';

import {
  currencyFilter,
  monthMap,
  sortByMonthYear,
  isCostCategory,
  isIncomeCategory,
  getOneMonthTransactions,
  getMonthYear,
} from '../util';
import { CategoriesChart } from '.';
import {
  TransactionType,
  Categories,
  SubCategories,
  CategoryCosts,
} from './types';
import MonthlyCostChart from './MonthlyCostChart';
import SelectedCategoryChart from './SelectedCategoryChart';
import { useCurrentSelection } from '../services/currentSelection';
import useTransactions from '../services/transactions';
import { on } from 'events';
import { set } from 'lodash';

interface Props {
  numOfItems: number;
  onMonthClick: (month: string) => void;
  onCategoryClick: (category: string) => void;
  onSubCategoryClick: (subCategory: string) => void;
}

export default function SpendingInsights(props: Props) {
  // grab transactions from most recent month and filter out transfers and payments
  const { allTransactions } = useTransactions();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  useEffect(() => {
    setTransactions(allTransactions);
  }, [allTransactions]);

  //const [selectedMonth, setSelectedMonth] = useState<string>('');
  //const [costType, setCostType] = useState<string>('SpendingType'); // income or spending

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  // Use the hook to get access to onCategorySelect
  const {
    selectedMonth,
    onMonthSelect,
    selectedCostType,
  } = useCurrentSelection();

  useEffect(() => {
    if (selectedMonth) {
      props.onMonthClick(selectedMonth);
    }
  }, [selectedMonth, props, onMonthSelect]);

  useEffect(() => {
    if (
      (selectedCostType === 'IncomeType' && isCostCategory(selectedCategory)) ||
      (selectedCostType === 'SpendingType' && isIncomeCategory(selectedCategory))
    ) {
      props.onCategoryClick('');
      props.onSubCategoryClick('');
      setSelectedCategory('');
      setSelectedSubCategory('');
    }
  }, [selectedCostType, props, selectedCategory]);

  const onCategoryClick = (category: string) => {
    setSelectedCategory(category);
    props.onCategoryClick(category);
    if (category) {
      props.onMonthClick(selectedMonth || '');
    } else {
      props.onMonthClick('');
      setSelectedSubCategory('');
      props.onSubCategoryClick('');
    }
  };

  const onSubCategoryClick = (category: string) => {
    setSelectedSubCategory(category);
    props.onSubCategoryClick(category);
    if (category) {
      props.onMonthClick(selectedMonth || '');
    } else {
      setSelectedCategory('');
      props.onCategoryClick('');
      props.onMonthClick('');
    }
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
      props.onMonthClick(getMonthYear(today));
      if (result.length <= 0) {
        result = getOneMonthTransactions(
          transactions,
          date => getMonthYear(date) === getMonthYear(oneMonthAgo),
          selectedCostType
        );
        //setSelectedMonth(getMonthYear(oneMonthAgo));
        onMonthSelect(getMonthYear(oneMonthAgo));
        props.onMonthClick(getMonthYear(oneMonthAgo));
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedCostType, transactions]);

  const categoryCosts = useMemo<CategoryCosts>(() => {
    const unsortedCategoryCosts = transactions.reduce(
      (acc: CategoryCosts, tx) => {
        if (!isCostCategory(tx.category) && !isIncomeCategory(tx.category)) {
          return acc;
        }
        if (
          selectedCostType === 'IncomeType' &&
          !isIncomeCategory(tx.category)
        ) {
          return acc;
        }
        if (
          selectedCostType === 'SpendingType' &&
          !isCostCategory(tx.category)
        ) {
          return acc;
        }
        if (!selectedCostType && !isCostCategory(tx.category)) {
          return acc;
        }

        if (isIncomeCategory(tx.category)) {
          tx.amount = -tx.amount;
        }

        const date = new Date(tx.date);
        const monthYear = getMonthYear(date);

        if (!acc[monthYear]) {
          acc[monthYear] = {};
        }

        if (!acc[monthYear][tx.category]) {
          acc[monthYear][tx.category] = { total: 0, subcategories: {} };
        }

        acc[monthYear][tx.category].total += tx.amount;

        if (tx.subcategory) {
          if (!acc[monthYear][tx.category].subcategories[tx.subcategory]) {
            acc[monthYear][tx.category].subcategories[tx.subcategory] = 0;
          }

          acc[monthYear][tx.category].subcategories[tx.subcategory] +=
            tx.amount;
        }

        return acc;
      },
      {}
    );
    const sortedEntries = Object.entries(unsortedCategoryCosts).sort((a, b) => {
      const aMonth = a[0].split(' ')[0];
      const aYear = a[0].split(' ')[1];
      const bMonth = b[0].split(' ')[0];
      const bYear = b[0].split(' ')[1];
      const aMonthNumber = monthMap[aMonth];
      const bMonthNumber = monthMap[bMonth];
      if (aYear === bYear) {
        return Number(aMonthNumber) - Number(bMonthNumber);
      }
      return Number(aYear) - Number(bYear);
    });

    return Object.fromEntries(sortedEntries);
  }, [selectedCostType, transactions]);

  // create category and name objects from transactions
  const categoriesObject = useMemo((): Categories => {
    const unsortedCategories = monthlyTransactions.reduce(
      (obj: Categories, tx) => {
        tx.category in obj
          ? (obj[tx.category] = tx.amount + obj[tx.category])
          : (obj[tx.category] = tx.amount);
        return obj;
      },
      {}
    );

    return Object.entries(unsortedCategories)
      .sort((a, b) => b[1] - a[1])
      .reduce(
        (obj: Record<string, number>, [key, value]) => {
          obj[key] = value;
          return obj;
        },
        {} as Record<string, number>
      );
  }, [monthlyTransactions]);

  const subcategoriesObject = useMemo((): SubCategories => {
    const newSubcategoriesObject: SubCategories = {};

    monthlyTransactions.forEach((tx: TransactionType) => {
      if (!newSubcategoriesObject[tx.category]) {
        newSubcategoriesObject[tx.category] = {};
      }

      if (tx.subcategory in newSubcategoriesObject[tx.category]) {
        newSubcategoriesObject[tx.category][tx.subcategory] += tx.amount;
      } else {
        newSubcategoriesObject[tx.category][tx.subcategory] = tx.amount;
      }
    });

    const sortedSubcategoriesObject: SubCategories = {};

    Object.entries(newSubcategoriesObject).forEach(
      ([category, subcategories]) => {
        sortedSubcategoriesObject[category] = Object.entries(subcategories)
          .sort((a, b) => b[1] - a[1])
          .reduce(
            (obj: Record<string, number>, [key, value]) => {
              obj[key] = value;
              return obj;
            },
            {} as Record<string, number>
          );
      }
    );

    return sortedSubcategoriesObject;
  }, [monthlyTransactions]);

  const selectedIndex = useMemo(() => {
    if (
      selectedSubCategory &&
      selectedCategory &&
      subcategoriesObject[selectedCategory]
    ) {
      return Object.keys(subcategoriesObject[selectedCategory]).indexOf(
        selectedSubCategory
      );
    }
    if (selectedCategory) {
      return Object.keys(categoriesObject).indexOf(selectedCategory);
    }
    return -1;
  }, [
    categoriesObject,
    subcategoriesObject,
    selectedCategory,
    selectedSubCategory,
  ]);

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

  const hasAtLeastTwoSubcategories = () => {
    return (
      subcategoriesObject &&
      subcategoriesObject[selectedCategory] &&
      Object.keys(subcategoriesObject[selectedCategory]).length >= 2
    );
  };

  const lines = selectedCategory
    ? selectedSubCategory
      ? [selectedSubCategory]
      : [selectedCategory] //Array.from(new Set(Object.keys(categoryCosts).flatMap(monthYear => Object.keys(categoryCosts[monthYear][selectedCategory]?.subcategories || {})))))
    : Array.from(
        new Set(
          Object.keys(categoryCosts).flatMap(monthYear =>
            Object.keys(categoryCosts[monthYear])
          )
        )
      ).sort();

  type MonthData = { monthYear: string; [key: string]: number | string };

  const data: MonthData[] = Object.keys(categoryCosts).map(monthYear => {
    const monthData: MonthData = { monthYear };

    Object.entries(categoryCosts[monthYear]).forEach(
      ([category, categoryData]) => {
        // Add category total
        monthData[category] = Math.round(categoryData.total);

        // Add subcategory totals
        Object.entries(categoryData.subcategories || {}).forEach(
          ([subCategory, subCategoryTotal]) => {
            monthData[`${subCategory}`] = Math.round(subCategoryTotal);
          }
        );
      }
    );

    return monthData;
  });

  const sortedData = data.sort(sortByMonthYear);

  console.log('sortedData', sortedData);

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
          {console.log(
            'selectedCategory: ',
            selectedCategory,
            Object.keys(subcategoriesObject)
          )}
          <CategoriesChart
            categories={
              selectedCategory && hasAtLeastTwoSubcategories()
                ? subcategoriesObject[selectedCategory]
                : categoriesObject
            }
            selectedMonth={selectedMonth || ''}
            selectedType={selectedCostType}
            onCategoryClick={
              selectedCategory && hasAtLeastTwoSubcategories()
                ? onSubCategoryClick
                : onCategoryClick
            }
            viewType={
              selectedCategory && hasAtLeastTwoSubcategories()
                ? 'subcategory'
                : 'main'
            }
          />
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
      {console.log('data', sortedData, selectedIndex)}
      {selectedCostType !== 'IncomeType1' && (
        <div className="userDataBoxBarChart">
          <SelectedCategoryChart
            data={sortedData}
            lines={lines}
            width={width}
            indexForColor={selectedIndex}
          />
        </div>
      )}
    </div>
  );
}
