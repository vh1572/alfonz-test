const gamesEl = document.querySelector('#games');
const form = document.querySelector('#game-form');
const filter = document.querySelector('#filter');
const template = document.querySelector('#game-card-template');
let games = [];

async function api(path, options) {
  const response = await fetch(path, {
    headers: { 'content-type': 'application/json' },
    ...options
  });
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? null : response.json();
}

function renderLinks(title, items = []) {
  if (!items.length) return '';
  return `<section><h4>${title}</h4><ul>${items.map((item) => `<li><a href="${item.url}" target="_blank" rel="noreferrer">${item.title}</a><p>${item.snippet || ''}</p></li>`).join('')}</ul></section>`;
}

function render() {
  const term = filter.value.toLowerCase();
  gamesEl.innerHTML = '';
  games
    .filter((game) => JSON.stringify(game).toLowerCase().includes(term))
    .forEach((game) => {
      const card = template.content.cloneNode(true);
      card.querySelector('h3').textContent = game.title;
      card.querySelector('.meta').textContent = [game.publisher, game.year, game.players && `${game.players} players`, game.playTime, game.condition, game.location].filter(Boolean).join(' · ');
      card.querySelector('.notes').textContent = game.notes;
      card.querySelector('.delete').addEventListener('click', async () => {
        await api(`/api/games/${game.id}`, { method: 'DELETE' });
        await loadGames();
      });
      card.querySelector('.enrich').addEventListener('click', async (event) => {
        event.target.textContent = 'Collecting...';
        await api(`/api/games/${game.id}/enrich`, { method: 'PUT' });
        await loadGames();
      });
      if (game.enrichment?.fetchedAt) {
        card.querySelector('.enrichment').innerHTML = `<p>Internet data collected ${new Date(game.enrichment.fetchedAt).toLocaleString()}.</p>${renderLinks('Prices', game.enrichment.prices)}${renderLinks('Awards won', game.enrichment.awards)}${renderLinks('Rules', game.enrichment.rules)}`;
      }
      gamesEl.append(card);
    });
}

async function loadGames() {
  games = await api('/api/games');
  render();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  await api('/api/games', { method: 'POST', body: JSON.stringify(data) });
  form.reset();
  await loadGames();
});

filter.addEventListener('input', render);
loadGames().catch((error) => {
  gamesEl.textContent = `Could not load games: ${error.message}`;
});
