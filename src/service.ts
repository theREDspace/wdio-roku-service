import type { Options, Services } from '@wdio/types';
import { SevereServiceError, WaitUntilOptions } from 'webdriverio';
import { getBrowserObject } from '@wdio/utils';
import { ECP, endpoints } from './ecp';
import * as tmp from 'tmp';
import { writeFileSync } from 'fs';
import { installByID, installFromZip } from './install';
import { getScreenshot } from './info';

export default class RokuWorkerService implements Services.ServiceInstance {
  async before(config: Options.Testrunner, specs: string[], browser: WebdriverIO.Browser) {
    if (!process.env.ROKU_IP) {
      throw new SevereServiceError('Roku IP is not set within the environment!');
    }

    if (!process.env.ROKU_USER || !process.env.ROKU_PW) {
      console.warn('Roku username and password have not been set. Screenshots will not work.');
    }

    if (config.maxInstances === undefined || config.maxInstances > 1) {
      console.warn('maxInstances is undefined or greater than one! Unpredictable behaviour will likely result.');
    }

    if (config.maxInstancesPerCapability === undefined || config.maxInstancesPerCapability > 1) {
      console.warn(
        'maxInstancesPerCapability is undefined or greater than one! Unpredictable behaviour will likely result.',
      );
    }

    browser.overwriteCommand(
      'click',
      async function () {
        console.error('click is not supported on Roku! You must navigate to the element manually.');
      },
      true,
    );

    browser.overwriteCommand(
      'doubleClick',
      async function () {
        console.error('doubleClick is not supported on Roku! You must navigate to the element manually.');
      },
      true,
    );

    browser.overwriteCommand(
      'moveTo',
      async function () {
        console.error('moveTo is not supported on Roku! You must navigate to the element manually.');
      },
      true,
    );

    browser.overwriteCommand('saveScreenshot', async function (original: Function, path: string) {
      if (!path.endsWith('.jpg')) {
        console.warn('Screenshot called without .jpg ending. Attempting to change or add file extension.');
        path = path.split('.')[0] + '.jpg';
      }

      try {
        const response = await getScreenshot();
        writeFileSync(path, Buffer.from(await response.arrayBuffer()));
      } catch (e: unknown) {
        console.error("Couldn't get screenshot from Roku!");
        console.error(e);
      }
    });

    browser.addCommand('openRokuXML', async function (this: WebdriverIO.Browser) {
      let output: tmp.FileResult;
      try {
        output = tmp.fileSync({ postfix: '.xml' });
      } catch {
        return console.error('Failed to create temporary file. Are write permissions available?');
      }
      const response = await ECP(endpoints.appUI, 'GET');
      const source = await response.text();
      try {
        writeFileSync(output.name, source);
      } catch {
        console.error(`Failed to write Roku xml to temporary file ${output.name}.`);
      }
      return this.url(`file://${output.name}`);
    });

    browser.overwriteCommand(
      'waitUntil',
      async function (
        this: WebdriverIO.Browser,
        origWaitFunction: Function,
        condition: () => unknown,
        options: WaitUntilOptions,
      ) {
        if (typeof condition !== 'function') {
          throw new Error('Condition is not a function');
        }

        const loadThenCheck = async () => {
          await this.openRokuXML();
          return condition();
        };

        return origWaitFunction(loadThenCheck, options);
      },
    );

    // Overwrite waitUntil on Element
    browser.overwriteCommand(
      'waitUntil',
      async function (
        this: WebdriverIO.Element,
        origWaitFunction: Function,
        condition: () => unknown,
        options: WaitUntilOptions,
      ) {
        if (typeof condition !== 'function') {
          throw new Error('Condition is not a function');
        }

        const loadThenCheck = async () => {
          const browser = getBrowserObject(this);
          await browser.openRokuXML();
          return condition();
        };

        return origWaitFunction(loadThenCheck, options);
      },
      true,
    );

    browser.overwriteCommand(
      'isDisplayed',
      async function (this: WebdriverIO.Element, original: Function) {
        if (!this.elementId) {
          const command = this.parent.$.bind(this.parent);
          this.elementId = (await command(this.selector as string).getElement()).elementId;
        }

        if (!this.elementId) {
          return false;
        }

        if ((await this.getAttribute('bounds')) === null) return false;
        if ((await this.getAttribute('visible')) === 'false') return false;
        return true;
      },
      true,
    );

    if (process.env.ROKU_APP_PATH) {
      await installFromZip(process.env.ROKU_APP_PATH);
    } else if (process.env.ROKU_CHANNEL_ID) {
      await installByID(process.env.ROKU_CHANNEL_ID);
    }
  }
}
