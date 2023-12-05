import {BaseService} from "./base";

export class UserService extends BaseService {

  _path: string = '/users';

  public index() {
    let request = super.GenerateRequest(this._path);
    return request
      .asGet()
      .send();
  }

  public get_staff() {
    let request = super.GenerateRequest(this._path + '/get_staff');
    return request
      .asGet()
      .send();
  }


}

export interface IUser {
  id?: number;
  name: string;
  email?: string;
  edo_id?: number;
}

export interface IChangePassword {
  password: string,
  code: string
}

export interface IVerify {
  password: string,
  code: string
}
