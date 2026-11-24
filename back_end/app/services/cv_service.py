import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import BASE_DIR, settings

ALLOWED_MIME = "application/pdf"
ALLOWED_EXT = ".pdf"
PDF_MAGIC = b"%PDF"


def _upload_root() -> Path:
    root = Path(settings.UPLOAD_DIR)
    if not root.is_absolute():
        root = BASE_DIR / root
    return root


def save_cv(file: UploadFile, user_id: int) -> str:
    """Kiểm tra file CV (kích thước, đuôi, MIME, magic bytes) rồi lưu.

    Trả về đường dẫn tham chiếu (không lưu nhị phân vào DB).
    """
    content = file.file.read()

    # 1. Kích thước tối đa
    max_bytes = settings.MAX_CV_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"CV vượt quá {settings.MAX_CV_SIZE_MB}MB")

    # 2. Phần mở rộng
    filename = (file.filename or "").lower()
    if not filename.endswith(ALLOWED_EXT):
        raise HTTPException(status_code=415, detail="Chỉ chấp nhận file PDF")

    # 3. MIME + magic bytes (chặn file giả mạo)
    if file.content_type != ALLOWED_MIME or not content.startswith(PDF_MAGIC):
        raise HTTPException(status_code=415, detail="File không phải PDF hợp lệ")

    # 4. Lưu file
    upload_dir = _upload_root() / "cv"
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{user_id}_{uuid.uuid4().hex}.pdf"
    (upload_dir / stored_name).write_bytes(content)

    return f"/uploads/cv/{stored_name}"
