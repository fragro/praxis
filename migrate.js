#!/usr/bin/env node

/**
 * PRAXIS Content Migration Script
 *
 * Parses index.html and creates Ghost pages and posts via the Admin API.
 *
 * Usage:
 *   npm install cheerio jsonwebtoken
 *   node migrate.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

let cheerio;
try { cheerio = require('cheerio'); } catch { console.error('Run: npm install cheerio'); process.exit(1); }

const GHOST_URL = process.env.GHOST_URL || 'http://localhost:3169';
const ADMIN_KEY = process.env.GHOST_ADMIN_KEY;

if (!ADMIN_KEY) {
  console.error('Set GHOST_ADMIN_KEY env var (format: id:secret)');
  console.error('Create one in Ghost Admin > Settings > Integrations');
  process.exit(1);
}

// Generate Ghost Admin API JWT token
function makeToken() {
  const [id, secret] = ADMIN_KEY.split(':');
  const key = Buffer.from(secret, 'hex');

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iat: now,
    exp: now + 300,
    aud: '/admin/'
  })).toString('base64url');

  const sig = crypto.createHmac('sha256', key).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

function ghostApi(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, GHOST_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Ghost ${makeToken()}`
      }
    };

    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createTag(name, slug, visibility = 'internal') {
  const res = await ghostApi('POST', '/ghost/api/admin/tags/', {
    tags: [{ name, slug, visibility }]
  });
  if (res.data.tags) return res.data.tags[0];
  // May already exist
  const existing = await ghostApi('GET', `/ghost/api/admin/tags/slug/${slug}/`);
  if (existing.data.tags) return existing.data.tags[0];
  console.error('  Failed to create tag:', name);
  return null;
}

async function createPage(title, slug, htmlContent, excerpt, tagIds) {
  const res = await ghostApi('POST', '/ghost/api/admin/pages/', {
    pages: [{
      title, slug, status: 'published',
      mobiledoc: JSON.stringify({
        version: '0.3.1', atoms: [], markups: [],
        cards: [['html', { html: htmlContent }]],
        sections: [[10, 0]]
      }),
      custom_excerpt: excerpt || undefined,
      tags: tagIds.map(id => ({ id }))
    }]
  });
  if (res.data.pages) return res.data.pages[0];
  console.error('  Failed to create page:', title, (res.data.errors || [])[0]?.message || '');
  return null;
}

async function createPost(title, slug, question, hint, tagIds) {
  const res = await ghostApi('POST', '/ghost/api/admin/posts/', {
    posts: [{
      title, slug, status: 'published',
      mobiledoc: JSON.stringify({
        version: '0.3.1', atoms: [], markups: [],
        cards: [], sections: [[1, 'p', [[0, [], 0, question]]]]
      }),
      custom_excerpt: hint ? hint.substring(0, 300) : undefined,
      tags: tagIds.map(id => ({ id }))
    }]
  });
  if (res.data.posts) return res.data.posts[0];
  const err = (res.data.errors || [])[0];
  console.error('  Failed to create post:', title, JSON.stringify(err || res.data).substring(0, 300));
  return null;
}

async function main() {
  // Test auth
  const test = await ghostApi('GET', '/ghost/api/admin/site/');
  if (test.status !== 200) {
    console.error('Auth failed. Check ADMIN_KEY.');
    process.exit(1);
  }
  console.log('Connected to Ghost');

  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
  const $ = cheerio.load(html);

  const sectionOrder = [
    'vision', 'values', 'foundations', 'architecture',
    'power', 'technology', 'civic-engine', 'communications',
    'coalition', 'implementation', 'working-groups', 'resources'
  ];

  // Create category tags
  console.log('Creating tags...');
  const categoryTags = {};
  for (const name of ['build', 'tool', 'model', 'sop', 'assess', 'plan', 'guide']) {
    const tag = await createTag(name.toUpperCase(), `hash-${name}`, 'internal');
    if (tag) categoryTags[name] = tag;
  }
  const sectionParentTag = await createTag('section', 'hash-section', 'internal');
  console.log(`  ${Object.keys(categoryTags).length + 1} tags created`);

  let pageCount = 0, postCount = 0;
  const usedSlugs = new Set();

  const sections = $('.section').toArray();
  for (const sectionEl of sections) {
    const $s = $(sectionEl);
    const sectionId = $s.attr('id');
    if (!sectionId) continue;
    const sectionNum = sectionOrder.indexOf(sectionId) + 1;
    if (sectionNum === 0) continue;

    const title = $s.find('.doc-title').first().text().trim();
    const lead = $s.find('.doc-lead').first().text().trim();
    const eyebrow = $s.find('.doc-eyebrow').first().text().trim();

    const sectionTag = await createTag(`Section ${String(sectionNum).padStart(2,'0')}`, `hash-section-${sectionId}`, 'internal');
    const visibleTag = await createTag(`${String(sectionNum).padStart(2,'0')} - ${eyebrow || title}`, `section-${sectionId}`, 'public');

    // Build page content without prompt cards
    const clone = $s.clone();
    clone.find('.prompt-card').remove();
    clone.find('.doc-footer').remove();
    const wrap = clone.find('.section-wrap');
    let content = (wrap.length ? wrap.html() : clone.html()).replace(/src="img\//g, 'src="/assets/img/');

    const pageTitle = `${String(sectionNum).padStart(2,'0')} \u2014 ${eyebrow || title}`;
    const tagIds = [sectionParentTag, visibleTag].filter(Boolean).map(t => t.id);
    const page = await createPage(pageTitle, sectionId, content.trim(), lead.substring(0, 300), tagIds);
    if (page) { pageCount++; console.log(`Page ${pageCount}: ${page.title}`); }

    // Create prompts
    const cards = $s.find('.prompt-card').toArray();
    for (const cardEl of cards) {
      const $c = $(cardEl);
      const category = $c.attr('data-category') || 'build';
      const eyebrowText = $c.find('.prompt-eyebrow').text().trim();
      const question = $c.find('.prompt-question').text().trim();
      const hint = $c.find('.prompt-hint').text().trim();

      const colonIdx = eyebrowText.indexOf(':');
      const promptTitle = colonIdx >= 0 ? eyebrowText.substring(colonIdx + 1).trim() : eyebrowText;
      let promptSlug = promptTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      // Ensure unique slug
      if (usedSlugs.has(promptSlug)) {
        promptSlug = `${promptSlug}-${sectionId}`;
      }
      usedSlugs.add(promptSlug);

      const postTagIds = [categoryTags[category], sectionTag, visibleTag].filter(Boolean).map(t => t.id);
      const post = await createPost(promptTitle, promptSlug, question, hint, postTagIds);
      if (post) { postCount++; process.stdout.write(`\r  Prompts: ${postCount}`); }
    }
    if (cards.length) console.log('');
  }

  // Import manifesto if manifesto.html exists
  const manifestoPath = path.join(__dirname, 'manifesto.html');
  if (fs.existsSync(manifestoPath)) {
    console.log('Importing manifesto...');
    const manifestoHtml = fs.readFileSync(manifestoPath, 'utf-8');
    const $m = cheerio.load(manifestoHtml);

    // Extract the article content and inline styles
    const styleBlock = $m('style').html() || '';
    const articleHtml = $m('article').html() || $m('.manifesto').html() || '';

    if (articleHtml) {
      const manifestoContent = `<style>${styleBlock}</style>\n${articleHtml}`;
      const manifestoPage = await createPage(
        'The Manifesto',
        'manifesto',
        manifestoContent,
        'Build the lifeboat. A manifesto for parallel democratic infrastructure.',
        []
      );
      if (manifestoPage) {
        console.log('  Manifesto page created');
        pageCount++;
      }
    }
  }

  console.log(`\nDone! ${pageCount} pages, ${postCount} prompts`);
  console.log(`Site: ${GHOST_URL}`);
  console.log(`Admin: ${GHOST_URL}/ghost/`);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
