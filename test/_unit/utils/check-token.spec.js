jest.mock('../../../utils/redis', () => ({
  get: jest.fn(),
  getdel: jest.fn()
}));

const redis = require('../../../utils/redis');
const tokenStore = require('../../../utils/check-token');

describe('check token utility', () => {
  beforeEach(() => {
    redis.get.mockReset();
    redis.getdel.mockReset();
  });

  test('should read token availability without consuming it', async () => {
    redis.get
      .mockResolvedValueOnce('token-id')
      .mockResolvedValueOnce('person@example.com');

    await expect(tokenStore.read('token-id')).resolves.toEqual({
      valid: 'token-id',
      email: 'person@example.com'
    });
    expect(redis.get).toHaveBeenCalledWith('token:token-id');
    expect(redis.get).toHaveBeenCalledWith('token-id:email');
    expect(redis.getdel).not.toHaveBeenCalled();
  });

  test('should return missing values when reading an expired token', async () => {
    redis.get.mockResolvedValue(null);

    await expect(tokenStore.read('token-id')).resolves.toEqual({
      valid: null,
      email: null
    });
  });

  test('should wrap Redis read errors', async () => {
    redis.get.mockRejectedValue(new Error('connection failed'));

    await expect(tokenStore.read('token-id')).rejects.toThrow(
      'Error reading token: connection failed'
    );
  });

  test('should claim the token before consuming its email using GETDEL', async () => {
    redis.getdel
      .mockResolvedValueOnce('token-id')
      .mockResolvedValueOnce('person@example.com');

    await expect(tokenStore.consume('token-id')).resolves.toEqual({
      valid: 'token-id',
      email: 'person@example.com'
    });
    expect(redis.getdel).toHaveBeenNthCalledWith(1, 'token:token-id');
    expect(redis.getdel).toHaveBeenNthCalledWith(2, 'token-id:email');
    expect(redis.getdel).toHaveBeenCalledTimes(2);
  });

  test('should return null values when the token is unavailable', async () => {
    redis.getdel.mockResolvedValue(null);

    await expect(tokenStore.consume('token-id')).resolves.toEqual({
      valid: null,
      email: null
    });
    expect(redis.getdel).toHaveBeenCalledTimes(1);
  });

  test('should wrap Redis consumption errors with token context', async () => {
    redis.getdel.mockRejectedValue(new Error('connection failed'));

    await expect(tokenStore.consume('token-id')).rejects.toThrow(
      'Error consuming token: connection failed'
    );
  });

  test('should reject a claimed token when its email is missing', async () => {
    redis.getdel.mockResolvedValueOnce('token-id').mockResolvedValueOnce(null);

    await expect(tokenStore.consume('token-id')).resolves.toEqual({
      valid: null,
      email: null
    });
  });

  test('should wrap email consumption failures after claiming the token', async () => {
    redis.getdel
      .mockResolvedValueOnce('token-id')
      .mockRejectedValueOnce(new Error('email lookup failed'));

    await expect(tokenStore.consume('token-id')).rejects.toThrow(
      'Error consuming token: email lookup failed'
    );
  });

  test('should allow only one concurrent consumer and reject a subsequent replay', async () => {
    const values = new Map([
      ['token:token-id', 'token-id'],
      ['token-id:email', 'person@example.com']
    ]);
    redis.getdel.mockImplementation(async key => {
      const value = values.get(key) || null;
      values.delete(key);
      return value;
    });

    const results = await Promise.all([
      tokenStore.consume('token-id'),
      tokenStore.consume('token-id')
    ]);

    expect(results).toEqual(
      expect.arrayContaining([
        { valid: 'token-id', email: 'person@example.com' },
        { valid: null, email: null }
      ])
    );
    expect(
      redis.getdel.mock.calls.filter(([key]) => key === 'token-id:email')
    ).toHaveLength(1);
    await expect(tokenStore.consume('token-id')).resolves.toEqual({
      valid: null,
      email: null
    });
  });
});
