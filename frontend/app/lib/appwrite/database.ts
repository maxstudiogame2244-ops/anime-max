import { databases, APPWRITE_CONFIG, ID, Query } from "@/app/appwriteClient";
import { AppwriteException } from "appwrite";

const { databaseId, collections } = APPWRITE_CONFIG;

// User document interface matching the Firebase structure
export interface UserDocument {
  $id?: string;
  userId: string;
  displayName?: string;
  photoURL?: string;
  isUserFromAnilist?: boolean;
  bookmarks: string; // JSON stringified array
  keepWatching: string; // JSON stringified object
  mediaListSavedByStatus: string; // JSON stringified object
  notifications: string; // JSON stringified array
  episodesWatched: string; // JSON stringified object
  chaptersRead: string; // JSON stringified object
  videoSource: string;
  mediaTitlePreferredLang: string;
  showAdultContent: boolean;
  autoNextEpisode: boolean;
  autoSkipIntroAndOutro: boolean;
  playVideoWhenMediaAndVideoIdMismatch: boolean;
  videoQuality: string;
  videoSubtitleLanguage: string;
}

// Default values for new user
const defaultUserDocValues = {
  bookmarks: "[]",
  keepWatching: "{}",
  mediaListSavedByStatus: "{}",
  notifications: "[]",
  episodesWatched: "{}",
  chaptersRead: "{}",
  videoSource: "hianime",
  mediaTitlePreferredLang: "romaji",
  showAdultContent: false,
  autoNextEpisode: true,
  autoSkipIntroAndOutro: false,
  playVideoWhenMediaAndVideoIdMismatch: false,
  videoQuality: "auto",
  videoSubtitleLanguage: "English",
};

// Get user document by userId
export async function getUserDocument(userId: string): Promise<UserDocument | null> {
  try {
    const response = await databases.listDocuments(
      databaseId,
      collections.users,
      [Query.equal("userId", userId)]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0] as unknown as UserDocument;
    }
    return null;
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Get user document error:", appwriteError.message);
    return null;
  }
}

// Create new user document
export async function createUserDocument(
  userId: string,
  data?: Partial<UserDocument>
): Promise<UserDocument | null> {
  try {
    // Check if user already exists
    const existingUser = await getUserDocument(userId);
    if (existingUser) {
      return existingUser;
    }

    const documentData = {
      userId,
      ...defaultUserDocValues,
      ...data,
    };

    const response = await databases.createDocument(
      databaseId,
      collections.users,
      ID.unique(),
      documentData
    );

    return response as unknown as UserDocument;
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Create user document error:", appwriteError.message);
    return null;
  }
}

// Update user document
export async function updateUserDocument(
  userId: string,
  data: Partial<UserDocument>
): Promise<UserDocument | null> {
  try {
    const userDoc = await getUserDocument(userId);
    if (!userDoc || !userDoc.$id) {
      console.error("User document not found");
      return null;
    }

    const response = await databases.updateDocument(
      databaseId,
      collections.users,
      userDoc.$id,
      data
    );

    return response as unknown as UserDocument;
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Update user document error:", appwriteError.message);
    return null;
  }
}

// Delete user document
export async function deleteUserDocument(userId: string): Promise<boolean> {
  try {
    const userDoc = await getUserDocument(userId);
    if (!userDoc || !userDoc.$id) {
      return false;
    }

    await databases.deleteDocument(databaseId, collections.users, userDoc.$id);
    return true;
  } catch (error) {
    const appwriteError = error as AppwriteException;
    console.error("Delete user document error:", appwriteError.message);
    return false;
  }
}

// Helper functions for specific fields

// Get user's adult content preference
export async function getUserAdultContentPreference(userId: string): Promise<boolean> {
  const userDoc = await getUserDocument(userId);
  return userDoc?.showAdultContent || false;
}

// Update bookmarks (favourites)
export async function updateUserBookmarks(
  userId: string,
  bookmarks: unknown[]
): Promise<boolean> {
  const result = await updateUserDocument(userId, {
    bookmarks: JSON.stringify(bookmarks),
  });
  return result !== null;
}

