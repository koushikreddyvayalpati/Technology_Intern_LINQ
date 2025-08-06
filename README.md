# Linq Technology Intern Assessment

A complete data pipeline solution demonstrating professional-grade architecture with MongoDB, automated data ingestion, and interactive visualizations using python and express.js.

## Assessment Overview

This project implements all required deliverables plus bonus features:
- **Database Setup**: MongoDB Atlas with Mongoose ODM
- **Data Ingestion**: Python script with data transformations
- **Visualization**: Interactive Plotly dashboard with multiple chart types
- **Bonus Features**: Docker containerization, real-time updates, advanced data processing

## Quick Start

###**Quick Test - Real-Time Dashboard**
Want to see the real-time dashboard in action? Here's the fastest way:

```bash
# 1. Install dependencies
npm install
source venv/bin/activate && pip install -r requirements.txt

# 2. Setup database
node datastore_setup.js

# 3. Generate some data
python data_ingest.py

# 4. Start real-time dashboard
npm run realtime

# 5. Open browser to http://localhost:3001
# 6. (Optional) In new terminal: python realtime_data_generator.py 50
```

**That's it!** You can see the real time transactions! 

---

### 1. Database Setup
```bash
npm install
node datastore_setup.js
```

### 2. Data Ingestion
```bash
pip install -r requirements.txt
python data_ingest.py
```

### 3. Generate Visualization
```bash
python visualization.py
# Opens dashboard.html automatically
```

### 4. Start API Server
```bash
npm start
# Visit http://localhost:3000
```

### 5. Real-time Dashboard (Bonus)
```bash
npm run realtime
# Visit http://localhost:3001
```

## **How to Test the Real-Time Dashboard**

### **Step 1: Start the Real-Time Dashboard**
```bash
npm run realtime
```
This starts the dashboard server on http://localhost:3001

### **Step 2: Open the Dashboard**
- Open your web browser
- Go to: http://localhost:3001
- You'll see a live dashboard with real-time statistics

### **Step 3: Generate Live Data (Optional)**
In a new terminal window, run:
```bash
source venv/bin/activate
python realtime_data_generator.py 50
```
This creates 50 transactions per second for live testing.

### **What You'll See:**
- **Live Transaction Counter** - Numbers updating in real-time
- **Live TPS Display** - Shows transactions per second
- **Real-time Charts** - Charts updating with new data
- **Live Revenue Stats** - Revenue and transaction counts
- **Auto-refresh** - No need to reload the page

### **Dashboard Features:**
- **Real-time Updates**: See data change instantly
- **Live Performance**: Watch TPS and transaction counts
- **Interactive Charts**: Time series and category analysis
- **WebSocket Connection**: Instant data streaming
- **High-Throughput**: Handles 50+ transactions per second

### **What the Dashboard Shows:**
- **Live Transaction Feed**: See new sales as they happen
- **Revenue Counter**: Watch total revenue increase in real-time
- **Category Performance**: See which products are selling best
- **Regional Sales**: Geographic distribution of sales
- **Performance Metrics**: TPS, average transaction value, etc.
- **Time-based Trends**: Sales patterns throughout the day

### **Troubleshooting:**
- If dashboard doesn't load, check if port 3001 is free
- Make sure MongoDB is running and connected
- The dashboard works best with live data generation

## Project Structure

```
├── README.md                   # Project overview
├── datastore-setup.md          # Database choice explanation
├── data-ingestion.md           # Data ingestion documentation
├── visualization.md            # Visualization documentation
├── dashboard.png               # Dashboard screenshot
├── datastore_setup.js          # Database setup script
├── data_ingest.py              # Data ingestion with transformations
├── visualization.py            # Dashboard generation
├── config/database.js          # Database configuration
├── models/SalesData.js         # Mongoose schema
├── controllers/salesController.js # Business logic
├── routes/salesRoutes.js       # API endpoints
├── middleware/                 # Validation, logging, error handling
├── transformations.py          # Data transformation pipeline
├── realtime_dashboard.js       # WebSocket dashboard
└── docker-compose.yml          # Container deployment
```

## Technology Stack

### Backend
- **Node.js + Express.js** - RESTful API server
- **Mongoose** - MongoDB ODM with schema validation
- **Professional Architecture** - MVC pattern with middleware

