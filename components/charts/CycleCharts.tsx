
import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { PaymentCycleMetric, ForecastSummary } from '../../types';
import { CustomTooltip } from '../ChartTooltip';

// ------------------------------------------------------------------
// 1. Payment Cycle Analysis Chart (Median Days)
// ------------------------------------------------------------------
interface CycleProps {
  data: PaymentCycleMetric[];
  sortBy: 'MEDIAN' | 'AMOUNT';
}

export const PaymentCycleBarChart: React.FC<CycleProps> = ({ data, sortBy }) => {
  const chartData = useMemo(() => {
    // Clone and Sort
    const sorted = [...data].sort((a, b) => {
      if (sortBy === 'MEDIAN') return b.medianDays - a.medianDays;
      return b.totalAmount - a.totalAmount;
    });
    return sorted;
  }, [data, sortBy]);

  // Color Scale based on median days (Higher = Darker/Redder)
  const getColor = (days: number) => {
    // Cap at 60 days for max intensity
    const intensity = Math.min(days / 60, 1);
    // Interpolate between nice Blue and Danger Red
    // This is a CSS trick, but for Recharts we need hex. 
    // Let's simple use opacity of red or index based palette.
    // Let's use HSL Red.
    return `hsl(0, ${50 + (intensity * 50)}%, ${70 - (intensity * 20)}%)`;
  };

  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="companyName"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#94a3b8' }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#64748b' }}
          />
          <Tooltip
            cursor={{ fill: '#ffffff10' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload as PaymentCycleMetric;
                return (
                  <div className="bg-scifi-bg/95 border border-scifi-border p-3 rounded shadow-xl backdrop-blur-md text-xs">
                    <div className="font-bold text-scifi-primary mb-2 border-b border-scifi-border pb-1">{d.companyName}</div>
                    <div className="space-y-1 font-mono text-gray-300">
                      <div>Median Days: <span className="text-white font-bold">{d.medianDays.toFixed(1)}</span></div>
                      <div>Total Amount: <span className="text-scifi-accent">${d.totalAmount.toLocaleString()}</span></div>
                      <div>Count: <span>{d.invoiceCount}</span></div>
                      <div className="text-[10px] text-gray-500 mt-1">Range: {d.minDays} - {d.maxDays} days</div>
                    </div>
                  </div>
                )
              }
              return null;
            }}
          />
          <Bar dataKey="medianDays" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.medianDays)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


// ------------------------------------------------------------------
// 2. Forecast Summary Chart (Dept / Company)
// ------------------------------------------------------------------
interface ForecastProps {
  data: ForecastSummary;
  view: 'DEPT' | 'COMPANY';
  selectedDept?: string;
  onBarClick?: (data: any) => void;
}

export const ForecastChart: React.FC<ForecastProps> = ({ data, view, selectedDept, onBarClick }) => {

  const chartData = useMemo(() => {
    if (view === 'DEPT') {
      return Object.entries(data.byDept)
        .map(([name, amount]) => ({ name, amount: amount as number }))
        .sort((a, b) => b.amount - a.amount);
    } else {
      if (!selectedDept || !data.byDeptCompany[selectedDept]) return [];
      return Object.entries(data.byDeptCompany[selectedDept])
        .map(([name, amount]) => ({ name, amount: amount as number }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20); // Top 20
    }
  }, [data, view, selectedDept]);

  if (chartData.length === 0) {
    return <div className="h-96 flex items-center justify-center text-gray-500 font-mono">No forecasted payments due this week.</div>
  }

  return (
    <div className="h-[450px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            tick={{ fontSize: 10, fontFamily: 'JetBrains Mono', fill: '#94a3b8' }}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 12, fontFamily: 'JetBrains Mono' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
          <Bar
            dataKey="amount"
            name="Due Amount"
            radius={[4, 4, 0, 0]}
            onClick={(data) => {
              if (onBarClick && data && data.name) {
                onBarClick(data.name);
              }
            }}
            cursor={onBarClick ? "pointer" : "default"}
          >
            {chartData.map((entry, index) => {
              // Varied Palette: Cyan, Purple, Pink, Orange, Emerald, Blue, Yellow, Indigo, Red, Teal
              const colors = [
                '#06b6d4', // Cyan
                '#8b5cf6', // Purple
                '#ec4899', // Pink
                '#f97316', // Orange
                '#10b981', // Emerald
                '#3b82f6', // Blue
                '#eab308', // Yellow
                '#6366f1', // Indigo
                '#ef4444', // Red
                '#14b8a6', // Teal
              ];
              const color = colors[index % colors.length];
              return <Cell key={`cell-${index}`} fill={color} cursor={onBarClick ? "pointer" : "default"} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
