import React, { useState, useEffect, useCallback, useRef } from 'react';
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

interface Props {
  monthlyCosts: {
    month: string;
    cost: number;
    income: number;
  }[];
  onMonthClick: (month: string, type: string) => void;
  width: number;
}

export default function MonthlyCostChart(props: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
      }
    };

    window.addEventListener('resize', updateWidth);
    updateWidth();

    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const [showIncome, setShowIncome] = useState(false);
  const [showSpending, setShowSpending] = useState(true);

  const toggleIncome = () => {
    setShowIncome(!showIncome);
    // if both are false, set spending to true
    if (showIncome && !showSpending) {
      setShowSpending(true);
    }
  };

  const toggleSpending = () => {
    setShowSpending(!showSpending);
    // if both are false, set spending to true
    if (!showIncome && showSpending) {
      setShowSpending(true);
    }
  };

  const widthCalculation = useCallback(() => {
    console.log('window.innerWidth', window.innerWidth, props.width);
    if (props.width === 0) {
      return 1100;
    } else {
      return props.width * 0.95;
    }
  }, [props.width]);

  useEffect(() => {
    const handleResize = () => setChartWidth(widthCalculation());

    window.addEventListener('resize', handleResize);

    // Clean up the event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, [props.width, chartWidth, widthCalculation]);

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0].payload) {
      const value = payload[0].payload;
      return (
        <div className="custom-tooltip">
          {value.month}
          {showIncome && <br />}
          {showIncome && `Income: ${value.incomeString}`}
          <br />
          Spending: {value.costString}
        </div>
      );
    }
    return null;
  };

  const data = props.monthlyCosts.map(item => ({
    ...item,
    spending: Math.round(item.cost),
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
    <div ref={chartContainerRef} className="holdingsListMonthlyCost">
      <div className="totalTrendsTop">
        <h5 className="costHeading">
          Monthly {showIncome && 'Income'} {showIncome && showSpending && '&'}{' '}
          {showSpending && 'Spending'}
        </h5>
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
            <input
              type="checkbox"
              checked={showSpending}
              onChange={toggleSpending}
            />{' '}
            Spending
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
        <Tooltip content={<CustomTooltip />} />
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
        {showSpending && (
          <Bar
            dataKey="spending"
            isAnimationActive={true}
            onClick={onCostBarClick}
          >
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
        )}
      </BarChart>
    </div>
  );
}
