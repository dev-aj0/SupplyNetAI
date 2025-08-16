from pydantic import BaseModel
from typing import Optional, Any


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    success: bool = False


class PaginationParams(BaseModel):
    page: int = 1
    size: int = 100
    skip: int = 0


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    size: int
    pages: int
