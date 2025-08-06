# Visualization

## Overview

Interactive dashboard built with Python and Plotly, featuring multiple chart types to analyze sales trends and patterns.

## Dashboard Components

**1. Time Series Analysis**
- Daily sales trends over 30-day period
- Identifies peak sales days and patterns
- Interactive zoom and hover details

**2. Category Performance**
- Sales distribution across product categories
- Bar chart with revenue totals
- Category ranking by performance

**3. Regional Analysis**
- Geographic sales distribution
- Pie chart showing regional market share
- Regional performance comparison

**4. Sales Distribution**
- Histogram of transaction values
- Understanding customer spending patterns
- Statistical insights (mean, median, outliers)

## Technical Implementation

- **Plotly**: Interactive web-based visualizations
- **Pandas**: Data processing and aggregation
- **PyMongo**: Direct MongoDB connection for real-time data
- **Matplotlib**: Fallback for static exports

## Viewing the Dashboard

```bash
python visualization.py
```

This generates:
- Interactive HTML dashboard (`dashboard.html`)
- Static PNG export (`dashboard.png`)
- Automatically opens in default browser

The visualization updates automatically when new data is ingested, making it suitable for real-time monitoring. 