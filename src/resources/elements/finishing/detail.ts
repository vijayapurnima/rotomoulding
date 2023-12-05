import {bindable} from 'aurelia-framework';
import {ValidationController, ValidationRules} from "aurelia-validation";


export class FinishingDetail {
  @bindable validation: ValidationController;
  @bindable product;
  @bindable staff;
  @bindable runDate;
  @bindable ovenName;
  @bindable armName;
  @bindable loadFlag: boolean = false;

  constructor() {

    ValidationRules.customRule(
      'staffRule',
      (value, obj) => {
        return value && this.staff.filter(member => {
          if (member.staff_code == value) return member;
        }).length > 0;
      },
      "Invalid Staff Code"
    );
  }

  attached() {
    ValidationRules
      .ensure('qa_checklist').satisfies((value, obj) => {
      var marked_items = this.product.quality_list.filter(qa_item => {
        if (qa_item.isOkChecked || qa_item.isNoChecked) return qa_item;
      });
      return marked_items.length == this.product.quality_list.length;
    }).withMessage('Quality Checklist is incomplete')
      .then()
      .ensure('product_note_mod').satisfies((value, obj) => {
      var product_notes = this.product.quality_list.filter(qa_item => {
        if (qa_item.qa_checklist_name.match("Product Notes") || qa_item.qa_checklist_name.match("Production Notes")) return qa_item;
      });
      return (product_notes.length > 0) ? (product_notes[0].isNoChecked == true && value) : true;
    }).withMessage('Product Notes is required')
      .then()
      .ensure('finished_by_1').satisfiesRule('staffRule')
      .on(this.product);
  }

  getTime(data,previousTime) {
    data=previousTime?(data+previousTime):data;
    var time = "";
    var seconds = Math.floor(data / 1000);
    var minute = Math.floor(seconds / 60);
    var seconds = seconds % 60;
    var hour = Math.floor(minute / 60);
    var minute = minute % 60;
    var day = Math.floor(hour / 24);
    var hour = hour % 24;

    time = hour > 0 ? time + (hour > 9 ? hour.toString() : "0" + hour.toString()) : time;
    time = time.length > 0 ? (time + ":" + (minute > 9 ? minute.toString() : "0" + minute.toString())) : (minute > 9 ? minute.toString() : "0" + minute.toString());
    time = time + ":" + (seconds > 9 ? seconds.toString() : "0" + seconds.toString());
    return time;
  }


  getStaffName(index, value) {
    var users = this.staff.filter(member => {
      if (member.staff_code == value) return member;
    });
    if (users.length > 0) {
      switch (index) {
        case 1:
          this.product.finished1 = users[0];
          break;
        case 2:
          this.product.finished2 = users[0];
          break;

      }
    }

  }

  setOperator() {
    var users = this.staff.filter(member => {
      if (member.staff_code == this.product.finish_operator) return member;
    });
    if (users.length > 0) {
      this.product.operator = users[0];
    }

  }

  openLink(){
    var url=this.product.note_url || 'http://accentis_link.com.au/';
    window.open(url, '_blank')

  }

}
