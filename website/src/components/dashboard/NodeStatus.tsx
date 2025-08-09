import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Activity, MapPin, Wifi, Clock } from 'lucide-react';
import { NodeStats } from '@/types';

interface NodeStatusProps {
  nodeStats: NodeStats | null;
  isConnected: boolean;
}

export function NodeStatus({ nodeStats, isConnected }: NodeStatusProps) {
  // For now, we'll display a single node, but the structure supports multiple nodes
  const nodes = nodeStats ? [nodeStats] : [];

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!isConnected || nodes.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800 p-4 h-full">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Node Status</h3>
        </div>
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wifi className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-sm text-gray-400 mb-2">No nodes connected</p>
          <Badge variant="secondary" className="bg-gray-800 text-gray-400">
            Offline
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800 p-4 h-full">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-orange-500" />
        <h3 className="text-sm font-semibold text-white">Node Status</h3>
        <Badge 
          variant={isConnected ? "default" : "secondary"} 
          className={isConnected ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-gray-800 text-gray-400"}
        >
          {nodes.length} Active
        </Badge>
      </div>

      <div className="space-y-3">
        {nodes.map((node, index) => (
          <div key={index} className={`border ${node.isConnected ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"} border-gray-800 rounded-lg p-3 bg-gray-900/50`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${node.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-white">Node #{index + 1}</span>
              </div>
              <Badge 
                variant={node.isConnected ? "default" : "destructive"}
                className={node.isConnected ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-red-500/20 text-red-500 border-red-500/30"}
              >
                {node.isConnected ? 'Online' : 'Offline'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span>{node.location || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatUptime(node.uptime || 0)}</span>
              </div>
              <div className="text-gray-400">
                <span className="text-orange-500 font-medium">{(node.bandwidthUsed / 1024 / 1024).toFixed(1)}</span> MB
              </div>
              <div className="text-gray-400">
                <span className="text-orange-500 font-medium">{node.requestCount || 0}</span> requests
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
