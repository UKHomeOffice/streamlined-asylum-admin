Feature: Send evidence for a claim
	As a user completing an asylum support application
	I want to tell the service whether I need to send evidence
	So that I can provide evidence to support my claim

	Background:
		Given I am on the "Send evidence for your claim" page

	Scenario: The send evidence page displays its standard content and navigation
		Then the page content and layout match the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: An answer is required before continuing
		When I continue without answering "Do you need to send evidence to help your claim?"
		Then I see the error "Select if you need to send evidence to support your claim"
		And I remain on the "Send evidence for your claim" page

	Scenario: The user chooses to send evidence
		When I answer "Yes" to "Do you need to send evidence to help your claim?"
		And I continue
		Then I am on the "Prepare your evidence" page
		When I continue
		Then I am on the "Upload evidence to help your claim" page
		When I upload evidence and continue
		Then I am on the "Violent or upsetting images" page

	Scenario: The user chooses not to send evidence
		When I answer "No" to "Do you need to send evidence to help your claim?"
		And I continue
		Then I bypass the evidence preparation and upload pages
		And I continue to the next section of my application

	Scenario: No evidence and no other requests means there are no options to submit
		When I answer "No" to "Do you need to send evidence to help your claim?"
		And I continue through the relevant pages
		Then I am told that I have not selected any options

	Scenario Outline: The answer is shown correctly on check your answers
		When I answer "<answer>" to "Do you need to send evidence to help your claim?"
		And I continue through the relevant pages
		Then the "Check your answers" page shows "Do you need to send evidence to help your claim?" as "<answer>"

		Examples:
			| answer |
			| Yes    |