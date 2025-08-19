#!/usr/bin/env node
import { argv } from 'node:process';
import { URL } from 'node:url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.resolve(__dirname, '..', 'data', 'sources.jsonl');

function getArg(name, def = undefined) {
  const flag = `--${name}=`;
  const hit = argv.find((a) => a.startsWith(flag));
  return hit ? hit.slice(flag.length) : process.env[name.toUpperCase()] || def;
}

const baseUrl = getArg('baseUrl');
const maxPages = parseInt(getArg('maxPages', '50'), 10);
if (!baseUrl) {
  console.error('Usage: node scripts/crawl.js --baseUrl=https://example.com [--maxPages=100]');
  process.exit(1);
}

const baseHost = new URL(baseUrl).host;
const queue = [baseUrl];
const seen = new Set();
let written = 0;

function normalizeUrl(u) {
  try {
    const url = new URL(u, baseUrl);
    if (url.host !== baseHost) return null;
    // drop hash
    url.hash = '';
    // drop trailing slash normalization
    if (url.pathname.endsWith('/')) url.pathname = url.pathname.replace(/\/+$/, '/');
    return url.toString();
  } catch {
    return null;
  }
}

function cleanText(html, url) {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, nav, footer, form, iframe').remove();
  const title = ($('title').first().text() || '').trim();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { title, text, url };
}

async function fetchPage(u) {
  const res = await fetch(u, { headers: { 'User-Agent': 'CamelQ-HelpdeskBot/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return html;
}

async function run() {
  console.log(`Crawling ${baseUrl} (maxPages=${maxPages})`);
  const out = fs.createWriteStream(outPath, { flags: 'w' });
  while (queue.length && written < maxPages) {
    const u = queue.shift();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    try {
      const html = await fetchPage(u);
      const { title, text } = cleanText(html, u);
      if (text && text.length > 100) {
        out.write(JSON.stringify({ url: u, title, text }) + '\n');
        written += 1;
        console.log(`Saved: ${u}`);
      }
      const $ = cheerio.load(html);
      $('a[href]').each((_, a) => {
        const href = $(a).attr('href');
        const nu = normalizeUrl(href);
        if (nu && !seen.has(nu) && queue.length + seen.size < maxPages * 3) {
          queue.push(nu);
        }
      });
    } catch (e) {
      console.warn(`Skip ${u}: ${e.message}`);
    }
  }
  out.end();
  console.log(`Done. Wrote ${written} pages to ${outPath}`);
}

run().catch((e) => { console.error(e); process.exit(1); });