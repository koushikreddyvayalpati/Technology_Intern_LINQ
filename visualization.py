import pymongo
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime, timedelta
import sys
import webbrowser
import os

class SalesDashboard:
    def __init__(self):
        self.client = None
        self.db = None
        self.collection = None
        self.data = None
    
    def connect_database(self):
        """Connect to MongoDB"""
        try:
            print("Connecting to MongoDB...")
            self.client = pymongo.MongoClient(
                'mongodb+srv://koushik1314:Kalyani713@linqbackend.o0g46ue.mongodb.net/?retryWrites=true&w=majority&appName=Linqbackend',
                serverSelectionTimeoutMS=10000
            )
            
            # Test connection
            self.client.admin.command('ismaster')
            
            self.db = self.client['linq_assessment']
            self.collection = self.db['sales_data']
            
            print(" Database connection successful")
            return True
            
        except Exception as e:
            print(f"Database connection failed: {e}")
            return False
    
    def fetch_data(self):
        """Fetch and prepare data for visualization"""
        try:
            print("Fetching data from database...")
            
            # Check if data exists
            count = self.collection.count_documents({})
            if count == 0:
                print("  No data found in database. Run data_ingest.py first.")
                return False
            
            print(f" Found {count} records")
            
            # Fetch all data
            cursor = self.collection.find({})
            data_list = list(cursor)
            
            # Convert to DataFrame
            self.data = pd.DataFrame(data_list)
            
            # Data preprocessing
            self.data['timestamp'] = pd.to_datetime(self.data['timestamp'])
            self.data['date'] = self.data['timestamp'].dt.date
            self.data['hour'] = self.data['timestamp'].dt.hour
            
            print("Data fetching completed")
            return True
            
        except Exception as e:
            print(f"Data fetching failed: {e}")
            return False
    
    def create_time_series_chart(self):
        """Create daily sales trend chart"""
        daily_sales = self.data.groupby('date')['value'].agg(['sum', 'count']).reset_index()
        daily_sales.columns = ['date', 'total_sales', 'transaction_count']
        
        fig = go.Figure()
        
        # Sales line
        fig.add_trace(go.Scatter(
            x=daily_sales['date'],
            y=daily_sales['total_sales'],
            mode='lines+markers',
            name='Daily Sales ($)',
            line=dict(color='#1f77b4', width=3),
            marker=dict(size=8),
            hovertemplate='<b>%{x}</b><br>Sales: $%{y:,.2f}<extra></extra>'
        ))
        
        # Add trend line
        z = np.polyfit(range(len(daily_sales)), daily_sales['total_sales'], 1)
        trend_line = np.poly1d(z)(range(len(daily_sales)))
        
        fig.add_trace(go.Scatter(
            x=daily_sales['date'],
            y=trend_line,
            mode='lines',
            name='Trend',
            line=dict(color='red', width=2, dash='dash'),
            hovertemplate='Trend: $%{y:,.2f}<extra></extra>'
        ))
        
        fig.update_layout(
            title='Daily Sales Trends (30-Day Period)',
            xaxis_title='Date',
            yaxis_title='Sales Amount ($)',
            hovermode='x unified',
            showlegend=True
        )
        
        return fig
    
    def create_category_chart(self):
        """Create category performance chart"""
        category_sales = self.data.groupby('category')['value'].agg(['sum', 'count']).reset_index()
        category_sales.columns = ['category', 'total_sales', 'transaction_count']
        category_sales = category_sales.sort_values('total_sales', ascending=True)
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=category_sales['total_sales'],
            y=category_sales['category'],
            orientation='h',
            marker=dict(color='#ff7f0e'),
            text=[f'${x:,.0f}' for x in category_sales['total_sales']],
            textposition='outside',
            hovertemplate='<b>%{y}</b><br>Sales: $%{x:,.2f}<br>Transactions: %{customdata}<extra></extra>',
            customdata=category_sales['transaction_count']
        ))
        
        fig.update_layout(
            title='Sales Performance by Category',
            xaxis_title='Total Sales ($)',
            yaxis_title='Category',
            showlegend=False
        )
        
        return fig
    
    def create_regional_chart(self):
        """Create regional distribution pie chart"""
        regional_sales = self.data.groupby('region')['value'].sum().reset_index()
        regional_sales.columns = ['region', 'total_sales']
        
        fig = go.Figure()
        
        fig.add_trace(go.Pie(
            labels=regional_sales['region'],
            values=regional_sales['total_sales'],
            hole=0.3,
            marker=dict(colors=px.colors.qualitative.Set3),
            textinfo='label+percent',
            textposition='outside',
            hovertemplate='<b>%{label}</b><br>Sales: $%{value:,.2f}<br>Percentage: %{percent}<extra></extra>'
        ))
        
        fig.update_layout(
            title='Regional Sales Distribution',
            showlegend=False
        )
        
        return fig
    
    def create_sales_distribution_chart(self):
        """Create sales value distribution histogram"""
        fig = go.Figure()
        
        fig.add_trace(go.Histogram(
            x=self.data['value'],
            nbinsx=30,
            marker=dict(color='#2ca02c', opacity=0.7),
            hovertemplate='Range: $%{x}<br>Count: %{y}<extra></extra>'
        ))
        
        # Add statistics
        mean_value = self.data['value'].mean()
        median_value = self.data['value'].median()
        
        fig.add_vline(x=mean_value, line_dash="dash", line_color="red", 
                     annotation_text=f"Mean: ${mean_value:.2f}")
        fig.add_vline(x=median_value, line_dash="dash", line_color="orange", 
                     annotation_text=f"Median: ${median_value:.2f}")
        
        fig.update_layout(
            title='Sales Value Distribution',
            xaxis_title='Transaction Value ($)',
            yaxis_title='Frequency',
            showlegend=False
        )
        
        return fig
    
    def create_hourly_pattern_chart(self):
        """Create hourly sales pattern chart"""
        hourly_sales = self.data.groupby('hour')['value'].agg(['sum', 'count']).reset_index()
        hourly_sales.columns = ['hour', 'total_sales', 'transaction_count']
        
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            x=hourly_sales['hour'],
            y=hourly_sales['total_sales'],
            marker=dict(color='#9467bd'),
            hovertemplate='<b>Hour: %{x}:00</b><br>Sales: $%{y:,.2f}<extra></extra>'
        ))
        
        fig.update_layout(
            title='Sales Pattern by Hour of Day',
            xaxis_title='Hour of Day',
            yaxis_title='Total Sales ($)',
            xaxis=dict(tickmode='linear', dtick=2),
            showlegend=False
        )
        
        return fig
    
    def generate_summary_stats(self):
        """Generate summary statistics"""
        stats = {
            'total_sales': self.data['value'].sum(),
            'total_transactions': len(self.data),
            'avg_transaction': self.data['value'].mean(),
            'date_range': f"{self.data['date'].min()} to {self.data['date'].max()}",
            'top_category': self.data.groupby('category')['value'].sum().idxmax(),
            'top_region': self.data.groupby('region')['value'].sum().idxmax()
        }
        return stats
    
    def create_dashboard(self):
        """Create comprehensive dashboard"""
        print("📊 Creating dashboard visualizations...")
        
        # Create subplots
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=[
                'Daily Sales Trends', 'Category Performance',
                'Regional Distribution', 'Sales Value Distribution',
                'Hourly Sales Pattern', 'Key Metrics'
            ],
            specs=[
                [{"secondary_y": False}, {"secondary_y": False}],
                [{"type": "pie"}, {"secondary_y": False}],
                [{"secondary_y": False}, {"type": "table"}]
            ],
            vertical_spacing=0.12,
            horizontal_spacing=0.1
        )
        
        # Time series (row 1, col 1)
        daily_sales = self.data.groupby('date')['value'].sum().reset_index()
        fig.add_trace(
            go.Scatter(x=daily_sales['date'], y=daily_sales['value'], 
                      mode='lines+markers', name='Daily Sales',
                      line=dict(color='#1f77b4')),
            row=1, col=1
        )
        
        # Category bar chart (row 1, col 2)
        category_sales = self.data.groupby('category')['value'].sum().sort_values(ascending=True)
        fig.add_trace(
            go.Bar(x=category_sales.values, y=category_sales.index, 
                   orientation='h', name='Category Sales',
                   marker=dict(color='#ff7f0e')),
            row=1, col=2
        )
        
        # Regional pie chart (row 2, col 1)
        regional_sales = self.data.groupby('region')['value'].sum()
        fig.add_trace(
            go.Pie(labels=regional_sales.index, values=regional_sales.values,
                   name='Regional Sales'),
            row=2, col=1
        )
        
        # Sales distribution histogram (row 2, col 2)
        fig.add_trace(
            go.Histogram(x=self.data['value'], name='Sales Distribution',
                        marker=dict(color='#2ca02c', opacity=0.7)),
            row=2, col=2
        )
        
        # Hourly pattern (row 3, col 1)
        hourly_sales = self.data.groupby('hour')['value'].sum()
        fig.add_trace(
            go.Bar(x=hourly_sales.index, y=hourly_sales.values,
                   name='Hourly Sales', marker=dict(color='#9467bd')),
            row=3, col=1
        )
        
        # Summary table (row 3, col 2)
        stats = self.generate_summary_stats()
        fig.add_trace(
            go.Table(
                header=dict(values=['Metric', 'Value'], fill_color='lightblue'),
                cells=dict(values=[
                    ['Total Sales', 'Total Transactions', 'Avg Transaction', 'Top Category', 'Top Region'],
                    [f"${stats['total_sales']:,.2f}", f"{stats['total_transactions']:,}", 
                     f"${stats['avg_transaction']:.2f}", stats['top_category'], stats['top_region']]
                ])
            ),
            row=3, col=2
        )
        
        # Update layout
        fig.update_layout(
            height=1200,
            title_text="Sales Analytics Dashboard",
            title_x=0.5,
            showlegend=False
        )
        
        return fig
    
    def save_dashboard(self, fig, filename='dashboard'):
        """Save dashboard as HTML and PNG"""
        try:
            # Save as HTML
            html_file = f"{filename}.html"
            fig.write_html(html_file)
            print(f" Dashboard saved as {html_file}")
            
            # Save as PNG
            png_file = f"{filename}.png"
            fig.write_image(png_file, width=1400, height=1200, scale=2)
            print(f"Dashboard saved as {png_file}")
            
            return html_file, png_file
            
        except Exception as e:
            print(f"Error saving dashboard: {e}")
            return None, None
    
    def open_dashboard(self, html_file):
        """Open dashboard in browser"""
        try:
            full_path = os.path.abspath(html_file)
            webbrowser.open(f'file://{full_path}')
            print(f"Dashboard opened in browser: {html_file}")
        except Exception as e:
            print(f"Error opening dashboard: {e}")
    
    def close_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("Database connection closed")

