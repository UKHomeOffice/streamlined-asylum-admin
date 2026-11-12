@something-else-validation
Feature: Something else validations
	As a user updating an asylum claim
	I want to answer whether I need to do something else
	So that I can see the right next page and review my answer

	Background:
		Given I start the application journey
		When I click Start now
		And I complete RAD claimant setup with a random date of birth between 01/01/1990 and 01/01/2015

	Scenario: The page displays its content and validates an unanswered question
		When I reach something else without supporting evidence or reporting a death
		Then the something else page matches the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed
		When I go back to the RAD "Someone on my claim has died" page
		And I enter valid details on the RAD "Someone on my claim has died" page with answer "No"
		And I continue
		Then I reach the "Something else" page
		When I continue without answering "Do you need to do something else?"
		Then I see the error "Select if you need to do something else"
		And I remain on the "Something else" page
		When I answer "No" to needing to do something else
		Then I reach the "No options" page

	Scenario: The answer is shown and can be changed on check your answers
		When I reach something else with supporting evidence and without reporting a death
		And I answer "Yes" to needing to do something else
		Then I see the Home Office contact details with a Continue button
		When I continue
		Then the check your answers page shows the something else answer "Yes"
		When I change the something else answer from "Yes" to "No"
		Then the check your answers page shows the something else answer "No"

	Scenario: Continuing from the death summary opens something else
		Given I am on the RAD "RAD check your answers" page
		When I continue
		Then I reach the "Something else" page
		And the something else page matches the design

	Scenario: Contact page without another journey shows its content and links
		When I reach something else without supporting evidence or reporting a death
		And I answer "Yes" to needing to do something else
		Then I see the Home Office contact details without a Continue button
		And the contact page matches the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed
		When I go back from the contact page to something else
		And I answer "Yes" to needing to do something else
		Then the contact email link addresses the Home Office
		When I open the ARC enquiry form from the contact page
		Then the ARC enquiry form opens in the same tab

	Scenario: Contact page with another journey continues and can be revisited from check your answers
		When I reach something else with supporting evidence and without reporting a death
		And I answer "Yes" to needing to do something else
		Then I see the Home Office contact details with a Continue button
		And the contact page matches the design
		When I continue
		Then the check your answers page shows the something else answer "Yes"
		And the final answers show supporting evidence and no reported death
		When I revisit the contact page from check your answers
		Then I see the Home Office contact details with a Continue button
		When I continue
		Then the check your answers page shows the something else answer "Yes"

	Scenario: The contact page shows the applications link for multiple active applications
		Then the "Back to my applications" link is shown when I have more than one ongoing and active application

	Scenario: No options displays standard content and opens personal details
		When I reach something else without supporting evidence or reporting a death
		And I answer "No" to needing to do something else
		Then the no options page matches the design
		And a back link is available
		And the feedback banner is displayed
		And the GOV.UK header and footer are displayed
		When I go back from no options to something else
		And I answer "No" to needing to do something else
		Then I reach the "No options" page
		When I select Update personal details from no options
		Then I reach the "Personal details" page

	Scenario: Removing the last selected section from check your answers leads to no options
		When I reach something else with supporting evidence and without reporting a death
		And I answer "No" to needing to do something else
		Then I reach the "Check your answers" page
		When I remove supporting evidence from check your answers
		Then I reach the "Something else" page
		When I answer "No" to needing to do something else
		Then I reach the "No options" page

	Scenario: No options requirements not yet supported remain pending
		Then these no options requirements remain pending
			| requirement | reason |
			| Back to my applications | Multiple-active-application setup is not implemented |
			| Update personal details route | The service uses /changes/personal-details instead of /update-personal-details |
			| Exit form and seven-day retention | No Exit form control or seven-day retention verification is available |

	Scenario: The applications link is shown for multiple active applications
		Then the "Back to my applications" link is shown when I have more than one ongoing and active application