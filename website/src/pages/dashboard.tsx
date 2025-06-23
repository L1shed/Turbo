import React, { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  Zap,
  Globe,
  Settings,
  ExternalLink,
  Wifi,
  WifiOff,
  Database,
} from "lucide-react";
import Link from "next/link";
import { NodeStats, EarningsDay } from "../types";
import { useSupabaseRealtime } from "../hooks/useSupabaseRealtime";
import { StatsCard } from "../components/StatsCard";
import { EarningsChart } from "../components/EarningsChart";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

const mockNodeStats: NodeStats = {
  isConnected: true,
  totalEarnings: 24.57,
  todayEarnings: 3.42,
  bandwidthUsed: 156.7,
  uptime: 99.2,
  requestCount: 1247,
  location: "New York, US",
  timestamp: Date.now(),
};

export default function TurboNodeDashboard() {
  const { isConnected: walletConnected } = useAccount();
  const {
    nodeStats,
    earningsHistory,
    loading,
    error,
    isConnected: supabaseConnected,
  } = useSupabaseRealtime();

  // Use mock data as fallback when wallet is not connected or no data is available
  const displayStats = nodeStats || mockNodeStats;
  const displayHistory = earningsHistory.length > 0 ? earningsHistory : [];

  const getSupabaseStatusIcon = () => {
    if (loading) {
      return <Database className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
    return supabaseConnected ? (
      <Database className="w-4 h-4 text-green-500" />
    ) : (
      <Wifi className="w-4 h-4 text-red-500" />
    );
  };

  const getSupabaseStatusText = () => {
    if (loading) return "connecting";
    if (!walletConnected) return "wallet disconnected";
    return supabaseConnected ? "realtime connected" : "disconnected";
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Turbo Node Dashboard</h1>
              <div className="flex items-center gap-2 ml-4">
                {getSupabaseStatusIcon()}
                <span className="text-sm text-gray-400 min-w-[100px]">
                  {getSupabaseStatusText()}
                </span>
                {error && (
                  <span className="text-xs text-red-400 ml-2">
                    Error: {error}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 mr-4">
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
                <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                  Blog
                </Link>
              </nav>
              <ConnectButton
                showBalance={false}
                accountStatus={{
                  smallScreen: "avatar",
                  largeScreen: "full",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div
            className={`p-4 rounded-xl border transition-all duration-300 ${
              displayStats.isConnected
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    displayStats.isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <div>
                  <h3 className="font-medium text-white">
                    Node Status: {displayStats.isConnected ? "Online" : "Offline"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Location: {displayStats.location} • Uptime: {displayStats.uptime}%
                    • Last update:{" "}
                    {new Date(displayStats.timestamp).toLocaleTimeString()}
                  </p>
                  {!walletConnected && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Connect your wallet to see live data
                    </p>
                  )}
                </div>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={TrendingUp}
            title="Total Earnings"
            value={`$${displayStats.totalEarnings.toFixed(2)}`}
          />
          <StatsCard
            icon={Zap}
            title="Today's Earnings"
            value={`$${displayStats.todayEarnings.toFixed(2)}`}
          />
          <StatsCard
            icon={Activity}
            title="Bandwidth Used"
            value={`${displayStats.bandwidthUsed.toFixed(1)} GB`}
          />
          <StatsCard
            icon={Globe}
            title="Requests Served"
            value={displayStats.requestCount.toLocaleString()}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EarningsChart data={displayHistory} />

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white">
                <span>View Detailed Analytics</span>
                <ExternalLink size={18} />
              </button>
              <button
                className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 text-white"
                disabled={!walletConnected}
              >
                <span>Withdraw Earnings</span>
                <ExternalLink size={18} />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white">
                <span>Node Settings</span>
                <Settings size={18} />
              </button>
              <button
                className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white"
                disabled={loading}
              >
                <span>
                  {supabaseConnected ? "Realtime Active" : "Connect to Database"}
                </span>
                {getSupabaseStatusIcon()}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Turbo Node Runner • Earn passive income by sharing bandwidth</p>
          <p className="mt-2">
            {walletConnected 
              ? `Live data from Supabase • ${supabaseConnected ? 'Realtime updates active' : 'Realtime disconnected'}`
              : 'Connect wallet to see live data • Using demo data'
            }
          </p>
        </div>
      </main>
    </div>
  );
}
