const sections = require('../../../../apps/saa/sections/summary-data-date-of-birth');

const [dateRow, evidenceRow] = sections['date-of-birth'].steps;

describe('date of birth summary rows', () => {
  test('formats the corrected date', () => {
    expect(dateRow.parse('2020-03-27')).toBe('27 March 2020');
  });

  test.each([undefined, null])(
    'returns null when the corrected date is %p',
    date => {
      expect(dateRow.parse(date)).toBeNull();
    }
  );

  test('lists uploaded evidence names on separate lines', () => {
    expect(
      evidenceRow.parse([
        { name: 'letter.pdf' },
        { name: 'photo.png' }
      ])
    ).toBe('letter.pdf\nphoto.png');
  });

  test.each([undefined, null, []])(
    'returns an empty value when evidence is %p',
    documents => {
      expect(evidenceRow.parse(documents)).toBe('');
    }
  );

  test('Change links return to the page for each answer', () => {
    expect([dateRow.changeLink, evidenceRow.changeLink]).toEqual([
      '/changes/correct-date-of-birth',
      '/changes/new-date-of-birth-evidence'
    ]);
  });
});
