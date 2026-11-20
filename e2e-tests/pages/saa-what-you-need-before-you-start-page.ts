import { expect, type Page } from '@playwright/test';
import { BasePage } from './base-page';

export class WhatYouNeedBeforeYouStartPage extends BasePage {
	constructor(page: Page) {
		super(page);
	}


	async expectedPageTitle(): Promise<string> {
		const title = await this.page.title();

		return title.startsWith('Error')
			? "Error: What you need before you start – Send information for your asylum claim – GOV.UK"
			: "What you need before you start – Send information for your asylum claim – GOV.UK";
	}


	async completeWhatYouNeedBeforeYouStartPage() {
		await this.assertAccessibility();
		await this.assertPageTitle(this.page, await this.expectedPageTitle());
		await this.click(this.continueButton);
	}
}