# GitLab AI Assistant 🦊

An intelligent chatbot that helps GitLab employees and aspiring employees access information from GitLab's Handbook and Direction pages using advanced Generative AI and Retrieval-Augmented Generation (RAG).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v18+-green.svg)
![Python](https://img.shields.io/badge/python-v3.9+-blue.svg)

## 🌟 Features

### Core Functionality
- **🔍 Intelligent Search**: Semantic search powered by vector embeddings
- **💬 Context-Aware Conversations**: Maintains conversation history for follow-up questions
- **📚 Source Attribution**: Every answer cites specific sources from GitLab's documentation
- **🛡️ Guardrails**: Built-in safety mechanisms to prevent hallucinations
- **⚡ Performance**: Optimized with caching and efficient retrieval

### Advanced Features
- **🎯 Query Expansion**: Generates alternative phrasings for better retrieval
- **🔄 Hybrid Search**: Combines vector similarity and keyword matching
- **📊 Confidence Scoring**: Transparency about answer reliability
- **🌐 Real-time Processing**: Fast response times with streaming support
- **📈 Analytics Dashboard**: Monitor system performance and usage

## 🏗️ Architecture

### System Design

```
┌─────────────────┐
│   Streamlit UI  │  ← Beautiful chat interface
│    (Frontend)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   Express API   │  ← Node.js backend
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────┐
│ Gemini │  │ Pinecone │  ← Cloud vector DB (no server needed!)
│  API   │  │ (Vectors)│
└────────┘  └──────────┘
```

### Tech Stack

**Backend:**
- Node.js + Express.js - RESTful API server
- Google Gemini AI - LLM for response generation and embeddings
- **Pinecone** - Cloud vector database (managed, no server to maintain)
- Winston - Structured logging
- Node-cache - In-memory caching

**Frontend:**
- Streamlit - Interactive web interface
- Python Requests - API communication

**Deployment:**
- Vercel - Serverless backend hosting
- Streamlit Cloud - Free frontend hosting
- Pinecone - Managed vector database

**Why Pinecone over ChromaDB for deployment?**
- ✅ Fully managed (no server to host)
- ✅ Free tier (1M vectors)
- ✅ Works with serverless (Vercel)
- ✅ Persistent storage
- ✅ Perfect for assignments/demos

## 📋 Prerequisites

- Node.js v18+ and npm
- Python 3.9+
- **Google Gemini API key** ([Get free here](https://aistudio.google.com))
- **Pinecone API key** ([Get free here](https://www.pinecone.io)) - for vector storage

**Both are FREE for this project!**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd gitlab-chatbot
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp ../.env.example .env

# Edit .env and add BOTH API keys:
# GEMINI_API_KEY=your_gemini_key_here
# PINECONE_API_KEY=your_pinecone_key_here
# PINECONE_ENVIRONMENT=gcp-starter
# PINECONE_INDEX=gitlab-handbook
```

**Getting API Keys (5 minutes):**
1. **Gemini**: Go to https://aistudio.google.com → Get API Key
2. **Pinecone**: Go to https://www.pinecone.io → Sign up → API Keys

### 3. Scrape GitLab Data

```bash
# Scrape GitLab Handbook and Direction pages
npm run scrape

# This will create data/scraped_data.json
```

### 4. Index Data

```bash
# Create vector embeddings and upload to Pinecone (cloud storage)
npm run index

# This may take 10-20 minutes
# Once uploaded to Pinecone, data persists in the cloud!
# You won't need to re-index on deployment ✅
```

### 5. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend will be available at `http://localhost:3000`

### 6. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env if needed (default: http://localhost:3000)
```

### 7. Start Frontend

```bash
streamlit run app.py
```

The frontend will open in your browser at `http://localhost:8501`

## 📖 Usage

### Basic Query

1. Open the Streamlit interface
2. Type your question about GitLab in the chat input
3. View the AI-generated answer with source citations

**Example queries:**
- "What is GitLab's remote work policy?"
- "How does GitLab handle code reviews?"
- "What are GitLab's company values?"

### Advanced Features

**Query Expansion:**
Enable in the sidebar to generate alternative phrasings for better results.

**Source Verification:**
Click "View Sources" to see the exact Handbook/Direction pages used.

**Conversation Context:**
The bot remembers previous messages in your session for follow-up questions.

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# API Keys
GEMINI_API_KEY=your_key_here

# Vector Database
CHROMA_HOST=localhost
CHROMA_PORT=8000
COLLECTION_NAME=gitlab_handbook

# RAG Settings
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
SIMILARITY_THRESHOLD=0.7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

Edit `frontend/.env`:

```env
BACKEND_URL=http://localhost:3000
```

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3000/api/chat/health

# Test query
curl -X POST http://localhost:3000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is GitLab?",
    "sessionId": "test-session"
  }'

# Get statistics
curl http://localhost:3000/api/chat/stats
```

## 📦 Deployment

### For Assignment Submission - Quick Deploy (15 minutes)

**See [DEPLOYMENT_SIMPLE.md](DEPLOYMENT_SIMPLE.md) for step-by-step instructions!**

**Quick summary:**

1. **Already indexed?** ✅ Data is in Pinecone cloud (persistent)
2. **Deploy Backend to Vercel** (5 min)
   ```bash
   cd backend && vercel --prod
   ```
3. **Deploy Frontend to Streamlit Cloud** (5 min)
   - Go to share.streamlit.io
   - Connect your GitHub repo
   - Set main file: `frontend/app.py`
   - Add backend URL in secrets

4. **Share your public URL!** 🎉

### Deploy Backend (Vercel)

1. Install Vercel CLI: `npm install -g vercel`
2. Create `vercel.json` in backend folder:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "GEMINI_API_KEY": "@gemini-api-key",
    "PINECONE_API_KEY": "@pinecone-api-key",
    "PINECONE_ENVIRONMENT": "@pinecone-environment",
    "PINECONE_INDEX": "@pinecone-index"
  }
}
```

3. Deploy: `cd backend && vercel --prod`

### Deploy Frontend (Streamlit Cloud)

1. Push code to GitHub
2. Go to [Streamlit Cloud](https://streamlit.io/cloud)
3. Connect your repository
4. Set main file path: `frontend/app.py`
5. Add environment variables in Streamlit settings
6. Deploy!

### Deploy with Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🏛️ Project Structure

```
gitlab-chatbot/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── scraper.js   # Web scraping
│   │   │   ├── vectorStore.js # Vector DB operations
│   │   │   ├── llm.js       # LLM integration
│   │   │   └── rag.js       # RAG orchestration
│   │   ├── utils/           # Utilities
│   │   ├── scripts/         # Data processing scripts
│   │   └── server.js        # Express server
│   ├── package.json
│   └── .env
├── frontend/
│   ├── app.py               # Streamlit application
│   ├── requirements.txt
│   └── .env
├── data/                    # Scraped data
├── logs/                    # Application logs
├── README.md
└── .gitignore
```

## 🔑 API Documentation

### POST `/api/chat/query`

Process a user query with RAG.

**Request:**
```json
{
  "query": "What is GitLab's mission?",
  "sessionId": "uuid-here",
  "useQueryExpansion": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "GitLab's mission is...",
    "sources": [
      {
        "id": 1,
        "title": "Company Mission",
        "url": "https://handbook.gitlab.com/mission",
        "relevanceScore": "0.95"
      }
    ],
    "confidence": "high",
    "metadata": {
      "model": "gemini-1.5-flash",
      "chunksRetrieved": 5,
      "processingTimeMs": 1250
    }
  }
}
```

### GET `/api/chat/stats`

Get system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "vectorStore": {
      "totalChunks": 1523
    },
    "cache": {
      "hitRate": 0.67
    },
    "activeSessions": 5
  }
}
```

## 🎨 Customization

### Modify Scraping Targets

Edit `backend/src/config/index.js`:

```javascript
gitlab: {
  handbookUrl: 'https://handbook.gitlab.com',
  directionUrl: 'https://about.gitlab.com/direction'
}
```

### Adjust RAG Parameters

Edit chunking and retrieval settings:

```javascript
rag: {
  chunkSize: 1000,        // Size of text chunks
  chunkOverlap: 200,      // Overlap between chunks
  topK: 5,                // Number of chunks to retrieve
  similarityThreshold: 0.7 // Minimum similarity score
}
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- GitLab for maintaining excellent public documentation
- Google for the Gemini API
- The open-source community for amazing tools

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for the GitLab community**
