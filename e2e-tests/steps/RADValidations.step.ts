import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createBdd, type DataTable } from 'playwright-bdd';
import { test, type Pages } from '../fixtures/fixtures';
import { ConstantsLib as c } from '../utility-helper/constants-lib';
import { completeDeceasedDetails } from './RADJourney.step';

const { Given, When, Then, Before } = createBdd(test);

Before({ tags: '@rad-validation-journeys' }, async ({ $test }) => {
  $test.setTimeout(90_000);
});

const radNames: Record<string, { givenName: string; familyName: string }> = {
  'Test Person': { givenName: 'Test', familyName: 'Person' },
  'Updated Name': { givenName: 'Updated', familyName: 'Name' },
};

const radPageFor = (pages: Pages, name: string) => {
  switch (name) {
    case 'Someone on my claim has died': return pages.radSomeoneOnClaimDiedPage;
    case 'About who has died': return pages.radAboutWhoHasDiedPage;
    case 'Did they make the claim?': return pages.radMainClaimantDiedPage;
    case 'Their name': return pages.radNamePersonWhoDiedPage;
    case 'Their date of birth': return pages.radDateOfBirthPersonWhoDiedPage;
    case 'Their country of nationality': return pages.radNationalityPersonWhoDiedPage;
    case 'Upload the death certificate': return pages.radUploadDeathCertificatePage;
    case 'RAD check your answers': return pages.radCheckYourAnswersDeathPage;
    default: throw new Error(`No RAD page mapping defined for "${name}"`);
  }
};

