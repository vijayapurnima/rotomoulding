export class AlertService {
  swal = require("sweetalert")

  public Success(title: string, text: string, config: any = null, callback: Function = null) {
    var base_config = config ? config : {
      icon: "success",
      button: {text: "Okay", className: "alert_success", closeModal: true}
    };

    base_config['title'] = title;
    base_config['text'] = text;

    this.giveAlert(base_config, callback);
  }

  public Error(title: string, text: string, config: any = null, callback: Function = null) {
    var base_config = config ? config : {icon: "error", button: {text: "Okay", closeModal: true}, dangerMode: true};

    base_config['title'] = title;
    base_config['text'] = text;

    this.giveAlert(base_config, callback);

  }

  public Warning(title: string, text: string, config: any = null, callback: Function = null) {
    var base_config = config ? config : {
      icon: "warning",
      buttons: title.match("Warning")?['Back','Ok']: ['Back','Submit']
    };

    base_config['title'] = title;
    base_config['text'] = text;
    return this.giveAlert(base_config, callback);
  }

  async Cooking(title: string, text: string, config: any = null, callback: Function = null) {
    var base_config = config ? config : {
      icon: "scripts/img/fire.png",
      buttons: ['No','Yes']
    };

    base_config['title'] = title;
    base_config['text'] = text;
    return this.giveAlert(base_config, callback);
  }


  public Info(title: string, text: string, config: any = null, callback: Function = null) {
    var base_config = config ? config : {icon: "info", button: {text: "Okay", closeModal: true}};

    base_config['title'] = title;
    base_config['text'] = text;
    this.giveAlert(base_config, callback);
  }

  async giveAlert(base_config, callback) {
    return await this.swal(base_config).then(valid => {
      if (valid) {
        if (callback)
          return callback();
        else
          return valid;
      }
    });
  }

}
