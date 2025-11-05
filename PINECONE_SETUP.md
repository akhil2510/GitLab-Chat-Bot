# 🎯 Create Pinecone Index - Step by Step

## Option 1: Using the Automated Script (Easiest - 5 minutes)

### Step 1: Get Pinecone API Key

1. Go to **https://www.pinecone.io**
2. Click **"Start Free"** (no credit card needed!)
3. Sign up with Google/GitHub
4. After signup, go to **"API Keys"** in the sidebar
5. **Copy your API key** (starts with `pcsk_...`)

### Step 2: Add to .env File

```bash
# Navigate to backend folder
cd /Users/akhilesh/test/backend

# Create .env if it doesn't exist
cp ../.env.example .env

# Edit .env file (use any editor)
nano .env
```

**Add these lines:**
```env
GEMINI_API_KEY=your_gemini_key_here
PINECONE_API_KEY=pcsk_YOUR_ACTUAL_KEY_HERE  # ← Paste your key
PINECONE_ENVIRONMENT=gcp-starter
PINECONE_INDEX=gitlab-handbook
```

Save and close!

### Step 3: Run the Setup Script

```bash
# Make sure you're in backend folder
cd /Users/akhilesh/test/backend

# Install dependencies first
npm install

# Run the Pinecone setup script
npm run setup:pinecone
```

**This will:**
- ✅ Connect to Pinecone
- ✅ Create index "gitlab-handbook"
- ✅ Set dimension to 768 (for Gemini embeddings)
- ✅ Wait for it to be ready (~60 seconds)
- ✅ Confirm everything is working

**Expected output:**
```
🦊 GitLab Chatbot - Pinecone Index Setup
=========================================

📡 Connecting to Pinecone...
✅ Index is ready!

Next steps:
1. npm run scrape  (scrape GitLab data)
2. npm run index   (upload to Pinecone)
```

### Step 4: Done! Proceed to Data Collection

```bash
# Scrape GitLab data (10-30 min, one-time)
npm run scrape

# Index to Pinecone (10-20 min, one-time)
npm run index

# Start server
npm run dev
```

---

## Option 2: Manual Setup via Pinecone Dashboard (5 minutes)

If you prefer to create the index manually:

1. **Login to Pinecone:** https://app.pinecone.io
2. **Click "Create Index"**
3. **Configure:**
   - **Name:** `gitlab-handbook`
   - **Dimensions:** `768`
   - **Metric:** `cosine`
   - **Region:** Choose closest to you (or `us-east-1`)
   - **Plan:** Serverless (free tier)
4. **Click "Create Index"**
5. **Wait ~60 seconds** for it to be ready

Then add your API key to `.env` and proceed with `npm run index`!

---

## Troubleshooting

### ❌ "PINECONE_API_KEY not found"

**Solution:**
```bash
# Check if .env exists in backend folder
ls -la /Users/akhilesh/test/backend/.env

# If not, create it
cp /Users/akhilesh/test/.env.example /Users/akhilesh/test/backend/.env

# Edit and add your keys
nano /Users/akhilesh/test/backend/.env
```

### ❌ "UNAUTHENTICATED"

**Solution:**
- Your API key is wrong or incomplete
- Go to Pinecone dashboard → API Keys
- Copy the FULL key (it's long!)
- Make sure no extra spaces in .env

### ❌ "Index already exists"

**Solution:**
- Good news! Your index is already created
- Skip to: `npm run scrape` and `npm run index`

### ❌ Can't install dependencies

**Solution:**
```bash
# Clear cache and reinstall
cd /Users/akhilesh/test/backend
rm -rf node_modules package-lock.json
npm install
```

---

## Quick Reference Commands

```bash
# Full setup from scratch
cd /Users/akhilesh/test/backend
npm install
npm run setup:pinecone  # ← Creates Pinecone index
npm run scrape          # ← Scrapes GitLab data
npm run index           # ← Uploads to Pinecone
npm run dev             # ← Starts server

# In another terminal
cd /Users/akhilesh/test/frontend
pip install -r requirements.txt
streamlit run app.py    # ← Starts UI
```

---

## Verification

To verify your Pinecone index was created:

1. **Via Dashboard:**
   - Login to https://app.pinecone.io
   - You should see "gitlab-handbook" index
   - Status should be "Ready"

2. **Via Code:**
   ```bash
   # After running setup:pinecone, run:
   npm run dev
   
   # Then test:
   curl http://localhost:3000/api/chat/stats
   # Should show: "totalChunks": 0 (until you run npm run index)
   ```

---

## What's Next?

After creating the Pinecone index:

1. ✅ **Scrape data:** `npm run scrape` (one-time, 10-30 min)
2. ✅ **Index data:** `npm run index` (one-time, 10-20 min)
3. ✅ **Test locally:** `npm run dev` + `streamlit run app.py`
4. ✅ **Deploy:** See `DEPLOYMENT_SIMPLE.md`

---

**Need help? See TROUBLESHOOTING.md or open an issue!**
