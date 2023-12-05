import {HttpClient, HttpResponseMessage} from "aurelia-http-client";
import {autoinject} from 'aurelia-framework';
import environment from '../../environment';
import Raven = require("raven-js");
import {Router} from "aurelia-router";
import {SimpleInterceptor} from "./interceptors/simple";
import {AlertService} from "./alert";
import {busy} from "../renderers/busy";
import {DialogService} from "aurelia-dialog";

@autoinject
export class LoginService {

  private _current: ILogin;
  private _path: string = '/logins';

  protected _client = new HttpClient();
  static inject = [busy];

  constructor(private router: Router, private alert: AlertService, private busy: busy, private dialog: DialogService) {
    if (localStorage.getItem('current') != null) {
      this._current = JSON.parse(localStorage.getItem('current'))
    }
  }

  protected GenerateRequest(path) {
    return this._client.createRequest(path)
      .withHeader('Authorization', this.getCurrentToken())
      .withInterceptor(new SimpleInterceptor(this.alert, this,this.router))
      .withBaseUrl(environment.apiBaseUrl);
  }

  public getCurrentToken(): string {
    if (this.isLoggedIn) {
      return this._current.auth_token;
    } else {
      return '';
    }
  }

  set current_user_name(name: string) {
    this._current.user_name = name || '';
    localStorage.setItem('current', JSON.stringify(this._current));
  }

  public createNew(creds: ICredentials) {
    let request = this.GenerateRequest(this._path);
    return request
      .withParams({username: creds.username, password: creds.password})
      .asPost()
      .send()
      .then(data => {
        if (data.isSuccess) {
          let current = JSON.parse(data.response);
          this._current = {
            auth_token: current.user.auth_token,
            id: current.user.id,
            user_name: current.user.name || ''
          };
          localStorage.setItem('current', JSON.stringify(this._current));
          Raven.setUserContext(data.content.user);
        }
        return data;
      }).catch(data => {
        return data;
      });
  }

  public validateSession() {
    let request = this.GenerateRequest(this._path + '/' + 'loggedIn');
    return request
      .asGet()
      .send()
      .then(data => {
        return data;
      }).catch(data => {
        return data;
      });
  }

  public logOut() {
    let request = this.GenerateRequest(this._path + '/' + this._current.id);
    return request
      .asDelete()
      .send()
      .then(data => {
        this.forceLogout();
        Raven.setUserContext();
        return data;
      }).catch(data => {
        return data;
      });
  }

  get isLoggedIn() {
    return !(this._current == null || this._current.id == null || this._current.auth_token == null);
  }

  get current() {
    return this.isLoggedIn ? this._current : null;
  }

  get currentUser() {
    return this.isLoggedIn ? {
      id: this._current.id,
      name: this._current.user_name
    } : null;
  }

  public forceLogout() {
    this.dialog.closeAll().then(result => {
    });
    this._current = null;
    localStorage.clear();
    this.router.navigateToRoute('userLogin');
  }
}

export interface ICredentials {
  username: string,
  password: string
}

interface ILogin {
  auth_token: string,
  id?: number,
  user_name?: string,
  factory_id?:number,
  oven_id?:number,
  arm_id?:number,
  run_id?:number,
  product_id?:number
}
