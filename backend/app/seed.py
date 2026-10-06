import argparse
from datetime import datetime, timedelta, timezone
import random
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.answer import Answer
from app.models.form import Form, FormStatus
from app.models.question import Question, QuestionType
from app.models.response import Response
from app.models.user import User
from app.schemas.question import validate_settings
from app.services.validation import validate_answer


DEFAULT_USER_EMAIL = "demo@typeform-clone.dev"
DEFAULT_USER_NAME = "Demo Creator"


LONG_TEXT_FEEDBACK_SAMPLES = [
    "Overall great experience, but the initial loading speed could be improved on mobile networks.",
    "The UI is exceptionally clean and intuitive. I'd love to see more customization options for themes.",
    "Navigation between different question blocks is smooth. Customer support was also very helpful when I asked questions.",
    "It would be great to have more keyboard shortcuts for power respondents who fill out forms quickly.",
    "We love the clean aesthetic! Please add deeper integrations with external analytics dashboards.",
    "The responsiveness on tablets is fantastic. One small suggestion is to make multi-select pills larger.",
    "Very easy to set up and deploy. Summary charts give us exactly what we need for weekly reports.",
    "A dark mode toggle for the form respondents would be a wonderful addition.",
    "Simple, fast, and does the job without bloated nonsense. Keep up the high standard of UX!",
    "Exporting data is something our team relies on, and the overall form clarity is unmatched.",
    "Best form tool we have used so far. Loved the transition animations between slides.",
    "Clean layouts and very accessible keyboard navigation.",
]

LONG_TEXT_EVENT_SAMPLES = [
    "Will slides and recording transcripts be made available after the keynotes conclude?",
    "Is there going to be a dedicated networking lounge for founders and engineering leaders?",
    "Can speakers share GitHub repositories with sample code ahead of the workshop sessions?",
    "Are there quiet spaces available during the afternoon track for remote work calls?",
    "Will there be interactive Q&A sessions at the end of each presentation?",
    "Looking forward to the deep-dive systems architecture talk by the core team!",
    "Is early venue check-in available on the evening prior to the conference start?",
    "Are dietary accommodations clearly labeled at all buffet stations?",
    "Will there be hands-on lab environments provided, or do we bring our own setup?",
    "Excited for the hackathon portion! Are teams formed beforehand or on-site?",
]

LONG_TEXT_JOB_SAMPLES = [
    "I have spent the last 5 years building scalable web services and love craft-oriented engineering teams.",
    "Your product focus on delightful user experience and performance deeply aligns with how I approach software.",
    "I thrive in autonomous environments where engineers are trusted to own features from spec to deployment.",
    "I admire the elegance and simplicity of your interface and want to help scale the underlying architecture.",
    "I have extensive experience with FastAPI and modern database modeling and want to contribute to high-impact products.",
    "Your company culture of pairing high velocity with thoughtful design is exactly where I can do my best work.",
    "I want to help solve challenging problems around high-throughput public submissions and analytics aggregation.",
    "Building intuitive developer-facing and creator-facing tools has always been my core passion.",
    "I love building systems that remain simple, maintainable, and robust as traffic grows exponentially.",
    "The opportunity to work alongside world-class engineers on a mission-critical tool is why I am applying.",
]

NAMES = [
    ("Alice Smith", "alice.smith@example.com"),
    ("Bob Johnson", "bob.j@example.com"),
    ("Charlie Brown", "charlie.b@example.org"),
    ("Diana Prince", "diana.p@example.com"),
    ("Evan Wright", "evan.w@example.net"),
    ("Fiona Gallagher", "fiona.g@example.com"),
    ("George Miller", "george.m@example.org"),
    ("Hannah Abbott", "hannah.a@example.com"),
    ("Ian Malcolm", "ian.malcolm@example.com"),
    ("Julia Roberts", "julia.r@example.net"),
    ("Kevin Bacon", "kevin.b@example.com"),
    ("Laura Croft", "laura.c@example.org"),
    ("Michael Scott", "michael.s@dunder.com"),
    ("Nancy Drew", "nancy.d@mystery.org"),
    ("Oscar Martinez", "oscar.m@accounting.com"),
    ("Pam Beesly", "pam.b@art.com"),
    ("Quinn Fabray", "quinn.f@example.com"),
    ("Ryan Howard", "ryan.h@wunderkind.com"),
    ("Stanley Hudson", "stanley.h@crossword.com"),
    ("Toby Flenderson", "toby.f@corporate.com"),
    ("Uma Thurman", "uma.t@cinema.com"),
    ("Victor Stone", "victor.s@tech.org"),
    ("Wendy Darling", "wendy.d@neverland.org"),
    ("Xavier Woods", "xavier.w@gaming.com"),
    ("Yvonne Strahovski", "yvonne.s@example.com"),
    ("Zachary Levi", "zach.levi@example.net"),
]


