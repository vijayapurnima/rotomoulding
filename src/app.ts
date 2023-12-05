import {NavigationInstruction, Redirect, Router, RouterConfiguration} from "aurelia-router";
import {autoinject} from 'aurelia-framework';
import {LoginService} from "./resources/services/login";
import {HttpClient} from "aurelia-http-client";
import {busy} from "./resources/renderers/busy";
import Raven = require("raven-js");
import {EventAggregator} from 'aurelia-event-aggregator';
import environment from './environment';

@autoinject
export class App {
  router: Router;
  private client = new HttpClient();
  static inject = [busy];

  constructor(private busy: busy) {
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    this.router = router;
    config.title = 'Global';
    config.addAuthorizeStep(AuthorizeStep);
    config.addAuthorizeStep(new SentryContextStep('authorize'));
    config.addPreActivateStep(new SentryContextStep('preActivate'));
    config.addPreRenderStep(new SentryContextStep('preRender'));
    config.addPostRenderStep(new SentryContextStep('postRender'));

    config.map([
      {route: ['', 'user/login'], name: 'userLogin', moduleId: 'pages/user/login'},
      {
        route:  'factories',
        name: 'factoriesIndex',
        moduleId: 'pages/factory/index',
        settings: {auth: true,icon: 'fa fa-home', title: 'Home'},
      },
      {
        route: 'ovens',
        name: 'ovensIndex',
        moduleId: 'pages/oven/index',
        settings: {auth: true, title: 'Ovens',
          breadcrumb: [{title: 'Home', icon: 'home',page:'',name:'factoriesIndex'},{title: 'Ovens', name:'ovensIndex', identifier: true}]},
      },
      {
        route: 'arms',
        name: 'armsIndex',
        moduleId: 'pages/arm/index',
        settings: {
          auth: true,
          title: 'Arms',
          breadcrumb: [{title: 'Home', icon: 'home',page:'',name:'factoriesIndex'}, {title: 'Ovens', name:'ovensIndex', identifier: true},{title: 'Arms',name:'armsIndex', identifier: true}]
        }
      },
      {
        route: 'load',
        name: 'loadView',
        moduleId: 'pages/load/view',
        settings: {
          auth: true,
          title: 'Load',
          breadcrumb: [{title: 'Home',icon: 'home',name:'factoriesIndex'},{title: 'Ovens',name:'ovensIndex', identifier: true},{title: 'Arms',name:'armsIndex', identifier: true},{title: 'Load',name:'loadView', identifier: true}]
        },
      },
      {
        route: 'unload',
        name: 'unloadView',
        moduleId: 'pages/unload/view',
        settings: {
          auth: true,
          title: 'Unload',
          breadcrumb: [{title: 'Home',icon: 'home',name:'factoriesIndex'},{title: 'Ovens',name:'ovensIndex', identifier: true},{title: 'Arms',name:'armsIndex', identifier: true},{title: 'Unload',name:'unloadView', identifier: true}]
        },
      },
      {
        route: 'finish',
        name: 'finishingView',
        moduleId: 'pages/finishing/view',
        settings: {
          auth: true,
          title: 'Finishing',
          breadcrumb: [{title: 'Home',icon: 'home',name:'factoriesIndex'},{title: 'Ovens',name:'ovensIndex', identifier: true},{title: 'Arms',name:'armsIndex', identifier: true},{title: 'Finishing',name:'finishingView', identifier: true}]
        },
      },
      {
        route: 'fault',
        name: 'faultView',
        moduleId: 'pages/fault/view',
        settings: {
          auth: true,
          title: 'Fault',
          breadcrumb: [{title: 'Home',icon: 'home',name:'factoriesIndex'},{title: 'Ovens',name:'ovensIndex', identifier: true},{title: 'Arms',name:'armsIndex', identifier: true},{title: 'Finishing',name:'finishingView', identifier: true}]
        },
      }
    ]);
  }
  get showBreadcrumb() {
    return this.router.currentInstruction ? this.router.currentInstruction.config.settings.breadcrumb : null;
  }

  get env() {
    return environment;
  }
}

@autoinject
class AuthorizeStep {

  constructor(private login: LoginService, private busy: busy, private ea: EventAggregator) {

  }

  run(navigationInstruction, next): Promise<any> {
    if (navigationInstruction.getAllInstructions().some(i => i.config.settings.auth)) {
      if (!this.login.isLoggedIn) {
        this.busy.active = 0;
        return next.cancel(new Redirect('user/login'));
      } else {
        document.body.className = '';
        this.ea.publish("checkSessionId");
      }
    } else {
      document.body.className = "landing";
    }

    if (environment.name == 'dev') {
      document.body.className = 'dev-background';
    }

    return next();
  }

}

class SentryContextStep {
  step: string = '';

  constructor(step = 'unset') {
    this.step = step;
  }

  run(nav: NavigationInstruction, next): Promise<any> {
    Raven.setExtraContext({
      step: this.step,
      previous: (nav.previousInstruction || {fragment: 'none'}).fragment,
      current: nav.fragment
    });
    return next();
  }
}

