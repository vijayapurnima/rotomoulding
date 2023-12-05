import {bindable, inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';

@inject(Router)
export class Breadcrumb {
  router: Router;
  @bindable breadcrumbList: [{}];

  constructor(router) {
    this.router = router;
  }

  get currentRoute() {
    if (this.router.currentInstruction &&
      this.router.currentInstruction.config) {
      return this.router.currentInstruction.config.title;
    }
  }

  goToPage(item) {
    clearInterval(parseInt(localStorage.getItem("autoSaveLoad")));
    clearInterval(parseInt(localStorage.getItem("autoSaveUnload")));
    clearInterval(parseInt(localStorage.getItem("autoSaveFinish")));
    if (item.identifier && this.router.currentInstruction.queryParams) {
        this.router.navigateToRoute(item.name, this.router.currentInstruction.queryParams)
    }
    else {
      this.router.navigateToRoute(item.name)
    }
  }
  getData(index){
    return (index!=0)?(this.router.currentInstruction.queryParams.values[index-1]):"Home";
  }

}
