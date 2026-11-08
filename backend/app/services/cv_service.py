import json
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


def validate_and_save_cv(file: UploadFile) -> str:
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF/Docx are allowed.",
        )

    max_bytes = settings.MAX_CV_SIZE_MB * 1024 * 1024
    content = file.file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max {settings.MAX_CV_SIZE_MB}MB.",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (upload_dir / filename).write_bytes(content)

    return f"/uploads/cv/{filename}"


def skills_to_json(skills: list[str]) -> str | None:
    cleaned = [s.strip() for s in skills if s and s.strip()]
    return json.dumps(cleaned, ensure_ascii=False) if cleaned else None


def skills_from_json(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, TypeError):
        return []
