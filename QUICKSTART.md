# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Clone and Setup

```bash
# Navigate to the project
cd gitlab-chatbot

# Setup environment variables
cp .env.example backend/.env
cp .env.example frontend/.env

# Edit backend/.env and add your Gemini API key:
# GEMINI_API_KEY=your_key_here
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Frontend:**
```bash
cd frontend
pip install -r requirements.txt
cd ..
```

### Step 3: Prepare Data

You have two options:

**Option A: Use Sample Data (Quick Test)**
```bash
# Create a sample data file for testing
cd backend
node -e "require('fs').writeFileSync('../data/scraped_data.json', JSON.stringify([{url: 'https://handbook.gitlab.com/handbook/', title: 'GitLab Handbook', content: 'GitLab is an open-source DevOps platform. We believe in transparency and collaboration.', headings: ['GitLab Handbook'], wordCount: 12, scrapedAt: new Date().toISOString()}], null, 2))"
```

**Option B: Scrape Real Data (Recommended)**
```bash
cd backend
npm run scrape
```
*Note: This will take 10-30 minutes depending on network speed*

### Step 4: Index the Data

```bash
cd backend
npm run index
```

This creates vector embeddings and stores them in ChromaDB.

### Step 5: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Backend will start at http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend
streamlit run app.py
```

Frontend will open automatically in your browser at http://localhost:8501

### Step 6: Test It!

1. Open the Streamlit UI (http://localhost:8501)
2. Ask a question like: "What is GitLab's mission?"
3. View the AI-generated response with source citations

## 🎯 Example Queries

Try these questions:
- "What are GitLab's core values?"
- "How does GitLab handle remote work?"
- "What is GitLab's code review process?"
- "Tell me about GitLab's product direction"

## 🐛 Troubleshooting

### Backend won't start
- Check that you've added `GEMINI_API_KEY` to `backend/.env`
- Verify Node.js version: `node --version` (should be v18+)

### ChromaDB errors
- The app uses in-memory ChromaDB by default
- No separate ChromaDB server needed for testing

### Frontend can't connect to backend
- Ensure backend is running on port 3000
- Check `BACKEND_URL` in `frontend/.env`

### No data found
- Make sure you ran `npm run scrape` and `npm run index`
- Check that `data/scraped_data.json` exists

## 📚 Next Steps

1. **Read the full README.md** for detailed documentation
2. **Check PROJECT_DOCUMENTATION.md** for architecture details
3. **See DEPLOYMENT.md** for production deployment
4. **Review CONTRIBUTING.md** to contribute

## 💡 Tips

- **Development Mode**: Backend auto-reloads on file changes with `npm run dev`
- **Cache**: Enable query expansion in UI sidebar for better results
- **Logs**: Check `logs/` folder for detailed application logs
- **Stats**: View system statistics in the UI sidebar

## 🆘 Need Help?

- Check the logs in `logs/combined.log`
- Ensure all environment variables are set
- Verify all dependencies are installed
- Open an issue on GitHub

Happy coding! 🎉
