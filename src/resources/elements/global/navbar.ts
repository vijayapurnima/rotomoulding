import {autoinject, bindable} from 'aurelia-framework';
import {LoginService} from "../../services/login";
import {Router} from "aurelia-router";
import {EventAggregator} from "aurelia-event-aggregator";

@autoinject
export class Navbar {

  count = 0;
  @bindable breadcrumbs;
  @bindable routerDetails;
  @bindable env;
  logoutOption = false;
  checkSessionId:Function;
  autoSessionCheck;

  constructor(private login: LoginService, private router: Router, private ea: EventAggregator) {
    let subscription = this.ea.subscribe('checkSessionId', response => {
      if (!localStorage.getItem("autoSessionCheck")) {
        this.autoSessionCheck = setInterval(this.checkSessionId, 240000);
        localStorage.setItem("autoSessionCheck", this.autoSessionCheck);
      }
      this.checkSessionId();
    });


    this.checkSessionId=()=> {
      if (this.login.current) {
        return this.login.validateSession().then(success => {
          if (success.isSuccess) {
          } else {
            this.signOut()
          }
        })
          .catch(error => {
            console.log('validateSession error', error);
            this.signOut();
          });
      }
    }

  }

  attached() {
    this.routerDetails.currentInstruction.queryString = undefined;
  }


  signOut() {
    clearInterval(parseInt(localStorage.getItem("autoSessionCheck")));
    clearInterval(parseInt(localStorage.getItem("autoSaveLoad")));
    clearInterval(parseInt(localStorage.getItem("autoSaveUnload")));
    clearInterval(parseInt(localStorage.getItem("autoSaveFinish")));
    return this.login.logOut().then(success => {
      this.router.navigateToRoute('userLogin')
    }).catch(error => {
      console.log(error)
    })
  }

  get isLoggedIn() {
    return this.login.isLoggedIn
  }

  get currentUser() {
    return this.login.current;
  }

  goToDashboard() {
    this.router.navigateToRoute('factoryIndex');
    if (this.isLoggedIn) {
      this.router.navigateToRoute('factoryIndex');
    } else this.router.navigateToRoute('userLogin')
  }

  showLogout() {
    this.logoutOption = !this.logoutOption;
  }

}

