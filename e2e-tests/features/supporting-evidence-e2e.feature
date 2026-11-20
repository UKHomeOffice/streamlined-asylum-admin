Feature: Supporting evidence end-to-end journeys
	As a user completing an asylum support application
	I want to provide and review evidence for my claim
	So that I can submit relevant information to support my application

  Scenario Outline: The user completes an EVI journey
    Given I visit the streamlined asylum admin page
    When I complete the supporting evidence journey pertaining to "<Journey>"
    Then I should be on "<Page Header>" page
    Examples:
      | Journey                  | Page Header                       |
      | T1: Evidence submitted   | Check your answers                |
      | T2: No evidence required | You have not selected any options |
    #   | T3: No evidence or other request |                                   |
