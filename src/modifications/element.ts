import { getBrowserObject } from '@wdio/utils';
import type { WaitForOptions, WaitUntilOptions } from 'webdriverio';

export function applyElementModifications(browser: WebdriverIO.Browser) {
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

  browser.overwriteCommand(
    'waitForClickable',
    async function (this: WebdriverIO.Element, original: Function, options:WaitForOptions) {
      return this.waitForDisplayed(options);
    },
    true,
  );

  browser.overwriteCommand(
    'waitForStable',
    async function (this: WebdriverIO.Element, original: Function, options:WaitForOptions) {
      return this.waitForExist(options);
    },
    true,
  );
}
