"use client";

import { useState, useEffect, useCallback } from "react";
import { account } from "@/app/appwriteClient";
import { AppwriteUser, getCurrentUser } from "./auth";

interface UseAuthState {
  user: AppwriteUser | null;
  loading: boolean;
  error: Error | null;
}

// Hook to get current auth state (replaces useAuthState from react-firebase-hooks)
export function useAuthState(): [AppwriteUser | null, boolean, Error | null] {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const checkAuth = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setState({ user, loading: false, error: null });
    } catch (error) {
      setState({ user: null, loading: false, error: error as Error });
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Set up a listener for auth changes by polling
    // Appwrite doesn't have real-time auth listeners like Firebase
    const interval = setInterval(checkAuth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [checkAuth]);

  return [state.user, state.loading, state.error];
}

// Hook to handle sign in
export function useSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await getCurrentUser();
      setLoading(false);
      return user;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      return null;
    }
  };

  const signInWithGoogle = () => {
    const successUrl = `${window.location.origin}/`;
    const failureUrl = `${window.location.origin}/login?error=oauth_failed`;
    account.createOAuth2Session("google", successUrl, failureUrl);
  };

  const signInAnonymously = async () => {
    setLoading(true);
    setError(null);
    try {
      await account.createAnonymousSession();
      const user = await getCurrentUser();
      setLoading(false);
      return user;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      return null;
    }
  };

  return {
    signInWithEmail,
    signInWithGoogle,
    signInAnonymously,
    loading,
    error,
  };
}

// Hook to handle sign up
export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      await account.create(email, email, password, name);
      await account.createEmailPasswordSession(email, password);
      const user = await getCurrentUser();
      setLoading(false);
      return user;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      return null;
    }
  };

  return { signUp, loading, error };
}

// Hook to handle sign out
export function useSignOut() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await account.deleteSession("current");
      setLoading(false);
      return true;
    } catch (err) {
      setError(err as Error);
      setLoading(false);
      return false;
    }
  };

  return { signOut, loading, error };
}
