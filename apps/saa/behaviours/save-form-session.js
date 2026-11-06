const config = require('../../../config');
const { saveApplication } = require('../../../utils/application-service');
const { CHANGE_EDIT_DELETE_REGEX } = require('../../../utils/constants');

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
          step => !CHANGE_EDIT_DELETE_REGEX.test(step)
        );
        // Preserve the resume destination when saving the entry page.
        if (currentRoute !== '/information-given') {
          session['last-saved-route'] = currentRoute;
        }

        const applicationId = req.sessionModel.get('application-id');
        const saved = await saveApplication(applicationId, session);
        if (!saved || String(saved.id) !== String(applicationId)) {
          throw new Error('Application could not be saved');
        }
        // Keep same-session resumes aligned with the successfully saved page.
        if (currentRoute !== '/information-given') {
          req.sessionModel.set('last-saved-route', currentRoute);
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
