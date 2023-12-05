import {BaseService} from "./base";

export class RunService extends BaseService {

  _path: string = '/runs';

  public index(arm_id:number) {
    let request = super.GenerateRequest(this._path);
    return request
      .withParams({arm_id: arm_id})
      .asGet()
      .send();
  }


  public create(run:IRun) {
    let request = super.GenerateRequest(this._path);
    return request
      .withContent({run: run})
      .asPost()
      .send();
  }



  public update(id:number,run:IRun) {
    let request = super.GenerateRequest(this._path+ '/' + id);
    return request
      .withContent({id: id,run: run})
      .asPut()
      .send();
  }

}

interface IRun {
  work_order_id?:number;
  arm_id?:number;
  time?:number;
  run_number?:number;
  start_date?:string;
  status?:string;
  products?:IProduct[];
}

interface IProduct {
  work_order_id?:number;
  run_id?:number;
  status?:string;
  grading?:string;
  finish_flag?:boolean;
  load_data?:IUnloadData;
  unload_data?:ILoadData;
  finish_data?:IFinishData;
  fault_data?:IFaultData;

}

interface ILoadData {
  Batch_Code?:string;
  Weighed_By?:number;
  Bag_Count?:number;
  Weight_Used?:number;
  Loaded_By_1?:number;
  Loaded_By_2?:number;
  Loaded_By_3?:number;
  Loaded_By_4?:number;
  Load_Operator?:number;
  Load_Date?:string;
  Load_Start_Date?:string;
  Load_End_Date?:string;
  Load_Time_Actual?:number;

}
interface IUnloadData {
  Unloaded_By_1?:number;
  Unloaded_By_2?:number;
  Unloaded_By_3?:number;
  Unloaded_By_4?:number;
  Unload_Operator?:number;
  Unload_Date?:string;
  Unload_Start_Date?:string;
  Unload_End_Date?:string;
  Unload_Time_Actual?:number;

}


interface IFinishData {
  QA_Checklist?:string;
  Product_Note_Mod?:number;
  Special_Instruct?:number;
  Finished_By_1?:number;
  Finished_By_2?:number;
  Finish_Operator?:number;
  Finish_Date?:string;
  Finish_Start_Date?:string;
  Finish_End_Date?:string;
  Finish_Time_Actual?:number;

}


interface IFaultData {
  QA_Checklist?:string;
  Product_Note_Mod?:number;
  Special_Instruct?:number;
  Finished_By_1?:number;
  Finished_By_2?:number;
  Finish_Operator?:number;
  Finish_Date?:string;
  Finish_Start_Date?:string;
  Finish_End_Date?:string;
  Finish_Time_Actual?:number;

}
