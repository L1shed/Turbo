import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EarningsChartProps {
  data: number[];
}

export const EarningsChart: React.FC<EarningsChartProps> = ({ data }) => {
  // Convert array to chart data format
  const chartData = data.map((earnings, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index)); // 6 days ago to today
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      earnings,
      fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  const formatTooltipValue = (value: number): [string, string] => [`${value.toFixed(2)}`, 'Earnings'];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-6 text-white">Earnings History (7 Days)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value: number) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={formatTooltipValue}
              labelFormatter={(value: string) => `Date: ${chartData.find(d => d.day === value)?.fullDate || value}`}
            />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="#F97316" 
              strokeWidth={3}
              dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#F97316', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
