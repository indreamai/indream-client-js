# Changelog

## 0.3.0 - 2026-04-04

### Added

- Added `projects`, `uploads`, and `assets` resources.
- Added `uploads.upload(...)` for file uploads.
- Added `projectId` to export creation responses, task snapshots, and webhook task payloads.

### Changed

- OpenAPI cloud export formats are limited to `mp4` and `webm`.
- `IExportTask` and `ICreateExportResponse` include nullable `projectId`.

## 0.2.0 - 2026-03-20

### Added

- Added strict `editorState` typing for `exports.create` and `editor.validate`.
- Added caption animation capability metadata from `GET /v1/editor/capabilities`.

### Changed

- `IEditorCapabilities` includes required `captionAnimations`.
- `exports.create` and `editor.validate` require schema-aligned `editorState` payloads.
- Caption assets require `timingGranularity` (`word` | `line`).
