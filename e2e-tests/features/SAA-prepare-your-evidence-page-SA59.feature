Feature: Prepare your evidence
	As a user completing an asylum support application
	I want guidance on preparing evidence for my claim
	So that I can provide relevant and usable evidence

	Background:
		Given I am on the "Prepare your evidence" page

	Scenario: The prepare your evidence page displays its standard content and navigation
		Then the page content and layout match the design
		And a back link is available
		# And the "Back to my applications" link is shown when I have more than one ongoing and active application
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: The user continues to upload evidence
		When I continue
		Then I am on the "Upload evidence to help your claim" page

	Scenario: The answer that led to this page is shown on check your answers
		When I continue through the relevant pages
		Then the "Check your answers" page shows "Do you need to send evidence to help your claim?" as "Yes"
