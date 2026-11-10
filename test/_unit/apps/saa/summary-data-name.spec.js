const sections = require('../../../../apps/saa/sections/summary-data-name');

const [reasonRow, nameRow, evidenceRow] =
  sections['change-your-name'].steps;

describe('name change summary rows', () => {
  test('configures each answer and its Change link', () => {
    expect([reasonRow, nameRow, evidenceRow]).toEqual([
      {
        step: '/reason-name-change',
        field: 'reason-name-change',
        changeLink: '/changes/reason-name-change'
      },
      {
        step: '/new-name',
        field: 'given-name',
        changeLink: '/changes/new-name',
        parse: expect.any(Function)
      },
      {
        step: '/new-name-evidence',
        field: 'documents-new-name',
        changeLink: '/changes/new-name-evidence',
        parse: expect.any(Function)
      }
    ]);
  });

  test.each([
    ['Alex', 'Smith', 'Alex Smith'],
    ['Alex', undefined, 'Alex'],
    [undefined, 'Smith', 'Smith'],
    [undefined, undefined, '']
  ])(
    'combines the given name and family name (%p, %p)',
    (givenName, familyName, expected) => {
      const values = {
        'given-name': givenName,
        'family-name': familyName
      };
      const req = { sessionModel: { get: key => values[key] } };

      expect(nameRow.parse(givenName, req)).toBe(expected);
    }
  );

  test('lists uploaded evidence names on separate lines', () => {
    expect(
      evidenceRow.parse([
        { name: 'deed-poll.pdf' },
        { name: 'marriage-certificate.pdf' }
      ])
    ).toBe('deed-poll.pdf\nmarriage-certificate.pdf');
  });

  test.each([undefined, null, []])(
    'shows translated fallback text when evidence is %p',
    documents => {
      const req = { translate: jest.fn().mockReturnValue('No files uploaded') };
      expect(evidenceRow.parse(documents, req)).toBe('No files uploaded');
      expect(req.translate).toHaveBeenCalledWith('fields.file-upload.no-files-uploaded');
    }
  );
});
