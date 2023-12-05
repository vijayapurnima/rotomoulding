import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources([
    'resources/elements/global/navbar',
    'resources/elements/global/global-label',
    'resources/elements/login/login-form',
    'resources/renderers/sort',
    'resources/elements/fault/submit',
    'resources/elements/fault/detail',
    'resources/elements/finishing/detail',
    'resources/elements/product/detail',
    'resources/renderers/date-converter',
    'resources/elements/product/unload-detail',
    'resources/elements/mould-location/view',
    'resources/elements/packaging/view',
    'resources/elements/quality-checklist/view',
    'resources/elements/product/image-detail',
    'resources/elements/shared/breadcrumb',
    'resources/elements/user/account',
    'resources/elements/mould-location/view',
    'resources/elements/component/view',
    'resources/elements/password/create',
  ]);
}
