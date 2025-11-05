import streamlit as st
import requests
import json
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000')
API_ENDPOINT = f'{BACKEND_URL}/api/chat/query'
CLEAR_ENDPOINT = f'{BACKEND_URL}/api/chat/clear'
STATS_ENDPOINT = f'{BACKEND_URL}/api/chat/stats'

# Page configuration
st.set_page_config(
    page_title="GitLab AI Assistant",
    page_icon="🦊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #FC6D26;
        text-align: center;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #6E49CB;
        text-align: center;
        margin-bottom: 2rem;
    }
    .source-card {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #FC6D26;
        margin-bottom: 0.5rem;
    }
    .confidence-high {
        color: #28a745;
        font-weight: bold;
    }
    .confidence-medium {
        color: #ffc107;
        font-weight: bold;
    }
    .confidence-low {
        color: #dc3545;
        font-weight: bold;
    }
    .stChatMessage {
        background-color: #ffffff;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1rem;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())

if 'messages' not in st.session_state:
    st.session_state.messages = []

if 'use_query_expansion' not in st.session_state:
    st.session_state.use_query_expansion = False

# Header
st.markdown('<div class="main-header">🦊 GitLab AI Assistant</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Your intelligent guide to GitLab\'s Handbook and Direction</div>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.header("⚙️ Settings")
    
    # Query expansion toggle
    st.session_state.use_query_expansion = st.checkbox(
        "Use Query Expansion",
        value=st.session_state.use_query_expansion,
        help="Generate alternative phrasings for better retrieval"
    )
    
    st.divider()
    
    # Session info
    st.subheader("📊 Session Info")
    st.text(f"Session ID: {st.session_state.session_id[:8]}...")
    st.text(f"Messages: {len(st.session_state.messages)}")
    
    # Clear conversation button
    if st.button("🗑️ Clear Conversation", use_container_width=True):
        try:
            response = requests.post(
                CLEAR_ENDPOINT,
                json={'sessionId': st.session_state.session_id},
                headers={'Content-Type': 'application/json'}
            )
            st.session_state.messages = []
            st.success("Conversation cleared!")
            st.rerun()
        except Exception as e:
            st.error(f"Error clearing conversation: {str(e)}")
    
    # New session button
    if st.button("🔄 New Session", use_container_width=True):
        st.session_state.session_id = str(uuid.uuid4())
        st.session_state.messages = []
        st.success("New session started!")
        st.rerun()
    
    st.divider()
    
    # System stats
    st.subheader("📈 System Stats")
    try:
        stats_response = requests.get(STATS_ENDPOINT)
        if stats_response.status_code == 200:
            stats = stats_response.json()['data']
            
            if 'vectorStore' in stats:
                st.metric("Total Chunks", stats['vectorStore'].get('totalChunks', 0))
            
            if 'cache' in stats:
                hit_rate = stats['cache'].get('hitRate', 0)
                st.metric("Cache Hit Rate", f"{hit_rate * 100:.1f}%")
            
            st.metric("Active Sessions", stats.get('activeSessions', 0))
    except Exception as e:
        st.warning("Unable to fetch stats")
    
    st.divider()
    
    # About
    st.subheader("ℹ️ About")
    st.info("""
    This chatbot helps you explore GitLab's Handbook and Direction pages using advanced AI.
    
    **Features:**
    - 🔍 Semantic search
    - 💬 Context-aware responses
    - 📚 Source attribution
    - 🛡️ Guardrails & transparency
    
    **Built with:**
    - Node.js + Express
    - Google Gemini AI
    - ChromaDB
    - Streamlit
    """)

# Main chat interface
st.header("💬 Chat")

# Display chat messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        
        # Display sources if available
        if message["role"] == "assistant" and "sources" in message:
            with st.expander("📚 View Sources"):
                for source in message["sources"]:
                    st.markdown(f"""
                    <div class="source-card">
                        <strong>Source {source['id']}: {source['title']}</strong><br>
                        <a href="{source['url']}" target="_blank">{source['url']}</a>
                        {f"<br>Relevance: {float(source['relevanceScore']) * 100:.1f}%" if source.get('relevanceScore') else ''}
                    </div>
                    """, unsafe_allow_html=True)
            
            # Display metadata
            if "metadata" in message:
                meta = message["metadata"]
                confidence = message.get("confidence", "unknown")
                
                confidence_class = f"confidence-{confidence}"
                
                st.caption(f"""
                ⏱️ Processing time: {meta.get('processingTimeMs', 0)}ms | 
                📊 Chunks retrieved: {meta.get('chunksRetrieved', 0)} | 
                <span class="{confidence_class}">🎯 Confidence: {confidence.upper()}</span>
                """, unsafe_allow_html=True)

# Chat input
if prompt := st.chat_input("Ask me anything about GitLab..."):
    # Add user message to chat
    st.session_state.messages.append({"role": "user", "content": prompt})
    
    with st.chat_message("user"):
        st.markdown(prompt)
    
    # Get AI response
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                # Call backend API
                response = requests.post(
                    API_ENDPOINT,
                    json={
                        'query': prompt,
                        'sessionId': st.session_state.session_id,
                        'useQueryExpansion': st.session_state.use_query_expansion
                    },
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()['data']
                    answer = data['answer']
                    sources = data.get('sources', [])
                    metadata = data.get('metadata', {})
                    confidence = data.get('confidence', 'unknown')
                    
                    # Display answer
                    st.markdown(answer)
                    
                    # Display sources
                    if sources:
                        with st.expander("📚 View Sources"):
                            for source in sources:
                                st.markdown(f"""
                                <div class="source-card">
                                    <strong>Source {source['id']}: {source['title']}</strong><br>
                                    <a href="{source['url']}" target="_blank">{source['url']}</a>
                                    {f"<br>Relevance: {float(source['relevanceScore']) * 100:.1f}%" if source.get('relevanceScore') else ''}
                                </div>
                                """, unsafe_allow_html=True)
                    
                    # Display metadata
                    confidence_class = f"confidence-{confidence}"
                    st.caption(f"""
                    ⏱️ Processing time: {metadata.get('processingTimeMs', 0)}ms | 
                    📊 Chunks retrieved: {metadata.get('chunksRetrieved', 0)} | 
                    <span class="{confidence_class}">🎯 Confidence: {confidence.upper()}</span>
                    """, unsafe_allow_html=True)
                    
                    # Add to session
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": answer,
                        "sources": sources,
                        "metadata": metadata,
                        "confidence": confidence
                    })
                    
                else:
                    error_message = "Sorry, I encountered an error processing your request."
                    st.error(error_message)
                    st.session_state.messages.append({
                        "role": "assistant",
                        "content": error_message
                    })
                    
            except requests.exceptions.Timeout:
                error_message = "Request timed out. Please try again."
                st.error(error_message)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": error_message
                })
            except Exception as e:
                error_message = f"An error occurred: {str(e)}"
                st.error(error_message)
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": error_message
                })

# Footer
st.divider()
st.caption("Built with ❤️ using Node.js, Streamlit, and Google Gemini AI | © 2025")
