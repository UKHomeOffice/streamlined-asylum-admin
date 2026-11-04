'use strict';

const SummaryLabels = require('../../../../../apps/saa/behaviours/summary-labels');
const fields = require('../../../../../apps/saa/translations/src/en/fields.json');
const pages = require('../../../../../apps/saa/translations/src/en/pages.json');

describe('summary labels behaviour', () => {
  class BaseBehaviour {
    translateLabel() {
      return 'hof label';
    }
  }
  const Behaviour = SummaryLabels(BaseBehaviour);

  test('checks the confirm page label, then summary-label, then the field label and legend', () => {
    const translate = jest.fn(() => 'Their name');

    expect(
      new Behaviour().translateLabel('child-partner-given-name', { translate })
    ).toBe('Their name');
    expect(translate).toHaveBeenCalledWith([
      'pages.confirm.fields.child-partner-given-name.label',
      'fields.child-partner-given-name.summary-label',
      'fields.child-partner-given-name.label',
      'fields.child-partner-given-name.legend'
    ]);
  });

  test.each([
    ['claim-decided', 'Claim decided'],
    ['user-email', 'Email address']
  ])(
    'uses the shared summary-label for %s without a page override',
    (field, label) => {
      const translations = { fields, pages };
      const translate = keys =>
        keys
          .map(key =>
            key.split('.').reduce((value, part) => value?.[part], translations)
          )
          .find(value => value !== undefined);

      expect(pages.confirm.fields[field]).toBeUndefined();
      expect(fields[field]['summary-label']).toBe(label);
      expect(new Behaviour().translateLabel(field, { translate })).toBe(label);
    }
  );
});
