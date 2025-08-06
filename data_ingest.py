import pymongo
import random
import numpy as np
from datetime import datetime, timedelta
import time
import sys
from transformations import DataTransformer

class DataIngestion:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        
        # Realistic data configurations
        self.categories = [
            'Electronics', 'Clothing', 'Home & Garden', 'Sports',
            'Books', 'Health & Beauty', 'Automotive', 'Toys'
        ]
        
        self.regions = ['North', 'South', 'East', 'West', 'Central']
        
        # Regional weights (population-based)
        self.region_weights = [0.25, 0.20, 0.30, 0.15, 0.10]
        
        # Category preferences by region
        self.category_preferences = {
            'North': {'Electronics': 1.3, 'Automotive': 1.2},
            'South': {'Clothing': 1.2, 'Health & Beauty': 1.1},
            'East': {'Electronics': 1.4, 'Books': 1.3},
            'West': {'Sports': 1.3, 'Home & Garden': 1.2},
            'Central': {'Toys': 1.2, 'Books': 1.1}
        }
    
    def connect_database(self, retries=3):
        """Connect to MongoDB with retry logic"""
        for attempt in range(retries):
            try:
                print(f"🔌 Attempting database connection (attempt {attempt + 1}/{retries})")
                self.client = pymongo.MongoClient(
                    'mongodb+srv://koushik1314:Kalyani713@linqbackend.o0g46ue.mongodb.net/?retryWrites=true&w=majority&appName=Linqbackend',
                    serverSelectionTimeoutMS=10000
                )
                
                # Test connection
                self.client.admin.command('ismaster')
                
                self.db = self.client['linq_assessment']
                self.collection = self.db['sales_data']
                
                print("Database connection successful")
                return True
                
            except Exception as e:
                print(f"Connection attempt {attempt + 1} failed: {e}")
                if attempt < retries - 1:
                    wait_time = (2 ** attempt)  # Exponential backoff
                    print(f"Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    print("All connection attempts failed")
                    return False
    
    def generate_realistic_timestamp(self, days_back=30):
        """Generate timestamp with business hour weighting"""
        base_date = datetime.now() - timedelta(days=random.randint(0, days_back))
        
        # Weight towards business hours (9 AM - 6 PM)
        if random.random() < 0.7:  # 70% during business hours
            hour = random.randint(9, 18)
        else:
            hour = random.randint(0, 23)
        
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        
        return base_date.replace(hour=hour, minute=minute, second=second)
    
    def generate_sales_value(self):
        """Generate realistic sales values using log-normal distribution"""
        # Log-normal distribution for realistic sales data
        mu, sigma = 4.5, 1.2  # Parameters for $10-$5000 range
        value = np.random.lognormal(mu, sigma)
        
        # Clamp to reasonable range
        return round(max(10, min(5000, value)), 2)
    
    def select_category_for_region(self, region):
        """Select category based on regional preferences"""
        weights = []
        for category in self.categories:
            base_weight = 1.0
            if region in self.category_preferences:
                base_weight = self.category_preferences[region].get(category, 1.0)
            weights.append(base_weight)
        
        return random.choices(self.categories, weights=weights)[0]
    
    def generate_customer_id(self):
        """Generate unique customer ID"""
        return f"CUST_{random.randint(100000, 999999)}"
    
    def generate_sample_data(self, num_records=2000):
        """Generate realistic sample data"""
        print(f"📊 Generating {num_records} sample records...")
        
        data_batch = []
        
        for i in range(num_records):
            # Select region based on population weights
            region = random.choices(self.regions, weights=self.region_weights)[0]
            
            record = {
                'category': self.select_category_for_region(region),
                'value': self.generate_sales_value(),
                'timestamp': self.generate_realistic_timestamp(),
                'region': region,
                'customer_id': self.generate_customer_id()
            }
            
            data_batch.append(record)
            
            # Progress indicator
            if (i + 1) % 500 == 0:
                print(f"⏳ Generated {i + 1}/{num_records} records...")
        
        print("✅ Data generation completed")
        return data_batch
    
    def validate_data(self, record):
        """Validate individual record"""
        required_fields = ['category', 'value', 'timestamp', 'region', 'customer_id']
        
        for field in required_fields:
            if field not in record:
                return False, f"Missing field: {field}"
        
        if not isinstance(record['value'], (int, float)) or record['value'] <= 0:
            return False, "Invalid value"
        
        if record['category'] not in self.categories:
            return False, "Invalid category"
        
        if record['region'] not in self.regions:
            return False, "Invalid region"
        
        return True, "Valid"
    
    def insert_data(self, data_batch, batch_size=100):
        """Insert data with batch processing and validation"""
        print(f"💾 Inserting {len(data_batch)} records in batches of {batch_size}...")
        
        total_inserted = 0
        failed_records = 0
        
        for i in range(0, len(data_batch), batch_size):
            batch = data_batch[i:i + batch_size]
            
            # Validate batch
            valid_records = []
            for record in batch:
                is_valid, message = self.validate_data(record)
                if is_valid:
                    valid_records.append(record)
                else:
                    print(f"Skipping invalid record: {message}")
                    failed_records += 1
            
            if valid_records:
                try:
                    result = self.collection.insert_many(valid_records, ordered=False)
                    inserted_count = len(result.inserted_ids)
                    total_inserted += inserted_count
                    
                    print(f"Batch {i//batch_size + 1}: {inserted_count} records inserted")
                    
                except Exception as e:
                    print(f" Batch insertion failed: {e}")
                    failed_records += len(valid_records)
        
        print(f"📈 Insertion Summary:")
        print(f"   Total records: {len(data_batch)}")
        print(f"   Successfully inserted: {total_inserted}")
        print(f"   Failed: {failed_records}")
        
        return total_inserted
    
    def verify_insertion(self):
        """Verify data was inserted correctly"""
        try:
            total_count = self.collection.count_documents({})
            print(f"Verification: {total_count} total records in database")
            
            # Sample data check
            sample = self.collection.find().limit(3)
            print("Sample records:")
            for record in sample:
                print(f"   {record['timestamp'].strftime('%Y-%m-%d %H:%M')} | "
                      f"{record['category']} | ${record['value']} | {record['region']}")
            
            return total_count > 0
            
        except Exception as e:
            print(f"Verification failed: {e}")
            return False
    
    def close_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("Database connection closed")

def main():
    ingestion = DataIngestion()
    
    try:
        # Connect to database
        if not ingestion.connect_database():
            sys.exit(1)
        
        # Generate raw data
        raw_data = ingestion.generate_sample_data(2000)
        
        # Apply transformations
        transformer = DataTransformer()
        transformed_data, metrics = transformer.transform_pipeline(raw_data)
        
        print(f"\n Transformation Metrics:")
        print(f"   Total Revenue: ${metrics['total_revenue']:,.2f}")
        print(f"   Tax Collected: ${metrics['total_tax_collected']:,.2f}")
        print(f"   Commissions: ${metrics['total_commissions']:,.2f}")
        print(f"   Loyalty Points: {metrics['total_loyalty_points']:,}")
        print(f"   VIP Customers: {metrics['vip_customers']}")
        
        # Insert transformed data
        inserted_count = ingestion.insert_data(transformed_data)
        
        if inserted_count > 0:
            # Verify insertion
            if ingestion.verify_insertion():
                print("Data ingestion completed successfully!")
            else:
                print("Data ingestion completed with verification issues")
        else:
            print("Data ingestion failed")
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\nProcess interrupted by user")
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)
    finally:
        ingestion.close_connection()

if __name__ == "__main__":
    main() 
