import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAccount } from 'wagmi';

export interface NodeStats {
  isConnected: boolean;
  totalEarnings: number;
  todayEarnings: number;
  bandwidthUsed: number;
  uptime: number;
  requestCount: number;
  location: string;
  timestamp: number;
}

export interface EarningsHistoryItem {
  date: string;
  earnings: number;
  timestamp: number;
}

export function useSupabaseRealtime() {
  const { address } = useAccount();
  const [nodeStats, setNodeStats] = useState<NodeStats | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      setError('Wallet not connected');
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // First, try to fetch existing data
        const { data, error: fetchError } = await supabase
          .from('UserData')
          .select('*')
          .eq('walletAddress', address)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Fetch error:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (data) {
          // Convert database data to NodeStats format
          const stats: NodeStats = {
            isConnected: data.isConnected ?? false,
            totalEarnings: data.totalEarnings ?? 0,
            todayEarnings: data.todayEarnings ?? 0,
            bandwidthUsed: data.bandwidthUsed ?? 0,
            uptime: data.uptime ?? 0,
            requestCount: data.requestCount ?? 0,
            location: data.location ?? 'Unknown',
            timestamp: new Date(data.updatedAt).getTime(),
          };

          setNodeStats(stats);
          
          // Parse earnings history
          if (data.earningsHistory) {
            try {
              const history = typeof data.earningsHistory === 'string' 
                ? JSON.parse(data.earningsHistory) 
                : data.earningsHistory;
              setEarningsHistory(Array.isArray(history) ? history : []);
            } catch (e) {
              console.error('Error parsing earnings history:', e);
              setEarningsHistory([]);
            }
          }
          
          setIsConnected(true);
        } else {
          // No data found, create initial record
          const initialData = {
            walletAddress: address,
            username: null,
            preferences: null,
            lastLogin: new Date().toISOString(),
            totalEarnings: 0,
            todayEarnings: 0,
            bandwidthUsed: 0,
            uptime: 0,
            requestCount: 0,
            location: 'Unknown',
            isConnected: false,
            earningsHistory: JSON.stringify([]),
          };

          const { error: insertError } = await supabase
            .from('UserData')
            .insert(initialData);

          if (insertError) {
            console.error('Insert error:', insertError);
            setError(insertError.message);
          } else {
            const stats: NodeStats = {
              isConnected: false,
              totalEarnings: 0,
              todayEarnings: 0,
              bandwidthUsed: 0,
              uptime: 0,
              requestCount: 0,
              location: 'Unknown',
              timestamp: Date.now(),
            };
            setNodeStats(stats);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel('user-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'UserData',
          filter: `walletAddress=eq.${address}`,
        },
        (payload) => {
          console.log('Realtime update:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const data = payload.new;
            const stats: NodeStats = {
              isConnected: data.isConnected ?? false,
              totalEarnings: data.totalEarnings ?? 0,
              todayEarnings: data.todayEarnings ?? 0,
              bandwidthUsed: data.bandwidthUsed ?? 0,
              uptime: data.uptime ?? 0,
              requestCount: data.requestCount ?? 0,
              location: data.location ?? 'Unknown',
              timestamp: new Date(data.updatedAt).getTime(),
            };

            setNodeStats(stats);

            // Parse earnings history
            if (data.earningsHistory) {
              try {
                const history = typeof data.earningsHistory === 'string' 
                  ? JSON.parse(data.earningsHistory) 
                  : data.earningsHistory;
                setEarningsHistory(Array.isArray(history) ? history : []);
              } catch (e) {
                console.error('Error parsing earnings history:', e);
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address]);

  return { nodeStats, earningsHistory, loading, error, isConnected };
}