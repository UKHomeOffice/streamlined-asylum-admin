export const ConstantsLib = {
  MAX_JOURNEY_STEPS: 60,
  E2E_EMAIL: process.env.SAA_TEST_EMAIL ||
    process.env.SAS_HOF_EMAIL ||
    process.env.SKIP_EMAIL ||
    '',
} as const;