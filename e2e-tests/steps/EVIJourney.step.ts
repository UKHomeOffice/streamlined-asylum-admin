import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { BasePage } from '../pages/saa-base-page';
import { test, type Pages } from '../fixtures/fixtures';
import { E2E_EMAIL, EVIDENCE_PAGES, MAX_JOURNEY_STEPS, NO_OPTIONS_PAGE, VIOLENT_IMAGES_QUESTION } from '../utility-helper/constants-lib';

const { Given, When, Then } = createBdd(test);

const journeyPages = (pages: Pages): Record<string, BasePage> => ({
  Start: pages.startPage,
  'Before you start': pages.beforeYouStartPage,
  'Claimant details': pages.claimantDetailsPage,
  'Claim decision': pages.claimDecisionPage,
  'Email address': pages.emailAddressPage,
  'Form entry': pages.continueToFormPage,
  'Which form': pages.whichFormPage,
  'Information given': pages.informationGivenPage,
  'Claimant name': pages.claimantsNamePage,
  'Claimant main language': pages.claimantMainLanguagePage,
  'Person completing form': pages.personCompletingFormPage,
  'Who are you': pages.whoAreYouPage,
  'Personal details': pages.personalDetailsPage,
  Dependants: pages.dependantsPage,
  'Send evidence for your claim': pages.sendEvidencePage,
  'Prepare your evidence': pages.prepareYourEvidencePage,
  'Upload evidence to help your claim': pages.uploadSupportingEvidencePage,
  'Violent or upsetting images': pages.violentUpsettingImagesPage,
  'Evidence check your answers': pages.evidenceCheckYourAnswersPage,
  'Someone on my claim has died': pages.someoneOnClaimDiedPage,
  'Something else': pages.somethingElsePage,
  'Check your answers': pages.checkYourAnswersPage,
  'No options': pages.noOptionsPage,
});

const pageFor = (pages: Pages, name: string) => {
  const target = journeyPages(pages)[name];
  if (!target?.details) {
    throw new Error(`No page mapping defined for "${name}"`);
  }
  return target;
};

const continueUntil = async (pages: Pages, path: string) => {
  const mappedPages = journeyPages(pages);
  for (let step = 0; step < MAX_JOURNEY_STEPS; step++) {
    const currentPath = pages.basePage.currentPath;
    const currentPage = Object.values(mappedPages).find(page => page.details?.path === currentPath);
    if (currentPage) {
      await currentPage.assertOnPage();
    }
    if (currentPath === path || currentPath === NO_OPTIONS_PAGE.path) {
      return;
    }
    if (currentPath === EVIDENCE_PAGES['Send evidence for your claim'].path) {
      await pages.sendEvidencePage.answer('Yes');
    }
    if (currentPath === '/changes/personal-details') {
      await pages.personalDetailsPage.answer('No');
    }
    if (currentPath === '/changes/claimants-name') {
      await pages.claimantsNamePage.enterName('Test', 'User');
    }
    if (currentPath === '/changes/claimant-main-language') {
      await pages.claimantMainLanguagePage.selectLanguage('English');
    }
    if (currentPath === '/changes/person-completing-form') {
      await pages.personCompletingFormPage.answer('For me');
    }
    if (currentPath === '/changes/who-are-you') {
      await pages.whoAreYouPage.answerQuestion('I am the person claiming asylum', 'Who are you?');
    }
    if (currentPath === EVIDENCE_PAGES['Upload evidence to help your claim'].path) {
      await pages.uploadSupportingEvidencePage.uploadEvidenceForJourney();
    }
    if (currentPath === '/changes/do-you-need-add-remove-dependant') {
      await pages.dependantsPage.answer('No');
    }
    if (currentPath === EVIDENCE_PAGES['Violent or upsetting images'].path) {
      await pages.violentUpsettingImagesPage.answer('No');
    }
    if (currentPath === EVIDENCE_PAGES['Someone on my claim has died'].path) {
      await pages.someoneOnClaimDiedPage.answer('No');
    }
    if (currentPath === '/changes/something-else') {
      await pages.somethingElsePage.answer('No');
    }
    await pages.basePage.continueToNextPage();
  }
  throw new Error(`Did not reach ${path} within ${MAX_JOURNEY_STEPS} steps`);
};

