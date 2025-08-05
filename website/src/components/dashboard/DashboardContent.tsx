import React from "react";
import { Activity, TrendingUp, Zap, Globe, Settings } from "lucide-react";
import { NodeStats } from "@/types";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { EarningsChart } from "@/components/dashboard/EarningsChart";

interface DashboardContentProps {
  nodeStats: NodeStats | null;
  earningsHistory: any[];
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
}

export function DashboardContent({ 
  nodeStats, 
  earningsHistory
}: DashboardContentProps) {
  const displayHistory = earningsHistory.length > 0 ? earningsHistory : [];

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Node Status Card */}
      <div className="mb-6">
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            nodeStats?.isConnected
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  nodeStats?.isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <div>
                <h3 className="font-medium text-white">
                  Node Status: {nodeStats?.isConnected ? "Online" : "Offline"}
                </h3>
                <p className="text-sm text-gray-400">
                  Location: {nodeStats?.location || "Unknown"} • Uptime: {nodeStats?.uptime || 0}%
                  • Last update:{" "}
                  {nodeStats ? new Date(nodeStats.timestamp).toLocaleTimeString() : "N/A"}
                </p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          icon={TrendingUp}
          title="Total Earnings"
          value={`$${(nodeStats?.totalEarnings || 0).toFixed(2)}`}
        />
        <StatsCard
          icon={Zap}
          title="Today's Earnings"
          value={`$${(nodeStats?.todayEarnings || 0).toFixed(2)}`}
        />
        <StatsCard
          icon={Activity}
          title="Bandwidth Used"
          value={`${(nodeStats?.bandwidthUsed || 0).toFixed(1)} GB`}
        />
        <StatsCard
          icon={Globe}
          title="Requests Served"
          value={(nodeStats?.requestCount || 0).toLocaleString()}
        />
      </div>

      {/* Earnings Chart */}
      <div className="flex-1">
        <EarningsChart data={displayHistory} />
      </div>
    </div>
  );
}
