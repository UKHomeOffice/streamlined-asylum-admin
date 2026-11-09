// HOF's summary labels ignore summary-label; check it so /confirm matches the aggregator summary pages.
const summaryLabels = superclass =>
  class extends superclass {
    getFieldsForRow(section, req) {
      // framework otherwise runs parsers for unmet dependencies, allowing fallback text to reveal hidden rows.
      const fields = (section || []).filter(
        field =>
          typeof field === 'string' || this.dependencySatisfied(field, req)
      );
      return super.getFieldsForRow(fields, req);
    }

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
