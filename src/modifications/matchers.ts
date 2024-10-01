import { expect, MatcherContext } from 'expect';
import { getConfig } from 'expect-webdriverio';
import type { AssertionHookParams } from 'expect-webdriverio';
type WdioElementMaybePromise = Promise<WebdriverIO.Element> | WebdriverIO.Element;

export function applyMatcherModifications() {
  //@ts-ignore
  if (global.expect.expect !== undefined) {
    //@ts-ignore
    global.expect = global.expect.expect;
  }

  expect.extend({
    async toBeDisplayed(actual: WdioElementMaybePromise, options: ExpectWebdriverIO.CommandOptions = getConfig()) {
      return genericMatcher(
        this,
        'toBeDisplayed',
        actual,
        async (element: WebdriverIO.Element) => {
          return (await element.waitForDisplayed()) === true;
        },
        'be',
        'displayed',
        options,
      );
    },
    async toBeEnabled(actual: WdioElementMaybePromise, options: ExpectWebdriverIO.CommandOptions = getConfig()) {
      return genericMatcher(
        this,
        'toBeEnabled',
        actual,
        async (element: WebdriverIO.Element) => {
          return (await element.waitForDisplayed()) === true;
        },
        'be',
        'enabled',
        options,
      );
    },
    async toBeDisplayedInViewport(
      actual: WdioElementMaybePromise,
      options: ExpectWebdriverIO.CommandOptions = getConfig(),
    ) {
      return genericMatcher(
        this,
        'toBeDisplayedInViewport',
        actual,
        async (element: WebdriverIO.Element) => {
          return (await element.waitForDisplayed({ withinViewport: true })) === true;
        },
        'be',
        'displayed in viewport',
        options,
      );
    },
    async toBeClickable(actual: WdioElementMaybePromise, options: ExpectWebdriverIO.CommandOptions = getConfig()) {
      return genericMatcher(
        this,
        'toBeClickable',
        actual,
        async (element: WebdriverIO.Element) => {
          return (await element.waitForClickable()) === true;
        },
        'be',
        'clickable',
        options,
      );
    },
    async toBeExisting(actual: WdioElementMaybePromise, options: ExpectWebdriverIO.CommandOptions = getConfig()) {
      return genericMatcher(this, 'toBeExisting', actual, expectToExist, 'be', 'existing', options);
    },
    async toBePresent(actual: WdioElementMaybePromise, options: ExpectWebdriverIO.CommandOptions = getConfig()) {
      return genericMatcher(this, 'toBePresent', actual, expectToExist, 'be', 'present', options);
    },
    async toExist(actual: WdioElementMaybePromise, options: ExpectWebdriverIO.CommandOptions = getConfig()) {
      return genericMatcher(this, 'toExist', actual, expectToExist, '', 'exist', options);
    },
    async toBeFocused(actual: WdioElementMaybePromise, options: ExpectWebdriverIO.CommandOptions = getConfig()) {
      return genericMatcher(
        this,
        'toBeFocused',
        actual,
        async (element: WebdriverIO.Element) => {
          return await element.isFocused();
        },
        'be',
        'focused',
        options,
      );
    },
    async toHaveSize(
      actual: WdioElementMaybePromise,
      expected: { width: number; height: number },
      options: ExpectWebdriverIO.CommandOptions = getConfig(),
    ) {
      return genericMatcher(
        this,
        'toHaveSize',
        actual,
        async (element: WebdriverIO.Element) => {
          await element.waitUntil(async () => {
            (await element.getAttribute('bounds')) !== null;
          });
          const size = await element.getSize();
          return size.width === expected.width && size.height === expected.height;
        },
        'have',
        'size',
        options,
      );
    },
    async toHaveWidth(
      actual: WdioElementMaybePromise,
      expected: number,
      options: ExpectWebdriverIO.CommandOptions = getConfig(),
    ) {
      return genericMatcher(
        this,
        'toHaveWidth',
        actual,
        async (element: WebdriverIO.Element) => {
          await element.waitUntil(async () => {
            (await element.getAttribute('bounds')) !== null;
          });
          const size = await element.getSize();
          return size.width === expected;
        },
        'have',
        'width',
        options,
      );
    },
    async toHaveHeight(
      actual: WdioElementMaybePromise,
      expected: number,
      options: ExpectWebdriverIO.CommandOptions = getConfig(),
    ) {
      return genericMatcher(
        this,
        'toHaveHeight',
        actual,
        async (element: WebdriverIO.Element) => {
          await element.waitUntil(async () => {
            (await element.getAttribute('bounds')) !== null;
          });
          const size = await element.getSize();
          return size.height === expected;
        },
        'have',
        'height',
        options,
      );
    },
    async toHaveChildren(
      actual: WdioElementMaybePromise,
      expected?: number | ExpectWebdriverIO.NumberOptions,
      options: ExpectWebdriverIO.CommandOptions = getConfig(),
    ) {
      return genericMatcher(
        this,
        'toHaveChildren',
        actual,
        async (element: WebdriverIO.Element) => {
          await element.waitUntil(async () => (await element.getAttribute('children')) !== null);
          const children = await element.getAttribute('children');
          let childCount = 0;
          if (children) childCount = parseInt(children);

          if (expected === undefined) return childCount !== 0;

          if (typeof expected == 'number') {
            return childCount === expected;
          }

          return compareNumbers(childCount, expected);
        },
        'have',
        'children',
        options,
      );
    },
    async toHaveAttribute(
      actual: WdioElementMaybePromise,
      attribute: string,
      value?: string | RegExp | ExpectWebdriverIO.PartialMatcher,
      options: ExpectWebdriverIO.StringOptions = getConfig(),
    ) {
      return genericMatcher(
        this,
        'toHaveAttribute',
        actual,
        async (element: WebdriverIO.Element) => {
          await element.waitUntil(async () => (await element.getAttribute(attribute)) !== null);
          const attr = await element.getAttribute(attribute);

          if (value === undefined) return attr !== null;

          return compareText(attr, value, options).result;
        },
        'have',
        'attribute',
        options,
      );
    },
  });
}

