import {autoinject, bindable} from 'aurelia-framework';
import {AlertService} from "../../resources/services/alert";
import {busy} from "../../resources/renderers/busy";
import {Router} from "aurelia-router";
import {ProductService} from "../../resources/services/product";
import {RunService} from "../../resources/services/run";
import AGStopwatch = require("agstopwatch/AGStopwatch");
import {DateFormatValueConverter} from "../../resources/renderers/date-converter";
import {LoginService} from "../../resources/services/login";
import {SortValueConverter} from "../../resources/renderers/sort";
import {runInDebugContext} from "vm";


@autoinject
export class ViewRuns {
  loaded: boolean = false;
  @bindable finishFlag: boolean = false;
  @bindable stages;
  @bindable runs = [];
  @bindable finishingList = [];
  @bindable runIds = [];
  @bindable ovenName;
  @bindable armName;
  @bindable armId;
  @bindable cookingFlag:Function;
  @bindable loadSheets: Function;
  @bindable unloadSheets: Function;
  @bindable finishProduct: Function;
  runOrderNames = ["CURRENT RUN", "NEXT RUN", "UPCOMING RUNS"];
  runFields = ["id", "run_number", "arm_id", "start_date", "status", "start_time", "end_time"];
  saveDetails: Function;
  updateStatus: Function;

  constructor(private productService: ProductService,
              private runService: RunService,
              private login: LoginService,
              private alert: AlertService,
              private dateConverter: DateFormatValueConverter,
              private sortArray: SortValueConverter,
              private busy: busy,
              private router: Router) {


    this.saveDetails = (product) => {
      this.busy.on();
      product.arm_id = this.armId;
      let product_data = {
        work_order_id: product.work_order_id,
        start_date: product.start_date,
        arm_id: this.armId,
        run_number: product.run_number,
        start_time: product.start_time,
        end_time: product.end_time,
        status: (product.status || "loading")
      };
      this.productService.update(product.id, product_data).then(result => {
        this.busy.off();
        if (result.isSuccess) {
          product.status = result.content.product.status;
        }
      });
    };

    this.updateStatus = (run) => {
      this.checkProducts(run).then(result => {
        var text = "";
        if (run.status && !run.status.match("ing")) {
          run.time = 0;
        }
        switch (run.status) {
          case "loading":
            text = "loading_paused";
            break;
          case "loading_paused":
            text = "loading";
            break;
          case "loaded":
            text = "cooking";
            break;
          case "cooking":
            text = "cooked";
            break;
          case "cooked":
            text = "cooling";
            break;
          case "cooling":
            text = "cooled";
            break;
          case "cooled":
            text = "unloading";
            break;
          case "unloading":
            text = "unloading_paused";
            break;
          case "unloading_paused":
            text = "unloading";
            break;
          default:
            text = "loading";
        }
        run.status = text;
        run.stage = this.stages[text];
        this.updateTimer(run);
        this.saveRun(run);
        this.updateDisability();
      });
    }


  }

  attached() {
    this.runIds.forEach(run => {
      if (!this.checkDisability(run)) {
        this.updateTimer(run);
      }
      this.updateDisability();
    });
  }

  getProducts(runId) {
    return this.runs.filter((run) => {
      if (run.run_number == runId.run_number && run.start_date == runId.start_date) {
        return run;
      }
    });
  }

  checkDisability(runId) {
    return (this.runIds.filter((run) => {
      if (run == runId && (run.user_id && run.user_id != this.login.current.id)) {
        return run;
      }
    }).length > 0);
  }

  checkRunStatus(run) {
    this.checkProducts(run).then(result => {
      var cooking_runs = this.runIds.filter(runId => {
        if (runId != run && runId.status && (runId.status.match("cooking") || runId.status.match("cooling"))) return runId;
      });
      console.log(cooking_runs)
      if (!this.cookingFlag() && cooking_runs.length == 0 && this.getSortedArray(this.runIds).indexOf(run) < 2) {
        this.alert.Cooking('Is this run cooking?', "Run Number:" + run.run_number, null).then(result => {
          this.viewLoadInfo(run, result);

        });
      } else {
        this.viewLoadInfo(run, null);
      }
    });
  }

  viewLoadInfo(run, alertFlag) {
    this.loadSheets(run, alertFlag);
  }


  viewUnloadInfo(run) {
    this.unloadSheets(run);
  }


