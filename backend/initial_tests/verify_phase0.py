import subprocess
import time
import sys
import httpx

def main():
    print("Starting uvicorn server on port 8000...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    try:
        # Wait up to 10 seconds for server to be up
        time.sleep(2)
        base_url = "http://127.0.0.1:8000"
        
        # Test /api/v1/health
        health_resp = httpx.get(f"{base_url}/api/v1/health", timeout=5)
        print("Health status code:", health_resp.status_code)
        print("Health body:", health_resp.json())
        assert health_resp.status_code == 200, f"Expected 200, got {health_resp.status_code}"
        assert health_resp.json() == {"status": "ok"}, f"Unexpected body: {health_resp.json()}"
        
        # Test /docs
        docs_resp = httpx.get(f"{base_url}/docs", timeout=5)
        print("Docs status code:", docs_resp.status_code)
        assert docs_resp.status_code == 200, f"Expected 200, got {docs_resp.status_code}"
        
        print("PHASE 0 VERIFICATION PASSED!")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

if __name__ == "__main__":
    main()
