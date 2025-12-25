"use client";
import React, { useEffect, useState } from "react";
import BellFillSvg from "@/public/assets/bell-fill.svg";
import BellSvg from "@/public/assets/bell.svg";
import styles from "./component.module.css";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { convertFromUnix, getCurrentUnixDate } from "@/app/lib/formatDateUnix";
import { MediaDataFullInfo } from "@/app/ts/interfaces/anilistMediaData";
import { useAppSelector } from "@/app/lib/redux/hooks";
import { NotificationsCollectionFirebase } from "@/app/ts/interfaces/firestoreData";
import { getMediaInfo } from "@/app/api/mediaInfo/anilist/mediaInfo";
import {
  useAuthState,
  getUserDocument,
  updateUserDocument,
} from "@/app/lib/appwrite";

function NotificationsContainer() {
  const [notificationsList, setNotificationsList] = useState<
    NotificationsCollectionFirebase[]
  >([]);
  const [hasNewNotifications, setHasNewNotifications] =
    useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const anilistUser = useAppSelector((state) => state.UserInfo?.value);

  const [user] = useAuthState();

  useEffect(() => {
    if (
      localStorage.getItem("notificationsVisualized") &&
      localStorage.getItem("notificationsVisualized") == "true"
    ) {
      setHasNewNotifications(false);
    } else {
      localStorage.setItem("notificationsVisualized", "true");
    }

    doesNotificationsIsOnLocalStorage();
  }, [user]);

  function isCurrDateBiggerThanLastUpdate() {
    const dateNow = getCurrentUnixDate();
    const dateLastUpdate =
      Number(Number(localStorage.getItem("notificationsLastUpdate")) + 600) ||
      0;

    return dateNow >= dateLastUpdate;
  }

  async function doesNotificationsIsOnLocalStorage() {
    if (!user && !anilistUser) return;

    if (localStorage.getItem("notifications") == undefined) {
      return verifyNotificationsAssignedThenStore();
    }

    updateNotificationsOnLocalStorage();
  }

  function setNewNotificationsToPanel(
    notificationsList: NotificationsCollectionFirebase[]
  ) {
    if (notificationsList.length == 0) return;

    localStorage.setItem("notificationsVisualized", "false");

    setHasNewNotifications(true);

    setNotificationsList(notificationsList);
  }

  async function mapUserAssignedNotificationsToFullMediaDoc() {
    const userId = user?.$id || `${anilistUser?.id}`;
    const userDoc = await getUserDocument(userId);

    if (!userDoc) return [];

    let userAssignedNotifications = JSON.parse(userDoc.notifications || "[]");

    if (userAssignedNotifications.length > 0) {
      // For now, we'll use local storage for notifications since we don't have a notifications collection
      // This is a simplified version - in production you'd want a proper notifications system
      userAssignedNotifications = userAssignedNotifications.map((notification: NotificationsCollectionFirebase) => ({
        ...notification,
        episodes: notification.episodes?.sort(
          (episode1, episode2) => episode1.number - episode2.number
        ) || []
      }));

      userAssignedNotifications = userAssignedNotifications.map((media: NotificationsCollectionFirebase) => ({
        ...media,
        episodes: media.episodes?.length > 0 ? [media.episodes[media.episodes.length - 1]] : []
      }));
    }

    return userAssignedNotifications;
  }

  async function verifyNotificationsAssignedThenStore() {
    const userAssignedNotifications =
      await mapUserAssignedNotificationsToFullMediaDoc();

    localStorage.setItem("notificationsVisualized", "true");
    localStorage.setItem(
      "notifications",
      JSON.stringify(userAssignedNotifications)
    );
    localStorage.setItem(
      "notificationsLastUpdate",
      `${(new Date().getTime() / 1000).toFixed(0)}`
    );

    setNewNotificationsToPanel(userAssignedNotifications);
  }

  async function updateNotificationsOnLocalStorage() {
    const userAssignedNotifications =
      await mapUserAssignedNotificationsToFullMediaDoc();

    if (isCurrDateBiggerThanLastUpdate()) {
      if (userAssignedNotifications) {
        const notificationsToBeShownList: NotificationsCollectionFirebase[] = [];

        for (let i = 0; userAssignedNotifications.length >= i + 1; i++) {
          const notificationsMatchingIDsList = userAssignedNotifications.find(
            (notification: NotificationsCollectionFirebase) =>
              `${notification.mediaId}` ==
              `${userAssignedNotifications[i].mediaId}`
          );

          if (notificationsMatchingIDsList) {
            if (!notificationsMatchingIDsList.title)
              notificationsMatchingIDsList.title =
                userAssignedNotifications[i].title;

            const lastEpisodeNotificationVisualizedOnDB =
              notificationsMatchingIDsList.episodes[
                notificationsMatchingIDsList.episodes.length - 1
              ];

            const lastEpisodeNotificationVisualizedOnLocal =
              userAssignedNotifications[i];

            if (
              lastEpisodeNotificationVisualizedOnDB?.number >
              lastEpisodeNotificationVisualizedOnLocal.lastEpisodeNotified
            ) {
              if (
                Number((new Date().getTime() / 1000).toFixed(0)) >
                lastEpisodeNotificationVisualizedOnDB.releaseDate!
              ) {
                notificationsToBeShownList.push(notificationsMatchingIDsList);
              }
            }
          }
        }

        if (notificationsToBeShownList.length > 0) {
          setNewNotificationsToPanel(notificationsToBeShownList);
        }

        localStorage.setItem("notificationsVisualized", "true");
        localStorage.setItem(
          "notifications",
          JSON.stringify(userAssignedNotifications)
        );
        localStorage.setItem(
          "notificationsLastUpdate",
          `${(new Date().getTime() / 1000).toFixed(0)}`
        );
      }
    }
  }

  async function toggleOpenNotificationsPanel() {
    setIsPanelOpen(!isPanelOpen);

    localStorage.setItem("notificationsVisualized", "true");

    setHasNewNotifications(false);

    if (notificationsList.length == 0) return;

    const stillReleasingMediasNotifications: NotificationsCollectionFirebase[] =
      notificationsList.filter(
        (mediaNotification) => mediaNotification.isComplete == false
      );

    const finishedMediasNotifications: NotificationsCollectionFirebase[] =
      notificationsList.filter(
        (mediaNotification) => mediaNotification.isComplete == true
      );

    const userId = user?.$id || `${anilistUser?.id}`;

    async function updateNotificationsOnLocal() {
      const userDoc = await getUserDocument(userId);
      const notificationsOnUserDoc = JSON.parse(userDoc?.notifications || "[]");

      localStorage.setItem(
        "notifications",
        JSON.stringify(notificationsOnUserDoc)
      );
      localStorage.setItem(
        "notificationsLastUpdate",
        `${(new Date().getTime() / 1000).toFixed(0)}`
      );
    }

    if (stillReleasingMediasNotifications.length > 0) {
      for (const mediaNotification of stillReleasingMediasNotifications) {
        const mediaInfo = (await getMediaInfo({
          id: Number(mediaNotification.mediaId),
        })) as MediaDataFullInfo;

        // Update user notifications in Appwrite
        const userDoc = await getUserDocument(userId);
        if (userDoc) {
          const currentNotifications = JSON.parse(userDoc.notifications || "[]");
          const updatedNotifications = currentNotifications.map((n: { mediaId: number }) => {
            if (n.mediaId === mediaInfo.id) {
              return {
                ...n,
                lastEpisodeNotified: mediaInfo.nextAiringEpisode
                  ? mediaInfo.nextAiringEpisode.episode - 1
                  : mediaInfo.episodes,
              };
            }
            return n;
          });

          await updateUserDocument(userId, {
            notifications: JSON.stringify(updatedNotifications),
          });
        }
      }
    }

    updateNotificationsOnLocal();
  }

  if (user || anilistUser) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          id={styles.notification_container}
        >
          <button
            id={styles.notification_btn}
            onClick={() => toggleOpenNotificationsPanel()}
            title={isPanelOpen ? "Close Notifications" : "Open Notifications"}
            aria-controls={styles.results_container}
            data-active={isPanelOpen}
          >
            {hasNewNotifications ? (
              <BellFillSvg fill="white" width={16} height={16} />
            ) : (
              <BellSvg fill="white" width={16} height={16} />
            )}
          </button>

          {hasNewNotifications && (
            <span id={styles.notifications_badge}>
              {notificationsList.length}
            </span>
          )}

          <AnimatePresence>
            {isPanelOpen && (
              <motion.div
                initial={{ y: "-20px", opacity: 0 }}
                animate={{ y: "0px", opacity: 1 }}
                exit={{ y: "-20px", opacity: 0 }}
                id={styles.results_container}
                aria-expanded={isPanelOpen}
              >
                <h4>Latest Notifications (BETA)</h4>

                {notificationsList.length == 0 && (
                  <div>
                    <p style={{ color: "var(--white-100)" }}>
                      No New Notifications
                    </p>
                  </div>
                )}

                {notificationsList.length != 0 && (
                  <ul>
                    {notificationsList.map((media, key) => (
                      <li
                        key={key}
                        className={styles.notification_item_container}
                        aria-label={`${media.title.romaji} new episode released`}
                      >
                        <div className={styles.img_container}>
                          <Image
                            src={media.coverImage.large}
                            alt={media.title.romaji}
                            fill
                            sizes="100px"
                          />
                        </div>

                        <div className={styles.notification_item_info}>
                          <h5>
                            Episode{" "}
                            {media.episodes[media.episodes.length - 1]?.number}{" "}
                            Released!
                          </h5>

                          <small>{media.title.romaji}</small>

                          {media.status != "RELEASING" && (
                            <p>
                              <b>Watch the Season Finale!</b>
                            </p>
                          )}

                          <p>
                            Released on {convertFromUnix(media.nextReleaseDate)}
                          </p>

                          <Link href={`/media/${media.mediaId}`}>SEE MORE</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}

export default NotificationsContainer;
