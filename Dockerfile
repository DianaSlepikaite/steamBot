# Use Node.js LTS version
FROM node:18-alpine

# Install python and build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev deps for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create directory for database
RUN mkdir -p /app/data

# Expose port (if needed for health checks in the future)
EXPOSE 3000

# Run the bot
CMD ["npm", "start"]
