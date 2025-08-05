import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, User } from 'lucide-react';

interface AuthButtonsProps {
  className?: string;
}

export function AuthButtons({ className = '' }: AuthButtonsProps) {
  const { user, loading, signInWithDiscord, signInWithGoogle, signOut, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
            {user.user_metadata?.avatar_url ? (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={signInWithDiscord}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm rounded-md transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span>Discord</span>
      </button>
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-900 text-sm rounded-md transition-colors border border-gray-300"
      >
        <LogIn className="w-4 h-4" />
        <span>Google</span>
      </button>
    </div>
  );
}