const projectSearch = require("../index/searchIndex");

function analyzeImpact(fileName) {

  const usedBy = projectSearch.findUsedBy(fileName);

  if (usedBy.length === 0) {
    return {
      found: true,
      reply:
`🛡 Impact Analysis

${fileName}

No project files depend on this file.

Risk:
LOW`
    };
  }

  let reply =
`⚠️ Impact Analysis

Deleting:

${fileName}

Affected files:

`;

  for (const file of usedBy) {
    reply += `• ${file.file}
  Line ${file.line}

`;
  }

  reply +=
`Total affected: ${usedBy.length}

Risk:
HIGH`;

  return {
    found: true,
    reply
  };

}

module.exports = {
  analyzeImpact
};
