'use strict';

const sections = require('../../../../apps/saa/sections/summary-data-evidence-help-your-claim');

const [filesRow, imagesRow] = sections.evidence.steps;

describe('evidence summary sections', () => {
  test('lists uploaded file names one per line', () => {
    const documents = [
      { id: '1', name: 'letter.pdf' },
      { id: '2', name: 'photo.png' }
    ];

    expect(filesRow.parse(documents)).toBe('letter.pdf\nphoto.png');
  });

  test.each([[undefined], [null], [[]]])(
    'returns the translated fallback for %p',
    documents => {
      const req = { translate: jest.fn().mockReturnValue('No files uploaded') };
      expect(filesRow.parse(documents, req)).toBe('No files uploaded');
      expect(req.translate).toHaveBeenCalledWith(
        'fields.file-upload.no-files-uploaded'
      );
    }
  );

  test('each answer links to the page where it was given', () => {
    expect(filesRow).toMatchObject({
      step: '/upload-supporting-evidence',
      field: 'documents-help-your-claim',
      changeLink: '/changes/upload-supporting-evidence'
    });
    expect(imagesRow).toMatchObject({
      step: '/violent-upsetting-images',
      field: 'evidence-violent-or-upsetting',
      changeLink: '/changes/violent-upsetting-images'
    });
  });
});
