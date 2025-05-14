
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, UserProfile } from '@/types';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        if (session?.user) {
          try {
            // Get the user profile on auth change
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              if (error.code === 'PGRST116') {
                console.log('Profile not found, creating one');
                // Create a profile if it doesn't exist
                const { data: newProfile, error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    first_name: session.user.user_metadata.first_name || '',
                    last_name: session.user.user_metadata.last_name || ''
                  })
                  .select()
                  .single();
                
                if (insertError) {
                  console.error('Error creating profile:', insertError);
                  toast.error('Error setting up your profile');
                } else {
                  setUser({
                    id: newProfile.id,
                    email: newProfile.email,
                    first_name: newProfile.first_name || '',
                    last_name: newProfile.last_name || '',
                    avatar_url: newProfile.avatar_url || ''
                  });
                }
              } else {
                console.error('Error fetching profile:', error);
                toast.error('Error retrieving your profile');
              }
            } else if (profile) {
              setUser({
                id: profile.id,
                email: profile.email,
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                avatar_url: profile.avatar_url || ''
              });
            }
          } catch (error) {
            console.error('Auth error:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Get the current session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {
              // Profile not found, create one
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  first_name: session.user.user_metadata.first_name || '',
                  last_name: session.user.user_metadata.last_name || ''
                })
                .select()
                .single();
              
              if (insertError) {
                console.error('Error creating profile:', insertError);
                toast.error('Error setting up your profile');
                setUser(null);
              } else {
                setUser({
                  id: newProfile.id,
                  email: newProfile.email,
                  first_name: newProfile.first_name || '',
                  last_name: newProfile.last_name || '',
                  avatar_url: newProfile.avatar_url || ''
                });
              }
            } else {
              console.error('Error fetching profile:', error);
              setUser(null);
            }
          } else if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              avatar_url: profile.avatar_url || ''
            });
          }
        } catch (error) {
          console.error('Auth error:', error);
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Signed in successfully');
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Account created successfully. Please check your email to verify your account.');
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
