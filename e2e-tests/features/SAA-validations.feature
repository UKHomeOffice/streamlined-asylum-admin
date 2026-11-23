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
# What is your email address?
    And I submit my email address without entering it
    Then I should see "There is a problem" error message displayed
    And I should see "Enter your email address" error summary
    When I submit "rrr dd.com" as my email address
    Then I should see "There is a problem" error message displayed
    And I should see "Enter a real email address" error summary
    When I complete the "What is your email address?" page
    And I complete the "Continue to your form" page
    And I complete the "Which form do you need to continue?" page
    And I complete the "Information you have given us" page
  # Claimant's name
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "You must enter a given name¬Enter their family name" error summary
    When I complete the "Claimant's name" page with "3333" and "eee44455"
    Then I should see "There is a problem" error message displayed
    And I should see "Given name must not contain numbers¬Family name must not contain numbers" error summary
    When I complete the "Claimant's name" page with "TEST" and ""
    Then I should see "There is a problem" error message displayed
    And I should see "Enter their family name" error summary
  # Claimant's main language
    When I complete the "Claimant's name" page with "TEST" and "FamilyName"
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "You must select a main language" error summary
  # Are you completing the form for you or someone else?
    When I complete the "Claimant's main language" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Select if you are completing the form for you or someone else" error summary
  # Who are you?
    When I complete the "Are you completing the form for you or someone else?" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "You must select who you are" error summary
  # Do you need to update personal details?
    When I complete the "Who are you?" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Select if you need to update personal details" error summary
  # Do you need to add or remove a child or partner as a dependant?
    When I complete the "Do you need to update personal details?" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Select if you need to add or remove a child or partner as a dependant" error summary
  # Do you need to add a dependant or remove a dependant?
    When I complete the "Do you need to add or remove a child or partner as a dependant?" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Select if you need to add or remove a child or partner" error summary
  # How are they related to you?
    When I complete the "Do you need to add a dependant or remove a dependant?" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Select how they are related to you" error summary
  # Their name
    When I complete the "How are they related to you?" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Enter their given name¬Enter their family name" error summary
  # Their date of birth
    When I complete the "Their name" page with "GivenHof" and "Test Family"
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Enter their date of birth" error summary
    When I submit day "09" as their date of birth
    Then I should see "There is a problem" error message displayed
    And I should see "Enter a real date of birth" error summary
  # Their country of nationality
    When I complete the "Their date of birth" page
    And I select continue
    Then I should see "There is a problem" error message displayed
    And I should see "Select their country of nationality" error summary

