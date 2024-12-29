import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  LabelList,
  CartesianGrid,
} from 'recharts';
import { COLORS, isCostCategory, isIncomeCategory } from '../util';
import colors from 'plaid-threads/scss/colors';
import { useCurrentSelection } from '../services/currentSelection';
import useTransactions from '../services/transactions';

export default function CategoriesChart() {
  const pieChartRef = useRef<HTMLDivElement>(null);
  const { monthlyCategorizedData } = useTransactions();
  const [viewType, setViewType] = useState<'main' | 'subcategory'>('main');

  const {
    selectedMonth,
    selectedCostType,
    selectedCategory,
    selectedSubCategory,
    onCategorySelect,
    onSubCategorySelect,
  } = useCurrentSelection();

  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (pieChartRef.current) {
        setChartWidth(pieChartRef.current.offsetWidth);
      }
    };

    window.addEventListener('resize', updateWidth);
    updateWidth();

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const [chartType, setChartType] = useState<'pie' | 'bar'>('bar');
  const [activeIndex] = useState<number | null>(null);

  // Calculate categories and data
  const { data, totalValue } = useMemo(() => {
    const currentMonthData = monthlyCategorizedData[selectedMonth] || {};
    let total = 0;
    
    interface ChartDataItem {
      name: string;
      value: number;
      id: string;
    }

    let chartData: ChartDataItem[] = [];
    
    const subcategories = currentMonthData[selectedCategory]?.subcategories;
    const hasMultipleSubcategories = subcategories && Object.keys(subcategories).length > 1;
    if (hasMultipleSubcategories) {
      // Show subcategories data
      chartData = Object.entries(subcategories)
        .map(([subcategory, subcategoryData]) => ({
          name: subcategory,
          value: selectedCostType === 'IncomeType' ? Math.abs(subcategoryData.total) : subcategoryData.total,
          id: selectedCategory + ":" + subcategory,
        }));
      total = Object.values(subcategories).reduce((sum, subcategoryData) => sum + subcategoryData.total, 0);
      setViewType('subcategory');
    } else {
      // Show categories data
      chartData = Object.entries(currentMonthData)
        .filter(([category, data]) => {
          if (!isCostCategory(category) && !isIncomeCategory(category)) return false;
          if (selectedCostType === 'IncomeType' && !isIncomeCategory(category)) return false;
          if (selectedCostType === 'SpendingType' && !isCostCategory(category)) return false;
          return true;
        })
        .map(([category, data]) => {
          const value = Math.round(data.total);
          total += value;
          return {
            name: category,
            value: selectedCostType === 'IncomeType' ? Math.abs(value) : value,
            id: category + ":",
          };
        });
      setViewType('main');
    }

    return {
      data: chartData.sort((a, b) => b.value - a.value),
      totalValue: selectedCostType === 'IncomeType' ? Math.abs(total) : total,
    };
  }, [monthlyCategorizedData, selectedMonth, selectedCostType, selectedCategory]);

  const renderLabelNameValue = (entry: { name: string; value: number }) => {
    return `${entry.name} $${entry.value.toLocaleString()}`;
  };

  const renderLabelValue = (entry: { name: string; value: number }) => {
    return `$${entry.value.toLocaleString()}`;
  };

  // Event handler for click events on pie chart segments
  const onChartClick = useCallback(
    (entry: { name: string; value: number, id: string }) => {
      const [category, subcategory] = entry.id.split(":");

      onCategorySelect(category);
      onSubCategorySelect(subcategory);
    },
    [onCategorySelect, onSubCategorySelect]
  );

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = ((value / totalValue) * 100).toFixed(2);
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'white' }}>
          {`${payload[0].payload.name} : $${value.toLocaleString()}`}{' '}
          {`(${percentage}%)`}
        </div>
      );
    }
    return null;
  };

  const handleClick = (data: any) => {
    if (!data) return;
    onChartClick({ name: data.activeLabel, value: 0, id: data.activePayload[0].payload.id });
  };

  useEffect(() => {
    if (data.length === 1 && selectedCategory !== data[0].name) {
      onChartClick(data[0]);
    }
  }, [data, selectedCategory, onChartClick]);

  const chartHeight = 550; // the height of your chart

  return (
    <div className="holdingsListCategories" ref={pieChartRef}>
      <h5 className="holdingsHeading">
        {selectedCostType === 'IncomeType' ? 'Income' : 'Spending'}{' '}
        {viewType === 'main' ? 'Categories' : 'Sub-Categories'}
      </h5>
      <div className="categoryChartButtonDiv">
        <div>
          {selectedMonth}, Total: ${totalValue.toLocaleString()}
          <br />
          <button
            className="switchChartTypeButton"
            onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
          >
            {chartType === 'pie' ? '📊' : '🍕'}
          </button>
        </div>
        <div>
          {selectedCategory && (
            <button
              className="clearSelectionButton"
              onClick={() => {
                onCategorySelect('');
                onSubCategorySelect('');
                setViewType('main');
              }}
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {chartType === 'pie' ? (
        <PieChart width={chartWidth} height={chartHeight}>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            paddingAngle={2}
            label={renderLabelNameValue}
            innerRadius={60}
            outerRadius={160}
            dataKey="value"
            isAnimationActive={true}
          >
            {data
              .sort((a, b) => b.value - a.value)
              .map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={
                    activeIndex === index || entry.name === selectedCategory
                      ? 'black'
                      : 'none'
                  }
                  strokeWidth={
                    activeIndex === index || entry.name === selectedCategory
                      ? 2
                      : 1
                  }
                  onClick={() => onChartClick(entry)}
                />
              ))}
          </Pie>
        </PieChart>
      ) : (
        <BarChart
          width={chartWidth}
          height={chartHeight}
          data={data.sort((a, b) => b.value - a.value)}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          onClick={handleClick}
        >
          <CartesianGrid strokeDasharray="1 1" />
          <XAxis type="number" />
          <YAxis width={30} dataKey="name" type="category" hide={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            barSize={40} // Set a maximum bar size
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke={
                  activeIndex === index || entry.name === selectedCategory || entry.name === selectedSubCategory
                    ? 'black'
                    : 'none'
                }
                strokeWidth={
                  activeIndex === index || entry.name === selectedCategory || entry.name === selectedSubCategory
                    ? 1.5
                    : 1
                }
              />
            ))}

            <LabelList
              dataKey={renderLabelValue}
              position="right"
              fill={colors.black}
            />
          </Bar>
        </BarChart>
      )}
    </div>
  );
}
