'use strict';

jest.mock(
  '../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

const fs = require('node:fs');
const path = require('node:path');
const app = require('../../../../apps/saa');
const fields = require('../../../../apps/saa/fields');
const fieldTranslations = require('../../../../apps/saa/translations/src/en/fields.json');
const validation = require('../../../../apps/saa/translations/src/en/validation.json');
const buttons = require('../../../../apps/saa/translations/src/en/buttons.json');
const Controller = require('hof/controller/controller');

describe('declaration', () => {
  const field = 'declaration-check';
  const step = app.steps['/declaration'];
  const controller = new Controller({
    ...step,
    route: '/declaration',
    fields: { [field]: fields[field] },
    fieldsConfig: fields
  });

  test('uses the required agreement checkbox before submission', () => {
    expect(step.fields).toEqual([field]);
    expect(step.next).toBe('/submitted');
    expect(fields[field]).toMatchObject({
      mixin: 'checkbox-group',
      options: ['agree'],
      validate: ['required'],
      legend: { className: 'govuk-visually-hidden' }
    });
    expect(fieldTranslations[field].options.agree.label).toBe(
      'I understand and agree with the above statements'
    );
    expect(validation[field].required).toBe(
      'Select if you agree to the statements'
    );
  });

  test('rejects an unchecked checkbox and accepts agreement', () => {
    const req = { form: { values: {}, options: { fields: { [field]: fields[field] } } } };
    expect(controller.validateField(field, req)).toMatchObject({
      key: field,
      type: 'required'
    });
    req.form.values[field] = 'agree';
    expect(controller.validateField(field, req)).toBeFalsy();
  });

  test('includes the declaration and contact details warning before the checkbox', () => {
    const views = path.join(__dirname, '../../../../apps/saa/views');
    const template = fs.readFileSync(path.join(views, 'declaration.html'), 'utf8');
    const content = fs.readFileSync(path.join(views, 'content/en/declaration.md'), 'utf8');
    expect(template).toContain('{{#markdown}}declaration{{/markdown}}');
    expect(template).toContain('{{#renderField}}declaration-check{{/renderField}}');
    expect(template).toContain('{{#input-submit}}submit{{/input-submit}}');
    expect(buttons.submit).toBe('Submit');
    expect(template.indexOf('{{#markdown}}declaration{{/markdown}}'))
      .toBeLessThan(template.indexOf('{{#renderField}}declaration-check{{/renderField}}'));
    expect(content).toContain('I confirm that:');
    expect(content).toContain('the information I have given is true and correct to the best of my knowledge');
    expect(content).toContain('govuk-warning-text__icon');
    expect(content).toContain(
      'Make sure your contact details are correct. If they are not, you may miss important information ' +
      'and your claim could be withdrawn.'
    );
  });
});
