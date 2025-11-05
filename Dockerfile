FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app/backend

# Copy package manifest and install production deps first for layer caching
COPY backend/package.json backend/package-lock.json* ./

# Use npm ci for reproducible installs when lockfile exists, fallback to npm install
RUN if [ -f package-lock.json ]; then npm ci --production --silent; else npm install --production --silent; fi

# Copy backend source
COPY backend/ .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
