FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /usr/src/app

# Copy package files
COPY package.json ./

# Install dependencies with 'unsafe-perm' to bypass folder restrictions
RUN npm install --unsafe-perm=true || npm install --no-package-lock

# Copy the rest of your files
COPY . .

EXPOSE 10000

CMD ["node", "server.js"]
