import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
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
  const data = props.monthlyCosts.map(item => ({
    ...item,
    cost: Math.round(item.cost),
  }));

  const COLORS = [
    colors.yellow900,
    colors.red900,
    colors.blue900,
    colors.green900,
    colors.black1000,
    colors.purple600,
  ];

  const handleClick = (data: any, index: number) => {
    const month = data.month;
    props.onMonthClick(month);
  };

  return (
    <div className="costList">
      <h4 className="costHeading">Monthly Costs</h4>
      <BarChart
        width={1000}
        height={300}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="cost" fill={COLORS[0]} onClick={handleClick}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}
