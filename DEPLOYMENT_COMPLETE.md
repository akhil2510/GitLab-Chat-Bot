# 🚀 Complete Deployment Guide - Backend & Frontend

## 📋 Overview

**Backend** → Vercel (Serverless Functions)  
**Frontend** → Netlify (Static Hosting)  
**Vector DB** → Pinecone (Already setup with 500 chunks!)  
**Secrets** → Environment Variables (Never in code!)

---

## 🔐 Part 1: Secure Your Secrets

### Your API Keys (Keep These Safe!):

```bash
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
PINECONE_API_KEY=your_pinecone_api_key_from_pinecone_dashboard
HUGGINGFACE_API_KEY=your_huggingface_token_from_settings
```

**⚠️ NEVER commit these to Git!** They're already in `.gitignore`

---

## 🎯 Part 2: Deploy Backend to Vercel

### Option A: Web Interface (Easiest - 5 minutes)

1. **Go to Vercel:**
   - Visit: https://vercel.com/new
   - Sign up with GitHub (free)

2. **Import Project:**
   - Click "Import Git Repository" OR "Add New → Project"
   - If not using Git: Click "Deploy" and upload the `/Users/akhilesh/test` folder

3. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** Leave as is (`.`)
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty

4. **Add Environment Variables** (CRITICAL!):
   Click "Environment Variables" and add these **EXACTLY**:
   
   ```
   Key: GEMINI_API_KEY
   Value: your_gemini_api_key_from_google_ai_studio
   
   Key: PINECONE_API_KEY
   Value: your_pinecone_api_key_from_dashboard
   
   Key: PINECONE_ENVIRONMENT
   Value: gcp-starter
   
   Key: PINECONE_INDEX
   Value: gitlab-handbook
   
   Key: HUGGINGFACE_API_KEY
   Value: YOUR_HF_TOKEN
   
   Key: EMBEDDING_PROVIDER
   Value: huggingface
   
   Key: NODE_ENV
   Value: production
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your URL: `https://your-project-xyz.vercel.app`

6. **Test Backend:**
   ```bash
   curl https://your-project-xyz.vercel.app/api/chat/health
   ```
   
   Should return: `{"success":true,"status":"healthy"}`

### Option B: CLI (For Developers)

```bash
# 1. Login
cd /Users/akhilesh/test
vercel login

# 2. Deploy
vercel

# 3. Add environment variables via CLI
vercel env add GEMINI_API_KEY
vercel env add PINECONE_API_KEY
vercel env add PINECONE_ENVIRONMENT
vercel env add PINECONE_INDEX
vercel env add HUGGINGFACE_API_KEY
vercel env add EMBEDDING_PROVIDER

# 4. Deploy to production
vercel --prod
```

---

## 🎨 Part 3: Deploy Frontend to Netlify

### Step 1: Update Frontend with Backend URL

1. **Get your Vercel backend URL** from Part 2 (e.g., `https://gitlab-chatbot-abc.vercel.app`)

2. **Update `frontend/index.html`** line 351:
   ```javascript
   return window.ENV?.BACKEND_URL || 'https://YOUR-BACKEND-URL.vercel.app/api/chat';
   ```
   
   Replace with YOUR actual Vercel URL:
   ```javascript
   return window.ENV?.BACKEND_URL || 'https://gitlab-chatbot-abc.vercel.app/api/chat';
   ```

### Step 2: Deploy to Netlify (30 seconds!)

**Method 1: Drag & Drop (Recommended)**

1. **Go to:** https://app.netlify.com/drop
2. **Sign up** with GitHub (free)
3. **Drag** the `/Users/akhilesh/test/frontend` folder
4. **Done!** Get URL like: `https://wonderful-app-123.netlify.app`

**Method 2: CLI**

```bash
npm install -g netlify-cli
cd /Users/akhilesh/test/frontend
netlify deploy --prod
```

### Step 3: (Optional) Set Environment Variable in Netlify

1. Go to: Site settings → Environment variables
2. Add:
   ```
   Key: BACKEND_URL
   Value: https://your-vercel-url.vercel.app/api/chat
   ```
3. Redeploy if needed

---

