import { createUserDocument, updateUserDocument, addToBookmarks } from "@/app/lib/appwrite/database";
import { addUserCookies } from "./anilistUserLoginOptions";
import { AppwriteUser } from "@/app/lib/appwrite/auth";

type CreateUserComponentTypes = {
  userId?: string;
  userAppwrite?: AppwriteUser;
  userAnilist?: UserAnilist;
  isAnonymous?: boolean;
  openMenuFunctionHook?: React.Dispatch<React.SetStateAction<boolean>>;
};

export async function createNewUserDocument({
  userId,
  userAppwrite,
  userAnilist,
  isAnonymous,
  openMenuFunctionHook,
}: CreateUserComponentTypes) {
  const finalUserId = userId || userAppwrite?.$id || `${userAnilist?.id}`;
  
  if (!finalUserId) return null;

  // Create user document in Appwrite
  const userDoc = await createUserDocument(finalUserId, {
    displayName: isAnonymous ? "Anonymous" : userAppwrite?.name || userAnilist?.name,
    photoURL: isAnonymous
      ? "https://i.pinimg.com/736x/fc/4e/f7/fc4ef7ec7265a1ebb69b4b8d23982d9d.jpg"
      : userAnilist?.avatar?.large || userAnilist?.avatar?.medium,
    isUserFromAnilist: !!userAnilist,
    showAdultContent: userAnilist?.options?.displayAdultContent || false,
  });

  if (!userDoc) {
    console.error("Failed to create user document");
    return null;
  }

  // If user already exists, update with Anilist data
  if (userAnilist) {
    updatesUserDocWithAnilistFavourites({
      favourites: userAnilist.favourites,
      userId: finalUserId,
    });

    localStorage.setItem("anilist-user", JSON.stringify(userAnilist));

    addUserCookies({
      isAdultContentEnabled: `${userAnilist?.options?.displayAdultContent || false}`,
      subtitleLanguage: "English",
      titleLanguage: userAnilist?.options?.titleLanguage || "romaji",
      playWrongMedia: "false",
    });

    return userAnilist;
  }

  if (openMenuFunctionHook) openMenuFunctionHook(true);

  return userDoc;
}

async function updatesUserDocWithAnilistFavourites({
  favourites,
  userId,
}: {
  favourites: UserAnilist["favourites"];
  userId: string;
}) {
  const userFavouritesAnimesList = favourites?.anime?.nodes || [];
  const userFavouritesMangasList = favourites?.manga?.nodes || [];

  const allAnilistFavouritesOnSameList = [
    ...userFavouritesAnimesList,
    ...userFavouritesMangasList,
  ];

  if (allAnilistFavouritesOnSameList.length > 0) {
    for (const favouriteMedia of allAnilistFavouritesOnSameList) {
      await addToBookmarks(userId, favouriteMedia);
    }
  }
}
