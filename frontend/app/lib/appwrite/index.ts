// Appwrite client and config
export { account, databases, client, APPWRITE_CONFIG, ID, Query } from "@/app/appwriteClient";

// Auth functions
export {
  getCurrentUser,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInAnonymously,
  signOut,
  updateUserProfile,
  updateUserPrefs,
  deleteUserAccount,
  isLoggedIn,
  type AppwriteUser,
} from "./auth";

// Auth hooks
export {
  useAuthState,
  useSignIn,
  useSignUp,
  useSignOut,
} from "./useAuth";

// Database functions
export {
  getUserDocument,
  createUserDocument,
  updateUserDocument,
  deleteUserDocument,
  getUserAdultContentPreference,
  updateUserBookmarks,
  addToBookmarks,
  removeFromBookmarks,
  updateKeepWatching,
  updateEpisodesWatched,
  updateMediaListByStatus,
  removeMediaFromStatusList,
  type UserDocument,
} from "./database";
