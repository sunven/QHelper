---
status: accepted
---

# Merge HTML, XML, and CSS formatting into one Syntax Formatter

HTML, XML, and CSS formatting were three **Launch Entries** that already shared the **Transform Tool Page** shape (one input, pretty or minified output). Keep them as one **Syntax Formatter** in the **Tool Catalog** (`formatter`, 「格式化」, Web 格式) with an explicit **Formatter Language**. JSON, language conversion, Markdown, SVG optimize, and JS uglify stay separate tools.

## Considered Options

- One **Launch Entry**, language chosen on the page (chosen): matches Convert; the popup lists one formatter; old `htmlformat` / `xmlformatter` / `csstool` paths redirect to the canonical path with a language.
- One page, three catalog entries: bookmarks stay obvious, but the catalog still shows three near-identical tools.
- Auto-detect language in one paste box: `<foo/>` is both HTML and XML; JSON's tree view and Diff still would not fit.

## Consequences

- Last **Formatter Language** is **Persisted Tool Data**. History is one store; snapshots include language; the three old histories migrate on first load.
- The page module is the **Syntax Formatter**, not an extra language dimension on **Transform Tool Page**. Beautify/minify stay directions; language is a separate control.
- Context Hub detection of HTML/XML/CSS is out of this change.
