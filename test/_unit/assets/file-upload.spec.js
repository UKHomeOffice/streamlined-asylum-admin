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
    getAttribute: jest.fn().mockReturnValue('supporting-evidence')
  };
  const spinner = { style: {} };
  const continueButton = { disabled: false, ariaDisabled: false };
  const removeLink = { classList: createClassList() };
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
    getElementsByName: jest.fn().mockReturnValue([continueButton]),
    querySelectorAll: jest.fn().mockReturnValue([removeLink]),
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
    ['emptyFile', { size: 0, type: 'application/pdf' }],
    ['maxFileSize', { size: uploadConfig.maxFileSizeInBytes + 1, type: 'application/pdf' }],
    ['fileType', { size: 100, type: 'application/x-msdownload' }]
  ])('shows the %s error without submitting', (errorType, file) => {
    const fixture = createDocument(file);
    global.document = fixture.document;

    initFileUpload();
    fixture.dispatchChange();

    expect(fixture.component.classList.add).toHaveBeenCalledWith('govuk-form-group--error');
    expect(fixture.errorElements[errorType].classList.remove)
      .toHaveBeenCalledWith('govuk-!-display-none');
    expect(fixture.form.submit).not.toHaveBeenCalled();
  });

  test('submits a valid file and shows the uploading state', () => {
    const fixture = createDocument({ size: 100, type: 'application/pdf' });
    global.document = fixture.document;

    initFileUpload();
    fixture.dispatchChange();

    expect(fixture.form.submit).toHaveBeenCalledTimes(1);
    expect(fixture.spinner.style.display).toBe('flex');
    expect(fixture.input.disabled).toBe(true);
    expect(fixture.continueButton.disabled).toBe(true);
    expect(fixture.removeLink.classList.add).toHaveBeenCalledWith('disabled-link');
  });
});
