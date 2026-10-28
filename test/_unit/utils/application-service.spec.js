const mockRequest = jest.fn();
const mockLogger = { info: jest.fn(), error: jest.fn() };

jest.mock('../../../config', () => ({
  env: 'test',
  saveService: {
    protocol: 'https',
    host: 'data-service',
    port: '10443'
  }
}));

jest.mock('hof', () => ({
  model: jest.fn().mockImplementation(() => ({ _request: mockRequest }))
}));

jest.mock('hof/lib/logger', () => jest.fn(() => mockLogger));

const applicationService = require('../../../utils/application-service');

describe('application service', () => {
  const applicationsUrl = 'https://data-service:10443/applications';
  const emailHex = Buffer.from('person@example.com').toString('hex');

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findApplicationsByEmail', () => {
    test('should request applications using the hex-encoded normalised email', async () => {
      const records = [{ id: 1 }];
      mockRequest.mockResolvedValue({ data: records });

      const result = await applicationService.findApplicationsByEmail(
        ' Person@Example.com '
      );

      expect(mockRequest).toHaveBeenCalledWith({
        url: `${applicationsUrl}/email/${emailHex}`,
        method: 'GET'
      });
      expect(result).toEqual(records);
    });

    test('should return only draft applications', async () => {
      const draft = { id: 1, submitted_at: null };
      mockRequest.mockResolvedValue({
        data: [draft, { id: 2, submitted_at: '2026-10-01T10:00:00.000Z' }]
      });

      const result = await applicationService.findApplicationsByEmail('person@example.com');

      expect(result).toEqual([draft]);
    });

    test.each([undefined, null, '   ', 123])(
      'should reject a missing or invalid email %p without requesting',
      async email => {
        await expect(
          applicationService.findApplicationsByEmail(email)
        ).rejects.toThrow('Email address is required');
        expect(mockRequest).not.toHaveBeenCalled();
      }
    );

    test('should log error details without the URL or body and throw a status-only error', async () => {
      mockRequest.mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          response: { status: 503, data: { error: 'unavailable' } }
        })
      );

      await expect(
        applicationService.findApplicationsByEmail('person@example.com')
      ).rejects.toThrow('RDS API GET failed with status 503');
      expect(mockLogger.error).toHaveBeenCalledWith('RDS API error', {
        method: 'GET',
        message: 'Request failed',
        status: 503
      });
    });

    test('should log a direct error status when present', async () => {
      mockRequest.mockRejectedValue(
        Object.assign(new Error('Bad request'), {
          status: 400,
          body: 'invalid'
        })
      );

      await expect(
        applicationService.findApplicationsByEmail('person@example.com')
      ).rejects.toThrow('RDS API GET failed with status 400');
      expect(mockLogger.error).toHaveBeenCalledWith('RDS API error', {
        method: 'GET',
        message: 'Bad request',
        status: 400
      });
    });
  });

  describe('findApplicationsByUan', () => {
    test('should request applications using the normalised UAN', async () => {
      const records = [{ id: 1 }];
      mockRequest.mockResolvedValue({ data: records });

      const result = await applicationService.findApplicationsByUan(
        ' 1345-1233 1234-3456 '
      );

      expect(mockRequest).toHaveBeenCalledWith({
        url: `${applicationsUrl}/uan/1345123312343456`,
        method: 'GET'
      });
      expect(result).toEqual(records);
    });

    test('should return only draft applications', async () => {
      const draft = { id: 1 };
      mockRequest.mockResolvedValue({
        data: [draft, { id: 2, submitted_at: '2026-10-01T10:00:00.000Z' }]
      });

      const result = await applicationService.findApplicationsByUan('1345123312343456');

      expect(result).toEqual([draft]);
    });

    test('should keep unexpected characters within the UAN path segment', async () => {
      mockRequest.mockResolvedValue({ data: [] });

      await applicationService.findApplicationsByUan('12/../34?x=1');

      expect(mockRequest).toHaveBeenCalledWith({
        url: `${applicationsUrl}/uan/12%2F..%2F34%3Fx%3D1`,
        method: 'GET'
      });
    });

    test.each([undefined, null, '', ' - '])(
      'should reject a missing UAN %p without requesting',
      async uan => {
        await expect(
          applicationService.findApplicationsByUan(uan)
        ).rejects.toThrow('UAN is required');
        expect(mockRequest).not.toHaveBeenCalled();
      }
    );
  });

  describe('createApplication', () => {
    test('should create an application with normalised email and UAN and an empty session', async () => {
      const record = { id: 1 };
      mockRequest.mockResolvedValue({ data: [record] });

      const result = await applicationService.createApplication({
        email: ' Person@Example.com ',
        uan: '1234 5678-9012',
        dateOfBirth: '1990-01-31'
      });

      expect(mockRequest).toHaveBeenCalledWith({
        url: applicationsUrl,
        method: 'POST',
        data: {
          email: 'person@example.com',
          uan: '123456789012',
          date_of_birth: '1990-01-31',
          session: {}
        }
      });
      expect(result).toBe(record);
    });

    test('should create an application with the supplied session', async () => {
      mockRequest.mockResolvedValue({ data: [{ id: 1 }] });

      await applicationService.createApplication({
        email: 'person@example.com',
        uan: '123',
        dateOfBirth: '1990-01-31',
        session: { step: 'one' }
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ session: { step: 'one' } })
        })
      );
    });

    test.each([
      ['email', { uan: '123', dateOfBirth: '1990-01-31' }],
      ['blank email', { email: '  ', uan: '123', dateOfBirth: '1990-01-31' }],
      ['UAN', { email: 'person@example.com', dateOfBirth: '1990-01-31' }],
      [
        'separator-only UAN',
        { email: 'person@example.com', uan: ' - ', dateOfBirth: '1990-01-31' }
      ],
      ['date of birth', { email: 'person@example.com', uan: '123' }]
    ])(
      'should reject a missing %s without creating an application',
      async (field, details) => {
        await expect(
          applicationService.createApplication(details)
        ).rejects.toThrow('Missing required application details');
        expect(mockRequest).not.toHaveBeenCalled();
      }
    );
  });

  describe('saveApplication', () => {
    test('should update the application session', async () => {
      const record = { id: 7 };
      mockRequest.mockResolvedValue({ data: [record] });

      const result = await applicationService.saveApplication(7, {
        step: 'two'
      });

      expect(mockRequest).toHaveBeenCalledWith({
        url: `${applicationsUrl}/7`,
        method: 'PATCH',
        data: { session: { step: 'two' } }
      });
      expect(result).toBe(record);
    });

    test('should accept an id of 0', async () => {
      mockRequest.mockResolvedValue({ data: [{ id: 0 }] });

      await applicationService.saveApplication(0, { step: 'two' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: `${applicationsUrl}/0` })
      );
    });

    test('should keep unexpected characters within the id path segment', async () => {
      mockRequest.mockResolvedValue({ data: [{ id: 7 }] });

      await applicationService.saveApplication('7/../8', { step: 'two' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: `${applicationsUrl}/7%2F..%2F8` })
      );
    });

    test.each([undefined, null, ''])(
      'should reject a missing id %p without requesting',
      async id => {
        await expect(
          applicationService.saveApplication(id, { step: 'two' })
        ).rejects.toThrow('Application id is required');
        expect(mockRequest).not.toHaveBeenCalled();
      }
    );
  });

  describe('submitApplication', () => {
    test('should update the session with submission time and reference', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-28T10:00:00.000Z'));
      const record = { id: 7 };
      mockRequest.mockResolvedValue({ data: [record] });

      const result = await applicationService.submitApplication(
        7,
        { step: 'done' },
        'REF-123'
      );

      expect(mockRequest).toHaveBeenCalledWith({
        url: `${applicationsUrl}/7`,
        method: 'PATCH',
        data: {
          session: { step: 'done' },
          submitted_at: '2026-10-28T10:00:00.000Z',
          submission_reference: 'REF-123'
        }
      });
      expect(result).toBe(record);
    });

    test('should generate a UUID reference when none is supplied', async () => {
      mockRequest.mockResolvedValue({ data: [{ id: 7 }] });

      await applicationService.submitApplication(7, { step: 'done' });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            submission_reference: expect.stringMatching(
              /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
            )
          })
        })
      );
    });

    test.each([undefined, null, ''])(
      'should reject a missing id %p without requesting',
      async id => {
        await expect(
          applicationService.submitApplication(id, { step: 'done' })
        ).rejects.toThrow('Application id is required');
        expect(mockRequest).not.toHaveBeenCalled();
      }
    );
  });

  describe('findOrCreateApplication', () => {
    const details = {
      email: 'person@example.com',
      uan: '1234 5678-9012',
      dateOfBirth: '1990-01-31'
    };

    test('should return a record matching the normalised UAN and date of birth without creating one', async () => {
      const match = {
        id: 2,
        uan: '123456789012',
        date_of_birth: '1990-01-31'
      };
      mockRequest.mockResolvedValueOnce({
        data: [{ id: 1, uan: '999', date_of_birth: '1990-01-31' }, match]
      });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(match);
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Application lookup matched an existing record'
      );
    });

    test('should create a record when the UAN matches but the date of birth does not', async () => {
      const created = { id: 3 };
      const otherDob = {
        id: 1,
        uan: '123456789012',
        date_of_birth: '2000-01-01'
      };
      mockRequest
        .mockResolvedValueOnce({ data: [otherDob] })
        .mockResolvedValueOnce({ data: [otherDob] })
        .mockResolvedValueOnce({ data: [created] });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(created);
      expect(mockRequest).toHaveBeenLastCalledWith({
        url: applicationsUrl,
        method: 'POST',
        data: {
          email: 'person@example.com',
          uan: '123456789012',
          date_of_birth: '1990-01-31',
          session: {}
        }
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Application lookup found no match; creating a record'
      );
    });

    test('should create a record when the date of birth matches but the UAN does not', async () => {
      const created = { id: 5 };
      mockRequest
        .mockResolvedValueOnce({
          data: [{ id: 1, uan: '999999999999', date_of_birth: '1990-01-31' }]
        })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [created] });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(created);
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    test('should create a record when no records exist for the email', async () => {
      const created = { id: 4 };
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [created] });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(created);
      expect(mockRequest).toHaveBeenNthCalledWith(2, {
        url: `${applicationsUrl}/uan/123456789012`,
        method: 'GET'
      });
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    test('should throw without creating when the UAN and DOB match under another email', async () => {
      mockRequest.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({
        data: [{ id: 6, uan: '123456789012', date_of_birth: '1990-01-31' }]
      });

      await expect(
        applicationService.findOrCreateApplication(details)
      ).rejects.toBeInstanceOf(applicationService.ApplicationExistsError);
      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Application exists for this UAN and DOB under a different email'
      );
    });

    test('should create a new draft when the only matches have been submitted', async () => {
      const submitted = {
        id: 7,
        uan: '123456789012',
        date_of_birth: '1990-01-31',
        submitted_at: '2026-10-01T10:00:00.000Z'
      };
      const created = { id: 8 };
      mockRequest
        .mockResolvedValueOnce({ data: [submitted] })
        .mockResolvedValueOnce({ data: [submitted] })
        .mockResolvedValueOnce({ data: [created] });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(created);
      expect(mockRequest).toHaveBeenLastCalledWith(
        expect.objectContaining({ method: 'POST' })
      );
    });

    test('should not block a new draft when another email has only a submitted match', async () => {
      const created = { id: 9 };
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [{
            id: 6,
            uan: '123456789012',
            date_of_birth: '1990-01-31',
            submitted_at: '2026-10-01T10:00:00.000Z'
          }]
        })
        .mockResolvedValueOnce({ data: [created] });

      await expect(
        applicationService.findOrCreateApplication(details)
      ).resolves.toBe(created);
    });

    test('should not create a record when the UAN lookup fails', async () => {
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(
          Object.assign(new Error('Server error'), { status: 502 })
        );

      await expect(
        applicationService.findOrCreateApplication(details)
      ).rejects.toThrow('RDS API GET failed with status 502');
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    test('should not create a record when the email lookup fails', async () => {
      mockRequest.mockRejectedValue(
        Object.assign(new Error('Server error'), { status: 500 })
      );

      await expect(
        applicationService.findOrCreateApplication(details)
      ).rejects.toThrow('RDS API GET failed with status 500');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test.each([
      ['email', { ...details, email: undefined }],
      ['separator-only UAN', { ...details, uan: ' - ' }],
      ['date of birth', { ...details, dateOfBirth: undefined }]
    ])(
      'should reject a missing %s before any lookup',
      async (field, invalidDetails) => {
        await expect(
          applicationService.findOrCreateApplication(invalidDetails)
        ).rejects.toThrow('Missing required application details');
        expect(mockRequest).not.toHaveBeenCalled();
      }
    );
  });
});
