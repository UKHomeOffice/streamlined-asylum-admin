'use strict';

const RemoveDocument = require('../../../apps/common/behaviours/remove-document');

const baseConfigure = jest.fn();

class BaseBehaviour {
  configure() {
    return baseConfigure.apply(this, arguments);
  }
}

const Behaviour = RemoveDocument('supporting-evidence')(BaseBehaviour);

const createRequest = query => ({
  baseUrl: '/updates',
  path: '/upload-supporting-evidence',
  query,
  log: jest.fn(),
  sessionModel: {
    get: jest.fn(),
    set: jest.fn()
  }
});

describe('remove document behaviour', () => {
  let behaviour;

  beforeEach(() => {
    behaviour = new Behaviour();
  });

  test('removes the selected document and redirects back to the step', () => {
    const req = createRequest({ delete: 'remove-me' });
    req.sessionModel.get.mockReturnValue([
      { id: 'keep-me', name: 'keep.pdf' },
      { id: 'remove-me', name: 'remove.pdf' }
    ]);
    const res = { redirect: jest.fn() };

    behaviour.configure(req, res, jest.fn());

    expect(req.sessionModel.set).toHaveBeenCalledWith('supporting-evidence', [
      { id: 'keep-me', name: 'keep.pdf' }
    ]);
    expect(res.redirect).toHaveBeenCalledWith('/updates/upload-supporting-evidence');
  });

  test('handles deletion when the session has no documents', () => {
    const req = createRequest({ delete: 'missing' });
    req.sessionModel.get.mockReturnValue(undefined);

    behaviour.configure(req, { redirect: jest.fn() }, jest.fn());

    expect(req.sessionModel.set).toHaveBeenCalledWith('supporting-evidence', []);
  });

  test('delegates configuration when no document is selected', () => {
    const req = createRequest({});
    const res = {};
    const next = jest.fn();

    behaviour.configure(req, res, next);

    expect(baseConfigure).toHaveBeenCalledWith(req, res, next);
    expect(req.sessionModel.set).not.toHaveBeenCalled();
  });
});
