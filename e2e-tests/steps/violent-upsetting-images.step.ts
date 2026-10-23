import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/fixtures';
import { E2E_EMAIL, VIOLENT_IMAGES_QUESTION } from '../utility-helper/constants-lib';

const { Given, When, Then } = createBdd(test);

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

Given('I am editing my answer about violent or upsetting images', async ({ journey, pages }) => {
  await journey.navigateTo('Evidence check your answers', E2E_EMAIL);
  await pages.evidenceCheckYourAnswersPage.editAnswer(VIOLENT_IMAGES_QUESTION, 'No');
});

Then('the evidence check your answers page shows the violent images answer {string}', async ({ pages }, answer: string) => {
  await pages.evidenceCheckYourAnswersPage.assertOnPage();
  await pages.evidenceCheckYourAnswersPage.assertAnswer('Violent or upsetting images', answer, VIOLENT_IMAGES_QUESTION);
});