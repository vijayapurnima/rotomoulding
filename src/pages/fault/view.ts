import {autoinject} from 'aurelia-framework';
import {UserService} from "../../resources/services/user";
import {busy} from "../../resources/renderers/busy";
import {SortValueConverter} from "../../resources/renderers/sort";
import {validateTrigger, ValidationController, ValidationControllerFactory} from "aurelia-validation";
import {BootstrapFormRenderer} from "../../resources/renderers/bootstrap-form-renderer";
import {Router} from "aurelia-router";
import {AlertService} from "../../resources/services/alert";
import {DateFormatValueConverter} from "../../resources/renderers/date-converter";
import {ProductService} from "../../resources/services/product";
import {FaultService} from "../../resources/services/fault";
import {LoginService} from "../../resources/services/login";


@autoinject
export class ViewFault {
  validation: ValidationController;
  loaded: boolean = false;
  products;
  runDate;
  ovenName;
  factoryName;
  product;
  users;
  factoryId;
  ovenId;
  woId;
  fault_types = [];
  fault_categories = [];
  fault_reasons = [];
  fault_reason_ids;
  gradings = ["Repair as 1st", "Repair as 2nd", "2nd Grade", "Scrap"];
  goToPreviousPage:Function;

  fault_fields = ['Fault_Types', 'Fault_Reason', 'Other_Faults', 'Prevent_Action', 'Action_Correct', 'Further_Training',
    'Fault_Categories', 'Fault_Grading', 'Fault_Description', 'Supervisor_ID'];

  fault_tabs = ["REASON", "SUBMIT"];
  faultIndex = 0;

  constructor(private faultService: FaultService,
              private productService: ProductService,
              private userService: UserService,
              private alert: AlertService,
              private sort: SortValueConverter,
              private login: LoginService,
              private dateConverter: DateFormatValueConverter,
              private busy: busy,
              private router: Router,
              private validationfactory: ValidationControllerFactory, private formrenderer: BootstrapFormRenderer) {

    this.validation = validationfactory.createForCurrentScope();
    this.router = router;
    this.validation.reset();
    this.validation.addRenderer(formrenderer);
    this.validation.validateTrigger = validateTrigger.changeOrBlur;

    this.goToPreviousPage=()=>{
      history.back();
    }

  }

