# MD2PDF

MD2PDF converts Markdown files to clean PDFs directly from VS Code. It watches Markdown saves, renders the document in a local browser, and writes a PDF next to the source file or into a configured output folder.

## Features

- Automatically converts Markdown files to PDF when you save.
- Adds a manual command for converting the current Markdown file on demand.
- Uses Markdown-it with syntax highlighting for fenced code blocks.
- Resolves relative image paths based on the Markdown file location.
- Lets you choose PDF page format, orientation, and output directory.
- Includes `MD2PDF: Check Browser Setup` to verify browser detection before you convert.

## Requirements

MD2PDF needs a local Chromium-based browser because PDF generation runs through `puppeteer-core`.

Supported browsers:

- Google Chrome
- Microsoft Edge
- Brave

The extension tries to detect one of those browsers automatically. If detection fails, set `md2pdf.chromePath` to the full executable path.

## Installation

1. Install the extension from the VS Code Marketplace.
2. Make sure Chrome, Edge, or Brave is installed locally.
3. Open the Command Palette and run `MD2PDF: Check Browser Setup`.
4. If no browser is found, set `md2pdf.chromePath` in your VS Code settings and run the check again.

## Setup

The default setup works well for most machines:

- Leave `md2pdf.enabled` turned on to convert Markdown files on save.
- Leave `md2pdf.outputDirectory` empty to write the PDF next to the Markdown file.
- Leave `md2pdf.chromePath` empty unless auto-detection does not find your browser.

Example browser path overrides:

```json
{
  "md2pdf.chromePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
}
```

```json
{
  "md2pdf.chromePath": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
}
```

## Usage

### Convert on save

1. Open a Markdown file.
2. Save it.
3. MD2PDF creates a PDF with the same base filename.

If `md2pdf.outputDirectory` is set, the PDF is written there instead.

### Convert manually

1. Open a Markdown file in the editor.
2. Run `MD2PDF: Convert Current Markdown File to PDF` from the Command Palette.

### Check browser detection

Run `MD2PDF: Check Browser Setup` any time you want to confirm which browser path MD2PDF will use.

## Configuration

MD2PDF contributes these settings:

| Setting | Default | Description |
| --- | --- | --- |
| `md2pdf.enabled` | `true` | Convert Markdown files automatically on save. |
| `md2pdf.chromePath` | `""` | Full path to a Chrome, Edge, or Brave executable. Leave empty to use auto-detection. |
| `md2pdf.outputDirectory` | `""` | Output folder for generated PDFs. Leave empty to place PDFs next to the Markdown file. |
| `md2pdf.pageFormat` | `"Letter"` | PDF page size. Supported values: `A3`, `A4`, `A5`, `Letter`, `Legal`, `Tabloid`. |
| `md2pdf.pageOrientation` | `"portrait"` | PDF orientation: `portrait` or `landscape`. |

## Troubleshooting

### No supported browser was found

- Install Chrome, Edge, or Brave locally.
- Run `MD2PDF: Check Browser Setup`.
- Set `md2pdf.chromePath` if the browser is installed in a non-standard location.

### Nothing happens when I save

- Confirm the file language mode is Markdown.
- Check that `md2pdf.enabled` is still `true`.
- Look for an error notification from MD2PDF in VS Code.

### PDF was created in the wrong folder

- Clear `md2pdf.outputDirectory` to write beside the Markdown file.
- If you set a custom output directory, make sure the path is valid on your machine.

### Images are missing in the PDF

- Use relative image paths from the Markdown file location or absolute URLs.
- Save the Markdown file again after fixing the image path.

## Notes

- The generated PDF includes a small footer with the project repository URL.
- HTML inside Markdown is supported because rendering is handled by Markdown-it before the page is printed to PDF.
