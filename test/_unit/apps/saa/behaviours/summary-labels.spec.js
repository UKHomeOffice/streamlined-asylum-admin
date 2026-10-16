'use strict';

const SummaryLabels = require('../../../../../apps/saa/behaviours/summary-labels');

describe('summary labels behaviour', () => {
  class BaseBehaviour {
    translateLabel() {
      return 'hof label';
    }
  }
  const Behaviour = SummaryLabels(BaseBehaviour);

  test('checks the confirm page label, then summary-label, then the field label and legend', () => {
    const translate = jest.fn(() => 'Their name');

    expect(new Behaviour().translateLabel('child-partner-given-name', { translate })).toBe('Their name');
    expect(translate).toHaveBeenCalledWith([
      'pages.confirm.fields.child-partner-given-name.label',
      'fields.child-partner-given-name.summary-label',
      'fields.child-partner-given-name.label',
      'fields.child-partner-given-name.legend'
    ]);
  });
});
