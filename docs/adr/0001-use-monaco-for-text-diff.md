# Use Monaco for Text Diff

The standalone Text Diff Tool will use Monaco's built-in Diff Editor and load it only when that tool is opened. We accept the additional extension package size because Monaco provides mature line alignment, inline change highlighting, and unchanged-region handling without QHelper owning a text diff algorithm; this is intentionally separate from the existing CodeMirror-based Text Preview tool.
