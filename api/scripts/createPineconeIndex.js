import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

async function createPineconeIndex() {
  try {
    console.log('🦊 GitLab Chatbot - Pinecone Index Setup');
    console.log('=========================================\n',process.env);
   
    // Check for API key
    if (!process.env.PINECONE_API_KEY) {
      console.error('❌ Error: PINECONE_API_KEY not found in .env file');
      console.log('\nPlease:');
      console.log('1. Go to https://www.pinecone.io');
      console.log('2. Sign up for free');
      console.log('3. Get your API key from the dashboard');
      console.log('4. Add it to backend/.env as PINECONE_API_KEY=your_key_here');
      process.exit(1);
    }

    // Initialize Pinecone
    console.log('📡 Connecting to Pinecone...');
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    const indexName = process.env.PINECONE_INDEX || 'gitlab-handbook';
    const dimension = 768; // Gemini embedding-001 dimension

    // Check if index already exists
    console.log(`\n🔍 Checking if index '${indexName}' exists...`);
    const indexList = await pinecone.listIndexes();
    const indexExists = indexList.indexes?.some(idx => idx.name === indexName);

    if (indexExists) {
      console.log(`✅ Index '${indexName}' already exists!`);
      console.log('\nYou can now run:');
      console.log('  npm run index  (to upload your data)');
      process.exit(0);
    }

    // Create new index
    console.log(`\n📦 Creating new index '${indexName}'...`);
    console.log(`   Dimension: ${dimension}`);
    console.log(`   Metric: cosine`);
    console.log(`   Type: Serverless (AWS us-east-1)`);

    await pinecone.createIndex({
      name: indexName,
      dimension: dimension,
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1'
        }
      }
    });

    console.log('\n⏳ Waiting for index to be ready (this takes ~60 seconds)...');
    
    // Wait for index to be ready
    let ready = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!ready && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      try {
        const index = pinecone.index(indexName);
        const stats = await index.describeIndexStats();
        
        if (stats) {
          ready = true;
          console.log('✅ Index is ready!');
        }
      } catch (error) {
        process.stdout.write('.');
      }
    }

    if (!ready) {
      console.log('\n⚠️  Index creation initiated but may take a few more minutes to be fully ready.');
      console.log('Please wait a few minutes before running npm run index');
    }

    console.log('\n=========================================');
    console.log('✅ Pinecone index setup complete!');
    console.log('\nNext steps:');
    console.log('1. npm run scrape  (scrape GitLab data)');
    console.log('2. npm run index   (upload to Pinecone)');
    console.log('3. npm run dev     (start the server)');
    console.log('\nIndex details:');
    console.log(`  Name: ${indexName}`);
    console.log(`  Dimension: ${dimension}`);
    console.log(`  Region: us-east-1`);
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ Error creating Pinecone index:', error.message);
    
    if (error.message.includes('UNAUTHENTICATED')) {
      console.log('\n⚠️  Authentication failed. Please check:');
      console.log('1. Your PINECONE_API_KEY is correct');
      console.log('2. You copied the full API key from Pinecone dashboard');
    } else if (error.message.includes('ALREADY_EXISTS')) {
      console.log(`\n✅ Index '${process.env.PINECONE_INDEX || 'gitlab-handbook'}' already exists!`);
      console.log('You can proceed to: npm run index');
    } else {
      console.log('\nTroubleshooting:');
      console.log('- Make sure you have a Pinecone account');
      console.log('- Check your API key is correct');
      console.log('- Try again in a few moments');
    }
    
    process.exit(1);
  }
}

createPineconeIndex();
