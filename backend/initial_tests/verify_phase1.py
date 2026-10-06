import os
import subprocess
import sys
import uuid
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session

def main():
    test_db_path = "test_phase1.db"
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///./{test_db_path}"

    print("Running alembic upgrade head on fresh database...")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        env=env,
        capture_output=True,
        text=True,
    )
    print("Alembic stdout:", result.stdout)
    print("Alembic stderr:", result.stderr)
    assert result.returncode == 0, "Alembic upgrade failed"

    engine = create_engine(f"sqlite:///./{test_db_path}")
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    with engine.connect() as conn:
        tables = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'")).scalars().all()
        print("Created tables:", tables)
        for expected in ["users", "forms", "questions", "responses", "answers", "alembic_version"]:
            assert expected in tables, f"Missing table: {expected}"

    # Import models and test cascade
    from app.models.user import User
    from app.models.form import Form, FormStatus
    from app.models.question import Question, QuestionType
    from app.models.response import Response
    from app.models.answer import Answer

    with Session(engine) as session:
        user_id = str(uuid.uuid4())
        user = User(id=user_id, email="test@example.com", name="Test User")
        session.add(user)
        session.commit()

        form_id = str(uuid.uuid4())
        form = Form(
            id=form_id,
            user_id=user_id,
            title="Cascade Test Form",
            slug="casc1234",
            status=FormStatus.DRAFT,
            welcome_enabled=False,
            theme={},
        )
        session.add(form)
        session.commit()

        q1_id = str(uuid.uuid4())
        q1 = Question(
            id=q1_id,
            form_id=form_id,
            position=0,
            type=QuestionType.SHORT_TEXT,
            title="Q1",
            required=True,
            settings={"max_length": 255, "placeholder": ""},
        )
        q2_id = str(uuid.uuid4())
        q2 = Question(
            id=q2_id,
            form_id=form_id,
            position=1,
            type=QuestionType.RATING,
            title="Q2",
            required=False,
            settings={"steps": 5},
        )
        session.add_all([q1, q2])
        session.commit()

        resp_id = str(uuid.uuid4())
        resp = Response(id=resp_id, form_id=form_id)
        session.add(resp)
        session.commit()

        a1 = Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q1_id, value="Answer 1")
        a2 = Answer(id=str(uuid.uuid4()), response_id=resp_id, question_id=q2_id, value=5)
        session.add_all([a1, a2])
        session.commit()

        # Verify counts before delete
        assert session.query(Question).filter(Question.form_id == form_id).count() == 2
        assert session.query(Response).filter(Response.form_id == form_id).count() == 1
        assert session.query(Answer).count() == 2

        # Delete form directly via SQL to verify SQLite foreign key cascade ON DELETE CASCADE
        session.execute(text(f"DELETE FROM forms WHERE id = '{form_id}'"))
        session.commit()

        # Verify cascades
        assert session.query(Question).filter(Question.form_id == form_id).count() == 0, "Questions not cascaded"
        assert session.query(Response).filter(Response.form_id == form_id).count() == 0, "Responses not cascaded"
        assert session.query(Answer).count() == 0, "Answers not cascaded"

    engine.dispose()
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
    print("PHASE 1 VERIFICATION PASSED: alembic upgrade and cascading foreign keys confirmed!")

if __name__ == "__main__":
    main()
