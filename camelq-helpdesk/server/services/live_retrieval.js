import { load as cheerioLoad } from 'cheerio';
import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';

const cache = {
	fetchedAt: 0,
	pages: [], // [{ url, title, text }]
	vectors: [], // [{ url, title, text, embedding }]
};

function nowSeconds(){ return Math.floor(Date.now()/1000); }

function cleanHtmlToDoc(html, url){
	const $ = cheerioLoad(html);
	$('script, style, noscript, svg, nav, footer, form, iframe').remove();
	const title = ($('title').first().text() || '').trim();
	const text = $('body').text().replace(/\s+/g, ' ').trim();
	return { url, title, text };
}

function hostsEquivalent(a, b){
	const na = (a||'').toLowerCase().replace(/^www\./,'');
	const nb = (b||'').toLowerCase().replace(/^www\./,'');
	return na === nb;
}

function normalizeUrl(baseUrl, href){
	try{
		const u = new URL(href, baseUrl);
		const base = new URL(baseUrl);
		if(!hostsEquivalent(u.host, base.host)) return null;
		u.hash = '';
		return u.toString();
	}catch{ return null; }
}

async function crawlSnapshot(){
	const baseUrl = process.env.LIVE_SITE_BASE_URL;
	const maxPages = parseInt(process.env.LIVE_MAX_PAGES || '50', 10);
	if(!baseUrl) return { pages: [] };
	const seen = new Set();
	const queue = [baseUrl];
	const pages = [];
	while(queue.length && pages.length < maxPages){
		const url = queue.shift();
		if(!url || seen.has(url)) continue; seen.add(url);
		try{
			const res = await fetch(url, { headers: { 'User-Agent': 'CamelQ-HelpdeskLive/1.0' } });
			if(!res.ok) continue;
			const html = await res.text();
			const doc = cleanHtmlToDoc(html, url);
			if((doc.text||'').length > 100){ pages.push(doc); }
			const $ = cheerioLoad(html);
			$('a[href]').each((_, a)=>{
				const href = $(a).attr('href');
				const nu = normalizeUrl(baseUrl, href);
				if(nu && !seen.has(nu) && (queue.length + pages.length) < maxPages*3){ queue.push(nu); }
			});
		}catch{ /* ignore */ }
	}
	return { pages };
}

function chunkText(text, { maxChars = 2500, overlap = 200 } = {}){
	const chunks = [];
	let start = 0;
	while(start < text.length){
		const end = Math.min(start + maxChars, text.length);
		const chunk = text.slice(start, end).trim();
		if(chunk.length > 200) chunks.push(chunk);
		start = end - overlap; if(start < 0) start = 0; if(start >= text.length) break;
	}
	return chunks;
}

function keywordScore(query, text){
	const q = (query||'').toLowerCase(); const t = (text||'').toLowerCase();
	let s = 0; for(const tok of q.split(/\W+/).filter(Boolean)){ if(t.includes(tok)) s++; }
	return s;
}

async function ensureFreshSnapshot(){
	const ttl = parseInt(process.env.LIVE_CACHE_TTL_SECONDS || '600', 10);
	if((nowSeconds() - cache.fetchedAt) < ttl && cache.pages.length){ return; }
	const { pages } = await crawlSnapshot();
	cache.fetchedAt = nowSeconds();
	cache.pages = pages;
	cache.vectors = []; // clear embeddings; will rebuild lazily
}

async function ensureEmbeddings(){
	if(!process.env.OPENAI_API_KEY) return; // skip if no key
	if(cache.vectors.length) return; // already built for current snapshot
	const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
	const vectors = [];
	for(const page of cache.pages){
		for(const chunk of chunkText(page.text)){
			const emb = await client.embeddings.create({ model: EMBEDDING_MODEL, input: chunk });
			const embedding = emb.data?.[0]?.embedding;
			if(embedding) vectors.push({ url: page.url, title: page.title, text: chunk, embedding });
		}
	}
	cache.vectors = vectors;
}

function cosineSimilarity(a, b){
	if(!a || !b || a.length !== b.length) return 0;
	let dot=0, na=0, nb=0; for(let i=0;i<a.length;i++){ const va=a[i], vb=b[i]; dot+=va*vb; na+=va*va; nb+=vb*vb; }
	if(!na||!nb) return 0; return dot/(Math.sqrt(na)*Math.sqrt(nb));
}

export async function getLiveRelevantChunks(query, { topK = 6 } = {}){
	await ensureFreshSnapshot();
	if(!cache.pages.length) return [];
	// With embeddings
	if(process.env.OPENAI_API_KEY){
		await ensureEmbeddings();
		const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
		const emb = await client.embeddings.create({ model: EMBEDDING_MODEL, input: query });
		const qvec = emb.data?.[0]?.embedding; if(!qvec) return [];
		return cache.vectors
			.map(v => ({ ...v, score: cosineSimilarity(qvec, v.embedding) }))
			.sort((a,b)=>b.score-a.score)
			.slice(0, topK)
			.map(({ url, title, text, score })=>({ url, title, text, score }));
	}
	// Fallback keyword scoring
	const scored = [];
	for(const page of cache.pages){
		for(const chunk of chunkText(page.text)){
			scored.push({ url: page.url, title: page.title, text: chunk, score: keywordScore(query, chunk) });
		}
	}
	return scored.filter(s=>s.score>0).sort((a,b)=>b.score-a.score).slice(0, topK);
}