def create_seed_questions(db: Session, form: Form, questions_spec: List[Dict[str, Any]]) -> List[Question]:
    questions = []
    for idx, q_data in enumerate(questions_spec):
        normalized_settings = validate_settings(q_data["type"], q_data.get("settings"))
        q = Question(
            id=str(uuid.uuid4()),
            form_id=form.id,
            position=idx,
            type=q_data["type"],
            title=q_data["title"],
            description=q_data.get("description"),
            required=q_data.get("required", False),
            settings=normalized_settings,
        )
        db.add(q)
        questions.append(q)
    db.flush()
    return questions


def generate_seed_responses(
    db: Session,
    form: Form,
    questions: List[Question],
    count: int,
    rng: random.Random,
    text_samples: List[str],
) -> None:
    now = datetime.now(timezone.utc)

    for i in range(count):
        # Realistic submitted_at timestamp spread across the last 30 days
        days_ago = rng.uniform(0.5, 29.5)
        submitted_at = now - timedelta(days=days_ago)

        response = Response(
            id=str(uuid.uuid4()),
            form_id=form.id,
            submitted_at=submitted_at,
        )
        db.add(response)

        name_tuple = rng.choice(NAMES)

        for q in questions:
            q_type = q.type.value if hasattr(q.type, "value") else str(q.type)
            settings = q.settings or {}
            val = None

            # Optional skip chance (15% chance to skip if optional)
            if not q.required and rng.random() < 0.15:
                continue

            if q_type == "short_text":
                val = name_tuple[0]
            elif q_type == "email":
                val = name_tuple[1]
            elif q_type == "rating":
                steps = settings.get("steps", 5)
                # Skew distribution towards higher ratings (4 and 5, or 8..10)
                if steps == 5:
                    val = rng.choices([1, 2, 3, 4, 5], weights=[2, 4, 10, 35, 49])[0]
                elif steps == 10:
                    val = rng.choices(
                        list(range(1, 11)),
                        weights=[1, 1, 2, 3, 5, 8, 15, 25, 25, 15],
                    )[0]
                else:
                    val = rng.randint(1, steps)
            elif q_type == "yes_no":
                val = rng.choices([True, False], weights=[75, 25])[0]
            elif q_type == "number":
                min_v = settings.get("min", 1) or 1
                max_v = settings.get("max", 100) or 100
                val = rng.randint(int(min_v), int(min_v + min(20, max_v - min_v)))
            elif q_type == "multiple_choice":
                allow_mult = settings.get("allow_multiple", False)
                opts = [o["label"] for o in settings.get("options", [])]
                if allow_mult:
                    num_select = rng.randint(1, min(len(opts), 3))
                    val = sorted(rng.sample(opts, num_select))
                else:
                    val = rng.choice(opts)
            elif q_type == "dropdown":
                opts = [o["label"] for o in settings.get("options", [])]
                val = rng.choice(opts)
            elif q_type == "long_text":
                val = rng.choice(text_samples)

            if val is not None:
                # Run through pure validation engine to guarantee validity
                cleaned_val = validate_answer(q_type, settings, q.required, val)
                if cleaned_val is not None:
                    ans = Answer(
                        id=str(uuid.uuid4()),
                        response_id=response.id,
                        question_id=q.id,
                        value=cleaned_val,
                    )
                    db.add(ans)

    db.flush()


