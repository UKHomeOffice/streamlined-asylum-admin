import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/fixtures';

const { Given, When, Then } = createBdd(test);

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