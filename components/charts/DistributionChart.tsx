import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from 'recharts';
import { CompanyBubbleData } from '../../types';

interface Props {
  data: CompanyBubbleData[];
  sortedCompanies: string[]; // Ordered by total amount desc
}

export const DistributionChart: React.FC<Props> = ({ data, sortedCompanies }) => {
  
  // Recharts Scatter needs numeric X and Y.
  // X: Time (timestamp)
  // Y: Company Index (mapped from sortedCompanies)
  // Z: Amount (Bubble size)

  const processedData = data.map(d => ({
    ...d,
    x: new Date(d.weekStart).getTime(),
    y: sortedCompanies.indexOf(d.companyName), // Map name to index
    z: d.amount
  }));

  // Limit display to top 20 if needed (logic already handled in processor, but good to be safe)
  const displayCompanies = sortedCompanies.slice(0, 20);
  
  // Custom tooltip for Bubble
  const CustomBubbleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-scifi-bg/95 border border-scifi-border p-3 rounded backdrop-blur-md text-xs shadow-2xl">
            <div className="font-bold text-scifi-primary mb-1">{data.companyName}</div>
            <div className="text-gray-400 mb-1">{data.weekRange}</div>
            <div className="text-white font-mono">
                Amount: <span className="text-scifi-accent">${data.amount.toLocaleString()}</span>
            </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: Math.max(500, displayCompanies.length * 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Week" 
            domain={['auto', 'auto']}
            tickFormatter={(unixTime) => new Date(unixTime).toISOString().slice(0, 10)}
            stroke="#94a3b8"
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Company" 
            ticks={displayCompanies.map((_, i) => i)}
            tickFormatter={(index) => displayCompanies[index] || ''}
            stroke="#94a3b8"
            tick={{ fontSize: 11, fill: '#e2e8f0' }}
            width={120}
            interval={0}
          />
          <ZAxis type="number" dataKey="z" range={[50, 1000]} name="Amount" />
          <Tooltip content={<CustomBubbleTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Purchases" data={processedData} fill="#06b6d4" fillOpacity={0.6} stroke="#fff" strokeWidth={1} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};