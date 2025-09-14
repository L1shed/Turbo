import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { NodeStats, UserStats } from '@/types';
import { extractEarningsHistory, calculateTodayEarnings, calculateTotalEarnings } from '@/lib/utils';

export function useSupabaseRealtime() {
  const { user, isAuthenticated } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [nodeStats, setNodeStats] = useState<NodeStats[] | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasNodeData, setHasNodeData] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setUserStats(null);
      setNodeStats(null);
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

        // Fetch user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          console.error('User fetch error:', userError);
          setError(`User data error: ${userError.message}`);
          setHasNodeData(null);
          return;
        }

        // Fetch nodes data
        const { data: nodesData, error: nodesError } = await supabase
          .from('nodes')
          .select('*')
          .eq('userId', user?.id);

        if (nodesError) {
          console.error('Nodes fetch error:', nodesError);
          setError(`Nodes data error: ${nodesError.message}`);
          setHasNodeData(null);
          return;
        }

        if (userData && nodesData) {
          // Create user stats
          const userStatsData: UserStats = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            totalEarnings: Number(userData.totalEarnings) || 0,
            todayEarnings: Number(userData.todayEarnings) || 0,
            createdAt: new Date(userData.createdAt),
            nodes: []
          };

          // Process nodes data
          const nodesStatsData: NodeStats[] = nodesData.map((node: any) => ({
            id: node.id,
            isActive: node.isActive ?? false,
            dailyEarnings: node.dailyEarnings || {},
            bandwidthUsed: node.bandwidthUsed,
            uptimeMinutes: node.uptimeMinutes,
            createdAt: new Date(node.createdAt),
            updatedAt: new Date(node.updatedAt),
            userId: node.userId,
            isConnected: node.isActive && (Date.now() - new Date(node.updatedAt).getTime() < 5 * 60 * 1000), // 5 minutes
            location: 'Unknown', // This might come from external API
            requestCount: 0 // This might be computed or come from external source
          }));

          // Update calculated earnings in user stats
          userStatsData.totalEarnings = calculateTotalEarnings(nodesStatsData);
          userStatsData.todayEarnings = calculateTodayEarnings(nodesStatsData);
          userStatsData.nodes = nodesStatsData;

          setUserStats(userStatsData);
          setNodeStats(nodesStatsData);
          setHasNodeData(nodesStatsData.length > 0);

          // Extract earnings history
          const history = extractEarningsHistory(nodesStatsData);
          setEarningsHistory(history);
          
          setIsConnected(true);
        } else {
          // No data found
          setUserStats(null);
          setNodeStats([]);
          setEarningsHistory([0, 0, 0, 0, 0, 0, 0]);
          setHasNodeData(false);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setHasNodeData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up realtime subscription for nodes
    const channel = supabase
      .channel('node-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
          filter: `userId=eq.${user?.id}`,
        },
        async (payload) => {
          // Refetch all data when any node changes
          await fetchData();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthenticated]);

  return { userStats, nodeStats, earningsHistory, loading, error, isConnected, hasNodeData };
}