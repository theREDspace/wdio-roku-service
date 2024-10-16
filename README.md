# wdio-roku-service
This service overrides many parts of WebdriverIO to allow them to be used with Roku apps and provides access to the [Roku ECP](https://developer.roku.com/en-ca/docs/developer-program/dev-tools/external-control-api.md) to control the Roku during testing.

## Requirements

### Roku
A test channel/channel.zip and a Roku device (with Developer Mode enabled) on the same network as your mac.

### WebdriverIO
This is not a standalone product -- it is used as a WebdriverIO test framework plugin (or Service, in their vernacular). Before using this, you should go through the setup for WDIO by running `npm init wdio@latest`.

When going through the setup steps, so you don't have to navigate all the questions/options, you can just choose the following selections during the init phase:
- E2E Testing
- On my local machine
- Web
- Chrome
- Mocha
- Typescript [modules works for TS and JS, so choose whichever]
- autogenerate some test files (Y)
-- default location
- page objects (Y)
-- default location
- spec reporter
- additional plugins (N)
- Visual Testing (N)
- services (none; in the future, this project be in the list)
- npm install (Y)

Now that this complete, hop into that repo and link this project to the package:

`npm link path/to/wdio-roku-service --save`

### WDIO Config
Currently, testing is only supported for a single Roku device. The following config updates are required:
* `maxInstances` and `maxInstancesPerCapability` should be 1. Testing on multiple devices automatically isn't supported and will result in duplicated commands getting sent to the Roku. There should only be a single capability. 
```js
//wdio.conf.js
export const config: WebdriverIO.Config = {

maxInstances: 1,

    capabilities: [{
        browserName: 'chrome'
        // or if you want headless mode:
        browserName: 'chrome',
        'goog:chromeOptions': { 
            args: ['--headless', '--disable-gpu']
        }
    }],
    //...
}
```
* Import the `RokuWorkerService` and include it in the `services` of your config. No parameters are required.
```js
//wdio.conf.js
import RokuWorkerService from 'wdio-roku-service'

export const config: WebdriverIO.Config = {
    services: [[RokuWorkerService]],
    //...
}
```
* It's recommended to increase the `waitforInterval` and `waitforTimeout`, as each interval involves downloading the xml from the Roku. To get more out of the `browser.debug()` feature, you may also opt to extend your mocha testrunner timeout to 5+ minutes for development room.
```js
//wdio.conf.js
export const config: WebdriverIO.Config = {
    waitforTimeout: 30000,
    
    //optional:
    mochaOpts: {
        ui: 'bdd',
        timeout: 600000
    },
    //...
}
```

You're ready to write your first test!

```js
import { installFromZip } from 'wdio-roku-service/src/install'
import { exitChannel } from 'wdio-roku-service/channel'
import { Buttons, keyPress, keySequence } from 'wdio-roku-service/src/controller'

describe('first test', () => {
    before('On the landing screen of the test channel', async () => {
        await installFromZip(process.env.ROKU_APP_PATH)
    })

    it('should launch to the homescreen without login', async () => {
        await $("//LoadingIndicator").waitForDisplayed({ reverse: true })
        await expect($("//ShubiCarousel")).toBeDisplayed()
    })

    after('should return to home', async () => {
        await exitChannel()
    })
})

```
### .env
See the `.env.example` file. Copy it and rename it to `.env` within your WebdriverIO project that uses this service. You will probably want to put it in your `.gitignore` as well.

* `ROKU_IP` should be the IP of your Roku. The commands will use this IP to communicate with it. This is required.
* `ROKU_USER` and `ROKU_PW`: Login credentials are needed to install an archive, as well as for taking screenshots.

## Changed Functions
### Browser
* `waitUntil` will fetch the xml from the Roku at each iteration to check for changes.
* `saveScreenshot` will download a screenshot of the current screen from the Roku. Notably, these screenshots are in .jpg format, rather than the .png that WebdriverIO usually uses.
* `openRokuXML` will fetch the xml from the Roku if you need to do it manually rather than with waits.

### Elements
* All waits are supported in the same way as Browser. `waitForClickable` is mapped to `waitForDisplayed`, and `waitForStable` is mapped to `waitForExist`.
* `click`, `doubleClick`, and `moveTo` aren't supported. You have to manually navigate the app.
* `isFocused` will check for an attribute `focused` on the element being true.
* `isDisplayed` will check for an attribute `bounds` on the element, and that `visible` is not set to false. If `withinViewport` is set, the bounds will be compared against the Roku's screen size.
* `getSize` and `getLocation` take the values from the `bounds` attribute, returning 0 for size and -Infinity for position if it isn't present.

Other functions have not been changed, but many still work as expected.

### Matchers
Most matchers have been updated to fetch the xml while waiting. Some have slightly different functionality.
* `toBeDisplayed`, `toBeDisplayedInViewport`, `toBeFocused`, `toBeExisting`, `toBePresent`, `toExist`, `toHaveSize`, `toHaveWidth`, `toHaveHeight`, and `toHaveAttribute` all work as expected, with the changes to Element considered.
* `toHaveElementProperty` is mapped to `toHaveAttribute`.
* `toHaveElementClass` checks the `name` attribute of the element.
* `toHaveId` is mapped to `toHaveElementClass`.
* `toHaveText` checks the `text` attribute of the element.
* `toHaveChildren` checks the `children` attribute of the element.
* `toHaveHTML` will treat the xml as if it were HTML, though is likely not very useful.

The following are not currently supported:
* `toBeSelected` - Could be supported soon after determining what the xml for selected buttons look like, if there's a difference.
* `toBeChecked` - Could be supported soon after determining what the xml for checked checkboxes look like, if there's a difference.
* `toHaveComputedLabel` - If you have an equivalent of this on your Roku elements, check the attribute with `toHaveAttribute`.
* `toHaveComputedRole` - If you have an equivalent of this on your Roku elements, check the attribute with `toHaveAttribute`.
* `toHaveHref` - If you have URLs on your Roku elements, check the attribute with `toHaveAttribute`.
* `toHaveStyle` - The xml elements don't have styles.
* `toHaveClipboardText` - This isn't known.
* `toHaveTitle` - The title will be the randomly generated temporary filename of the xml.
* `toHaveUrl` - The URL will be the path to the xml file on your computer.

## Usage
### Channel Installation

This requires your channel to have an assigned ID.
```js
import { installByID } from 'wdio-roku-service/install';

async before() {
    await installByID(process.env.ROKU_CHANNEL_ID);
}
```

Archive Installation

It's recommended to store the path in the .env, especially if you have multiple developers who might have different locations and/or file names.
```js
import { installFromZip } from 'wdio-roku-service/install';

async before() {
    await installFromZip(process.env.ROKU_ARCHIVE_PATH);
}
```

Pre-Installed Channel

If you've already installed the channel yourself prior to testing, you can simply launch it.
```js
import { launchChannel, exitChannel } from 'wdio-roku-service/channel';

async before() {
    // Close the channel if it's already open. If the channel supports instant resume, this will merely background it
    await exitChannel();
    // Using the channel ID of 'dev' will launch the sideloaded application.
    await launchChannel('dev');
}
```

### Testing
`wdio-roku-service/controller` provides the ability to send button presses to the Roku. `keySequence` is the main one, sending several button presses in sequence.
```js
import { Buttons, keySequence } from 'wdio-roku-service/controller';

// Navigate through the app
await keySequence(Buttons.LEFT, Buttons.LEFT, Buttons.SELECT, Buttons.DOWN, Buttons.SELECT);
// Fetch the current app UI from the Roku and load it into the browser
await browser.openRokuXML();
// Or, use waits, which will repeatedly load the XML until it times out or the condition passes
await browser.waitUntil(condition);
await element.waitForDisplayed();
// use WDIO matchers on the roku XML as if it was a webpage
await expect(element).toHaveAttr('focused');
```

`wdio-roku-service/controller` also has functions for holding or releasing buttons as well as typing text into a keyboard.
```js
import { Buttons, keyboardInput, keyPress, keySequence } from 'wdio-roku-service/controller';

await keySequence(Buttons.DOWN, Buttons.DOWN, Buttons.SELECT);
await keyboardInput('example');
await keyPress(Buttons.ENTER);
await browser.openRokuXML();
```

### Deeplinking
`wdio-roku-service/channel` provides channel-related functionality. `inputChannel` allows you to send arbitrary information to your app.
```js
import { exitChannel, launchChannel, MediaType } from 'wdio-roku-service/channel';
await exitChannel();
await launchChannel(process.env.ROKU_CHANNEL_ID, myContent, MediaType.MOVIE, {myExtraParameter:true});
await expect(MyContent.header).toBeDisplayed();
```

### Other Functions
`wdio-roku-service/info` provides miscellaneous functionality, such as getting the app icon or orphaned nodes.
```js
import { getAppIcon } from 'wdio-roku-service/info';
const response = await getAppIcon(process.env.ROKU_CHANNEL_ID);
expect(response.headers.get('Content-Type')).toBe('image/jpg');
```
`wdio-roku-service/ecp` is the direct interface with the ECP if you need to do anything highly specific.
```js
import { ECP } from 'wdio-roku-service/ecp';
await ECP('search/browse?keyword=voyage&type=movie&tmsid=MV000058030000', 'POST');
```

## Common Gotchas
* Roku elements have their text in a 'text' attribute, not between their tags. When doing selectors, doing `$('element=Text')` won't work for almost every element. Instead, you'll have to do `$('element[text=Text]')`.