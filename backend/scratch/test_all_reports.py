import urllib.request
import urllib.error

# Bypass system proxies for local connections
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
urllib.request.install_opener(opener)

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IlVzZXIiLCJleHAiOjE3ODI5ODA3NDB9.kMdUeyeJJ1hmmLIHaMPkqFMRadnGH2Q3dlefVbSXI7g'
base_url = 'http://127.0.0.1:8000/api/projects/2/reports'

for fmt in ['excel', 'pdf', 'powerpoint']:
    url = f'{base_url}/{fmt}?token={token}'
    print(f"Testing format: {fmt} - Connecting to {url}...")
    try:
        res = urllib.request.urlopen(url, timeout=60)
        print(f"Format: {fmt} -> Success: {res.status} (Length: {len(res.read())})")
    except urllib.error.HTTPError as e:
        print(f"Format: {fmt} -> Error Code: {e.code}")
        print(f"Format: {fmt} -> Error Body: {e.read().decode()}")
    except Exception as e:
        print(f"Format: {fmt} -> Other Error: {str(e)}")
