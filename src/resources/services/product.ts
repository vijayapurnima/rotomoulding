import {BaseService} from "./base";

export class ProductService extends BaseService {

  _path: string = '/products';

  public index(wo_id:number) {
    let request = super.GenerateRequest(this._path);
    return request
      .withParams({wo_id:wo_id})
      .asGet()
      .send();
  }


  public update(id:number,product:IProduct) {
    let request = super.GenerateRequest(this._path+ '/' + id);
    return request
      .withContent({id: id,product: product})
      .asPut()
      .send();
  }

  public get_load_details(wo_id:number) {
    let request = super.GenerateRequest(this._path+'/get_load_details');
    return request
      .withParams({wo_id:wo_id})
      .asGet()
      .send();
  }

  public get_finishing_data(wo_id:number) {
    let request = super.GenerateRequest(this._path+'/get_finishing_data');
    return request
      .withParams({wo_id:wo_id})
      .asGet()
      .send();
  }

  public get_finish_packaging(wo_id:number) {
    let request = super.GenerateRequest(this._path+'/get_finish_packaging');
    return request
      .withParams({wo_id:wo_id})
      .asGet()
      .send();
  }

  public get_quality_checklist(wo_id:number) {
    let request = super.GenerateRequest(this._path+'/get_quality_checklist');
    return request
      .withParams({wo_id:wo_id})
      .asGet()
      .send();
  }

  public set_load_data(products:IProduct[]) {
    let request = super.GenerateRequest(this._path+'/set_product_load');
    return request
      .withContent({products:products})
      .asPost()
      .send()
  }

  public set_unload_data(products:IProduct[]) {
    let request = super.GenerateRequest(this._path+'/set_product_unload');
    return request
      .withContent({products:products})
      .asPost()
      .send()
  }
  public set_finish_data(product:IProduct) {
    let request = super.GenerateRequest(this._path+'/set_product_finish');
    return request
      .withContent({product:product})
      .asPost()
      .send()
  }

  public set_fault_data(product:IProduct) {
    let request = super.GenerateRequest(this._path+'/set_product_fault');
    return request
      .withContent({product:product})
      .asPost()
      .send()
  }
}

interface IProduct {
  work_order_id?:number;
  run_number?:number;
  start_date?:number;
  arm_id?:number;
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
