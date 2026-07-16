import { createServer } from 'http';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { createClient } from '@supabase/supabase-js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kcdrvrkkusvzsfgufesm.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'sb_publishable_GjegNRFDNvWZRiMpXAXosg_58pUcRrg'
);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(res, path) {
  const file = join(__dirname, path);
  if (!existsSync(file) || extname(file).includes('.') === false) return false;
  const ext = extname(file).toLowerCase();
  const ct = MIME[ext] || 'application/octet-stream';
  try {
    const content = readFileSync(file);
    const headers = { 'Content-Type': ct };
    if (path === '/sw.js') headers['Cache-Control'] = 'no-cache';
    res.writeHead(200, headers);
    res.end(content);
    return true;
  } catch { return false; }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.end();

  // API
  if (path === '/api/invitados') {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('invitados').select('*').order('created_at', { ascending: true });
      res.writeHead(error ? 500 : 200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(error ? { error: error.message } : { invitados: data }));
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      let slug = (body.slug || body.nombre || 'invitado').toString().trim().toLowerCase().replace(/\s+/g, '-');
      const invitado = {
        slug,
        nombre: (body.nombre || slug).trim(),
        nombre_completo: (body.nombre_completo || body.nombre || slug).trim(),
        lugares: parseInt(body.lugares) || 1,
        acompanantes_nombres: (body.acompanantes_nombres || '').trim(),
        confirmado: null, acompanantes: 0, mensaje: '', actualizado: ''
      };
      const { data, error } = await supabase.from('invitados').insert(invitado).select().single();
      res.writeHead(error ? (error.code === '23505' ? 400 : 500) : 201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(error ? { error: error.code === '23505' ? 'Ese slug ya existe' : error.message } : data));
    }
  }

  if (path.startsWith('/api/invitados/')) {
    const parts = path.replace('/api/invitados/', '').split('/');
    const slug = parts[0];

    if (parts.length === 1) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('invitados').select('*').eq('slug', slug).single();
        res.writeHead(error ? 404 : 200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(error ? { error: 'No encontrado' } : data));
      }
      if (req.method === 'PUT') {
        const body = await readBody(req);
        const updates = {};
        for (const k of ['nombre', 'nombre_completo', 'slug', 'lugares', 'confirmado', 'acompanantes', 'acompanantes_nombres', 'mensaje']) {
          if (body[k] !== undefined) updates[k] = body[k];
        }
        const { data, error } = await supabase.from('invitados').update(updates).eq('slug', slug).select().single();
        res.writeHead(error ? 404 : 200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(error ? { error: 'No encontrado' } : data));
      }
      if (req.method === 'DELETE') {
        await supabase.from('invitados').delete().eq('slug', slug);
        return res.end(JSON.stringify({ ok: true }));
      }
    }

    if (parts.length === 2 && parts[1] === 'rsvp' && req.method === 'POST') {
      const body = await readBody(req);
      const updates = {
        confirmado: body.attending === 'si',
        acompanantes: parseInt(body.guests) || 0,
        mensaje: (body.message || '').toString(),
        actualizado: new Date().toISOString()
      };
      const { data, error } = await supabase.from('invitados').update(updates).eq('slug', slug).select().single();
      res.writeHead(error ? 404 : 200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(error ? { error: 'No encontrado' } : data));
    }
  }

  // Static files
  if (path === '/' || path === '') {
    if (serveStatic(res, 'index.html')) return;
  }
  if (serveStatic(res, path)) return;

  // Guest pages -> serve invitacion.html
  if (!path.includes('.')) {
    if (serveStatic(res, 'invitacion.html')) return;
  }

  res.writeHead(404);
  res.end('Not found');
});

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
  });
}

server.listen(3000, () => {
  console.log('Local: http://localhost:3000');
});
