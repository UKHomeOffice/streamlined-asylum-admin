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

const hasValue = value =>
  Array.isArray(value) ? value.length > 0 : Boolean(value);

const getItemTitle = (item, values, ctx) => {
  const { itemTitle, titleField } = ctx;

  if (itemTitle) {
    // Same title on every item, e.g. when there is no titleField.
    return ctx.translate(itemTitle);
  }
  if (ctx.isOptionField(titleField) && values[titleField]) {
    return ctx.translate([
      `fields.${titleField}.options.${values[titleField]}.summary-label`,
      `fields.${titleField}.options.${values[titleField]}.label`
    ]);
  }
  return item.joinTitle;
};

// Returns a copy so the saved field names stay unchanged for editing.
const parseItem = (item, ctx) => {
  const values = Object.fromEntries(
    item.fields.map(({ field, value }) => [field, value])
  );
  const fields = item.fields.map(original => ({
    ...original,
    parsed: parseValue(original, values, ctx),
    // summary-label is only defined when it differs from the field's label or legend.
    label: ctx.translate([
      `fields.${original.field}.summary-label`,
      `fields.${original.field}.label`,
      `fields.${original.field}.legend`
    ]),
    omitFromSummary:
      !hasValue(original.value) ||
      ctx.omitFields.has(original.field) ||
      ctx.combinedFields.has(original.field)
  }));

  return { ...item, joinTitle: getItemTitle(item, values, ctx), fields };
};

const parseSectionSummaryFields =
  (options = {}) =>
    superclass =>
      class extends superclass {
        locals(req, res) {
          const locals = super.locals(req, res);
          const fieldsConfig = req.form.options.fieldsConfig || {};
          const combineFields = options.combineFields || {};
          const translate = keys => req.translate(keys);
          const ctx = {
            translate,
            isOptionField: field => OPTION_MIXINS.has(fieldsConfig[field]?.mixin),
            translateOption: (field, option) =>
              translate(`fields.${field}.options.${option}.label`),
            omitFields: new Set(options.omitFields || []),
            dateFields: new Set(options.dateFields || []),
            combineFields,
            combinedFields: new Set(Object.values(combineFields).flat()),
            titleField: [req.form.options.titleField || []].flat()[0],
            itemTitle: options.itemTitle
          };

          locals.items = locals.items.map(item => parseItem(item, ctx));
          return locals;
        }
      };
module.exports = parseSectionSummaryFields;
