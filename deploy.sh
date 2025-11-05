#!/bin/bash

echo "🚀 GitLab Chatbot - Quick Deployment Script"
echo "==========================================="
echo ""

# Step 1: Vercel Login
echo "📱 Step 1: Login to Vercel"
echo "Run: vercel login"
echo "Then follow the authentication steps"
echo ""
read -p "Press ENTER after you've logged in..."

# Step 2: Deploy
echo ""
echo "🚀 Step 2: Deploying to Vercel..."
cd /Users/akhilesh/test
vercel --yes

# Get the deployment URL
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add environment variables in Vercel dashboard:"
echo "   - GEMINI_API_KEY"
echo "   - PINECONE_API_KEY"
echo "   - PINECONE_ENVIRONMENT=gcp-starter"
echo "   - PINECONE_INDEX=gitlab-handbook"
echo "   - HUGGINGFACE_API_KEY"
echo "   - EMBEDDING_PROVIDER=huggingface"
echo ""
echo "2. Update frontend/index.html with your backend URL"
echo ""
echo "3. Deploy frontend to Netlify by dragging frontend folder to:"
echo "   https://app.netlify.com/drop"
echo ""
echo "🎉 Your chatbot will be live!"
