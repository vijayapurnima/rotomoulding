import {BaseService} from "./base";

export class MouldLocationService extends BaseService {

  _path: string = '/mould_locations';

  public index(wo_id:number) {
    let request = super.GenerateRequest(this._path);
    return request
      .withParams({wo_id:wo_id})
      .asGet()
      .send();
  }

}
