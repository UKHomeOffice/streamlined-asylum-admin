Feature: Supporting evidence end-to-end journeys
	As a user completing an asylum support application
	I want to provide and review evidence for my claim
	So that I can submit relevant information to support my application

	Scenario Outline: The user completes an EVI journey
		Given I am on the "Send evidence for your claim" page
		When I complete the supporting evidence journey pertaining to "<Journey>"
		Then I reach the "<Expected page>" page

		Examples:
			| Journey                         | Expected page                  |
			| T1: Evidence submitted          | Check your answers             |
			| T2: No evidence required        | Someone on my claim has died   |
			| T3: No evidence or other request| No options                     |