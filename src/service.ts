import type { Options, Services } from '@wdio/types';
import { SevereServiceError } from 'webdriverio';
import type { Document } from '@xmldom/xmldom';
import { ECP, endpoints } from './ecp';
import { XMLSerializer } from '@xmldom/xmldom';
import * as tmp from 'tmp';
import { writeFileSync } from 'fs';
import { installByID, installFromZip } from './install';

export default class RokuWorkerService implements Services.ServiceInstance {
  async before(config: Options.Testrunner, specs: string[], browser: WebdriverIO.Browser) {
    if (!process.env.ROKU_IP) {
      throw new SevereServiceError('Roku IP is not set within the environment!');
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

    browser.addCommand('openRokuXML', async function () {
      let output: tmp.FileResult;
      try {
        output = tmp.fileSync({ postfix: '.xml' });
      } catch {
        return console.error('Failed to create temporary file. Are write permissions available?');
      }
      const source = (await ECP(endpoints.appUI, 'GET')) as Document;
      const sourceString = new XMLSerializer().serializeToString(source);
      try {
        writeFileSync(output.name, sourceString);
        //@ts-expect-error
        return this.open(output.name);
      } catch {
        console.error(`Failed to write Roku xml to temporary file ${output.name}.`);
      }
    });

    if (process.env.ROKU_CHANNEL_ID) {
      await installByID(process.env.ROKU_CHANNEL_ID);
    } else if (process.env.ROKU_APP_PATH) {
      await installFromZip(process.env.ROKU_APP_PATH);
    }
  }
}
