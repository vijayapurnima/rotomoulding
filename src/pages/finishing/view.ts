import {autoinject} from 'aurelia-framework';
import {busy} from "../../resources/renderers/busy";
import {AlertService} from "../../resources/services/alert";
import {Router} from "aurelia-router";
import {MouldLocationService} from "../../resources/services/mould_location";
import {UserService} from "../../resources/services/user";
import {SortValueConverter} from "../../resources/renderers/sort";
import {ProductService} from "../../resources/services/product";
import {validateTrigger, ValidationController, ValidationControllerFactory} from "aurelia-validation";
import {BootstrapFormRenderer} from "../../resources/renderers/bootstrap-form-renderer";
import AGStopwatch = require("agstopwatch/AGStopwatch");
import {DateFormatValueConverter} from "../../resources/renderers/date-converter";
import {LoginService} from "../../resources/services/login";
import {textMarkup} from "sweetalert/typings/modules/markup";


@autoinject
export class FinishingProduct {
  validation: ValidationController;
  loaded: boolean = false;
  runDate;
  woId;
  ovenName;
  armName;
  factoryName;
  product;
  users;
  factoryId;
  ovenId;
  grading;
  product_fields = ['QA_Checklist', 'Product_Note_Mod', 'Test_Result', 'Rework_Description', 'Finished_By_1', 'Finished_By_2',
    'Finish_Date', 'Finish_Start_Time', 'Finish_End_Time', 'Finish_Time_Actual'];
  autoSaveFinish;
  saveFinishData: Function;

  constructor(private productService: ProductService,
              private mouldService: MouldLocationService,
              private userService: UserService,
              private alert: AlertService,
              private login: LoginService,
              private sort: SortValueConverter,
              private dateConverter: DateFormatValueConverter,
              private busy: busy,
              private router: Router,
              private validationfactory: ValidationControllerFactory, private formrenderer: BootstrapFormRenderer) {

    this.validation = validationfactory.createForCurrentScope();
    this.router = router;
    this.validation.reset();
    this.validation.addRenderer(formrenderer);
    this.validation.validateTrigger = validateTrigger.changeOrBlur;

    this.saveFinishData = async () => {
      this.constructFinishParams(this.product);
      let product_data = {
        work_order_id: this.product.work_order_id,
        start_date: this.runDate,
        arm_id: this.product.arm_id,
        run_number: this.product.run_id,
        status: "unloaded",
        finish_data: this.product.data,
        start_time: this.product.start_time,
        end_time: this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS')
      };
      await this.productService.update(this.product.id, product_data).then(result => {
        if (result.isSuccess) {
        } else {
          if (result.response && JSON.parse(result.response).description.match("This product is already finished") || JSON.parse(result.response).description.match("This product is currently being modified by another user")) {
            var text = JSON.parse(result.response).description.match("This product is already finished") ? " is already finished" : " is currently being modified by another user";
            this.alert.Warning('Warning', this.product.product_code + text, null).then(result => {
              this.viewCookScheduleList(true);

            });
          } else
            this.alert.Error('Error', JSON.parse(result.response).description || 'Can not update product details');
        }
      });
    }


  }


  activate(params, routeConfig) {
    this.factoryName = params.values[0];
    this.ovenName = params.values[1];
    this.armName = params.values[3];
    this.runDate = params.runDate;
    this.ovenId = params.oven_id;
    this.factoryId = params.factory_id;
    this.woId = params.woId;
    this.getStaff().then(result => {
      this.getProducts().then(res => {
        if (!this.grading || this.grading != "Scrap") {
          this.autoSaveFinish = setInterval(this.saveFinishData, 30000);
          localStorage.setItem("autoSaveFinish", this.autoSaveFinish);
          this.getFinishingData().then(res => {
            this.getFinishPackaging().then(res => {
              this.getQualityChecklist().then(res => {
                this.loaded = true;
              });
            });
          });
        }
      });
    });
  }

