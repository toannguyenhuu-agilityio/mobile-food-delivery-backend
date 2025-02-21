ARG NODE_VERSION=18

FROM node:${NODE_VERSION}-alpine AS base

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files to the container (use package.json and package-lock.json)
COPY package*.json ./

# Install dependencies (for all environments)
RUN npm install --production=false

# Install nodemon globally for dev environments
RUN npm install -g nodemon

EXPOSE 3000

# Stage for Development environment
FROM base AS dev
ENV NODE_ENV=development

# Install development dependencies
RUN npm ci --include=dev

USER node

# Copy the rest of the source code for the dev environment
COPY . .

# Start the app in development mode (using nodemon or similar)
CMD ["npm", "run", "dev"]

# Stage for Production environment
FROM base AS prod
ENV NODE_ENV=production

# Install production dependencies   
RUN npm ci --omit=dev

USER node

# Copy the rest of the source code for the prod environment
COPY . .

# Command to start the production app
CMD ["node", "src/index.ts"]

# Stage for Testing environment
FROM base AS test
ENV NODE_ENV=test

# Install test dependencies (dev dependencies included)
RUN npm ci --include=dev

USER node

# Copy the rest of the source code for the test environment
COPY . .

# Command to run the tests using Jest or another tool
CMD ["npm", "run", "test"]
