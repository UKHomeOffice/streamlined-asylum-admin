jest.mock('node:crypto', () => ({
  randomUUID: jest.fn()
}));

jest.mock('../../../config', () => ({
  auth: {
    tokenExpiry: 1800
  },
  env: 'test'
}));

const mockLogger = {
  error: jest.fn()
};

jest.mock('hof/lib/logger', () => jest.fn(() => mockLogger));

jest.mock('../../../utils/redis', () => ({
  multi: jest.fn()
}));

const { randomUUID } = require('node:crypto');
const redis = require('../../../utils/redis');
const tokenGenerator = require('../../../utils/save-token');

describe('save token utility', () => {
  let multi;

  beforeEach(() => {
    multi = {
      set: jest.fn().mockReturnThis(),
      exec: jest.fn()
    };
    randomUUID.mockReturnValue('generated-token');
    redis.multi.mockReturnValue(multi);
    mockLogger.error.mockReset();
  });

  test('should save the token and email values with the configured expiry', async () => {
    multi.exec.mockResolvedValue([
      [null, 'OK'],
      [null, 'OK']
    ]);

    await expect(tokenGenerator.save('person@example.com')).resolves.toBe(
      'generated-token'
    );

    expect(multi.set).toHaveBeenCalledWith(
      'token:generated-token',
      'generated-token',
      'EX',
      1800
    );
    expect(multi.set).toHaveBeenCalledWith(
      'generated-token:email',
      'person@example.com',
      'EX',
      1800
    );
    expect(multi.exec).toHaveBeenCalledTimes(1);
  });

  test('should log and throw when redis reports a transaction error', async () => {
    multi.exec.mockResolvedValue([[new Error('write failed')]]);

    await expect(tokenGenerator.save('person@example.com')).rejects.toThrow(
      'Could not save verification token'
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error saving token to redis: write failed'
    );
  });
});
