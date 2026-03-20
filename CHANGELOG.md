# Changelog

All notable changes to `@indreamai/client` are documented in this file.

## 0.2.0 - 2026-03-20

### Highlights

- Added caption animation capability metadata in `GET /v1/editor/capabilities`.
- Synced the SDK to the latest Indream Editor State OpenAPI contract.

### Breaking Changes

- `IEditorCapabilities` now requires `captionAnimations`.
- Editor-state payloads must follow the latest schema shape for animated numeric fields (for example `{ "value": number, "keyframes": [] }` where required).
- Caption assets now require `timingGranularity` (`word` | `line`).

### Migration Guide

1. Update capability parsing logic to consume `captionAnimations.in`, `captionAnimations.out`, and `captionAnimations.loop`.
2. If you construct editor-state JSON manually, migrate numeric geometry/motion fields to the schema-defined animated track shape.
3. Ensure caption assets include `timingGranularity` before calling `POST /v1/editor/validate` or `POST /v1/exports`.

### Notes

- OpenAPI TypeScript types were regenerated from the latest official API spec.
