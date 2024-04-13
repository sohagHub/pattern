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
import { COLORS } from '../util';
import colors from 'plaid-threads/scss/colors';
import { set } from 'lodash';

interface Props {
  monthlyCosts: {
    month: string;
    cost: number;
    income: number;
  }[];
  onMonthClick: (month: string, type: string) => void;
}

export default function MonthlyCostChart(props: Props) {
  const [showIncome, setShowIncome] = useState(false);
  const toggleIncome = () => {
    setShowIncome(!showIncome);
  };

  const widthCalculation = () =>
    window.innerWidth < 1000 ? window.innerWidth - 70 : 1100;

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
    income: Math.round(item.income),
    costString: `-$${Math.round(item.cost).toLocaleString()}`,
    incomeString: `$${Math.round(item.income).toLocaleString()}`,
  }));

  const onIncomeBarClick = (data: any, index: any, event: any) => {
    const month = data.month;
    props.onMonthClick(month, 'IncomeType');
    event.stopPropagation();
  };

  const onCostBarClick = (data: any, index: any, event: any) => {
    const month = data.month;
    props.onMonthClick(month, '');
    event.stopPropagation();
  };

  const onBarClick = (data: any, index: any, event: any) => {
    if (data == null) return;
    const month = data.activeLabel;
    props.onMonthClick(month, '');
  };

  return (
    <div className="holdingsListMonthlyCost">
      <div className="totalTrendsTop">
        <h4 className="costHeading"> </h4>
        <div>
          <label>
            <input
              type="checkbox"
              checked={showIncome}
              onChange={toggleIncome}
            />{' '}
            Income
          </label>
          <label>
            <input type="checkbox" checked={true} /> Spending
          </label>
        </div>
      </div>

      <BarChart
        width={chartWidth}
        height={300}
        data={data}
        margin={{
          top: 20,
          right: 20,
          left: 5,
          bottom: 10,
        }}
        onClick={onBarClick}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        {showIncome && (
          <Bar
            dataKey="income"
            isAnimationActive={true}
            onClick={onIncomeBarClick}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[(index % 4) + 5]} />
            ))}
            {chartWidth > 900 && (
              <LabelList
                dataKey="incomeString"
                position="outside"
                angle={-90}
                fill={colors.black800}
              />
            )}
          </Bar>
        )}
        <Bar dataKey="cost" isAnimationActive={true} onClick={onCostBarClick}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % 4]} />
          ))}
          {chartWidth > 900 && (
            <LabelList
              dataKey="costString"
              position="outside"
              angle={-90}
              fill={colors.black900}
            />
          )}
        </Bar>
      </BarChart>
    </div>
  );
}
