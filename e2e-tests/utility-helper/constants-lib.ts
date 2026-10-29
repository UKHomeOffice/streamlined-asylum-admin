export const JOURNEY_START = '/';
export const MAX_JOURNEY_STEPS = 60;
export const E2E_EMAIL = process.env.SAA_TEST_EMAIL ||
  process.env.SKIP_EMAIL ||
  'sas-hof-test@digital.homeoffice.gov.uk';

export const AUTH_PAGES = {
  'Start': { path: '/', heading: 'Send information for your asylum claim' },
  'Before you start': { path: '/before-you-start', heading: 'What you need before you start' },
  'Claimant details': { path: '/claimant-details', heading: 'About the person who made the claim' },
  'Claim decision': { path: '/claim-decided', heading: 'Has there been a decision on the asylum claim?' },
  'Email address': { path: '/email-address', heading: 'What is your email address?' },
} as const;

export const EVI_JOURNEY_PAGES = {
  'Form entry': { path: '/changes/continue-to-form', heading: 'Continue to your form' },
  'Which form': { path: '/changes/which-form', heading: 'Which form do you need to continue?' },
  'Information given': { path: '/changes/information-given', heading: 'Information you have given us' },
  'Claimant name': { path: '/changes/claimants-name', heading: 'Claimant’s name' },
  'Claimant main language': { path: '/changes/claimant-main-language', heading: "Claimant's main language" },
  'Person completing form': {
    path: '/changes/person-completing-form',
    heading: 'Are you completing the form for you or someone else?',
  },
  'Who are you': { path: '/changes/who-are-you', heading: 'Who are you?' },
  'Personal details': { path: '/changes/personal-details', heading: 'Do you need to update personal details?' },
  Dependants: {
    path: '/changes/do-you-need-add-remove-dependant',
    heading: 'Do you need to add or remove a child or partner as a dependant?',
  },
  'Something else': { path: '/changes/something-else', heading: 'Do you need to do something else?' },
} as const;

export const NO_OPTIONS_PAGE = {
  path: '/changes/no-options',
  heading: 'You have not selected any options',
} as const;

export const EVIDENCE_PAGES = {
  'Send evidence for your claim': {
    path: '/changes/send-evidence-for-your-claim',
    heading: 'Do you need to send evidence to help your claim?',
  },
  'Prepare your evidence': {
    path: '/changes/prepare-your-evidence',
    heading: 'Prepare your evidence',
  },
  'Upload evidence to help your claim': {
    path: '/changes/upload-supporting-evidence',
    heading: 'Upload evidence to help your claim',
  },
  'Violent or upsetting images': {
    path: '/changes/violent-upsetting-images',
    heading: 'Violent or upsetting images',
  },
  'Evidence check your answers': {
    path: '/changes/check-your-answers-evidence',
    heading: 'Check your answers',
  },
  'Check your answers': {
    path: '/changes/confirm',
    heading: 'Check your answers',
  },
  'Someone on my claim has died': {
    path: '/changes/someone-on-claim-died',
    heading: 'Do you need to tell us someone on your claim has died?',
  },
} as const;

export const VIOLENT_IMAGES_QUESTION = 'Does your evidence include violent or upsetting images?';
export const VIOLENT_IMAGES_REQUIRED_ERROR = 'Select if the evidence contains violent or upsetting images';