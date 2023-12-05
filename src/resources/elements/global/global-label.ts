import {bindable} from 'aurelia-framework';

export class GlobalLabel {
  @bindable labelText: string;
  @bindable helpText: string;
  @bindable forId: string;
  @bindable isRequired: boolean;
  @bindable editing: boolean;
  @bindable textUnder: boolean;

}
