export class ConstantsLib {
    static readonly SAS_HOF_EMAIL = requiredEnv('SAS_HOF_EMAIL');
    static readonly DOB_1990 = '01/01/1990';
    static readonly OPTION_NO = 'No';
    static readonly OPTION_YES = 'Yes';
    static readonly GIVEN_NAME = 'GivenHof';
    static readonly FAMILY_NAME = 'Test Family';
    static readonly OPTION_ENGLISH = 'English';
    static readonly OPTION_FOR_ME = 'For me';
    static readonly OPTION_I_AM_THE_PERSON = 'I am the person claiming asylum';
    static readonly EVIDENCE_UPLOAD_FILE = 'yourself.png';
    static readonly FULL_NAME = 'HOF TEST';
    static readonly ADDRESS_LINE_1 = '100';
    static readonly ADDRESS_LINE_2 = 'Tenth St';
    static readonly TOWN_OR_CITY = 'HULL';
    static readonly POSTCODE = 'M11 1HH';
}

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}