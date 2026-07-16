import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  const { slug } = req.query;
  const base = slug || [];

  // GET /api/invitados
  if (base.length === 0 && req.method === 'GET') {
    const { data, error } = await supabase.from('invitados').select('*').order('created_at', { ascending: true });
    if (error) return err(res, error.message, 500);
    return json(res, { invitados: data });
  }

  // POST /api/invitados
  if (base.length === 0 && req.method === 'POST') {
    const body = req.body || {};
    let slugInvitado = (body.slug || body.nombre || 'invitado').toString().trim().toLowerCase().replace(/\s+/g, '-');
    if (!slugInvitado) return err(res, 'Slug requerido');

    const invitado = {
      slug: slugInvitado,
      nombre: (body.nombre || slugInvitado).trim(),
      nombre_completo: (body.nombre_completo || body.nombre || slugInvitado).trim(),
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

  // GET /api/invitados/:slug
  if (base.length === 1 && base[0] !== 'rsvp' && req.method === 'GET') {
    const { data, error } = await supabase.from('invitados').select('*').eq('slug', base[0]).single();
    if (error) return err(res, 'No encontrado', 404);
    return json(res, data);
  }

  // PUT /api/invitados/:slug
  if (base.length === 1 && base[0] !== 'rsvp' && req.method === 'PUT') {
    const body = req.body || {};
    const updates = {};
    for (const key of ['nombre', 'nombre_completo', 'slug', 'lugares', 'confirmado', 'acompanantes', 'acompanantes_nombres', 'mensaje']) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const { data, error } = await supabase.from('invitados').update(updates).eq('slug', base[0]).select().single();
    if (error) return err(res, 'No encontrado', 404);
    return json(res, data);
  }

  // DELETE /api/invitados/:slug
  if (base.length === 1 && base[0] !== 'rsvp' && req.method === 'DELETE') {
    const { error } = await supabase.from('invitados').delete().eq('slug', base[0]);
    if (error) return err(res, 'No encontrado', 404);
    return json(res, { ok: true });
  }

  // POST /api/invitados/:slug/rsvp
  if (base.length === 2 && base[1] === 'rsvp' && req.method === 'POST') {
    const body = req.body || {};
    const updates = {
      confirmado: body.attending === 'si',
      acompanantes: parseInt(body.guests) || 0,
      mensaje: (body.message || '').toString(),
      actualizado: new Date().toISOString()
    };
    const { data, error } = await supabase.from('invitados').update(updates).eq('slug', base[0]).select().single();
    if (error) return err(res, 'No encontrado', 404);
    return json(res, data);
  }

  return err(res, 'Ruta no encontrada', 404);
}
