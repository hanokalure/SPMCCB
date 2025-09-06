import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabaseClient } from '../constants/Config';

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state and set up auth listener
  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing authentication...');
    
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 AuthProvider: Initial session:', session ? 'Found' : 'None');
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      console.log('🔐 AuthProvider: Auth state changed:', _event, session ? 'User logged in' : 'User logged out');
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      console.log('🔐 AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Sign up new user
  const signUp = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Attempting sign up for:', email);
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('🔐 AuthProvider: Sign up error:', error);
        return { error };
      }

      console.log('✅ AuthProvider: Sign up successful:', data.user?.email);
      
      // Create user profile in our users table if user is confirmed
      if (data.user && data.user.email_confirmed_at) {
        try {
          const { error: profileError } = await supabaseClient
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              username: null,
            });
            
          if (profileError) {
            console.log('⚠️ AuthProvider: Profile creation warning:', profileError.message);
          }
        } catch (profileError) {
          console.log('⚠️ AuthProvider: Profile creation failed:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('🔐 AuthProvider: Unexpected sign up error:', error);
      return { error };
    }
  };

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Attempting sign in for:', email);
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Don't log error to console to prevent showing to user
        return { error };
      }

      console.log('✅ AuthProvider: Sign in successful:', data.user.email);
      
      // Create user profile if it doesn't exist
      if (data.user) {
        try {
          const { error: profileError } = await supabaseClient
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              username: null,
            }, {
              onConflict: 'id'
            });
            
          if (profileError) {
            console.log('⚠️ AuthProvider: Profile upsert warning:', profileError.message);
          }
        } catch (profileError) {
          console.log('⚠️ AuthProvider: Profile upsert failed:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('🔐 AuthProvider: Unexpected sign in error:', error);
      return { error };
    }
  };

  // Sign out user
  const signOut = async () => {
    console.log('🔐 AuthProvider: Signing out user');
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        console.error('🔐 AuthProvider: Sign out error:', error);
        throw error;
      }
      console.log('✅ AuthProvider: Sign out successful');
    } catch (error) {
      console.error('🔐 AuthProvider: Unexpected sign out error:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    console.log('🔐 AuthProvider: Requesting password reset for:', email);
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: 'singhisword://reset-password', // Deep link for your app
      });

      if (error) {
        console.error('🔐 AuthProvider: Password reset error:', error);
        return { error };
      }

      console.log('✅ AuthProvider: Password reset email sent');
      return { error: null };
    } catch (error) {
      console.error('🔐 AuthProvider: Unexpected password reset error:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