const reachReportADeath = async (pages: Pages, withSupportingEvidence = false) => {
  await pages.sendEvidencePage.assertOnPage();
  await pages.sendEvidencePage.answer(withSupportingEvidence ? 'Yes' : 'No');
  await pages.sendEvidencePage.continueToNextPage();
  if (withSupportingEvidence) {
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
};

Given('I am on the RAD {string} page', async ({ pages }, name: string) => {
  const target = radPageFor(pages, name);
  await reachReportADeath(pages);
  if (name !== 'Someone on my claim has died') {
    await pages.radSomeoneOnClaimDiedPage.answer('Yes');
    await pages.radSomeoneOnClaimDiedPage.continueToNextPage();
    await pages.radAboutWhoHasDiedPage.assertOnPage();
    if (name === 'About who has died') return;
    await pages.radAboutWhoHasDiedPage.continueToNextPage();
    await pages.radMainClaimantDiedPage.assertOnPage();
    if (name === 'Did they make the claim?') return;
    await pages.radMainClaimantDiedPage.answer('No');
    await pages.radMainClaimantDiedPage.continueToNextPage();
    await pages.radNamePersonWhoDiedPage.assertOnPage();
    if (name === 'Their name') return;
    await pages.radNamePersonWhoDiedPage.enterName('Test', 'Person');
    await pages.radNamePersonWhoDiedPage.continueToNextPage();
    await pages.radDateOfBirthPersonWhoDiedPage.assertOnPage();
    if (['Their country of nationality', 'Upload the death certificate', 'RAD check your answers'].includes(name)) {
      await pages.radDateOfBirthPersonWhoDiedPage.enterDateOfBirth('27', '3', '1940');
      await pages.radDateOfBirthPersonWhoDiedPage.continueToNextPage();
    }
    if (name === 'Upload the death certificate' || name === 'RAD check your answers') {
      await pages.radNationalityPersonWhoDiedPage.assertOnPage();
      await pages.radNationalityPersonWhoDiedPage.selectNationality('India');
      await pages.radNationalityPersonWhoDiedPage.continueToNextPage();
    }
    if (name === 'RAD check your answers') {
      await pages.radUploadDeathCertificatePage.assertOnPage();
      await pages.radUploadDeathCertificatePage.uploadDeathCertificate('test-death-certificate.txt');
      await pages.radUploadDeathCertificatePage.continueToNextPage();
    }
  }
  await target.assertOnPage();
});

Then('I am on the RAD {string} page', async ({ pages }, name: string) => {
  await radPageFor(pages, name).assertOnPage();
  if (name === 'RAD check your answers') {
    await pages.radCheckYourAnswersDeathPage.assertAnswer('Files uploaded', 'test-death-certificate.txt');
  }
});

Then('I remain on the RAD {string} page', async ({ pages }, name: string) => {
  await radPageFor(pages, name).assertOnPage();
});

When('I check the following RAD name validation rules', async ({ pages }, table: DataTable) => {
  for (const row of table.hashes()) {
    const givenName = row['given name'] === '256 characters' ? 'A'.repeat(256) : row['given name'];
    const familyName = row['family name'] === '256 characters' ? 'A'.repeat(256) : row['family name'];
    await pages.radNamePersonWhoDiedPage.enterName(givenName, familyName);
    await pages.radNamePersonWhoDiedPage.clickContinue();
    await pages.radNamePersonWhoDiedPage.assertError(row.error);
    await pages.radNamePersonWhoDiedPage.assertOnPage();
  }
});

When('I go back to the RAD {string} page', async ({ pages }, name: string) => {
  await pages.basePage.backLink.click();
  await radPageFor(pages, name).assertOnPage();
});

const assertRadContentAndLayout = async (pages: Pages) => {
  const currentPath = pages.basePage.currentPath;
  if (currentPath === pages.radSomeoneOnClaimDiedPage.details?.path) {
    await pages.radSomeoneOnClaimDiedPage.assertContentAndLayout();
  } else if (currentPath === pages.radAboutWhoHasDiedPage.details?.path ||
    currentPath === `${pages.radAboutWhoHasDiedPage.details?.path}/edit`) {
    await pages.radAboutWhoHasDiedPage.assertContentAndLayout();
  } else if (currentPath === pages.radMainClaimantDiedPage.details?.path) {
    await pages.radMainClaimantDiedPage.assertContentAndLayout();
  } else if (currentPath === pages.radNamePersonWhoDiedPage.details?.path) {
    await pages.radNamePersonWhoDiedPage.assertContentAndLayout();
  } else if (currentPath === pages.radDateOfBirthPersonWhoDiedPage.details?.path) {
    await pages.radDateOfBirthPersonWhoDiedPage.assertContentAndLayout();
  } else if (currentPath === pages.radNationalityPersonWhoDiedPage.details?.path) {
    await pages.radNationalityPersonWhoDiedPage.assertContentAndLayout();
  } else if (currentPath === pages.radUploadDeathCertificatePage.details?.path) {
    await pages.radUploadDeathCertificatePage.assertContentAndLayout();
  } else if (currentPath === pages.radCheckYourAnswersDeathPage.details?.path) {
    await pages.radCheckYourAnswersDeathPage.assertContentAndLayout();
  } else {
    throw new Error(`No RAD content and layout check is defined for ${currentPath}`);
  }
};

Then('the RAD page content and layout match the design', async ({ pages }) => {
  await assertRadContentAndLayout(pages);
});

const enterValidRadDetails = async (pages: Pages, name: string, answer: string) => {
  switch (name) {
    case 'Someone on my claim has died':
      await pages.radSomeoneOnClaimDiedPage.answer(answer);
      break;
    case 'Did they make the claim?':
      await pages.radMainClaimantDiedPage.answer(answer);
      break;
    case 'Their name':
      await pages.radNamePersonWhoDiedPage.enterName(
        answer === '255-character names' ? 'A'.repeat(255) : 'Test',
        answer === '255-character names' ? 'B'.repeat(255) : 'Person'
      );
      break;
    case 'Their date of birth':
      await pages.radDateOfBirthPersonWhoDiedPage.enterDateOfBirth('27', '3', '1940');
      break;
    case 'Their country of nationality':
      await pages.radNationalityPersonWhoDiedPage.selectNationality('India');
      break;
    case 'Upload the death certificate':
      await pages.radUploadDeathCertificatePage.uploadDeathCertificate('test-death-certificate.txt');
      break;
    case 'RAD check your answers':
      await pages.radCheckYourAnswersDeathPage.assertOnPage();
      break;
    default: throw new Error(`No valid RAD details defined for "${name}"`);
  }
};

When('I enter valid details on the RAD {string} page with answer {string}', async ({ pages }, name: string, answer: string) => {
  await enterValidRadDetails(pages, name, answer);
});

const assertRadStandardChecks = async (pages: Pages) => {
  await assertRadContentAndLayout(pages);
  await pages.basePage.assertFeedbackBanner();
  await pages.basePage.assertHeaderAndFooter();
  await pages.basePage.assertBackLink();
};

Then('the current RAD page has standard content and navigation', async ({ pages }) => {
  await assertRadStandardChecks(pages);
});

When('I validate required answers and navigation through these RAD pages', async ({ pages }, table: DataTable) => {
  for (const row of table.hashes()) {
    const currentPage = radPageFor(pages, row.page);
    await currentPage.assertOnPage();
    await assertRadStandardChecks(pages);
    await currentPage.clickContinue();
    await currentPage.assertError(row.error);
    if (row['additional error']) await currentPage.assertError(row['additional error']);
    await currentPage.assertOnPage();
    if (row.page === 'Someone on my claim has died') {
      await pages.radSomeoneOnClaimDiedPage.answer('No');
      await pages.radSomeoneOnClaimDiedPage.continueToNextPage();
      await pages.somethingElsePage.assertOnPage();
      await pages.basePage.backLink.click();
      await currentPage.assertOnPage();
    } else if (row.page === 'Did they make the claim?') {
      await pages.radMainClaimantDiedPage.answer('Yes');
      await pages.radMainClaimantDiedPage.continueToNextPage();
      await pages.radNamePersonWhoDiedPage.assertOnPage();
      await pages.basePage.backLink.click();
      await currentPage.assertOnPage();
    }
    await enterValidRadDetails(pages, row.page, row.answer);
    await currentPage.continueToNextPage();
    if (row.page === 'Someone on my claim has died') {
      await pages.radAboutWhoHasDiedPage.assertContentAndLayout();
      await pages.radAboutWhoHasDiedPage.continueToNextPage();
    }
    await radPageFor(pages, row['next page']).assertOnPage();
  }
});

Then('the RAD summary shows the recorded person and no Remove link', async ({ pages }) => {
  await pages.radCheckYourAnswersDeathPage.assertOnPage();
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Did they make the claim?', 'No, they are a husband, wife, partner or child on the claim');
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Their name', 'Test Person');
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Their date of birth', '27 March 1940');
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Their country of nationality', 'India');
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Files uploaded', 'test-death-certificate.txt');
  await expect(pages.radCheckYourAnswersDeathPage.page.getByRole('link', { name: /^Remove/ })).toHaveCount(0);
});

const completeRemainingRadEdit = async (pages: Pages) => {
  const remainingPages = [
    pages.radNamePersonWhoDiedPage,
    pages.radDateOfBirthPersonWhoDiedPage,
    pages.radNationalityPersonWhoDiedPage,
    pages.radUploadDeathCertificatePage,
  ];
  const currentPath = pages.basePage.currentPath;
  if (currentPath !== pages.radCheckYourAnswersDeathPage.details?.path) {
    const startIndex = remainingPages.findIndex(page =>
      currentPath === page.details?.path || currentPath === `${page.details?.path}/edit`
    );
    if (startIndex === -1) throw new Error(`Unexpected RAD edit page: ${currentPath}`);
    for (const page of remainingPages.slice(startIndex)) {
      await page.assertOnPage();
      await page.continueToNextPage();
    }
  }
  await pages.radCheckYourAnswersDeathPage.assertOnPage();
};

When('I tell the service someone else has died and complete their details', async ({ pages }) => {
  await pages.radCheckYourAnswersDeathPage.page.getByRole('link', { name: 'Tell us someone else has died', exact: true }).click();
  await pages.radMainClaimantDiedPage.assertOnPage();
  await pages.radMainClaimantDiedPage.answer('Yes');
  await pages.radMainClaimantDiedPage.continueToNextPage();
  await pages.radNamePersonWhoDiedPage.assertOnPage();
  await pages.radNamePersonWhoDiedPage.enterName('Second', 'Person');
  await pages.radNamePersonWhoDiedPage.continueToNextPage();
  await pages.radDateOfBirthPersonWhoDiedPage.assertOnPage();
  await pages.radDateOfBirthPersonWhoDiedPage.enterDateOfBirth('22', '4', '1950');
  await pages.radDateOfBirthPersonWhoDiedPage.continueToNextPage();
  await pages.radNationalityPersonWhoDiedPage.assertOnPage();
  await pages.radNationalityPersonWhoDiedPage.selectNationality('France');
  await pages.radNationalityPersonWhoDiedPage.continueToNextPage();
  await pages.radUploadDeathCertificatePage.assertOnPage();
  await pages.radUploadDeathCertificatePage.uploadDeathCertificate('second-death-certificate.txt');
  await pages.radUploadDeathCertificatePage.continueToNextPage();
  await pages.radCheckYourAnswersDeathPage.assertOnPage();
});

Then('the RAD summary shows the updated and additional people with Remove links and no original name', async ({ pages }) => {
  await pages.radCheckYourAnswersDeathPage.assertContentAndLayout();
  const people = [
    { name: 'Updated Name', claimant: 'No, they are a husband, wife, partner or child on the claim', birth: '27 March 1940', nationality: 'France', certificate: 'test-death-certificate.txt' },
    { name: 'Second Person', claimant: 'Yes', birth: '22 April 1950', nationality: 'France', certificate: 'second-death-certificate.txt' },
  ];
  const removeLinks = pages.radCheckYourAnswersDeathPage.page.getByRole('link', { name: 'Remove Tell us about the person who died', exact: true });
  await expect(removeLinks).toHaveCount(people.length);
  for (let index = 0; index < people.length; index++) {
    const person = people[index];
    await expect(removeLinks.nth(index)).toBeVisible();
    await pages.radCheckYourAnswersDeathPage.assertAnswer('Their name', person.name, person.name);
    await pages.radCheckYourAnswersDeathPage.assertAnswer('Did they make the claim?', person.claimant, person.name);
    await pages.radCheckYourAnswersDeathPage.assertAnswer('Their date of birth', person.birth, person.name);
    await pages.radCheckYourAnswersDeathPage.assertAnswer('Their country of nationality', person.nationality, person.name);
    await pages.radCheckYourAnswersDeathPage.assertAnswer('Files uploaded', person.certificate, person.name);
  }
  await expect(pages.radCheckYourAnswersDeathPage.page.getByText('Test Person', { exact: true })).toHaveCount(0);
});

Then('the RAD summary has no automated WCAG 2.2 AA accessibility violations', async ({ pages }) => {
  await pages.radCheckYourAnswersDeathPage.assertOnPage();
  const results = await new AxeBuilder({ page: pages.radCheckYourAnswersDeathPage.page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const violations = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    targets: violation.nodes.map(node => node.target),
  }));
  expect(violations).toEqual([]);
});

