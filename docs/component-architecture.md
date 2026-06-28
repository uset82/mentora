# Component Architecture Target

The current app is moving away from one giant product component. New work should place UI in product-area folders:

```text
src/components/app-shell/
src/components/study-workspace/
src/components/chat/
src/components/sources/
src/components/studio/
src/components/profile/
src/components/ui/
```

## Current Split

Already split:

- `src/components/study-workspace/study-workspace.tsx`
- `src/components/study-workspace/study-topbar.tsx`
- `src/components/study-workspace/study-sources-panel.tsx`
- `src/components/study-workspace/study-chat-panel.tsx`
- `src/components/study-workspace/study-studio-panel.tsx`
- `src/components/chat/chat-composer.tsx`
- `src/components/chat/attachment-menu.tsx`
- `src/components/chat/attachment-chip.tsx`
- `src/components/chat/upload-dropzone.tsx`
- `src/components/ui/status-chip.tsx`

## Next Extraction Targets

- Remove legacy `RealStudentDashboard` after the notebook workspace is fully accepted.
- Move any remaining legacy `DocumentStudio` pieces into `src/components/sources/` only if an advanced library view returns.
- Move remaining legacy `ToolStudio` pieces into `src/components/studio/` only if an advanced practice view returns.
- Continue moving shared primitives such as `EmptyState`, `UploadButton`, and panel headers into `src/components/ui/`.

Keep app-level data loading and mutations in the shell until a dedicated state layer exists.
