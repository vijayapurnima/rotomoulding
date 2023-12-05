import {autoinject} from 'aurelia-framework';
import {busy} from "../../resources/renderers/busy";
import {Router} from "aurelia-router";
import {AlertService} from "../../resources/services/alert";
import {FactoryService} from "../../resources/services/factory";
import {LoginService} from "../../resources/services/login";


@autoinject
export class FactoriesIndex {
  factories;
  loaded: boolean = false;

  constructor(private factoryService: FactoryService,
              private alert: AlertService,
              private login: LoginService,
              private busy: busy,
              private router: Router) {

  }

  attached() {
    clearInterval(parseInt(localStorage.getItem("autoSaveLoad")));
    clearInterval(parseInt(localStorage.getItem("autoSaveUnload")));
    clearInterval(parseInt(localStorage.getItem("autoSaveFinish")));
    this.getFactories().then(result=>{
      this.loaded = true;
    });
  }

  async getFactories() {
    this.busy.on();
    await this.factoryService.index().then(result => {
      this.busy.off();
      if (result.isSuccess) {
        this.factories = result.content;
      } else {
        this.alert.Error('Error', JSON.parse(result.response).description || 'Can not get Factory details');
      }
    });
  }

  getOvens(factory){
    this.router.navigateToRoute("ovensIndex",{factory_id:factory.id,values:[factory.name]});
  }

}
