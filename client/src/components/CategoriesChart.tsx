import React, { useEffect, useRef, useState } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, Bar, BarChart, XAxis, YAxis, LabelList } from 'recharts';
import colors from 'plaid-threads/scss/colors';

interface Props {
  categories: {
    [key: string]: number;
  };
  selectedMonth: string;
  onCategoryClick: (category: string) => void;
}

export default function CategoriesChart(props: Props) {
  const widthCalculation = () => window.innerWidth < 1000 ? window.innerWidth - 100 : 500;
  const [chartWidth, setChartWidth] = useState(widthCalculation());

  useEffect(() => {
    const handleResize = () =>
      setChartWidth(widthCalculation());

    window.addEventListener('resize', handleResize);

    // Clean up the event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const data = [];
  const labels = Object.keys(props.categories);
  const values = Object.values(props.categories);
  let totalValue = 0;

  for (let i = 0; i < labels.length; i++) {
    if (values[i] <= 0) {
      continue;
    }
    const roundedValue = Math.round(values[i]);
    data.push({ name: labels[i], value: roundedValue });
    totalValue += roundedValue;
  }

  const COLORS = [
    colors.yellow900,
    colors.red900,
    colors.blue900,
    colors.green900,
    colors.black1000,
    colors.purple600,
  ];

  const renderLabel = (entry: { name: string; value: number }) => {
    return `$${entry.value.toLocaleString()}`;
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Event handler for click events on pie chart segments
  const onPieChartClick = (entry: { name: string; value: number }) => {
    // Perform any action here. For demonstration, we'll just log the clicked segment.
    console.log(`Clicked on: ${entry.name} - $${entry.value.toLocaleString()}`);
    // Here, you can also use entry data to perform more complex actions,
    // like setting state, showing modal with more details, etc.
    props.onCategoryClick(entry.name);
  };

  const pieChartRef = useRef(null);

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    console.log('CustomTooltip' + active + ' ' + payload);
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const percentage = (value / totalValue * 100).toFixed(2);
      return (
        <div className="custom-tooltip" style={{"backgroundColor": 'white'}}>
          {`${payload[0].payload.name} : $${value.toLocaleString()}`} {`(${percentage}%)`}
        </div>
      );
  }

  return null;
};

  useEffect(() => {
    const handleClickOutside = (event: { target: any }) => {
      console.log('handleClickOutside');

      if (
        pieChartRef.current &&
        // eslint-disable-next-line prettier/prettier
        !(pieChartRef.current as any)?.contains(event.target as Node)
      ) {
        console.log('You clicked outside of the pie chart!');
        props.onCategoryClick('');
      }
    };

    // Add the event listener when the component mounts
    document.addEventListener('mousedown', handleClickOutside);

    // Remove the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [props]);

  const chartHeight = 400; // the height of your chart
  //const chartWidth = 500; // the width of your chart
  const barHeight = chartHeight / data.length; // the height of the bars
  
  return (
    <div className="holdingsList" ref={pieChartRef}>
      <h4 className="holdingsHeading">Spending Categories</h4>
      <div>{props.selectedMonth}</div>
      <div>Total: ${totalValue.toLocaleString()}</div>
      <button onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}>
        Switch to {chartType === 'pie' ? 'Bar Chart' : 'Pie Chart'}
      </button>
      {chartType === 'pie' ? (
        <PieChart width={chartWidth} height={chartHeight}>
          <Legend />
          <Tooltip content={<CustomTooltip/>}/>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            paddingAngle={5}
            label={renderLabel}
            innerRadius={0}
            outerRadius={130}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            isAnimationActive={true}
          >
            {data
              .sort((a, b) => b.value - a.value)
              .map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={activeIndex === index ? 'black' : 'none'}
                  strokeWidth={activeIndex === index ? 2 : 1}
                  onClick={() => onPieChartClick(entry)}
                />
              ))}
          </Pie>
        </PieChart>
      ) : (
          <BarChart width={chartWidth} height={chartHeight} data={data.sort((a, b) => b.value - a.value)} layout="vertical" margin={{ top: 5, right: 50, left: 50, bottom: 5 }}>
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" onMouseEnter={onPieEnter} onMouseLeave={onPieLeave}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={activeIndex === index ? 'black' : 'none'}
                  strokeWidth={activeIndex === index ? 2 : 1}
                  onClick={() => onPieChartClick(entry)}
                />
              ))}
              <LabelList dataKey={ renderLabel} position="right" />
            </Bar>
            {data.map((entry, index) => (
              <rect
                x={0}
                y={index * 40} // adjust this value based on your bar width and gap
                width={chartWidth} // adjust this value based on your chart width
                height={barHeight} // adjust this value based on your bar width
                fill="transparent"
                onClick={() => onPieChartClick(entry)}
              />
            ))}
          </BarChart>
      )}
    </div>
  );
}
