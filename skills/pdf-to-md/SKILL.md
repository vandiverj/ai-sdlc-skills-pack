---
name: pdf-to-md
description: Convert and read PDF or technical datasheet documents by generating Markdown with the bundled `scripts/datasheet_to_markdown.py` script. The script uses local Python libraries: requests, PyMuPDF (`pymupdf` or `fitz`), and `pymupdf4llm`. Use for local PDF paths, `http(s)` PDF/document URLs, and KiCad datasheet links. On Windows/Augment, use PowerShell syntax only. Do not use `pcb scan`.
---

# PDF to Markdown

Use this skill when a task depends on a PDF, datasheet, ICD, specification, form, or other technical PDF document.

This skill is for reading:

- Local `.pdf` files
- `http(s)` PDF or datasheet URLs
- Technical PDF documents such as ICDs, specifications, datasheets, and manuals
- Datasheet links found in KiCad symbols or `.kicad_sym` files

The goal is always:

1. Convert the PDF/document into Markdown using the bundled script.
2. Read the generated Markdown artifact.
3. Answer from the Markdown artifact, not directly from the raw PDF.

## Tooling Policy

Do **not** use `pcb scan` for this skill. The user does not install or use `pcb`.

Use the bundled script:

```text
C:\Users\Jerrick\.augment\skills\pdf-to-md\scripts\datasheet_to_markdown.py
```

The script requires local Python dependencies:

- `requests`
- PyMuPDF, importable as either `pymupdf` or `fitz`
- `pymupdf4llm`

Do not install dependencies automatically. If Python or a required module is missing, report the missing dependency and ask before installing anything.

## Critical Augment / Windows Rule

When using Augment Code on Windows, assume `launch-process` commands are executed by **PowerShell**.

Use PowerShell syntax only unless another shell is intentionally invoked from PowerShell.

Do **not** use bash syntax in PowerShell commands, including:

- `python - <<'PY'`
- `cat <<EOF`
- `command -v`
- `export VAR=value`
- bash command substitution such as `$(...)`
- bash path conversion such as `/c/Users/...` unless explicitly running Git Bash

Do **not** type shell commands into a Python REPL.

If terminal output shows a Python prompt like:

```text
>>>
```

then the terminal is inside Python. Exit Python first:

```python
exit()
```

Then run commands from PowerShell.

## Input

The input may be:

```text
C:\path\to\document.pdf
.\relative\path\to\document.pdf
./relative/path/to/document.pdf
https://example.com/document.pdf
https://www.ti.com/lit/gpn/tca9554
```

On Windows, prefer Windows-style paths or quoted relative paths.

## Output Location Policy

- If `--output-dir` is provided, Markdown and assets are written there.
- Local PDF input without `--output-dir`: Markdown is written next to the source PDF.
- URL input without `--output-dir`: Markdown is written under `%TEMP%\pdf-to-md\generated`.
- If writing next to a local PDF fails, the script falls back to `%TEMP%\pdf-to-md\generated`.

## Required PowerShell Workflow

### 1. Check Python and required modules

```powershell
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Output "PYTHON_NOT_FOUND"
    exit 127
}

$check = @"
import importlib.util
missing = []
if importlib.util.find_spec('requests') is None:
    missing.append('requests')
if importlib.util.find_spec('pymupdf4llm') is None:
    missing.append('pymupdf4llm')
if importlib.util.find_spec('pymupdf') is None and importlib.util.find_spec('fitz') is None:
    missing.append('pymupdf-or-fitz')
if missing:
    print('PYTHON_MODULES_MISSING=' + ','.join(missing))
    raise SystemExit(3)
print('PYTHON_MODULES_OK')
"@

$checkPath = Join-Path $env:TEMP 'check_pdf_to_md_modules.py'
Set-Content -LiteralPath $checkPath -Value $check -Encoding UTF8
& $python.Source $checkPath
```

If the output reports `PYTHON_NOT_FOUND` or `PYTHON_MODULES_MISSING=...`, stop and report that PDF conversion is unavailable.

### 2. Convert a PDF or URL to Markdown

Use this pattern for a local PDF path or URL:

```powershell
$script = "C:\Users\Jerrick\.augment\skills\pdf-to-md\scripts\datasheet_to_markdown.py"
$inputPath = "C:\Users\Jerrick\Downloads\document.pdf"

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Output "PYTHON_NOT_FOUND"
    exit 127
}

$mdPath = (& $python.Source $script $inputPath | Select-Object -First 1)
$mdPath = ($mdPath | Select-Object -First 1).Trim().Trim('"')

if (-not (Test-Path -LiteralPath $mdPath)) {
    Write-Output "MD_NOT_FOUND=$mdPath"
    exit 2
}

Write-Output "MD_PATH=$mdPath"
Get-Content -LiteralPath $mdPath -Raw
```

For URLs, set `$inputPath` to the URL:

```powershell
$inputPath = "https://www.ti.com/lit/gpn/tca9554"
```

To place output in a specific folder, pass `--output-dir`:

```powershell
$outputDir = "C:\WebSite\engineering-context\domains\ssp"
$mdPath = (& $python.Source $script $inputPath --output-dir $outputDir | Select-Object -First 1)
```

The script prints the generated Markdown path to stdout. Treat that path as the source of truth.

## Workflow Decision Tree

1. Determine whether the input is a local PDF path, URL, or datasheet property from a KiCad file.
2. On Windows/Augment, use PowerShell syntax.
3. Check `python`, `requests`, `pymupdf4llm`, and `pymupdf`/`fitz`.
4. If dependencies are available:
   - Run the bundled `scripts/datasheet_to_markdown.py` script.
   - Use `--output-dir` when the user requests a specific artifact location.
   - Capture stdout as the generated Markdown path.
   - Verify the path with `Test-Path -LiteralPath`.
   - Read the Markdown artifact with `Get-Content -LiteralPath <path> -Raw`.
5. If conversion fails:
   - Report the failure briefly.
   - Do not repeatedly retry the same broken command.
   - Ask before installing dependencies or using any cloud/external OCR service.
6. Follow linked images only if the task depends on visual content such as pin diagrams, package drawings, timing diagrams, electrical curves, layout examples, screenshots, or tables extracted as images.

## Troubleshooting

### Python not found

If the workflow prints:

```text
PYTHON_NOT_FOUND
```

then Python is unavailable to Augment's PowerShell environment. Report this and ask the user how they want to proceed.

### Python dependency missing

If the module check prints something like:

```text
PYTHON_MODULES_MISSING=pymupdf4llm,pymupdf-or-fitz
```

then conversion cannot run yet. Do not install packages without explicit user approval.

The likely install command is:

```powershell
python -m pip install requests pymupdf pymupdf4llm
```

Ask before running that command.

### Markdown path not found

If the converter prints a path but it cannot be read:

1. Trim whitespace and quotes.
2. Verify with `Test-Path -LiteralPath`.
3. If it still fails, report `MD_NOT_FOUND=<path>`.

### Python REPL syntax errors

If a command fails with output like:

```text
>>> Get-Content .\file.pdf
SyntaxError: invalid syntax
```

then shell commands were sent to Python by mistake. Exit Python with `exit()`, then run the PowerShell workflow.

## Notes

- Do not use `pcb scan`.
- Use the bundled script as the only normal conversion entry point.
- The generated Markdown file is the source of truth for answering questions.
- Extracted images are linked from the generated Markdown when image extraction succeeds.
- Never send proprietary PDFs or extracted contents to third-party/cloud tools unless the user explicitly approves.
- Never dump secrets or credentials from the environment while troubleshooting.