When('I upload RAD certificate {string}', async ({ pages }, fileName: string) => {
  await pages.radUploadDeathCertificatePage.uploadDeathCertificate(fileName);
  await pages.radUploadDeathCertificatePage.assertOnPage();
  await expect(pages.radUploadDeathCertificatePage.page.getByRole('link', { name: `Remove ${fileName}`, exact: true })).toBeVisible();
});

When('I remove RAD certificate {string}', async ({ pages }, fileName: string) => {
  await pages.radUploadDeathCertificatePage.page.getByRole('link', { name: `Remove ${fileName}`, exact: true }).click();
  await pages.radUploadDeathCertificatePage.assertOnPage();
});

Then('the RAD upload page lists certificate {string} but not {string}', async ({ pages }, current: string, removed: string) => {
  const page = pages.radUploadDeathCertificatePage.page;
  await expect(page.locator('#uploaded-documents')).toContainText(current);
  await expect(page.getByRole('link', { name: `Remove ${current}`, exact: true })).toBeVisible();
  await expect(page.getByText(removed, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: `Remove ${removed}`, exact: true })).toHaveCount(0);
});

Then('the RAD check your answers page lists certificate {string} but not {string}', async ({ pages }, current: string, removed: string) => {
  await pages.radCheckYourAnswersDeathPage.assertOnPage();
  await pages.radCheckYourAnswersDeathPage.assertAnswer('Files uploaded', current);
  const files = pages.radCheckYourAnswersDeathPage.page.getByRole('term').filter({ hasText: 'Files uploaded' }).locator('..');
  await expect(files).not.toContainText(removed);
});