## ✅ Part 4: Test Everything

### Test Backend API:

```bash
# Health check
curl https://your-backend.vercel.app/api/chat/health

# Stats (should show 500 chunks)
curl https://your-backend.vercel.app/api/chat/stats

# Actual query
curl -X POST https://your-backend.vercel.app/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are GitLab values?"}'
```

### Test Frontend:

1. Open your Netlify URL in browser
2. Type: "What are GitLab values?"
3. Should get a response with sources!

---

## 🔒 Part 5: How Secrets Work

### Backend (Vercel):
- Secrets stored in Vercel Dashboard → Settings → Environment Variables
- **NEVER** in code or Git
- Automatically injected at runtime via `process.env.VARIABLE_NAME`

### Frontend (Netlify):
- Backend URL can be:
  1. Hardcoded in `index.html` (safe - it's just a URL)
  2. OR set as environment variable in Netlify settings
- No sensitive data needed in frontend!

### Connection Flow:
```
User → Frontend (Netlify) → Backend (Vercel) → Pinecone (with API key)
                                              ↘ Gemini (with API key)
                                              ↘ HuggingFace (with API key)
```

**Keys are ONLY in Backend!** Frontend just knows the backend URL (which is public anyway).

---

## 🌐 Part 6: CORS & Security

Your backend already handles CORS:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

**For production**, update Vercel env:
```
FRONTEND_URL=https://your-frontend.netlify.app
```

This restricts API access to only your frontend!

---

## 📊 Part 7: URLs Summary

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | `https://xxx.vercel.app` | REST API endpoints |
| Frontend UI | `https://yyy.netlify.app` | Chat interface |
| Health Check | `https://xxx.vercel.app/api/chat/health` | API status |
| Stats | `https://xxx.vercel.app/api/chat/stats` | Vector DB stats |

---

## 🎯 Quick Deployment Commands

```bash
# Backend
cd /Users/akhilesh/test
vercel login
vercel --prod

# Frontend
cd /Users/akhilesh/test/frontend
# Update index.html with backend URL first!
# Then drag to https://app.netlify.com/drop
```

---

## 🐛 Troubleshooting

### Backend Issues:

**"Environment variable not found"**
- Check spelling in Vercel dashboard
- Redeploy: `vercel --prod`

**"CORS error"**
- Add `FRONTEND_URL` to Vercel env variables
- Or use `*` for testing (not recommended for production)

**"Function timeout"**
- Embeddings might be slow - increase timeout in `vercel.json` (already set to 30s)

### Frontend Issues:

**"Failed to fetch"**
- Check backend URL in index.html is correct
- Test backend URL directly in browser
- Check browser console for errors

**"Network error"**
- Backend might be cold-starting (wait 10 seconds, try again)
- Check if backend is actually deployed

---

## 💰 Cost Breakdown

Everything is **FREE**:

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| Vercel | 100GB bandwidth/month | ~1GB/month |
| Netlify | 100GB bandwidth/month | ~500MB/month |
| Pinecone | 1M vectors | 500 vectors |
| HuggingFace | Generous free tier | ~100 requests/day |
| Gemini | 60 req/min | ~10 req/day |

**Total cost: $0/month** ✅

---

## 🎉 You're Live!

Your chatbot is now:
- ✅ Deployed to production
- ✅ Secrets secured in environment variables
- ✅ Using cloud vector database (Pinecone)
- ✅ Accessible from anywhere
- ✅ Free forever (within limits)
- ✅ HTTPS enabled
- ✅ Production-ready

**Share your Netlify URL and impress everyone!** 🚀

---

## 📝 Next Steps (Optional)

1. **Custom Domain:** Add your own domain in Vercel/Netlify
2. **Analytics:** Add Google Analytics to frontend
3. **Monitoring:** Set up Vercel/Netlify alerts
4. **Rate Limiting:** Already configured (100 req per 15 min)
5. **Logging:** Check Vercel logs for debugging

---

## 🔗 Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Netlify Dashboard: https://app.netlify.com
- Pinecone Console: https://app.pinecone.io
- Gemini API: https://aistudio.google.com
- HuggingFace Tokens: https://huggingface.co/settings/tokens
