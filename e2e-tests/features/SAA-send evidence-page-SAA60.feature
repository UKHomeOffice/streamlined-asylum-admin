Feature: Upload supporting evidence
	As a user completing an asylum support application
	I want to upload evidence to support my claim
	So that I can provide evidence for my application

	Scenario: The upload supporting evidence page displays its standard content and navigation
		Given I am on the "Upload evidence to help your claim" page
		Then the upload supporting evidence page content and layout match the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: Invalid upload details prevent continuing
		Given I am on the "Upload evidence to help your claim" page
		When I continue with invalid upload details
		Then I see the upload supporting evidence validation error
		And I remain on the "Upload evidence to help your claim" page

	Scenario: The user continues to the violent or upsetting images page
		Given I am on the "Upload evidence to help your claim" page
		When I continue from the upload supporting evidence page
		Then I am on the "Violent or upsetting images" page

	Scenario: The user removes an uploaded death certificate from the upload list
		Given I am on the "Upload evidence to help your claim" page
		When I upload a death certificate
		And I remove the uploaded death certificate
		Then the death certificate is removed from the uploaded files

	Scenario: The user cannot upload more than six files
		Given I am on the "Upload evidence to help your claim" page
		When I upload the maximum of 6 files
		And I attempt to upload another file
		Then I see the maximum files validation error

	Scenario: Additional files uploaded from the edit journey are shown on check your answers
		Given I am on the evidence check your answers page with completed evidence answers
		When I select the Change link for an evidence answer
		And I answer the questions for additional evidence and continue
		Then I return to the evidence check your answers page
		And the additional evidence answer is shown in the summary