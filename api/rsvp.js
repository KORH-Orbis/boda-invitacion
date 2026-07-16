import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

function json(res, data, status = 200) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(data);
}

function err(res, msg, code = 400) {
  return json(res, { error: msg }, code);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') return err(res, 'Método no soportado', 405);

  const slug = req.query.slug;
  if (!slug) return err(res, 'Slug requerido', 400);

  const body = req.body || {};
  const updates = {
    confirmado: body.attending === 'si',
    acompanantes: parseInt(body.guests) || 0,
    mensaje: (body.message || '').toString(),
    actualizado: new Date().toISOString()
  };
  const { data, error } = await supabase.from('invitados').update(updates).eq('slug', slug).select().single();
  if (error) return err(res, 'No encontrado', 404);
  return json(res, data);
}
