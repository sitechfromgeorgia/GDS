#!/usr/bin/env python3
"""
Test API health and basic connectivity
"""
import sys
import time
import argparse
import requests
from datetime import datetime

def test_api_health(base_url, endpoints=None, timeout=10):
    """
    Test API health across multiple endpoints
    """
    print(f"Testing API: {base_url}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Default endpoints to test
    if endpoints is None:
        endpoints = [
            {'path': '/health', 'method': 'GET', 'expected': 200},
            {'path': '/status', 'method': 'GET', 'expected': 200},
            {'path': '/', 'method': 'GET', 'expected': 200}
        ]
    
    results = []
    
    for endpoint in endpoints:
        path = endpoint['path']
        method = endpoint.get('method', 'GET')
        expected_status = endpoint.get('expected', 200)
        
        url = f"{base_url.rstrip('/')}{path}"
        
        try:
            start_time = time.time()
            
            if method == 'GET':
                response = requests.get(url, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, timeout=timeout)
            else:
                response = requests.request(method, url, timeout=timeout)
            
            duration = (time.time() - start_time) * 1000  # Convert to ms
            
            status = "✅ PASS" if response.status_code == expected_status else "❌ FAIL"
            
            result = {
                'endpoint': path,
                'method': method,
                'status': status,
                'status_code': response.status_code,
                'expected_code': expected_status,
                'response_time_ms': round(duration, 2),
                'error': None
            }
            
        except requests.exceptions.Timeout:
            result = {
                'endpoint': path,
                'method': method,
                'status': "❌ TIMEOUT",
                'status_code': None,
                'expected_code': expected_status,
                'response_time_ms': timeout * 1000,
                'error': f"Request timeout ({timeout}s)"
            }
            
        except requests.exceptions.ConnectionError as e:
            result = {
                'endpoint': path,
                'method': method,
                'status': "❌ CONNECTION ERROR",
                'status_code': None,
                'expected_code': expected_status,
                'response_time_ms': None,
                'error': str(e)
            }
            
        except Exception as e:
            result = {
                'endpoint': path,
                'method': method,
                'status': "❌ ERROR",
                'status_code': None,
                'expected_code': expected_status,
                'response_time_ms': None,
                'error': str(e)
            }
        
        results.append(result)
        print_result(result)
    
    print("=" * 60)
    print_summary(results)
    
    # Return True if all tests passed
    return all(r['status'] == "✅ PASS" for r in results)

def print_result(result):
    """Print individual test result"""
    print(f"\n{result['status']} {result['method']} {result['endpoint']}")
    
    if result['status_code']:
        print(f"  Status Code: {result['status_code']} (expected: {result['expected_code']})")
    
    if result['response_time_ms']:
        time_status = "🔴" if result['response_time_ms'] > 1000 else "🟢"
        print(f"  Response Time: {time_status} {result['response_time_ms']}ms")
    
    if result['error']:
        print(f"  Error: {result['error']}")

def print_summary(results):
    """Print test summary"""
    total = len(results)
    passed = sum(1 for r in results if r['status'] == "✅ PASS")
    failed = total - passed
    
    print(f"\nSUMMARY:")
    print(f"  Total Tests: {total}")
    print(f"  Passed: {passed}")
    print(f"  Failed: {failed}")
    
    # Calculate average response time (for successful requests)
    response_times = [r['response_time_ms'] for r in results if r['response_time_ms']]
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        print(f"  Average Response Time: {avg_time:.2f}ms")
    
    if failed == 0:
        print(f"\n✅ All API health checks passed!")
    else:
        print(f"\n❌ {failed} health check(s) failed!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Test API health and connectivity')
    parser.add_argument('--base-url', required=True, help='Base URL of the API')
    parser.add_argument('--timeout', type=int, default=10, help='Request timeout in seconds')
    
    args = parser.parse_args()
    
    # Run health checks
    all_passed = test_api_health(args.base_url, timeout=args.timeout)
    
    sys.exit(0 if all_passed else 1)
