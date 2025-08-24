import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const router = useRouter();
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting initial session:', error);
          setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        } else {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session?.user ?? null,
            loading: false,
            error: null,
          }));
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Unexpected error getting session:', err);
        setAuthState(prev => ({ 
          ...prev, 
          error: 'Failed to get session', 
          loading: false 
        }));
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
        error: null,
      }));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithDiscord = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Discord sign-in error:', error);
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      }
    } catch (err) {
      console.error('Unexpected error during Discord sign-in:', err);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to initiate Discord sign-in', 
        loading: false 
      }));
    }
  };

  const signInWithGoogle = async (path?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback${path ? "?redirect=" + encodeURIComponent(path) : ''}`,
        },
      });

      if (error) {
        console.error('Google sign-in error:', error);
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      }
    } catch (err) {
      console.error('Unexpected error during Google sign-in:', err);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to initiate Google sign-in', 
        loading: false 
      }));
    }
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
        router.push('/');
        return;
      }

      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Sign-out error:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
      }

      router.push('/');
    } catch (err) {
      console.error('Unexpected error during sign-out:', err);
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      router.push('/');
    }
  };

  return {
    ...authState,
    signInWithDiscord,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!authState.user,
  };
}