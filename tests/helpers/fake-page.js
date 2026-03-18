export function createFakePage(overrides = {}) {
  const { url, title, mouse, keyboard, ...rest } = overrides;

  const buildAccessor = (value, fallback) => {
    if (value === undefined) {
      return () => fallback;
    }

    if (typeof value === 'function') {
      return value;
    }

    return () => value;
  };

  const defaults = {
    url: buildAccessor(url, 'about:blank'),
    goto: async () => undefined,
    evaluate: async (fn, ...args) => fn(...args),
    screenshot: async () => Buffer.from(''),
    close: async () => undefined,
    waitForSelector: async () => null,
    waitForLoadState: async () => undefined,
    title: buildAccessor(title, 'fake page'),
    mouse: {
      click: async () => undefined,
      move: async () => undefined,
      down: async () => undefined,
      up: async () => undefined,
      wheel: async () => undefined,
      ...(mouse ?? {}),
    },
    keyboard: {
      type: async () => undefined,
      press: async () => undefined,
      ...(keyboard ?? {}),
    },
    $: async () => null,
  };

  return {
    ...defaults,
    ...rest,
  };
}
