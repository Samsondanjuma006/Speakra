const nlp = require("compromise");

function extractFacts(message) {
  const doc = nlp(message);

  return {
    people: doc.people().out("array"),
    places: doc.places().out("array"),
    organizations: doc.organizations().out("array"),
    topics: doc.nouns().out("array")
  };
}

module.exports = {
  extractFacts
};