  async getStaff() {
    this.busy.on();
    await this.userService.get_staff().then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.users = result.content;
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get staff members list');
      }
    });
  }

  async getProducts() {
    this.busy.on();
    await this.productService.index(this.woId).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        var products = result.content;
        if (products.length > 0) {
          this.product = products[0];
          this.grading = this.product.grading;
          if ((this.product.user_id && this.product.user_id != this.login.current.id) || (this.product.grading == 'Scrap') || this.product.finish_flag) {
            var text = (this.product.user_id && this.product.user_id != this.login.current.id) ? " is currently being modified by another user" : " is already finished";
            this.alert.Warning('Warning', this.product.product_code + text, null).then(result => {
              this.viewCookScheduleList(true);

            });
          } else {
            this.mapFinishData(this.product);
            this.saveFinishData();
            this.startTimer(this.product);
          }
        }
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get product details');
      }
    });
  }

  mapFinishData(product) {
    if (product.grading) {
      product.fault_grading = product.grading;
    }
    if (product.finish_data) {
      this.product_fields.forEach(prop => {
        if (prop == "Test_Result" && product.finish_data[prop]) {
          var image_result = product.finish_data[prop].toString();
          image_result = image_result.split('\n');
          if (image_result.length > 0) {
            product.image_data = [];
            image_result.forEach(data => {
              data = data.replace("Thickness", "").replace("=", ":");
              var data_items = data.split(":");
              product.image_data[data_items[0].charCodeAt(0) + data_items[0].substring(1, 2)] = data_items[1];
            });
          }
        } else
          product[prop.toLowerCase()] = product.finish_data[prop];
        if (prop.toLowerCase().match("_by_")) {
          var text = prop.toLowerCase().replace("_by_", "");
          var filter_user = this.users.filter(user => {
            if (user.staff_id == product.finish_data[prop]) return user;
          });
          product[text] = filter_user[0];
          product[prop.toLowerCase()] = filter_user[0] ? filter_user[0].staff_code : '';
        }
      });
    }

  }


  async getFinishingData() {
    this.busy.on();
    await this.productService.get_finishing_data(this.woId).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.product.finishing_data = result.content.finishing_data;
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get product finishing data details');
      }
    });
  }

  async getFinishPackaging() {
    this.busy.on();
    await this.productService.get_finish_packaging(this.woId).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.product.finish_package = result.content.finish_package;
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get product finishing package details');
      }
    });
  }

  async getQualityChecklist() {
    this.busy.on();
    await this.productService.get_quality_checklist(this.woId).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.product.quality_list = result.content.quality_list;
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get product finishing package details');
      }
    });
  }


  constructFinishParams(product) {
    let data = {};
    this.product_fields.forEach((prop => {
      if (prop == 'Finish_Date') {
        var end_date = product.unload_data ? product.unload_data.unload_end_time : new Date();
        data[prop] = product.finish_date || this.dateConverter.toView(end_date, 'DD/MM/YYYY');
      } else if (prop == 'Test_Result') {
        data[prop] = "";
        if (product.image_data && product.image_data.length > 0) {
          product.image_data.forEach((image_item,index) => {
            if (image_item && image_item > 0) {
              if (data[prop].length > 0) data[prop] = data[prop] + '\n';
              var column = String.fromCharCode(index.toString().substring(0, 2));
              var row = index.toString().replace(index.toString().substring(0, 2), "");
              data[prop] = data[prop] + ("Thickness" + column + row + "=" + image_item.toString());
            }
          })
        }
      }
      else if (prop == 'QA_Checklist') {
        data[prop] = "";
        if (this.product.quality_list) {
          var mark_items = this.product.quality_list.filter(qa_item => {
            if (qa_item.isOkChecked || qa_item.isNoChecked) return qa_item;
          });
          mark_items.forEach(item => {
            var value = item.isOkChecked ? "Yes" : "No";
            if (data[prop].length > 0) {
              data[prop] = data[prop] + '\n';
            }
            data[prop] = data[prop] + (item.qa_checklist_name + '(' + item.qa_checklist_id + '):' + value)
          })
        } else {
          data[prop] = this.product[prop.toLowerCase()] || "";
        }
      } else if (prop.toLowerCase().match("_by_")) {
        var filter_user = this.users.filter(user => {
          if (user.staff_code == product[prop.toLowerCase()]) return user;
        });
        data[prop] = filter_user[0] ? filter_user[0].staff_id : '';
      }
      else
        data[prop] = product[prop.toLowerCase()] || '';
    }));
    product.data = data;
  }


  stopTimer(product) {
    if (product.wo_timer && product.wo_timer.running) {
      product.wo_timer.stop();
      product.finish_end_time = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
      product.finish_time_actual = (product.wo_time || 0) + product.wo_timer.elapsed;
    }
  }

  startTimer(product) {
    product.wo_timer = new AGStopwatch();
    product.wo_timer.start();
    product.start_time = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    product.finish_start_time = product.finish_start_time || this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
  }


  saveDetails() {
    this.saveFinishData().then(result => {
      this.viewCookScheduleList(true);
    });
  }


  viewCookScheduleList(finishFlag) {
    this.router.navigateToRoute("armsIndex", {
      factory_id: this.factoryId,
      oven_id: this.ovenId,
      finishFlag: finishFlag,
      values: [this.factoryName, this.ovenName]
    });
  }


  goToFaultPage() {
    if (!this.product.grading) {
      clearInterval(this.autoSaveFinish);
      this.saveFinishData().then(result => {
        this.router.navigateToRoute("faultView", {
          factory_id: this.factoryId,
          oven_id: this.ovenId,
          runDate: this.runDate,
          woId: this.product.work_order_id,
          finishFlag: true,
          values: [this.factoryName, this.ovenName, this.product.product_code + " - Finishing", this.product.product_code + " - Fault > Reason"]
        });
      });
    }
  }

  submitDetails() {
    this.validation.validate().then(validateResult => {
      if (validateResult.valid) {
        this.saveFinishData().then(result => {
          this.alert.Warning('Are you sure you want to submit?', 'Product finishing and checklist', null).then(result => {
            if (result) {
              this.stopTimer(this.product);
              this.saveFinishData().then(result => {
                clearInterval(this.autoSaveFinish);
                this.finishProductSubmit();
              });
            }
          });
        });
      }
    });
  }

  async finishProductSubmit() {
    this.constructFinishParams(this.product);
    let product_data = {
      work_order_id: this.product.work_order_id,
      start_date: this.runDate,
      arm_id: this.product.arm_id,
      run_number: this.product.run_id,
      finish_data: this.product.data
    };
    this.busy.on();
    await this.productService.set_finish_data(product_data).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        history.back();
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not update product finish details');
      }
    });
  }


}
