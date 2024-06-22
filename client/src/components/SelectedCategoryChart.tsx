import React, { useEffect, useRef, useState } from 'react';
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
import { COLORS } from '../util';
import { useCurrentSelection } from '../services/currentSelection';

interface SelectedCategoryChartProps {
  data: any[];
  lines: string[];
  width?: number;
  indexForColor?: number;
}

const SelectedCategoryChart: React.FC<SelectedCategoryChartProps> = ({
  data,
  lines,
  width = 500,
  indexForColor = -1,
}) => {
  const height = 300;
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

  // Use the hook to get access to onCategorySelect
  const { onMonthSelect } = useCurrentSelection();

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
