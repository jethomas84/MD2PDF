# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0

Initial public release.

- Convert Markdown files to PDF automatically on save.
- Add a manual command to convert the current Markdown file to PDF.
- Detect Chrome, Edge, or Brave automatically, with `md2pdf.chromePath` as an override.
- Add `MD2PDF: Check Browser Setup` to help verify local browser availability.
- Support configurable output directory, page format, and page orientation.

## 0.1.1

- Retry other detected browsers if the first supported browser fails to launch.
- Use launchability checks in `MD2PDF: Check Browser Setup`, not just file detection.
- Exclude local `.worktrees` and test files from packaged VSIX builds.
