# Changelog

All notable changes to this project will be documented in this file.

## 0.1.3

- Switch the Visual Studio Marketplace publisher from `jethomas84` to `9DStudios`.
- Keep the package identity `md2pdf-local` and display name `MD2PDF Local` while repointing release instructions to the correct publisher.

## 0.1.2

- Rename the Marketplace package to `md2pdf-local` so it can be published under `jethomas84`.
- Rename the Marketplace display name to `MD2PDF Local` so the listing is unique while preserving the extension behavior.

## 0.1.1

- Retry other detected browsers if the first supported browser fails to launch.
- Use launchability checks in `MD2PDF: Check Browser Setup`, not just file detection.
- Exclude local `.worktrees` and test files from packaged VSIX builds.

## 0.1.0

Initial public release.

- Convert Markdown files to PDF automatically on save.
- Add a manual command to convert the current Markdown file to PDF.
- Detect Chrome, Edge, or Brave automatically, with `md2pdf.chromePath` as an override.
- Add `MD2PDF: Check Browser Setup` to help verify local browser availability.
- Support configurable output directory, page format, and page orientation.
