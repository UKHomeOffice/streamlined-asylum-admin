export class ConstantsLib {
    static readonly SAS_HOF_EMAIL = requiredEnv('SAS_HOF_EMAIL');
    static readonly DOB_1990 = '01/01/1990';
    static readonly CHILD_DOB = '27/03/2020';
    static readonly CHILD_DOB_DISPLAY = formatDateForSummary(ConstantsLib.CHILD_DOB);
    static readonly OPTION_NO = 'No';
    static readonly OPTION_YES = 'Yes';
    static readonly SCENARIO_T3_NO_EVIDENCE_OR_OTHER_REQUEST = 't3: no evidence or other request';
    static readonly GIVEN_NAME = 'GivenHof';
    static readonly FAMILY_NAME = 'Test Family';
    static readonly OPTION_ENGLISH = 'English';
    static readonly OPTION_FOR_ME = 'For me';
    static readonly OPTION_I_AM_THE_PERSON = 'I am the person claiming asylum';
    static readonly OPTION_ADD_CHILD_OR_PARTNER = 'Add a child or partner to your claim';
    static readonly OPTION_REMOVE_CHILD_OR_PARTNER = 'Remove a child or partner from your claim';
    static readonly OPTION_MY_CHILD = 'My child';
    static readonly REASON_FOR_REMOVING_CHILD = 'My child no longer needs to be included in my claim';
    static readonly CHILD_NATIONALITY = 'Afghanistan';
    static readonly EVIDENCE_UPLOAD_FILE = 'yourself.png';
    static readonly FULL_NAME = 'HOF TEST';
    static readonly ADDRESS_LINE_1 = '100';
    static readonly ADDRESS_LINE_2 = 'Tenth St';
    static readonly TOWN_OR_CITY = 'HULL';
    static readonly POSTCODE = 'M11 1HH';
}

function formatDateForSummary(dateOfBirth: string): string {
    const [day, month, year] = dateOfBirth.split('/').map(Number);
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, day)));
}

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}