import React, { useState } from 'react';
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

interface LineChartProps {
  data: any[];
  lines: string[];
  width?: number;
}

const LineChartComponent: React.FC<LineChartProps> = ({
  data,
  lines,
  width = 500,
}) => {
  const height = 300;
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('bar');

  const toggleChartType = () => {
    setChartType(prevType => (prevType === 'area' ? 'bar' : 'area'));
  };

  // Get all unique categories
  const allCategories = Array.from(new Set(data.flatMap(Object.keys)));
  console.log(allCategories);

  // Ensure each data object has all categories
  const processedData = data.map(obj => {
    const newObj = { ...obj };
    allCategories.forEach(category => {
      if (!(category in newObj)) {
        newObj[category] = 0;
      }
    });
    return newObj;
  });
  //console.log('processedData', processedData);

  return (
    <div>
      <div style={{ position: 'relative' }}>
        <button
          onClick={toggleChartType}
          style={{ position: 'absolute', top: 0, right: 0 }}
        >
          Switch to {chartType === 'bar' ? 'area' : 'bar'} Chart
        </button>
      </div>
      <br />
      <div>
        {chartType === 'line' ? (
          <LineChart width={width * 0.95} height={height} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthYear" />
            <YAxis />
            <Tooltip />
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
        ) : chartType === 'area' ? (
          <AreaChart width={width * 0.95} height={height} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthYear" />
            <YAxis />
            <Tooltip />
            <Legend onClick={e => setActiveLine(e.dataKey)} />
            {lines.map((line, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey={line}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={line === activeLine ? 3 : 1} // Highlight the active line by increasing its stroke width
              />
            ))}
          </AreaChart>
        ) : (
          <BarChart width={width * 0.95} height={height} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthYear" />
            <YAxis />
            <Tooltip />
            <Legend onClick={e => setActiveLine(e.dataKey)} />
            {lines.map((line, index) => (
              <Bar
                key={index}
                dataKey={line}
                fill={COLORS[index % COLORS.length]}
              >
                {lines.length === 1 && (
                  <LabelList dataKey={line} position="top" />
                )}
              </Bar>
            ))}
          </BarChart>
        )}
      </div>
    </div>
  );
};

export default LineChartComponent;
