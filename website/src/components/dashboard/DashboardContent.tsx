import React from 'react';
import { Coins, TrendingUp, Activity, Zap } from 'lucide-react';
import { EarningsChart } from './EarningsChart';
import { StatsCard } from './StatsCard';
import { NodeStatus } from './NodeStatus';
import { NodeStats, UserStats } from '@/types';

interface DashboardContentProps {
  userStats: UserStats | null;
  nodeStats: NodeStats[] | null;
  earningsHistory: number[];
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
}

export function DashboardContent({ 
  userStats,
  nodeStats, 
  earningsHistory,
  error,
  supabaseConnected 
}: DashboardContentProps) {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatBytes = (bytes: number) => {
    if (bytes >= 1) {
      return `${bytes.toFixed(2)} GB`;
    }
    const mb = bytes * 1024;
    return `${mb.toFixed(2)} MB`;
  };

  // Calculate aggregated stats from all nodes
  const totalBandwidth = nodeStats?.reduce((sum, node) => sum + (node.bandwidthUsed || 0), 0) || 0;
  const totalRequests = nodeStats?.reduce((sum, node) => sum + (node.requestCount || 0), 0) || 0;
  const activeNodesCount = nodeStats?.filter(node => node.isActive && node.isConnected).length || 0;

  return (
    <div className="flex-1 p-6 h-full overflow-hidden">
      {/* Grid Layout: Left side for chart and stats, Right side for node status */}
      <div className="grid grid-cols-12 gap-6 h-full">

        {/* Left Column - Node Status */}
        <div className="col-span-3 flex flex-col ">
          {/* Additional stats at the top of right column */}
          <div className="mb-6">
            <StatsCard
              icon={Coins}
              title="Total Earnings"
              value={formatCurrency(userStats?.totalEarnings || 0)}
            />
          </div>

          {/* Node Status Component */}
          <div className="flex-1">
            <NodeStatus 
              nodeStats={nodeStats} 
              isConnected={supabaseConnected && !!userStats} 
            />
          </div>
        </div>
        
        {/* Right Column - Stats and Chart */}
        <div className="col-span-9 flex flex-col gap-6 h-full">
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-3 gap-6">
            <StatsCard
              icon={TrendingUp}
              title="Today's Earnings"
              value={formatCurrency(userStats?.todayEarnings || 0)}
            />
            <StatsCard
              icon={Activity}
              title="Bandwidth Used"
              value={formatBytes(totalBandwidth)}
            />
            <StatsCard
              icon={Zap}
              title="Requests Served"
              value={totalRequests.toLocaleString()}
            />
          </div>

          {/* Earnings Chart - Takes remaining space */}
          <div className="flex-1 min-h-0">
            <div className="h-full">
              <EarningsChart data={earningsHistory} />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
