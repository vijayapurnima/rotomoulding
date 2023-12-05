import {BaseService} from "./base";

export class FactoryService extends BaseService {

  _path: string = '/factories';

  public index() {
    let request = super.GenerateRequest(this._path);
    return request
      .asGet()
      .send();
  }

}
