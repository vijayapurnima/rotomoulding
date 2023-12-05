import {bindable} from 'aurelia-framework';
import {ValidationController, ValidationRules} from "aurelia-validation";

export class Account {
  @bindable username;
  @bindable password;
  @bindable confirm;
  @bindable strength;
  @bindable message: string = 'Username';
  @bindable validation: ValidationController;


  attached() {
    ValidationRules
      .ensure((acc: Account) => acc.username).required().withMessage(this.message + ' is required').on(this);

  }
}
