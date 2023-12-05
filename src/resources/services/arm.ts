import {BaseService} from "./base";

export class ArmService extends BaseService {

  _path: string = '/arms';

  public index(oven_id:number) {
    let request = super.GenerateRequest(this._path);
    return request
      .withParams({oven_id: oven_id})
      .asGet()
      .send();
  }

}
