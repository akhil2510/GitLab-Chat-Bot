# Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (for backend)
- Streamlit Cloud account (for frontend)
- Google Gemini API key

## Step 1: Prepare Your Repository

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/gitlab-chatbot.git
git push -u origin main
```

## Step 2: Deploy Backend to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to backend folder:
```bash
cd backend
```

3. Deploy:
```bash
vercel
```

4. Follow prompts and set environment variables:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Root Directory: `backend`
   - Framework Preset: Other
   - Build Command: `npm install`
   - Output Directory: (leave empty)
5. Add Environment Variables:
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
6. Deploy!

Your backend will be available at: `https://your-project.vercel.app`

## Step 3: Set Up Vector Database

### Option A: Hosted ChromaDB

1. Sign up for a ChromaDB Cloud account
2. Create a new collection
3. Update environment variables with connection details

### Option B: Deploy Your Own ChromaDB

1. Create a Dockerfile for ChromaDB:
```dockerfile
FROM chromadb/chroma:latest
EXPOSE 8000
```

2. Deploy to Railway/Render/Fly.io
3. Update `CHROMA_HOST` environment variable

## Step 4: Index Your Data

After deploying the backend:

1. Run scraping script locally:
```bash
cd backend
npm run scrape
```

2. Run indexing script:
```bash
npm run index
```

Note: This connects to your deployed ChromaDB instance.

## Step 5: Deploy Frontend to Streamlit Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Click "New app"
3. Connect your GitHub repository
4. Configure:
   - Repository: `yourusername/gitlab-chatbot`
   - Branch: `main`
   - Main file path: `frontend/app.py`
5. Advanced settings → Secrets:
```toml
BACKEND_URL = "https://your-backend.vercel.app"
```
6. Deploy!

Your frontend will be available at: `https://yourapp.streamlit.app`

## Step 6: Alternative Deployment Options

### Deploy with Docker (All Services)

1. Update `docker-compose.yml` with your API key
2. Run:
```bash
docker-compose up -d
```

3. Deploy to:
   - AWS ECS/EKS
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

### Deploy Frontend to Hugging Face Spaces

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Create new Space
3. Choose Streamlit SDK
4. Upload your `frontend/` folder
5. Add secrets in Settings:
   - `BACKEND_URL`

## Environment Variables Summary

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
GEMINI_API_KEY=your_key_here
CHROMA_HOST=your_chroma_host
CHROMA_PORT=8000
COLLECTION_NAME=gitlab_handbook
```

### Frontend (.env)
```env
BACKEND_URL=https://your-backend.vercel.app
```

## Monitoring & Maintenance

### Vercel
- View logs in Vercel dashboard
- Monitor function executions
- Set up error alerts

### Streamlit Cloud
- View logs in app dashboard
- Monitor resource usage
- Set up email alerts

### Database Backups
```bash
# Export ChromaDB data
# Run periodically and store backups
```

## Scaling Considerations

1. **Backend**: Vercel auto-scales serverless functions
2. **Database**: Use managed ChromaDB or Pinecone for scale
3. **Caching**: Add Redis for distributed caching
4. **CDN**: Use Vercel's Edge Network

## Troubleshooting

### "Connection refused" errors
- Check that backend URL is correct in frontend
- Verify CORS settings in backend

### "Rate limit exceeded"
- Gemini API has 1,500 calls/day free tier
- Implement request queuing for high traffic

### Slow responses
- Enable caching
- Optimize chunk size
- Use faster embedding model

## Cost Estimation

**Free Tier:**
- Vercel: Free for hobby projects
- Streamlit Cloud: Free for public apps
- Gemini API: 1,500 requests/day free
- ChromaDB: Self-hosted (free) or managed ($)

**Estimated Monthly Cost (100 users):**
- Vercel: $0-20
- Database: $10-30
- Gemini API: $0-50 (depending on usage)
- **Total: $10-100/month**

## Support

If you encounter issues:
1. Check the logs
2. Review environment variables
3. Open an issue on GitHub

---

Happy Deploying! 🚀
