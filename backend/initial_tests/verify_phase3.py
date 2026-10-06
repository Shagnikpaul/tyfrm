import subprocess
import sys
import time
import uuid
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.response import Response
from app.models.answer import Answer


def main():
    print("Starting uvicorn server on port 8000 for Phase 3 verification...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(2)

    client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=10)
    try:
        # 1. List forms
        r = client.get("/forms")
        assert r.status_code == 200, f"List forms failed: {r.text}"
        data = r.json()
        assert "items" in data

        # 2. Create form
        r = client.post("/forms", json={"title": "Phase 3 Test Form"})
        assert r.status_code == 201, f"Create form failed: {r.text}"
        form = r.json()
        form_id = form["id"]
        assert form["title"] == "Phase 3 Test Form"
        assert form["status"] == "draft"
        assert len(form["slug"]) == 8
        assert form["questions"] == []

        # 3. Get form
        r = client.get(f"/forms/{form_id}")
        assert r.status_code == 200
        assert r.json()["id"] == form_id

        # 4. Patch form
        r = client.patch(
            f"/forms/{form_id}",
            json={
                "title": "Renamed Form",
                "welcome": {"enabled": True, "title": "Welcome!"},
                "thank_you": {"title": "Thank you!"},
                "theme": {"accent": "#ff0000"},
            },
        )
        assert r.status_code == 200
        patched = r.json()
        assert patched["title"] == "Renamed Form"
        assert patched["welcome"]["enabled"] is True
        assert patched["welcome"]["title"] == "Welcome!"
        assert patched["thank_you"]["title"] == "Thank you!"
        assert patched["theme"]["accent"] == "#ff0000"

        # 5. Publish empty form -> 409 INVALID_STATE
        r = client.post(f"/forms/{form_id}/publish")
        assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
        err = r.json()["error"]
        assert err["code"] == "INVALID_STATE"

        # 6. Add questions
        # Q0: short_text
        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "short_text",
                "title": "What is your name?",
                "required": True,
                "settings": {"max_length": 100, "placeholder": "Name"},
            },
        )
        assert r.status_code == 201
        q0 = r.json()
        q0_id = q0["id"]
        assert q0["position"] == 0

        # Q1: rating
        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "rating",
                "title": "Rate us",
                "settings": {"steps": 5},
            },
        )
        assert r.status_code == 201
        q1 = r.json()
        q1_id = q1["id"]
        assert q1["position"] == 1

        # Q2 inserted at position 1 (shifting rating to position 2)
        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "dropdown",
                "title": "Select country",
                "position": 1,
                "settings": {
                    "options": [{"label": "USA"}, {"label": "Canada"}]
                },
            },
        )
        assert r.status_code == 201
        q_inserted = r.json()
        q_inserted_id = q_inserted["id"]
        assert q_inserted["position"] == 1

        # Verify positions in form detail
        r = client.get(f"/forms/{form_id}")
        questions = r.json()["questions"]
        assert len(questions) == 3
        assert questions[0]["id"] == q0_id and questions[0]["position"] == 0
        assert questions[1]["id"] == q_inserted_id and questions[1]["position"] == 1
        assert questions[2]["id"] == q1_id and questions[2]["position"] == 2

        # 7. Publish form with questions
        r = client.post(f"/forms/{form_id}/publish")
        assert r.status_code == 200
        assert r.json()["status"] == "published"
        assert r.json()["published_at"] is not None

        # 8. Unpublish form
        r = client.post(f"/forms/{form_id}/unpublish")
        assert r.status_code == 200
        assert r.json()["status"] == "draft"

        # 9. Duplicate form
        r = client.post(f"/forms/{form_id}/duplicate")
        assert r.status_code == 201
        dup = r.json()
        assert dup["id"] != form_id
        assert dup["title"] == "Copy of Renamed Form"
        assert dup["status"] == "draft"
        assert len(dup["questions"]) == 3
        assert dup["questions"][0]["id"] != q0_id
        # Delete duplicate form
        client.delete(f"/forms/{dup['id']}")

        # 10. Reorder questions
        new_order = [q1_id, q0_id, q_inserted_id]
        r = client.put(f"/forms/{form_id}/questions/order", json={"question_ids": new_order})
        assert r.status_code == 200
        reordered = r.json()["questions"]
        assert [q["id"] for q in reordered] == new_order
        assert [q["position"] for q in reordered] == [0, 1, 2]

        # 11. Confirmation flow test
        # Inject an answer for q0 in the DB directly
        engine = create_engine(settings.DATABASE_URL)
        with Session(engine) as session:
            resp_id = str(uuid.uuid4())
            resp = Response(id=resp_id, form_id=form_id)
            session.add(resp)
            ans = Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q0_id, value="Test Answer")
            session.add(ans)
            session.commit()

        # Try changing q0 type without confirm -> 409 CONFIRMATION_REQUIRED
        r = client.patch(
            f"/forms/{form_id}/questions/{q0_id}",
            json={"type": "long_text"},
        )
        assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
        err = r.json()["error"]
        assert err["code"] == "CONFIRMATION_REQUIRED"
        assert err["details"][0]["action"] == "change_type"
        assert err["details"][0]["answer_count"] == 1

        # Change q0 type with confirm=true -> succeeds
        r = client.patch(
            f"/forms/{form_id}/questions/{q0_id}?confirm=true",
            json={"type": "long_text"},
        )
        assert r.status_code == 200
        assert r.json()["type"] == "long_text"

        # Verify old answer was deleted
        with Session(engine) as session:
            assert session.query(Answer).filter(Answer.question_id == q0_id).count() == 0
            # Inject new answer for delete test
            ans2 = Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q0_id, value="Another Answer")
            session.add(ans2)
            session.commit()

        # Try deleting q0 without confirm -> 409 CONFIRMATION_REQUIRED
        r = client.delete(f"/forms/{form_id}/questions/{q0_id}")
        assert r.status_code == 409
        err = r.json()["error"]
        assert err["code"] == "CONFIRMATION_REQUIRED"
        assert err["details"][0]["action"] == "delete_question"

        # Delete q0 with confirm=true -> succeeds 204
        r = client.delete(f"/forms/{form_id}/questions/{q0_id}?confirm=true")
        assert r.status_code == 204

        # Check position compaction on remaining 2 questions
        r = client.get(f"/forms/{form_id}")
        remaining = r.json()["questions"]
        assert len(remaining) == 2
        assert remaining[0]["position"] == 0
        assert remaining[1]["position"] == 1

        # 12. Delete form -> 204
        r = client.delete(f"/forms/{form_id}")
        assert r.status_code == 204

        # Verify form is gone
        r = client.get(f"/forms/{form_id}")
        assert r.status_code == 404

        print("PHASE 3 VERIFICATION PASSED: Form + Question APIs fully verified!")
    finally:
        client.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
