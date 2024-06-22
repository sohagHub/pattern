import { useEffect, useMemo, useRef, useState } from 'react';

import { currencyFilter, monthMap } from '../util';
import { CategoriesChart } from '.';
import { TransactionType } from './types';
import MonthlyCostChart from './MonthlyCostChart';
import SelectedCategoryChart from './SelectedCategoryChart';
import { useCurrentSelection } from '../services/currentSelection';

interface Props {
  transactions: TransactionType[];
  numOfItems: number;
  onMonthClick: (month: string) => void;
  onCategoryClick: (category: string) => void;
  onSubCategoryClick: (subCategory: string) => void;
}

interface Categories {
  [key: string]: number;
}

interface SubCategories {
  [key: string]: Categories;
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

interface CategoryCosts {
  [monthYear: string]: {
    [category: string]: {
      total: number;
      subcategories: {
        [subcategory: string]: number;
      };
    };
  };
}

export default function SpendingInsights(props: Props) {
  // grab transactions from most recent month and filter out transfers and payments
  const transactions = props.transactions;
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>(''); // income or spending

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');

  // Use the hook to get access to onCategorySelect
  const {
    selectedMonth: currentSelectedMonth,
    onMonthSelect,
  } = useCurrentSelection();

  useEffect(() => {
    if (currentSelectedMonth) {
      setSelectedMonth(currentSelectedMonth);
      props.onMonthClick(currentSelectedMonth);
      onMonthSelect('');
    }
  }, [currentSelectedMonth, props, onMonthSelect]);

  const onCategoryClick = (category: string) => {
    setSelectedCategory(category);
    props.onCategoryClick(category);
    if (category) {
      props.onMonthClick(selectedMonth);
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
      props.onMonthClick(selectedMonth);
    } else {
      setSelectedCategory('');
      props.onCategoryClick('');
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
      setSelectedMonth(getMonthYear(today));
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
          const aMonthNumber = monthMap[aMonth];
          const bMonthNumber = monthMap[bMonth];
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

  const categoryCosts = useMemo<CategoryCosts>(() => {
    const unsortedCategoryCosts = transactions.reduce(
      (acc: CategoryCosts, tx) => {
        if (!isCostCategory(tx.category)) {
          return acc;
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
  }, [transactions]);

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

  //console.log('lines', lines);

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

  const sortDataByMonthYear = (data: any[]) => {
    return [...data].sort((a, b) => {
      // a and b are like "Jan 2021"
      const aMonth = a.monthYear.split(' ')[0];
      const aYear = a.monthYear.split(' ')[1];
      const bMonth = b.monthYear.split(' ')[0];
      const bYear = b.monthYear.split(' ')[1];
      const aMonthNumber = monthMap[aMonth];
      const bMonthNumber = monthMap[bMonth];
      if (aYear === bYear) {
        return Number(aMonthNumber) - Number(bMonthNumber);
      }
      return Number(aYear) - Number(bYear);
    });
  };

  const sortedData = sortDataByMonthYear(data);

  console.log('sortedData', sortedData);

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
            selectedMonth={selectedMonth}
            selectedType={selectedType}
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
      {console.log('data', sortedData, selectedIndex)}
      {selectedType !== 'IncomeType' && (
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

const getMonthYear = (date: Date) => {
  const month = date.toLocaleString('default', {
    month: 'short',
    timeZone: 'UTC',
  });
  const year = date.getFullYear();
  const monthYear = `${month} ${year}`;
  return monthYear;
};
