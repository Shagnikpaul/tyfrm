import subprocess
import sys
import time
import httpx


def main():
    print("Starting uvicorn server on port 8000 for Phase 4 verification...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(2)

    client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=10)
    try:
        # 1. Create a draft form
        r = client.post("/forms", json={"title": "Public & Responses Test Form"})
        assert r.status_code == 201, f"Create form failed: {r.text}"
        form = r.json()
        form_id = form["id"]
        slug = form["slug"]

        # Add questions: email (required), number (optional, min 1 max 10), rating (required, steps 5)
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "email", "title": "Your Email", "required": True},
        )
        assert r.status_code == 201
        q_email_id = r.json()["id"]

        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "number",
                "title": "Your Age",
                "required": False,
                "settings": {"min": 1, "max": 10},
            },
        )
        assert r.status_code == 201
        q_num_id = r.json()["id"]

        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "rating",
                "title": "Score",
                "required": True,
                "settings": {"steps": 5},
            },
        )
        assert r.status_code == 201
        q_rate_id = r.json()["id"]

        # 2. Check draft form via public endpoint -> 404 FORM_NOT_AVAILABLE
        r = client.get(f"/public/forms/{slug}")
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"
        assert r.json()["error"]["code"] == "FORM_NOT_AVAILABLE"

        r = client.post(f"/public/forms/{slug}/view")
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "FORM_NOT_AVAILABLE"

        r = client.post(f"/public/forms/{slug}/responses", json={"answers": []})
        assert r.status_code == 404
        assert r.json()["error"]["code"] == "FORM_NOT_AVAILABLE"

        # 3. Publish form
        r = client.post(f"/forms/{form_id}/publish")
        assert r.status_code == 200
        assert r.json()["status"] == "published"

        # 4. Fetch public form
        r = client.get(f"/public/forms/{slug}")
        assert r.status_code == 200
        pub = r.json()
        assert pub["slug"] == slug
        assert len(pub["questions"]) == 3
        # Ensure no user_id or counts leaked
        assert "user_id" not in pub
        assert "view_count" not in pub
        assert "response_count" not in pub

        # 5. Record view
        r = client.post(f"/public/forms/{slug}/view")
        assert r.status_code == 204

        # Check view count updated in creator form
        r = client.get(f"/forms/{form_id}")
        assert r.json()["view_count"] == 1

        # 6. Submit with zero answers when required questions exist -> 422 "Some answers are invalid" with "This question is required"
        r = client.post(f"/public/forms/{slug}/responses", json={"answers": []})
        assert r.status_code == 422
        assert r.json()["error"]["code"] == "VALIDATION_ERROR"
        assert r.json()["error"]["message"] == "Some answers are invalid"
        assert any(d["message"] == "This question is required" for d in r.json()["error"]["details"])

        # Test zero-answers submission on form with only optional questions
        r_opt = client.post("/forms", json={"title": "All Optional Form"})
        opt_form_id = r_opt.json()["id"]
        opt_slug = r_opt.json()["slug"]
        client.post(f"/forms/{opt_form_id}/questions", json={"type": "short_text", "title": "Optional Q", "required": False})
        client.post(f"/forms/{opt_form_id}/publish")
        r_empty = client.post(f"/public/forms/{opt_slug}/responses", json={"answers": []})
        assert r_empty.status_code == 422
        assert r_empty.json()["error"]["code"] == "VALIDATION_ERROR"
        assert r_empty.json()["error"]["message"] == "Please answer at least one question"
        client.delete(f"/forms/{opt_form_id}")

        # 7. Submit with invalid answers (alien id, bad email, number out of bounds)
        bad_answers = [
            {"question_id": "00000000-0000-0000-0000-000000000000", "value": "test"},
            {"question_id": q_email_id, "value": "notanemail"},
            {"question_id": q_num_id, "value": 99},
        ]
        r = client.post(f"/public/forms/{slug}/responses", json={"answers": bad_answers})
        assert r.status_code == 422
        err = r.json()["error"]
        assert err["code"] == "VALIDATION_ERROR"
        assert len(err["details"]) >= 1

        # 8. Submit valid response #1
        valid_answers_1 = [
            {"question_id": q_email_id, "value": " Alice@Example.COM "},
            {"question_id": q_num_id, "value": 7},
            {"question_id": q_rate_id, "value": 5},
        ]
        r = client.post(f"/public/forms/{slug}/responses", json={"answers": valid_answers_1})
        assert r.status_code == 201, f"Valid submit failed: {r.text}"
        res1 = r.json()
        assert "id" in res1
        assert "submitted_at" in res1
        res1_id = res1["id"]

        # 9. Submit valid response #2 with optional question skipped
        valid_answers_2 = [
            {"question_id": q_email_id, "value": "bob@example.com"},
            {"question_id": q_rate_id, "value": 4},
        ]
        r = client.post(f"/public/forms/{slug}/responses", json={"answers": valid_answers_2})
        assert r.status_code == 201
        res2_id = r.json()["id"]

        # 10. List responses in creator view
        r = client.get(f"/forms/{form_id}/responses")
        assert r.status_code == 200
        resp_list = r.json()
        assert resp_list["total"] == 2
        assert len(resp_list["items"]) == 2
        assert resp_list["page"] == 1

        # 11. Get single response
        r = client.get(f"/forms/{form_id}/responses/{res1_id}")
        assert r.status_code == 200
        single = r.json()
        assert single["id"] == res1_id
        # Email stored was trimmed and lowercased
        email_answer = next(a for a in single["answers"] if a["question_id"] == q_email_id)
        assert email_answer["value"] == "alice@example.com"
        # 3 answers stored
        assert len(single["answers"]) == 3

        r = client.get(f"/forms/{form_id}/responses/{res2_id}")
        assert r.status_code == 200
        single2 = r.json()
        # Skipped question has NO answer row stored
        assert len(single2["answers"]) == 2

        # 12. Cleanup
        client.delete(f"/forms/{form_id}")

        print("PHASE 4 VERIFICATION PASSED: Public endpoints and response submission verified!")
    finally:
        client.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
