// HOF's summary labels ignore summary-label; check it so /confirm matches the aggregator summary pages.
const summaryLabels = superclass =>
  class extends superclass {
    translateLabel(key, req) {
      return req.translate([
        `pages.confirm.fields.${key}.label`,
        `fields.${key}.summary-label`,
        `fields.${key}.label`,
        `fields.${key}.legend`
      ]);
    }
  };

module.exports = summaryLabels;