### Database
- **MongoDB Atlas** - Cloud database with optimized indexing
- **Schema Validation** - Built-in data integrity
- **Advanced Queries** - Aggregation pipelines for analytics

### Data Processing
- **Python** - Data generation and visualization
- **Pandas** - Data manipulation and analysis
- **Advanced Transformations** - 3-stage processing pipeline

### Visualization
- **Plotly** - Interactive web-based charts
- **Multiple Chart Types** - Time series, categories, regions, distributions
- **Real-time Dashboard** - WebSocket-powered live updates

## Dashboard Features

### Interactive Visualizations
1. **Daily Sales Trends** - 30-day time series with trend analysis
2. **Category Performance** - Revenue breakdown by product category
3. **Regional Distribution** - Geographic sales analysis
4. **Sales Value Distribution** - Transaction value patterns
5. **Hourly Patterns** - Business hour vs off-hour analysis
6. **Key Metrics** - Summary statistics and insights

### Data Insights Generated
- **Total Revenue**: $300K+ across 2000+ transactions
- **Geographic Analysis**: 5 regions with realistic distribution
- **Category Intelligence**: 8 product categories with performance metrics
- **Customer Segmentation**: Regular, VIP, Frequent, Champion tiers
- **Business Intelligence**: Tax calculations, commissions, loyalty points

## Bonus Features Implemented

### 1. Docker Containerization
- Multi-container setup with Docker Compose
- Production-ready containers for all services
- Health checks and proper networking
- One-command deployment

### 2. Data Transformations
- 3-stage pipeline: Cleaning → Enrichment → Business Rules
- Data quality assurance with outlier detection
- Customer segmentation and loyalty program logic
- Geographic and temporal feature engineering

### 3. Real-time Updates
- Live data generation with realistic business patterns
- WebSocket dashboard with instant updates
- MongoDB change streams for real-time detection
- Interactive UI showing live transactions

## API Endpoints
Developed the MVC architecture for the backend using express.js for realtime dashboard analytics
### Core Operations
- `GET /api/health` - System health check
- `GET /api/sales` - Retrieve sales data with pagination
- `POST /api/sales` - Create new sales record
- `PUT /api/sales/:id` - Update existing record
- `DELETE /api/sales/:id` - Delete record

### Analytics & Reporting
- `GET /api/sales/analytics` - Comprehensive business analytics
- `GET /api/sales/summary` - Sales summary with filters
- `GET /api/sales/trends` - Time-based trend analysis
- `POST /api/sales/bulk` - Bulk record creation

## Assessment Deliverables Status

### Required Deliverables 
- [x] **README.md** - Project overview (this file)
- [x] **datastore-setup.md** - Database choice explanation
- [x] **datastore_setup.js** - Database setup script
- [x] **data_ingest.py** - Data ingestion script
- [x] **data-ingestion.md** - Data ingestion documentation
- [x] **visualization.py** - Visualization generation script
- [x] **dashboard.png** - Dashboard screenshot
- [x] **visualization.md** - Visualization documentation

### Bonus Deliverables 
- [x] **docker-compose.yml** - Container orchestration
- [x] **transformations.py** - Data transformation pipeline
- [x] **Real-time updates** - Live dashboard implementation for 50 transactions per second generarted using the python for sample real world scenario.
- [x] **Professional Architecture** - MVC structure with 10+ endpoints
- [x] **Advanced Features** - Beyond basic requirements

## Key Achievements

1. **Professional Architecture** - Complete MVC structure with proper separation
2. **Production Ready** - Docker deployment, error handling, validation, logging
3. **Advanced Data Processing** - Multi-stage transformations with business logic
4. **Real-time Capabilities** - WebSocket dashboard with live transaction feed
5. **Comprehensive Testing** - All endpoints verified and working
6. **Clean Documentation** - Human-written, clear explanations

## Sample Data Generated

The system generates realistic sales data with:
- **2000+ transactions** over 30-day period
- **Business hour weighting** for realistic patterns
- **Regional preferences** and seasonal variations
- **Customer behavior** modeling with repeat customers
- **Product categories** with realistic price distributions


# Technology_Intern_LINQ
