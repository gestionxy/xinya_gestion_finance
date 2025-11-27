import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { WeeklySummary } from '../../types';
import { CustomTooltip } from '../ChartTooltip';

interface Props {
  data: WeeklySummary[];
  departments: string[];
  selectedMonth: string;
}

const COLORS = [
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316", "#eab308", "#84cc16"
];

export const WeeklyDeptChart: React.FC<Props> = ({ data, departments, selectedMonth }) => {
  const chartData = useMemo(() => {
    return data.map(item => {
      const flatItem: any = { week: item.weekRange, weekStart: item.weekStart };
      departments.forEach(dept => {
        flatItem[dept] = item.byDepartment[dept] || 0;
      });
      return flatItem;
    });
  }, [data, departments]);

  return (
    <div className="h-[450px] w-full">
       <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="week" 
            stroke="#94a3b8" 
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} 
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#94a3b8" 
            tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {departments.map((dept, index) => (
            <Line
              key={dept}
              type="monotone"
              dataKey={dept}
              name={dept}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};