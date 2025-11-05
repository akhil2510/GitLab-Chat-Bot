# API Documentation

## Base URL
```
Development: http://localhost:3000
Production: https://your-backend-url.vercel.app
```

## Authentication
Currently, the API does not require authentication. In production, consider adding API keys or OAuth.

## Rate Limiting
- Window: 15 minutes
- Max Requests: 100 requests per window
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Endpoints

### 1. Root Endpoint
Get API information.

**Endpoint:** `GET /`

**Response:**
```json
{
  "success": true,
  "message": "GitLab Chatbot API",
  "version": "1.0.0",
  "endpoints": {
    "chat": "/api/chat",
    "health": "/api/chat/health",
    "stats": "/api/chat/stats"
  }
}
```

---

### 2. Health Check
Check if the API is running.

**Endpoint:** `GET /api/chat/health`

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-04T12:00:00.000Z"
}
```

---

### 3. Query Chatbot
Process a user query using RAG.

**Endpoint:** `POST /api/chat/query`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "What is GitLab's mission?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "useQueryExpansion": false
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | The user's question (1-1000 characters) |
| sessionId | string (UUID) | No | Session identifier for conversation history |
| useQueryExpansion | boolean | No | Enable query expansion for better retrieval (default: false) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "answer": "GitLab's mission is to make it so that everyone can contribute...",
    "sources": [
      {
        "id": 1,
        "title": "GitLab Mission",
        "url": "https://handbook.gitlab.com/handbook/company/mission/",
        "relevanceScore": "0.952"
      },
      {
        "id": 2,
        "title": "Company Values",
        "url": "https://handbook.gitlab.com/handbook/values/",
        "relevanceScore": "0.876"
      }
    ],
    "confidence": "high",
    "metadata": {
      "model": "gemini-1.5-flash",
      "chunksRetrieved": 5,
      "timestamp": "2025-11-04T12:00:00.000Z",
      "processingTimeMs": 1247
    },
    "query": "What is GitLab's mission?",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "details": [
      {
        "field": "query",
        "message": "\"query\" is required"
      }
    ]
  }
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": {
    "message": "Failed to generate response. Please try again."
  }
}
```

---

### 4. Clear Conversation
Clear conversation history for a session.

**Endpoint:** `POST /api/chat/clear`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string (UUID) | Yes | Session identifier to clear |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Conversation history cleared"
}
```

---

### 5. Get Statistics
Get system statistics and metrics.

**Endpoint:** `GET /api/chat/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "vectorStore": {
      "totalChunks": 1523,
      "collectionName": "gitlab_handbook"
    },
    "cache": {
      "keys": 45,
      "hits": 123,
      "misses": 67,
      "hitRate": 0.6473684210526316
    },
    "activeSessions": 5
  }
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 404 | Not Found (invalid endpoint) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Response Fields

### Answer Object
| Field | Type | Description |
|-------|------|-------------|
| answer | string | The generated response |
| sources | array | List of source documents used |
| confidence | string | Confidence level: "high", "medium", "low" |
| metadata | object | Additional metadata about the response |
| query | string | The original user query |
| sessionId | string | Session identifier |

### Source Object
| Field | Type | Description |
|-------|------|-------------|
| id | number | Source index (1-based) |
| title | string | Document title |
| url | string | Source URL |
| relevanceScore | string | Similarity score (0-1) |

### Metadata Object
| Field | Type | Description |
|-------|------|-------------|
| model | string | LLM model used |
| chunksRetrieved | number | Number of chunks retrieved |
| timestamp | string | ISO timestamp |
| processingTimeMs | number | Processing time in milliseconds |

---

## Example Usage

### cURL
```bash
# Health check
curl http://localhost:3000/api/chat/health

# Query
curl -X POST http://localhost:3000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are GitLab values?",
    "sessionId": "test-session-123"
  }'

# Stats
curl http://localhost:3000/api/chat/stats
```

### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/chat/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'What is GitLab?',
    sessionId: 'my-session-id',
    useQueryExpansion: false
  })
});

const data = await response.json();
console.log(data.data.answer);
```

### Python (Requests)
```python
import requests

response = requests.post(
    'http://localhost:3000/api/chat/query',
    json={
        'query': 'How does GitLab work?',
        'sessionId': 'my-session-id'
    }
)

data = response.json()
print(data['data']['answer'])
```

---

## Versioning
Current Version: `v1.0.0`

Future versions will be accessible via `/api/v2/...`

---

## Support
For issues or questions, please open an issue on GitHub or contact the maintainers.

---

Last Updated: November 4, 2025
