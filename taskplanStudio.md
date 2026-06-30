# Mentora Studio Pipeline + Workspace Cleanup Task Plan

## Summary
Fix Studio so the real study tools are usable end to end, show generated outputs in dedicated focused popups instead of only the shared Studio output list, and add document deletion so users can clean their workspace.

## Ordered Checklist

### Phase 1. Baseline and Reproduction
* [x] Confirm the app is running on `localhost:3000`.
* [x] Inspect current Studio tool definitions, generation API, artifact rendering, and source panel document UI.
* [x] Reproduce the disabled Studio state and identify whether it is caused by missing readable chunks, UI eligibility, or API/storage failure.
* [x] Verify the current database/API compatibility constraints before changing pipeline behavior.

### Phase 2. Pipeline Eligibility and Tool Coverage
* [x] Ensure every real Studio tile uses the same generator-ready source contract.
* [x] Ensure tools work with all ready sources by default when none are selected.
* [x] Verify generated artifact kind fallback remains compatible with the live database.
* [x] Keep only unsupported tools disabled as coming soon.
* [x] Improve user feedback when no readable source exists.

### Phase 3. Dedicated Tool Output Popups
* [x] Add Studio state for the active generated artifact/tool view.
* [x] Open a focused modal after a tool generates successfully.
* [x] Add clickable Studio output cards that reopen their dedicated modal.
* [x] Render tool-specific modal content for Quiz, Flashcards, Mind Map, Data Table, Summary, APA Summary, Study Guide, Diagram, and Infographic.
* [x] Preserve Copy and Use in chat actions inside the modal.

### Phase 4. Delete Uploaded Documents
* [x] Add an authenticated material delete API path.
* [x] Delete associated document chunks and storage object where present.
* [x] Add delete controls to source rows with confirmation.
* [x] Refresh local workspace state after deletion.
* [x] Show clear error feedback if a delete fails.

### Phase 5. Verification
* [x] Run `npm run lint`.
* [x] Run `npm run typecheck`.
* [x] Run `npm run build`.
* [x] Run `npm run qa:responsive`.
* [x] Browser-test Studio generation with a ready source: Summary, Quiz, Flashcards, Data Table.
* [x] Browser-test that generated tools open in focused popups and can be reopened from Studio output.
* [x] Browser-test document deletion removes a source and does not leave horizontal overflow or console errors.
* [x] Commit and push after all checks pass.

## Public Interfaces / Types
* Add internal UI state and props for focused Studio artifact views.
* Add an internal authenticated `DELETE /api/materials` behavior.
* No database schema changes unless verification proves the live schema blocks deletion or generation.

## Assumptions
* "Studio features" means the real tools: Summary, Quiz, Flashcards, Mind Map, APA Summary, Data Table, Study Guide, Diagram, and Infographic.
* Audio Overview, Slide Deck, Video Overview, and Reports stay visible but disabled as coming soon.
* A source is generator-ready only when it has readable chunks.
* The modal/popup should be focused on one generated study output at a time.
