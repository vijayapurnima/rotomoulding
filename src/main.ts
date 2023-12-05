import {Aurelia, LogManager} from 'aurelia-framework'
import environment from './environment';
import * as raven from 'raven-js';
import "aurelia-bootstrapper";
import {SentryAppender} from 'aurelia-sentry';
import 'aurelia-polyfills';
import 'materialize-amd';
import 'agstopwatch';

export function configure(aurelia: Aurelia) {
  aurelia.use
    .standardConfiguration()
    .feature('resources')
    .plugin('aurelia-validation')
    .plugin('aurelia-table')
    .plugin('aurelia-dialog')
    .plugin('sweetalert')
    .plugin('aurelia-materialize-bridge', b => b.useAll().preventWavesAttach());
  if (environment.debug) {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin('aurelia-testing');
  }

  if (environment.sentry_enable) {
    raven.config('https://23ccc93c17124464be7372c39fe88672@sentry.strategenics.com.au/25', {}).install();

    LogManager.addAppender(new SentryAppender());
    LogManager.setLevel(LogManager.logLevel.debug);


    window.addEventListener("unhandledrejection", (evt: ErrorEvent) => {
      raven.captureException(evt.error);
    });
  }

  aurelia.start().then(() => aurelia.setRoot());
}
