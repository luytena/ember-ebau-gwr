import { get, set, action } from "@ember/object";
import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";

export const converstionTypeMapping = {
  number: Number,
  string: String,
  boolean: Boolean,
};

export default class ProjectFormFieldComponent extends Component {
  @tracked diffResolved = false;

  get componentName() {
    // Temporary fix, project-form will be replaced by model-form 
    if (this.args.inputType === "date") {
      return "model-form/date";
    }
    return `project-form/${this.args.inputType ?? "input"}`;
  }

  get showDiff() {
    if (this.args.importData) {
      const currentData = get(this.args.project, this.args.attr);
      const newData = get(this.args.importData, this.args.attr);
      return !this.diffResolved && newData && newData !== currentData;
    }
    return false;
  }

  get disableInput() {
    return (this.args.importData && !this.showDiff) || this.args.disabled;
  }

  @action
  updateProjectField(attr, eventOrValue) {
    let value = eventOrValue?.target?.value ?? eventOrValue;

    if (this.args.convertValueTo) {
      value =
        converstionTypeMapping[this.args.convertValueTo]?.(value) ?? value;
    }

    // If we supply a custom update method use this
    if (this.args.update) {
      this.args.update(attr, value);
    } else {
      set(this.args.project, attr, value);

      if (this.args.importData) {
        this.diffResolved = true;
      }
    }
  }

  get value() {
    return this.args.value ?? this.args.project?.[this.args.attr];
  }
}
