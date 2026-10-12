'use strict';

const uploadConfig = require('../../../assets/js/file-upload-config');
const { initFileUpload } = require('../../../assets/js/file-upload');

const createClassList = () => ({
  add: jest.fn(),
  remove: jest.fn()
});

const createDocument = file => {
  let changeHandler;
  const errors = [
    { classList: createClassList() },
    { classList: createClassList() },
    { classList: createClassList() }
  ];
  const errorElements = {
    emptyFile: { classList: createClassList() },
    maxFileSize: { classList: createClassList() },
    fileType: { classList: createClassList() }
  };
  const component = {
    classList: createClassList(),
    querySelectorAll: jest.fn().mockReturnValue(errors)
  };
  const input = {
    files: file ? [file] : [],
    disabled: false,
    ariaDisabled: false,
    addEventListener: jest.fn((event, handler) => {
      if (event === 'change') {
        changeHandler = handler;
      }
    }),
    getAttribute: jest.fn().mockReturnValue('documents-help-your-claim'),
    setAttribute: jest.fn(),
    removeAttribute: jest.fn()
  };
  const spinner = { style: {} };
  const continueButton = { disabled: false, ariaDisabled: false };
  const removeLink = {
    classList: createClassList(),
    setAttribute: jest.fn(),
    addEventListener: jest.fn()
  };
  const form = { submit: jest.fn() };

  const document = {
    getElementById: jest.fn(id => ({
      'file-upload': input,
      hofFileUpload: component,
      'upload-page-loading-spinner': spinner,
      'file-upload-error-emptyFile': errorElements.emptyFile,
      'file-upload-error-maxFileSize': errorElements.maxFileSize,
      'file-upload-error-fileType': errorElements.fileType
    })[id]),
    querySelectorAll: jest.fn(selector => (
      selector === '[data-upload-continue]' ? [continueButton] : [removeLink]
    )),
    querySelector: jest.fn().mockReturnValue(form)
  };

  return {
    document,
    dispatchChange: () => changeHandler(),
    component,
    input,
    spinner,
    continueButton,
    removeLink,
    form,
    errorElements
  };
};

describe('file upload client validation', () => {
  afterEach(() => {
    delete global.document;
  });

  test('does nothing when the page has no file input', () => {
    global.document = {
      getElementById: jest.fn().mockReturnValue(null)
    };

    expect(() => initFileUpload()).not.toThrow();
  });

  test.each([
    ['emptyFile', { name: 'evidence.pdf', size: 0, type: 'application/pdf' }],
    ['maxFileSize', { name: 'evidence.pdf', size: uploadConfig.maxFileSizeInBytes + 1, type: 'application/pdf' }],
    ['fileType', { name: 'evidence.exe', size: 100, type: 'application/x-msdownload' }],
    ['fileType', { name: 'evidence.exe', size: 100, type: 'application/pdf' }],
    ['fileType', { name: 'evidence.pdf', size: 100, type: 'application/x-msdownload' }],
    ['fileType', { name: 'evidence', size: 100, type: 'application/pdf' }]
  ])('shows the %s error without submitting', (errorType, file) => {
    const fixture = createDocument(file);
    global.document = fixture.document;

    initFileUpload();
    fixture.dispatchChange();

    expect(fixture.component.classList.add).toHaveBeenCalledWith('govuk-form-group--error');
    expect(fixture.errorElements[errorType].classList.remove)
      .toHaveBeenCalledWith('govuk-!-display-none');
    expect(fixture.input.setAttribute).toHaveBeenCalledWith('aria-invalid', 'true');
    expect(fixture.input.setAttribute)
      .toHaveBeenCalledWith('aria-describedby', `file-upload-error-${errorType}`);
    expect(fixture.form.submit).not.toHaveBeenCalled();
  });

  test('clears the error state when a new file is selected', () => {
    const fixture = createDocument({ name: 'evidence.pdf', size: 100, type: 'application/pdf' });
    global.document = fixture.document;

    initFileUpload();
    fixture.dispatchChange();

    expect(fixture.input.removeAttribute).toHaveBeenCalledWith('aria-invalid');
    expect(fixture.input.removeAttribute).toHaveBeenCalledWith('aria-describedby');
    expect(fixture.input.setAttribute).not.toHaveBeenCalled();
  });

  test('clears a previous error when the file selection is cancelled', () => {
    const fixture = createDocument({ name: 'evidence.pdf', size: 0, type: 'application/pdf' });
    global.document = fixture.document;

    initFileUpload();
    fixture.dispatchChange();
    expect(fixture.component.classList.add).toHaveBeenCalledWith('govuk-form-group--error');

    jest.clearAllMocks();
    fixture.input.files = [];
    fixture.dispatchChange();

    expect(fixture.component.classList.remove).toHaveBeenCalledWith('govuk-form-group--error');
    expect(fixture.input.removeAttribute).toHaveBeenCalledWith('aria-invalid');
    expect(fixture.input.removeAttribute).toHaveBeenCalledWith('aria-describedby');
    expect(fixture.component.classList.add).not.toHaveBeenCalled();
    expect(fixture.form.submit).not.toHaveBeenCalled();
    expect(fixture.spinner.style.display).toBeUndefined();
  });

  test('submits a valid file and shows the uploading state', () => {
    const fixture = createDocument({ name: 'evidence.pdf', size: 100, type: 'application/pdf' });
    global.document = fixture.document;

    initFileUpload();
    fixture.dispatchChange();

    expect(fixture.form.submit).toHaveBeenCalledTimes(1);
    expect(fixture.spinner.style.display).toBe('flex');
    expect(fixture.input.disabled).toBe(true);
    expect(fixture.continueButton.disabled).toBe(true);
    expect(fixture.removeLink.classList.add).toHaveBeenCalledWith('disabled-link');
    expect(fixture.removeLink.setAttribute).toHaveBeenCalledWith('aria-disabled', 'true');
    expect(fixture.removeLink.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));

    const event = { preventDefault: jest.fn() };
    fixture.removeLink.addEventListener.mock.calls[0][1](event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  test.each([
    ['EVIDENCE.PDF', 'application/pdf'],
    ['evidence.odt', '']
  ])('submits %s with MIME type "%s"', (name, type) => {
    const fixture = createDocument({ name, size: 100, type });
    global.document = fixture.document;

    initFileUpload();
    fixture.dispatchChange();

    expect(fixture.form.submit).toHaveBeenCalledTimes(1);
  });
});