When('I upload {int} additional RAD certificates', async ({ pages }, count: number) => {
  for (let index = 1; index <= count; index++) {
    const fileName = `death-certificate-${index}.txt`;
    await pages.radUploadDeathCertificatePage.uploadDeathCertificate(fileName);
    await expect(pages.radUploadDeathCertificatePage.page.getByRole('link', { name: `Remove ${fileName}`, exact: true })).toBeVisible();
  }
  await expect(pages.radUploadDeathCertificatePage.page.getByRole('link', { name: /^Remove death-certificate-/ })).toHaveCount(count);
});

When('I attempt to upload another RAD certificate', async ({ pages }) => {
  await pages.radUploadDeathCertificatePage.uploadDeathCertificate('death-certificate-over-limit.txt');
});

Then('I see the RAD maximum files validation error and the six certificates are retained', async ({ pages }) => {
  await pages.radUploadDeathCertificatePage.assertOnPage();
  await expect(pages.radUploadDeathCertificatePage.page.locator('#file-upload-error')).toContainText('You can only upload up to 6 files. Remove a file before uploading another');
  await expect(pages.radUploadDeathCertificatePage.page.getByRole('link', { name: /^Remove / })).toHaveCount(6);
  await expect(pages.radUploadDeathCertificatePage.page.getByText('death-certificate-over-limit.txt', { exact: true })).toHaveCount(0);
});

