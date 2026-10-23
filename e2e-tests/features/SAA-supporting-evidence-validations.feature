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