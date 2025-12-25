/**
 * Appwrite Database Setup Script
 * Run this once to create the database and collections
 * 
 * Usage: node scripts/setupAppwrite.js
 */

const { Client, Databases, ID } = require('node-appwrite');

// Your Appwrite credentials
const config = {
  endpoint: 'https://sgp.cloud.appwrite.io/v1',
  projectId: 'anime-max',
  apiKey: 'standard_62392f9ca6721b57a5f7f4c61da860b34551fecbb090232a719f1e46d25039b646147bc832ada385f39d40e42373f764912352e126346ef69c39e325c8a546208005a9e6253b173f2818f2cccba3d472c53a9a13d77b0169c1a7dc41f0b992cbe677d6447c60b50683c93c679df7f4117d48e19808bbc49c5164ef978620825e',
  databaseId: 'aniproject-db',
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);

async function setup() {
  console.log('🚀 Starting Appwrite setup...\n');

  try {
    // Step 1: Create Database
    console.log('📦 Creating database...');
    let database;
    try {
      database = await databases.create(config.databaseId, 'AniProject Database');
      console.log('✅ Database created:', database.$id);
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Database already exists, continuing...');
        database = { $id: config.databaseId };
      } else {
        throw error;
      }
    }

    // Step 2: Create Users Collection
    console.log('\n👤 Creating users collection...');
    let usersCollection;
    try {
      usersCollection = await databases.createCollection(
        database.$id,
        'users',
        'Users',
        [
          // Permissions: Any authenticated user can read/write their own docs
          'read("users")',
          'create("users")',
          'update("users")',
          'delete("users")',
        ]
      );
      console.log('✅ Users collection created:', usersCollection.$id);
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Users collection already exists, continuing...');
        usersCollection = { $id: 'users' };
      } else {
        throw error;
      }
    }

    // Step 3: Create Attributes for Users Collection
    console.log('\n📝 Creating attributes...');
    
    const attributes = [
      { name: 'userId', type: 'string', size: 255, required: true },
      { name: 'displayName', type: 'string', size: 255, required: false },
      { name: 'photoURL', type: 'string', size: 2000, required: false },
      { name: 'isUserFromAnilist', type: 'boolean', required: false, default: false },
      { name: 'bookmarks', type: 'string', size: 1000000, required: false, default: '[]' },
      { name: 'keepWatching', type: 'string', size: 1000000, required: false, default: '{}' },
      { name: 'mediaListSavedByStatus', type: 'string', size: 1000000, required: false, default: '{}' },
      { name: 'notifications', type: 'string', size: 1000000, required: false, default: '[]' },
      { name: 'episodesWatched', type: 'string', size: 1000000, required: false, default: '{}' },
      { name: 'chaptersRead', type: 'string', size: 1000000, required: false, default: '{}' },
      { name: 'videoSource', type: 'string', size: 50, required: false, default: 'hianime' },
      { name: 'mediaTitlePreferredLang', type: 'string', size: 50, required: false, default: 'romaji' },
      { name: 'showAdultContent', type: 'boolean', required: false, default: false },
      { name: 'autoNextEpisode', type: 'boolean', required: false, default: true },
      { name: 'autoSkipIntroAndOutro', type: 'boolean', required: false, default: false },
      { name: 'playVideoWhenMediaAndVideoIdMismatch', type: 'boolean', required: false, default: false },
      { name: 'videoQuality', type: 'string', size: 20, required: false, default: 'auto' },
      { name: 'videoSubtitleLanguage', type: 'string', size: 50, required: false, default: 'English' },
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            database.$id,
            usersCollection.$id,
            attr.name,
            attr.size,
            attr.required,
            attr.default || null
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            database.$id,
            usersCollection.$id,
            attr.name,
            attr.required,
            attr.default
          );
        }
        console.log(`  ✅ ${attr.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`  ℹ️  ${attr.name} already exists`);
        } else {
          console.log(`  ❌ ${attr.name}: ${error.message}`);
        }
      }
    }

    // Step 4: Create Index on userId
    console.log('\n🔍 Creating index...');
    try {
      await databases.createIndex(
        database.$id,
        usersCollection.$id,
        'userId_index',
        'key',
        ['userId'],
        ['ASC']
      );
      console.log('✅ Index created on userId');
    } catch (error) {
      if (error.code === 409) {
        console.log('ℹ️  Index already exists');
      } else {
        console.log('❌ Index error:', error.message);
      }
    }

    console.log('\n🎉 Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Go to Appwrite Console → Auth → Settings');
    console.log('2. Enable Email/Password authentication');
    console.log('3. Enable Anonymous authentication');
    console.log('4. (Optional) Set up Google OAuth');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
  }
}

setup();
