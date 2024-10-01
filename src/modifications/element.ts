import { getBrowserObject } from '@wdio/utils';
import type { WaitForOptions, WaitUntilOptions } from 'webdriverio';
import { getDeviceInfo } from '../info';

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
    'isFocused',
    async function (this: WebdriverIO.Element, original: Function) {
      return (await this.getAttribute('focused')) == 'true';
    },
    true,
  );

  browser.overwriteCommand(
    'isDisplayed',
    async function (
      this: WebdriverIO.Element,
      original: Function,
      commandParams: { withinViewport: boolean } = { withinViewport: false },
    ) {
      if (!this.elementId) {
        const command = this.parent.$.bind(this.parent);
        this.elementId = (await command(this.selector as string).getElement()).elementId;
      }

      if (!this.elementId) {
        return false;
      }

      if ((await this.getAttribute('visible')) === 'false') return false;
      const bounds = await this.getAttribute('bounds');
      if (bounds === null) return false;

      if (!commandParams.withinViewport) return true;

      const response = await getDeviceInfo();
      const deviceInfo = await response.text();
      // Can be 1080p, 720p, 480p, or 480i
      const displayHeight = deviceInfo.match(/resolution>(\d+)[pi]<\/ui/);

      if (!displayHeight) {
        console.warn('Could not determine screen size. Considering element to be in viewport because it has a bounds.');
        return true;
      }

      const elementPosition = bounds.match(/{(\d+), (\d+), (\d+), (\d+)}/)!;
      const height = parseInt(displayHeight[0]);
      const element = {
        x: parseInt(elementPosition[0]),
        y: parseInt(elementPosition[1]),
        w: parseInt(elementPosition[2]),
        h: parseInt(elementPosition[3]),
      };

      if (element.x > height * (16 / 9) || element.y > height || element.x <= -element.w || element.y <= -element.h) {
        return false;
      }

      return true;
    },
    true,
  );

  browser.overwriteCommand(
    'waitForClickable',
    async function (this: WebdriverIO.Element, original: Function, options: WaitForOptions) {
      return this.waitForDisplayed(options);
    },
    true,
  );

  browser.overwriteCommand(
    'waitForStable',
    async function (this: WebdriverIO.Element, original: Function, options: WaitForOptions) {
      return this.waitForExist(options);
    },
    true,
  );

  browser.overwriteCommand(
    'getSize',
    async function (this: WebdriverIO.Element, original: Function, prop: 'width' | 'height') {
      if (!this.elementId) {
        const command = this.parent.$.bind(this.parent);
        this.elementId = (await command(this.selector as string).getElement()).elementId;
      }

      if (!this.elementId) {
        return false;
      }

      let position: { width: number; height: number };
      const bounds = await this.getAttribute('bounds');
      if (bounds === null) position = { width: 0, height: 0 };
      else {
        const positionValues = bounds.match(/(%d), (%d)}/)!;
        position = { width: parseInt(positionValues[0]), height: parseInt(positionValues[1]) };
      }

      if (prop) {
        return position[prop];
      }

      return position;
    },
    true,
  );

  browser.overwriteCommand(
    'getLocation',
    async function (this: WebdriverIO.Element, original: Function, prop?: 'x' | 'y') {
      if (!this.elementId) {
        const command = this.parent.$.bind(this.parent);
        this.elementId = (await command(this.selector as string).getElement()).elementId;
      }

      if (!this.elementId) {
        return false;
      }

      let position: { x: number; y: number };
      const bounds = await this.getAttribute('bounds');
      if (bounds === null) position = { x: -Infinity, y: -Infinity };
      else {
        const positionValues = bounds.match(/{(%d), (%d),/)!;
        position = { x: parseInt(positionValues[0]), y: parseInt(positionValues[1]) };
      }

      if (prop) {
        return position[prop];
      }

      return position;
    },
    true,
  );
}
