@rad-validation-journeys
Feature: Report a death validations
	As a user updating an asylum claim
	I want the service to validate my answer about someone on my claim having died
	So that I can correct missing information and be routed to the right page

	Background:
		Given I start the application journey
		When I click Start now
		And I complete RAD claimant setup with a random date of birth between 01/01/1990 and 01/01/2015

	Scenario: About who has died displays the design and navigates to the next page
		Given I am on the RAD "About who has died" page
		Then the current RAD page has standard content and navigation
		When I go back to the RAD "Someone on my claim has died" page
		Then I am on the RAD "Someone on my claim has died" page
		When I enter valid details on the RAD "Someone on my claim has died" page with answer "Yes"
		And I continue
		Then I am on the RAD "About who has died" page
		When I continue
		Then I am on the RAD "Did they make the claim?" page

	Scenario: About who has died shows the applications link for multiple active applications
		Then the "Back to my applications" link is shown when I have more than one ongoing and active application

	Scenario: Required answers, standard content and radio routes are checked in one journey
		Given I am on the RAD "Someone on my claim has died" page
		When I validate required answers and navigation through these RAD pages
			| page                         | error                                    | additional error        | answer | next page                    |
			| Someone on my claim has died | Tell us if someone on your claim has died |                         | Yes    | Did they make the claim?      |
			| Did they make the claim?      | Select if they made the claim            |                         | No     | Their name                   |
			| Their name                   | Enter their given name                   | Enter their family name |        | Their date of birth          |
			| Their date of birth          | Enter their date of birth                |                         |        | Their country of nationality |
			| Their country of nationality | Select a country of nationality          |                         |        | Upload the death certificate |
		Then the current RAD page has standard content and navigation
		When I enter valid details on the RAD "Upload the death certificate" page with answer ""
		And I continue
		Then I am on the RAD "RAD check your answers" page
		And the RAD summary shows the recorded person and no Remove link
		When I continue from the RAD review without another request
		Then I land on the check your answers page
		And the check your answers page shows the report a death answer "Yes"
		When I change the report a death answer from "Yes" to "No"
		Then I reach the "Something else" page

	Scenario: Name rules and valid length boundaries are checked on the same form
		Given I am on the RAD "Their name" page
		When I check the following RAD name validation rules
			| given name          | family name         | error                                             |
			|                     | Person              | Enter their given name                            |
			| Test                |                     | Enter their family name                           |
			| https://example.com | Person              | Given name must not contain a URL                 |
			| Test                | https://example.com | Family name must not contain a URL                |
			| 256 characters      | Person              | Given name must be between 1 and 255 characters    |
			| Test                | 256 characters      | Family name must be between 1 and 255 characters   |
		Then I remain on the RAD "Their name" page
		When I enter valid details on the RAD "Their name" page with answer "255-character names"
		And I continue
		Then I am on the RAD "Their date of birth" page
		When I go back to the RAD "Their name" page
		And I enter valid details on the RAD "Their name" page with answer ""
		And I continue
		Then I am on the RAD "Their date of birth" page

	Scenario: Reported answers are edited and another person is added in the same journey
		Given I am on the RAD "RAD check your answers" page
		Then the RAD summary shows the recorded person and no Remove link
		When I update these RAD answers and review each saved change
			| question                     | original                                                    | updated                                                     |
			| Their country of nationality | India                                                       | France                                                      |
			| Did they make the claim?      | No, they are a husband, wife, partner or child on the claim | Yes                                                         |
			| Did they make the claim?      | Yes                                                         | No, they are a husband, wife, partner or child on the claim |
			| Their name                   | Test Person                                                 | Updated Name                                                |
		Then the RAD check your answers page shows "Their name" answer "Updated Name"
		When I tell the service someone else has died and complete their details
		Then the RAD summary shows the updated and additional people with Remove links and no original name

	# Scenario: Summary content, accessibility and required navigation are checked together
	# 	Given I am on the RAD "RAD check your answers" page
	# 	Then the RAD page content and layout match the design
	# 	And the feedback banner is displayed
	# 	And the GOV.UK header and footer are displayed
	# 	And the RAD summary has no automated WCAG 2.2 AA accessibility violations
	# 	And the RAD summary provides the required Back and Continue navigation

	Scenario: Certificate replacement, removal and the six-file limit are checked on one upload page
		Given I am on the RAD "Upload the death certificate" page
		When I upload RAD certificate "original-death-certificate.png"
		And I upload RAD certificate "updated-death-certificate.png"
		And I remove RAD certificate "original-death-certificate.png"
		Then the RAD upload page lists certificate "updated-death-certificate.png" but not "original-death-certificate.png"
		When I upload 5 additional RAD certificates
		And I attempt to upload another RAD certificate
		Then I see the RAD maximum files validation error and the six certificates are retained
		And I remain on the RAD "Upload the death certificate" page
		When I continue
		Then the RAD check your answers page lists certificate "updated-death-certificate.png" but not "original-death-certificate.png"

	Scenario: The report a death answer can be changed both ways while another request remains
		Given I have not reported a death and am on the check your answers page
		Then the check your answers page shows the report a death answer "No"
		When I change the report a death answer from "No" to "Yes"
		Then I am on the RAD "About who has died" page
		And the current RAD page has standard content and navigation
		When I complete the reported death details and continue to check your answers
		Then I land on the check your answers page
		And the check your answers page shows the report a death answer "Yes"
		When I change the report a death answer from "Yes" to "No"
		Then I land on the check your answers page
		And the check your answers page shows the report a death answer "No"
		And the reported death details are cleared

	# Scenario: Unavailable navigation controls remain explicitly pending
	# 	Then these RAD navigation checks remain pending
	# 		| page                         | control                 | reason                                                   |
	# 		| Someone on my claim has died | Back to my applications | Multiple-active-application setup is not implemented      |
	# 		| Did they make the claim?      | Back to my applications | Multiple-active-application setup is not implemented      |
	# 		| Their name                   | Back to my applications | Multiple-active-application setup is not implemented      |
	# 		| Upload the death certificate | Change                  | Upload page has no Change link to supporting evidence     |