  activate(params, routeConfig) {
    this.factoryName = params.values[0];
    this.ovenName = params.values[1];
    this.runDate = params.runDate;
    this.ovenId = params.oven_id;
    this.factoryId = params.factory_id;
    this.woId = params.woId;
    this.getStaff().then(res => {
      this.getFaultTypes().then(res => {
        this.getFaultReasons().then(res => {
          this.getFaultCategories().then(res => {
            this.getProducts().then(res => {
              this.getLoadDetails().then(res => {
                this.loaded = true;
              });
            });
          });
        });
      });
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
          if (this.product.user_id && this.product.user_id != this.login.current.id) {
            this.alert.Warning('Warning', this.product.product_code + " is currently being modified by another user", null).then(result => {
              history.back();
            });
          } else
            this.mapFaultData(this.product);
        }
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get product details');
      }
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

  async getFaultTypes() {
    this.busy.on();
    await this.faultService.get_fault_types().then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.fault_types = result.content.fault_types;

      }
    });
  }


  async getFaultReasons() {
    this.busy.on();
    await this.faultService.get_fault_reasons().then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.fault_reasons = result.content.fault_reasons;
        if (this.fault_reasons.length > 0) {
          this.fault_reason_ids = [];
          this.fault_reasons.forEach(reason => {
            if (this.fault_reason_ids.indexOf(reason.fault_reason_name) < 0 && ['<Not assigned>', null].indexOf(reason.fault_reason_name) < 0) {
              this.fault_reason_ids.push(reason.fault_reason_name);
            }
          })
        }

      }
    });
  }


  async getFaultCategories() {
    this.busy.on();
    await this.faultService.get_fault_categories().then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.fault_categories = result.content.fault_categories;
      }
    });
  }

  async getLoadDetails() {
    this.busy.on();
    await this.productService.get_load_details(this.woId).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.product.mould_locations = result.content.mould_locations;
      } else {
        this.product.mould_locations = [];
      }
    });
  }


  mapFaultData(product) {
    if (product.fault_data) {
      this.fault_fields.forEach(prop => {
        if (prop == 'Fault_Types' || prop == 'Fault_Categories') {
          if (product.fault_data[prop]) {
            product[prop.toLowerCase()] = product.fault_data[prop].split('\n');
          }
        } else if (prop == 'Action_Correct' || prop == 'Further_Training') {
          if (product.fault_data[prop]>=0) {
            product[prop.toLowerCase()] = product.fault_data[prop].toString().match("1") ? ["Yes"] : ["No"];
          }
        }
        else if (prop == 'Fault_Reason') {
          if (product.fault_data[prop]) {
            product["fault_reasons"] = [];
            var reasons = product.fault_data[prop].split('\n');
            reasons.forEach(reason => {
              var reason_detail = reason.split(" - ");
              var items = this.fault_reasons.filter(item => {
                if (item.fault_reason_name == reason_detail[0] && item.fault_reason_issue == reason_detail[1]) return item;
              });
              product["fault_reasons"].push(items[0]);
            });
          }
        } else if (prop == 'Fault_Grading') {
          product[prop.toLowerCase()] = [product.fault_data[prop]];
        }
        else
          product[prop.toLowerCase()] = product.fault_data[prop];
        if (prop.toLowerCase().match("_id")) {
          var text = prop.toLowerCase().replace("_id", "");
          var filter_user = this.users.filter(user => {
            if (user.staff_id == product.fault_data[prop]) return user;
          });
          product[text] = filter_user[0];
          product[prop.toLowerCase()] = filter_user[0] ? filter_user[0].staff_code : '';
        }
      });
    }
  }

  viewFaultScreen(index) {
    if (this.faultIndex != index) {
      this.faultIndex = this.faultIndex == 0 ? 1 : 0;
    }
    return this.faultIndex;
  }

  goBack() {
    this.saveFaultDetails().then(result => {
      if (this.faultIndex == 0) {
        this.goToPreviousPage();
      } else {
        this.faultIndex = 0;
      }
    });
  }

  viewNext() {
    this.validation.validate().then(validateResult => {
      if (validateResult.valid) {
        if (this.faultIndex == 0) {
          this.saveFaultDetails().then(result => {
            this.faultIndex = 1;
          });
        }
      }
    });
  }


  submitDetails(flag) {
    if (flag==true) {
      this.validation.validate().then(validateResult => {
        if (validateResult.valid) {
          this.saveFaultDetails().then(result => {
            this.alert.Warning('Are you sure you want to submit?', 'Product and product fault description?', null).then(result => {
              if (result) {
                this.faultSubmit();
              }
            });
          });
        }
      });
    }
    else
    {
      this.saveFaultDetails().then(result => {
        this.alert.Success('Success','Fault Details were saved successfully',null,this.goToPreviousPage);
      });
    }
  }

  constructParams(product) {
    let data = {};
    this.fault_fields.forEach((prop => {
      if (prop == 'Fault_Types' || prop == 'Fault_Categories') {
        if (product[prop.toLowerCase()]) {
          data[prop] = "";
          product[prop.toLowerCase()].forEach(type => {
            if (data[prop].length > 0) data[prop] = data[prop] + '\n';
            data[prop] = data[prop] + type;
          });
        }
      } else if (prop == 'Action_Correct' || prop == 'Further_Training') {
        if (product[prop.toLowerCase()]) {
          data[prop] = product[prop.toLowerCase()].toString().match("Yes") ? 1 : 0;
        }
      }
      else if (prop == 'Fault_Reason') {
        data[prop] = "";
        product.fault_reasons.forEach(reason => {
          if (data[prop].length > 0) data[prop] = data[prop] + '\n';
          data[prop] = data[prop] + reason.fault_reason_name + " - " + reason.fault_reason_issue;
        });
      }
      else if (prop == 'Fault_Grading') {
        data[prop] = product[prop.toLowerCase()] && product[prop.toLowerCase()].length > 0 ? product[prop.toLowerCase()][0] : "";
      } else if (prop.toLowerCase().match("_id")) {
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

  async saveFaultDetails() {
    this.busy.on();
    this.constructParams(this.product);
    let product_data = {
      work_order_id: this.product.work_order_id,
      start_date: this.runDate,
      arm_id: this.product.arm_id,
      run_number: this.product.run_id,
      fault_data: this.product.data
    };
    await this.productService.update(this.product.id, product_data).then(result => {
      this.busy.off();
      if (result.isSuccess) {

      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not set product fault details');
      }
    });

  }

  async faultSubmit() {
    this.busy.on();
    this.constructParams(this.product);
    let product_data = {
      work_order_id: this.product.work_order_id,
      start_date: this.runDate,
      arm_id: this.product.arm_id,
      run_number: this.product.run_id,
      fault_data: this.product.data
    };
    await this.productService.set_fault_data(product_data).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        history.back();
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not set product fault details');
      }
    });

  }


}
