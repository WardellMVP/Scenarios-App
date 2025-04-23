# Use Node.js LTS as the base image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Create production image
FROM node:20-alpine AS runner

# Set the working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy necessary files from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/scenarios ./scenarios

# Expose the port the app runs on
EXPOSE 5000

# Start the server
CMD ["node", "dist/server/index.js"]