#!/usr/bin/env python3
"""
Test script to verify Railway deployment works correctly.
"""
import requests
import time
import sys

def test_railway_deployment(base_url):
    """Test Railway deployment endpoints."""
    print(f"🧪 Testing Railway Deployment: {base_url}")
    print("=" * 60)
    
    # Test 1: Health Check
    print("1️⃣ Testing Health Endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=10)
        if response.status_code == 200:
            print("   ✅ Health check passed")
            print(f"   📊 Response: {response.json()}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False
    
    # Test 2: Data Status
    print("\n2️⃣ Testing Data Status...")
    try:
        response = requests.get(f"{base_url}/api/status", timeout=30)
        if response.status_code == 200:
            data = response.json()
            print("   ✅ Status endpoint works")
            print(f"   📊 Data loaded: {data.get('data_loaded', False)}")
            print(f"   📊 Players: {data.get('players_count', 0):,}")
            print(f"   📊 Teams: {data.get('teams_count', 0):,}")
        else:
            print(f"   ❌ Status check failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Status check error: {e}")
    
    # Test 3: Players Endpoint (may take time for data loading)
    print("\n3️⃣ Testing Players Endpoint (may take 60-90 seconds)...")
    try:
        start_time = time.time()
        response = requests.get(f"{base_url}/api/players?limit=5", timeout=120)
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            players = data.get('players', [])
            print(f"   ✅ Players endpoint works ({elapsed:.1f}s)")
            print(f"   📊 Returned {len(players)} players")
            if players:
                print(f"   📊 Sample player: {players[0].get('short_name', 'Unknown')}")
        else:
            print(f"   ❌ Players endpoint failed: {response.status_code}")
            print(f"   📊 Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Players endpoint error: {e}")
    
    # Test 4: API Documentation
    print("\n4️⃣ Testing API Documentation...")
    try:
        response = requests.get(f"{base_url}/docs", timeout=10)
        if response.status_code == 200:
            print("   ✅ API documentation accessible")
        else:
            print(f"   ❌ API docs failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ API docs error: {e}")
    
    print("\n🎉 Railway deployment test completed!")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        url = sys.argv[1].rstrip('/')
    else:
        url = input("Enter your Railway deployment URL (e.g., https://your-project.railway.app): ").rstrip('/')
    
    test_railway_deployment(url)