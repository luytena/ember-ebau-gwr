import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { Changeset } from "ember-changeset";
import lookupValidator from "ember-changeset-validations";
import { dropTask } from "ember-concurrency-decorators";
import { statusValidation } from "ember-ebau-gwr/validations/status";

export default class ModelFormHeaderStatusSelectorComponent extends Component {
  @service intl;

  @tracked errors = [];
  @tracked changeErrors = [];
  @tracked correctionErrors = [];
  @tracked changesetChange;
  @tracked isChange;
  @tracked modelStatus;
  @tracked newStatus;

  constructor(...args) {
    super(...args);
    const statusValidationsChange = statusValidation(this.args.modelName, true);
    this.changesetChange = new Changeset(
      this.args.model,
      lookupValidator(statusValidationsChange),
      statusValidationsChange
    );
    const statusValidationsCorrection = statusValidation(
      this.args.modelName,
      false
    );
    this.changesetCorrection = new Changeset(
      this.args.model,
      lookupValidator(statusValidationsCorrection),
      statusValidationsCorrection
    );

    this.modelStatus = this.args.model[this.args.modelStatusField];
    this.newStatus = this.modelStatus;
  }

  @action
  statusUpdate(value) {
    this.resetErrors();
    this.newStatus = value;
  }

  get statusOptions() {
    return this.args.modelStatusOptions.map((option) => ({
      status: option,
      label: this.intl.t(
        `ember-gwr.lifeCycles.${this.args.modelName}.statusOptions.${option}`
      ),
    }));
  }

  get isValidStatusChange() {
    return this.args.nextValidStates.includes(this.newStatus);
  }

  @action
  resetErrors() {
    this.changeErrors = [];
    this.errors = [];
    this.correctionErrors = [];
  }

  @dropTask
  *submit(isConfirmation, isChange) {
    this.isChange = isChange;
    this.resetErrors();

    const parameters = isChange
      ? this.changeParameters
      : this.correctionParameters;

    // if parameters are needed, only submit on confirmation
    if (parameters.length && !isConfirmation) {
      return;
    }

    const errorsField = !parameters.length
      ? "errors"
      : isChange
      ? "changeErrors"
      : "correctionErrors";

    const changeset = isChange
      ? this.changesetChange
      : this.changesetCorrection;

    // TODO: should be able to limit keys that dirty changeset
    //const fields = parameters.map((parameter) => parameter.field);
    //changeset = changeset.cast([ ...fields, this.args.modelStatusField ]);

    changeset.set(this.args.modelStatusField, this.newStatus);
    yield changeset.validate();
    if (changeset.isInvalid) {
      this[errorsField] = [
        this.intl.t("ember-gwr.components.modelForm.validationError"),
      ];

      return;
    }

    if (isChange) {
      // changeset.save does not seem to apply the changes
      // of the status field to the model
      this.args.model[this.args.modelStatusField] = this.newStatus;
    }
    yield changeset.save();

    try {
      yield isChange
        ? this.args.onStatusChange.perform(this.modelStatus, this.newStatus)
        : this.args.onStatusCorrection.perform(this.newStatus);

      this.modelStatus = this.newStatus;
    } catch (error) {
      this[errorsField] = error;
    }
  }

  get changeParameters() {
    return this.args.getChangeParameters(this.modelStatus, this.newStatus);
  }

  get correctionParameters() {
    return this.args.getCorrectionParameters(this.newStatus);
  }
}
