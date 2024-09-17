# Stage: build
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
# separate install to optimize build leveraging docker layer caching
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Stage 2: production
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Copy only the built files from the previous stage
COPY --from=builder /app/dist ./dist

# Copy package.json and package-lock.json
COPY package*.json ./

COPY --from=builder /app/order_service_openapi.yaml ./

# Install only production dependencies
RUN npm install --only=production

ENV NODE_ENV=production \
    NODE_PORT=8080

EXPOSE 8080

ENTRYPOINT ["node"]
CMD ["."]
