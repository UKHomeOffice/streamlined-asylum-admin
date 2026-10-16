const config = require('../../../config');
const aggregatorSaveUpdate = superclass =>
  class extends superclass {
    constructor(options) {
      if (!options.aggregateTo) {
        throw new Error('options.aggregateTo is required for loops');
      }
      if (!options.aggregateFrom) {
        throw new Error('options.aggregateFrom is required for loops');
      }
      super(options);
    }

    // The id comes from the URL, so ignore anything that is not a position in the list (e.g. 'forEach').
    getItemIndex(req) {
      const { id } = req.params;
      // Digits only: Number() also turns ' ', '0x1' and '1e0' into valid positions.
      if (!/^\d+$/.test(id ?? '')) {
        return null;
      }
      const index = Number(id);

      return index < this.getAggregateArray(req).length ? index : null;
    }

    deleteItem(req, res) {
      const index = this.getItemIndex(req);

      if (index !== null) {
        const items = this.getAggregateArray(req).filter(
          (element, position) => position !== index
        );
        this.setAggregateArray(req, items);
      }

      res.redirect(`${req.baseUrl}${req.form.options.route}`);
    }

    updateItem(req, res) {
      const index = this.getItemIndex(req);

      if (index !== null) {
        const items = this.getAggregateArray(req);

        req.sessionModel.set('aggregator-edit-id', index);
        req.sessionModel.set('isUpdate', true);
        req.sessionModel.set('updatingIndex', index);

        items[index].fields.forEach(obj => {
          req.sessionModel.set(obj.field, obj.value);
        });

        items.splice(index, 1);
        this.setAggregateArray(req, items);
      }

      return this.redirectToAddStep(req, res, this.getAddStep(req));
    }

    addItem(req, res) {
      const items = this.getAggregateArray(req);
      const fields = [];
      const itemTitle = [];
      const aggregateLimit =
        req.form.options.aggregateLimit || config.aggregateLimits.defaultLimit;

      req.form.options.aggregateFrom.forEach(aggregateFromElement => {
        const aggregateFromField =
          aggregateFromElement.field || aggregateFromElement;
        const value = req.sessionModel.get(aggregateFromField);
        const titleField = req.form.options.titleField;
        const isTitleField = Array.isArray(titleField)
          ? titleField.includes(aggregateFromField)
          : titleField === aggregateFromField;

        if (isTitleField) {
          itemTitle.push(value);
        }

        fields.push({
          field: aggregateFromField,
          parsed: this.parseField(aggregateFromField, value, req),
          value,
          showInSummary: true,
          changeField: aggregateFromElement.changeField
        });

        this.setAggregateArray(req, items);
        req.sessionModel.unset(aggregateFromField);
      });

      const joinTitle = itemTitle.join(' ');
      const newItem = { joinTitle, fields };
      const isUpdate = req.sessionModel.get('isUpdate');
      const updatingIndex = req.sessionModel.get('updatingIndex');

      if (isUpdate) {
        items.splice(updatingIndex, 0, newItem);
      } else if (aggregateLimit) {
        if (items.length < aggregateLimit) {
          items.push(newItem);
        }
      } else {
        items.push(newItem);
      }

      req.sessionModel.unset('isUpdate');
      req.sessionModel.unset('updatingIndex');
      this.setAggregateArray(req, items);
      res.redirect(`${req.baseUrl}${req.form.options.route}`);
    }

    getAggregateArray(req) {
      const aggregateToField = req.sessionModel.get(
        req.form.options.aggregateTo
      ) || { aggregatedValues: [] };
      return aggregateToField.aggregatedValues;
    }

    setAggregateArray(req, value) {
      req.sessionModel.set(req.form.options.aggregateTo, {
        aggregatedValues: value
      });
    }

    newFieldsProvided(req) {
      let fieldsProvided = false;

      req.form.options.aggregateFrom.forEach(aggregateFromField => {
        if (req.sessionModel.get(aggregateFromField)) {
          fieldsProvided = true;
        }
      });

      return fieldsProvided;
    }

    // Optional editStepForks pick the first page when changing an item; addStep is the fallback.
    getAddStep(req) {
      const { addStep, editStepForks = [] } = req.form.options;
      const fork = editStepForks.find(
        ({ condition }) =>
          req.sessionModel.get(condition.field) === condition.value
      );

      return fork ? fork.target : addStep;
    }

    redirectToAddStep(req, res, addStep = req.form.options.addStep) {
      return res.redirect(`${req.baseUrl}/${addStep}`);
    }

    redirectToCustomAddStep(req, res) {
      return res.redirect(`${req.baseUrl}/${req.form.options.customAddStep}`);
    }

    getAction(req) {
      const noItemsPresent = this.getAggregateArray(req).length === 0;
      let action;

      if (this.newFieldsProvided(req)) {
        action = 'addItem';
      } else if (noItemsPresent) {
        action = req.form.options.customAddStep
          ? 'redirectToCustomAddStep'
          : 'redirectToAddStep';
      }

      return action || 'showItems';
    }

    // When an answer is changed from /confirm, HOF adds /edit to every page it hasn't seen yet,
    // so this page can get 'edit' with no id. Only /edit/:id means changing a saved item.
    getRequestedAction(req) {
      if (
        req.params.action === 'edit' &&
        typeof req.params.id === 'undefined'
      ) {
        return undefined;
      }
      return req.params.action;
    }

    getValues(req, res, next) {
      const action =
        this.getRequestedAction(req) || this.getAction(req, res, next);
      return this.handleAction(req, res, next, action);
    }

    handleAction(req, res, next, action) {
      switch (action) {
        case 'delete':
          this.deleteItem(req, res);
          break;
        case 'edit':
          this.updateItem(req, res);
          break;
        case 'addItem':
          this.addItem(req, res);
          break;
        case 'redirectToAddStep':
          this.redirectToAddStep(req, res);
          break;
        case 'redirectToCustomAddStep':
          this.redirectToCustomAddStep(req, res);
          break;
        case 'showItems':
        default:
          return { ...super.getValues(req, res, next), redirected: false };
      }
      return { redirected: true };
    }

    parseField(field, value, req) {
      const fieldName = field.field || field;
      const parser = req.form.options.fieldsConfig[fieldName]?.parse;
      return parser ? parser(value) : value;
    }

    locals(req, res) {
      const items = this.getAggregateArray(req);

      items.forEach((element, index) => {
        element.index = index;
      });

      return {
        ...super.locals(req, res),
        items,
        hasItems: items.length > 0,
        hasMultipleItems: items.length > 1,
        addStep: this.getAddStep(req),
        field: req.form.options.aggregateTo
      };
    }
  };
module.exports = aggregatorSaveUpdate;
