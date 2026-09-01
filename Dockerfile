# Use official lightweight Node.js Alpine base image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose app port
EXPOSE 3000

# Set production environment
ENV PORT=3000
ENV NODE_ENV=production

# Start command
CMD ["node", "server.js"]
