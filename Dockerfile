# Building layer
FROM node:20-alpine AS development
# Create working directory
WORKDIR /app

# Copy configuration files
COPY tsconfig*.json ./
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the app
RUN npm run build

# Expose app port
EXPOSE 5000

# Start the app in development mode
CMD ["npm", "run", "start:dev"]



# Production layer
FROM node:20-alpine as production

# Set working directory
WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built code from the development stage
COPY --from=development /app/dist/ ./dist/

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "dist/main.js"]
