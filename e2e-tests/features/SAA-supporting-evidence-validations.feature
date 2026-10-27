Feature: Supporting evidence validations
	As a user completing an asylum support application
	I want the service to validate my supporting evidence answers and uploads
	So that I can correct missing or invalid information before continuing

	Scenario Outline: Required answers must be provided before continuing
		Given I am on the "<page>" page
		When I continue without answering "<question>"
		Then I see the error "<error>"
		And I remain on the "<page>" page

		Examples:
			| page                         | question                                                  | error                                                        |
			| Send evidence for your claim | Do you need to send evidence to help your claim?         | Select if you need to send evidence to support your claim   |
			| Violent or upsetting images  | Does your evidence include violent or upsetting images?  | Select if the evidence contains violent or upsetting images |

	Scenario: Uploading without selecting a file is prevented
		Given I am on the "Upload evidence to help your claim" page
		When I continue with invalid upload details
		Then I see the upload supporting evidence validation error
		And I remain on the "Upload evidence to help your claim" page

	Scenario: A user cannot upload more than six files
		Given I am on the "Upload evidence to help your claim" page
		When I upload the maximum of 6 files
		And I attempt to upload another file
		Then I see the maximum files validation error

	Scenario: The send evidence page displays its standard content and navigation
		Given I am on the "Send evidence for your claim" page
		Then the page content and layout match the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: The prepare your evidence page displays its standard content and navigation
		Given I am on the "Prepare your evidence" page
		Then the page content and layout match the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: The user continues from prepare your evidence to upload evidence
		Given I am on the "Prepare your evidence" page
		When I continue
		Then I am on the "Upload evidence to help your claim" page

	Scenario: The upload supporting evidence page displays its standard content and navigation
		Given I am on the "Upload evidence to help your claim" page
		Then the upload supporting evidence page content and layout match the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: The user continues from upload evidence to violent or upsetting images
		Given I am on the "Upload evidence to help your claim" page
		When I continue from the upload supporting evidence page
		Then I am on the "Violent or upsetting images" page

	Scenario: The user removes an uploaded death certificate
		Given I am on the "Upload evidence to help your claim" page
		When I upload a death certificate
		And I remove the uploaded death certificate
		Then the death certificate is removed from the uploaded files

	Scenario: Additional evidence uploaded from the edit journey appears in the summary
		Given I am on the evidence check your answers page with completed evidence answers
		When I select the Change link for an evidence answer
		And I answer the questions for additional evidence and continue
		Then I return to the evidence check your answers page
		And the additional evidence answer is shown in the summary

	Scenario: The violent or upsetting images page displays its standard content and navigation
		Given I am on the "Violent or upsetting images" page
		Then the violent or upsetting images page content and layout match the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: A user continues from violent or upsetting images to check answers
		Given I am on the "Violent or upsetting images" page
		When I answer "No" to "Does your evidence include violent or upsetting images?"
		And I continue
		Then I land on the evidence check your answers page

	Scenario Outline: The violent images answer is shown correctly on check answers
		Given I am on the "Violent or upsetting images" page
		When I answer "<answer>" to "Does your evidence include violent or upsetting images?"
		And I continue
		Then I land on the evidence check your answers page
		And the evidence check your answers page shows the violent images answer "<answer>"

		Examples:
			| answer |
			| Yes    |
			| No     |

	Scenario: An edited violent images answer replaces the original answer
		Given I am editing my answer about violent or upsetting images
		When I answer "Yes" to "Does your evidence include violent or upsetting images?"
		And I continue
		Then I land on the evidence check your answers page
		And the evidence check your answers page shows the violent images answer "Yes"

	Scenario: The evidence check your answers page displays its standard content and navigation
		Given I am on the evidence check your answers page
		Then the evidence check your answers page content and layout match the design
		And a back link is available
		And the GOV.UK header and footer are displayed

	Scenario: Answers from the evidence journey are shown correctly
		Given I am on the evidence check your answers page with completed evidence answers
		Then my answers from the evidence journey are shown correctly

	Scenario: Updated evidence answers replace the original answers
		Given I have changed answers in the evidence journey
		When I review the evidence check your answers page
		Then my updated answers are shown
		And my original answers are not shown

	Scenario: Changing the uploaded evidence answer returns to upload evidence
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

	Scenario: Continuing from the evidence summary proceeds to the next section
		Given I am on the evidence check your answers page with completed evidence answers
		When I continue from the evidence check your answers page
		Then I land on the someone on my claim has died page