from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.routers import admin, forms, health, public, questions, responses


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Lifecycle startup hook
    if settings.SEED_ON_STARTUP:
        try:
            from app.seed import seed_if_empty
            seed_if_empty()
        except ImportError:
            pass
        except Exception as e:
            # Avoid crashing if tables aren't migrated yet
            import logging
            logging.getLogger(__name__).warning("Seed on startup skipped/failed: %s", e)
    yield


app = FastAPI(
    title="Typeform Clone API",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers for standardized error format
register_exception_handlers(app)

# Include routers under /api/v1 prefix
app.include_router(health.router, prefix="/api/v1")
app.include_router(forms.router, prefix="/api/v1")
app.include_router(questions.router, prefix="/api/v1")
app.include_router(public.router, prefix="/api/v1")
app.include_router(responses.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
