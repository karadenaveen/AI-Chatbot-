import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcesPath = path.resolve(__dirname, '..', 'data', 'sources.jsonl');

export function readAllSources() {
	const lines = fs.existsSync(sourcesPath) ? fs.readFileSync(sourcesPath, 'utf-8').split('\n') : [];
	const items = [];
	let idx = 0;
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			const obj = JSON.parse(trimmed);
			items.push({ id: String(idx++), ...obj });
		} catch {
			// skip bad line
		}
	}
	return items;
}

export function writeAllSources(items) {
	const out = items.map(({ id, ...rest }) => JSON.stringify(rest)).join('\n');
	fs.writeFileSync(sourcesPath, out + (out.endsWith('\n') ? '' : '\n'));
}

export function getSourceById(id) {
	const all = readAllSources();
	return all.find((x) => x.id === String(id));
}

export function updateSourceById(id, { title, url, text }) {
	const all = readAllSources();
	const idx = all.findIndex((x) => x.id === String(id));
	if (idx === -1) return false;
	const current = all[idx];
	all[idx] = { ...current, title: title ?? current.title, url: url ?? current.url, text: text ?? current.text };
	writeAllSources(all);
	return true;
}