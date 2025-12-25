# Appwrite Setup Guide

This guide explains how to set up Appwrite for AniProject.

## 1. Create Appwrite Project

1. Go to [Appwrite Console](https://cloud.appwrite.io/)
2. Create a new project (or use existing)
3. Note your **Project ID**

## 2. Create Database

1. Go to **Databases** in the sidebar
2. Click **Create Database**
3. Name it: `aniproject-db`
4. Note the **Database ID**

## 3. Create Collections

### Users Collection

1. Click **Create Collection**
2. Name: `users`
3. Set permissions:
   - **Create**: Users
   - **Read**: Users
   - **Update**: Users
   - **Delete**: Users

4. Add these attributes:

| Attribute | Type | Size | Required | Default |
|-----------|------|------|----------|---------|
| userId | String | 255 | Yes | - |
| displayName | String | 255 | No | - |
| photoURL | String | 2000 | No | - |
| isUserFromAnilist | Boolean | - | No | false |
| bookmarks | String | 1000000 | No | "[]" |
| keepWatching | String | 1000000 | No | "{}" |
| mediaListSavedByStatus | String | 1000000 | No | "{}" |
| notifications | String | 1000000 | No | "[]" |
| episodesWatched | String | 1000000 | No | "{}" |
| chaptersRead | String | 1000000 | No | "{}" |
| videoSource | String | 50 | No | "hianime" |
| mediaTitlePreferredLang | String | 50 | No | "romaji" |
| showAdultContent | Boolean | - | No | false |
| autoNextEpisode | Boolean | - | No | true |
| autoSkipIntroAndOutro | Boolean | - | No | false |
| playVideoWhenMediaAndVideoIdMismatch | Boolean | - | No | false |
| videoQuality | String | 20 | No | "auto" |
| videoSubtitleLanguage | String | 50 | No | "English" |

5. Create an **Index**:
   - Key: `userId_index`
   - Type: Key
   - Attributes: `userId`
   - Order: ASC

### Notifications Collection (Optional)

1. Click **Create Collection**
2. Name: `notifications`
3. Add attributes as needed for your notification system

## 4. Set Up Authentication

1. Go to **Auth** in the sidebar
2. Enable these providers:
   - **Email/Password**: Enable
   - **Anonymous**: Enable
   - **Google OAuth**: 
     - Enable
     - Add your Google OAuth credentials
     - Set redirect URLs

## 5. Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=aniproject-db
```

## 6. Platform Configuration

1. Go to **Overview** → **Integrations** → **Platforms**
2. Add a **Web** platform:
   - Name: AniProject Web
   - Hostname: `localhost` (for dev)
   - Add your production domain when deploying

## Quick Setup Script

You can also create collections programmatically. Here's a Node.js script:

```javascript
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('your-project-id')
  .setKey('your-api-key');

const databases = new Databases(client);

async function setup() {
  // Create database
  const db = await databases.create('aniproject-db', 'AniProject Database');
  
  // Create users collection
  const users = await databases.createCollection(
    db.$id,
    'users',
    'Users',
    [
      // Add permissions
    ]
  );
  
  // Add attributes...
  await databases.createStringAttribute(db.$id, users.$id, 'userId', 255, true);
  // ... add more attributes
}

setup();
```

## Migrating from Firebase

If you have existing Firebase data:

1. Export data from Firebase Firestore
2. Transform the data to match Appwrite schema
3. Import using Appwrite SDK or REST API

The main differences:
- Firebase uses nested objects, Appwrite uses flat JSON strings for complex data
- Firebase has real-time listeners, Appwrite uses polling or Realtime subscriptions
- Firebase Auth UIDs map to Appwrite user `$id`