Then('the RAD check your answers page shows {string} answer {string}', async ({ pages }, question: string, answer: string) => {
  await pages.radCheckYourAnswersDeathPage.assertOnPage();
  await pages.radCheckYourAnswersDeathPage.assertAnswer(question, answer);
  const row = pages.radCheckYourAnswersDeathPage.page.getByRole('term').filter({ hasText: question }).locator('..');
  await expect(row.getByRole('definition').first()).toHaveText(answer);
});

const changeReportedRadAnswer = async (pages: Pages, question: string, from: string, to: string) => {
  await pages.radCheckYourAnswersDeathPage.assertAnswer(question, from);
  await pages.radCheckYourAnswersDeathPage.page.getByRole('link', { name: 'Change Tell us about the person who died', exact: true }).click();
  await pages.radMainClaimantDiedPage.assertOnPage();
  if (question === 'Did they make the claim?') {
    await expect(pages.radMainClaimantDiedPage.page.getByRole('radio', { name: from, exact: true })).toBeChecked();
    await pages.radMainClaimantDiedPage.answer(to);
    await pages.radMainClaimantDiedPage.continueToNextPage();
    return;
  }
  if (question !== 'Their country of nationality' && question !== 'Their name') {
    throw new Error(`No RAD answer edit defined for "${question}"`);
  }
  await pages.radMainClaimantDiedPage.continueToNextPage();
  await pages.radNamePersonWhoDiedPage.assertOnPage();
  if (question === 'Their name') {
    const original = radNames[from];
    const updated = radNames[to];
    if (!original || !updated) throw new Error(`No RAD name data defined for "${from}" or "${to}"`);
    await expect(pages.radNamePersonWhoDiedPage.page.getByRole('textbox', { name: 'Given name', exact: true })).toHaveValue(original.givenName);
    await expect(pages.radNamePersonWhoDiedPage.page.getByRole('textbox', { name: 'Family name', exact: true })).toHaveValue(original.familyName);
    await pages.radNamePersonWhoDiedPage.enterName(updated.givenName, updated.familyName);
    await pages.radNamePersonWhoDiedPage.continueToNextPage();
    return;
  }
  await pages.radNamePersonWhoDiedPage.continueToNextPage();
  await pages.radDateOfBirthPersonWhoDiedPage.assertOnPage();
  await pages.radDateOfBirthPersonWhoDiedPage.continueToNextPage();
  await pages.radNationalityPersonWhoDiedPage.assertOnPage();
  await expect(pages.radNationalityPersonWhoDiedPage.page.getByRole('combobox', { name: 'Country of nationality', exact: true })).toHaveValue(from);
  await pages.radNationalityPersonWhoDiedPage.selectNationality(to);
  await pages.radNationalityPersonWhoDiedPage.continueToNextPage();
};

