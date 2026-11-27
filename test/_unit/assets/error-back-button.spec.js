'use strict';

jest.mock('hof/frontend/themes/gov-uk/client-js', () => ({}));
jest.mock('../../../assets/js/file-upload', () => ({
  initFileUpload: jest.fn()
}));
jest.mock('../../../assets/js/typeahead', () => ({
  initTypeahead: jest.fn()
}));

describe('error page back button', () => {
  let readyHandler;

  beforeEach(() => {
    global.document = {
      getElementById: jest.fn(),
      addEventListener: jest.fn((event, handler) => {
        if (event === 'DOMContentLoaded') {
          readyHandler = handler;
        }
      })
    };
    global.window = { history: { back: jest.fn() } };
    jest.isolateModules(() => {
      require('../../../assets/js/index');
    });
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  test('reveals the button and navigates back only when clicked', () => {
    const button = {
      hidden: true,
      addEventListener: jest.fn()
    };
    global.document.getElementById.mockReturnValue(button);

    readyHandler();

    expect(global.document.getElementById).toHaveBeenCalledWith('error-back-button');
    expect(button.hidden).toBe(false);
    expect(button.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(global.window.history.back).not.toHaveBeenCalled();

    const clickHandler = button.addEventListener.mock.calls[0][1];
    clickHandler();

    expect(global.window.history.back).toHaveBeenCalledTimes(1);
  });

  test('does not fail or navigate when the page has no back button', () => {
    global.document.getElementById.mockReturnValue(null);

    expect(() => readyHandler()).not.toThrow();
    expect(global.window.history.back).not.toHaveBeenCalled();
  });
});
