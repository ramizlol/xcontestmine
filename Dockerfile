# Use the official Playwright image which has all browsers & OS libs pre-installed
FROM mcr.microsoft.com/playwright:v1.41.0-jammy

# Set the working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (Playwright is already in the image, so this just gets your app code ready)
RUN npm install

# Copy the rest of your application code
COPY . .

# The command to start your app (replace 'index.js' with your actual entry file)
CMD ["node", "index.js"]
