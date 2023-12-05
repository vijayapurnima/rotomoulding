import {HttpClient} from 'aurelia-http-client';
import {LoginService} from "./login";
import environment from '../../environment';
import {autoinject} from 'aurelia-framework';
import {SimpleInterceptor} from "./interceptors/simple";
import {AlertService} from "./alert";
import {Router} from "aurelia-router";

@autoinject
export class BaseService {

  constructor(private login: LoginService, private alert: AlertService,private router:Router) {
  }

  protected _client = new HttpClient();

  protected GenerateRequest(path) {
    return this._client.createRequest(path)
      .withHeader('Authorization', this.login.getCurrentToken())
      .withHeader('If-Modified-Since', 'Mon, 26 Jul 1997 05:00:00 GMT')
      .withBaseUrl(environment.apiBaseUrl)
      .withInterceptor(new SimpleInterceptor(this.alert, this.login,this.router));
  }

  get baseUrl() {
    return environment.apiBaseUrl;
  }
}
