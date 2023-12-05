import {autoinject} from 'aurelia-framework';
import {AlertService} from "../../resources/services/alert";
import {busy} from "../../resources/renderers/busy";
import {Router} from "aurelia-router";
import {ProductService} from "../../resources/services/product";
import {MouldLocationService} from "../../resources/services/mould_location";
import {UserService} from "../../resources/services/user";
import {RunService} from "../../resources/services/run";
import {SortValueConverter} from "../../resources/renderers/sort";
import {DateFormatValueConverter} from "../../resources/renderers/date-converter";
import {validateTrigger, ValidationController, ValidationControllerFactory, ValidationRules} from "aurelia-validation";
import {BootstrapFormRenderer} from "../../resources/renderers/bootstrap-form-renderer";
import AGStopwatch = require("agstopwatch/AGStopwatch");
import {LoginService} from "../../resources/services/login";

@autoinject
export class ViewLoad {
  validation: ValidationController;
  loaded: boolean = false;
  products;
  armId;
  runId;
  ovenName;
  factoryName;
  armName;
  product;
  users;
  factoryId;
  ovenId;
  work_order_ids;
  alertFlag;
  runStartTime;
  runStatus;
  autoSaveHandle;

  product_fields = ['Batch_Code', 'Weighed_By', 'Bag_Count', 'Weight_Used', 'Loaded_By_1',
    'Loaded_By_2', 'Loaded_By_3', 'Loaded_By_4', 'Load_Operator', 'Load_Date',
    'Load_Start_Time', 'Load_End_Time', 'Load_Time_Actual'];

  runFields = ["id", "run_number", "arm_id", "start_date", "status"];
  saveDetails: Function;

