jest.mock('../../../utils/redis', () => ({
  get: jest.fn(),
  del: jest.fn()
}));

const redis = require('../../../utils/redis');
const tokenStore = require('../../../utils/check-token');

describe('check token utility', () => {
  beforeEach(() => {
    redis.get.mockReset();
    redis.del.mockReset();
  });

  test('should read the token and email values from redis', async () => {
    redis.get
      .mockResolvedValueOnce('token-id')
      .mockResolvedValueOnce('person@example.com');

    await expect(tokenStore.read('token-id')).resolves.toEqual({
      valid: 'token-id',
      email: 'person@example.com'
    });
    expect(redis.get).toHaveBeenCalledWith('token:token-id');
    expect(redis.get).toHaveBeenCalledWith('token-id:email');
  });

  test('should wrap redis read errors with token context', async () => {
    redis.get.mockRejectedValue(new Error('connection failed'));

    await expect(tokenStore.read('token-id')).rejects.toThrow(
      'Error reading token: connection failed'
    );
  });

  test('should delete the token and email values from redis', async () => {
    redis.del.mockResolvedValue(1);

    await tokenStore.delete('token-id');

    expect(redis.del).toHaveBeenCalledWith('token:token-id');
    expect(redis.del).toHaveBeenCalledWith('token-id:email');
  });

  test('should wrap redis delete errors with token context', async () => {
    redis.del.mockRejectedValue(new Error('delete failed'));

    await expect(tokenStore.delete('token-id')).rejects.toThrow(
      'Error deleting token: delete failed'
    );
  });
});
