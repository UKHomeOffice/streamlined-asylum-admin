'use strict';

const EditRouteStart = require('../../../../../apps/saa/behaviours/edit-route-start');

const baseGetValues = jest.fn();
const baseSaveValues = jest.fn();

class BaseBehaviour {
  getValues(req, res, next) {
    return baseGetValues(req, res, next);
  }

  saveValues(req, res, next) {
    return baseSaveValues(req, res, next);
  }
}

const Behaviour = EditRouteStart(BaseBehaviour);

const createRequest = () => ({
  originalUrl: '/changes/check-your-answers-add-child-partner',
  sessionModel: {
    set: jest.fn(),
    unset: jest.fn()
  }
});

describe('edit route start behaviour', () => {
  let behaviour;

  beforeEach(() => {
    baseGetValues.mockReset().mockReturnValue('values');
    baseSaveValues.mockReset().mockReturnValue('saved');
    behaviour = new Behaviour();
  });

  test('remembers the summary page URL when it is shown', () => {
    const req = createRequest();
    const res = {};
    const next = jest.fn();

    expect(behaviour.getValues(req, res, next)).toBe('values');
    expect(req.sessionModel.set).toHaveBeenCalledWith(
      'edit-return-path',
      '/changes/check-your-answers-add-child-partner'
    );
    expect(baseGetValues).toHaveBeenCalledWith(req, res, next);
  });

  test('forgets the summary page URL once it is submitted', () => {
    const req = createRequest();
    const res = {};
    const next = jest.fn();

    expect(behaviour.saveValues(req, res, next)).toBe('saved');
    expect(req.sessionModel.unset).toHaveBeenCalledWith('edit-return-path');
    expect(baseSaveValues).toHaveBeenCalledWith(req, res, next);
  });

  test('clears the URL before the parent save runs', () => {
    const req = createRequest();
    baseSaveValues.mockImplementation(() => {
      expect(req.sessionModel.unset).toHaveBeenCalledWith('edit-return-path');
    });

    behaviour.saveValues(req, {}, jest.fn());

    expect(baseSaveValues).toHaveBeenCalled();
  });
});
