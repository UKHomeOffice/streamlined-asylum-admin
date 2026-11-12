import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test, type Pages } from '../fixtures/fixtures';
import { ConstantsLib as c } from '../utility-helper/constants-lib';

const { When, Then } = createBdd(test);

const reachSomethingElse = async (pages: Pages, withEvidence: boolean) => {
  await pages.sendEvidencePage.assertOnPage();
  await pages.sendEvidencePage.answer(withEvidence ? 'Yes' : 'No');
  await pages.sendEvidencePage.continueToNextPage();
  if (withEvidence) {
    await pages.prepareYourEvidencePage.assertOnPage();
    await pages.prepareYourEvidencePage.continueToNextPage();
    await pages.uploadSupportingEvidencePage.assertOnPage();
    await pages.uploadSupportingEvidencePage.uploadEvidenceForJourney();
    await pages.uploadSupportingEvidencePage.continueToNextPage();
    await pages.violentUpsettingImagesPage.assertOnPage();
    await pages.violentUpsettingImagesPage.answer('No');
    await pages.violentUpsettingImagesPage.continueToNextPage();
    await pages.evidenceCheckYourAnswersPage.assertOnPage();
    await pages.evidenceCheckYourAnswersPage.continueToNextPage();
  }
  await pages.radSomeoneOnClaimDiedPage.assertOnPage();
  await pages.radSomeoneOnClaimDiedPage.answer('No');
  await pages.radSomeoneOnClaimDiedPage.continueToNextPage();
  await pages.somethingElsePage.assertOnPage();
};

When('I reach something else without supporting evidence or reporting a death', async ({ pages }) => {
  await reachSomethingElse(pages, false);
});

When('I reach something else with supporting evidence and without reporting a death', async ({ pages }) => {
  await reachSomethingElse(pages, true);
});

When('I answer {string} to needing to do something else', async ({ pages }, answer: string) => {
  await pages.somethingElsePage.assertOnPage();
  await pages.somethingElsePage.answer(answer);
  await pages.somethingElsePage.continueToNextPage();
});

Then('I see the Home Office contact details {word} a Continue button', async ({ pages }, availability: string) => {
  const page = pages.basePage.page;
  await expect(page).toHaveURL(url => url.pathname === '/changes/contact-us-by-email');
  await expect(page.getByRole('heading', { level: 1, name: 'You should contact the Home Office a different way' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Email the Home Office about your claim' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'ahrocentralcommunicationshub@contactus.homeoffice.gov.uk' }))
    .toHaveAttribute('href', 'mailto:ahrocentralcommunicationshub@contactus.homeoffice.gov.uk');
  await expect(page.getByRole('link', { name: 'ARC enquiry form' })).toBeVisible();
  if (availability === 'with') {
    await expect(pages.basePage.continueButton).toBeVisible();
  } else if (availability === 'without') {
    await expect(pages.basePage.continueButton).toHaveCount(0);
  } else {
    throw new Error(`Unknown Continue button availability: ${availability}`);
  }
});

Then('the final answers show supporting evidence and no reported death', async ({ pages }) => {
  await pages.checkYourAnswersPage.assertOnPage();
  await pages.checkYourAnswersPage.assertAnswer('Do you need to send evidence to help your claim?', 'Yes');
  await pages.checkYourAnswersPage.assertAnswer(c.RAD_QUESTION, 'No', c.RAD_SUMMARY_LABEL);
});