"""Consistent HTTP problem responses, including framework validation errors."""
import logging
from http import HTTPStatus
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ProblemDetails(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str
    instance: str
    errors: list[dict] | None = None


def problem_responses(*codes):
    return {
        code: {
            "description": HTTPStatus(code).phrase,
            "content": {"application/problem+json": {"schema": ProblemDetails.model_json_schema()}},
        }
        for code in codes
    }


PROBLEM_RESPONSES = problem_responses(400, 401, 403, 404, 405, 409, 422, 500)


def problem(request, status, detail, headers=None, errors=None):
    content = {
        "type": "about:blank",
        "title": HTTPStatus(status).phrase,
        "status": status,
        "detail": detail,
        "instance": request.url.path,
    }
    if errors is not None:
        content["errors"] = errors
    return JSONResponse(content, status_code=status, headers=headers,
                        media_type="application/problem+json")


async def http_error(request: Request, exc: HTTPException):
    return problem(request, exc.status_code, exc.detail, exc.headers)


async def validation_error(request: Request, exc: RequestValidationError):
    # Do not echo submitted passwords, JWTs or other sensitive input.
    errors = [{"location": list(e["loc"]), "message": e["msg"], "code": e["type"]}
              for e in exc.errors()]
    return problem(request, 422, "Dữ liệu yêu cầu không hợp lệ", errors=errors)


async def server_error(request: Request, exc: Exception):
    logger.error("Unhandled API error", exc_info=(type(exc), exc, exc.__traceback__))
    return problem(request, 500, "Đã xảy ra lỗi hệ thống")


def register_error_handlers(app):
    app.add_exception_handler(HTTPException, http_error)
    app.add_exception_handler(RequestValidationError, validation_error)
    app.add_exception_handler(Exception, server_error)
