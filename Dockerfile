# Use the official Playwright image (matches your version 1.40)
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies (This will NOT run postinstall now)
RUN npm install

# Copy the rest of your code
COPY . .

# Expose the port Express uses (Render usually uses 10000)
EXPOSE 10000

# Start the server
CMD ["node", "server.js"]
