const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { connectDB } = require('./config/database');
const SalesData = require('./models/SalesData');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.REALTIME_PORT || 3001;

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Linq Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563eb;
            --secondary: #4f46e5;
            --accent: #0ea5e9;
            --success: #059669;
            --danger: #dc2626;
            --warning: #d97706;
            --dark: #111827;
            --gray-50: #f9fafb;
            --gray-100: #f3f4f6;
            --gray-200: #e5e7eb;
            --gray-300: #d1d5db;
            --gray-400: #9ca3af;
            --gray-500: #6b7280;
            --gray-600: #4b5563;
            --gray-700: #374151;
            --gray-800: #1f2937;
            --gray-900: #111827;
            --glass: rgba(255, 255, 255, 0.08);
            --glass-border: rgba(255, 255, 255, 0.12);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
            min-height: 100vh;
            overflow-x: hidden;
            position: relative;
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background: 
                radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.06) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.04) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }

        .loading-screen {
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .loading-screen.fade-out {
            opacity: 0;
            transform: scale(1.1);
        }

        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 24px;
        }

        .loading-text {
            color: #1e293b;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .loading-subtext {
            color: rgba(0, 0, 0, 0.6);
            font-size: 14px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .navbar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            padding: 16px 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .navbar-content {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #1e293b;
            font-size: 20px;
            font-weight: 700;
        }

        .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .status-badge::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: translateX(-100%);
            transition: transform 0.6s;
        }

        .status-badge.connected {
            background: rgba(16, 185, 129, 0.1);
            color: #059669;
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-badge.disconnected {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .status-badge.connected::before {
            transform: translateX(100%);
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .dashboard {
            padding: 32px 24px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }

        .main-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
        }

        .card {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            border: 1px solid rgba(0, 0, 0, 0.08);
            padding: 24px;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .card:hover {
            transform: translateY(-4px);
            border-color: rgba(59, 130, 246, 0.2);
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(59, 130, 246, 0.1);
        }

        .card:hover::before {
            opacity: 1;
        }

        .card-header {
            font-size: 14px;
            font-weight: 500;
            color: #64748b;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric {
            font-size: 36px;
            font-weight: 700;
            color: #1e293b;
            line-height: 1;
            background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }

        .transactions-container {
            grid-column: 1;
        }

        .categories-container {
            grid-column: 2;
        }

        .transactions-list {
            max-height: 400px;
            overflow-y: auto;
            padding-right: 8px;
        }

        .transactions-list::-webkit-scrollbar {
            width: 4px;
        }

        .transactions-list::-webkit-scrollbar-track {
            background: rgba(75, 85, 99, 0.2);
            border-radius: 2px;
        }

        .transactions-list::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.4);
            border-radius: 2px;
        }

        .transaction-item {
            background: rgba(248, 250, 252, 0.8);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            border: 1px solid rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
            animation: slideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .transaction-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 3px;
            height: 100%;
            background: linear-gradient(135deg, #3b82f6, #0ea5e9);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .transaction-item:hover {
            background: rgba(59, 130, 246, 0.05);
            transform: translateX(4px);
        }

        .transaction-item:hover::before {
            opacity: 1;
        }

        .transaction-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .transaction-id {
            font-weight: 600;
            color: #1e293b;
            font-size: 14px;
        }

        .transaction-amount {
            font-weight: 700;
            color: #059669;
            font-size: 16px;
        }

        .transaction-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: rgba(0, 0, 0, 0.6);
        }

        .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
        }

        .category-item:hover {
            padding-left: 8px;
        }

        .category-item:last-child {
            border-bottom: none;
        }

        .category-name {
            font-weight: 500;
            color: #1e293b;
            font-size: 14px;
        }

        .category-amount {
            font-weight: 600;
            color: #0ea5e9;
            font-size: 16px;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .hidden {
            display: none !important;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
            .main-grid {
                grid-template-columns: 1fr;
            }
            
            .categories-container {
                grid-column: 1;
            }
        }

        @media (max-width: 768px) {
            .dashboard {
                padding: 20px 16px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
            
            .card {
                padding: 20px;
            }
            
            .metric {
                font-size: 28px;
            }
            
            .navbar {
                padding: 12px 16px;
            }
            
            .navbar-content {
                flex-direction: column;
                gap: 12px;
            }
        }

        /* Performance optimizations */
        .card,
        .transaction-item,
        .status-badge {
            will-change: transform;
        }

        .metric {
            contain: layout style paint;
        }

        .transactions-list {
            contain: layout style;
        }
    </style>
</head>
<body>
    <div id="loading" class="loading-screen">
        <div class="loading-spinner"></div>
        <div class="loading-text">Initializing Dashboard</div>
        <div class="loading-subtext">Connecting to real-time data stream...</div>
    </div>

    <nav class="navbar">
        <div class="navbar-content">
            <div class="logo">
                <span>⚡</span>
                <span>Linq Dashboard</span>
            </div>
            <div id="status" class="status-badge disconnected">
                <div class="status-dot"></div>
                <span>Connecting...</span>
            </div>
        </div>
    </nav>

    <main class="dashboard">
        <div class="stats-grid">
            <div class="card">
                <div class="card-header">Total Transactions</div>
                <div id="totalTransactions" class="metric">0</div>
            </div>
            <div class="card">
                <div class="card-header">Today's Revenue</div>
                <div id="todayRevenue" class="metric">$0</div>
            </div>
            <div class="card">
                <div class="card-header">Recent Activity</div>
                <div id="recentCount" class="metric">0</div>
            </div>
        </div>

        <div class="main-grid">
            <div class="card transactions-container">
                <div class="card-header">Live Transactions</div>
                <div id="liveTransactions" class="transactions-list"></div>
            </div>
            <div class="card categories-container">
                <div class="card-header">Top Categories</div>
                <div id="topCategories"></div>
            </div>
        </div>
    </main>

    <script>
        class ModernDashboard {
            constructor() {
                this.socket = io();
                this.isConnected = false;
                this.dataReceived = false;
                this.transactionCount = 0;
                this.maxTransactions = 12;
                
                // Performance optimizations
                this.updateQueue = [];
                this.isUpdating = false;
                
                this.init();
            }
            
            init() {
                this.setupSocketHandlers();
                this.startUpdateLoop();
                
                // Hide loading after timeout
                setTimeout(() => {
                    if (!this.dataReceived) {
                        this.hideLoading();
                    }
                }, 8000);
            }
            
            setupSocketHandlers() {
                this.socket.on('connect', () => {
                    this.isConnected = true;
                    this.updateStatus('connected', 'Connected');
                });
                
                this.socket.on('disconnect', () => {
                    this.isConnected = false;
                    this.updateStatus('disconnected', 'Reconnecting...');
                });
                
                this.socket.on('stats_update', (data) => {
                    this.queueUpdate(() => this.updateStats(data));
                });
                
                this.socket.on('new_transaction', (tx) => {
                    this.queueUpdate(() => this.addTransaction(tx));
                });
                
                this.socket.on('category_stats', (categories) => {
                    this.queueUpdate(() => this.updateCategories(categories));
                });
            }
            
            queueUpdate(updateFn) {
                this.updateQueue.push(updateFn);
            }
            
            startUpdateLoop() {
                const processUpdates = () => {
                    if (this.updateQueue.length > 0 && !this.isUpdating) {
                        this.isUpdating = true;
                        
                        // Process all queued updates
                        const updates = this.updateQueue.splice(0);
                        updates.forEach(update => update());
                        
                        this.isUpdating = false;
                    }
                    
                    requestAnimationFrame(processUpdates);
                };
                
                requestAnimationFrame(processUpdates);
            }
            
            updateStatus(status, text) {
                const statusEl = document.getElementById('status');
                statusEl.className = 'status-badge ' + status;
                statusEl.querySelector('span').textContent = text;
            }
            
            updateStats(data) {
                const elements = {
                    totalTransactions: data.total_transactions ? data.total_transactions.toLocaleString() : '0',
                    todayRevenue: '$' + (data.today_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2}),
                    recentCount: (data.recent_count || 0).toLocaleString()
                };
                
                Object.entries(elements).forEach(([id, value]) => {
                    const el = document.getElementById(id);
                    if (el && el.textContent !== value) {
                        el.textContent = value;
                        el.style.transform = 'scale(1.05)';
                        setTimeout(() => el.style.transform = 'scale(1)', 200);
                    }
                });
                
                this.checkFirstData();
            }
            
            addTransaction(tx) {
                const container = document.getElementById('liveTransactions');
                
                // Limit transactions for performance
                if (container.children.length >= this.maxTransactions) {
                    const oldest = container.lastElementChild;
                    oldest.style.opacity = '0';
                    oldest.style.transform = 'translateX(-20px)';
                    setTimeout(() => oldest.remove(), 300);
                }
                
                const div = document.createElement('div');
                div.className = 'transaction-item';
                div.style.opacity = '0';
                div.style.transform = 'translateY(-20px)';
                
                div.innerHTML = '<div class="transaction-header">' +
                    '<div class="transaction-id">' + tx.customer_id + '</div>' +
                    '<div class="transaction-amount">$' + tx.value + '</div>' +
                    '</div>' +
                    '<div class="transaction-meta">' +
                    '<span>' + tx.category + ' • ' + tx.region + '</span>' +
                    '<span>' + new Date(tx.timestamp).toLocaleTimeString() + '</span>' +
                    '</div>';
                
                container.insertBefore(div, container.firstChild);
                
                // Animate in
                requestAnimationFrame(() => {
                    div.style.opacity = '1';
                    div.style.transform = 'translateY(0)';
                });
                
                this.checkFirstData();
            }
            
            updateCategories(categories) {
                const container = document.getElementById('topCategories');
                
                container.innerHTML = categories.map((cat, index) => 
                    '<div class="category-item" style="animation-delay: ' + (index * 0.1) + 's">' +
                    '<div class="category-name">' + cat._id + '</div>' +
                    '<div class="category-amount">$' + cat.total.toLocaleString() + '</div>' +
                    '</div>'
                ).join('');
                
                this.checkFirstData();
            }
            
            checkFirstData() {
                if (!this.dataReceived) {
                    this.dataReceived = true;
                    setTimeout(() => this.hideLoading(), 800);
                }
            }
            
            hideLoading() {
                const loading = document.getElementById('loading');
                loading.classList.add('fade-out');
                setTimeout(() => loading.classList.add('hidden'), 600);
            }
        }
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => new ModernDashboard());
        } else {
            new ModernDashboard();
        }
    </script>
