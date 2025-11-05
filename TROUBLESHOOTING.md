# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### Issue: `npm install` fails
**Symptoms:**
- Error messages during `npm install`
- Missing dependencies

**Solutions:**
1. Check Node.js version: `node --version` (should be v18+)
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`, then reinstall
4. Try using `npm ci` instead of `npm install`

### Issue: `pip install` fails
**Symptoms:**
- Python package installation errors
- Permission denied errors

**Solutions:**
1. Check Python version: `python3 --version` (should be 3.9+)
2. Use virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Try installing with user flag: `pip install --user -r requirements.txt`

---

## Backend Issues

### Issue: Server won't start
**Symptoms:**
- `Error: GEMINI_API_KEY is required`
- Port already in use

**Solutions:**
1. **Missing API Key:**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key: `GEMINI_API_KEY=your_key_here`

2. **Port in use:**
   - Change port in `.env`: `PORT=3001`
   - Or kill process using port 3000:
     ```bash
     # macOS/Linux
     lsof -ti:3000 | xargs kill -9
     
     # Windows
     netstat -ano | findstr :3000
     taskkill /PID <PID> /F
     ```

### Issue: ChromaDB connection failed
**Symptoms:**
- `Error: Failed to initialize vector store`
- Connection refused errors

**Solutions:**
1. The app uses in-memory ChromaDB by default (no server needed)
2. If using external ChromaDB:
   - Check if ChromaDB is running
   - Verify `CHROMA_HOST` and `CHROMA_PORT` in `.env`
   - Start ChromaDB: `docker run -p 8000:8000 chromadb/chroma`

### Issue: Scraping fails
**Symptoms:**
- Network errors during scraping
- Empty `scraped_data.json`

**Solutions:**
1. Check internet connection
2. Reduce concurrent requests in `.env`: `MAX_CONCURRENT_REQUESTS=2`
3. Increase delay: `SCRAPE_DELAY_MS=3000`
4. Check if GitLab is accessible: `curl https://handbook.gitlab.com`
5. Try scraping fewer pages (modify `maxPages` in `scraper.js`)

### Issue: Indexing fails
**Symptoms:**
- `Error indexing chunks`
- Gemini API errors

**Solutions:**
1. Check Gemini API key is valid
2. Verify you haven't exceeded rate limits (1,500 calls/day free tier)
3. Check if `scraped_data.json` exists and has valid data
4. Try indexing in smaller batches (modify batch size in `vectorStore.js`)

---

## Frontend Issues

### Issue: Streamlit won't start
**Symptoms:**
- Command not found: streamlit
- Module import errors

**Solutions:**
1. Install Streamlit: `pip install streamlit`
2. Check if streamlit is in PATH: `which streamlit`
3. Use full path: `python -m streamlit run app.py`

### Issue: "Connection refused" in UI
**Symptoms:**
- Cannot connect to backend
- Network errors in frontend

**Solutions:**
1. Check backend is running: `curl http://localhost:3000/api/chat/health`
2. Verify `BACKEND_URL` in `frontend/.env` matches backend URL
3. Check CORS settings in backend
4. Disable firewall temporarily to test

### Issue: Slow responses
**Symptoms:**
- Long wait times for answers
- Timeout errors

**Solutions:**
1. Enable caching (already enabled by default)
2. Reduce `topK` in backend config (fewer chunks = faster)
3. Use smaller chunk sizes
4. Check internet connection to Gemini API
5. Monitor backend logs for bottlenecks

---

## Data Issues

### Issue: No data found
**Symptoms:**
- "No chunks indexed" in stats
- Empty responses

**Solutions:**
1. Run scraping: `cd backend && npm run scrape`
2. Run indexing: `cd backend && npm run index`
3. Check `data/scraped_data.json` exists and has content
4. Verify ChromaDB collection exists

### Issue: Poor answer quality
**Symptoms:**
- Irrelevant answers
- "I don't know" responses

**Solutions:**
1. Enable query expansion in UI
2. Increase `topK` for more context
3. Lower `similarityThreshold` in config
4. Scrape more data
5. Improve chunking strategy (adjust chunk size)

