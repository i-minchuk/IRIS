import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

logger = logging.getLogger("dokpotok")


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(
        "HTTP exception on %s %s: %s",
        request.method,
        request.url.path,
        exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "path": request.url.path,
            "type": "http_error",
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(
        "Validation error on %s %s: %s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    # Convert non-JSON-serializable values in error details
    errors = []
    for err in exc.errors():
        err_copy = dict(err)
        if "input" in err_copy and isinstance(err_copy["input"], bytes):
            err_copy["input"] = err_copy["input"].decode("utf-8", errors="replace")
        if "ctx" in err_copy and isinstance(err_copy["ctx"], dict):
            ctx_copy = {}
            for k, v in err_copy["ctx"].items():
                if isinstance(v, Exception):
                    ctx_copy[k] = str(v)
                else:
                    ctx_copy[k] = v
            err_copy["ctx"] = ctx_copy
        errors.append(err_copy)
    return JSONResponse(
        status_code=422,
        content={
            "detail": errors,
            "path": request.url.path,
            "message": "Validation error",
            "type": "validation_error",
        },
    )


async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    logger.error(
        "Data conversion error on %s %s: %s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal data conversion error",
            "path": request.url.path,
            "type": "data_conversion_error",
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "path": request.url.path,
            "type": "server_error",
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)