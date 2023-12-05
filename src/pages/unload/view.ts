import {autoinject} from 'aurelia-framework';
import {AlertService} from "../../resources/services/alert";
import {busy} from "../../resources/renderers/busy";
import {Router} from "aurelia-router";
import {MouldLocationService} from "../../resources/services/mould_location";
import {UserService} from "../../resources/services/user";
import {RunService} from "../../resources/services/run";
import {SortValueConverter} from "../../resources/renderers/sort";
import {ProductService} from "../../resources/services/product";
import {DateFormatValueConverter} from "../../resources/renderers/date-converter";
import {ValidationController, validateTrigger, ValidationControllerFactory, ValidationRules} from "aurelia-validation";
import {BootstrapFormRenderer} from "../../resources/renderers/bootstrap-form-renderer";
import AGStopwatch = require("agstopwatch/AGStopwatch");
import {LoginService} from "../../resources/services/login";


@autoinject
export class ViewUnload {
  validation: ValidationController;
  loaded: boolean = false;
  products;
  runDate;
  armId;
  runId;
  ovenName;
  armName;
  factoryName;
  product;
  users;
  factoryId;
  ovenId;
  work_order_ids;
  autoSaveHandle;
  saveDetails: Function;

  product_fields = ['Unloaded_By_1', 'Unloaded_By_2', 'Unloaded_By_3', 'Unloaded_By_4', 'Unload_Operator',
    'Unload_Date', 'Unload_Start_Time', 'Unload_End_Time', 'Unload_Time_Actual'];

  constructor(private runService: RunService,
              private productService: ProductService,
              private mouldService: MouldLocationService,
              private userService: UserService,
              private sort: SortValueConverter,
              private alert: AlertService,
              private login: LoginService,
              private dateConverter: DateFormatValueConverter,
              private busy: busy,
              private router: Router,
              private validationfactory: ValidationControllerFactory, private formrenderer: BootstrapFormRenderer) {

    this.validation = validationfactory.createForCurrentScope();
    this.router = router;
    this.validation.addRenderer(formrenderer);
    this.validation.validateTrigger = validateTrigger.changeOrBlur;


    this.saveDetails = async () => {
      this.product.arm_id = this.armId;
      this.constructParams(this.product);
      let product_data = {
        work_order_id: this.product.work_order_id,
        start_date: this.product.start_date,
        arm_id: this.armId,
        run_number: this.product.run_number,
        unload_data: this.product.data,
        start_time: this.product.start_time,
        end_time: this.product.unload_end_time
      };
      await this.productService.update(this.product.id, product_data).then(result => {
        if (result.isSuccess) {

        } else {
          if (result.response && JSON.parse(result.response).description.match("This product is currently being modified by another user")) {
            this.alert.Warning('Warning', this.product.product_code + " is currently being modified by another user", null).then(result => {
              this.viewCookScheduleList(false);

            });
          }
          else
            this.alert.Error('Error', JSON.parse(result.response).description || 'Can not set product load details');

        }
      });
    }

    ValidationRules.customRule(
      'staffRule',
      (value, obj) => {
        return value && this.users.filter(member => {
          if (member.staff_code == value) return member;
        }).length > 0;
      },
      "Invalid Staff Code"
    );


  }

