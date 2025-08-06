import pymongo
import random
import numpy as np
from datetime import datetime, timedelta
import time
import json
import threading
import asyncio
from concurrent.futures import ThreadPoolExecutor
from transformations import DataTransformer

class HighThroughputDataGenerator:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self.transformer = DataTransformer()
        self.running = False
        
        # High-throughput configuration
        self.target_tps = 50  # 50 transactions per second
        self.batch_size = 10  # Process in batches for better performance
        self.batch_interval = self.batch_size / self.target_tps  # ~0.2 seconds per batch
        
        # Real-time data configuration
        self.categories = [
            'Electronics', 'Clothing', 'Home & Garden', 'Sports',
            'Books', 'Health & Beauty', 'Automotive', 'Toys'
        ]
        self.regions = ['North', 'South', 'East', 'West', 'Central']
        self.region_weights = [0.25, 0.20, 0.30, 0.15, 0.10]
        
        # Peak hours simulation
        self.peak_hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
        
        # Performance tracking
        self.transaction_count = 0
        self.start_time = None
        
    def connect_database(self):
        """Connect to MongoDB with optimized settings"""
        try:
            self.client = pymongo.MongoClient(
                'mongodb+srv://koushik1314:Kalyani713@linqbackend.o0g46ue.mongodb.net/?retryWrites=true&w=majority&appName=Linqbackend',
                serverSelectionTimeoutMS=10000,
                maxPoolSize=50,  # Increase connection pool
                minPoolSize=5,
                maxIdleTimeMS=30000,
                waitQueueTimeoutMS=5000
            )
            self.client.admin.command('ismaster')
            self.db = self.client['linq_assessment']
            self.collection = self.db['sales_data']
            
            # Create indexes for better performance
            self.collection.create_index([("timestamp", -1)])
            self.collection.create_index([("customer_id", 1)])
            self.collection.create_index([("category", 1), ("region", 1)])
            
            print(" High-throughput generator connected to database")
            print(f" Target: {self.target_tps} transactions per second")
            return True
        except Exception as e:
            print(f" Database connection failed: {e}")
            return False
    
    def generate_transaction_batch(self, batch_size):
        """Generate a batch of realistic transactions"""
        transactions = []
        current_hour = datetime.now().hour
        
        # Adjust transaction probability based on time
        if current_hour in self.peak_hours:
            transaction_multiplier = 1.5
        elif 22 <= current_hour or current_hour <= 6:  # Night hours
            transaction_multiplier = 0.8
        else:
            transaction_multiplier = 1.0
        
        for _ in range(batch_size):
            # Select region with weights
            region = random.choices(self.regions, weights=self.region_weights)[0]
            
            # Generate realistic sales value using vectorized operations
            mu, sigma = 4.5, 1.2
            value = np.random.lognormal(mu, sigma)
            value = round(max(10, min(5000, value)), 2)
            
            transaction = {
                'category': random.choice(self.categories),
                'value': value,
                'timestamp': datetime.now(),
                'region': region,
                'customer_id': f"CUST_{random.randint(100000, 999999)}"
            }
            transactions.append(transaction)
        
        return transactions
    
    def process_and_store_batch(self, transactions):
        """Apply transformations and store batch of transactions"""
        try:
            if not transactions:
                return 0
            
            # Apply transformations to entire batch
            transformed_data, metrics = self.transformer.transform_pipeline(transactions)
            
            if transformed_data:
                # Bulk insert for better performance
                result = self.collection.insert_many(transformed_data, ordered=False)
                inserted_count = len(result.inserted_ids)
                
                self.transaction_count += inserted_count
                
                # Calculate current TPS
                if self.start_time:
                    elapsed = time.time() - self.start_time
                    current_tps = self.transaction_count / elapsed if elapsed > 0 else 0
                    
                    print(f" Batch: {inserted_count} transactions | Total: {self.transaction_count:,} | TPS: {current_tps:.1f}")
                else:
                    print(f" Batch: {inserted_count} transactions | Total: {self.transaction_count:,}")
                
                return inserted_count
        except Exception as e:
            print(f" Error processing batch: {e}")
            return 0
    
    def run_high_throughput_generation(self):
        """Run high-throughput data generation at 50 TPS"""
        print(f" Starting HIGH-THROUGHPUT generation: {self.target_tps} TPS")
        print(f" Batch size: {self.batch_size} | Interval: {self.batch_interval:.2f}s")
        
        self.running = True
        self.start_time = time.time()
        self.transaction_count = 0
        
        while self.running:
            try:
                batch_start = time.time()
                
                # Generate batch of transactions
                transactions = self.generate_transaction_batch(self.batch_size)
                
                # Process and store batch
                self.process_and_store_batch(transactions)
                
                # Calculate sleep time to maintain target TPS
                batch_duration = time.time() - batch_start
                sleep_time = max(0, self.batch_interval - batch_duration)
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                
            except KeyboardInterrupt:
                print("\n Stopping high-throughput generation...")
                self.running = False
            except Exception as e:
                print(f" Error in generation loop: {e}")
                time.sleep(1)  # Brief pause before retrying
    
    def run_burst_mode(self, duration_seconds=60, target_tps=100):
        """Run in burst mode for testing extreme loads"""
        print(f"💥 BURST MODE: {target_tps} TPS for {duration_seconds} seconds")
        
        self.running = True
        self.start_time = time.time()
        self.transaction_count = 0
        
        burst_batch_size = max(1, target_tps // 10)  # Adjust batch size for burst
        burst_interval = burst_batch_size / target_tps
        
        end_time = time.time() + duration_seconds
        
        while self.running and time.time() < end_time:
            try:
                batch_start = time.time()
                
                # Generate and process burst batch
                transactions = self.generate_transaction_batch(burst_batch_size)
                self.process_and_store_batch(transactions)
                
                # Maintain burst TPS
                batch_duration = time.time() - batch_start
                sleep_time = max(0, burst_interval - batch_duration)
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                
            except KeyboardInterrupt:
                print("\n Stopping burst mode...")
                break
            except Exception as e:
                print(f" Burst mode error: {e}")
                time.sleep(0.1)
        
        # Final statistics
        total_duration = time.time() - self.start_time
        final_tps = self.transaction_count / total_duration if total_duration > 0 else 0
        
        print(f"\n BURST MODE COMPLETE:")
        print(f"   Duration: {total_duration:.1f} seconds")
        print(f"   Total Transactions: {self.transaction_count:,}")
        print(f"   Achieved TPS: {final_tps:.1f}")
        print(f"   Target TPS: {target_tps}")
        print(f"   Efficiency: {(final_tps/target_tps)*100:.1f}%")
        
        self.running = False
    
    def stop_generation(self):
        """Stop the generation and show final stats"""
        self.running = False
        
        if self.start_time and self.transaction_count > 0:
            total_duration = time.time() - self.start_time
            final_tps = self.transaction_count / total_duration
            
            print(f"\n FINAL STATISTICS:")
            print(f"   Total Runtime: {total_duration:.1f} seconds")
            print(f"   Total Transactions: {self.transaction_count:,}")
            print(f"   Average TPS: {final_tps:.1f}")
            print(f"   Target TPS: {self.target_tps}")
            print(f"   Performance: {(final_tps/self.target_tps)*100:.1f}%")
        
        if self.client:
            self.client.close()
            print("Database connection closed")

# Legacy class for backward compatibility
class RealTimeDataGenerator(HighThroughputDataGenerator):
    def __init__(self):
        super().__init__()
        self.target_tps = 5  # Lower TPS for legacy mode
        self.batch_size = 1
        self.batch_interval = 1.0
    
    def run_continuous_generation(self, interval_seconds=30):
        """Legacy method - redirects to high-throughput generation"""
        print("Legacy mode detected. Switching to optimized high-throughput generation...")
        self.run_high_throughput_generation()

class RealTimeMonitor:
    """Monitor real-time data and provide updates"""
    
    def __init__(self, generator):
        self.generator = generator
        self.monitoring = False
    
    def start_monitoring(self, update_interval=60):
        """Start monitoring and displaying stats"""
        print(f"Starting real-time monitoring (every {update_interval}s)")
        self.monitoring = True
        
        while self.monitoring:
            try:
                stats = self.generator.get_real_time_stats()
                if stats:
                    print(f"\n Real-time Stats ({stats['last_updated'][:19]}):")
                    print(f"   Total Transactions: {stats['total_transactions']:,}")
                    print(f"   Today's Transactions: {stats['today_transactions']:,}")
                    print(f"   Recent (5min): {stats['recent_transactions']:,}")
                
                time.sleep(update_interval)
                
            except KeyboardInterrupt:
                print("\n Stopping monitoring...")
                self.monitoring = False
            except Exception as e:
                print(f" Monitoring error: {e}")
                time.sleep(5)
    
    def stop_monitoring(self):
        """Stop monitoring"""
        self.monitoring = False

def main():
    """Main function to run high-throughput data generation"""
    import sys
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "burst":
            # Burst mode for testing
            duration = int(sys.argv[2]) if len(sys.argv) > 2 else 60
            target_tps = int(sys.argv[3]) if len(sys.argv) > 3 else 100
            
            generator = HighThroughputDataGenerator()
            if generator.connect_database():
                generator.run_burst_mode(duration, target_tps)
            return
        elif sys.argv[1] == "legacy":
            # Legacy mode
            generator = RealTimeDataGenerator()
        else:
            # Custom TPS
            try:
                target_tps = int(sys.argv[1])
                generator = HighThroughputDataGenerator()
                generator.target_tps = target_tps
                generator.batch_size = min(max(1, target_tps // 5), 20)
                generator.batch_interval = generator.batch_size / generator.target_tps
            except ValueError:
                print(" Invalid TPS value. Using default 50 TPS.")
                generator = HighThroughputDataGenerator()
    else:
        # Default high-throughput mode (50 TPS)
        generator = HighThroughputDataGenerator()
    
    if not generator.connect_database():
        return
    
    try:
        print(f"\n STARTING HIGH-THROUGHPUT DATA GENERATION")
        print(f" Target TPS: {generator.target_tps}")
        print(f" Batch Size: {generator.batch_size}")
        print(f"  Batch Interval: {generator.batch_interval:.3f}s")
        print(f" Usage examples:")
        print(f"   python realtime_data_generator.py          # 50 TPS (default)")
        print(f"   python realtime_data_generator.py 100      # 100 TPS")
        print(f"   python realtime_data_generator.py burst 30 200  # 200 TPS for 30 seconds")
        print(f"   python realtime_data_generator.py legacy   # Original slow mode")
        print(f"\n Press Ctrl+C to stop and see final statistics\n")
        
        # Start high-throughput generation
        generator.run_high_throughput_generation()
        
    except KeyboardInterrupt:
        print("\nShutting down high-throughput generator...")
    finally:
        generator.stop_generation()

if __name__ == "__main__":
    main() 
