'use strict';

jest.mock(
  '../../../../apps/saa/behaviours/check-email-token',
  () => superclass => superclass
);

const fs = require('node:fs');
const path = require('node:path');
const Hogan = require('hogan.js');
const Controller = require('hof/controller/controller');
const Session = require('hof/controller/behaviour-session');
const Model = require('hof/model');
const app = require('../../../../apps/saa');
const pages = require('../../../../apps/saa/translations/src/en/pages.json');

describe('submitted page', () => {
  const template = Hogan.compile(fs.readFileSync(
    path.resolve(__dirname, '../../../../apps/saa/views/submitted.html'),
    'utf8'
  ));
  const render = values => template.render(
    { values },
    { layout: '<main>{{$content}}{{/content}}</main>' }
  );

  test('renders the declaration reference from the session', done => {
    const options = { ...app.steps['/submitted'], route: '/submitted' };
    const Composed = app.behaviours.reduce(
      (Base, behaviour) => behaviour(Base),
      Session(Controller)
    );
    const controller = new Composed(options);
    const req = {
      form: {},
      sessionModel: new Model({ 'application-reference': 'COC1234ABC' })
    };

    controller._getValues(req, {}, error => {
      try {
        expect(error).toBeNull();
        const html = render(req.form.values);
        expect(html).toContain('class="govuk-panel govuk-panel--confirmation"');
        expect(html).toContain('<strong>COC1234ABC</strong>');
        expect(html).toContain('Your information has been submitted');
        expect(html).toContain('What happens next');
        expect(html).toContain(
          'href="https://www.gov.uk/guidance/how-to-email-the-asylum-central-communications-hub"'
        );
        expect(html).toContain('contact us by email</a>');
        expect(pages.submitted.title).toBe('Your information has been submitted');
        done();
      } catch (assertionError) {
        done(assertionError);
      }
    });
  });

  test('escapes the reference in the confirmation panel', () => {
    expect(render({ 'application-reference': '<script>' })).toContain(
      '<strong>&lt;script&gt;</strong>'
    );
  });
});
