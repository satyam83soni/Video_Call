# # Stage 1: Build the frontend
# FROM node:18-alpine AS build

# WORKDIR /app

# # Copy package files and install dependencies
# COPY package.json package-lock.json ./
# RUN npm install

# # Copy the rest of the code and build the frontend
# COPY . .
# RUN npm run build

# # Stage 2: Serve the frontend with Nginx
# FROM nginx:alpine

# # Copy the built files from the previous stage
# COPY --from=build /app/dist /usr/share/nginx/html

# # Copy Nginx configuration
# COPY nginx.conf /etc/nginx/nginx.conf

# # Expose the port Nginx is listening on
# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build the frontend
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code and build the frontend
COPY . .
RUN npm run build

# Stage 2: Serve the frontend with Nginx
FROM nginx:alpine

# Copy the built frontend files from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration from the current directory
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the port Nginx is listening on
EXPOSE 80

# Start Nginx in the foreground (required for Docker container)
CMD ["nginx", "-g", "daemon off;"]
