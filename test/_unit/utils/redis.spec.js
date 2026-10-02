describe('redis utility', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test('should create a redis client using the configured connection details', () => {
    const Redis = jest.fn();

    jest.doMock('ioredis', () => Redis);
    jest.doMock('../../../config', () => ({
      redis: {
        port: '6380',
        host: 'redis.internal'
      }
    }));

    require('../../../utils/redis');

    expect(Redis).toHaveBeenCalledWith({
      port: '6380',
      host: 'redis.internal',
      connectionName: 'saa'
    });
  });
});
