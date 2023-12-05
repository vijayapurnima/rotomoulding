import {BaseService} from "./base";

export class FaultService extends BaseService {

  _path: string = '/faults';

  public get_fault_types() {
    let request = super.GenerateRequest(this._path + '/get_fault_types');
    return request
      .asGet()
      .send();
  }

  public get_fault_reasons() {
    let request = super.GenerateRequest(this._path + '/get_fault_reasons');
    return request
      .asGet()
      .send();
  }


  public get_fault_categories() {
    let request = super.GenerateRequest(this._path + '/get_fault_categories');
    return request
      .asGet()
      .send();
  }
}