async function expectToExist(this: MatcherContext, element: WebdriverIO.Element) {
  return (await element.waitForExist()) === true;
}

async function genericMatcher(
  context: MatcherContext,
  name: AssertionHookParams['matcherName'],
  actual: WdioElementMaybePromise,
  check: (element: WebdriverIO.Element) => Promise<boolean>,
  verb: string,
  expectation: string,
  options: ExpectWebdriverIO.DefaultOptions,
) {
  const element = await actual;

  await options.beforeAssertion?.({
    matcherName: name,
    options,
  });

  let result = {
    el: element,
    pass: (await check(element)) === !context.isNot,
    message: () => `expected ${element.selector} to ${context.isNot ? 'not ' : ''}${verb} ${expectation}`,
  };

  await options.afterAssertion?.({
    matcherName: name,
    options,
    result,
  });

  return result;
}

// Below are functions from expect-webdriverio that are not exported
// https://github.com/webdriverio/expect-webdriverio/blob/main/src/utils.ts

const compareNumbers = (actual: number, options: ExpectWebdriverIO.NumberOptions = {}): boolean => {
  // Equals case
  if (typeof options.eq === 'number') {
    return actual === options.eq;
  }

  // Greater than or equal AND less than or equal case
  if (typeof options.gte === 'number' && typeof options.lte === 'number') {
    return actual >= options.gte && actual <= options.lte;
  }

  // Greater than or equal case
  if (typeof options.gte === 'number') {
    return actual >= options.gte;
  }

  // Less than or equal case
  if (typeof options.lte === 'number') {
    return actual <= options.lte;
  }

  return false;
};

export const compareText = (
  actual: string,
  expected: string | RegExp | ExpectWebdriverIO.PartialMatcher,
  {
    ignoreCase = false,
    trim = true,
    containing = false,
    atStart = false,
    atEnd = false,
    atIndex,
    replace,
  }: ExpectWebdriverIO.StringOptions,
) => {
  if (typeof actual !== 'string') {
    return {
      value: actual,
      result: false,
    };
  }

  if (trim) {
    actual = actual.trim();
  }
  if (Array.isArray(replace)) {
    actual = replaceActual(replace, actual);
  }
  if (ignoreCase) {
    actual = actual.toLowerCase();
    if (typeof expected === 'string') {
      expected = expected.toLowerCase();
    } else if (isStringContainingMatcher(expected)) {
      expected = (
        expected.toString() === 'StringContaining'
          ? expect.stringContaining(expected.sample?.toString().toLowerCase())
          : expect.not.stringContaining(expected.sample?.toString().toLowerCase())
      ) as ExpectWebdriverIO.PartialMatcher;
    }
  }

  if (isAsymmeyricMatcher(expected)) {
    const result = expected.asymmetricMatch(actual);
    return {
      value: actual,
      result,
    };
  }

  expected = expected as string | RegExp;
  if (expected instanceof RegExp) {
    return {
      value: actual,
      result: !!actual.match(expected),
    };
  }
  if (containing) {
    return {
      value: actual,
      result: actual.includes(expected),
    };
  }

  if (atStart) {
    return {
      value: actual,
      result: actual.startsWith(expected),
    };
  }

  if (atEnd) {
    return {
      value: actual,
      result: actual.endsWith(expected),
    };
  }

  if (atIndex) {
    return {
      value: actual,
      result: actual.substring(atIndex, actual.length).startsWith(expected),
    };
  }

  return {
    value: actual,
    result: actual === expected,
  };
};

const asymmetricMatcher =
  typeof Symbol === 'function' && Symbol.for ? Symbol.for('jest.asymmetricMatcher') : 0x13_57_a5;

export function isAsymmeyricMatcher(expected: any): expected is ExpectWebdriverIO.PartialMatcher {
  return (
    typeof expected === 'object' &&
    '$$typeof' in expected &&
    expected.$$typeof === asymmetricMatcher &&
    expected.asymmetricMatch
  );
}

function isStringContainingMatcher(expected: any): expected is ExpectWebdriverIO.PartialMatcher {
  return isAsymmeyricMatcher(expected) && ['StringContaining', 'StringNotContaining'].includes(expected.toString());
}

function replaceActual(
  replace: [string | RegExp, string | Function] | Array<[string | RegExp, string | Function]>,
  actual: string,
) {
  const hasMultipleReplacers = (replace as [string | RegExp, string | Function][]).every((r) => Array.isArray(r));
  const replacers = hasMultipleReplacers
    ? (replace as [string | RegExp, string | Function][])
    : [replace as [string | RegExp, string | Function]];

  if (replacers.some((r) => Array.isArray(r) && r.length !== 2)) {
    throw new Error('Replacers need to have a searchValue and a replaceValue');
  }

  for (const replacer of replacers) {
    const [searchValue, replaceValue] = replacer;
    actual = actual.replace(searchValue, replaceValue as string);
  }

  return actual;
}