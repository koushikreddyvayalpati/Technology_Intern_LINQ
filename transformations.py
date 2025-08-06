import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import re

class DataTransformer:
    def __init__(self):
        self.category_mapping = {
            'Electronics': 'Tech',
            'Clothing': 'Fashion',
            'Home & Garden': 'Home',
            'Sports': 'Sports',
            'Books': 'Education',
            'Health & Beauty': 'Wellness',
            'Automotive': 'Auto',
            'Toys': 'Kids'
        }
        
        self.region_coordinates = {
            'North': {'lat': 45.0, 'lng': -100.0, 'timezone': 'America/Chicago'},
            'South': {'lat': 30.0, 'lng': -95.0, 'timezone': 'America/Chicago'},
            'East': {'lat': 40.0, 'lng': -75.0, 'timezone': 'America/New_York'},
            'West': {'lat': 37.0, 'lng': -120.0, 'timezone': 'America/Los_Angeles'},
            'Central': {'lat': 39.0, 'lng': -98.0, 'timezone': 'America/Chicago'}
        }

    def clean_data(self, data):
        """Clean and validate raw data"""
        print("🧹 Cleaning data...")
        
        # Convert to DataFrame if it's a list
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()
        
        original_count = len(df)
        
        # Remove duplicates based on customer_id and timestamp
        df = df.drop_duplicates(subset=['customer_id', 'timestamp'], keep='first')
        
        # Validate customer_id format
        df = df[df['customer_id'].str.match(r'^CUST_\d{6}$', na=False)]
        
        # Remove outliers (values beyond 3 standard deviations)
        mean_val = df['value'].mean()
        std_val = df['value'].std()
        df = df[np.abs(df['value'] - mean_val) <= (3 * std_val)]
        
        # Ensure positive values
        df = df[df['value'] > 0]
        
        cleaned_count = len(df)
        print(f"   Removed {original_count - cleaned_count} invalid records")
        print(f"   Retained {cleaned_count} clean records")
        
        return df

    def enrich_data(self, df):
        """Enrich data with additional calculated fields"""
        print("💎 Enriching data...")
        
        # Add price tier classification
        df['price_tier'] = pd.cut(df['value'], 
                                 bins=[0, 50, 150, 500, float('inf')],
                                 labels=['Budget', 'Mid-range', 'Premium', 'Luxury'])
        
        # Add time-based features
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.day_name()
        df['is_weekend'] = df['timestamp'].dt.weekday >= 5
        df['is_business_hours'] = (df['hour'] >= 9) & (df['hour'] <= 17)
        
        # Add seasonal classification
        df['month'] = df['timestamp'].dt.month
        df['season'] = df['month'].map({
            12: 'Winter', 1: 'Winter', 2: 'Winter',
            3: 'Spring', 4: 'Spring', 5: 'Spring',
            6: 'Summer', 7: 'Summer', 8: 'Summer',
            9: 'Fall', 10: 'Fall', 11: 'Fall'
        })
        
        # Add geographic enrichment
        df['region_lat'] = df['region'].map(lambda x: self.region_coordinates[x]['lat'])
        df['region_lng'] = df['region'].map(lambda x: self.region_coordinates[x]['lng'])
        df['timezone'] = df['region'].map(lambda x: self.region_coordinates[x]['timezone'])
        
        # Add customer segment based on transaction patterns
        customer_stats = df.groupby('customer_id')['value'].agg(['count', 'sum', 'mean']).reset_index()
        customer_stats.columns = ['customer_id', 'transaction_count', 'total_spent', 'avg_transaction']
        
        # Classify customers
        customer_stats['customer_segment'] = 'Regular'
        customer_stats.loc[customer_stats['total_spent'] > customer_stats['total_spent'].quantile(0.8), 'customer_segment'] = 'VIP'
        customer_stats.loc[customer_stats['transaction_count'] > customer_stats['transaction_count'].quantile(0.9), 'customer_segment'] = 'Frequent'
        customer_stats.loc[(customer_stats['total_spent'] > customer_stats['total_spent'].quantile(0.9)) & 
                          (customer_stats['transaction_count'] > customer_stats['transaction_count'].quantile(0.8)), 'customer_segment'] = 'Champion'
        
        # Merge customer segments back to main dataframe
        df = df.merge(customer_stats[['customer_id', 'customer_segment']], on='customer_id', how='left')
        
        print(f"   Added enrichment fields: price_tier, time features, geographic data, customer segments")
        
        return df

    def apply_business_rules(self, df):
        """Apply business-specific transformations"""
        print("📊 Applying business rules...")
        
        # Calculate discount eligibility
        df['discount_eligible'] = (
            (df['customer_segment'].isin(['VIP', 'Champion'])) |
            (df['value'] > 200) |
            (df['is_weekend'] == False)
        )
        
        # Calculate loyalty points (1 point per $10 spent)
        df['loyalty_points'] = (df['value'] / 10).astype(int)
        
        # Add sales commission calculation
        commission_rates = {
            'Electronics': 0.05,
            'Clothing': 0.08,
            'Home & Garden': 0.06,
            'Sports': 0.07,
            'Books': 0.03,
            'Health & Beauty': 0.09,
            'Automotive': 0.04,
            'Toys': 0.10
        }
        df['commission_rate'] = df['category'].map(commission_rates)
        df['commission_amount'] = df['value'] * df['commission_rate']
        
        # Add tax calculation (8.5% average sales tax)
        df['tax_amount'] = df['value'] * 0.085
        df['total_with_tax'] = df['value'] + df['tax_amount']
        
        print(f"   Applied business rules: discounts, loyalty points, commissions, taxes")
        
        return df

    def aggregate_metrics(self, df):
        """Calculate aggregate metrics for reporting"""
        print("📈 Calculating aggregate metrics...")
        
        metrics = {
            'total_records': len(df),
            'total_revenue': df['value'].sum(),
            'avg_transaction': df['value'].mean(),
            'total_tax_collected': df['tax_amount'].sum(),
            'total_commissions': df['commission_amount'].sum(),
            'total_loyalty_points': df['loyalty_points'].sum(),
            'unique_customers': df['customer_id'].nunique(),
            'categories_count': df['category'].nunique(),
            'regions_count': df['region'].nunique(),
            'weekend_transactions': df['is_weekend'].sum(),
            'business_hours_transactions': df['is_business_hours'].sum(),
            'vip_customers': len(df[df['customer_segment'] == 'VIP']),
            'champion_customers': len(df[df['customer_segment'] == 'Champion'])
        }
        
        print("   Calculated comprehensive business metrics")
        return metrics

    def transform_pipeline(self, raw_data):
        """Complete transformation pipeline"""
        print("🔄 Starting data transformation pipeline...")
        
        # Step 1: Clean data
        df = self.clean_data(raw_data)
        
        # Step 2: Enrich with additional fields
        df = self.enrich_data(df)
        
        # Step 3: Apply business rules
        df = self.apply_business_rules(df)
        
        # Step 4: Calculate metrics
        metrics = self.aggregate_metrics(df)
        
        print("✅ Data transformation pipeline completed")
        
        # Convert back to list of dictionaries for MongoDB
        transformed_data = df.to_dict('records')
        
        return transformed_data, metrics

def main():
    """Test the transformation pipeline"""
    transformer = DataTransformer()
    
    # Sample test data
    sample_data = [
        {
            'category': 'Electronics',
            'value': 299.99,
            'timestamp': datetime.now(),
            'region': 'North',
            'customer_id': 'CUST_123456'
        },
        {
            'category': 'Books',
            'value': 25.50,
            'timestamp': datetime.now() - timedelta(hours=2),
            'region': 'East',
            'customer_id': 'CUST_789012'
        }
    ]
    
    transformed_data, metrics = transformer.transform_pipeline(sample_data)
    
    print("\n📊 Sample Transformation Results:")
    print(f"Original records: {len(sample_data)}")
    print(f"Transformed records: {len(transformed_data)}")
    print(f"Total revenue: ${metrics['total_revenue']:.2f}")
    print(f"Average transaction: ${metrics['avg_transaction']:.2f}")

if __name__ == "__main__":
    main() 