const navigateTo = async (pages: Pages, name: string, emailAddress: string) => {
  const target = pageFor(pages, name);
  await pages.startPage.startJourney();
  await pages.beforeYouStartPage.continueToClaimantDetails();
  await pages.claimantDetailsPage.complete();
  await pages.claimDecisionPage.answer('No');
  await pages.claimDecisionPage.continueToNextPage();
  await pages.emailAddressPage.authenticate(emailAddress);
  await pages.continueToFormPage.enterForm();
  await continueUntil(pages, target.details!.path);
  await target.assertOnPage();
};

const continueToCheckYourAnswers = async (pages: Pages) => {
  await pages.basePage.continueToNextPage();
  await continueUntil(pages, EVIDENCE_PAGES['Check your answers'].path);
};

Given('I start the application journey', async ({ pages }) => {
  await pages.startPage.navigateTo('/');
  await pages.startPage.assertOnPage();
});

When('I complete the supporting evidence journey pertaining to {string}', async ({ pages }, scenario: string) => {
  switch (scenario.toLowerCase()) {
    case 't1: evidence submitted':
      await pages.sendEvidencePage.answer('Yes');
      await pages.sendEvidencePage.continueToNextPage();
      await pages.prepareYourEvidencePage.continueToNextPage();
      await pages.uploadSupportingEvidencePage.uploadEvidenceForJourney();
      await pages.uploadSupportingEvidencePage.continueToNextPage();
      await pages.violentUpsettingImagesPage.answer('No');
      await pages.violentUpsettingImagesPage.continueToNextPage();
      await pages.evidenceCheckYourAnswersPage.assertAnswer('Files uploaded', 'test-evidence.txt');
      await pages.evidenceCheckYourAnswersPage.assertAnswer('Violent or upsetting images', 'No', VIOLENT_IMAGES_QUESTION);
      await continueToCheckYourAnswers(pages);
      await pages.checkYourAnswersPage.assertAnswer('Do you need to send evidence to help your claim?', 'Yes');
      break;
    case 't2: no evidence required':
      await pages.sendEvidencePage.answer('No');
      await pages.sendEvidencePage.continueToNextPage();
      break;
    case 't3: no evidence or other request':
      await pages.sendEvidencePage.answer('No');
      await continueToCheckYourAnswers(pages);
      break;
    default:
      throw new Error(`Unknown supporting evidence journey: ${scenario}`);
  }
});

When('I click Start now', async ({ pages }) => {
  await pages.startPage.clickStartNow();
});

Then('I reach the {string} page', async ({ pages }, name: string) => {
  await pageFor(pages, name).assertOnPage();
});

When('I complete claimant details and continue', async ({ pages }) => {
  await pages.claimantDetailsPage.complete();
});

When('I request a secure link using the test email', async ({ pages }) => {
  await pages.emailAddressPage.authenticate(E2E_EMAIL);
});

When('I click Enter form', async ({ pages }) => {
  await pages.continueToFormPage.enterForm();
});

When('I enter claimant name and continue', async ({ pages }) => {
  await pages.claimantsNamePage.enterName('Test', 'User');
  await pages.claimantsNamePage.continueToNextPage();
});

When('I choose English as the claimant main language and continue', async ({ pages }) => {
  await pages.claimantMainLanguagePage.selectLanguage('English');
  await pages.claimantMainLanguagePage.continueToNextPage();
});

When('I select {string} and continue', async ({ pages }, answer: string) => {
  await pages.basePage.selectRadio(answer);
  await pages.basePage.continueToNextPage();
});

Given('I am on the {string} page', async ({ pages }, name: string) => {
  await navigateTo(pages, name, E2E_EMAIL);
});

Then('I am on the {string} page', async ({ pages }, name: string) => {
  await pageFor(pages, name).assertOnPage();
});

Then('I remain on the {string} page', async ({ pages }, name: string) => {
  await pageFor(pages, name).assertOnPage();
});

Then('the page content and layout match the design', async ({ pages }) => {
  const currentPath = pages.basePage.currentPath;
  if (currentPath === EVIDENCE_PAGES['Send evidence for your claim'].path) {
    await pages.sendEvidencePage.assertContentAndLayout();
  } else if (currentPath === EVIDENCE_PAGES['Prepare your evidence'].path) {
    await pages.prepareYourEvidencePage.assertContentAndLayout();
  } else if (currentPath === EVIDENCE_PAGES['Upload evidence to help your claim'].path) {
    await pages.uploadSupportingEvidencePage.assertContentAndLayout();
  } else if (currentPath === EVIDENCE_PAGES['Violent or upsetting images'].path) {
    await pages.violentUpsettingImagesPage.assertContentAndLayout();
  } else if (currentPath === EVIDENCE_PAGES['Evidence check your answers'].path) {
    await pages.evidenceCheckYourAnswersPage.assertContentAndLayout();
  } else {
    throw new Error(`No content and layout check is defined for ${currentPath}`);
  }
});

