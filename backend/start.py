#!/usr/bin/env python3
"""
Startup script for Soccer Chemistry API with Supabase integration.
"""
import os
import sys
import logging
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Main startup function."""
    print("🚀 Starting Soccer Chemistry API with Supabase")
    print("=" * 60)
    
    # Test data loading first
    try:
        print("📡 Testing Supabase data loading...")
        from services.data_loader import data_loader
        
        # Load data to verify everything works
        data_loader.load_data()
        
        print(f"✅ Data loaded successfully:")
        print(f"   Players: {len(data_loader.players_enriched):,}")
        print(f"   Teams: {len(data_loader.teams_data):,}")
        print(f"   Competitions: {len(data_loader.competitions_data):,}")
        
    except Exception as e:
        print(f"❌ Data loading failed: {e}")
        print("💡 Make sure you have internet connection for Supabase access")
        return False
    
    # Start the server
    print("\n🌐 Starting FastAPI server...")
    try:
        import uvicorn
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=int(os.getenv("PORT", 8000)),
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)