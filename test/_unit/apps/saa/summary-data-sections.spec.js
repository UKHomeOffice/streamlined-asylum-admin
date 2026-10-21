'use strict';

const Summary = require('hof').components.summary;
const SummaryLabels = require('../../../../apps/saa/behaviours/summary-labels');
const sections = require('../../../../apps/saa/sections/summary-data-sections');

const dependantRows = sections['add-or-remove-dependants'].steps;

describe('summary data sections', () => {
  const row = dependantRows.find(entry => entry.field === 'addremovechildpartner');

  test('lists the child/partner aggregate with a link back to its summary page', () => {
    expect(row).toMatchObject({
      step: '/check-your-answers-add-child-partner',
      changeLink: '/changes/check-your-answers-add-child-partner',
      dependsOn: 'add-remove-dependant',
      addElementSeparators: true
    });
  });

  test('HOF lists each item as a titled block of labelled rows, with a divider between items', () => {
    const translations = {
      'fields.add-remove-child-partner.options.add-child-partner.summary-label':
        'Add a child or partner as a dependant',
      'fields.add-remove-child-partner.options.remove-child-partner.summary-label':
        'Remove a child or partner as a dependant',
      'fields.child-partner-given-name.label': 'Given name',
      'fields.child-partner-given-name.summary-label': 'Their name'
    };
    const item = choice => ({
      fields: [
        { field: 'add-remove-child-partner', value: choice, parsed: choice },
        { field: 'child-partner-given-name', value: 'Sam', parsed: 'Sam' },
        { field: 'child-partner-family-name', value: 'Smith', parsed: 'Smith' }
      ]
    });
    const session = {
      'add-remove-dependant': 'yes',
      addremovechildpartner: { aggregatedValues: [item('add-child-partner'), item('remove-child-partner')] }
    };
    const req = {
      baseUrl: '/changes',
      sessionModel: { get: key => session[key] },
      translate: keys => {
        const list = [].concat(keys);
        return translations[list.find(key => translations[key])] || list[list.length - 1];
      },
      form: {
        options: {
          fieldsConfig: { 'add-remove-child-partner': { mixin: 'radio-group' } },
          steps: { '/check-your-answers-add-child-partner': { titleField: ['add-remove-child-partner'] } }
        }
      }
    };
    const ConfirmPage = SummaryLabels(Summary(class {}));

    const shown = new ConfirmPage()
      .getFieldsForRow([row], req)
      .filter(field => !field.omitFromSummary)
      .map(field => {
        if (field.isSeparator) {
          return 'divider';
        }
        return field.isAggregatorTitle
          ? `title: ${field.value} (${field.aggregatorTitleChangeLink})`
          : `${field.label}: ${field.value}${field.omitChangeLink ? '' : ' (change link)'}`;
      });

    expect(shown).toEqual([
      'title: Add a child or partner as a dependant (/changes/check-your-answers-add-child-partner)',
      'Their name: Sam Smith',
      'divider',
      'title: Remove a child or partner as a dependant (/changes/check-your-answers-add-child-partner)',
      'Their name: Sam Smith'
    ]);
  });

  test('returns nothing when no children or partners have been added', () => {
    expect(row.parse(undefined, { form: { options: {} } })).toBeNull();
  });
});

describe('evidence rows on the confirm page', () => {
  const evidenceRows = sections.evidence.steps.filter(
    entry => entry.dependsOn === 'send-evidence-for-your-claim'
  );
  const translations = {
    'fields.documents-help-your-claim.summary-label': 'Files uploaded',
    'fields.evidence-violent-or-upsetting.summary-label':
      'Violent or upsetting images',
    'fields[evidence-violent-or-upsetting].options.[yes]': 'Yes'
  };
  const createRequest = session => ({
    baseUrl: '/changes',
    sessionModel: { get: key => session[key] },
    translate: keys => {
      const list = [].concat(keys);
      return translations[list.find(key => translations[key])] || list[list.length - 1];
    },
    form: {
      options: {
        fieldsConfig: { 'evidence-violent-or-upsetting': { mixin: 'radio-group' } },
        steps: {}
      }
    }
  });
  const ConfirmPage = SummaryLabels(Summary(class {}));
  const session = {
    'send-evidence-for-your-claim': 'yes',
    'documents-help-your-claim': [
      { id: '1', name: 'letter.pdf' },
      { id: '2', name: 'photo.png' }
    ],
    'evidence-violent-or-upsetting': 'yes'
  };

  test('lists the uploaded files and the images answer', () => {
    expect(evidenceRows.map(entry => entry.field)).toEqual([
      'documents-help-your-claim',
      'evidence-violent-or-upsetting'
    ]);
  });

  test('Change links go to the evidence check your answers page', () => {
    const shown = new ConfirmPage()
      .getFieldsForRow(evidenceRows, createRequest(session))
      .map(field => `${field.label}: ${field.value} (${field.changeLink})`);

    expect(shown).toEqual([
      'Files uploaded: letter.pdf\nphoto.png (/changes/check-your-answers-evidence)',
      'Violent or upsetting images: Yes (/changes/check-your-answers-evidence)'
    ]);
  });

  test('hides the rows when the user does not need to send evidence', () => {
    const fields = new ConfirmPage().getFieldsForRow(
      evidenceRows,
      createRequest({ ...session, 'send-evidence-for-your-claim': 'no' })
    );

    expect(fields).toEqual([]);
  });
});