// Add to bookmarks
export async function addToBookmarks(
  userId: string,
  mediaData: unknown
): Promise<boolean> {
  const userDoc = await getUserDocument(userId);
  if (!userDoc) return false;

  const currentBookmarks = JSON.parse(userDoc.bookmarks || "[]");
  
  // Check if already exists
  const exists = currentBookmarks.some(
    (item: { id: number }) => item.id === (mediaData as { id: number }).id
  );
  
  if (!exists) {
    currentBookmarks.push(mediaData);
    return await updateUserBookmarks(userId, currentBookmarks);
  }
  
  return true;
}

// Remove from bookmarks
export async function removeFromBookmarks(
  userId: string,
  mediaId: number
): Promise<boolean> {
  const userDoc = await getUserDocument(userId);
  if (!userDoc) return false;

  const currentBookmarks = JSON.parse(userDoc.bookmarks || "[]");
  const filteredBookmarks = currentBookmarks.filter(
    (item: { id: number }) => item.id !== mediaId
  );
  
  return await updateUserBookmarks(userId, filteredBookmarks);
}

// Update keep watching
export async function updateKeepWatching(
  userId: string,
  mediaId: string | number,
  episodeData: unknown
): Promise<boolean> {
  const userDoc = await getUserDocument(userId);
  if (!userDoc) return false;

  const keepWatching = JSON.parse(userDoc.keepWatching || "{}");
  keepWatching[mediaId] = episodeData;

  const result = await updateUserDocument(userId, {
    keepWatching: JSON.stringify(keepWatching),
  });
  return result !== null;
}

// Update episodes watched
export async function updateEpisodesWatched(
  userId: string,
  mediaId: string | number,
  episodeData: unknown
): Promise<boolean> {
  const userDoc = await getUserDocument(userId);
  if (!userDoc) return false;

  const episodesWatched = JSON.parse(userDoc.episodesWatched || "{}");
  
  if (!episodesWatched[mediaId]) {
    episodesWatched[mediaId] = [];
  }
  
  // Check if episode already exists
  const exists = episodesWatched[mediaId].some(
    (ep: { episodeNumber: number }) => 
      ep.episodeNumber === (episodeData as { episodeNumber: number }).episodeNumber
  );
  
  if (!exists) {
    episodesWatched[mediaId].push(episodeData);
  }

  const result = await updateUserDocument(userId, {
    episodesWatched: JSON.stringify(episodesWatched),
  });
  return result !== null;
}

// Update media list by status (watching, completed, etc.)
export async function updateMediaListByStatus(
  userId: string,
  status: string,
  mediaData: unknown
): Promise<boolean> {
  const userDoc = await getUserDocument(userId);
  if (!userDoc) return false;

  const mediaList = JSON.parse(userDoc.mediaListSavedByStatus || "{}");
  const statusKey = status.toLowerCase();
  
  if (!mediaList[statusKey]) {
    mediaList[statusKey] = [];
  }
  
  // Check if already exists
  const exists = mediaList[statusKey].some(
    (item: { id: number }) => item.id === (mediaData as { id: number }).id
  );
  
  if (!exists) {
    mediaList[statusKey].push(mediaData);
  }

  const result = await updateUserDocument(userId, {
    mediaListSavedByStatus: JSON.stringify(mediaList),
  });
  return result !== null;
}

// Remove media from status list
export async function removeMediaFromStatusList(
  userId: string,
  status: string,
  mediaId: number
): Promise<boolean> {
  const userDoc = await getUserDocument(userId);
  if (!userDoc) return false;

  const mediaList = JSON.parse(userDoc.mediaListSavedByStatus || "{}");
  const statusKey = status.toLowerCase();
  
  if (mediaList[statusKey]) {
    mediaList[statusKey] = mediaList[statusKey].filter(
      (item: { id: number }) => item.id !== mediaId
    );
  }

  const result = await updateUserDocument(userId, {
    mediaListSavedByStatus: JSON.stringify(mediaList),
  });
  return result !== null;
}
