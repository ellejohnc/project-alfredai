import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/lib/rolePermissions';
import { logAuthActivity } from '@/hooks/useActivityLog';
import { AdminAuthContext, REMEMBER_ME_KEY, SESSION_TAB_KEY } from './AdminAuthContext';

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const isMounted = useRef(true);
  const lastRoleCheckedId = useRef<string | null>(null);


  // Highest-privilege first. A user may have multiple role rows; we resolve to the strongest.
  const ROLE_PRIORITY: AppRole[] = ['super_admin', 'admin', 'editor', 'sales_rep', 'distributor'];

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error checking admin role:', error);
      if (isMounted.current) setUserRole(null);
      return false;
    }

    const roles = (data ?? [])
      .map((r) => r.role as AppRole)
      .filter((r) => ROLE_PRIORITY.includes(r));

    // Pick the highest-privilege role the user holds
    const bestRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;

    if (bestRole) {
      if (isMounted.current) setUserRole(bestRole);
      return true;
    }

    if (isMounted.current) setUserRole(null);
    return false;
  };

  useEffect(() => {
    isMounted.current = true;

    // Listener: only manages state, never signs out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted.current) return;

        if (currentSession) {
          sessionStorage.setItem(SESSION_TAB_KEY, 'true');
        }

        setSession(currentSession);
        const nextUser = currentSession?.user ?? null;
        // Keep the user object reference stable when the user hasn't changed —
        // token refresh on tab-refocus otherwise cascades into refetches everywhere.
        setUser((prev) => (prev?.id === nextUser?.id ? prev : nextUser));

        if (nextUser) {
          // Only re-check the role when the user actually changes, not on token refresh.
          if (lastRoleCheckedId.current !== nextUser.id) {
            lastRoleCheckedId.current = nextUser.id;
            checkAdminRole(nextUser.id).then((result) => {
              if (isMounted.current) setIsAdmin(result);
            });
          }
        } else {
          lastRoleCheckedId.current = null;
          setIsAdmin(false);
          setUserRole(null);
          sessionStorage.removeItem(SESSION_TAB_KEY);
        }

      }
    );

    // Init: load existing session and check roles
    const initializeAuth = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!isMounted.current) return;

      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        sessionStorage.setItem(SESSION_TAB_KEY, 'true');
        lastRoleCheckedId.current = existingSession.user.id;
        const admin = await checkAdminRole(existingSession.user.id);
        if (isMounted.current) setIsAdmin(admin);

      } else {
        // No session — ensure role state is cleared
        if (isMounted.current) {
          setUserRole(null);
          setIsAdmin(false);
        }
      }

      // Only mark loading as done AFTER role has been resolved
      if (isMounted.current) setIsLoading(false);
    };

    initializeAuth();

    // Subscribe to realtime role changes for the current user
    const roleChannel = supabase
      .channel('user-role-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
        },
        (payload) => {
          if (!isMounted.current) return;
          const record = (payload.new as any);
          const oldRecord = (payload.old as any);
          
          // Check if this change affects the current user
          supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
            if (!currentUser) return;
            const affectsCurrentUser = 
              (record?.user_id === currentUser.id) || 
              (oldRecord?.user_id === currentUser.id);
            
            if (affectsCurrentUser) {
              if (payload.eventType === 'DELETE') {
                if (isMounted.current) {
                  setUserRole(null);
                  setIsAdmin(false);
                }
              } else {
                checkAdminRole(currentUser.id).then((result) => {
                  if (isMounted.current) setIsAdmin(result);
                });
              }
            }
          });
        }
      )
      .subscribe();

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      supabase.removeChannel(roleChannel);
    };
  }, []);

  // "Remember me" enforcement: if not remembered, sign out on fresh tab open.
  // We avoid beforeunload because it also fires on page reload, causing unwanted logouts.
  useEffect(() => {
    if (!user) return;
    const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    if (rememberMe) return; // session persists naturally
    // sessionStorage persists across reloads but not new tabs — used as the marker
  }, [user]);

  const signIn = async (email: string, password: string) => {
    sessionStorage.setItem(SESSION_TAB_KEY, 'true');
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!error && data.user) {
      const admin = await checkAdminRole(data.user.id);
      if (isMounted.current) setIsAdmin(admin);

      setTimeout(() => {
        logAuthActivity({
          userId: data.user.id,
          userEmail: data.user.email || email,
          action: 'login',
          details: { login_method: 'password' }
        });
      }, 0);
    } else if (error) {
      sessionStorage.removeItem(SESSION_TAB_KEY);
    }
    
    return { error: error as Error | null, data: data ? { user: data.user } : null };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const redirectUrl = `${window.location.origin}/admin`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: displayName }
      }
    });

    if (error) return { error: error as Error };

    if (data.user) {
      await supabase.from('admin_users').insert({
        email,
        display_name: displayName,
        role: 'editor'
      });
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'editor'
      });
    }

    return { error: null };
  };

  const signOut = async () => {
    if (user) {
      await logAuthActivity({
        userId: user.id,
        userEmail: user.email || '',
        action: 'logout',
      });
    }
    
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(SESSION_TAB_KEY);
    await supabase.auth.signOut();
    if (isMounted.current) {
      setIsAdmin(false);
      setUserRole(null);
    }
  };

  return (
    <AdminAuthContext.Provider value={{
      user, session, isAdmin, isLoading, userRole,
      signIn, signUp, signOut
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
