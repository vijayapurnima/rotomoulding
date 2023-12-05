import {HttpResponseMessage, Interceptor} from 'aurelia-http-client';
import {AlertService} from "../alert";
import {LoginService} from "../login";
import {Router} from "aurelia-router";


export class SimpleInterceptor implements Interceptor {
  factoriesPage: Function;

  constructor(private alert: AlertService, private login: LoginService, private router: Router) {
    this.factoriesPage = () => {
      this.router.navigateToRoute("factoriesIndex")

    }
  }

  responseError(response: HttpResponseMessage) {
    if (response.statusCode == 401) {
      this.alert.Error('Session Disconnected', 'Your connection to Accentis has been disconnected');
      this.login.forceLogout();
      return null;
    }
    else if (response.statusCode == 403) {
      this.alert.Warning('Authorisation Error', 'You do not have permissions to perform this action', {showCancelButton: false}, this.factoriesPage);
    }
    return response;
  }
}
