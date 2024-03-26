import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts';
import colors from 'plaid-threads/scss/colors';

interface Props {
  monthlyCosts: {
    month: string;
    cost: number;
  }[];
  onMonthClick: (month: string) => void;
}

export default function MonthlyCostChart(props: Props) {
  const widthCalculation = () =>
    window.innerWidth < 1000 ? window.innerWidth - 70 : 1000;

  const [chartWidth, setChartWidth] = useState(widthCalculation());

  useEffect(() => {
    const handleResize = () => setChartWidth(widthCalculation());

    window.addEventListener('resize', handleResize);

    // Clean up the event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const data = props.monthlyCosts.map(item => ({
    ...item,
    cost: Math.round(item.cost),
    costString: `$${Math.round(item.cost).toLocaleString()}`,
  }));

  const COLORS = [
    colors.yellow900,
    colors.red900,
    colors.blue900,
    colors.green900,
    colors.black1000,
    colors.purple600,
  ];

  const handleClick = (data: any) => {
    const month = data.activeLabel;
    props.onMonthClick(month);
  };

  return (
    <div className="costList">
      <h4 className="costHeading">Monthly Costs</h4>
      <BarChart
        width={chartWidth}
        height={300}
        data={data}
        margin={{
          top: 20,
          right: 20,
          left: 20,
          bottom: 10,
        }}
        onClick={handleClick}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="cost" fill={COLORS[4]} isAnimationActive={true}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          {chartWidth > 500 && (
            <LabelList dataKey="costString" position="top" fill={COLORS[5]} />
          )}
        </Bar>
      </BarChart>
    </div>
  );
}
