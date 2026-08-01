function extractKeyword(message) {
  const text = message.toLowerCase();

  const words = text
    .replace(/[^\w\s./-]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const ignore = new Set([
    "where",
    "is",
    "the",
    "file",
    "files",
    "function",
    "functions",
    "find",
    "show",
    "me",
    "which",
    "what",
    "does",
    "calls",
    "call",
    "use",
    "uses",
    "using",
    "used",
    "handle",
    "handles",
    "import",
    "imports",
    "require",
    "requires",
    "code",
    "project",
    "in",
    "of",
    "for",
    "with",
    "a",
    "an",
    "all",
    "explain",
    "describe",
    "tell",
    "about",
    "trace",
    "who",
    "dependency",
    "tree",
    "breaks",
    "delete",
    "remove",
    "affects",
    "affect",
    "happens",
    "happen",
    "change",
    "changes",
    "changing",
    "impact",
    "if",
    "break",
    "i",
    "my",
    "your",
    "this",
    "that",
    "these",
    "those",
    "please",
    "can",
    "could",
    "would",  
    "should",
    "will",
    "reason",
 ]);

  const keyword = words.find(word => !ignore.has(word));

  return keyword || "";
}

module.exports = {
  extractKeyword
};



