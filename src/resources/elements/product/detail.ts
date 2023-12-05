import {bindable} from 'aurelia-framework';
import {ValidationController, ValidationRules} from "aurelia-validation";


export class ProductDetail {
  @bindable product;
  @bindable staff;
  @bindable armId;
  @bindable runDate;
  @bindable ovenName;
  @bindable loadFlag: boolean = false;
  @bindable showFlag: boolean = true;
  @bindable validation: ValidationController;


  constructor() {

  }

  attached() {

  }


  getTime(data, previousTime) {
    data = previousTime ? (data + previousTime) : data;
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
          this.product.loaded1 = users[0];
          break;
        case 2:
          this.product.loaded2 = users[0];
          break;
        case 3:
          this.product.loaded3 = users[0];
          break;
        case 4:
          this.product.loaded4 = users[0];
          break;

      }
    }

  }

  setOperator(param) {
    var users = this.staff.filter(member => {
      if (member.staff_code == this.product[param]) return member;
    });
    if (users.length > 0) {
      switch (param) {
        case "weighed_by":
          this.product.weighed_operator = users[0];
          break
        case "load_operator":
          this.product.operator = users[0];
          break;

      }
    }

  }

  openLink() {
    var url = this.product.note_url || 'http://accentis_link.com.au/';
    window.open(url, '_blank')

  }


}
