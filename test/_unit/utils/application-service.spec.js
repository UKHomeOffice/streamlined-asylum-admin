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

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findApplicationsByEmail', () => {
    test.each([
      [' Person@Example.com ', 'person%40example.com'],
      [' Person+Tag@Example.com ', 'person%2Btag%40example.com'],
      [' Person/Tag%@Example.com ', 'person%2Ftag%25%40example.com']
    ])(
      'should request applications using the URL-encoded normalised email: %s',
      async (email, encodedEmail) => {
        const records = [{ id: 1 }];
        mockRequest.mockResolvedValue({ data: records });

        const result = await applicationService.findApplicationsByEmail(email);

        expect(mockRequest).toHaveBeenCalledWith({
          url: `${applicationsUrl}/email/${encodedEmail}`,
          method: 'GET'
        });
        expect(result).toEqual(records);
      }
    );

    test('should return only draft applications', async () => {
      const draft = { id: 1, submitted_at: null };
      mockRequest.mockResolvedValue({
        data: [draft, { id: 2, submitted_at: '2026-10-01T10:00:00.000Z' }]
      });

      const result =
        await applicationService.findApplicationsByEmail('person@example.com');

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

    test('should log details without URL or body and throw with the upstream message', async () => {
      mockRequest.mockRejectedValue(
        Object.assign(new Error('Request failed'), {
          response: { status: 503, data: { error: 'unavailable' } }
        })
      );

      await expect(
        applicationService.findApplicationsByEmail('person@example.com')
      ).rejects.toThrow(
        new Error('RDS API GET failed with status 503: Request failed')
      );
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
      ).rejects.toThrow(
        new Error('RDS API GET failed with status 400: Bad request')
      );
      expect(mockLogger.error).toHaveBeenCalledWith('RDS API error', {
        method: 'GET',
        message: 'Bad request',
        status: 400
      });
    });
  });

  describe('findApplicationsByUan', () => {
    test('should request applications using the provided UAN', async () => {
      const records = [{ id: 1 }];
      mockRequest.mockResolvedValue({ data: records });

      const result =
        await applicationService.findApplicationsByUan('1345123312343456');

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

      const result =
        await applicationService.findApplicationsByUan('1345123312343456');

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

    test.each([undefined, null, ''])(
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
    test('should create an application with normalised email, the provided UAN and an empty session', async () => {
      const record = { id: 1 };
      mockRequest.mockResolvedValue({ data: [record] });

      const result = await applicationService.createApplication({
        email: ' Person@Example.com ',
        uan: '123456789012',
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

    test.each([undefined, null])(
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

    test.each([undefined, null])(
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
      uan: '123456789012',
      dateOfBirth: '1990-01-31'
    };

    test('should return a record matching the UAN and date of birth without creating one', async () => {
      const match = {
        id: 2,
        email: details.email,
        uan: '123456789012',
        date_of_birth: '1990-01-31'
      };
      mockRequest.mockResolvedValueOnce({
        data: [{ id: 1, uan: '999', date_of_birth: '1990-01-31' }, match]
      });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(match);
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledWith({
        url: `${applicationsUrl}/uan/${details.uan}`,
        method: 'GET'
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Application lookup matched an existing record'
      );
    });

    test('should return the matching normalised email among UAN and DOB candidates', async () => {
      const match = {
        id: 2,
        email: ' Person@Example.com ',
        uan: details.uan,
        date_of_birth: '1990-1-31'
      };
      mockRequest.mockResolvedValueOnce({
        data: [{ ...match, id: 1, email: 'other@example.com' }, match]
      });

      const result = await applicationService.findOrCreateApplication({
        ...details,
        email: ' PERSON@EXAMPLE.COM '
      });

      expect(result).toBe(match);
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test.each([undefined, null, ''])(
      'should ignore a record with a falsy UAN %p and create a draft',
      async uan => {
        const created = { id: 3 };
        mockRequest
          .mockResolvedValueOnce({
            data: [
              {
                id: 1,
                email: details.email,
                uan,
                date_of_birth: details.dateOfBirth
              }
            ]
          })
          .mockResolvedValueOnce({ data: [created] });

        await expect(
          applicationService.findOrCreateApplication(details)
        ).resolves.toBe(created);
        expect(mockRequest).toHaveBeenCalledTimes(2);
        expect(mockRequest).toHaveBeenLastCalledWith(
          expect.objectContaining({ method: 'POST' })
        );
      }
    );

    test('should match a stored Date object against a date string', async () => {
      const match = {
        id: 2,
        email: details.email,
        uan: details.uan,
        date_of_birth: new Date('1990-01-31T00:00:00.000Z')
      };
      mockRequest.mockResolvedValueOnce({ data: [match] });

      await expect(
        applicationService.findOrCreateApplication(details)
      ).resolves.toBe(match);
      expect(mockRequest).toHaveBeenCalledTimes(1);
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

    test('should store the supplied session when creating a record', async () => {
      const session = { 'claimant-date-of-birth': '1990-01-31' };
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [{ id: 10 }] });

      await applicationService.findOrCreateApplication({ ...details, session });

      expect(mockRequest).toHaveBeenLastCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: expect.objectContaining({ session })
        })
      );
    });

    test('should create a record when the date of birth matches but the UAN does not', async () => {
      const created = { id: 5 };
      mockRequest
        .mockResolvedValueOnce({
          data: [{ id: 1, uan: '999999999999', date_of_birth: '1990-01-31' }]
        })
        .mockResolvedValueOnce({ data: [created] });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(created);
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    test('should create a record when no drafts exist for the UAN', async () => {
      const created = { id: 4 };
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [created] });

      const result = await applicationService.findOrCreateApplication(details);

      expect(result).toBe(created);
      expect(mockRequest).toHaveBeenNthCalledWith(1, {
        url: `${applicationsUrl}/uan/123456789012`,
        method: 'GET'
      });
      expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    test('should throw without creating when the UAN and DOB match under another email', async () => {
      mockRequest.mockResolvedValueOnce({
        data: [
          {
            id: 6,
            email: 'other@example.com',
            uan: '123456789012',
            date_of_birth: '1990-01-31'
          }
        ]
      });

      await expect(
        applicationService.findOrCreateApplication(details)
      ).rejects.toBeInstanceOf(applicationService.ApplicationExistsError);
      expect(mockRequest).toHaveBeenCalledTimes(1);
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
        .mockResolvedValueOnce({
          data: [
            {
              id: 6,
              email: 'other@example.com',
              uan: '123456789012',
              date_of_birth: '1990-01-31',
              submitted_at: '2026-10-01T10:00:00.000Z'
            }
          ]
        })
        .mockResolvedValueOnce({ data: [created] });

      await expect(
        applicationService.findOrCreateApplication(details)
      ).resolves.toBe(created);
    });

    test('should recover a matching draft created concurrently under the same normalised email', async () => {
      const record = {
        id: 10,
        email: ' Person@Example.com ',
        uan: details.uan,
        date_of_birth: '1990-1-31'
      };
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(
          Object.assign(new Error('Conflict'), { status: 409 })
        )
        .mockResolvedValueOnce({ data: [record] });

      await expect(
        applicationService.findOrCreateApplication(details)
      ).resolves.toBe(record);
      expect(mockRequest).toHaveBeenCalledTimes(3);
      expect(mockRequest).toHaveBeenLastCalledWith({
        url: `${applicationsUrl}/uan/${details.uan}`,
        method: 'GET'
      });
    });

    test('should reject a matching draft created concurrently under a different email', async () => {
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(
          Object.assign(new Error('Conflict'), { status: 409 })
        )
        .mockResolvedValueOnce({
          data: [
            {
              id: 10,
              email: 'other@example.com',
              uan: details.uan,
              date_of_birth: details.dateOfBirth
            }
          ]
        });

      await expect(
        applicationService.findOrCreateApplication(details)
      ).rejects.toBeInstanceOf(applicationService.ApplicationExistsError);
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    test.each([
      ['no draft', []],
      ['a different UAN', [{ uan: '999', date_of_birth: details.dateOfBirth }]],
      [
        'a different date of birth',
        [{ uan: details.uan, date_of_birth: '2000-01-01' }]
      ],
      [
        'a submitted match',
        [
          {
            uan: details.uan,
            date_of_birth: details.dateOfBirth,
            submitted_at: '2026-10-01T10:00:00.000Z'
          }
        ]
      ]
    ])(
      'should preserve the create error when recovery finds %s',
      async (description, records) => {
        mockRequest
          .mockResolvedValueOnce({ data: [] })
          .mockRejectedValueOnce(
            Object.assign(new Error('Unavailable'), { status: 503 })
          )
          .mockResolvedValueOnce({ data: records });

        await expect(
          applicationService.findOrCreateApplication(details)
        ).rejects.toThrow('RDS API POST failed with status 503');
        expect(mockRequest).toHaveBeenCalledTimes(3);
      }
    );

    test('should propagate a failed recovery lookup without retrying creation', async () => {
      mockRequest
        .mockResolvedValueOnce({ data: [] })
        .mockRejectedValueOnce(
          Object.assign(new Error('Conflict'), { status: 409 })
        )
        .mockRejectedValueOnce(
          Object.assign(new Error('Unavailable'), { status: 503 })
        );

      await expect(
        applicationService.findOrCreateApplication(details)
      ).rejects.toThrow('RDS API GET failed with status 503');
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    test('should not create a record when the UAN lookup fails', async () => {
      mockRequest.mockRejectedValueOnce(
        Object.assign(new Error('Server error'), { status: 502 })
      );

      await expect(
        applicationService.findOrCreateApplication(details)
      ).rejects.toThrow('RDS API GET failed with status 502');
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });

    test.each(
      ['email', 'uan', 'dateOfBirth'].flatMap(field =>
        [undefined, null, ''].map(value => [field, value])
      )
    )(
      'should reject a falsy %s value %p before any lookup',
      async (field, value) => {
        await expect(
          applicationService.findOrCreateApplication({
            ...details,
            [field]: value
          })
        ).rejects.toThrow('Missing required application details');
        expect(mockRequest).not.toHaveBeenCalled();
      }
    );
  });
});
