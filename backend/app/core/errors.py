import logging
from typing import Any, List, Optional
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[List[Any]] = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []


class ValidationError(AppError):
    def __init__(self, message: str = "Validation failed", details: Optional[List[Any]] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=422,
            details=details,
        )


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found", details: Optional[List[Any]] = None):
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=404,
            details=details,
        )


class FormNotAvailableError(AppError):
    def __init__(self, message: str = "Form not available", details: Optional[List[Any]] = None):
        super().__init__(
            code="FORM_NOT_AVAILABLE",
            message=message,
            status_code=404,
            details=details,
        )


class ConfirmationRequiredError(AppError):
    def __init__(self, message: str, details: Optional[List[Any]] = None):
        super().__init__(
            code="CONFIRMATION_REQUIRED",
            message=message,
            status_code=409,
            details=details,
        )


class InvalidStateError(AppError):
    def __init__(self, message: str, details: Optional[List[Any]] = None):
        super().__init__(
            code="INVALID_STATE",
            message=message,
            status_code=409,
            details=details,
        )


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized", details: Optional[List[Any]] = None):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=401,
            details=details,
        )


class InternalError(AppError):
    def __init__(self, message: str = "Internal server error", details: Optional[List[Any]] = None):
        super().__init__(
            code="INTERNAL_ERROR",
            message=message,
            status_code=500,
            details=details,
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        details = []
        for err in exc.errors():
            loc = err.get("loc", ())
            # Filter out generic 'body' or 'query' prefixes for cleaner field path
            field_parts = [str(part) for part in loc if part not in ("body", "query")]
            field_name = ".".join(field_parts) if field_parts else "body"
            details.append({
                "field": field_name,
                "message": err.get("msg", "Invalid value"),
            })
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": details,
                }
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        code_map = {
            401: "UNAUTHORIZED",
            404: "NOT_FOUND",
            409: "INVALID_STATE",
            422: "VALIDATION_ERROR",
        }
        code = code_map.get(exc.status_code, "INTERNAL_ERROR" if exc.status_code >= 500 else "ERROR")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": code,
                    "message": exc.detail if isinstance(exc.detail, str) else "HTTP error",
                    "details": [],
                }
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled server error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": [],
                }
            },
        )
