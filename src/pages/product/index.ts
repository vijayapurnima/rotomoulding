import {autoinject, bindable} from 'aurelia-framework';
import {DialogService} from "aurelia-dialog";
import {ViewProduct} from "./view";
import AGStopwatch = require("agstopwatch/AGStopwatch");
import {DateFormatValueConverter} from "../../resources/renderers/date-converter";
import {LoginService} from "../../resources/services/login";
import * as moment from 'moment';

@autoinject
export class ViewProducts {
  @bindable products = [];
  @bindable armId;
  @bindable runId;
  @bindable ovenName;
  @bindable armName;
  @bindable finishFlag: boolean = false;
  @bindable finishProduct: Function;
  @bindable status;
  @bindable saveDetails: Function;
  @bindable updateStatus: Function;

  timerdisableStatus = ["loaded", "cooked"];


  constructor(private dialog: DialogService, private login: LoginService, private dateConverter: DateFormatValueConverter) {

  }

  attached() {
    if (this.products.length > 1) {
      this.products.forEach(product => {
        if (this.timerdisableStatus.indexOf(product.status) < 0 && ((this.status != product.status) && product.status && !product.status.match("ed"))) {
          if (!product.wo_timer || !product.wo_timer._running) {
            product.wo_timer = new AGStopwatch();
            product.wo_timer.start();
            product.start_time = this.dateConverter.toView(new Date(), "DD/MM/YYYY HH:mm:ss.SSS");
          }
        }
      });
    }
  }

  viewProductInfo(product) {
    if (!this.finishFlag) {
      this.dialog.open({
        viewModel: ViewProduct,
        model: [this.products, product, this.armId, this.ovenName, this.status,this.armName],
        lock: false
      }).whenClosed(response => {
        clearInterval(parseInt(localStorage.getItem("autoSaveLoad")));
        if (!response.wasCancelled) {
        }
      });
    } else {
      if (!product.user_id || product.user_id == this.login.current.id) {
        this.viewFinishingDetails(product);
      }
    }
  }

  viewFinishingDetails(product) {
    if (!product.user_id || product.user_id == this.login.current.id) {
      this.finishProduct(product);
    }
  }

  updateTimer(product) {
    if (!product.user_id || this.login.current.id == product.user_id) {
      if (this.products.length > 1) {
        if (this.timerdisableStatus.indexOf(this.runId.status) < 0 && (!this.status || this.status.match("ed"))) {
          if (product.wo_timer) {
            if (product.wo_timer._running) {
              product.wo_timer.stop();
              product.end_time = this.dateConverter.toView(new Date(), "DD/MM/YYYY HH:mm:ss.SSS");
              product.wo_time = (product.wo_time || 0) + product.wo_timer.elapsed;
              product.status = (this.status && this.status.match("unload")) ? "unloading_paused" : "loading_paused";
            } else {
              product.wo_timer.start();
              product.start_time = this.dateConverter.toView(new Date(), "DD/MM/YYYY HH:mm:ss.SSS");
              product.status = (this.status && this.status.match("unload")) ? "unloading" : "loading";
              product.end_time = null;
            }
          } else {
            product.wo_timer = new AGStopwatch();
            product.wo_timer.start();
            product.start_time = this.dateConverter.toView(new Date(), "DD/MM/YYYY HH:mm:ss.SSS");
            product.status = (this.status && this.status.match("unload")) ? "unloading" : "loading";
            product.end_time = null;
          }
          this.saveDetails(product);
        }
      } else {
        this.updateStatus(this.runId);
      }
    }
  }


  getTimeFormat(data, previousTime, runningFlag, runData, runPreviousTime, runTimer) {
    var data_result = runningFlag ? ((data || 0) + (previousTime || 0)) : (previousTime || 0);
    if (this.products.length == 1 && (this.runId.stage && !this.runId.stage.match("Start")))
      data_result += (runTimer && runTimer._running) ? ((runData || 0) + (runPreviousTime || 0)) : (runPreviousTime || 0);
    if (data_result) {
      var time = "";
      var seconds = Math.floor(data_result / 1000);
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
  }

  dateSort(a, b, sortOrder) {
    let dateMomentObject1 = moment(a.start_date, "DD/MM/YYYY");
    let date1 = dateMomentObject1.toDate();
    let dateMomentObject2 = moment(b.start_date, "DD/MM/YYYY");
    let date2 = dateMomentObject2.toDate();

    if (date1 === date2) {
      return 0;
    }

    if (date1 > date2) {
      return 1 * sortOrder;
    }

    return -1 * sortOrder;
  }
}
