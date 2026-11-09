const fs = require('fs');
const path = require('path');
const hogan = require('hogan.js');
const Summary = require('hof').components.summary;
const SummaryLabels = require('../../../../apps/saa/behaviours/summary-labels');
const fields = require('../../../../apps/saa/translations/src/en/fields.json');
const pages = require('../../../../apps/saa/translations/src/en/pages.json');
const sections = require('../../../../apps/saa/sections/summary-data-name');

const [reasonRow, nameRow, evidenceRow] =
  sections['change-your-name'].steps;

describe('name change summary rows', () => {
  test('renders the answers with a Change link beside each field', () => {
    const values = {
      'reason-name-change': 'error',
      'given-name': 'Alex',
      'family-name': 'Smith',
      'documents-new-name': [{ name: 'deed-poll.pdf' }]
    };
    const translations = { fields, pages };
    const req = {
      baseUrl: '/changes',
      sessionModel: { get: key => values[key] },
      translate: keys =>
        [].concat(keys)
          .map(key => key.replace(/\[([^\]]+)\]/g, '.$1')
            .split('.').filter(Boolean)
            .reduce((value, part) => value?.[part], translations))
          .map(value => value?.label || value)
          .find(value => value !== undefined),
      form: {
        options: {
          sections,
          fieldsConfig: { 'reason-name-change': { mixin: 'radio-group' } },
          steps: { '/reason-name-change': { fields: ['reason-name-change'] } }
        }
      }
    };
    const SummaryPage = SummaryLabels(Summary(class {}));
    const views = path.resolve(__dirname, '../../../../apps/saa/views');
    const template = hogan.compile(
      fs.readFileSync(path.join(views, 'check-your-answers-name.html'), 'utf8')
    );
    const html = template.render({
      rows: new SummaryPage().getRowsForSummarySections(req)
    }, {
      'partials-page': hogan.compile('{{$page-content}}{{/page-content}}'),
      'partials-summary-table': hogan.compile(
        fs.readFileSync(path.join(views, 'partials/summary-table.html'), 'utf8')
      )
    });

    expect(html).toContain('Change your name');
    expect(html).toContain('An error');
    expect(html).toContain('Alex Smith');
    expect(html).toContain('deed-poll.pdf');
    expect(html).toContain('href="/changes/reason-name-change"');
    expect(html).toContain('href="/changes/new-name"');
    expect(html).toContain('href="/changes/new-name-evidence"');
    expect(html.match(/<a\b/g)).toHaveLength(3);
    expect(html).not.toContain('href="/changes/do-you-need-to-change-your-name"');
  });

  test('shows the reason for the name change', () => {
    expect(reasonRow).toMatchObject({
      step: '/reason-name-change',
      field: 'reason-name-change',
      changeLink: '/changes/reason-name-change'
    });
  });

  test('combines the new given and family names', () => {
    const values = {
      'given-name': 'Alex',
      'family-name': 'Smith'
    };
    const req = { sessionModel: { get: key => values[key] } };

    expect(nameRow.parse(values['given-name'], req)).toBe('Alex Smith');
  });

  test('lists uploaded evidence names on separate lines', () => {
    expect(
      evidenceRow.parse([
        { name: 'deed-poll.pdf' },
        { name: 'marriage-certificate.pdf' }
      ])
    ).toBe('deed-poll.pdf\nmarriage-certificate.pdf');
  });

  test('Change links return to each answer page', () => {
    expect(
      [reasonRow.changeLink, nameRow.changeLink, evidenceRow.changeLink]
    ).toEqual([
      '/changes/reason-name-change',
      '/changes/new-name',
      '/changes/new-name-evidence'
    ]);
  });
});
