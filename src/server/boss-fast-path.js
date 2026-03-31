export function detectBossSurface(url, signals = {}) {
  const currentUrl = String(url ?? '');

  if (!currentUrl.includes('zhipin.com')) {
    return { surface: 'non_boss' };
  }

  if (signals.hasComposer || signals.hasSendButton || currentUrl.includes('/web/geek/chat')) {
    return { surface: 'chat' };
  }

  if (signals.hasChatEntry || currentUrl.includes('job_detail')) {
    return { surface: 'detail' };
  }

  if (signals.hasSearchLinks || currentUrl.includes('/web/geek/jobs')) {
    return { surface: 'search' };
  }

  return { surface: 'non_boss' };
}

export async function readBossSearchSurface(page) {
  const currentUrl = page.url();
  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="job_detail"]'))
      .map((node) => {
        const title = String(node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
        const href = node.getAttribute?.('href') ?? node.href ?? '';
        return title ? { title, href } : null;
      })
      .filter(Boolean);
  });
  return { currentUrl, jobs };
}

export async function readBossJobDetailSurface(page) {
  const currentUrl = page.url();
  const result = await page.evaluate(() => {
    const title = String(document.title || '').replace(/\s+/g, ' ').trim();
    const chatNode = document.querySelector('[data-url*="/wapi/zpgeek/friend/add.json"]');

    return {
      title,
      chatEntry: chatNode ? {
        text: String(chatNode.innerText || chatNode.textContent || '').replace(/\s+/g, ' ').trim(),
        redirectUrl: chatNode.getAttribute?.('redirect-url')
          ?? chatNode.getAttribute?.('data-url')
          ?? null,
      } : null,
    };
  });
  return { currentUrl, ...result };
}

export async function readBossChatSurface(page) {
  const currentUrl = page.url();
  const result = await page.evaluate(() => {
    const composer = document.querySelector('.chat-input[contenteditable="true"]');
    const sendButton = document.querySelector('button.btn-send');
    const historyNodes = Array.from(document.querySelectorAll('.item-myself, .item-friend, .message-item'))
      .slice(-3)
      .map((node) => String(node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    return {
      composerText: String(composer?.innerText || composer?.textContent || '').replace(/\s+/g, ' ').trim(),
      sendButtonText: String(sendButton?.innerText || sendButton?.textContent || '').replace(/\s+/g, ' ').trim(),
      historySignal: historyNodes.join('\n'),
    };
  });
  return { currentUrl, ...result };
}

function buildFastPathContent({ surface, title, url, text }) {
  const normalizedTitle = String(title ?? '').trim() || 'BOSS';
  const normalizedText = String(text ?? '').trim() || normalizedTitle;
  return {
    surface,
    title: normalizedTitle,
    url,
    mainText: normalizedText,
  };
}

export const bossFastPathAdapter = {
  id: 'boss',
  matches(url) {
    try {
      const { hostname } = new URL(String(url ?? ''));
      return hostname === 'bosszhipin.com'
        || hostname === 'zhipin.com'
        || hostname.endsWith('.bosszhipin.com')
        || hostname.endsWith('.zhipin.com');
    } catch {
      return false;
    }
  },
  async read(page) {
    const currentUrl = page.url();
    if (!this.matches(currentUrl)) {
      return null;
    }

    const [title, pageInfo] = await Promise.all([
      page.title(),
      page.evaluate(() => ({
        hasComposer: Boolean(document.querySelector('.chat-input[contenteditable="true"]')),
        hasSendButton: Boolean(document.querySelector('button.btn-send')),
        hasChatEntry: Boolean(document.querySelector('[data-url*="/wapi/zpgeek/friend/add.json"]')),
        hasSearchLinks: Boolean(document.querySelector('a[href*="job_detail"]')),
      })),
    ]);

    const { surface } = detectBossSurface(currentUrl, {
      title,
      ...pageInfo,
    });

    if (surface === 'non_boss') {
      return null;
    }

    if (surface === 'search') {
      const result = await readBossSearchSurface(page);
      return buildFastPathContent({
        surface,
        title,
        url: result.currentUrl,
        text: (result.jobs ?? []).map((job) => job.title).join('\n'),
      });
    }

    if (surface === 'detail') {
      const result = await readBossJobDetailSurface(page);
      return buildFastPathContent({
        surface,
        title: result.title || title,
        url: result.currentUrl,
        text: [
          result.title,
          result.chatEntry?.text,
          result.chatEntry?.redirectUrl,
        ].filter(Boolean).join('\n'),
      });
    }

    if (surface === 'chat') {
      const result = await readBossChatSurface(page);
      return buildFastPathContent({
        surface,
        title,
        url: result.currentUrl,
        text: [
          result.composerText,
          result.sendButtonText,
          result.historySignal,
        ].filter(Boolean).join('\n'),
      });
    }

    return null;
  },
};
