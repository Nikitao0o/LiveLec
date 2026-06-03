import logging
import shutil
import subprocess
from pathlib import Path

import fitz

logger = logging.getLogger(__name__)

UPLOADS_ROOT = Path("/app/uploads/lectures")


def lecture_slides_dir(lecture_id: int) -> Path:
    return UPLOADS_ROOT / str(lecture_id) / "slides"


def clear_slides(lecture_id: int) -> None:
    slides_dir = lecture_slides_dir(lecture_id)
    if slides_dir.exists():
        shutil.rmtree(slides_dir)
    slides_dir.mkdir(parents=True, exist_ok=True)


def _libreoffice_binary() -> str:
    for name in ("libreoffice", "soffice"):
        path = shutil.which(name)
        if path:
            return path
    raise RuntimeError(
        "LibreOffice не установлен. Для PPTX установите LibreOffice или используйте Docker-образ сервера."
    )


def _find_converted_pdf(source: Path, output_dir: Path) -> Path:
    expected = output_dir / f"{source.stem}.pdf"
    if expected.exists():
        return expected
    pdfs = sorted(output_dir.rglob("*.pdf"), key=lambda p: p.stat().st_mtime, reverse=True)
    if pdfs:
        return pdfs[0]
    raise RuntimeError("Файл PDF после конвертации не найден")


def _convert_pptx_to_pdf(source: Path, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    binary = _libreoffice_binary()
    result = subprocess.run(
        [
            binary,
            "--headless",
            "--invisible",
            "--nologo",
            "--convert-to",
            "pdf",
            "--outdir",
            str(output_dir),
            str(source),
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        logger.error("LibreOffice error (code %s): %s", result.returncode, result.stderr)
        raise RuntimeError("Не удалось конвертировать PPTX в PDF")

    return _find_converted_pdf(source, output_dir)


def _render_pdf_to_slides(pdf_path: Path, slides_dir: Path) -> int:
    slides_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    try:
        for index, page in enumerate(doc):
            pixmap = page.get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False)
            slide_path = slides_dir / f"slide_{index + 1:03d}.png"
            pixmap.save(slide_path)
        return doc.page_count
    finally:
        doc.close()


def process_presentation_file(lecture_id: int, source_path: Path, extension: str) -> int:
    clear_slides(lecture_id)
    work_dir = UPLOADS_ROOT / str(lecture_id) / "work"
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(parents=True, exist_ok=True)

    ext = extension.lower()
    if ext == ".pptx":
        pdf_path = _convert_pptx_to_pdf(source_path, work_dir)
    elif ext == ".pdf":
        pdf_path = source_path
    else:
        raise ValueError("Поддерживаются только PDF и PPTX")

    slide_count = _render_pdf_to_slides(pdf_path, lecture_slides_dir(lecture_id))
    shutil.rmtree(work_dir, ignore_errors=True)
    return slide_count
