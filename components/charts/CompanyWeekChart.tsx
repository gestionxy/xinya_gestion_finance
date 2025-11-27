import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { WeeklySummary } from '../../types';
import { CustomTooltip } from '../ChartTooltip';

interface Props {
  data: WeeklySummary[];
  department: string;
}

const COLORS = [
  "#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#fb7185", "#2dd4bf", "#4ade80", "#facc15"
];

export const CompanyWeekChart: React.FC<Props> = ({ data, department }) => {
  
  // Extract all unique companies involved in this view for coloring
  const companies = useMemo(() => {
    const s = new Set<string>();
    data.forEach(d => {
        if(d.byCompany) Object.keys(d.byCompany).forEach(k => s.add(k));
    });
    return Array.from(s);
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(item => {
      const flatItem: any = { week: item.weekRange };
      if (item.byCompany) {
        Object.entries(item.byCompany).forEach(([comp, amt]) => {
             flatItem[comp] = amt;
        });
      }
      return flatItem;
    });
  }, [data]);

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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {companies.map((comp, index) => (
             <Line
              key={comp}
              type="monotone"
              dataKey={comp}
              name={comp}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              connectNulls
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};