def main():
    dashboard = SalesDashboard()
    
    try:
        # Connect to database
        if not dashboard.connect_database():
            sys.exit(1)
        
        # Fetch data
        if not dashboard.fetch_data():
            sys.exit(1)
        
        # Create dashboard
        fig = dashboard.create_dashboard()
        
        # Save dashboard
        html_file, png_file = dashboard.save_dashboard(fig)
        
        if html_file:
            # Open in browser
            dashboard.open_dashboard(html_file)
            
            # Print summary
            stats = dashboard.generate_summary_stats()
            print("\n📈 Dashboard Summary:")
            print(f"   Total Sales: ${stats['total_sales']:,.2f}")
            print(f"   Total Transactions: {stats['total_transactions']:,}")
            print(f"   Average Transaction: ${stats['avg_transaction']:.2f}")
            print(f"   Date Range: {stats['date_range']}")
            print(f"   Top Category: {stats['top_category']}")
            print(f"   Top Region: {stats['top_region']}")
            
            print("\n Visualization completed successfully!")
        else:
            print("Dashboard creation failed")
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n Process interrupted by user")
    except Exception as e:
        print(f" Unexpected error: {e}")
        sys.exit(1)
    finally:
        dashboard.close_connection()

if __name__ == "__main__":
    main() 
