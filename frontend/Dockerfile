FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (no need for legacy peer deps with Vite)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server with Vite
CMD ["npm", "run", "dev", "--", "--host"]
