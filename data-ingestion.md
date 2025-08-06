# Data Ingestion

## Overview

The `data_ingest.py` script generates realistic sales data and inserts it into MongoDB. It simulates business patterns with seasonal trends and regional variations.

## Data Generation Strategy

**Realistic Patterns:**
- Business hours weighting (9 AM - 6 PM peak activity)
- Seasonal trends (higher sales in Q4)
- Regional distribution based on population density
- Category preferences by region

**Data Fields:**
- `category`: 8 product categories with realistic distribution
- `value`: Sales amounts following log-normal distribution ($10-$5000)
- `timestamp`: 30 days of historical data with hourly granularity
- `region`: 5 geographic regions (North, South, East, West, Central)
- `customer_id`: Unique identifiers simulating repeat customers

## Edge Cases Handled

1. **Database Connection**: Retry logic with exponential backoff
2. **Duplicate Prevention**: Unique customer ID generation
3. **Data Validation**: Type checking and range validation
4. **Memory Management**: Batch insertion for large datasets
5. **Network Issues**: Connection timeout and error recovery

## Execution

```bash
python data_ingest.py
```

Generates ~2000 records representing 30 days of business activity, optimized for meaningful visualizations. 