When('I update these RAD answers and review each saved change', async ({ pages }, table: DataTable) => {
  for (const row of table.hashes()) {
    await changeReportedRadAnswer(pages, row.question, row.original, row.updated);
    await completeRemainingRadEdit(pages);
    const answer = pages.radCheckYourAnswersDeathPage.page.getByRole('term')
      .filter({ hasText: row.question }).locator('..').getByRole('definition').first();
    await expect(answer).toHaveText(row.updated);
  }
});

Then('the RAD summary provides the required Back and Continue navigation', async ({ pages }) => {
  await pages.radCheckYourAnswersDeathPage.assertOnPage();
  await expect.soft(pages.radCheckYourAnswersDeathPage.backLink).toBeVisible();
  await pages.radCheckYourAnswersDeathPage.continueToNextPage();
  await expect.soft(pages.basePage.page).toHaveURL(url => url.pathname === '/changes/contact-us-by-email');
});

Then('these RAD navigation checks remain pending', async ({ $test }, table: DataTable) => {
  const checks = table.hashes().map(row => `${row.page}: ${row.control} (${row.reason})`);
  $test.fixme(true, checks.join('; '));
});

const changeLink = (pages: Pages, answer: string) =>
  pages.checkYourAnswersPage.page.getByRole('link', { name: `Change ${c.RAD_QUESTION} from ${answer}`, exact: true });

Then('I land on the check your answers page', async ({ pages }) => {
  await pages.checkYourAnswersPage.assertOnPage();
});

Then('the check your answers page shows the report a death answer {string}', async ({ pages }, answer: string) => {
  await pages.checkYourAnswersPage.assertAnswer(c.RAD_QUESTION, answer, c.RAD_SUMMARY_LABEL);
});

Given('I have not reported a death and am on the check your answers page', async ({ pages }) => {
  await reachReportADeath(pages, true);
  await pages.radSomeoneOnClaimDiedPage.answer('No');
  await pages.radSomeoneOnClaimDiedPage.continueToNextPage();
  await pages.somethingElsePage.assertOnPage();
  await pages.somethingElsePage.answer('No');
  await pages.somethingElsePage.continueToNextPage();
  await pages.checkYourAnswersPage.assertOnPage();
});

When('I change the report a death answer from {string} to {string}', async ({ pages }, from: string, to: string) => {
  await changeLink(pages, from).click();
  await pages.radSomeoneOnClaimDiedPage.assertOnPage();
  await pages.radSomeoneOnClaimDiedPage.answer(to);
  await pages.radSomeoneOnClaimDiedPage.continueToNextPage();
});

Then('the reported death details are cleared', async ({ pages }) => {
  const page = pages.checkYourAnswersPage.page;
  for (const question of ['Did they make the claim?', 'Their name', 'Their date of birth', 'Their country of nationality']) {
    await expect(page.getByRole('term').filter({ hasText: question })).toHaveCount(0);
  }
  await expect(page.getByText('test-death-certificate.txt', { exact: true })).toHaveCount(0);
});

When('I complete the reported death details and continue to check your answers', async ({ pages }) => {
  await completeDeceasedDetails(pages, 'Yes');
  await pages.radCheckYourAnswersDeathPage.continueToNextPage();
  await pages.checkYourAnswersPage.assertOnPage();
});
