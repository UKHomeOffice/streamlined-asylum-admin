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

  test('returns an empty value when no files were uploaded', () => {
    expect(filesRow.parse(undefined)).toBe('');
  });

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
