import {ValidationController, ValidationRules} from "aurelia-validation";
import {bindable} from 'aurelia-framework';

export class SubmitFault {
  @bindable validation: ValidationController;
  @bindable product;
  @bindable staff;
  @bindable runDate;
  @bindable ovenName;
  @bindable gradings;
  @bindable faultCategories;
  flags = ["Yes", "No"];

  constructor() {

    ValidationRules.customRule(
      'staffRule',
      (value, obj) => {
        if (value && value.length==7) {
          return value && this.staff.filter(member => {
            if (member.staff_code == value) return member;
          }).length > 0;
        }
      },
      "Provide a valid Supervisor Id"
    );
    ValidationRules.customRule(
      'faultCategoryRule',
      (value, obj) => {
        return obj["fault_categories"] && obj["fault_categories"].length > 0
      },
      "Fault Category is required"
    );

    ValidationRules.customRule(
      'ItemRule',
      (value, obj,item) => {
        return obj[item] && obj[item].length > 0
      },
      "Select at least one value"
    );
  }


  attached() {
    if (!this.product.action_correct) this.product.action_correct = [];
    if (!this.product.further_training) this.product.further_training = [];
    if (!this.product.fault_grading) this.product.fault_grading = [];
    if (!this.product.fault_categories) this.product.fault_categories = [];


    ValidationRules
      .ensure('action_correct_flag').satisfiesRule("ItemRule","action_correct")
      .then()
      .ensure('further_training_flag').satisfiesRule("ItemRule","further_training")
      .then()
      .ensure('fault_categories_list').satisfiesRule("faultCategoryRule")
      .then()
      .ensure('grading').satisfiesRule("ItemRule","fault_grading")
      .then()
      .ensure('fault_description').displayName("Fault Description").required()
      .then()
      .ensure('supervisor_id').satisfiesRule('staffRule')
      .on(this.product);
  }

  setOperator() {
    if (this.product.supervisor_id.length==7) {
      var users = this.staff.filter(member => {
        if (member.staff_code == this.product.supervisor_id) return member;
      });
      if (users.length > 0) {
        this.product.supervisor = users[0];
      }
    }
    else{
      this.product.supervisor=undefined;
    }

  }

  updateAction(param, type) {
    if (this.product[param].length > 1) {
      this.product[param] = [];
      this.product[param][0] = type;
    }
  }

}
