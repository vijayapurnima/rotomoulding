import {ValidationController, ValidationRules} from "aurelia-validation";
import {bindable} from 'aurelia-framework';

export class FaultDetail {
  @bindable validation: ValidationController;
  @bindable product;
  @bindable runDate;
  @bindable staff;
  @bindable ovenName;
  @bindable faultReasons;
  @bindable reasonIds;
  @bindable faultTypes;

  constructor() {
    ValidationRules.customRule(
      'faultTypesRule',
      (value, obj) => {
        return obj["fault_types"] && obj["fault_types"].length>0
      },
      "Select atleast 1 Fault Type"
    );
    ValidationRules.customRule(
      'faultReasonRule',
      (value, obj) => {
        return obj["fault_reasons"] && obj["fault_reasons"].length>0
      },
      "Select atleast 1 Issue under 1 Fault Reason"
    );
  }

  attached() {
    if (!this.product.fault_types) this.product.fault_types = [];
    if (!this.product.fault_reasons) this.product.fault_reasons = [];

    ValidationRules
      .ensure('fault_type').satisfiesRule("faultTypesRule")
      .then()
      .ensure('fault_reason_list').satisfiesRule("faultReasonRule")
      .then()
      .ensure('prevent_action').displayName("Prevent Action").required()
      .on(this.product);

  }

  getFaultIssues(reason) {
    return this.faultReasons.filter(faultReason => {
      if (faultReason.fault_reason_name == reason) return faultReason;
    })
  }



}
