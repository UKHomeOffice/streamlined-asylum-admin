Feature: Supporting evidence validations
	As a user completing an asylum support application
	I want the service to validate my supporting evidence answers and uploads
	So that I can correct missing or invalid information before continuing
#
#
# About the person who made the claim
# Has there been a decision on the asylum claim?

  Scenario Outline: Test-1 Validate the above pages
    Given I visit the streamlined asylum admin page
    When I choose to navigate to "About the person who made the claim" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Enter a unique application number¬Enter a date of birth" error summary
    When I complete the "About the person who made the claim" page
# Has there been a decision on the asylum claim?
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Select if there has been a decision on the claim" error summary
    When I complete the "Has there been a decision on the asylum claim?" page

  Scenario: Validate the contact us by email page
    Given I visit the streamlined asylum admin page
    When I complete the supporting evidence journey pertaining to "T3: No evidence or other request"
    Then I should be on "You should contact the Home Office a different way" page
    And I should see "Email the Home Office about your claim" text displayed
    And I should see "Email the Home Office if you need to:" text displayed
    And I should see "ask about progress on your claim" text displayed
    And I should see "tell us you cannot attend an appointment" text displayed
    And I should see "withdraw your claim" text displayed
    And I should see "submit a letter of authority for an immigration advisor" text displayed
    And I should see "ask for copies of documents" text displayed
    And I should see "make corrections to an interview" text displayed
    And I should see "send us information that could affect how quickly we look at your claim" text displayed
    And I should see "Email address" text displayed
    And I should see "ahrocentralcommunicationshub@contactus.homeoffice.gov.uk" link to "mailto:ahrocentralcommunicationshub@contactus.homeoffice.gov.uk"
    And I should see "If you need a new application registration card (ARC)" text displayed
    And I should see "Use the online ARC enquiry form to tell the Home Office if:" text displayed
    And I should see "ARC enquiry form" link to "https://www.gov.uk/government/publications/application-registration-card-arc-enquiry"
    And I should see "you have not received your ARC" text displayed
    And I should see "your ARC has been lost, stolen, seized or damaged" text displayed
    And I should see "your ARC has expired or will expire soon" text displayed
    And I should see "the work concession on the ARC is wrong" text displayed
    And I should see "the photograph on the ARC is wrong" text displayed
    And I should not see the continue button
