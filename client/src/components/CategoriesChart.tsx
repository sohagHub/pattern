import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { COLORS } from '../util';
import colors from 'plaid-threads/scss/colors';
import { useCurrentSelection } from '../services/currentSelection';

interface Props {
  categories: {
    [key: string]: number;
  };
  onCategoryClick: (category: string) => void;
  viewType: string;
}

export default function CategoriesChart(props: Props) {
  const { selectedMonth, selectedCostType } = useCurrentSelection();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const pieChartRef = useRef<HTMLDivElement>(null);

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
  let data: { name: string; value: number }[] = [];
  const labels = Object.keys(props.categories);
  const values = Object.values(props.categories);
  let totalValue = 0;

  for (let i = 0; i < labels.length; i++) {
    if (values[i] <= 0 && selectedCostType !== 'IncomeType') {
      continue;
    }
    const roundedValue = Math.round(values[i]);
    data.push({ name: labels[i], value: roundedValue });
    totalValue += values[i];
  }

  if (selectedCostType === 'IncomeType') {
    // change all data values to positive
    data = data.map(entry => {
      return { name: entry.name, value: Math.abs(entry.value) };
    });
    totalValue = Math.abs(totalValue);
  }
  totalValue = Math.round(totalValue);

  const renderLabelNameValue = (entry: { name: string; value: number }) => {
    //const percentage = ((entry.value / totalValue) * 100).toFixed(2);
    return `${entry.name} $${entry.value.toLocaleString()}`;
  };

  const renderLabelValue = (entry: { name: string; value: number }) => {
    return `$${entry.value.toLocaleString()}`;
  };

  // Event handler for click events on pie chart segments
  const onPieChartClick = useCallback(
    (entry: { name: string; value: number }) => {
      // Perform any action here. For demonstration, we'll just log the clicked segment.
      console.log(
        `Clicked on: ${entry.name} - $${entry.value.toLocaleString()}`
      );
      // Here, you can also use entry data to perform more complex actions,
      // like setting state, showing modal with more details, etc.
      props.onCategoryClick(entry.name);
      setSelectedCategory(entry.name);
    },
    [props, setSelectedCategory]
  );

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    //console.log('CustomTooltip' + active + ' ' + payload);
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
    console.log('handleClick: ' + data);
    onPieChartClick({ name: data.activeLabel, value: 0 });
  };

  useEffect(() => {
    if (data.length === 1 && selectedCategory !== data[0].name) {
      onPieChartClick(data[0]);
    }
  }, [data, selectedCategory, onPieChartClick]);

  const chartHeight = 550; // the height of your chart

  return (
    <div className="holdingsListCategories" ref={pieChartRef}>
      <h5 className="holdingsHeading">
        {selectedCostType === 'IncomeType' ? 'Income' : 'Spending'}{' '}
        {props.viewType === 'main' ? 'Categories' : 'Sub-Categories'}
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
                props.onCategoryClick('');
                setSelectedCategory('');
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
                  onClick={() => onPieChartClick(entry)}
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
                  activeIndex === index || entry.name === selectedCategory
                    ? 'black'
                    : 'none'
                }
                strokeWidth={
                  activeIndex === index || entry.name === selectedCategory
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
