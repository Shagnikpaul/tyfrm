import os
import subprocess
import sys
import time
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.models.user import User


def main():
    print("Preparing fresh app.db for Phase 6 verification...")
    # Stop any running process / remove app.db
    if os.path.exists("app.db"):
        os.remove("app.db")

    # Run alembic upgrade head
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True)

    print("Starting uvicorn server (will seed on startup)...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(3)

    client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=15)
    try:
        # 1. Fetch forms -> verify seeded automatically
        r = client.get("/forms")
        assert r.status_code == 200, f"Get forms failed: {r.text}"
        forms = r.json()["items"]
        assert len(forms) == 4, f"Expected 4 seeded forms, got {len(forms)}"

        slug_map = {f["slug"]: f for f in forms}
        assert "customer-feedback" in slug_map
        assert "event-registration" in slug_map
        assert "job-application" in slug_map
        assert "product-launch-quiz" in slug_map

        # Check published statuses
        assert slug_map["customer-feedback"]["status"] == "published"
        assert slug_map["event-registration"]["status"] == "published"
        assert slug_map["job-application"]["status"] == "published"
        assert slug_map["product-launch-quiz"]["status"] == "draft"

        # Check counts
        assert slug_map["customer-feedback"]["response_count"] == 24
        assert slug_map["event-registration"]["response_count"] == 20
        assert slug_map["job-application"]["response_count"] == 18
        assert slug_map["product-launch-quiz"]["response_count"] == 0

        # Check job application welcome screen
        job_form = client.get(f"/forms/{slug_map['job-application']['id']}").json()
        assert job_form["welcome"]["enabled"] is True

        # Check that all 8 question types are covered
        all_types = set()
        for f in forms:
            f_detail = client.get(f"/forms/{f['id']}").json()
            for q in f_detail["questions"]:
                all_types.add(q["type"])
        print("Question types covered in seed:", all_types)
        expected_types = {
            "short_text", "long_text", "multiple_choice", "dropdown",
            "email", "number", "yes_no", "rating"
        }
        assert expected_types.issubset(all_types), f"Missing types: {expected_types - all_types}"

        # 2. Modify state: delete the draft form
        draft_id = slug_map["product-launch-quiz"]["id"]
        del_resp = client.delete(f"/forms/{draft_id}")
        assert del_resp.status_code == 204
        assert len(client.get("/forms").json()["items"]) == 3

        # 3. Test Admin Reset endpoint
        # Without header
        r = client.post("/admin/reset")
        assert r.status_code == 401
        assert r.json()["error"]["code"] == "UNAUTHORIZED"

        # With wrong token
        r = client.post("/admin/reset", headers={"X-Admin-Token": "wrong-token"})
        assert r.status_code == 401
        assert r.json()["error"]["code"] == "UNAUTHORIZED"

        # With correct token
        r = client.post("/admin/reset", headers={"X-Admin-Token": "change-me"})
        assert r.status_code == 204

        # Verify state is restored to 4 forms
        forms_restored = client.get("/forms").json()["items"]
        assert len(forms_restored) == 4
        restored_slugs = {f["slug"] for f in forms_restored}
        assert "product-launch-quiz" in restored_slugs

        # 4. Test python -m app.seed --reset CLI
        cli_result = subprocess.run(
            [sys.executable, "-m", "app.seed", "--reset"],
            capture_output=True,
            text=True,
        )
        assert cli_result.returncode == 0, f"Seed CLI failed: {cli_result.stderr}"

        # Confirm database is intact
        forms_cli = client.get("/forms").json()["items"]
        assert len(forms_cli) == 4

        print("PHASE 6 VERIFICATION PASSED: Startup seed, all 8 types, --reset, and /admin/reset confirmed!")
    finally:
        client.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
