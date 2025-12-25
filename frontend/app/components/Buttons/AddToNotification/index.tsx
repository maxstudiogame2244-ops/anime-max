"use client";
import React, { useEffect, useState } from "react";
import styles from "./component.module.css";
import LoadingSvg from "@/public/assets/ripple-1s-200px.svg";
import BellFillSvg from "@/public/assets/bell-fill.svg";
import BellSvg from "@/public/assets/bell-slash.svg";
import {
  MediaData,
  MediaDataFullInfo,
} from "@/app/ts/interfaces/anilistMediaData";
import { useAuthState, getUserDocument, updateUserDocument } from "@/app/lib/appwrite";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/app/lib/redux/hooks";
import { toggleShowLoginModalValue } from "@/app/lib/redux/features/loginModal";

function AddToNotificationsButton({
  mediaInfo,
}: {
  mediaInfo: MediaData | MediaDataFullInfo;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wasAddedToNotifications, setWasAddedToNotifications] =
    useState<boolean>(false);

  const anilistUser = useAppSelector((state) => state.UserInfo.value);
  const dispatch = useAppDispatch();

  const { user, loading } = useAuthState();

  useEffect(() => {
    if (!loading) {
      isUserAssignedToThisMediaNotications();
    }
  }, [user, anilistUser, loading]);

  const isMediaStillReleasing = mediaInfo.nextAiringEpisode?.airingAt ?? false;

  async function isUserAssignedToThisMediaNotications() {
    if (!user && !anilistUser) return;

    const userId = user?.$id || `${anilistUser?.id}`;
    const userDoc = await getUserDocument(userId);
    
    if (!userDoc) return;

    const notifications = userDoc.notifications ? JSON.parse(userDoc.notifications) : [];
    const isOnNotifications = notifications.some(
      (notification: { id: number }) => notification.id === mediaInfo.id
    );

    setWasAddedToNotifications(isOnNotifications);
  }

  async function handleMediaOnNotifications() {
    if (!user && !anilistUser) return dispatch(toggleShowLoginModalValue());

    setIsLoading(true);

    const userId = user?.$id || `${anilistUser?.id}`;
    const userDoc = await getUserDocument(userId);
    
    if (!userDoc) {
      setIsLoading(false);
      return;
    }

    const notifications = userDoc.notifications ? JSON.parse(userDoc.notifications) : [];

    if (wasAddedToNotifications) {
      // Remove from notifications
      const updatedNotifications = notifications.filter(
        (notification: { id: number }) => notification.id !== mediaInfo.id
      );

      await updateUserDocument(userId, {
        notifications: JSON.stringify(updatedNotifications),
      });

      setWasAddedToNotifications(false);
    } else {
      // Add to notifications
      const newNotification = {
        id: mediaInfo.id,
        title: {
          romaji: mediaInfo.title.romaji,
        },
        coverImage: {
          extraLarge: mediaInfo.coverImage?.extraLarge,
          large: mediaInfo.coverImage?.large,
        },
        isComplete: mediaInfo.status === "FINISHED",
        lastEpisodeWatched: null,
        nextAiringEpisode: mediaInfo.nextAiringEpisode,
      };

      notifications.push(newNotification);

      await updateUserDocument(userId, {
        notifications: JSON.stringify(notifications),
      });

      setWasAddedToNotifications(true);
    }

    setIsLoading(false);
  }

  return (
    <motion.button
      id={styles.container}
      onClick={() => handleMediaOnNotifications()}
      disabled={isLoading || !isMediaStillReleasing}
      data-active={wasAddedToNotifications}
      title={
        !isMediaStillReleasing
          ? "No Episodes to be Released"
          : wasAddedToNotifications
          ? "Remove from Notifications"
          : "Add to Notifications"
      }
      whileTap={{ scale: 0.85 }}
    >
      {isLoading ? (
        <LoadingSvg alt="Loading Icon" width={16} height={16} />
      ) : wasAddedToNotifications ? (
        <BellFillSvg alt="A Filled Bell Ringing" width={16} height={16} />
      ) : (
        <BellSvg alt="A Bell Ringing" width={16} height={16} />
      )}
    </motion.button>
  );
}

export default AddToNotificationsButton;
