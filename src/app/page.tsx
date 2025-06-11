"use client";

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
  MessageSquare,
  Send,
} from "lucide-react";
import { NodeStats, EarningsDay, Log } from "../types";
import { useWebSocket } from "../hooks/useWebSocket";
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

const generateMockEarningsHistory = (): EarningsDay[] => {
  const history: EarningsDay[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split("T")[0],
      earnings: Math.random() * 4 + 1,
      timestamp: date.getTime(),
    });
  }

  return history;
};

export default function TurboNodeDashboard() {
  const [nodeStats, setNodeStats] = useState<NodeStats>(mockNodeStats);
  const [earningsHistory, setEarningsHistory] = useState<EarningsDay[]>(
    generateMockEarningsHistory()
  );
  const [logs, setLogs] = useState<Log[]>([]);
  const [newLogMessage, setNewLogMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();

  const webSocket = useWebSocket("ws://localhost:8766");

  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/logs");
      if (response.ok) {
        const logsData = await response.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  // Create a new log
  const createLog = async (message: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        const newLog = await response.json();
        setLogs((prevLogs) => [newLog, ...prevLogs]);
        setNewLogMessage("");
      }
    } catch (error) {
      console.error("Error creating log:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLogMessage.trim()) {
      createLog(newLogMessage.trim());
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (webSocket.lastMessage) {
      const { type, data } = webSocket.lastMessage;

      switch (type) {
        case "stats":
          setNodeStats((prevStats) => ({
            ...prevStats,
            ...data,
            timestamp: Date.now(),
          }));
          break;
        case "earnings":
          setEarningsHistory(data);
          break;
        case "connection":
          setNodeStats((prevStats) => ({
            ...prevStats,
            isConnected: data.isConnected,
          }));
          break;
      }
    }
  }, [webSocket.lastMessage]);

  useEffect(() => {
    webSocket.connect();

    return () => {
      webSocket.disconnect();
    };
  }, [webSocket]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodeStats((prev) => ({
        ...prev,
        requestCount: prev.requestCount + Math.floor(Math.random() * 5),
        bandwidthUsed: prev.bandwidthUsed + Math.random() * 0.1,
        todayEarnings: prev.todayEarnings + Math.random() * 0.01,
        timestamp: Date.now(),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getWebSocketStatusIcon = () => {
    switch (webSocket.connectionStatus) {
      case "connected":
        return <Wifi className="w-4 h-4 text-green-500" />;
      case "connecting":
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
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
                {getWebSocketStatusIcon()}
                <span className="text-sm text-gray-400">
                  {webSocket.connectionStatus}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
            className={`p-4 rounded-xl border ${
              nodeStats.isConnected
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    nodeStats.isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <div>
                  <h3 className="font-medium text-white">
                    Node Status: {nodeStats.isConnected ? "Online" : "Offline"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Location: {nodeStats.location} • Uptime: {nodeStats.uptime}%
                    • Last update:{" "}
                    {new Date(nodeStats.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={TrendingUp}
            title="Total Earnings"
            value={`$${nodeStats.totalEarnings.toFixed(2)}`}
          />
          <StatsCard
            icon={Zap}
            title="Today's Earnings"
            value={`$${nodeStats.todayEarnings.toFixed(2)}`}
          />
          <StatsCard
            icon={Activity}
            title="Bandwidth Used"
            value={`${nodeStats.bandwidthUsed.toFixed(1)} GB`}
          />
          <StatsCard
            icon={Globe}
            title="Requests Served"
            value={nodeStats.requestCount.toLocaleString()}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <EarningsChart data={earningsHistory} />

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
                disabled={!isConnected}
              >
                <span>Withdraw Earnings</span>
                <ExternalLink size={18} />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white">
                <span>Node Settings</span>
                <Settings size={18} />
              </button>
              <button
                onClick={() =>
                  webSocket.connectionStatus === "connected"
                    ? webSocket.disconnect()
                    : webSocket.connect()
                }
                className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white"
              >
                <span>
                  {webSocket.connectionStatus === "connected"
                    ? "Disconnect"
                    : "Connect"}{" "}
                  WebSocket
                </span>
                {getWebSocketStatusIcon()}
              </button>
            </div>
          </div>
        </div>

        {/* Logs Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-white">System Logs</h3>
          </div>

          {/* Add Log Form */}
          <form onSubmit={handleSubmitLog} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newLogMessage}
                onChange={(e) => setNewLogMessage(e.target.value)}
                placeholder="Add a new log message..."
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !newLogMessage.trim()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isLoading ? "Adding..." : "Add Log"}
              </button>
            </div>
          </form>

          {/* Logs List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No logs found. Add your first log message above.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <p className="text-white mb-1">{log.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Turbo Node Runner • Earn passive income by sharing bandwidth</p>
          <p className="mt-2">
            Using simulated data updates • WebSocket connection simulated • Logs powered by Supabase
          </p>
        </div>
      </main>
    </div>
  );
}