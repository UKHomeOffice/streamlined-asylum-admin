'use strict';

const ResetSectionSummary = require('../../../../../apps/saa/behaviours/reset-section-summary');

const baseSaveValues = jest.fn();

class BaseBehaviour {
  saveValues(req, res, next) {
    return baseSaveValues(req, res, next);
  }
}

const createRequest = ({ decision, session = {} }) => ({
  form: { values: { 'add-remove-dependant': decision } },
  sessionModel: {
    get: jest.fn(key => session[key]),
    unset: jest.fn()
  }
});

const withItems = count => ({
  aggregatedValues: Array.from({ length: count }, (_, index) => ({ index }))
});

describe('reset section summary behaviour', () => {
  const Behaviour = ResetSectionSummary(
    ['addremovechildpartner'],
    'add-remove-dependant'
  )(BaseBehaviour);
  let behaviour;

  beforeEach(() => {
    baseSaveValues.mockReset();
    baseSaveValues.mockReturnValue('saved');
    behaviour = new Behaviour();
  });

  test('clears saved items when the answer changes to no', () => {
    const req = createRequest({
      decision: 'no',
      session: { addremovechildpartner: withItems(2) }
    });

    behaviour.saveValues(req, {}, jest.fn());

    expect(req.sessionModel.unset).toHaveBeenCalledWith('addremovechildpartner');
  });

  test('keeps saved items when the answer is yes', () => {
    const req = createRequest({
      decision: 'yes',
      session: { addremovechildpartner: withItems(2) }
    });

    behaviour.saveValues(req, {}, jest.fn());

    expect(req.sessionModel.unset).not.toHaveBeenCalled();
  });

  test('does nothing when the answer is no but there are no saved items', () => {
    const req = createRequest({
      decision: 'no',
      session: { addremovechildpartner: withItems(0) }
    });

    behaviour.saveValues(req, {}, jest.fn());

    expect(req.sessionModel.unset).not.toHaveBeenCalled();
  });

  test('does nothing when nothing has been saved for the section', () => {
    const req = createRequest({ decision: 'no' });

    behaviour.saveValues(req, {}, jest.fn());

    expect(req.sessionModel.unset).not.toHaveBeenCalled();
  });

  test.each([[[]], [undefined]])(
    'does nothing when no aggregate fields are configured (%p)',
    aggregateToFields => {
      const Empty = ResetSectionSummary(aggregateToFields, 'add-remove-dependant')(BaseBehaviour);
      const req = createRequest({
        decision: 'no',
        session: { addremovechildpartner: withItems(1) }
      });

      new Empty().saveValues(req, {}, jest.fn());

      expect(req.sessionModel.unset).not.toHaveBeenCalled();
    }
  );

  test('always delegates to the parent saveValues', () => {
    const req = createRequest({ decision: 'yes' });
    const res = {};
    const next = jest.fn();

    expect(behaviour.saveValues(req, res, next)).toBe('saved');
    expect(baseSaveValues).toHaveBeenCalledWith(req, res, next);
  });
});