  constructor(private runService: RunService,
              private productService: ProductService,
              private mouldService: MouldLocationService,
              private userService: UserService,
              private login: LoginService,
              private alert: AlertService,
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

    this.saveDetails = async () => {
      this.product.arm_id = this.armId;
      this.constructLoadData(this.product);
      let product_data = {
        work_order_id: this.product.work_order_id,
        start_date: this.product.start_date,
        arm_id: this.armId,
        run_number: this.product.run_number,
        load_data: this.product.data,
        start_time: this.product.start_time,
        end_time: this.product.load_end_time || this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS')
      };
      await this.productService.update(this.product.id, product_data).then(result => {
        if (result.isSuccess) {

        } else {
          if (result.response && JSON.parse(result.response).description.match("This product is currently being modified by another user")) {
            this.alert.Warning('Warning', this.product.product_code + " is currently being modified by another user", null).then(result => {
              this.viewCookScheduleList();

            });
          } else
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
    this.alertFlag = params.alertFlag;
    this.getStaff().then(result => {
      this.getProducts().then(res => {
        this.addValidations();
        this.autoSaveHandle = setInterval(this.saveDetails, 30000);
        localStorage.setItem("autoSaveLoad", this.autoSaveHandle);
        this.loaded = true;

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
            if (this.work_order_ids.indexOf(product.work_order_id) >= 0 && !product.status.match("loaded")) {
              return product;
            }
          });
          if (this.products.length == 0) {
            this.viewCookScheduleList();
          } else {
            this.products.forEach(product => {
              product.wo_time = (product.wo_time || 0) + ((product.run_time) / this.products.length);
            });
            this.product = this.products[0];
            if (this.product.user_id && this.product.user_id != this.login.current.id) {
              this.alert.Warning('Warning', this.product.product_code + " is currently being modified by another user", null).then(result => {
                this.viewCookScheduleList();

              });
            } else {
              this.runStatus = this.products[0].status;
              this.getLoadDetails(this.product);
              this.mapLoadData(this.product);
              this.saveDetails();
              this.startTimer(this.product);
            }
          }
        }
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get product details');
      }
    });
  }

  async getLoadDetails(product) {
    this.busy.on();
    await this.productService.get_load_details(product.work_order_id).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        product.components = result.content.components;
        product.mould_locations = result.content.mould_locations;
      } else {
        product.components = [];
        product.mould_locations = [];
      }
    });
  }


  stopTimer(product) {
    if (product.timer && product.timer.running) {
      product.timer.stop();
      product.load_end_time = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
      product.load_time_actual = (product.wo_time || 0) + product.timer.elapsed;
    }
  }

  startTimer(product) {
    product.timer = new AGStopwatch();
    product.timer.start();
    product.load_start_time = product.load_start_time || this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    product.start_time = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    this.runStartTime = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
  }

  viewNext() {
    this.validation.validate().then(validateResult => {
      if (validateResult.valid) {
        console.log(validateResult);
        this.stopTimer(this.product);
        this.saveDetails().then(result => {
          var currentIndex = this.products.indexOf(this.product);
          if (currentIndex == (this.products.length - 1)) {
            clearInterval(this.autoSaveHandle);
            this.updateLoadDetails();
          } else {
            this.product = this.products[currentIndex + 1];
            this.product.weighed_by = this.products[currentIndex].weighed_by;
            this.product.weighed_operator = this.products[currentIndex].weighed_operator;
            this.product.loaded_by_1 = this.products[currentIndex].loaded_by_1;
            this.product.loaded_by_2 = this.products[currentIndex].loaded_by_2;
            this.product.loaded_by_3 = this.products[currentIndex].loaded_by_3;
            this.product.loaded_by_4 = this.products[currentIndex].loaded_by_4;
            this.product.loaded1 = this.products[currentIndex].loaded1;
            this.product.loaded2 = this.products[currentIndex].loaded2;
            this.product.loaded3 = this.products[currentIndex].loaded3;
            this.product.loaded4 = this.products[currentIndex].loaded4;
            this.product.load_operator = this.products[currentIndex].load_operator;
            this.product.operator = this.products[currentIndex].operator;
            this.mapLoadData(this.product);
            this.startTimer(this.product);
            this.getLoadDetails(this.product);
            this.addValidations();
          }
        });
      }
    });
  }

  viewPrevious() {
    this.stopTimer(this.product);
    this.saveDetails().then(result => {
      var currentIndex = this.products.indexOf(this.product);
      if (currentIndex == 0) {
        clearInterval(this.autoSaveHandle);
        this.viewCookScheduleList();
      } else {
        this.product = this.products[currentIndex - 1];
        this.mapLoadData(this.product);
        this.startTimer(this.product);
        this.getLoadDetails(this.product);
      }
    });

  }

  viewCookScheduleList() {
    this.router.navigateToRoute("armsIndex", {
      factory_id: this.factoryId,
      oven_id: this.ovenId,
      armId: this.armId,
      values: [this.factoryName, this.ovenName]
    });
  }

  updateLoadDetails() {
    this.stopTimer(this.product);
    this.validation.validate().then(validateResult => {
      if (validateResult.valid) {
        this.constructParams(this.products);
      }
    });
  }

  mapLoadData(product) {
    if (product.load_data) {
      this.product_fields.forEach(prop => {
        product[prop.toLowerCase()] = product.load_data[prop];
        if (prop.toLowerCase().match("_by") || prop.toLowerCase().match("operator")) {
          var text = "";
          if (prop.toLowerCase().match("weighed_by") || prop.toLowerCase().match("operator")) {
            text = prop.toLowerCase().match("weighed_by") ? prop.toLowerCase().replace('by', "operator") : "operator";
          } else {
            text = prop.toLowerCase().replace("_by_", "");
          }
          var filter_user = this.users.filter(user => {
            if (user.staff_id == product.load_data[prop]) return user;
          });
          product[text] = filter_user[0];
          product[prop.toLowerCase()] = filter_user[0] ? filter_user[0].staff_code : '';
        }
      });
    }
  }

  constructParams(products) {
    var products_list = [];
    products.forEach(product => {
      this.constructLoadData(product);
      products_list.push({
        work_order_id: product.work_order_id,
        start_date: product.start_date,
        arm_id: this.armId,
        run_number: product.run_number,
        load_data: product.data
      });
    });
    this.loadProducts(products_list);
  }

  constructLoadData(product) {
    let data = {};
    this.product_fields.forEach((prop => {
      if (prop == 'Load_Date') {
        data[prop] = product.load_date || product.start_date;
      } else if (prop.toLowerCase().match("_by") || prop.toLowerCase().match("operator")) {
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


  async loadProducts(products_list) {
    this.busy.on();
    await this.productService.set_load_data(products_list).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.updateRun(true).then(result => {
          this.viewCookScheduleList();
        });
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not set product load details');
      }
    });
  }

  async updateRun(statusFlag) {
    let run_data = {};
    run_data["arm_id"] = this.armId;
    run_data["run_number"] = this.product.run_number;
    run_data["status"] = statusFlag ? (this.alertFlag ? 'cooking' : 'loaded') : this.runStatus;
    run_data["products"] = this.products;
    run_data["id"] = this.runId;
    run_data["start_date"] = this.product.start_date;
    if (!statusFlag) {
      run_data["start_time"] = this.runStartTime;
      run_data["end_time"] = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    } else if (this.alertFlag) {
      run_data["start_time"] = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    }else{
      run_data["end_time"] = this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS');
    }
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
      .ensure('batch_code').displayName("Batch Code").required()
      .then()
      .ensure('weighed_by').satisfiesRule('staffRule')
      .then()
      .ensure('bag_count').displayName("Bag Count").required()
      .then()
      .ensure('weight_used').displayName("Weight Used").required()
      .then()
      .ensure('loaded_by_1').satisfiesRule('staffRule')
      .then()
      .ensure('load_operator').satisfiesRule('staffRule')
      .on(this.product);
  }

}
