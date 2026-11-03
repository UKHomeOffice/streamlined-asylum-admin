/* eslint-disable camelcase */

const {
  findApplicationsByEmail
} = require('../../../utils/application-service');
const {
  formatDate,
  formatUanForDisplay,
  logAndThrow
} = require('../../../utils');
const config = require('../../../config');

const FIELD_APP_ID = 'application-id';
const SESSION_DEFAULTS = config.sessionDefaults;

const parseSession = session => {
  try {
    return (typeof session === 'string' ? JSON.parse(session) : session) || {};
  } catch {
    throw new Error('Saved application session could not be read');
  }
};

const resumeFormSession = superclass =>
  class extends superclass {
    async configure(req, res, next) {
      try {
        const userEmail = req.sessionModel.get('user-email');
        if (!userEmail) {
          logAndThrow(
            'Cannot fetch applications without a verified email',
            'Email is required.'
          );
        }
        const drafts = await findApplicationsByEmail(userEmail);

        if (drafts.length === 0) {
          logAndThrow(
            'No applications found for the verified email',
            'No applications could be found'
          );
        }

        if (req.method === 'GET' && drafts.length === 1) {
          this.loadApplication(req, drafts[0]);
          this.emit('complete', req, res);
          return res.redirect(this.getNextStep(req, res));
        }

        req.drafts = drafts;
        this.setupRadioButtons(req, drafts);
      } catch (err) {
        return next(err);
      }
      return super.configure(req, res, next);
    }

    getValues(req, res, next) {
      return super.getValues(req, res, (err, values) => {
        if (err) {
          return next(err);
        }
        const displayValues = { ...values };
        if (
          displayValues[FIELD_APP_ID] !== undefined &&
          displayValues[FIELD_APP_ID] !== null
        ) {
          displayValues[FIELD_APP_ID] = String(displayValues[FIELD_APP_ID]);
        }
        return next(null, displayValues);
      });
    }

    saveValues(req, res, next) {
      try {
        const selected = req.form.values[FIELD_APP_ID];
        const draft = req.drafts.find(record => String(record.id) === selected);

        if (!draft) {
          logAndThrow(
            "Selected application is not among the verified user's drafts",
            'Selected application could not be found'
          );
        }

        this.loadApplication(req, draft);
      } catch (err) {
        return next(err);
      }
      delete req.form.values[FIELD_APP_ID];
      return super.saveValues(req, res, next);
    }

    clearPreviousApplication(req) {
      const keys = Object.keys(req.sessionModel.toJSON()).filter(
        key => !SESSION_DEFAULTS.preservedKeys.includes(key)
      );
      req.sessionModel.unset(keys);
    }

    setupRadioButtons(req, drafts) {
      const sortedDrafts = [...drafts].sort(
        (first, second) =>
          new Date(second.created_at).getTime() -
          new Date(first.created_at).getTime()
      );
      req.form.options.fields[FIELD_APP_ID] = {
        mixin: 'radio-group',
        validate: ['required'],
        options: sortedDrafts.map(({ id, date_of_birth, uan }) => ({
          label: formatUanForDisplay(uan),
          value: String(id),
          useHintText: true,
          hint: `Date of birth ${formatDate(date_of_birth) ?? ''}`
        })),
        legend: { className: 'visuallyhidden' }
      };
    }

    loadApplication(req, draft) {
      const { id, session } = draft;
      if (String(req.sessionModel.get(FIELD_APP_ID)) === String(id)) {
        return;
      }

      let saved;
      try {
        saved = { ...parseSession(session) };
      } catch {
        logAndThrow(
          'Failed to read saved application session',
          'Saved application session could not be read',
          { applicationId: id }
        );
      }
      SESSION_DEFAULTS.excludedSnapshotKeys.forEach(key => delete saved[key]);

      const entrySteps = (req.sessionModel.get('steps') || []).filter(step =>
        SESSION_DEFAULTS.preservedSteps.includes(step)
      );
      const steps = [...new Set([...entrySteps, ...(saved.steps || [])])];
      this.clearPreviousApplication(req);
      req.sessionModel.set({ ...saved, steps, [FIELD_APP_ID]: id });
      req.log('info', `Resuming application ${id}`);
    }
  };
module.exports = resumeFormSession;
