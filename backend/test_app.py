#!/usr/bin/env python3
"""
Test script to check if the Flask app can start without errors.
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing Flask app import...")
    from flask_app import app
    print("✅ Flask app imported successfully")
    
    print("Testing health endpoint...")
    with app.test_client() as client:
        response = client.get('/api/health')
        print(f"✅ Health endpoint response: {response.status_code}")
        print(f"✅ Response data: {response.get_json()}")
        
    print("✅ All tests passed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)