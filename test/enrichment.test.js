const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSearchUrl, parseDuckDuckGoResults } = require('../src/enrichment');

test('buildSearchUrl encodes a query for DuckDuckGo HTML search', () => {
  assert.equal(
    buildSearchUrl('Catan rules pdf'),
    'https://duckduckgo.com/html/?q=Catan%20rules%20pdf'
  );
});

test('parseDuckDuckGoResults extracts compact result data', () => {
  const html = `
    <div class="result">
      <h2 class="result__title"><a class="result__a" href="https://example.com/rules"> Rules </a></h2>
      <a class="result__snippet">Official PDF rules.</a>
    </div>`;

  assert.deepEqual(parseDuckDuckGoResults(html), [
    { title: 'Rules', url: 'https://example.com/rules', snippet: 'Official PDF rules.' }
  ]);
});
