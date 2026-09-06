function detectProjectIntent(message) {
  const text = message.trim().toLowerCase();

  if (!text) return "UNKNOWN";

  if (/\b(who calls|what calls|called by|callers of|trace callers|caller chain)\b/i.test(text)) {
    return "CALLERS";
  }

  if (/\b(what does .* call|what .* calls|callees|calls made by)\b/i.test(text)) {
    return "CALLEES";
  }

  if (/\b(where is .* defined|where .* defined|definition of|find function|locate function|jump to)\b/i.test(text)) {
    return "DEFINITION";
  }

  if (/\b(execution path|flow to|path to|trace both|trace execution|execution trace)\b/i.test(text)) {
    return "TRACE";
  }

  if (/\b(what breaks|what affects|impact|remove|delete|what happens if.*change|impact of)\b/i.test(text)) {
    return "IMPACT";
  }

  if (/\b(dependency tree|dependencies|depends on|dependency)\b/i.test(text)) {
    return "DEPENDENCIES";
  }

  if (/\b(who uses|used by|imports|imported by)\b/i.test(text)) {
    return "FILE_USAGE";
  }

  if (/\b(show all functions|list functions|functions in)\b/i.test(text)) {
    return "FUNCTION_LIST";
  }

  if (
    /\b(explain|describe)\b.*(?:\bfile\b|\b[a-z0-9_$.-]+\.js\b)/i.test(
      text
    )
  ) {
    return "FILE_EXPLANATION";
  }

  if (/\b(full analysis|analyze function|analyse function|details about|everything about|explain function)\b/i.test(text)) {
    return "FUNCTION_ANALYSIS";
  }

  if (/\b(explain execution|execution flow|how .* executes|execution of)\b/i.test(text)) {
    return "EXECUTION";
  }

  if (/\b(how does .* work|feature|system)\b/i.test(text)) {
    return "FEATURE";
  }

  if (/\b(call hierarchy|hierarchy)\b/i.test(text)) {
    return "CALL_HIERARCHY";
  }

  if (/\b(execution graph|show execution graph)\b/i.test(text)) {
    return "EXECUTION_GRAPH";
  }

  if (/\b(execution pipeline|pipeline)\b/i.test(text)) {
    return "EXECUTION_PIPELINE";
  }

  if (/\b(execution tree|full tree|tree)\b/i.test(text)) {
    return "EXECUTION_TREE";
  }

  if (/\b(architecture|project architecture|show architecture)\b/i.test(text)) {
    return "ARCHITECTURE";
  }

  if (/\b(project graph|show project graph)\b/i.test(text)) {
    return "PROJECT_GRAPH";
  }

  if (/\b(reverse call graph|who reaches)\b/i.test(text)) {
    return "REVERSE_CALL_GRAPH";
  }

  if (/\b(list all files|list project files|show project files|list files)\b/i.test(text)) {
    return "LIST_FILES";
  }

  return "UNKNOWN";
}

module.exports = {
  detectProjectIntent
};
