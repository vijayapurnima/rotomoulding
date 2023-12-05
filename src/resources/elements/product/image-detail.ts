import {bindable} from 'aurelia-framework';




export class ImageDetail {
  @bindable product;

  constructor() {

  }

  attached(){
    if (!this.product.image_data)
    this.product.image_data=[];
  }

  getRawUrl(){
    if (this.product.finishing_data.thickness_test_image.match("dropbox")){
      this.product.finishing_data.thickness_test_image=this.product.finishing_data.thickness_test_image.split("?")[0];
      return this.product.finishing_data.thickness_test_image.concat("?raw=1");
    }else
      return this.product.finishing_data.thickness_test_image;

  }

}
