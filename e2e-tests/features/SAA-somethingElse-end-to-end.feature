Feature: Something else end-to-end journeys
	As a user updating an asylum claim
	I want to know how to contact the Home Office about another request
	So that I can proceed with any other changes or evidence

	Background:
		Given I start the application journey
		When I click Start now
		And I complete RAD claimant setup with a random date of birth between 01/01/1990 and 01/01/2015

	Scenario: An additional request without another selected section shows contact details
		When I reach something else without supporting evidence or reporting a death
		And I answer "Yes" to needing to do something else
		Then I see the Home Office contact details without a Continue button

	Scenario: No additional request or selected section leads to no options
		When I reach something else without supporting evidence or reporting a death
		And I answer "No" to needing to do something else
		Then I reach the "No options" page

	Scenario: An additional request with supporting evidence continues to check your answers
		When I reach something else with supporting evidence and without reporting a death
		And I answer "Yes" to needing to do something else
		Then I see the Home Office contact details with a Continue button
		When I continue
		Then I reach the "Check your answers" page
		And the final answers show supporting evidence and no reported death

	Scenario: No additional request with supporting evidence continues to check your answers
		When I reach something else with supporting evidence and without reporting a death
		And I answer "No" to needing to do something else
		Then I reach the "Check your answers" page
		And the final answers show supporting evidence and no reported death