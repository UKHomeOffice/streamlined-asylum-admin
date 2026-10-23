Feature: Supporting evidence end-to-end journeys
	As a user completing an asylum support application
	I want to provide and review evidence for my claim
	So that I can submit relevant information to support my application

	Scenario: The user sends evidence and continues after reviewing the answers
		Given I start the application journey
		When I click Start now
		Then I reach the "Before you start" page
		When I continue
		Then I reach the "Claimant details" page
		When I complete claimant details and continue
		Then I reach the "Claim decision" page
		When I answer "No" to "Has there been a decision on the asylum claim?"
		And I continue
		Then I reach the "Email address" page
		When I request a secure link using the test email
		Then I reach the "Form entry" page
		When I click Enter form
		Then I reach the "Which form" page
		When I continue
		Then I reach the "Information given" page
		When I continue
		Then I reach the "Claimant name" page
		When I enter claimant name and continue
		Then I reach the "Claimant main language" page
		When I choose English as the claimant main language and continue
		Then I reach the "Person completing form" page
		When I answer "For me" to "Are you completing the form for you or someone else?"
		And I continue
		Then I reach the "Who are you" page
		When I continue
		Then I reach the "Personal details" page
		When I answer "No" to "Do you need to update personal details?"
		And I continue
		Then I reach the "Dependants" page
		When I select "No" and continue
		Then I am on the "Send evidence for your claim" page
		When I answer "Yes" to "Do you need to send evidence to help your claim?"
		And I continue
		Then I am on the "Prepare your evidence" page
		When I continue
		Then I am on the "Upload evidence to help your claim" page
		When I upload evidence and continue
		Then I am on the "Violent or upsetting images" page
		When I answer "No" to "Does your evidence include violent or upsetting images?"
		And I continue
		Then I land on the evidence check your answers page
		And my answers from the evidence journey are shown correctly
		When I continue from the evidence check your answers page
		Then I land on the someone on my claim has died page