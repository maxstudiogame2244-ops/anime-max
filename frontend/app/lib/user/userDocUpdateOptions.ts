import {
  addToBookmarks,
  removeFromBookmarks,
  updateMediaListByStatus,
  removeMediaFromStatusList,
} from "@/app/lib/appwrite/database";

type UpdateFavourites = {
  mediaData: {
    id: number;
    title: {
      romaji: string;
    };
    format: string;
    description?: string;
    coverImage: {
      extraLarge: string;
      large: string;
    };
  };
  userId: string;
  isAddAction: boolean;
};

export async function updateUserFavouriteMedias({
  mediaData,
  userId,
  isAddAction,
}: UpdateFavourites): Promise<boolean> {
  if (isAddAction) {
    return await addToBookmarks(userId, mediaData);
  } else {
    return await removeFromBookmarks(userId, mediaData.id);
  }
}

export async function updateUserMediaListByStatus({
  status,
  mediaData,
  userId,
}: {
  status: string;
  mediaData: UpdateFavourites["mediaData"];
  userId: string;
}): Promise<boolean> {
  return await updateMediaListByStatus(userId, status, mediaData);
}

export async function removeMediaOnListByStatus({
  status,
  mediaId,
  userId,
}: {
  status: string;
  mediaId: number;
  userId: string;
}): Promise<boolean> {
  return await removeMediaFromStatusList(userId, status, mediaId);
}
