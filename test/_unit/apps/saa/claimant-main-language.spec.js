'use strict';

jest.mock(
  '../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

const app = require('../../../../apps/saa');
const fields = require('../../../../apps/saa/fields');
const languages = require('../../../../apps/saa/data/languages.json');
const validation = require('../../../../apps/saa/translations/src/en/validation.json');

describe('claimant main language', () => {
  const field = fields['claimant-main-language'];

  test('registers the field on the language step', () => {
    expect(app.steps['/claimant-main-language'].fields).toEqual(['claimant-main-language']);
    expect(app.steps['/claimant-main-language'].next).toBe('/person-completing-form');
  });

  test('uses a required native select enhanced by the existing typeahead', () => {
    expect(field.mixin).toBe('select');
    expect(field.className).toContain('typeahead');
    expect(field.validate).toContain('required');
    expect(validation['claimant-main-language'].required).toBe('You must select a main language');
    expect(field.options[0]).toEqual({
      value: '',
      label: 'fields.claimant-main-language.options.none_selected'
    });
  });

  test('includes every language as a distinct labelled option', () => {
    expect(new Set(languages).size).toBe(languages.length);
    expect(field.options.slice(1)).toEqual(
      languages.map(language => ({ value: language, label: language }))
    );
    expect(languages[0]).toBe('Afghan');
    expect(languages[languages.length - 1]).toBe('Rohingya');
    expect(languages).toEqual(expect.arrayContaining([
      'Not Specified', 'Unknown', 'Sign Language - British', 'Bosnian',
      'Lao', 'Serbian', 'Chimini', 'Tetum', 'Otjiherero'
    ]));
  });
});
