Feature: Report a death end-to-end journeys
	As a user updating an asylum claim
	I want to report that someone on the claim has died
	So that their details and death certificate can be reviewed

	Scenario Outline: The user completes a RAD journey without supporting evidence
		Given I start the application journey
		When I click Start now
		And I complete RAD claimant setup with a random date of birth between 01/01/1990 and 01/01/2015
		Then I reach the "Send evidence for your claim" page
		When I complete the report a death journey for "<Main claimant>"
		Then the RAD check your answers page shows the reported death for "<Main claimant>"
		When I continue from the RAD review without another request
		Then I reach the "Check your answers" page
		And the final RAD answers show that no supporting evidence was required

		Examples:
			| Main claimant                                             |
			| Yes                                                       |
			| No, they are a husband, wife, partner or child on the claim |