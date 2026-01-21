---
name: docx
description: Create, edit, and analyze DOCX files using instructions and tools.
---

# DOCX Creation, Editing, and Analysis Skill

> [!NOTE]
> This skill relies on `docx-js.md` and `ooxml.md` for specific API details. These files were not imported. You may need to refer to standard `docx` npm package or OpenXML documentation.

## Workflow Decision Tree

### Reading/Analyzing Content
Use "Text extraction" or "Raw XML access" approaches.

### Creating New Document
Use "Creating a new Word document" workflow description below.

### Editing Existing Document
- **Your own document + simple changes**
  Use "Basic OOXML editing" workflow
- **Someone else's document**
  Use **"Redlining workflow"** (recommended default)
- **Legal, academic, business, or government docs**
  Use **"Redlining workflow"** (required)

## Workflows

### Creating a new Word document
1. **MANDATORY - READ ENTIRE FILE**: Read `docx-js.md` (if available) completely from start to finish.
2. Create a JavaScript/TypeScript file using Document, Paragraph, TextRun components (assume `docx` package).
3. Export as .docx using `Packer.toBuffer()`

### Editing an existing Word document
1. **MANDATORY - READ ENTIRE FILE**: Read `ooxml.md` (if available) completely.
2. Unpack the document: `python ooxml/scripts/unpack.py <office_file> <output_directory>` (Note: scripts instructions provided as reference)
3. Create and run a Python script using the Document library.
4. Pack the final document: `python ooxml/scripts/pack.py <input_directory> <office_file>`

## Converting Documents to Images
To visually analyze Word documents, convert them to images using a two-step process:

1. **Convert DOCX to PDF**:
   ```bash
   soffice --headless --convert-to pdf document.docx
   ```

2. **Convert PDF pages to JPEG images**:
   ```bash
   pdftoppm -jpeg -r 150 document.pdf page
   ```
   This creates files like `page-1.jpg`, `page-2.jpg`, etc.

## Dependencies
Required dependencies (install if not available):

- **pandoc**: `sudo apt-get install pandoc` (for text extraction)
- **docx**: `npm install -g docx` (for creating new documents)
- **LibreOffice**: `sudo apt-get install libreoffice` (for PDF conversion)
- **Poppler**: `sudo apt-get install poppler-utils` (for pdftoppm to convert PDF to images)
- **defusedxml**: `pip install defusedxml` (for secure XML parsing)
