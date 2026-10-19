'use strict';

const LimitAggregator = require('../../../../../apps/saa/behaviours/limit-aggregator');

class BaseBehaviour {
  locals() {
    return { existing: true };
  }
}

const Behaviour = LimitAggregator(BaseBehaviour);

const createRequest = aggregate => ({
  form: { options: { aggregateTo: 'addremovechildpartner', aggregateLimit: 2 } },
  sessionModel: { get: jest.fn(() => aggregate) }
});

const withItems = count => ({
  aggregatedValues: Array.from({ length: count }, (_, index) => ({ index }))
});

describe('limit aggregator behaviour', () => {
  test.each([
    [1, false],
    [2, true],
    [3, true]
  ])('with %i items, noMoreItems is %p', (count, noMoreItems) => {
    const locals = new Behaviour().locals(createRequest(withItems(count)), {});

    expect(locals).toEqual({ existing: true, noMoreItems, maxItems: 2 });
  });

  test('leaves locals unchanged when nothing has been saved', () => {
    const locals = new Behaviour().locals(createRequest(undefined), {});

    expect(locals).toEqual({ existing: true });
  });
});
