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

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('invitados').select('*').order('created_at', { ascending: true });
    if (error) return err(res, error.message, 500);
    return json(res, { invitados: data });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    let slug = (body.slug || body.nombre || 'invitado').toString().trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug) return err(res, 'Slug requerido');
    const invitado = {
      slug,
      nombre: (body.nombre || slug).trim(),
      nombre_completo: (body.nombre_completo || body.nombre || slug).trim(),
      lugares: parseInt(body.lugares) || 1,
      acompanantes_nombres: (body.acompanantes_nombres || '').trim(),
      confirmado: null,
      acompanantes: 0,
      mensaje: '',
      actualizado: ''
    };
    const { data, error } = await supabase.from('invitados').insert(invitado).select().single();
    if (error) {
      if (error.code === '23505') return err(res, 'Ese slug ya existe', 400);
      return err(res, error.message, 500);
    }
    return json(res, data, 201);
  }

  return err(res, 'Método no soportado', 405);
}
