'use strict';

const mockUploadSave = jest.fn();
const mockUploadToJSON = jest.fn();

jest.mock('../../../utils/file-upload', () => jest.fn().mockImplementation(() => ({
  save: mockUploadSave,
  toJSON: mockUploadToJSON
})));

const SaveDocument = require('../../../apps/saa/behaviours/save-document');
const FileUpload = require('../../../utils/file-upload');
const uploadConfig = require('../../../assets/js/file-upload-config');

class ValidationError extends Error {
  constructor(key, options) {
    super(options.type);
    this.key = key;
    this.type = options.type;
    this.arguments = options.arguments;
  }
}

const baseProcess = jest.fn();
const baseValidateField = jest.fn();
const baseSaveValues = jest.fn();

class BaseBehaviour {
  constructor() {
    this.ValidationError = ValidationError;
  }

  process() {
    return baseProcess.apply(this, arguments);
  }

  locals() {
    return { existing: true };
  }

  validateField() {
    return baseValidateField.apply(this, arguments);
  }

  saveValues() {
    return baseSaveValues.apply(this, arguments);
  }
}

const Behaviour = SaveDocument('documents-help-your-claim', 'file-upload')(BaseBehaviour);

const createRequest = (overrides = {}) => ({
  baseUrl: '/updates',
  path: '/upload-supporting-evidence',
  body: {},
  files: {},
  form: { values: {} },
  log: jest.fn(),
  sessionModel: {
    get: jest.fn().mockReturnValue([]),
    set: jest.fn()
  },
  ...overrides
});

