# Use the official Node.js image.
FROM node:22-slim as builder

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json and package-lock.json are copied.
COPY package*.json ./

# Install dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Build the application.
RUN npm run build

# Use a lighter image for production.
FROM node:22-slim

WORKDIR /usr/src/app

# Copy package files and install production dependencies only.
COPY package*.json ./
RUN npm install --omit=dev

# Copy the build output and server file.
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server.ts ./server.ts

# The buildpack/Cloud Run environment uses the PORT environment variable.
ENV PORT 3000
EXPOSE 3000

# Run the web service on container startup.
CMD ["npm", "start"]
