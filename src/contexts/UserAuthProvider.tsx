import { useState, useEffect, useCallback, type ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { APP_URL } from "@/lib/siteConfig";
import { useToast } from "@/hooks/use-toast";
import { UserAuthContext } from "./UserAuthContext";

export const UserAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Handle specific error cases with friendly messages
        if (error.message.includes("Invalid login credentials")) {
          return { error: new Error("Email or password is incorrect") };
        }
        if (error.message.includes("Email not confirmed")) {
          return { error: new Error("Please verify your email before signing in") };
        }
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("An unexpected error occurred") };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${APP_URL}/users/sign_in`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes("User already registered")) {
          return { error: new Error("An account with this email already exists. Try signing in.") };
        }
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("An unexpected error occurred") };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${APP_URL}/users/sign_in`,
      });
      
      if (result.error) {
        return { error: result.error };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to sign in with Google") };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_URL}/users/sign_in?reset=true`,
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error("Failed to send reset email") };
    }
  }, []);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        resetPassword,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};
