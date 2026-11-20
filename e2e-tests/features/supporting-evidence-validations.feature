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