  activate(params, routeConfig) {
    this.factoryName = params.values[0];
    this.ovenName = params.values[1];
    this.armName = params.values[3];
    this.armId = params.armId;
    this.runId = params.runId;
    this.ovenId = params.oven_id;
    this.factoryId = params.factory_id;
    this.work_order_ids = params.work_orders;
    this.getStaff().then(result => {
      this.getProducts().then(res => {
        if (this.product) {
          this.addValidations();
          this.autoSaveHandle = setInterval(this.saveDetails, 30000);
          localStorage.setItem("autoSaveUnload", this.autoSaveHandle);
          this.loaded = true;
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
    await this.runService.index(this.armId).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        var runs = result.content;
        runs = this.sort.toView(runs, 'product_code', 'ascending');
        if (runs.length > 0) {
          this.products = runs.filter(product => {
            if (this.work_order_ids.indexOf(product.work_order_id) >= 0 && product.status != "unloaded") {
              return product;
            }
          });
          this.products.forEach(product => {
            product.wo_time = (product.wo_time || 0) + ((product.run_time) / this.products.length);
          });

          this.products.sort().forEach(product => {
            if (!this.product) {
              if (product.grading || product.fault_data) {
                this.mapUnloadData(product);
                this.updateUnloadDetails([product]);
              } else {
                this.product = product;
              }
            }
          });
          if (this.product) {
            if (this.product.user_id && this.product.user_id != this.login.current.id) {
              this.alert.Warning('Warning', this.product.product_code + " is currently being modified by another user", null).then(result => {
                this.viewCookScheduleList(false);

              });
            }else {
              this.mapUnloadData(this.product);
              this.saveDetails();
              this.startTimer(this.product);
            }
          } else {
            if (this.products.length > 0)
              this.updateUnloadDetails(this.products);
            else
              this.viewCookScheduleList(true);
          }
        }
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get product details');
      }
    });
  }

  mapUnloadData(product) {
    if (product.unload_data) {
      this.product_fields.forEach(prop => {
        product[prop.toLowerCase()] = product.unload_data[prop];
        if (prop.toLowerCase().match("_by_") || prop.toLowerCase().match("operator")) {
          var text = "";
          if (prop.toLowerCase().match("operator")) {
            text = "operator";
          } else {
            text = prop.toLowerCase().replace("_by_", "");
          }
          var filter_user = this.users.filter(user => {
            if (user.staff_id == product.unload_data[prop]) return user;
          });
          product[text] = filter_user[0];
          product[prop.toLowerCase()] = filter_user[0] ? filter_user[0].staff_code : '';
        }
      });
    }
  }

  stopTimer(product) {
    if (product.timer && product.timer.running) {
      product.timer.stop();
      product.unload_end_time = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
      product.unload_time_actual = (product.wo_time || 0) + product.timer.elapsed;
    }
  }

  startTimer(product) {
    product.timer = new AGStopwatch();
    product.timer.start();
    product.unload_start_time = product.unload_start_time || this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    product.start_time = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS')
  }


  viewNext() {
    this.validation.validate().then(validateResult => {
      if (validateResult.valid) {
        this.stopTimer(this.product);
        this.saveDetails().then(result => {
          var currentIndex = this.products.indexOf(this.product);
          if (currentIndex == this.products.length - 1) {
            clearInterval(this.autoSaveHandle);
            this.updateUnloadDetails(this.products);
          } else {
            this.updateUnloadDetails([this.product]).then(result => {
              this.product = this.products[currentIndex + 1];
              this.product.unloaded_by_1 = this.products[currentIndex].unloaded_by_1;
              this.product.unloaded_by_2 = this.products[currentIndex].unloaded_by_2;
              this.product.unloaded_by_3 = this.products[currentIndex].unloaded_by_3;
              this.product.unloaded_by_4 = this.products[currentIndex].unloaded_by_4;
              this.product.unloaded1 = this.products[currentIndex].unloaded1;
              this.product.unloaded2 = this.products[currentIndex].unloaded2;
              this.product.unloaded3 = this.products[currentIndex].unloaded3;
              this.product.unloaded4 = this.products[currentIndex].unloaded4;
              this.product.unload_operator = this.products[currentIndex].unload_operator;
              this.product.operator = this.products[currentIndex].operator;
              this.mapUnloadData(this.product);
              this.startTimer(this.product);
              this.addValidations();
            });
          }
        });
      }
    });
  }

  goToFaultPage() {
    this.validation.validate().then(validateResult => {
      if (validateResult.valid) {
        clearInterval(this.autoSaveHandle);
        this.stopTimer(this.product);
        this.saveDetails().then(result => {
          this.router.navigateToRoute("faultView", {
            factory_id: this.factoryId,
            oven_id: this.ovenId,
            runDate: this.product.start_date,
            woId: this.product.work_order_id,
            finishFlag: true,
            values: [this.factoryName, this.ovenName, this.product.product_code + " - Unload", this.product.product_code + " - Fault > Reason"]
          });
        });
      }
    });
  }

  viewCookScheduleList(finishFlag) {
    clearInterval(this.autoSaveHandle);
    this.router.navigateToRoute("armsIndex", {
      factory_id: this.factoryId,
      oven_id: this.ovenId,
      armId: finishFlag == false ? this.armId : null,
      finishFlag: finishFlag,
      values: [this.factoryName, this.ovenName]
    });
  }


  async updateUnloadDetails(products) {
    var products_list = [];
    products.forEach(product => {
      this.constructParams(product);
      products_list.push({
        work_order_id: product.work_order_id, start_date: product.start_date,
        arm_id: this.armId, run_number: product.run_number, unload_data: product.data
      });
    });
    this.unloadProducts(products_list);
  }


  constructParams(product) {
    let data = {};
    this.product_fields.forEach((prop => {
      if (prop == 'Unload_Date') {
        data[prop] = this.dateConverter.toView(new Date(), 'DD/MM/YYYY');
      } else if (prop.toLowerCase().match("_by_") || prop.toLowerCase().match("operator")) {
        var filter_user = this.users.filter(user => {
          if (user.staff_code == product[prop.toLowerCase()]) return user;
        });
        data[prop] = filter_user[0] ? filter_user[0].staff_id : '';
      }
      else
        data[prop] = (product[prop.toLowerCase()] || '');
    }));
    product.data = data;
  }


  async unloadProducts(products_list) {
    this.busy.on();
    await this.productService.set_unload_data(products_list).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        if (products_list.length == this.products.length) {
          this.updateRun().then(result => {
            this.viewCookScheduleList(true);
          });
        }
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not set product unload details');
      }
    });
  }

  async updateRun() {
    let run_data = {};
    run_data["arm_id"] = this.armId;
    run_data["run_number"] = this.products[0].run_number;
    run_data["status"] = 'unloaded';
    run_data["products"] = this.products;
    run_data["id"] = this.runId;
    run_data["start_date"] = this.runDate;
    run_data["end_time"] = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    this.busy.on();
    await this.runService.update(this.runId, run_data).then(result => {
      this.busy.off();
      if (!result.isSuccess) {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not update run details');
      }
    });
  }

  addValidations() {
    ValidationRules
      .ensure('unloaded_by_1').satisfiesRule('staffRule')
      .then()
      .ensure('unload_operator').satisfiesRule('staffRule')
      .on(this.product)

  }


}
