const projectSearch = require("./searchIndex");

function extractKeyword(message) {
  const text = message.toLowerCase();

    // Explicit trace target
    // Supports:
    // trace function
    // trace both function
    // trace callers of function
    // trace callees of function
    const traceMatch = message.match(
      /^\s*trace\s+(?:(?:both|callers?|callees?|hierarchy)\s+)?(?:of\s+)?([A-Za-z_$][A-Za-z0-9_$]*)/i
    );

    if (traceMatch) {
      const candidate = traceMatch[1];

      // Only accept the candidate immediately if it is
      // actually a known project function.
      const knownFunction = projectSearch.findFunction(candidate);

      if (knownFunction.length > 0) {
        return candidate;
      }
    }
    const index = projectSearch.loadIndex();
  const projectFunctions = [];

  for (const file of index) {
    for (const fn of [
      ...(file.functions || []),
      ...(file.arrowFunctions || [])
    ]) {
      projectFunctions.push(fn.name);
    }
  }

  // Prefer an exact project function name appearing anywhere
  // in the user's question.
  for (const functionName of projectFunctions) {
    const pattern = new RegExp(
      `\\b${functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );

    if (pattern.test(message)) {
      return functionName;
    }
  }

  // Prefer an explicit function name after "for" or "about".
  const forMatch = message.match(
    /\b(?:for|about)\s+([A-Za-z_$][A-Za-z0-9_$]*)/i
  );

  if (forMatch) {
    return forMatch[1];
  }

  const words = text
    .replace(/[^\w\s/-]/g, "")
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
    "do",
    "does",
    "how",
    "work",
    "know",
    "you",
    "calls",
    "call",
    "hierarchy",
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
    "who",
    "both",
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
    "execution",
    "pipeline",
    "reverse",
    "path",
    "flow",
    "route",
    "routes",
    "full",
    "analysis",
    "analyze",
    "completely",
    "everything",
    "to",
    "graph",
    "trace"
  ]);

  const keyword = words.find(word => !ignore.has(word));

  return keyword || "";
}

module.exports = {
  extractKeyword
};
