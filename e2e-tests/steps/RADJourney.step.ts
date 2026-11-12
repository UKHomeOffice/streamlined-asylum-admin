import { randomInt } from 'node:crypto';
import { createBdd } from 'playwright-bdd';
import { test, type Pages } from '../fixtures/fixtures';
import { ConstantsLib as c } from '../utility-helper/constants-lib';
import { continueUntil, pagePath } from './EVIJourney.step';

const { When, Then } = createBdd(test);

const deceased = {
  givenName: 'Test',
  familyName: 'Person',
  day: '27',
  month: '3',
  year: '1940',
  nationality: 'India',
  certificate: 'test-death-certificate.txt',
};

export const completeDeceasedDetails = async (pages: Pages, mainClaimant: string) => {
  await pages.radAboutWhoHasDiedPage.assertContentAndLayout();
  await pages.radAboutWhoHasDiedPage.continueToNextPage();
  await pages.radMainClaimantDiedPage.assertOnPage();
  await pages.radMainClaimantDiedPage.answer(mainClaimant);
  await pages.radMainClaimantDiedPage.continueToNextPage();
  await pages.radNamePersonWhoDiedPage.assertOnPage();
  await pages.radNamePersonWhoDiedPage.enterName(deceased.givenName, deceased.familyName);
  await pages.radNamePersonWhoDiedPage.continueToNextPage();
  await pages.radDateOfBirthPersonWhoDiedPage.assertOnPage();
  await pages.radDateOfBirthPersonWhoDiedPage.enterDateOfBirth(deceased.day, deceased.month, deceased.year);
  await pages.radDateOfBirthPersonWhoDiedPage.continueToNextPage();
  await pages.radNationalityPersonWhoDiedPage.assertOnPage();
  await pages.radNationalityPersonWhoDiedPage.selectNationality(deceased.nationality);
  await pages.radNationalityPersonWhoDiedPage.continueToNextPage();
  await pages.radUploadDeathCertificatePage.assertOnPage();
  await pages.radUploadDeathCertificatePage.uploadDeathCertificate(deceased.certificate);
  await pages.radUploadDeathCertificatePage.continueToNextPage();
};

export const completeReportDeath = async (pages: Pages, mainClaimant: string) => {
  await pages.sendEvidencePage.answer('No');
  await pages.sendEvidencePage.continueToNextPage();
  await pages.radSomeoneOnClaimDiedPage.assertOnPage();
  await pages.radSomeoneOnClaimDiedPage.answer('Yes');
  await pages.radSomeoneOnClaimDiedPage.continueToNextPage();
  await completeDeceasedDetails(pages, mainClaimant);
};

export const continueFromRadReview = async (pages: Pages) => {
  await pages.radCheckYourAnswersDeathPage.continueToNextPage();
  await pages.somethingElsePage.assertOnPage();
  await pages.somethingElsePage.answer('No');
  await pages.somethingElsePage.continueToNextPage();
};

When(/^I complete RAD claimant setup with a random date of birth between 01\/01\/1990 and 01\/01\/2015$/, async ({ pages }) => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const firstDay = Date.UTC(1990, 0, 1) / millisecondsPerDay;
  const lastDay = Date.UTC(2015, 0, 1) / millisecondsPerDay;
  const dateOfBirth = new Date(randomInt(firstDay, lastDay + 1) * millisecondsPerDay);
  const day = String(dateOfBirth.getUTCDate()).padStart(2, '0');
  const month = String(dateOfBirth.getUTCMonth() + 1).padStart(2, '0');
  const year = String(dateOfBirth.getUTCFullYear());
  await pages.beforeYouStartPage.continueToClaimantDetails();
  await pages.claimantDetailsPage.complete(day, month, year);
  await pages.claimDecisionPage.answer('No');
  await pages.claimDecisionPage.continueToNextPage();
  await pages.emailAddressPage.authenticate(c.E2E_EMAIL);
  await pages.continueToFormPage.enterForm();
  const applicationDateOfBirth = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(dateOfBirth);
  await continueUntil(pages, pagePath(pages.sendEvidencePage), applicationDateOfBirth);
  await pages.sendEvidencePage.assertOnPage();
});

When('I complete the report a death journey for {string}', async ({ pages }, mainClaimant: string) => {
  await completeReportDeath(pages, mainClaimant);
});

When('I enter their date of birth as {string} {string} {string}', async ({ pages }, day: string, month: string, year: string) => {
  await pages.radDateOfBirthPersonWhoDiedPage.enterDateOfBirth(day, month, year);
});

Then('the RAD check your answers page shows the reported death for {string}', async ({ pages }, mainClaimant: string) => {
  await pages.radCheckYourAnswersDeathPage.assertContentAndLayout();
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Did they make the claim?', mainClaimant);
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Their name', `${deceased.givenName} ${deceased.familyName}`);
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Their date of birth', '27 March 1940');
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Their country of nationality', deceased.nationality);
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Files uploaded', deceased.certificate);
});

When('I continue from the RAD review without another request', async ({ pages }) => {
  await continueFromRadReview(pages);
});

Then('the final RAD answers show that no supporting evidence was required', async ({ pages }) => {
  await pages.checkYourAnswersPage.assertAnswer('Do you need to send evidence to help your claim?', 'No');
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Their name', `${deceased.givenName} ${deceased.familyName}`);
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Files uploaded', deceased.certificate);
});