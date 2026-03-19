FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies 
RUN npm install

# Copy your server.js and other files
COPY . .

# Match Render's default port
EXPOSE 10000

# Start command
CMD ["node", "server.js"]
