import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LabelList,
} from 'recharts';
import {
  COLORS,
  getMonthYear,
  isCostCategory,
  isIncomeCategory,
  sortByMonthYear,
} from '../util';
import { useCurrentSelection } from '../services/currentSelection';
import useTransactions from '../services/transactions';
import { CategoryCosts } from './types';

interface SelectedCategoryChartProps {
  width?: number;
  indexForColor?: number;
}

const SelectedCategoryChart: React.FC<SelectedCategoryChartProps> = ({
  width = 500,
  indexForColor = -1,
}) => {
  const height = 300;
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

  const { allTransactions } = useTransactions();
  const {
    selectedMonth,
    selectedCategory,
    selectedSubCategory,
    selectedCostType,
    onMonthSelect,
  } = useCurrentSelection();

  const { data, lines } = useMemo(() => {
    const categoryCosts = allTransactions.reduce((acc: CategoryCosts, tx) => {
      if (!isCostCategory(tx.category) && !isIncomeCategory(tx.category)) {
        return acc;
      }
      if (selectedCostType === 'IncomeType' && !isIncomeCategory(tx.category)) {
        return acc;
      }
      if (selectedCostType === 'SpendingType' && !isCostCategory(tx.category)) {
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

        acc[monthYear][tx.category].subcategories[tx.subcategory] += tx.amount;
      }

      return acc;
    }, {});

    let lines;
    if (selectedCategory) {
      lines = selectedSubCategory ? [selectedSubCategory] : [selectedCategory];
    } else {
      lines = Array.from(
        new Set(
          Object.keys(categoryCosts).flatMap(monthYear =>
            Object.keys(categoryCosts[monthYear])
          )
        )
      ).sort();
    }

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

    return {
      data: data.sort(sortByMonthYear).slice(-12),
      lines,
    };
  }, [
    allTransactions,
    selectedCategory,
    selectedCostType,
    selectedSubCategory,
  ]);

  const toggleChartType = () => {
    setChartType(prevType => (prevType === 'line' ? 'bar' : 'line'));
  };

  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chartRef.current &&
        !chartRef.current.contains(event.target as Node)
      ) {
        setActiveLine(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onChartClick = (event: { activePayload: any[] }) => {
    if (event && event.activePayload && event.activePayload.length > 0) {
      const xDataKey = event.activePayload[0].payload.monthYear;
      console.log(xDataKey); // This will log the X-axis data key of the clicked bar
      onMonthSelect(xDataKey);
    }
  };

  return (
    <div className="holdingsListCategories" ref={chartRef}>
      <h5 className="holdingsHeading">Category trend</h5>
      <div style={{ position: 'relative' }}>
        <button
          onClick={toggleChartType}
          style={{ position: 'absolute', top: 0, right: 0 }}
        >
          Switch to {chartType === 'bar' ? 'line' : 'bar'} Chart
        </button>
      </div>
      <br />
      <div>
        {chartType === 'line' ? (
          <LineChart width={width * 0.95} height={height} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthYear" />
            <YAxis />
            <Tooltip contentStyle={{ fontWeight: 'bold' }} />
            <Legend onClick={e => setActiveLine(e.dataKey)} />
            {lines.map((line, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={line}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={line === activeLine ? 3 : 1} // Highlight the active line by increasing its stroke width
              />
            ))}
          </LineChart>
        ) : (
          <BarChart
            width={width * 0.95}
            height={height}
            data={data}
            onClick={onChartClick}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthYear" />
            <YAxis />
            <Tooltip contentStyle={{ fontWeight: 'bold' }} />
            <Legend onClick={e => setActiveLine(e.dataKey)} />
            {lines.map((line, index) => {
              const colorIndex =
                (indexForColor < 0 ? index : indexForColor) % COLORS.length;
              const isActiveLine = line === activeLine;
              const fillColor =
                isActiveLine || !activeLine
                  ? COLORS[colorIndex]
                  : 'rgba(0, 0, 0, 0.2)'; // Change this to the color you want for non-active bars

              return (
                <Bar key={index} dataKey={line} fill={fillColor}>
                  {lines.length === 1 && (
                    <LabelList dataKey={line} position="top" />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        )}
      </div>
    </div>
  );
};

export default SelectedCategoryChart;