  updateTimer(run) {
    if (run.status && !run.status.match("ed")) {
      if (!run.timer) {
        run.timer = new AGStopwatch();
      }
      if (!run.timer._running) {
        run.timer.start();
        run.start_time = this.dateConverter.toView(new Date(), "DD/MM/YYYY HH:mm:ss.SSS");
        run.end_time = null;
      }
    } else if (run.timer && run.timer._running) {
      run.timer.stop();
      run.time = (run.time || 0) + run.timer.elapsed;
      run.end_time = this.dateConverter.toView(new Date(), "DD/MM/YYYY HH:mm:ss.SSS");
    }
  }

  getTime(data, run, productData, productPreviousTime, productTimer) {
    if (!run.timer) {
      this.updateTimer(run);
    }
    var data = (run.status && run.status.match("paused")) ? (run.time || 0) : (data ? (data + (run.time || 0)) : (run.time || 0));
    data += (productTimer && productTimer._running) ? ((productData || 0) + (productPreviousTime || 0)) : (productPreviousTime || 0);
    var time = "";
    var seconds = Math.floor(data / 1000);
    var minute = Math.floor(seconds / 60);
    var seconds = seconds % 60;
    var hour = Math.floor(minute / 60);
    var minute = minute % 60;
    var day = Math.floor(hour / 24);
    var hour = hour % 24;

    time = hour > 0 ? time + (hour > 9 ? hour.toString() : "0" + hour.toString()) : "00";
    time = time.length > 0 ? (time + ":" + (minute > 9 ? minute.toString() : "0" + minute.toString())) : (minute > 9 ? minute.toString() : "0" + minute.toString());
    time = time + ":" + (seconds > 9 ? seconds.toString() : "0" + seconds.toString());
    return time;

  }

  async checkProducts(run) {
    await this.getProducts(run).forEach(product => {
      if (product.wo_timer && product.wo_timer._running) {
        product.wo_timer.stop();
        product.end_time = this.dateConverter.toView(new Date(), "DD/MM/YYYY HH:mm:ss.SSS");
        product.wo_time = (product.wo_time || 0) + product.wo_timer.elapsed;
        this.saveDetails(product);
      }
    })
  }

  constructParams(run) {
    let run_data = {};
    this.runFields.forEach((prop => {
      if (prop == 'arm_id') {
        run_data[prop] = this.armId;
      } else {
        run_data[prop] = run[prop];
      }
    }));
    return run_data;
  }

  saveRun(run) {
    let run_data = this.constructParams(run);
    run_data['products'] = this.getProducts(run);
    if (run.id) {
      this.updateRun(run_data);
    } else {
      this.createRun(run_data, run);
    }
  }


  async updateRun(run) {

    this.busy.on();
    await this.runService.update(run.id, run).then(result => {
      this.busy.off();
      if (!result.isSuccess) {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not update run details');
      } else {
        this.getProducts(run).forEach(run => {
          run.status = result.content.status;
        });
      }
    });
  }


  async createRun(run_data, run) {
    this.busy.on();
    await this.runService.create(run_data).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        run.id = result.content.id;
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not create run details');
      }
    });
  }

  updateDisability() {
    var cook_cool_runs = this.runIds.filter(run => {
      if (run.status && (run.status.match("cooking") || run.status.match("cooling"))) return run;
    });
    this.runIds.forEach(run => {
      run.disabled = this.checkDisability(run);
      if (cook_cool_runs.indexOf(run) < 0) {
        if (run.status) {
          run.disabled = run.disabled || ((run.status.match("loaded") || run.status.match("cooked")) ? cook_cool_runs.length > 0 : false);
        }
      }
    });
  }

  checkMouldChange(run) {
    var runIds = this.getSortedArray(this.runIds);
    if (runIds.indexOf(run) > 0) {
      var currentProducts = this.getProducts(run);
      var previousProducts = this.getProducts(runIds[runIds.indexOf(run) - 1]);
      if (currentProducts.length != previousProducts.length) {
        return true;
      } else {
        var mismatch_flag = false;
        currentProducts.forEach(product => {
          mismatch_flag = mismatch_flag || previousProducts.filter(prod => {
            if (prod.product_code == product.product_code) return prod;
          }).length == 0;
          if (mismatch_flag == true)
            return mismatch_flag;
        });
        return mismatch_flag;
      }

    }
  }

  getSortedArray(runIds) {
    var array = this.sortArray.toView(runIds, "run_date", "ascending");
    var finalArray = [];
    array.forEach(obj => {
      var sub_array = array.filter(arr => {
        if (arr.run_date == obj.run_date) return arr;
      });
      if (sub_array.length > 0 && finalArray.indexOf(sub_array[0]) < 0) {
        finalArray = finalArray.concat(this.sortArray.toView(sub_array, "run_number", "ascending"));
      }
    });
    return finalArray;
  }


}
