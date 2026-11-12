export const ConstantsLib = {
  MAX_JOURNEY_STEPS: 60,
  E2E_EMAIL: process.env.SAA_TEST_EMAIL ||
    process.env.SAS_HOF_EMAIL ||
    process.env.SKIP_EMAIL ||
    '',
  VIOLENT_IMAGES_QUESTION: 'Does your evidence include violent or upsetting images?',
  VIOLENT_IMAGES_REQUIRED_ERROR: 'Select if the evidence contains violent or upsetting images',
  RAD_QUESTION: 'Do you need to tell us someone on your claim has died?',
  RAD_SUMMARY_LABEL: 'Someone on the claim has died',
  RAD_REQUIRED_ERROR: 'Tell us if someone on your claim has died',
} as const;