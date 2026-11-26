import re
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import BASE_DIR, settings

# Định dạng CV được chấp nhận: PDF và DOCX (kiểm tra đuôi + MIME + magic bytes)
_FORMATS = {
    "pdf": {"ext": ".pdf", "mime": "application/pdf", "magic": b"%PDF"},
    "docx": {
        "ext": ".docx",
        "mime": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "magic": b"PK\x03\x04",
    },
}


def _upload_root() -> Path:
    root = Path(settings.UPLOAD_DIR)
    if not root.is_absolute():
        root = BASE_DIR / root
    return root


def _detect_format(filename: str, content_type: str, content: bytes) -> str:
    """Xác định định dạng (pdf/docx) dựa trên đuôi + MIME + magic bytes."""
    ext = ("." + filename.rsplit(".", 1)[-1]) if "." in filename else ""
    for fmt, spec in _FORMATS.items():
        if ext == spec["ext"] and content_type == spec["mime"] and content.startswith(spec["magic"]):
            return fmt
    raise HTTPException(status_code=415, detail="Chỉ chấp nhận file PDF hoặc DOCX hợp lệ")


def save_cv(file: UploadFile, user_id: int) -> str:
    """Kiểm tra file CV (kích thước, đuôi, MIME, magic bytes) rồi lưu.

    Trả về đường dẫn tham chiếu (không lưu nhị phân vào DB).
    """
    content = file.file.read()

    max_bytes = settings.MAX_CV_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"CV vượt quá {settings.MAX_CV_SIZE_MB}MB")

    filename = (file.filename or "").lower()
    fmt = _detect_format(filename, file.content_type, content)

    upload_dir = _upload_root() / "cv"
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{user_id}_{uuid.uuid4().hex}.{fmt}"
    (upload_dir / stored_name).write_bytes(content)

    return f"/uploads/cv/{stored_name}"


def resolve_cv_path(cv_url: str | None, user_id: int) -> Path | None:
    """Chuyển `cv_url` thành đường dẫn file thực trên đĩa.

    Chặn path traversal và file không tồn tại; trả None nếu không hợp lệ.
    """
    if not cv_url:
        return None
    prefix = "/uploads/cv/"
    if not cv_url.startswith(prefix):
        return None
    stored_name = cv_url[len(prefix):]
    if not re.fullmatch(rf"{user_id}_[0-9a-f]{{32}}\.(pdf|docx)", stored_name):
        return None
    path = _upload_root() / "cv" / stored_name
    return path if path.is_file() else None


def cv_filename(cv_url: str) -> str:
    """Tên file tải về (cv.pdf hoặc cv.docx)."""
    ext = cv_url.rsplit(".", 1)[-1] if "." in cv_url else "pdf"
    return f"cv.{ext}"


CV_DOWNLOAD_RESPONSES = {
    200: {
        "content": {
            "application/pdf": {"schema": {"type": "string", "format": "binary"}},
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {"schema": {"type": "string", "format": "binary"}},
        }
    }
}
