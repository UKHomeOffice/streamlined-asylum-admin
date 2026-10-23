import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/fixtures';
import { E2E_EMAIL, EVIDENCE_PAGES } from '../utility-helper/constants-lib';

const { Given, When, Then } = createBdd(test);

const ROUTES: Record<string, string> = {
  'Before you start': '/before-you-start',
  'Claimant details': '/claimant-details',
  'Claim decision': '/claim-decided',
  'Email address': '/email-address',
  'Form entry': '/changes/continue-to-form',
  'Which form': '/changes/which-form',
  'Information given': '/changes/information-given',
  'Claimant name': '/changes/claimants-name',
  'Claimant main language': '/changes/claimant-main-language',
  'Person completing form': '/changes/person-completing-form',
  'Who are you': '/changes/who-are-you',
  'Personal details': '/changes/personal-details',
  Dependants: '/changes/do-you-need-add-remove-dependant',
};

Given('I start the application journey', async ({ pages }) => {
  await pages.startPage.navigateTo('/');
  await pages.startPage.assertOnPage();
});

When('I click Start now', async ({ pages }) => {
  await pages.startPage.clickStartNow();
});

Then('I reach the {string} page', async ({ pages }, name: string) => {
  const path = ROUTES[name];
  if (!path) {
    throw new Error(`No route is defined for "${name}"`);
  }
  await expect(pages.basePage.page).toHaveURL(url => url.pathname === path);
});

When('I complete claimant details and continue', async ({ pages }) => {
  await pages.claimantDetailsPage.complete();
});

When('I request a secure link using the test email', async ({ pages }) => {
  await pages.emailAddressPage.authenticate(E2E_EMAIL);
});

When('I click Enter form', async ({ pages }) => {
  await pages.basePage.enterForm();
});

When('I enter claimant name and continue', async ({ pages }) => {
  await pages.basePage.page.getByLabel('Given name').fill('Test');
  await pages.basePage.page.getByLabel('Family name').fill('User');
  await pages.basePage.continueToNextPage();
});

When('I choose English as the claimant main language and continue', async ({ pages }) => {
  const language = pages.basePage.page.getByRole('combobox', { name: 'Main language' });
  await language.fill('English');
  await pages.basePage.page.getByRole('option', { name: 'English', exact: true }).click();
  await pages.basePage.continueToNextPage();
});

When('I select {string} and continue', async ({ pages }, answer: string) => {
  await pages.basePage.selectRadio(answer);
  await pages.basePage.continueToNextPage();
});

Given('I am on the {string} page', async ({ journey }, name: string) => {
  await journey.navigateTo(name, E2E_EMAIL);
});

Then('I am on the {string} page', async ({ journey }, name: string) => {
  await journey.pageFor(name).assertOnPage();
});

Then('I remain on the {string} page', async ({ journey }, name: string) => {
  await journey.pageFor(name).assertOnPage();
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

When('I continue through the relevant pages', async ({ journey }) => {
  await journey.continueToCheckYourAnswers();
});

Then(
  'the {string} page shows {string} as {string}',
  async ({ pages, journey }, name: string, question: string, answer: string) => {
    await journey.pageFor(name).assertOnPage();
    await pages.checkYourAnswersPage.assertAnswer(question, answer);
  }
);