def seed_data(db: Session, reset: bool = False) -> None:
    """Populate database with deterministic seed data per section 9."""
    if reset:
        db.query(Answer).delete()
        db.query(Response).delete()
        db.query(Question).delete()
        db.query(Form).delete()
        db.query(User).delete()
        db.commit()

    rng = random.Random(42)

    # 1. User
    user = db.query(User).filter(User.email == DEFAULT_USER_EMAIL).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=DEFAULT_USER_EMAIL,
            name=DEFAULT_USER_NAME,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    now = datetime.now(timezone.utc)

    # 2. Customer Feedback Survey (Published, slug: customer-feedback)
    form1 = db.query(Form).filter(Form.slug == "customer-feedback").first()
    if not form1:
        form1 = Form(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title="Customer Feedback Survey",
            slug="customer-feedback",
            status=FormStatus.PUBLISHED,
            welcome_enabled=False,
            welcome_button_text="Start",
            thankyou_title="Thanks for your feedback!",
            thankyou_message="Your insights help us build a better product.",
            theme={"accent": "#2563eb", "mode": "light"},
            view_count=58,
            published_at=now - timedelta(days=28),
        )
        db.add(form1)
        db.flush()

        q_specs_1 = [
            {"type": QuestionType.SHORT_TEXT, "title": "Your Name", "required": True, "settings": {"max_length": 150}},
            {"type": QuestionType.EMAIL, "title": "Email Address", "required": True},
            {"type": QuestionType.RATING, "title": "Overall Experience", "required": True, "settings": {"steps": 5}},
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "title": "How did you hear about us?",
                "required": False,
                "settings": {
                    "options": [
                        {"label": "Friend or Colleague"},
                        {"label": "Search Engine"},
                        {"label": "Social Media"},
                        {"label": "Blog or Article"},
                        {"label": "Conference / Event"},
                    ],
                    "allow_multiple": False,
                },
            },
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "title": "Which features do you use most?",
                "required": False,
                "settings": {
                    "options": [
                        {"label": "Drag & Drop Builder"},
                        {"label": "Analytics & Summary"},
                        {"label": "Theme Customizer"},
                        {"label": "Embeds & Sharing"},
                    ],
                    "allow_multiple": True,
                },
            },
            {"type": QuestionType.YES_NO, "title": "Would you recommend us to a colleague?", "required": True},
            {
                "type": QuestionType.DROPDOWN,
                "title": "Current Subscription Plan",
                "required": False,
                "settings": {
                    "options": [
                        {"label": "Free Tier"},
                        {"label": "Starter"},
                        {"label": "Professional"},
                        {"label": "Enterprise"},
                    ]
                },
            },
            {"type": QuestionType.LONG_TEXT, "title": "What could we improve?", "required": False, "settings": {"max_length": 2000}},
            {"type": QuestionType.NUMBER, "title": "Team Size", "required": False, "settings": {"min": 1, "max": 10000}},
        ]
        q1_list = create_seed_questions(db, form1, q_specs_1)
        generate_seed_responses(db, form1, q1_list, count=24, rng=rng, text_samples=LONG_TEXT_FEEDBACK_SAMPLES)

    # 3. Event Registration (Published, slug: event-registration)
    form2 = db.query(Form).filter(Form.slug == "event-registration").first()
    if not form2:
        form2 = Form(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title="Event Registration",
            slug="event-registration",
            status=FormStatus.PUBLISHED,
            welcome_enabled=False,
            welcome_button_text="Register",
            thankyou_title="Registration Confirmed!",
            thankyou_message="We look forward to seeing you at the event.",
            theme={"accent": "#10b981", "mode": "light"},
            view_count=45,
            published_at=now - timedelta(days=25),
        )
        db.add(form2)
        db.flush()

        q_specs_2 = [
            {"type": QuestionType.SHORT_TEXT, "title": "Full Name", "required": True, "settings": {"max_length": 200}},
            {"type": QuestionType.EMAIL, "title": "Work Email", "required": True},
            {"type": QuestionType.NUMBER, "title": "Number of Attendees", "required": True, "settings": {"min": 1, "max": 10}},
            {
                "type": QuestionType.DROPDOWN,
                "title": "Session Track",
                "required": True,
                "settings": {
                    "options": [
                        {"label": "Systems & Architecture"},
                        {"label": "Product & UX Design"},
                        {"label": "Data & Applied AI"},
                        {"label": "Founder & Growth"},
                    ]
                },
            },
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "title": "Dietary Preferences",
                "required": False,
                "settings": {
                    "options": [
                        {"label": "None / No restrictions"},
                        {"label": "Vegetarian"},
                        {"label": "Vegan"},
                        {"label": "Gluten-Free"},
                        {"label": "Dairy-Free"},
                    ],
                    "allow_multiple": True,
                },
            },
            {"type": QuestionType.YES_NO, "title": "Will you attend the networking after-party?", "required": False},
            {"type": QuestionType.RATING, "title": "Excitement Level", "required": False, "settings": {"steps": 10}},
            {"type": QuestionType.LONG_TEXT, "title": "Questions for the Speakers", "required": False, "settings": {"max_length": 1500}},
        ]
        q2_list = create_seed_questions(db, form2, q_specs_2)
        generate_seed_responses(db, form2, q2_list, count=20, rng=rng, text_samples=LONG_TEXT_EVENT_SAMPLES)

    # 4. Job Application (Published, slug: job-application)
    form3 = db.query(Form).filter(Form.slug == "job-application").first()
    if not form3:
        form3 = Form(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title="Job Application",
            slug="job-application",
            status=FormStatus.PUBLISHED,
            welcome_enabled=True,
            welcome_title="Join Our Team",
            welcome_description="We are building the future of forms. Tell us about yourself!",
            welcome_button_text="Apply Now",
            thankyou_title="Application Received",
            thankyou_message="Thank you for applying. We will review your materials promptly.",
            theme={"accent": "#6366f1", "mode": "light"},
            view_count=36,
            published_at=now - timedelta(days=20),
        )
        db.add(form3)
        db.flush()

        q_specs_3 = [
            {"type": QuestionType.SHORT_TEXT, "title": "Full Name", "required": False, "settings": {"max_length": 200}},
            {"type": QuestionType.EMAIL, "title": "Email Address", "required": False},
            {"type": QuestionType.NUMBER, "title": "Years of Experience", "required": False, "settings": {"min": 0, "max": 50}},
            {
                "type": QuestionType.DROPDOWN,
                "title": "Role Applied For",
                "required": False,
                "settings": {
                    "options": [
                        {"label": "Senior Backend Engineer"},
                        {"label": "Full Stack Engineer"},
                        {"label": "Frontend Specialist"},
                        {"label": "Product Designer"},
                        {"label": "Engineering Lead"},
                    ]
                },
            },
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "title": "Preferred Work Mode",
                "required": False,
                "settings": {
                    "options": [
                        {"label": "Remote"},
                        {"label": "Hybrid"},
                        {"label": "In-Office"},
                    ],
                    "allow_multiple": False,
                },
            },
            {"type": QuestionType.LONG_TEXT, "title": "Why do you want to join us?", "required": False, "settings": {"max_length": 1000}},
            {"type": QuestionType.YES_NO, "title": "Are you willing to relocate if needed?", "required": False},
            {"type": QuestionType.RATING, "title": "Self-Rated Skill Level", "required": False, "settings": {"steps": 5}},
        ]
        q3_list = create_seed_questions(db, form3, q_specs_3)
        generate_seed_responses(db, form3, q3_list, count=18, rng=rng, text_samples=LONG_TEXT_JOB_SAMPLES)

    # 5. Product Launch Quiz (Draft, slug: product-launch-quiz)
    form4 = db.query(Form).filter(Form.slug == "product-launch-quiz").first()
    if not form4:
        form4 = Form(
            id=str(uuid.uuid4()),
            user_id=user.id,
            title="Product Launch Quiz",
            slug="product-launch-quiz",
            status=FormStatus.DRAFT,
            welcome_enabled=False,
            welcome_button_text="Start Quiz",
            thankyou_title="Quiz Completed!",
            thankyou_message="Thanks for participating in our launch quiz.",
            theme={"accent": "#ec4899", "mode": "light"},
            view_count=0,
            published_at=None,
        )
        db.add(form4)
        db.flush()

        q_specs_4 = [
            {
                "type": QuestionType.MULTIPLE_CHOICE,
                "title": "Which upcoming feature are you most excited for?",
                "required": True,
                "settings": {
                    "options": [
                        {"label": "AI Form Generator"},
                        {"label": "Interactive Logic Jumps"},
                        {"label": "Real-time Collaboration"},
                    ],
                    "allow_multiple": False,
                },
            },
            {"type": QuestionType.SHORT_TEXT, "title": "When do you plan to launch your next project?", "required": False},
            {"type": QuestionType.YES_NO, "title": "Would you like early beta access?", "required": True},
            {"type": QuestionType.RATING, "title": "How likely are you to recommend our beta?", "required": False, "settings": {"steps": 5}},
        ]
        create_seed_questions(db, form4, q_specs_4)

    db.commit()


def seed_if_empty() -> None:
    """Invoked on application startup if database is empty."""
    with SessionLocal() as db:
        user_count = db.query(User).count()
        if user_count == 0:
            seed_data(db, reset=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed database with mock forms and responses")
    parser.add_argument("--reset", action="store_true", help="Drop all rows before seeding")
    args = parser.parse_args()

    with SessionLocal() as session:
        seed_data(session, reset=args.reset)
    print("Database seeding completed successfully.")
