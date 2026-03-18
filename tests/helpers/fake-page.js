export function createFakePage(overrides = {}) {
  const defaults = {
    url: () => 'about:blank',
    goto: async () => undefined,
    evaluate: async (fn, ...args) => fn(...args),
    screenshot: async () => Buffer.from(''),
    close: async () => undefined,
    waitForSelector: async () => null,
    waitForLoadState: async () => undefined,
    title: async () => 'fake page',
    mouse: {
      click: async () => undefined,
      move: async () => undefined,
      down: async () => undefined,
      up: async () => undefined,
    },
    keyboard: {
      type: async () => undefined,
      press: async () => undefined,
    },
    $: async () => null,
  };

  return {
    ...defaults,
    ...overrides,
  };
}
