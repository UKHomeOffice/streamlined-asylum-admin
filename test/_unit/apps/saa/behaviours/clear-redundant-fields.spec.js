const ClearRedundantFields = require('../../../../../apps/saa/behaviours/clear-redundant-fields');

class BaseBehaviour {
  saveValues(req, res, callback) {
    callback();
  }
}

const Behaviour = ClearRedundantFields('change-your-date-of-birth',
  ['correct-date-of-birth', 'documents-new-dob'])(BaseBehaviour);

test('clears the own DOB date and evidence when the answer is no', () => {
  const req = {
    form: { values: { 'change-your-date-of-birth': 'no' } },
    sessionModel: { unset: jest.fn() }
  };
  const next = jest.fn();

  new Behaviour().saveValues(req, {}, next);

  expect(req.sessionModel.unset).toHaveBeenCalledWith([
    'correct-date-of-birth',
    'documents-new-dob'
  ]);
  expect(next).toHaveBeenCalledWith();
});

test('preserves the own DOB date and evidence when the answer is yes', () => {
  const req = {
    form: { values: { 'change-your-date-of-birth': 'yes' } },
    sessionModel: { unset: jest.fn() }
  };

  new Behaviour().saveValues(req, {}, jest.fn());

  expect(req.sessionModel.unset).not.toHaveBeenCalled();
});
