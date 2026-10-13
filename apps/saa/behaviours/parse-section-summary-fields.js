// Options can hide fields, format dates, or combine fields into one summary row.
const { formatDate } = require('../../../utils');

const OPTION_MIXINS = new Set(['radio-group', 'checkbox-group']);

// These would happily live inline, but Sonar doesn't like them, so here they are.
const formatListValue = (field, value, ctx) =>
  value
    // Uploaded files are saved as objects; checkbox answers as option values.
    .map(
      entry =>
        entry?.name ??
        (ctx.isOptionField(field) ? ctx.translateOption(field, entry) : entry)
    )
    .filter(Boolean)
    .join('\n');

const combineValues = (first, names, values) =>
  [first, ...names.map(name => values[name])].filter(Boolean).join(' ');

const parseValue = ({ field, value, parsed }, values, ctx) => {
  let result = parsed;

  if (Array.isArray(value)) {
    result = formatListValue(field, value, ctx);
  } else if (value && ctx.isOptionField(field)) {
    result = ctx.translateOption(field, value);
  }
  if (value && ctx.dateFields.has(field)) {
    result = formatDate(value);
  }
  if (ctx.combineFields[field]) {
    result = combineValues(result || value, ctx.combineFields[field], values);
  }
  return result;
};

const parseSectionSummaryFields =
  (options = {}) =>
    superclass =>
      class extends superclass {
        locals(req, res) {
          const locals = super.locals(req, res);
          const fieldsConfig = req.form.options.fieldsConfig || {};
          const omitFields = new Set(options.omitFields || []);
          const combineFields = options.combineFields || {};
          const combinedFields = new Set(Object.values(combineFields).flat());
          const [titleField] = [req.form.options.titleField || []].flat();
          const isOptionField = field =>
            OPTION_MIXINS.has(fieldsConfig[field]?.mixin);
          const ctx = {
            isOptionField,
            translateOption: (field, option) =>
              req.translate(`fields.${field}.options.${option}.label`),
            dateFields: new Set(options.dateFields || []),
            combineFields
          };
          const hasValue = value =>
            Array.isArray(value) ? value.length > 0 : Boolean(value);

          // Copy items so the saved field names stay unchanged for editing.
          locals.items = locals.items.map(item => {
            const values = Object.fromEntries(
              item.fields.map(({ field, value }) => [field, value])
            );
            let joinTitle = item.joinTitle;
            if (options.itemTitle) {
            // Same title on every item, e.g. when there is no titleField.
              joinTitle = req.translate(options.itemTitle);
            } else if (isOptionField(titleField) && values[titleField]) {
              joinTitle = req.translate([
                `fields.${titleField}.options.${values[titleField]}.summary-label`,
                `fields.${titleField}.options.${values[titleField]}.label`
              ]);
            }

            const fields = item.fields.map(original => ({
              ...original,
              parsed: parseValue(original, values, ctx),
              // summary-label is only defined when it differs from the field's label or legend.
              label: req.translate([
                `fields.${original.field}.summary-label`,
                `fields.${original.field}.label`,
                `fields.${original.field}.legend`
              ]),
              omitFromSummary:
              !hasValue(original.value) ||
              omitFields.has(original.field) ||
              combinedFields.has(original.field)
            }));

            return { ...item, joinTitle, fields };
          });
          return locals;
        }
      };
module.exports = parseSectionSummaryFields;
