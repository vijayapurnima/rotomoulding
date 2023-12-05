import {autoinject} from 'aurelia-framework';
import {busy} from "../../resources/renderers/busy";
import {Router} from "aurelia-router";
import {AlertService} from "../../resources/services/alert";
import {OvenService} from "../../resources/services/oven";
import {LoginService} from "../../resources/services/login";


@autoinject
export class OvensIndex {
  ovens;
  factoryName;
  factoryId;
  loaded: boolean = false;

  constructor(private ovenService: OvenService,
              private alert: AlertService,
              private login: LoginService,
              private busy: busy,
              private router: Router) {

  }


  activate(params, routeConfig) {
    this.factoryName = params.values[0];
    this.factoryId = params.factory_id;
    this.getOvens(this.factoryId).then(res => {
      this.loaded=true;
    });
  }

  async getOvens(id) {
    clearInterval(parseInt(localStorage.getItem("autoSaveLoad")));
    clearInterval(parseInt(localStorage.getItem("autoSaveUnload")));
    clearInterval(parseInt(localStorage.getItem("autoSaveFinish")));
    this.busy.on();
    await this.ovenService.index(id).then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.ovens = result.content.filter(oven=>{
          if (!oven.name.match('Finish'))
          return oven;
        });
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get oven details');
      }
    });
  }


  getArms(oven){
    this.router.navigateToRoute("armsIndex",{factory_id:this.factoryId,oven_id:oven.id,values:[this.factoryName,oven.name]});
  }
}