Then('a back link is available', async ({ pages }) => {
  await pages.basePage.assertBackLink();
});

Then(
  'the "Back to my applications" link is shown when I have more than one ongoing and active application',
  async ({ $test }) => {
    $test.fixme(true, 'No multiple-application journey or "Back to my applications" link exists in the service yet');
  }
);

Then('the feedback banner is displayed', async ({ pages }) => {
  await pages.basePage.assertFeedbackBanner();
});

Then('the GOV.UK header and footer are displayed', async ({ pages }) => {
  await pages.basePage.assertHeaderAndFooter();
});

When('I continue without answering {string}', async ({ pages }, question: string) => {
  await pages.basePage.continueWithoutAnswering(question);
});

Then('I see the error {string}', async ({ pages }, message: string) => {
  await pages.basePage.assertError(message);
});

When('I answer {string} to {string}', async ({ pages }, answer: string, question: string) => {
  await pages.basePage.answerQuestion(answer, question);
});

When('I continue', async ({ pages }) => {
  await pages.basePage.continueToNextPage();
});

When('I upload evidence and continue', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.uploadEvidenceForJourney();
  await pages.uploadSupportingEvidencePage.continueToNextPage();
});

Then('I bypass the evidence preparation and upload pages', async ({ pages }) => {
  await pages.prepareYourEvidencePage.assertNotOnPage();
  await pages.uploadSupportingEvidencePage.assertNotOnPage();
});

Then('I continue to the next section of my application', async ({ pages }) => {
  await pages.someoneOnClaimDiedPage.assertOnPage();
});

Then('I am told that I have not selected any options', async ({ pages }) => {
  await pages.noOptionsPage.assertOnPage();
});

When('I continue through the relevant pages', async ({ pages }) => {
  await continueToCheckYourAnswers(pages);
});

Then(
  'the {string} page shows {string} as {string}',
  async ({ pages }, name: string, question: string, answer: string) => {
    await pageFor(pages, name).assertOnPage();
    await pages.checkYourAnswersPage.assertAnswer(question, answer);
  }
);

Then('the upload supporting evidence page content and layout match the design', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.assertContentAndLayout();
});

When('I continue with invalid upload details', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.clickContinue();
});

Then('I see the upload supporting evidence validation error', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.assertError('Select a file');
});

When('I continue from the upload supporting evidence page', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.uploadEvidenceForJourney();
  await pages.uploadSupportingEvidencePage.continueToNextPage();
});

Then('I land on the evidence check your answers page', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertOnPage();
});

When('I upload a death certificate', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.uploadEvidenceAndReturnToUploadPage('death-certificate.txt');
});

When('I remove the uploaded death certificate', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.removeUploadedEvidence('death-certificate.txt');
});

Then('the death certificate is removed from the uploaded files', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.assertEvidenceIsNotUploaded('death-certificate.txt');
});

When('I upload the maximum of {int} files', async ({ pages }, count: number) => {
  for (let index = 1; index <= count; index++) {
    await pages.uploadSupportingEvidencePage.uploadEvidenceAndReturnToUploadPage(`evidence-${index}.txt`);
  }
  await pages.uploadSupportingEvidencePage.assertUploadedFileCount(count);
});

When('I attempt to upload another file', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.uploadEvidenceForJourney('evidence-over-limit.txt');
});

Then('I see the maximum files validation error', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.assertFileCountLimitError();
});

Given('I am editing my answers on the upload supporting evidence page', async ({ $test }) => {
  $test.fixme(true, 'The upload supporting evidence edit journey is not implemented yet');
});

When('I update my answer and continue', async ({ $test }) => {
  $test.fixme(true, 'The upload supporting evidence page does not expose an answer to update yet');
});

Then('my updated answer is shown on the "Check your answers" page', async ({ $test }) => {
  $test.fixme(true, 'The upload supporting evidence edit answer is not represented on check your answers yet');
});

Given('I am on the evidence check your answers page', async ({ pages }) => {
  await navigateTo(pages, 'Evidence check your answers', E2E_EMAIL);
});

