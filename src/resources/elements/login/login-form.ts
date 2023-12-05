import {bindable, autoinject} from 'aurelia-framework';
import {HttpResponseMessage} from "aurelia-http-client";
import {
  ControllerValidateResult, validateTrigger, ValidationController, ValidationControllerFactory
} from "aurelia-validation";
import {BootstrapFormRenderer} from "../../renderers/bootstrap-form-renderer";
import {busy} from "../../renderers/busy";

@autoinject
export class LoginForm {
  username: string;
  password: string;
  controller: ValidationController;


  @bindable DoLogin: (username: string, password: string) => Promise<HttpResponseMessage>;
  @bindable SuccessCallback: ((value: HttpResponseMessage) => HttpResponseMessage | PromiseLike<HttpResponseMessage>);
  @bindable FailureCallback: ((value: HttpResponseMessage) => HttpResponseMessage | PromiseLike<HttpResponseMessage>);

  constructor(controllerFactory: ValidationControllerFactory, formRenderer: BootstrapFormRenderer, private busy: busy) {
    this.controller = controllerFactory.createForCurrentScope();
    this.controller.validateTrigger = validateTrigger.changeOrBlur;
    this.controller.addRenderer(formRenderer);
  };

  attached() {
  }


  LoginSubmit() {
    this.controller.validate().then((result: ControllerValidateResult) => {
      if (result.valid) {
        this.busy.on();
        return this.DoLogin(this.username, this.password).then((result: HttpResponseMessage) => {
          this.busy.off();
          if (result.isSuccess) {
            return this.SuccessCallback(result);
          } else {
            return this.FailureCallback(result);
          }
        });
      }
    });
  }
}
