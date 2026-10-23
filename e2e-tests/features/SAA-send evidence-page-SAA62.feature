Feature: Check answers for supporting evidence
	As a user completing an asylum support application
	I want to review my supporting evidence answers
	So that I can check and update them before continuing

	Scenario: The evidence check your answers page displays its standard content and navigation
		Given I am on the evidence check your answers page
		Then the evidence check your answers page content and layout match the design
		And a back link is available
		And the GOV.UK header and footer are displayed

	Scenario: Answers from the evidence journey are displayed correctly
		Given I am on the evidence check your answers page with completed evidence answers
		Then my answers from the evidence journey are shown correctly

	Scenario: Updated answers replace the original answers
		Given I have changed answers in the evidence journey
		When I review the evidence check your answers page
		Then my updated answers are shown
		And my original answers are not shown

	Scenario: Changing an answer returns to upload supporting evidence
		Given I am on the evidence check your answers page
		When I select the Change link for an evidence answer
		Then I am on the "Upload evidence to help your claim" page

	Scenario: Evidence answers have Change links and no Remove links
		Given I am on the evidence check your answers page with completed evidence answers
		Then both evidence answers have a Change link
		And no Remove links are shown

	Scenario: Adding more evidence returns to the evidence summary
		Given I am on the evidence check your answers page
		When I select the add more evidence button
		Then I am on the "Upload evidence to help your claim" page
		When I answer the questions for additional evidence and continue
		Then I return to the evidence check your answers page
		And the additional evidence answer is shown in the summary

	Scenario: Continuing proceeds to the next section
		Given I am on the evidence check your answers page with completed evidence answers
		When I continue from the evidence check your answers page
		Then I land on the someone on my claim has died page