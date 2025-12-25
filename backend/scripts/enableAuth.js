/**
 * Check Appwrite Auth Status
 * Note: Auth settings must be enabled manually in Appwrite Console
 */

const { Client, Users } = require('node-appwrite');

const config = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID || 'anime-max',
  apiKey: process.env.APPWRITE_API_KEY || 'YOUR_API_KEY_HERE',
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const users = new Users(client);

async function checkAuth() {
  console.log('🔐 Checking Appwrite Auth...\n');
  
  try {
    // Try to list users to verify API key works
    const usersList = await users.list();
    console.log(`✅ Auth API is working! Found ${usersList.total} users.`);
    
    console.log('\n📋 To enable auth methods, go to Appwrite Console:');
    console.log('   https://cloud.appwrite.io/console/project-anime-max/auth/settings');
    console.log('\n   Enable these methods:');
    console.log('   ✓ Email/Password');
    console.log('   ✓ Anonymous');
    console.log('   ✓ Google OAuth (optional)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAuth();
