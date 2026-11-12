import { expect } from '@playwright/test';
import { createBdd, type DataTable } from 'playwright-bdd';
import { test } from '../fixtures/fixtures';

const { When, Then, Before } = createBdd(test);
const question = 'Do you need to do something else?';
const arcUrl = 'https://www.gov.uk/government/publications/application-registration-card-arc-enquiry';
const contactEmail = 'ahrocentralcommunicationshub@contactus.homeoffice.gov.uk';

Before({ tags: '@something-else-validation' }, async ({ $test }) => {
  $test.setTimeout(90_000);
});

Then('the something else page matches the design', async ({ pages }) => {
  await pages.somethingElsePage.assertOnPage();
  await pages.somethingElsePage.assertUnansweredQuestion(question);
  await expect(pages.basePage.page.getByText('For example, ask about progress on your claim or submit a letter of authority', { exact: true })).toBeVisible();
});

Then('the contact page matches the design', async ({ pages }) => {
  const page = pages.basePage.page;
  await expect(page).toHaveURL(url => url.pathname === '/changes/contact-us-by-email');
  const mainContent = page.getByRole('main');
  await expect(mainContent.getByText('Something else', { exact: true })).toBeVisible();
  await expect(mainContent.getByRole('heading', { level: 1, name: 'You should contact the Home Office a different way' })).toBeVisible();
  await expect(mainContent.getByRole('heading', { name: 'Email the Home Office about your claim', exact: true })).toBeVisible();
  await expect(mainContent.getByRole('heading', { name: 'If you need a new application registration card (ARC)', exact: true })).toBeVisible();
  for (const item of [
    'ask about progress on your claim',
    'tell us you cannot attend an appointment',
    'withdraw your claim',
    'submit a letter of authority for an immigration advisor',
    'ask for copies of documents',
    'make corrections to an interview',
    'send us information that could affect how quickly we look at your claim',
    'you have not received your ARC',
    'your ARC has been lost, stolen, seized or damaged',
    'your ARC has expired or will expire soon',
    'the work concession on the ARC is wrong',
    'the photograph on the ARC is wrong',
  ]) {
    await expect(mainContent.getByRole('listitem').filter({ hasText: item })).toBeVisible();
  }
});

When('I go back from the contact page to something else', async ({ pages }) => {
  await pages.basePage.backLink.click();
  await pages.somethingElsePage.assertOnPage();
  await expect(pages.somethingElsePage.page.getByRole('radio', { name: 'Yes', exact: true })).toBeChecked();
});

Then('the contact email link addresses the Home Office', async ({ pages }) => {
  const emailLink = pages.basePage.page.getByRole('link', { name: contactEmail, exact: true });
  await expect(emailLink).toHaveAttribute('href', `mailto:${contactEmail}`);
  await expect(emailLink).not.toHaveAttribute('target', '_blank');
});

When('I open the ARC enquiry form from the contact page', async ({ pages }) => {
  const page = pages.basePage.page;
  const arcLink = page.getByRole('link', { name: 'ARC enquiry form', exact: true });
  await expect(arcLink).toHaveAttribute('href', arcUrl);
  await expect(arcLink).not.toHaveAttribute('target', '_blank');
  await page.route(arcUrl, route => route.fulfill({ status: 200, contentType: 'text/html', body: 'ARC enquiry form' }));
  await arcLink.click();
});

Then('the ARC enquiry form opens in the same tab', async ({ pages }) => {
  await expect(pages.basePage.page).toHaveURL(arcUrl);
});

When('I revisit the contact page from check your answers', async ({ pages }) => {
  await pages.checkYourAnswersPage.assertOnPage();
  await pages.checkYourAnswersPage.page.getByRole('link', { name: `Change ${question} from Yes`, exact: true }).click();
  await pages.somethingElsePage.assertOnPage();
  await expect(pages.somethingElsePage.page.getByRole('radio', { name: 'Yes', exact: true })).toBeChecked();
  await pages.somethingElsePage.continueToNextPage();
});

Then('the check your answers page shows the something else answer {string}', async ({ pages }, answer: string) => {
  await pages.checkYourAnswersPage.assertOnPage();
  const row = pages.basePage.page.getByRole('term').filter({ hasText: question }).locator('..');
  await expect(row.getByRole('definition').first()).toHaveText(answer);
  await expect(row.getByRole('link', { name: `Change ${question} from ${answer}`, exact: true })).toBeVisible();
});

When('I change the something else answer from {string} to {string}', async ({ pages }, original: string, updated: string) => {
  await pages.checkYourAnswersPage.page.getByRole('link', { name: `Change ${question} from ${original}`, exact: true }).click();
  await pages.somethingElsePage.assertOnPage();
  await expect(pages.somethingElsePage.page.getByRole('radio', { name: original, exact: true })).toBeChecked();
  await pages.somethingElsePage.answer(updated);
  await pages.somethingElsePage.continueToNextPage();
  await pages.checkYourAnswersPage.assertOnPage();
});

Then('the no options page matches the design', async ({ pages }) => {
  await pages.noOptionsPage.assertOnPage();
  const mainContent = pages.noOptionsPage.page.getByRole('main');
  await expect(mainContent.getByText('If you do not need to make any changes you can exit the form.', { exact: true })).toBeVisible();
  await expect(mainContent.getByText('If you want to update personal details you must start again.', { exact: true })).toBeVisible();
  await expect(mainContent.getByRole('link', { name: 'Update personal details', exact: true })).toBeVisible();
});

When('I go back from no options to something else', async ({ pages }) => {
  await pages.noOptionsPage.assertOnPage();
  await pages.noOptionsPage.backLink.click();
  await pages.somethingElsePage.assertOnPage();
  await expect(pages.somethingElsePage.page.getByRole('radio', { name: 'No', exact: true })).toBeChecked();
});

When('I select Update personal details from no options', async ({ pages }) => {
  await pages.noOptionsPage.assertOnPage();
  await pages.noOptionsPage.page.getByRole('link', { name: 'Update personal details', exact: true }).click();
});

When('I remove supporting evidence from check your answers', async ({ pages }) => {
  await pages.checkYourAnswersPage.assertOnPage();
  await pages.checkYourAnswersPage.page.getByRole('link', {
    name: 'Change Do you need to send evidence to help your claim? from Yes', exact: true,
  }).click();
  await pages.sendEvidencePage.assertOnPage();
  await pages.sendEvidencePage.answer('No');
  await pages.sendEvidencePage.continueToNextPage();
});

Then('these no options requirements remain pending', async ({ $test }, table: DataTable) => {
  $test.fixme(true, table.hashes().map(row => `${row.requirement}: ${row.reason}`).join('; '));
});