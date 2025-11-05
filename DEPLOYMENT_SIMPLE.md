# 🚀 QUICK DEPLOYMENT GUIDE (For Assignment Submission)

## Why Pinecone Instead of ChromaDB?

**ChromaDB** requires hosting a separate database server, which adds complexity and cost for deployment.

**Pinecone** is a fully managed cloud vector database with:
- ✅ **Free tier** (1M vectors, perfect for assignments)
- ✅ **No server to maintain** (just API calls)
- ✅ **Easy deployment** (works on Vercel/serverless)
- ✅ **Persistent storage** (data survives restarts)
- ✅ **Fast setup** (5 minutes)

Perfect for low-usage assignments that need to be shareable!

---

## 🎯 Setup for Deployment (15 Minutes Total)

### Step 1: Get Free Pinecone Account (3 minutes)

1. Go to https://www.pinecone.io
2. Click "Start Free"
3. Sign up with Google/GitHub
4. Create a new project
5. Go to "API Keys" → Copy your API key
6. Note your environment (e.g., "gcp-starter")

### Step 2: Get Gemini API Key (2 minutes)

1. Go to https://aistudio.google.com
2. Click "Get API Key"
3. Copy your key

### Step 3: Setup Locally (5 minutes)

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && pip install -r requirements.txt

# Setup environment
cp ../.env.example backend/.env

# Edit backend/.env and add:
GEMINI_API_KEY=your_gemini_key_here
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_ENVIRONMENT=gcp-starter
PINECONE_INDEX=gitlab-handbook
```

### Step 4: Scrape & Index Data (20-40 minutes, one-time)

```bash
cd backend

# Scrape GitLab data (10-30 min)
npm run scrape

# Index to Pinecone (10-20 min) - this uploads to cloud
npm run index
```

**Important**: Once indexed to Pinecone, your data is stored in the cloud permanently. You won't need to re-index on deployment!

### Step 5: Test Locally (2 minutes)

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && streamlit run app.py
```

Open http://localhost:8501 and test!

---

## 🚀 Deploy to Cloud (10 Minutes)

### Option A: Deploy Backend to Vercel (Recommended)

**Why Vercel?**
- Free tier perfect for assignments
- Serverless (auto-scales, pay per use)
- Works great with Pinecone (both are API-based)

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   vercel
   ```

3. **Add Environment Variables in Vercel Dashboard**
   - Go to your project on vercel.com
   - Settings → Environment Variables
   - Add:
     - `GEMINI_API_KEY`
     - `PINECONE_API_KEY`
     - `PINECONE_ENVIRONMENT`
     - `PINECONE_INDEX`
     - `NODE_ENV=production`

4. **Redeploy**
   ```bash
   vercel --prod
   ```

5. **Note your backend URL**: `https://your-project.vercel.app`

### Option B: Deploy Backend to Railway

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select your repo, set root directory to `backend`
4. Add environment variables (same as above)
5. Deploy!

### Deploy Frontend to Streamlit Cloud

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Streamlit Cloud**
   - Go to https://share.streamlit.io
   - "New app"
   - Connect your GitHub repo
   - Set main file: `frontend/app.py`
   - Add secret in "Advanced settings":
     ```toml
     BACKEND_URL = "https://your-backend.vercel.app"
     ```
   - Click "Deploy"!

3. **Get your public URL**: `https://yourapp.streamlit.app`

---

## 📝 For Assignment Submission

**You'll need to provide:**

1. ✅ GitHub Repository URL
2. ✅ Live App URL (Streamlit link)
3. ✅ Project write-up (use PROJECT_DOCUMENTATION.md)

**Example submission:**
```
- GitHub: https://github.com/yourusername/gitlab-chatbot
- Live Demo: https://gitlab-chatbot.streamlit.app
- Write-up: [Link to Google Doc with PROJECT_DOCUMENTATION content]
```

---

## 💰 Cost Breakdown (All FREE for Assignment!)

| Service | Free Tier | Usage for Assignment |
|---------|-----------|---------------------|
| Gemini API | 1,500 calls/day | ✅ More than enough |
| Pinecone | 1M vectors | ✅ ~2000 vectors needed |
| Vercel | 100GB bandwidth/month | ✅ Plenty |
| Streamlit Cloud | Public apps free | ✅ Perfect |
| **Total Cost** | **$0/month** | ✅ Completely free! |

---

## 🔧 Troubleshooting Deployment

### Backend won't deploy to Vercel

**Issue**: Module not found
**Fix**: Make sure `package.json` is in backend folder

**Issue**: Function timeout
**Fix**: Add to `vercel.json`:
```json
{
  "functions": {
    "src/server.js": {
      "maxDuration": 30
    }
  }
}
```

### Frontend can't connect to backend

**Issue**: CORS errors
**Fix**: Backend already has CORS enabled for all origins

**Issue**: Connection refused
**Fix**: Check `BACKEND_URL` in Streamlit secrets matches your Vercel URL

### Pinecone errors

**Issue**: "Index not found"
**Fix**: Make sure you ran `npm run index` locally first (this creates the index)

**Issue**: "API key invalid"
**Fix**: Double-check you copied the correct API key from Pinecone dashboard

---

## 🎯 Quick Deploy Commands

```bash
# 1. Setup
cp .env.example backend/.env
# Add your API keys to backend/.env

# 2. Install
cd backend && npm install
cd ../frontend && pip install -r requirements.txt

# 3. Scrape & Index (ONE TIME ONLY)
cd backend
npm run scrape
npm run index  # Uploads to Pinecone cloud

# 4. Test Locally
cd backend && npm run dev  # Terminal 1
cd frontend && streamlit run app.py  # Terminal 2

# 5. Deploy Backend
cd backend && vercel --prod

# 6. Deploy Frontend
# Use Streamlit Cloud dashboard (see above)

# 7. Share your Streamlit URL!
```

---

## ✅ Deployment Checklist

- [ ] Pinecone account created
- [ ] Gemini API key obtained
- [ ] Data scraped locally
- [ ] Data indexed to Pinecone (one-time)
- [ ] Backend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Frontend deployed to Streamlit Cloud
- [ ] Backend URL added to Streamlit secrets
- [ ] Tested live app
- [ ] GitHub repo updated
- [ ] Links ready for submission

---

## 🎓 Why This Setup is Perfect for Assignments

1. **Zero cost** - Everything uses free tiers
2. **No maintenance** - Pinecone & Vercel are managed
3. **Shareable** - Just send the Streamlit URL
4. **Persistent** - Data stays in Pinecone, survives restarts
5. **Scalable** - Can handle multiple concurrent users
6. **Professional** - Production-grade architecture

---

## 📊 Expected Performance

- **Cold start**: 2-3 seconds (first request after idle)
- **Warm requests**: 1-2 seconds
- **Concurrent users**: 10-20 (more than enough for assignment)
- **Uptime**: 99.9% (handled by Vercel & Streamlit)

---

## 🆘 Need Help?

1. Check logs:
   - Vercel: Dashboard → Functions → Logs
   - Streamlit: Dashboard → Logs
2. Test backend health: `https://your-backend.vercel.app/api/chat/health`
3. Check environment variables are set correctly
4. See TROUBLESHOOTING.md for common issues

---

**Ready to deploy? Follow the steps above and you'll have a live, shareable chatbot in ~30 minutes!** 🚀
