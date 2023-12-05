import {bindable} from 'aurelia-framework';
import {ValidationController} from "aurelia-validation";


export class QualityChecklist {
  @bindable product;
  @bindable validation: ValidationController;

  constructor() {

  }

  attached() {
    if (this.product.qa_checklist) {
      this.product.quality_list.forEach(item => {
        var text = item.qa_checklist_name + "(" + item.qa_checklist_id + ")";
        if (this.product.qa_checklist.indexOf(text+":Yes") >= 0) {
          item.isOkChecked=true;
        }else if (this.product.qa_checklist.indexOf(text+":No") >= 0) {
          item.isNoChecked=true;
        }
      });
    }
  }

  updateCheckbox(item, code) {
    switch (code) {
      case "OK":
        if (item.isOkChecked) {
          item.isNoChecked = false;
        }
        break;
      case "NO":
        if (item.isNoChecked) {
          item.isOkChecked = false;
        }
        break;
    }
  }
}
