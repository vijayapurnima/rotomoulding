import {BaseService} from "./base";

export class OvenService extends BaseService {

  _path: string = '/ovens';

  public index(factory_id:number) {
    let request = super.GenerateRequest(this._path);
    return request
      .withParams({factory_id: factory_id})
      .asGet()
      .send();
  }

}
