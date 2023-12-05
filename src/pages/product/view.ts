import {autoinject} from 'aurelia-framework';
import {Router} from "aurelia-router";
import {AlertService} from "../../resources/services/alert";
import {busy} from "../../resources/renderers/busy";
import {DialogController} from "aurelia-dialog";
import {ProductService} from "../../resources/services/product";
import {UserService} from "../../resources/services/user";
import {DateFormatValueConverter} from "../../resources/renderers/date-converter";
import {validateTrigger, ValidationController, ValidationControllerFactory} from "aurelia-validation";
import {BootstrapFormRenderer} from "../../resources/renderers/bootstrap-form-renderer";


@autoinject
export class ViewProduct {
  static inject = [DialogController];
  validation: ValidationController;
  controller: DialogController;
  products;
  product;
  armId;
  ovenName;
  armName;
  users;
  saveDetails: Function;
  autoSaveHandle;
  runStatus;
  showFields;
  product_fields = ['Batch_Code', 'Weighed_By', 'Bag_Count', 'Weight_Used', 'Loaded_By_1',
    'Loaded_By_2', 'Loaded_By_3', 'Loaded_By_4', 'Load_Operator', 'Load_Date',
    'Load_Start_Time', 'Load_End_Time', 'Load_Time_Actual'];

  constructor(controller: DialogController,
              private busy: busy,
              private alert: AlertService,
              private productService: ProductService,
              private router: Router,
              private userService: UserService,
              private dateConverter: DateFormatValueConverter,
              private validationfactory: ValidationControllerFactory, private formrenderer: BootstrapFormRenderer) {
    this.controller = controller;
    this.validation = validationfactory.createForCurrentScope();
    this.validation.reset();
    this.validation.addRenderer(formrenderer);
    this.validation.validateTrigger = validateTrigger.changeOrBlur;

    this.saveDetails = async () => {
      this.product.arm_id = this.armId;
      this.constructLoadData(this.product);
      let product_data = {
        work_order_id: this.product.work_order_id,
        start_date: this.product.start_date,
        status: this.product.status || 'loading',
        arm_id: this.armId,
        run_number: this.product.run_number,
        load_data: this.product.data,
        start_time: this.product.start_time,
        end_time: this.product.load_end_time || this.dateConverter.toView(new Date(), 'DD/MM/YYYY HH:mm:ss.SSS')
      };
      await this.productService.update(this.product.id, product_data).then(result => {
        if (result.isSuccess) {
          this.product.load_data = result.content.product.load_data;
        } else {
          if (result.response && JSON.parse(result.response).description.match("This product is currently being modified by another user")) {
            this.alert.Warning('Warning', this.product.product_code + " is currently being modified by another user", null).then(result => {
              this.controller.cancel();
            });
          }
          this.alert.Error('Error', JSON.parse(result.response).description || 'Can not set product load details');
        }
      });
    }
  }

  activate(objects) {
    this.products = objects[0];
    this.product = objects[1];
    this.armId = objects[2];
    this.ovenName = objects[3];
    this.runStatus = objects[4];
    this.armName = objects[5];
    this.showFields = (!this.runStatus || this.runStatus.match("loading"));
    this.getLoadDetails(this.product).then(result => {
      if (this.showFields) {
        this.getStaff().then(result => {
          this.mapLoadData(this.product);
          this.autoSaveHandle = setInterval(this.saveDetails, 30000);
          localStorage.setItem("autoSaveLoad", this.autoSaveHandle);
        });
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


  async getLoadDetails(product) {
    this.busy.on();
    await this.productService.get_load_details(product.work_order_id).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        product.mould_locations = result.content.mould_locations;
        product.components = result.content.components;
      } else {
        product.mould_locations = [];
        product.components = [];
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
    } else {
      this.saveDetails();
    }
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

  viewNext() {
    if (this.showFields) {
      this.saveDetails().then(result => {
        var currentIndex = this.products.indexOf(this.product);
        if (currentIndex == this.products.length - 1) {
          this.controller.cancel();
        } else {
          this.product = this.products[currentIndex + 1];
          this.mapLoadData(this.product);
          this.getLoadDetails(this.product);
        }
      });
    }
    else {
      var currentIndex = this.products.indexOf(this.product);
      this.product = this.products[currentIndex + 1];
      this.getLoadDetails(this.product);
    }
  }

  viewPrevious() {
    if (this.showFields) {
      this.saveDetails().then(result => {
        var currentIndex = this.products.indexOf(this.product);
        this.product = this.products[currentIndex - 1];
        this.mapLoadData(this.product);
        this.getLoadDetails(this.product);
      });
    }
    else {
      var currentIndex = this.products.indexOf(this.product);
      this.product = this.products[currentIndex - 1];
      this.getLoadDetails(this.product);
    }
  }

}
