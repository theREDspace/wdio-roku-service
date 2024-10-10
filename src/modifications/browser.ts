import { ECP, endpoints } from '../ecp.js';
import * as tmp from 'tmp';
import { writeFileSync } from 'fs';
import { getScreenshot } from '../info.js';
import type { WaitUntilOptions } from 'webdriverio';

export function applyBrowserModifications(browser: WebdriverIO.Browser) {
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
}
