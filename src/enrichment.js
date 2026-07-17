function buildSearchUrl(query) {
  return `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
}

async function fetchText(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    headers: {
      'user-agent': 'PrivateBoardGameCatalog/1.0 (+https://localhost)'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status}`);
  }

  return response.text();
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
}

function parseDuckDuckGoResults(html) {
  const results = [];
  const blocks = html.match(/<div[^>]+class="[^"]*result[^"]*"[\s\S]*?(?=<div[^>]+class="[^"]*result[^"]*"|$)/g) || [];

  for (const block of blocks) {
    const link = block.match(/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!link) continue;
    const snippet = block.match(/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|<div[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    results.push({
      title: stripTags(link[2]),
      url: decodeHtml(link[1]),
      snippet: snippet ? stripTags(snippet[1] || snippet[2]) : ''
    });
    if (results.length === 5) break;
  }

  return results;
}

async function searchWeb(query, fetchImpl) {
  const html = await fetchText(buildSearchUrl(query), fetchImpl);
  return parseDuckDuckGoResults(html);
}

async function enrichGame(game, fetchImpl = fetch) {
  const base = `${game.title} ${game.publisher || ''} board game`.trim();
  const [prices, awards, rules] = await Promise.all([
    searchWeb(`${base} current price used new`, fetchImpl),
    searchWeb(`${base} awards won`, fetchImpl),
    searchWeb(`${base} rules pdf official`, fetchImpl)
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    prices,
    awards,
    rules
  };
}

module.exports = { buildSearchUrl, parseDuckDuckGoResults, searchWeb, enrichGame };