describe('save document behaviour', () => {
  let behaviour;

  beforeEach(() => {
    behaviour = new Behaviour();
    mockUploadSave.mockResolvedValue(undefined);
    mockUploadToJSON.mockReturnValue({ id: 'upload-id', name: 'evidence.pdf' });
  });

  test('adds the uploaded filename to form values during processing', () => {
    const req = createRequest({
      files: { 'file-upload': { name: 'evidence.pdf' } }
    });

    behaviour.process(req);

    expect(req.form.values['file-upload']).toBe('evidence.pdf');
    expect(baseProcess).toHaveBeenCalledWith(req);
  });

  test('provides uploaded documents to the view', () => {
    const documents = [{ id: 'one', name: 'evidence.pdf' }];
    const req = createRequest();
    req.sessionModel.get.mockReturnValue(documents);

    expect(behaviour.locals(req, {})).toEqual({
      existing: true,
      documents
    });
  });

  test('provides the upload field error to the view', () => {
    const error = { key: 'file-upload', type: 'fileType', message: 'File must be a document' };
    const req = createRequest({ form: { values: {}, errors: { 'file-upload': error } } });

    expect(behaviour.locals(req, {}).fileUploadError).toBe(error);
  });

  test('requires a file when there are no existing documents', () => {
    const req = createRequest();

    expect(behaviour.validateField('file-upload', req)).toMatchObject({
      key: 'file-upload',
      type: 'required'
    });
  });

  test('allows continuing without a new file when documents already exist', () => {
    const req = createRequest();
    req.sessionModel.get.mockReturnValue([{ id: 'one', name: 'evidence.pdf' }]);

    expect(behaviour.validateField('file-upload', req)).toBeUndefined();
  });

  test('validates the submitted file when there are no existing documents', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'evidence.pdf',
          size: 100,
          mimetype: 'application/pdf'
        }
      }
    });

    expect(behaviour.validateField('file-upload', req)).toBeUndefined();
  });

  test('rejects files larger than 25MB', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'large.pdf',
          size: 25 * 1024 * 1024 + 1,
          mimetype: 'application/pdf'
        }
      }
    });

    expect(behaviour.validateField('file-upload', req).type).toBe('maxFileSize');
  });

  test('rejects empty files', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'empty.pdf',
          size: 0,
          mimetype: 'application/pdf'
        }
      }
    });

    expect(behaviour.validateField('file-upload', req).type).toBe('emptyFile');
  });

  test('rejects files truncated by the multipart parser', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'truncated.pdf',
          size: 1,
          mimetype: 'application/pdf',
          truncated: true
        }
      }
    });

    expect(behaviour.validateField('file-upload', req).type).toBe('maxFileSize');
  });

  test('rejects unsupported file types', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'evidence.exe',
          size: 100,
          mimetype: 'application/x-msdownload'
        }
      }
    });

    expect(behaviour.validateField('file-upload', req).type).toBe('fileType');
  });

  test.each([
    ['evidence.exe'],
    ['evidence'],
    ['evidence.pdf.exe']
  ])('rejects %s with an allowed MIME type', name => {
    const req = createRequest({
      files: {
        'file-upload': {
          name,
          size: 100,
          mimetype: 'application/pdf'
        }
      }
    });

    expect(behaviour.validateField('file-upload', req).type).toBe('fileType');
  });

  test('accepts an allowed extension regardless of case', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'EVIDENCE.PDF',
          size: 100,
          mimetype: 'application/pdf'
        }
      }
    });

    expect(behaviour.validateField('file-upload', req)).toBeUndefined();
  });

  test.each([
    ['evidence.doc', 'application/msword'],
    ['evidence.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['evidence.pdf', 'application/pdf'],
    ['evidence.rtf', 'application/rtf'],
    ['evidence.rtf', 'text/rtf'],
    ['evidence.txt', 'text/plain'],
    ['evidence.odt', 'application/vnd.oasis.opendocument.text'],
    ['evidence.jpeg', 'image/jpeg'],
    ['evidence.jpg', 'image/jpeg'],
    ['evidence.png', 'image/png']
  ])('accepts %s with MIME type %s', (name, mimetype) => {
    const req = createRequest({
      files: {
        'file-upload': {
          name,
          size: 100,
          mimetype
        }
      }
    });

    expect(behaviour.validateField('file-upload', req)).toBeUndefined();
  });

  test('rejects uploads when the category limit is reached', () => {
    const categoryLimit = uploadConfig.documentCategories['documents-help-your-claim'].limit;
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'another.pdf',
          size: 100,
          mimetype: 'application/pdf'
        }
      }
    });
    req.sessionModel.get.mockReturnValue(
      Array.from({ length: categoryLimit }, (_, index) => ({ id: `${index}`, name: `${index}.pdf` }))
    );

    expect(behaviour.validateField('file-upload', req)).toMatchObject({
      type: 'supportingEvidenceLimit',
      arguments: [categoryLimit]
    });
  });

  test('rejects a duplicate filename', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'evidence.pdf',
          size: 100,
          mimetype: 'application/pdf'
        }
      }
    });
    req.sessionModel.get.mockReturnValue([{ id: 'one', name: 'evidence.pdf' }]);

    expect(behaviour.validateField('file-upload', req)).toMatchObject({
      type: 'isDuplicateFileName',
      arguments: ['evidence.pdf']
    });
  });

  test('delegates validation for a valid file', () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'evidence.pdf',
          size: 100,
          mimetype: 'application/pdf'
        }
      }
    });

    behaviour.validateField('file-upload', req);

    expect(baseValidateField).toHaveBeenCalledWith('file-upload', req);
  });

  test('uploads the file, updates the session and redirects back to the step', async () => {
    const file = {
      name: 'evidence.pdf',
      data: Buffer.from('evidence'),
      mimetype: 'application/pdf'
    };
    const existingDocument = { id: 'existing', name: 'existing.pdf' };
    const req = createRequest({ files: { 'file-upload': file } });
    req.sessionModel.get.mockReturnValue([existingDocument]);
    const res = { redirect: jest.fn() };
    const next = jest.fn();

    await behaviour.saveValues(req, res, next);

    expect(FileUpload).toHaveBeenCalledWith(file);
    expect(mockUploadSave).toHaveBeenCalled();
    expect(req.sessionModel.set).toHaveBeenCalledWith('documents-help-your-claim', [
      existingDocument,
      { id: 'upload-id', name: 'evidence.pdf' }
    ]);
    expect(res.redirect).toHaveBeenCalledWith('/updates/upload-supporting-evidence');
    expect(next).not.toHaveBeenCalled();
  });

  test('passes upload failures to the next error handler', async () => {
    const req = createRequest({
      files: {
        'file-upload': {
          name: 'evidence.pdf',
          data: Buffer.from('evidence'),
          mimetype: 'application/pdf'
        }
      }
    });
    const error = new Error('vault unavailable');
    mockUploadSave.mockRejectedValue(error);
    const next = jest.fn();

    await behaviour.saveValues(req, { redirect: jest.fn() }, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: `Failed to save document: ${error}` })
    );
  });

  test('delegates saving when no file was submitted', async () => {
    const req = createRequest();

    await behaviour.saveValues(req, {}, jest.fn());

    expect(baseSaveValues).toHaveBeenCalledWith(req, {}, expect.any(Function));
  });
});
