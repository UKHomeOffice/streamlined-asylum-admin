Feature: SAA end-to-end journeys
	As a user completing an asylum support application
	I want to provide and review evidence for my claim
	So that I can submit relevant information to support my application

  Scenario Outline: The user completes an SAA journey
    Given I visit the streamlined asylum admin page
    When I complete the SAA journey pertaining to "<Journey>"
    Then I should be on "<Page Header>" page
    Examples:
      | Journey                          | Page Header                                        |
      | T1: Evidence submitted           | Check your answers                                 |
      | T2: No evidence required         | You have not selected any options                  |
      | T3: No evidence or other request | You should contact the Home Office a different way |
      | T4: No other request             | You have not selected any options                  |
      | T5: Add a child as a dependant   | Check your answers                                 |
      | T6: Remove a child as a dependant | Check your answers                                |
      | T7: Report a death                | Check your answers                                 |
                           
  Scenario: Validate the contact us by email page
    Given I visit the streamlined asylum admin page
    When I complete the SAA journey pertaining to "T3: No evidence or other request"
    Then I should be on "You should contact the Home Office a different way" page
    And the contact us by email page should pass accessibility and title checks
    And I should see "ahrocentralcommunicationshub@contactus.homeoffice.gov.uk" link to "mailto:ahrocentralcommunicationshub@contactus.homeoffice.gov.uk"
    And I should see "ARC enquiry form" link to "https://www.gov.uk/government/publications/application-registration-card-arc-enquiry"
