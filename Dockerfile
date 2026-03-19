FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Standard install
RUN npm install

# Copy the rest of your files
COPY . .

EXPOSE 10000

CMD ["node", "server.js"]