---

## Deployment Issues

### Issue: Vercel deployment fails
**Symptoms:**
- Build errors
- Function timeout

**Solutions:**
1. Check `vercel.json` configuration
2. Set environment variables in Vercel dashboard
3. Verify build command succeeds locally
4. Check function timeout settings (increase if needed)

### Issue: Streamlit Cloud deployment fails
**Symptoms:**
- App crashes on startup
- Module not found errors

**Solutions:**
1. Verify `requirements.txt` includes all dependencies
2. Check Python version in Streamlit settings (3.9+)
3. Add secrets in Streamlit Cloud settings
4. Check app logs for specific errors

### Issue: ChromaDB not accessible in production
**Symptoms:**
- Vector search fails
- Database connection errors

**Solutions:**
1. Deploy ChromaDB separately (Railway, Render, etc.)
2. Update `CHROMA_HOST` environment variable
3. Consider using managed vector DB (Pinecone)
4. Check network/firewall settings

---

## Performance Issues

### Issue: High memory usage
**Symptoms:**
- Out of memory errors
- Slow performance

**Solutions:**
1. Reduce chunk size
2. Limit conversation history length
3. Clear cache periodically
4. Use smaller embedding model
5. Optimize batch sizes

### Issue: Rate limit exceeded
**Symptoms:**
- 429 errors from Gemini API
- "Quota exceeded" messages

**Solutions:**
1. Gemini free tier: 1,500 requests/day
2. Implement request queuing
3. Increase cache TTL to reduce API calls
4. Upgrade to paid tier if needed
5. Add rate limiting on frontend

---

## Development Issues

### Issue: Hot reload not working
**Symptoms:**
- Changes don't reflect
- Need to restart manually

**Solutions:**
1. Use `npm run dev` for backend (uses nodemon)
2. Streamlit auto-reloads (check "Always rerun" setting)
3. Clear browser cache
4. Check if file watchers are working

### Issue: CORS errors
**Symptoms:**
- "CORS policy" errors in browser console
- Blocked requests

**Solutions:**
1. Check CORS configuration in `server.js`
2. Add frontend URL to allowed origins
3. For development, allow all origins temporarily
4. Update `FRONTEND_URL` environment variable

---

## Logging and Debugging

### Enable Debug Logging
```bash
# Backend
LOG_LEVEL=debug npm run dev

# Check logs
tail -f logs/combined.log
```

### Common Log Locations
- Backend: `logs/combined.log`, `logs/error.log`
- Frontend: Streamlit terminal output
- Docker: `docker-compose logs -f`

### Debug Checklist
- [ ] Check all environment variables are set
- [ ] Verify API keys are valid
- [ ] Check network connectivity
- [ ] Review error logs
- [ ] Test each component separately
- [ ] Verify data exists and is accessible

---

## Still Having Issues?

1. **Check logs** in `logs/` directory
2. **Review documentation**:
   - README.md
   - QUICKSTART.md
   - API_DOCUMENTATION.md
3. **Search existing issues** on GitHub
4. **Open a new issue** with:
   - Error messages
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)
   - Logs

---

## Useful Commands

```bash
# Check if ports are in use
lsof -i :3000
lsof -i :8501

# View logs
tail -f logs/combined.log

# Test API
curl http://localhost:3000/api/chat/health

# Check environment variables
cat backend/.env

# Rebuild everything
rm -rf backend/node_modules
cd backend && npm install

# Clear cache
rm -rf backend/node_modules/.cache
```

---

## Emergency Recovery

If everything is broken:

```bash
# 1. Clean everything
rm -rf backend/node_modules
rm -rf frontend/venv
rm -rf data/*
rm -rf logs/*

# 2. Reinstall
cd backend && npm install
cd ../frontend && pip install -r requirements.txt

# 3. Reset environment
cp .env.example backend/.env
# Add your API key

# 4. Start fresh
cd backend
npm run scrape
npm run index
npm run dev

# In another terminal:
cd frontend
streamlit run app.py
```

---

Last Updated: November 4, 2025
