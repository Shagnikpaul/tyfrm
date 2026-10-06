import os
import subprocess
import sys
import time
import httpx


def main():
    print("==================================================")
    print("STARTING FINAL END-TO-END SYSTEM VERIFICATION")
    print("==================================================")

    # 1. Fresh DB
    print("\n[Step 1] Ensuring fresh DB...")
    if os.path.exists("app.db"):
        os.remove("app.db")
    assert not os.path.exists("app.db")

    # 2. Alembic upgrade
    print("\n[Step 2] Running alembic upgrade head...")
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True)
    assert os.path.exists("app.db")

    # 3. Seed via CLI
    print("\n[Step 3] Running python -m app.seed --reset...")
    subprocess.run([sys.executable, "-m", "app.seed", "--reset"], check=True)

    # 4. Start server
    print("\n[Step 4] Starting uvicorn server on port 8000...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(3)

    client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=15)
    try:
        # Check health
        health = client.get("/health").json()
        assert health == {"status": "ok"}

        # 5. Create form & add each of the 8 question types
        print("\n[Step 5] Creating form and adding all 8 question types...")
        r = client.post("/forms", json={"title": "E2E Master Form"})
        assert r.status_code == 201
        form = r.json()
        form_id = form["id"]
        slug = form["slug"]

        q_ids = {}

        # 1. short_text
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "short_text", "title": "1. What is your name?", "required": True, "settings": {"max_length": 100}},
        )
        assert r.status_code == 201
        q_ids["short_text"] = r.json()["id"]

        # 2. long_text
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "long_text", "title": "2. Detailed Bio", "required": False, "settings": {"max_length": 1000}},
        )
        assert r.status_code == 201
        q_ids["long_text"] = r.json()["id"]

        # 3. multiple_choice
        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "multiple_choice",
                "title": "3. Favorite hobbies?",
                "required": False,
                "settings": {
                    "options": [
                        {"label": "Coding"},
                        {"label": "Music"},
                        {"label": "Gaming"},
                    ],
                    "allow_multiple": True,
                },
            },
        )
        assert r.status_code == 201
        q_ids["multiple_choice"] = r.json()["id"]

        # 4. dropdown
        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "dropdown",
                "title": "4. Primary OS?",
                "required": True,
                "settings": {
                    "options": [
                        {"label": "Linux"},
                        {"label": "macOS"},
                        {"label": "Windows"},
                    ]
                },
            },
        )
        assert r.status_code == 201
        q_ids["dropdown"] = r.json()["id"]

        # 5. email
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "email", "title": "5. Contact email?", "required": True},
        )
        assert r.status_code == 201
        q_ids["email"] = r.json()["id"]

        # 6. number
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "number", "title": "6. Years of experience?", "required": False, "settings": {"min": 0, "max": 40}},
        )
        assert r.status_code == 201
        q_ids["number"] = r.json()["id"]

        # 7. yes_no
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "yes_no", "title": "7. Are you open to relocation?", "required": True},
        )
        assert r.status_code == 201
        q_ids["yes_no"] = r.json()["id"]

        # 8. rating
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "rating", "title": "8. Rate overall satisfaction?", "required": True, "settings": {"steps": 5}},
        )
        assert r.status_code == 201
        q_ids["rating"] = r.json()["id"]

        # Verify all 8 questions in form detail
        form_detail = client.get(f"/forms/{form_id}").json()
        assert len(form_detail["questions"]) == 8

        # 6. Publish form
        print("\n[Step 6] Publishing form...")
        r = client.post(f"/forms/{form_id}/publish")
        assert r.status_code == 200
        assert r.json()["status"] == "published"

        # Record view
        client.post(f"/public/forms/{slug}/view")

        # 7. Submit invalid & valid response
        print("\n[Step 7] Testing submission validation...")
        # Invalid response: missing required email, invalid number (> 40), rating out of range
        invalid_sub = {
            "answers": [
                {"question_id": q_ids["short_text"], "value": "Jane Doe"},
                {"question_id": q_ids["number"], "value": 50},
                {"question_id": q_ids["rating"], "value": 10},
            ]
        }
        r = client.post(f"/public/forms/{slug}/responses", json=invalid_sub)
        assert r.status_code == 422
        err = r.json()["error"]
        assert err["code"] == "VALIDATION_ERROR"
        print("Invalid submission error details:", err["details"])
        assert any(d["question_id"] == q_ids["dropdown"] for d in err["details"])
        assert any(d["question_id"] == q_ids["email"] for d in err["details"])

        # Valid response
        valid_sub = {
            "answers": [
                {"question_id": q_ids["short_text"], "value": "  Jane Doe  "},
                {"question_id": q_ids["long_text"], "value": "Passionate backend engineer with 8 years of distributed systems experience."},
                {"question_id": q_ids["multiple_choice"], "value": ["Coding", "Gaming"]},
                {"question_id": q_ids["dropdown"], "value": "Linux"},
                {"question_id": q_ids["email"], "value": " Jane.Doe@Example.COM "},
                {"question_id": q_ids["number"], "value": 8},
                {"question_id": q_ids["yes_no"], "value": True},
                {"question_id": q_ids["rating"], "value": 5},
            ]
        }
        r = client.post(f"/public/forms/{slug}/responses", json=valid_sub)
        assert r.status_code == 201
        res = r.json()
        assert "id" in res
        res_id = res["id"]
        print("Valid submission recorded with response ID:", res_id)

        # 8. Fetch summary
        print("\n[Step 8] Fetching summary...")
        r = client.get(f"/forms/{form_id}/summary")
        assert r.status_code == 200
        summary = r.json()
        assert summary["total_responses"] == 1
        assert summary["views"] == 1
        assert summary["completion_rate"] == 1.0
        assert len(summary["questions"]) == 8
        print("Summary stats for 8 questions verified successfully.")

        # 9. Test 409 confirmation flow for delete and type change
        print("\n[Step 9] Testing 409 confirmation flow for delete and type change...")
        target_q_id = q_ids["rating"]

        # Type change without confirm -> 409 CONFIRMATION_REQUIRED
        r = client.patch(
            f"/forms/{form_id}/questions/{target_q_id}",
            json={"type": "short_text"},
        )
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "CONFIRMATION_REQUIRED"
        assert r.json()["error"]["details"][0]["action"] == "change_type"
        assert r.json()["error"]["details"][0]["answer_count"] == 1

        # Type change with confirm=true -> succeeds
        r = client.patch(
            f"/forms/{form_id}/questions/{target_q_id}?confirm=true",
            json={"type": "short_text"},
        )
        assert r.status_code == 200
        assert r.json()["type"] == "short_text"

        # Submit another answer for delete test
        client.post(
            f"/public/forms/{slug}/responses",
            json={
                "answers": [
                    {"question_id": target_q_id, "value": "Short answer now"},
                    {"question_id": q_ids["dropdown"], "value": "Linux"},
                    {"question_id": q_ids["email"], "value": "jane@example.com"},
                    {"question_id": q_ids["short_text"], "value": "Jane"},
                    {"question_id": q_ids["yes_no"], "value": False},
                ]
            },
        )

        # Delete question without confirm -> 409 CONFIRMATION_REQUIRED
        r = client.delete(f"/forms/{form_id}/questions/{target_q_id}")
        assert r.status_code == 409
        assert r.json()["error"]["code"] == "CONFIRMATION_REQUIRED"
        assert r.json()["error"]["details"][0]["action"] == "delete_question"

        # Delete question with confirm=true -> 204
        r = client.delete(f"/forms/{form_id}/questions/{target_q_id}?confirm=true")
        assert r.status_code == 204

        # Verify compacted positions
        form_after_del = client.get(f"/forms/{form_id}").json()
        assert len(form_after_del["questions"]) == 7
        positions = [q["position"] for q in form_after_del["questions"]]
        assert positions == list(range(7))

        # 10. Test /admin/reset
        print("\n[Step 10] Testing /admin/reset endpoint...")
        # Reset database
        r = client.post("/admin/reset", headers={"X-Admin-Token": "change-me"})
        assert r.status_code == 204

        # Confirm E2E Master Form is gone and default 4 seed forms are restored
        forms = client.get("/forms").json()["items"]
        assert len(forms) == 4
        slugs = {f["slug"] for f in forms}
        assert "customer-feedback" in slugs
        assert "event-registration" in slugs
        assert "job-application" in slugs
        assert "product-launch-quiz" in slugs

        print("\n==================================================")
        print("FINAL END-TO-END VERIFICATION COMPLETED WITH 100% SUCCESS!")
        print("==================================================")
    finally:
        client.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
