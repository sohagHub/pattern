import React, { useEffect, useRef, useState } from 'react';
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

interface Props {
  categories: {
    [key: string]: number;
  };
  selectedMonth: string;
  selectedType: string;
  onCategoryClick: (category: string) => void;
  viewType: string;
}

export default function CategoriesChart(props: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const widthCalculation = () =>
    window.innerWidth < 1000 ? window.innerWidth - 100 : 600;
  const [chartWidth, setChartWidth] = useState(widthCalculation());

  useEffect(() => {
    const handleResize = () => setChartWidth(widthCalculation());

    window.addEventListener('resize', handleResize);

    // Clean up the event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [activeIndex] = useState<number | null>(null);
  let data = [];
  const labels = Object.keys(props.categories);
  const values = Object.values(props.categories);
  let totalValue = 0;

  for (let i = 0; i < labels.length; i++) {
    if (values[i] <= 0 && props.selectedType !== 'IncomeType') {
      continue;
    }
    const roundedValue = Math.round(values[i]);
    data.push({ name: labels[i], value: roundedValue });
    totalValue += values[i];
  }

  if (props.selectedType === 'IncomeType') {
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
  const onPieChartClick = (entry: { name: string; value: number }) => {
    // Perform any action here. For demonstration, we'll just log the clicked segment.
    console.log(`Clicked on: ${entry.name} - $${entry.value.toLocaleString()}`);
    // Here, you can also use entry data to perform more complex actions,
    // like setting state, showing modal with more details, etc.
    props.onCategoryClick(entry.name);
    setSelectedCategory(entry.name);
  };

  const pieChartRef = useRef(null);

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
    console.log('handleClick: ' + data);
    onPieChartClick({ name: data.activeLabel, value: 0 });
  };

  const chartHeight = 500; // the height of your chart

  return (
    <div className="holdingsListCategories" ref={pieChartRef}>
      <h5 className="holdingsHeading">
        {props.selectedType === 'IncomeType' ? 'Income' : 'Spending'}{' '}
        {props.viewType === 'main' ? 'Categories' : 'Sub-Categories'}
      </h5>
      <div className="categoryChartButtonDiv">
        <div>
          {props.selectedMonth}, Total: ${totalValue.toLocaleString()}
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
            paddingAngle={5}
            label={renderLabelNameValue}
            innerRadius={0}
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
          <YAxis dataKey="name" type="category" hide={true} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            //onMouseEnter={onPieEnter}
            //onMouseLeave={onPieLeave}
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

            <LabelList dataKey="name" position="right" fill={colors.black} />
            <LabelList
              dataKey={renderLabelValue}
              position="left"
              fill={colors.black}
            />
          </Bar>
        </BarChart>
      )}
    </div>
  );
}
