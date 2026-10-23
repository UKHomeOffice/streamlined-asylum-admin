import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures/fixtures';
import { E2E_EMAIL, VIOLENT_IMAGES_QUESTION } from '../utility-helper/constants-lib';

const { Given, When, Then } = createBdd(test);

Given('I am on the evidence check your answers page', async ({ journey }) => {
  await journey.navigateTo('Evidence check your answers', E2E_EMAIL);
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

Given('I am on the evidence check your answers page with completed evidence answers', async ({ journey }) => {
  await journey.navigateTo('Evidence check your answers', E2E_EMAIL);
});

Then('my answers from the evidence journey are shown correctly', async ({ pages }) => {
  await pages.evidenceCheckYourAnswersPage.assertAnswer('Files uploaded', 'test-evidence.txt');
  await pages.evidenceCheckYourAnswersPage.assertAnswer('Violent or upsetting images', 'No', VIOLENT_IMAGES_QUESTION);
});

Given('I have changed answers in the evidence journey', async ({ journey, pages }) => {
  await journey.navigateTo('Evidence check your answers', E2E_EMAIL);
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