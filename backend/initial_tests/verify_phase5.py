import subprocess
import sys
import time
import httpx


def main():
    print("Starting uvicorn server on port 8000 for Phase 5 verification...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    time.sleep(2)

    client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=10)
    try:
        # 1. Create a form
        r = client.post("/forms", json={"title": "Summary Stats Test Form"})
        assert r.status_code == 201
        form_id = r.json()["id"]
        slug = r.json()["slug"]

        # Add multiple_choice (with options Alpha, Beta, Gamma)
        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "multiple_choice",
                "title": "Select choice",
                "settings": {
                    "options": [
                        {"label": "Alpha"},
                        {"label": "Beta"},
                        {"label": "Gamma"},
                    ],
                    "allow_multiple": False,
                },
            },
        )
        assert r.status_code == 201
        q_mc_id = r.json()["id"]

        # Add rating (steps = 5)
        r = client.post(
            f"/forms/{form_id}/questions",
            json={
                "type": "rating",
                "title": "Rate us",
                "settings": {"steps": 5},
            },
        )
        assert r.status_code == 201
        q_rate_id = r.json()["id"]

        # Add yes_no
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "yes_no", "title": "Agree?"},
        )
        assert r.status_code == 201
        q_yn_id = r.json()["id"]

        # Add number
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "number", "title": "Score"},
        )
        assert r.status_code == 201
        q_num_id = r.json()["id"]

        # Add short_text
        r = client.post(
            f"/forms/{form_id}/questions",
            json={"type": "short_text", "title": "Comments"},
        )
        assert r.status_code == 201
        q_txt_id = r.json()["id"]

        # Publish form
        r = client.post(f"/forms/{form_id}/publish")
        assert r.status_code == 200

        # Increment views 4 times
        for _ in range(4):
            r = client.post(f"/public/forms/{slug}/view")
            assert r.status_code == 204

        # Submit response 1 (Gamma, rating 5, yes, number 10, First)
        client.post(
            f"/public/forms/{slug}/responses",
            json={
                "answers": [
                    {"question_id": q_mc_id, "value": "Gamma"},
                    {"question_id": q_rate_id, "value": 5},
                    {"question_id": q_yn_id, "value": True},
                    {"question_id": q_num_id, "value": 10},
                    {"question_id": q_txt_id, "value": "First comment"},
                ]
            },
        )

        time.sleep(0.1)
        # Submit response 2 (Alpha, rating 4, no, number 20, Second)
        client.post(
            f"/public/forms/{slug}/responses",
            json={
                "answers": [
                    {"question_id": q_mc_id, "value": "Alpha"},
                    {"question_id": q_rate_id, "value": 4},
                    {"question_id": q_yn_id, "value": False},
                    {"question_id": q_num_id, "value": 20},
                    {"question_id": q_txt_id, "value": "Second comment"},
                ]
            },
        )

        time.sleep(0.1)
        # Submit response 3 (Alpha, rating 5, yes, number 30, Third)
        client.post(
            f"/public/forms/{slug}/responses",
            json={
                "answers": [
                    {"question_id": q_mc_id, "value": "Alpha"},
                    {"question_id": q_rate_id, "value": 5},
                    {"question_id": q_yn_id, "value": True},
                    {"question_id": q_num_id, "value": 30},
                    {"question_id": q_txt_id, "value": "Third comment"},
                ]
            },
        )

        # Non-retroactive settings change:
        # 1. Remove "Gamma" from multiple_choice options (now only Alpha and Beta)
        r = client.patch(
            f"/forms/{form_id}/questions/{q_mc_id}",
            json={
                "settings": {
                    "options": [
                        {"label": "Alpha"},
                        {"label": "Beta"},
                    ],
                    "allow_multiple": False,
                }
            },
        )
        assert r.status_code == 200

        # 2. Lower rating scale to steps = 3
        r = client.patch(
            f"/forms/{form_id}/questions/{q_rate_id}",
            json={"settings": {"steps": 3}},
        )
        assert r.status_code == 200

        # Now fetch summary stats!
        r = client.get(f"/forms/{form_id}/summary")
        assert r.status_code == 200, f"Get summary failed: {r.text}"
        summary = r.json()

        assert summary["form_id"] == form_id
        assert summary["total_responses"] == 3
        assert summary["views"] == 4
        assert summary["completion_rate"] == 0.75
        assert len(summary["questions"]) == 5

        # Check Multiple Choice Stats (including orphan handling)
        mc_stat = next(q for q in summary["questions"] if q["question_id"] == q_mc_id)
        assert mc_stat["answered_count"] == 3
        assert mc_stat["skipped_count"] == 0
        mc_options = mc_stat["stats"]["options"]
        print("MC Options Stats:", mc_options)
        # Expect Alpha (count=2, is_orphan=False), Beta (count=0, is_orphan=False), Gamma (count=1, is_orphan=True)
        alpha_opt = next(o for o in mc_options if o["label"] == "Alpha")
        beta_opt = next(o for o in mc_options if o["label"] == "Beta")
        gamma_opt = next(o for o in mc_options if o["label"] == "Gamma")
        assert alpha_opt["count"] == 2 and alpha_opt["is_orphan"] is False
        assert beta_opt["count"] == 0 and beta_opt["is_orphan"] is False
        assert gamma_opt["count"] == 1 and gamma_opt["is_orphan"] is True

        # Check Rating Stats (buckets 1..5 even though steps lowered to 3)
        rate_stat = next(q for q in summary["questions"] if q["question_id"] == q_rate_id)
        assert rate_stat["stats"]["average"] == 4.7
        distribution = rate_stat["stats"]["distribution"]
        print("Rating distribution:", distribution)
        assert len(distribution) == 5
        bucket_map = {d["value"]: d["count"] for d in distribution}
        assert bucket_map[1] == 0
        assert bucket_map[2] == 0
        assert bucket_map[3] == 0
        assert bucket_map[4] == 1
        assert bucket_map[5] == 2

        # Check Yes/No Stats
        yn_stat = next(q for q in summary["questions"] if q["question_id"] == q_yn_id)
        assert yn_stat["stats"] == {"yes": 2, "no": 1}

        # Check Number Stats
        num_stat = next(q for q in summary["questions"] if q["question_id"] == q_num_id)
        assert num_stat["stats"]["min"] == 10
        assert num_stat["stats"]["max"] == 30
        assert num_stat["stats"]["average"] == 20.0

        # Check Text Stats (newest first)
        txt_stat = next(q for q in summary["questions"] if q["question_id"] == q_txt_id)
        recent = txt_stat["stats"]["recent"]
        print("Recent text answers:", recent)
        assert recent == ["Third comment", "Second comment", "First comment"]

        # Cleanup
        client.delete(f"/forms/{form_id}")
        print("PHASE 5 VERIFICATION PASSED: Summary stats with orphans and lowered rating scale confirmed!")
    finally:
        client.close()
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
