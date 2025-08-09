import React from 'react';

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  change?: number;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/30 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-lg bg-orange-500/20">
        <Icon className="w-6 h-6 text-orange-500" />
      </div>
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  </div>
);
