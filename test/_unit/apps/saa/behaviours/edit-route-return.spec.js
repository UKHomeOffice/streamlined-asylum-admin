'use strict';

const EditRouteReturn = require('../../../../../apps/saa/behaviours/edit-route-return');

let saveError;

class BaseBehaviour {
  saveValues(req, res, callback) {
    callback(saveError);
  }
}

const Behaviour = EditRouteReturn(BaseBehaviour);

const createRequest = ({ options = {}, values = {}, editReturnPath } = {}) => ({
  form: { options, values },
  sessionModel: {
    get: jest.fn(key => (key === 'edit-return-path' ? editReturnPath : undefined))
  }
});

describe('edit route return behaviour', () => {
  let behaviour;
  let res;
  let next;

  beforeEach(() => {
    saveError = undefined;
    behaviour = new Behaviour();
    res = { redirect: jest.fn() };
    next = jest.fn();
  });

  test('redirects back to the summary page when editing', () => {
    const req = createRequest({ editReturnPath: '/changes/check-your-answers-add-child-partner' });

    behaviour.saveValues(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/changes/check-your-answers-add-child-partner');
    expect(next).not.toHaveBeenCalled();
  });

  test('continues normally when there is no edit return path', () => {
    behaviour.saveValues(createRequest(), res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('continues normally when the step sets continueOnEdit', () => {
    const req = createRequest({
      options: { continueOnEdit: true },
      editReturnPath: '/changes/summary'
    });

    behaviour.saveValues(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test.each([
    ['an object', { field: 'choice', value: 'yes' }],
    ['a function', req => req.form.values.choice === 'yes']
  ])('continues when the selected fork (condition as %s) sets continueOnEdit', (_, condition) => {
    const req = createRequest({
      options: { forks: [{ target: '/next', continueOnEdit: true, condition }] },
      values: { choice: 'yes' },
      editReturnPath: '/changes/summary'
    });

    behaviour.saveValues(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('redirects when the continueOnEdit fork is not selected', () => {
    const req = createRequest({
      options: {
        forks: [{ target: '/next', continueOnEdit: true, condition: { field: 'choice', value: 'yes' } }]
      },
      values: { choice: 'no' },
      editReturnPath: '/changes/summary'
    });

    behaviour.saveValues(req, res, next);

    expect(res.redirect).toHaveBeenCalledWith('/changes/summary');
  });

  test('passes save errors on without redirecting', () => {
    saveError = new Error('save failed');
    const req = createRequest({ editReturnPath: '/changes/summary' });

    behaviour.saveValues(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(saveError);
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
