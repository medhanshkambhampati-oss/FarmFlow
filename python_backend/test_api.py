import urllib.request
import json

url = "http://127.0.0.1:5000/predict"
data = {
    "N": 90,
    "P": 42,
    "K": 43,
    "ph": 6.5,
    "temperature": 34.0,
    "humidity": 40.0,
    "rainfall": 0.6
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as f:
        print(f"Status: {f.status}")
        print(f.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
