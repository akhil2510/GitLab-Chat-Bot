FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ .

# Create necessary directories
RUN mkdir -p logs data/conversations

# Expose port (Render uses PORT env variable)
EXPOSE 10000

# Start server
CMD ["npm", "start"]
