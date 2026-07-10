---
status: accepted
---

# Use CodeMirror Merge for Text Diff

The Text Diff Tool will replace Monaco with `@codemirror/merge`, superseding ADR-0001. QHelper already uses CodeMirror 6, so this preserves editable side-by-side comparison, line alignment, and inline change highlighting while removing roughly 4 MiB from the built extension; we accept keeping the side-by-side layout on narrow screens and target ordinary interactive text rather than very large files.
