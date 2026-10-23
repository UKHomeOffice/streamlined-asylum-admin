Feature: Violent or upsetting images
	As a user completing an asylum support application
	I want to tell the service if my evidence includes violent or upsetting images
	So that the service can handle my evidence appropriately

	Scenario: The violent or upsetting images page displays its standard content and navigation
		Given I am on the "Violent or upsetting images" page
		Then the violent or upsetting images page content and layout match the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed

	Scenario: An answer is required before continuing
		Given I am on the "Violent or upsetting images" page
		When I continue without selecting an answer about violent or upsetting images
		Then I see the violent or upsetting images validation error
		And I remain on the violent or upsetting images page

	Scenario: The user continues to check your answers
		Given I am on the "Violent or upsetting images" page
		When I answer "No" to "Does your evidence include violent or upsetting images?"
		And I continue
		Then I land on the evidence check your answers page

	Scenario Outline: The answer is shown correctly on check your answers
		Given I am on the "Violent or upsetting images" page
		When I answer "<answer>" to "Does your evidence include violent or upsetting images?"
		And I continue
		Then I land on the evidence check your answers page
		And the evidence check your answers page shows the violent images answer "<answer>"

		Examples:
			| answer |
			| Yes    |
			| No     |

	Scenario: Changes made on the edit journey are shown on check your answers
		Given I am editing my answer about violent or upsetting images
		When I answer "Yes" to "Does your evidence include violent or upsetting images?"
		And I continue
		Then I land on the evidence check your answers page
		And the evidence check your answers page shows the violent images answer "Yes"