# Multi-stage build for single container with Node.js + Python
FROM node:18-alpine AS node_base

# Install Python and system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    gcc \
    g++ \
    musl-dev \
    curl \
    bash

# Set working directory
WORKDIR /app

# Copy package files for Node.js
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies (override externally-managed-environment)
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy all application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Create startup script
RUN cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Starting Linq Assessment - Single Container Mode"
echo "📦 Container includes: Node.js API + Python Data Processing + MongoDB Client"

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down all services..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGTERM SIGINT

# Start the Node.js API server
echo "🟢 Starting Node.js API server on port 3000..."
npm start &
NODE_PID=$!

# Wait a bit for API to start
sleep 5

# Check if we should run real-time data generation
if [ "${ENABLE_REALTIME:-true}" = "true" ]; then
    echo "🔥 Starting high-throughput data generator (${TARGET_TPS:-50} TPS)..."
    python3 realtime_data_generator.py ${TARGET_TPS:-50} &
    PYTHON_PID=$!
fi

# Check if we should run real-time dashboard
if [ "${ENABLE_DASHBOARD:-true}" = "true" ]; then
    echo "📊 Starting real-time dashboard on port 3001..."
    node realtime_dashboard.js &
    DASHBOARD_PID=$!
fi

# Wait for any process to exit
wait
EOF

# Make script executable
RUN chmod +x start.sh

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check for API
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start all services
CMD ["./start.sh"] 