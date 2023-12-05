import {autoinject} from 'aurelia-framework';
import {busy} from "../../resources/renderers/busy";
import {Router} from "aurelia-router";
import {AlertService} from "../../resources/services/alert";
import {ArmService} from "../../resources/services/arm";
import {ProductService} from "../../resources/services/product";


@autoinject
export class ArmsIndex {
  arms;
  loaded: boolean = false;
  ovenName;
  factoryName;
  armName;
  armId;
  armCooking;
  ovenId;
  factoryId;
  tabWidth;
  runs;
  runIds = [];
  loadSheets: Function;
  unloadSheets: Function;
  finishingProduct: Function;
  getWorkOrderIds: Function;
  getCookingFlag: Function;
  finishFlag: boolean = false;
  finishingList = [];
  stages = {
    loading_paused: 'Continue Load', loading: 'Stop Load', loaded: 'Start Cook', cooking: 'Stop Cook',
    cooked: 'Start Cool', cooling: 'Stop Cool', cooled: 'Start Unload', unloading: 'Stop Unload',
    unloading_paused: 'Continue Unload'
  };

  constructor(private armService: ArmService,
              private productService: ProductService,
              private alert: AlertService,
              private busy: busy,
              private router: Router) {

    this.getWorkOrderIds = (runID) => {
      var work_orders = [];
      this.runs.forEach(run => {
        if (run.run_number == runID.run_number && run.start_date == runID.start_date) work_orders.push(run.work_order_id);
      });
      return work_orders;
    }


    this.loadSheets = (run, flag) => {
      this.router.navigateToRoute("loadView", {
        factory_id: this.factoryId,
        oven_id: this.ovenId,
        armId: this.armId,
        runId: run.id,
        alertFlag: flag,
        work_orders: this.getWorkOrderIds(run),
        values: [this.factoryName, this.ovenName,"Loading", this.armName]
      });
    }


    this.unloadSheets = (run) => {
      this.router.navigateToRoute("unloadView", {
        factory_id: this.factoryId,
        oven_id: this.ovenId,
        armId: this.armId,
        runId: run.id,
        work_orders: this.getWorkOrderIds(run),
        values: [this.factoryName, this.ovenName,"Unloading", this.armName]
      });
    }

    this.finishingProduct = (run) => {
      this.router.navigateToRoute("finishingView", {
        factory_id: this.factoryId,
        oven_id: this.ovenId,
        runDate: run.start_date,
        woId: run.work_order_id,
        finishFlag: true,
        values: [this.factoryName, this.ovenName,run.product_code + " - Finishing",run.armName]
      });
    }

    this.getCookingFlag=()=>{
      return this.arms.filter(arm => {
        if (arm.runIds && arm.runIds.length>0){
          if (arm.runIds.filter(runId => {
            if (runId.status=="cooking") return runId;
          }).length > 0) return arm;
        }else{
          if (arm.runs.filter(run => {
            if (run.status=="cooking") return run;
          }).length > 0) return arm;
        }
      }).length > 0;
    }
  }


  activate(params, routeConfig) {
    clearInterval(parseInt(localStorage.getItem("autoSaveLoad")));
    clearInterval(parseInt(localStorage.getItem("autoSaveUnload")));
    clearInterval(parseInt(localStorage.getItem("autoSaveFinish")));
    this.factoryName = params.values[0];
    this.ovenName = params.values[1];
    this.ovenId = params.oven_id;
    this.factoryId = params.factory_id;
    this.armId = params.armId;
    this.finishFlag = (params.finishFlag == "true");
    this.getArms(this.ovenId).then(res => {
      this.loaded = true;
    });
  }

  async getArms(id) {
    this.busy.on();
    await this.armService.index(id).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.arms = result.content;
        this.arms.forEach(arm => {
          if (arm.finishing_list && arm.finishing_list.length > 0) {
            arm.finishing_list.forEach(finish_item => {
              finish_item.armName = arm.name;
            });
            this.finishingList = this.finishingList.concat(arm.finishing_list);
          }
        });
        this.tabWidth = (100 / (1 + this.arms.length));
        if (this.arms.length == 0 || this.finishFlag == true) {
          if (this.arms.length == 0) {
            this.finishFlag = true;
            this.alert.Warning('Warning', this.ovenName + ' doesnot have Arms', null, this.goBack);
          }
        }
        else if (this.finishFlag == false) {
          if (this.armId) {
            var armsList = this.arms.filter(arm => {
              if (arm.id == this.armId) return arm;
            });
            if (armsList.length > 0) {
              this.mapRuns(armsList[0]);
            }
          } else {
            this.arms.forEach(arm => {
              if (this.arms.indexOf(arm) == 0) {
                this.mapRuns(arm);
              }
            });
          }
        }
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get arm details');
      }
    });
  }

  goBack() {
    history.back();
  }

  viewArm(id) {
    this.mapPreviousRuns();
    if (id != -1) {
      if (document.getElementById("arm_" + id).className != "active") {
        this.finishFlag = false;
        document.getElementById("finishing_list").className = "";
        this.arms.forEach(arm => {
          document.getElementById("arm_" + arm.id).className = (arm.id == id) ? "active" : "";
          if (arm.id == id) {
            this.mapRuns(arm);
          }
        });
      }
    }
    else {
      this.arms.forEach(arm => {
        document.getElementById("arm_" + arm.id).className = "";
      });
      document.getElementById("finishing_list").className = "active";
      this.finishFlag = true;
    }
  }

  mapRuns(arm) {
    this.runs = [];
    this.runIds = arm.runIds || [];
    this.runs = arm.runs;
    if (this.runIds && this.runIds.length == 0) {
      this.runs.forEach(run => {
        if (this.runIds.filter(runId => {
          if (runId.run_number == run.run_number && runId.start_date == run.start_date) return runId;
        }).length == 0) {
          this.runIds.push({
            id: run.id,
            run_number: parseInt(run.run_number),
            status: run.run_status,
            start_date: run.start_date,
            run_date: run.run_date,
            stage: this.stages[run.run_status] || 'Start Load',
            time: run.run_time,
            timer: run.timer
          })
        }
      });
      arm.runIds= this.runIds;
    }
    if (this.runIds.length == 0) this.runIds = [{run_number: -1}, {run_number: -2}, {run_number: -3}];
    this.armName = arm.name;
    this.armId = arm.id;
  }

  mapPreviousRuns() {
    var arms=this.arms.filter(arm => {
      if (arm.id == this.armId && arm.name == this.armName) return arm;
    })
    if (arms.length>0 && this.runs) {
      this.runs.forEach(run => {
        arms[0].runIds = this.runIds;
      });
    }
  }



}
