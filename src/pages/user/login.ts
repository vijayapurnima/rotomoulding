import {autoinject} from 'aurelia-framework';
import {HttpResponseMessage} from "aurelia-http-client";
import {LoginService} from "../../resources/services/login";
import {Router} from "aurelia-router";
import {AlertService} from "../../resources/services/alert";

@autoinject
export class Login {

  DoLogin: (username: string, password: string) => Promise<HttpResponseMessage>;
  SuccessCallback: ((value: HttpResponseMessage) => HttpResponseMessage | PromiseLike<HttpResponseMessage>);
  FailureCallback: ((value: HttpResponseMessage) => HttpResponseMessage | PromiseLike<HttpResponseMessage>);

  constructor(private login: LoginService,
              private router: Router,
              private alert: AlertService) {

    this.DoLogin = (username: string, password: string): Promise<HttpResponseMessage> => {
      return this.login.createNew({username: username, password: password});
    };

    this.SuccessCallback = (value: HttpResponseMessage): HttpResponseMessage => {
      this.router.navigateToRoute('factoriesIndex');
      return value;
    };

    this.FailureCallback = (value: HttpResponseMessage): HttpResponseMessage => {
      if (value.content && value.content.description && value.content.description.indexOf("maximum number of AccentisConnect logins") >= 0) {
        this.alert.Error("Error", "Unable to connect to Accentis as there are no licenses available");
      } else
        this.alert.Error("Error", value.content.description || "Cannot login");
      return value;
    };

  }

  activate(params, routeConfig) {

    if (this.login.isLoggedIn) {
      if (params && params.url) {
        this.router.navigateToRoute(params.url);
      }
      else this.router.navigateToRoute('factoriesIndex');
    }
  }
}