Then('the evidence check your answers page content and layout match the design', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertContentAndLayout();
});

Then('both evidence answers have a Change link', async ({ pages }) => {
  await expect(pages.evidenceCheckYourAnswersPage.page.getByRole('link', { name: /^Change/ }))
    .toHaveCount(2);
});

Then('no Remove links are shown', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertNoRemoveLinks();
});

Given('I am on the evidence check your answers page with completed evidence answers', async ({ pages }) => {
  await navigateTo(pages, 'Evidence check your answers', E2E_EMAIL);
});

Then('my answers from the evidence journey are shown correctly', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertAnswer('Files uploaded', 'test-evidence.txt');
  await pages.evidenceCheckYourAnswersPage.assertAnswer('Violent or upsetting images', 'No', VIOLENT_IMAGES_QUESTION);
});

Given('I have changed answers in the evidence journey', async ({ pages }) => {
  await navigateTo(pages, 'Evidence check your answers', E2E_EMAIL);
  await pages.evidenceCheckYourAnswersPage.editAnswer(VIOLENT_IMAGES_QUESTION, 'No');
});

When('I review the evidence check your answers page', async ({ pages }) => {
  await pages.violentUpsettingImagesPage.answer('Yes');
  await pages.violentUpsettingImagesPage.continueToNextPage();
});

Then('my updated answers are shown', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertAnswer('Violent or upsetting images', 'Yes', VIOLENT_IMAGES_QUESTION);
});

Then('my original answers are not shown', async ({ pages }) => {
  await expect(pages.evidenceCheckYourAnswersPage.page.getByText('No', { exact: true })).toHaveCount(0);
});

When('I select the Change link for an evidence answer', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.editAnswer('Files uploaded', 'test-evidence.txt');
});

When('I select the add more evidence button', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.addMoreEvidence();
});

When('I select {string} to add more evidence', async ({ pages }, entryPoint: string) => {
  if (entryPoint === 'Change link') {
    await pages.evidenceCheckYourAnswersPage.editAnswer('Files uploaded', 'test-evidence.txt');
  } else if (entryPoint === 'Add more evidence') {
    await pages.evidenceCheckYourAnswersPage.addMoreEvidence();
  } else {
    throw new Error(`Unsupported evidence entry point: ${entryPoint}`);
  }
});

When('I answer the questions for additional evidence and continue', async ({ pages }) => {
  await pages.uploadSupportingEvidencePage.uploadEvidenceForJourney('additional-evidence.txt');
  await pages.uploadSupportingEvidencePage.continueToNextPage();
  await pages.violentUpsettingImagesPage.answer('No');
  await pages.violentUpsettingImagesPage.continueToNextPage();
});

Then('I return to the evidence check your answers page', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertOnPage();
});

Then('the additional evidence answer is shown in the summary', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertValueDisplayed('additional-evidence.txt');
});

When('I continue from the evidence check your answers page', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.continueFromSummary();
});

Then('I land on the someone on my claim has died page', async ({ pages }) => {
  await pages.someoneOnClaimDiedPage.assertOnPage();
});

Then('the violent or upsetting images page content and layout match the design', async ({ pages }) => {
  await pages.violentUpsettingImagesPage.assertContentAndLayout();
});

When('I continue without selecting an answer about violent or upsetting images', async ({ pages }) => {
  await pages.violentUpsettingImagesPage.continueWithoutSelectingAnswer();
});

Then('I see the violent or upsetting images validation error', async ({ pages }) => {
  await pages.violentUpsettingImagesPage.assertRequiredError();
});

Then('I remain on the violent or upsetting images page', async ({ pages }) => {
  await pages.violentUpsettingImagesPage.assertOnPage();
});

Given('I am editing my answer about violent or upsetting images', async ({ pages }) => {
  await navigateTo(pages, 'Evidence check your answers', E2E_EMAIL);
  await pages.evidenceCheckYourAnswersPage.editAnswer(VIOLENT_IMAGES_QUESTION, 'No');
});

Then('the evidence check your answers page shows the violent images answer {string}', async ({ pages }, answer: string) => {
  await pages.evidenceCheckYourAnswersPage.assertOnPage();
  await pages.evidenceCheckYourAnswersPage.assertAnswer('Violent or upsetting images', answer, VIOLENT_IMAGES_QUESTION);
});