# Stage 1: Install development dependencies
FROM node:20-alpine AS development-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Install production dependencies
FROM node:20-alpine AS production-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 3: Build the app
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
# Bring over node_modules from the development stage if needed
COPY --from=development-deps /app/node_modules ./node_modules
RUN npm run build

# Stage 4: Run the production server
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

# Create a non-root user for additional security
RUN adduser -D appuser
USER appuser

CMD ["npm", "run", "start"]