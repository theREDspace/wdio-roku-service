import { expect } from 'expect';
import { getConfig } from 'expect-webdriverio';

export function applyMatcherModifications() {
    //@ts-ignore
    if (global.expect.expect !== undefined) {
        //@ts-ignore
        global.expect = global.expect.expect;
    }

    expect.extend({
        async toBeDisplayed(actual:any, options:ExpectWebdriverIO.CommandOptions = getConfig()) {
            console.log("We are in the custom matcher!");
            const element:WebdriverIO.Element = await actual;
            await options.beforeAssertion?.({
                matcherName: 'toBeDisplayed',
                options,
            });

            let result = {
                el: element,
                pass: await element.waitForDisplayed({reverse:this.isNot}) === true,
                message: () => `expected ${element.selector} to ${this.isNot? 'not ' : ''}be displayed`
            };

            await options.afterAssertion?.({
                matcherName: 'toBeDisplayed',
                options,
                result
            });

            return result;
        }
    });
}