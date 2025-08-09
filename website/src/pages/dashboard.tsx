import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Zap } from "lucide-react";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { useAuth } from "@/hooks/useAuth";
import { AuthButtons } from "@/components/AuthButtons";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { WelcomeScreen } from "@/components/dashboard/WelcomeScreen";

export default function TurboNodeDashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    nodeStats,
    earningsHistory,
    loading,
    error,
    isConnected: supabaseConnected,
    hasNodeData,
  } = useSupabaseRealtime();

  const [showNoNodePopup, setShowNoNodePopup] = useState(false);

  // Show "No Node setup" popup when user is authenticated but no node data exists
  useEffect(() => {
    // Only show popup if we're definitely done loading and have confirmed no node data
    if (isAuthenticated && !loading && hasNodeData === false) {
      setShowNoNodePopup(true);
    } else {
      setShowNoNodePopup(false);
    }
  }, [isAuthenticated, loading, hasNodeData]);

  // Show loading state while checking authentication OR while loading data
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <>
        <Head>
          <title>Loading... | Turbo</title>
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">Loading Dashboard...</h1>
            <p className="text-gray-400">Please wait while we verify your authentication.</p>
          </div>
        </div>
      </>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Login Required | Turbo</title>
        </Head>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Login Required</h1>
            <p className="text-gray-300 mb-8">
              You need to be logged in to access the dashboard. Please sign in with your preferred provider.
            </p>
            <AuthButtons className="justify-center" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Turbo Node Dashboard</title>
      </Head>

      <div className="h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-xl font-semibold mb-2">Loading Dashboard...</h1>
              <p className="text-gray-400">Fetching your node data...</p>
            </div>
          </div>
        ) : !nodeStats ? (
          <WelcomeScreen />
        ) : (
          <DashboardContent
            nodeStats={nodeStats}
            earningsHistory={earningsHistory}
            loading={loading}
            error={error}
            supabaseConnected={supabaseConnected}
          />
        )}

        {/* No Node Setup Popup */}
        {showNoNodePopup && (
          <WelcomeScreen 
            showPopup={true} 
            onClosePopup={() => setShowNoNodePopup(false)} 
          />
        )}
      </div>
    </>
  );
}
