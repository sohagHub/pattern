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
        width={1000}
        height={350}
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        
        onClick={handleClick}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="cost"
          fill={COLORS[4]}
          
          isAnimationActive={true}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <LabelList dataKey="costString" position="top" fill={COLORS[5]} />
        </Bar>
      </BarChart>
    </div>
  );
}
