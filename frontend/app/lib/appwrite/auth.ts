import { account, ID } from "@/app/appwriteClient";
import { AppwriteException, OAuthProvider } from "appwrite";

export interface AppwriteUser {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  prefs: Record<string, unknown>;
}

// Get current logged in user
export async function getCurrentUser(): Promise<AppwriteUser | null> {
  try {
    const user = await account.get();
    return user as unknown as AppwriteUser;
  } catch (error) {
    return null;
  }
}

// Email/Password Sign Up
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<AppwriteUser | null> {
  try {
    await account.create(ID.unique(), email, password, name);
    // Auto login after signup
    await account.createEmailPasswordSession(email, password);
    return await getCurrentUser();
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Sign up error:", appwriteError.message);
    throw error;
  }
}

// Email/Password Sign In
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AppwriteUser | null> {
  try {
    await account.createEmailPasswordSession(email, password);
    return await getCurrentUser();
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Sign in error:", appwriteError.message);
    throw error;
  }
}

// Google OAuth Sign In
export function signInWithGoogle(redirectUrl?: string): void {
  const successUrl = redirectUrl || `${window.location.origin}/`;
  const failureUrl = `${window.location.origin}/login?error=oauth_failed`;
  
  account.createOAuth2Session(OAuthProvider.Google, successUrl, failureUrl);
}

// Anonymous Sign In
export async function signInAnonymously(): Promise<AppwriteUser | null> {
  try {
    await account.createAnonymousSession();
    return await getCurrentUser();
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Anonymous sign in error:", appwriteError.message);
    throw error;
  }
}

// Sign Out
export async function signOut(): Promise<void> {
  try {
    await account.deleteSession("current");
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Sign out error:", appwriteError.message);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(name: string): Promise<AppwriteUser | null> {
  try {
    await account.updateName(name);
    return await getCurrentUser();
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Update profile error:", appwriteError.message);
    throw error;
  }
}

// Update user preferences (used for storing settings)
export async function updateUserPrefs(
  prefs: Record<string, unknown>
): Promise<AppwriteUser | null> {
  try {
    await account.updatePrefs(prefs);
    return await getCurrentUser();
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Update prefs error:", appwriteError.message);
    throw error;
  }
}

// Delete user account
export async function deleteUserAccount(): Promise<void> {
  try {
    // Note: In Appwrite, you need to use server-side SDK to delete users
    // For client-side, we just delete the session
    await account.deleteSession("current");
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Delete account error:", appwriteError.message);
    throw error;
  }
}

// Check if user is logged in
export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
