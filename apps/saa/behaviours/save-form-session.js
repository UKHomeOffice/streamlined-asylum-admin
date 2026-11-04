const config = require('../../../config');
const { saveApplication } = require('../../../utils/application-service');
const EXCLUDE_TEMP_STEPS_REGEX = /\/(change|edit|delete)(?:\/|$)/;

const saveFormSession = superclass =>
  class extends superclass {
    locals(req, res) {
      const locals = super.locals(req, res);
      const { route: currentRoute } = req.form.options;
      locals.showSaveAndExit =
        !config.sessionDefaults.saveExemptions.includes(currentRoute);
      return locals;
    }

    async successHandler(req, res, next) {
      const { route: currentRoute } = req.form.options;
      if (config.sessionDefaults.saveExemptions.includes(currentRoute)) {
        return super.successHandler(req, res, next);
      }

      try {
        const session = req.sessionModel.toJSON();
        config.sessionDefaults.excludedSnapshotKeys.forEach(
          key => delete session[key]
        );
        session.steps = (session.steps || []).filter(
          step => !EXCLUDE_TEMP_STEPS_REGEX.test(step)
        );

        const applicationId = req.sessionModel.get('application-id');
        const saved = await saveApplication(applicationId, session);
        if (!saved || String(saved.id) !== String(applicationId)) {
          throw new Error('Application could not be saved');
        }
        req.log('info', `Saved form session for application ${applicationId}`);
      } catch (error) {
        return next(error);
      }

      if (req.body['save-and-exit']) {
        return res.redirect(`${req.baseUrl}/form-saved`);
      }
      return super.successHandler(req, res, next);
    }
  };
module.exports = saveFormSession;
