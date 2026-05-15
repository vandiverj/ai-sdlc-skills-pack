#!/usr/bin/env python3
r"""
Convert a PDF or PDF URL into a local Markdown file.

Usage:
    python datasheet_to_markdown.py "C:\path\to\document.pdf"
    python datasheet_to_markdown.py "C:\path\to\document.pdf" --output-dir "C:\path\to\output"
    python datasheet_to_markdown.py "https://www.ti.com/lit/gpn/tca9554"

Output:
    Prints the generated markdown path to stdout.

Output policy:
    - If --output-dir is provided: write Markdown there.
    - Local PDF input without --output-dir: write Markdown next to the source PDF.
    - URL input without --output-dir: write Markdown under the user's temp folder.
    - If writing next to a local PDF fails, fall back to the temp folder.
"""

from __future__ import annotations

import argparse
import contextlib
import hashlib
import io
import os
import re
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse

import requests


def sanitize_filename(value: str, fallback: str = "document") -> str:
    value = re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("._-")
    return value or fallback


def is_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"}


def download_to_temp(url: str) -> Path:
    parsed = urlparse(url)
    name = sanitize_filename(Path(parsed.path).name or "document.pdf")

    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf"

    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:12]
    out_path = Path(tempfile.gettempdir()) / "pdf-to-md" / "downloads" / f"{digest}_{name}"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    headers = {"User-Agent": "Mozilla/5.0 pdf-to-md/1.0"}
    response = requests.get(url, headers=headers, timeout=60, allow_redirects=True)
    response.raise_for_status()
    out_path.write_bytes(response.content)
    return out_path


def get_temp_output_dir() -> Path:
    base = Path(tempfile.gettempdir()) / "pdf-to-md" / "generated"
    base.mkdir(parents=True, exist_ok=True)
    return base


def can_write_to_dir(directory: Path) -> bool:
    try:
        directory.mkdir(parents=True, exist_ok=True)
        test_path = directory / f".pdf_to_md_write_test_{os.getpid()}"
        test_path.write_text("test", encoding="utf-8")
        test_path.unlink(missing_ok=True)
        return True
    except Exception:
        return False


def get_output_dir(pdf_path: Path, is_remote: bool, explicit_output_dir: str | None) -> Path:
    if explicit_output_dir:
        out_dir = Path(explicit_output_dir).expanduser().resolve()
        out_dir.mkdir(parents=True, exist_ok=True)
        if not can_write_to_dir(out_dir):
            raise RuntimeError(f"Cannot write to output directory: {out_dir}")
        return out_dir

    if is_remote:
        return get_temp_output_dir()

    source_dir = pdf_path.parent
    if can_write_to_dir(source_dir):
        return source_dir

    print(
        f"Warning: cannot write next to source PDF; using temp output directory instead: {source_dir}",
        file=sys.stderr,
    )
    return get_temp_output_dir()


def load_pymupdf():
    try:
        import pymupdf  # type: ignore

        return pymupdf
    except ImportError:
        import fitz  # type: ignore

        return fitz


def extract_with_pymupdf4llm(pdf_path: Path) -> str:
    import pymupdf4llm

    # Keep stdout clean: this script must print only the final markdown path.
    with contextlib.redirect_stdout(io.StringIO()):
        return pymupdf4llm.to_markdown(str(pdf_path))


def extract_with_pymupdf_basic(pdf_path: Path) -> str:
    pymupdf = load_pymupdf()
    doc = pymupdf.open(str(pdf_path))
    parts: list[str] = []

    metadata = doc.metadata or {}
    title = metadata.get("title") or pdf_path.stem

    parts.append(f"# {title}\n")
    parts.append(f"- Source file: `{pdf_path}`")
    parts.append(f"- Pages: {doc.page_count}\n")

    for page_index, page in enumerate(doc, start=1):
        parts.append(f"\n\n## Page {page_index}\n")
        text = page.get_text("text", sort=True).strip()
        if text:
            parts.append(text)
        else:
            parts.append("_No extractable text found on this page._")

    doc.close()
    return "\n".join(parts).strip() + "\n"


def extract_images(pdf_path: Path, image_dir: Path, markdown_dir: Path) -> list[str]:
    pymupdf = load_pymupdf()
    image_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(str(pdf_path))
    markdown_links: list[str] = []

    for page_index in range(doc.page_count):
        page = doc[page_index]
        images = page.get_images(full=True)

        for image_index, image in enumerate(images, start=1):
            xref = image[0]
            extracted = doc.extract_image(xref)
            image_bytes = extracted["image"]
            ext = extracted.get("ext", "png")

            image_name = f"page_{page_index + 1:03d}_image_{image_index:03d}.{ext}"
            image_path = image_dir / image_name
            image_path.write_bytes(image_bytes)

            relative_path = image_path.relative_to(markdown_dir).as_posix()
            markdown_links.append(
                f"- Page {page_index + 1}, image {image_index}: `{relative_path}`"
            )

    doc.close()
    return markdown_links


def build_markdown(source_label: str, markdown: str, image_links: list[str]) -> str:
    header = [
        "<!-- Generated by pdf-to-md using PyMuPDF / pymupdf4llm -->",
        f"<!-- Source: {source_label} -->",
        "",
    ]

    footer: list[str] = []
    if image_links:
        footer = ["", "## Extracted Images", "", *image_links, ""]

    return "\n".join(header) + markdown.rstrip() + "\n" + "\n".join(footer)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert a PDF path or URL to Markdown.")
    parser.add_argument("input", help="Local PDF path or HTTP(S) URL")
    parser.add_argument(
        "--output-dir",
        dest="output_dir",
        default=None,
        help="Directory where the generated Markdown and assets should be written.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_value = args.input.strip().strip('"')

    try:
        remote_input = is_url(input_value)
        if remote_input:
            source_label = input_value
            pdf_path = download_to_temp(input_value)
        else:
            pdf_path = Path(input_value).expanduser().resolve()
            source_label = str(pdf_path)

            if not pdf_path.exists():
                print(f"PDF_NOT_FOUND={pdf_path}", file=sys.stderr)
                return 1

        out_dir = get_output_dir(pdf_path, remote_input, args.output_dir)
        stem = sanitize_filename(pdf_path.stem)
        digest = hashlib.sha256(source_label.encode("utf-8")).hexdigest()[:12]

        md_path = out_dir / f"{stem}_{digest}.md"
        asset_dir = out_dir / f"{stem}_{digest}_assets"
        image_dir = asset_dir / "images"

        try:
            markdown = extract_with_pymupdf4llm(pdf_path)
        except Exception as exc:
            print(
                f"Warning: pymupdf4llm extraction failed, using basic PyMuPDF extraction. {exc}",
                file=sys.stderr,
            )
            markdown = extract_with_pymupdf_basic(pdf_path)

        image_links: list[str] = []
        try:
            image_links = extract_images(pdf_path, image_dir, out_dir)
        except Exception as exc:
            print(f"Warning: image extraction failed. {exc}", file=sys.stderr)

        md_path.write_text(
            build_markdown(source_label, markdown, image_links),
            encoding="utf-8",
        )

        print(str(md_path))
        return 0

    except Exception as exc:
        print(f"PDF_TO_MD_FAILED={type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
