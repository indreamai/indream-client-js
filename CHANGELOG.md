# Changelog

All notable changes to `@indreamai/client` are documented in this file.

## 0.2.0 - 2026-03-20

### Highlights

- Synced the SDK to the latest Indream Editor State OpenAPI contract.
- `exports.create` and `editor.validate` now use the same strict `editorState` schema type.
- Added caption animation capability metadata from `GET /v1/editor/capabilities`.

### Breaking Changes

- `IEditorCapabilities` now requires `captionAnimations`.
- TypeScript callers can no longer pass loosely shaped `editorState` objects to `exports.create` and `editor.validate`.
- Caption assets now require `timingGranularity` (`word` | `line`).

### Migration Guide

1. Update capability parsing logic to consume `captionAnimations.in`, `captionAnimations.out`, and `captionAnimations.loop`.
2. Align manual `editorState` builders to the latest schema before calling `POST /v1/editor/validate` and `POST /v1/exports`.
3. Ensure caption assets include `timingGranularity` (`word` or `line`).

### Notes

- OpenAPI TypeScript types were regenerated from the latest official API spec.