</body>
</html>`);
});

// Ultra-optimized backend with advanced caching and performance features
class UltraPerformanceDashboard {
  constructor() {
    this.clients = new Map();
    this.cache = new Map();
    this.lastUpdate = 0;
    this.updateThrottle = 3000; // 3 second minimum between updates
    this.changeBuffer = [];
    this.bufferTimeout = null;
  }

  async start() {
    await connectDB();
    this.setupSockets();
    this.startOptimizedMonitoring();
    this.startCacheCleanup();
  }

  setupSockets() {
    io.on('connection', (socket) => {
      const clientId = socket.id;
      this.clients.set(clientId, { socket, connected: Date.now() });
      
      console.log(`Client connected (${this.clients.size} active)`);
      
      // Send cached data immediately
      this.sendCachedData(socket);
      
      socket.on('disconnect', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected (${this.clients.size} active)`);
      });
    });
  }

  async sendCachedData(socket) {
    const stats = await this.getOptimizedStats();
    if (stats) {
      socket.emit('stats_update', stats);
      socket.emit('category_stats', stats.top_categories);
    }
  }

  async getOptimizedStats() {
    const cacheKey = 'dashboard_stats';
    const now = Date.now();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < this.updateThrottle) {
      return cached.data;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fiveMinAgo = new Date(now - 5 * 60 * 1000);

      // Single optimized aggregation
      const [result] = await SalesData.aggregate([
        {
          $facet: {
            totals: [
              { $group: { _id: null, total_count: { $sum: 1 } } }
            ],
            today_stats: [
              { $match: { timestamp: { $gte: today } } },
              { 
                $group: { 
                  _id: null, 
                  revenue: { $sum: '$value' },
                  count: { $sum: 1 }
                }
              }
            ],
            recent: [
              { $match: { timestamp: { $gte: fiveMinAgo } } },
              { $group: { _id: null, count: { $sum: 1 } } }
            ],
            top_categories: [
              { $match: { timestamp: { $gte: today } } },
              { $group: { _id: '$category', total: { $sum: '$value' } } },
              { $sort: { total: -1 } },
              { $limit: 5 }
            ]
          }
        }
      ]);

      const stats = {
        total_transactions: result.totals[0]?.total_count || 0,
        today_revenue: result.today_stats[0]?.revenue || 0,
        recent_count: result.recent[0]?.count || 0,
        top_categories: result.top_categories || []
      };

      // Cache the result
      this.cache.set(cacheKey, { data: stats, timestamp: now });
      return stats;

    } catch (error) {
      console.error('Stats error:', error);
      return this.cache.get(cacheKey)?.data || this.getDefaultStats();
    }
  }

  getDefaultStats() {
    return {
      total_transactions: 0,
      today_revenue: 0,
      recent_count: 0,
      top_categories: []
    };
  }

  startOptimizedMonitoring() {
    // Optimized change stream
    const changeStream = SalesData.watch([
      { $match: { 'fullDocument': { $exists: true } } }
    ], { fullDocument: 'updateLookup' });
    
    changeStream.on('change', (change) => {
      if (change.operationType === 'insert' && this.clients.size > 0) {
        this.handleNewTransaction(change.fullDocument);
      }
    });

    // Batched stats updates
    setInterval(() => this.broadcastStatsUpdate(), 5000);
    
    console.log('Optimized monitoring started');
  }

  handleNewTransaction(transaction) {
    // Broadcast to all clients immediately
    const clients = Array.from(this.clients.values());
    clients.forEach(({ socket }) => {
      socket.emit('new_transaction', transaction);
    });
    
    // Invalidate cache
    this.cache.delete('dashboard_stats');
  }

  async broadcastStatsUpdate() {
    if (this.clients.size === 0) return;
    
    const stats = await this.getOptimizedStats();
    if (stats) {
      const clients = Array.from(this.clients.values());
      clients.forEach(({ socket }) => {
        socket.emit('stats_update', stats);
        socket.emit('category_stats', stats.top_categories);
      });
    }
  }

  startCacheCleanup() {
    // Clean up cache every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > 10 * 60 * 1000) {
          this.cache.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }
}

// Streamlined startup
async function startUltraModern() {
  try {
    const dashboard = new UltraPerformanceDashboard();
    await dashboard.start();
    
    server.listen(PORT, () => {
      console.log(`Ultra-Modern Dashboard: http://localhost:${PORT}`);
      console.log(`High-performance mode activated`);
    });
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startUltraModern();
}

module.exports = { startUltraModern };
