import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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
  const { user, isAuthenticated } = useAuth();
  const [nodeStats, setNodeStats] = useState<NodeStats | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasNodeData, setHasNodeData] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNodeStats(null);
      setEarningsHistory([]);
      setLoading(false);
      setError(null);
      setHasNodeData(null);
      setIsConnected(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          setError('Authentication session invalid');
          setHasNodeData(null);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('UserData')
          .select('*')
          .eq('authUserId', user?.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Fetch error:', fetchError);
          console.error('Full error details:', {
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code
          });
          
          // Special handling for permission errors
          if (fetchError.message.includes('permission denied') || fetchError.code === '42501') {
            setError('Database permission error. Please check your Row Level Security policies.');
          } else {
            setError(`Database error: ${fetchError.message}`);
          }
          setHasNodeData(null);
          return;
        }

        if (data) {
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
          setHasNodeData(true);
          
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
          // No data found - this means no node is set up
          setNodeStats(null);
          setEarningsHistory([]);
          setHasNodeData(false);
          setIsConnected(true); // We're connected to Supabase, just no node data
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setHasNodeData(null); // Set to null on error
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
          filter: `authUserId=eq.${user?.id}`,
        },
        (payload) => {
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
            setHasNodeData(true);

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
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated]);

  return { nodeStats, earningsHistory, loading, error, isConnected, hasNodeData };
}