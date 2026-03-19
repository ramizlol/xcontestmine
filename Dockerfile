FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json first to cache layers
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your code (server.js, etc.)
COPY . .

# Render's port
EXPOSE 10000

# Start the app
CMD ["node", "server.js"]
