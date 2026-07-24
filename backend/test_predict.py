import urllib.request
import json

BASE = "http://127.0.0.1"

def test(label, url, data=None, method="POST", token=None):
    print(f"\n{'='*50}")
    print(f"TEST: {label}")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["token"] = token
    if data:
        payload = json.dumps(data).encode()
        req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as f:
            body = f.read().decode()
            print(f"Status: {f.status} OK")
            parsed = json.loads(body)
            print(json.dumps(parsed, indent=2)[:500])
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()[:300]}")
    except Exception as e:
        print(f"ERROR: {e}")

# Test 1: Python health
test("Python ML health", f"{BASE}:5000/", method="GET")

# Test 2: Python /predict direct
test("Python /predict direct", f"{BASE}:5000/predict", data={
    "N": 90, "P": 42, "K": 43, "ph": 6.5,
    "temperature": 27.0, "humidity": 60.0, "rainfall": 100.0
})

# Test 3: Node.js /farm/cp (no token — expect "Token is Required")
test("Node.js /farm/cp (no token)", f"{BASE}:3000/farm/cp", data={
    "farmId": "000000000000000000000001",
    "n": 90, "p": 42, "k": 43, "ph": 6.5
})

print("\n" + "="*50)
print("ALL TESTS DONE")
