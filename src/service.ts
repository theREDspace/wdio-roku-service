import type { Options, Services } from '@wdio/types';
import { SevereServiceError } from 'webdriverio';
import { applyBrowserModifications } from './modifications/browser';
import { applyElementModifications } from './modifications/element';
import { applyMatcherModifications } from './modifications/matchers';

export default class RokuWorkerService implements Services.ServiceInstance {
  async before(config: Options.Testrunner, specs: string[], browser: WebdriverIO.Browser) {
    if (!process.env.ROKU_IP) {
      throw new SevereServiceError('Roku IP is not set within the environment!');
    }

    if (!process.env.ROKU_USER || !process.env.ROKU_PW) {
      console.warn('Roku username and password have not been set. Screenshots and installation will not work.');
    }

    applyBrowserModifications(browser);
    applyElementModifications(browser);
    applyMatcherModifications();
  }
}
