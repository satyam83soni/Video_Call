# Stage 1: Build the backend
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port that your backend uses
EXPOSE 5000

# Command to run the server
CMD ["npm", "run", "dev"]
