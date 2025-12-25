import { Client, Account, Databases, ID, Query } from "appwrite";

// Appwrite Configuration
const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "anime-max",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "animemax-db",
};

// Initialize Appwrite Client
const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

// Export services
export const account = new Account(client);
export const databases = new Databases(client);

// Export config for use in other files
export const APPWRITE_CONFIG = {
  databaseId: appwriteConfig.databaseId,
  collections: {
    users: "users",
    notifications: "notifications",
  },
};

// Export utilities
export { ID, Query };

// Export client for advanced usage
export { client };
