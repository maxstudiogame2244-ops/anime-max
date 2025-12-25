import { getUserAdultContentPreference as getAdultPref } from "@/app/lib/appwrite/database";

export async function getUserAdultContentPreference(userId: string): Promise<boolean> {
  return await getAdultPref(userId);
}
