const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_DATA = { games: [] };

async function ensureStore(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

async function readStore(filePath) {
  await ensureStore(filePath);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw || JSON.stringify(DEFAULT_DATA));
}

async function writeStore(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function normalizeGame(input) {
  const now = new Date().toISOString();
  return {
    id: input.id || crypto.randomUUID(),
    title: String(input.title || '').trim(),
    publisher: String(input.publisher || '').trim(),
    year: input.year ? Number(input.year) : null,
    players: String(input.players || '').trim(),
    playTime: String(input.playTime || '').trim(),
    condition: String(input.condition || '').trim(),
    location: String(input.location || '').trim(),
    notes: String(input.notes || '').trim(),
    enrichment: input.enrichment || {},
    createdAt: input.createdAt || now,
    updatedAt: now
  };
}

module.exports = { ensureStore, readStore, writeStore, normalizeGame };
