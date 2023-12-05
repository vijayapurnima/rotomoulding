import {validationMessages, ValidationRules, ValidationController} from 'aurelia-validation'
import {bindable} from 'aurelia-framework'

export class Password {

  @bindable password: string;
  @bindable validation: ValidationController;

  constructor() {

    validationMessages[('pass-required')] = "Password is required";

    ValidationRules
      .ensure('password')
      .required().withMessageKey('pass-required')
      .on(this);

  }

  attached() {
  }


  onChange() {
    return this.validation.validate();
  }

}
