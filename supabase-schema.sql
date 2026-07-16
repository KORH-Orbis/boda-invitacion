-- Crear tabla de invitados
CREATE TABLE invitados (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  nombre_completo TEXT DEFAULT '',
  lugares INTEGER DEFAULT 1,
  acompanantes_nombres TEXT DEFAULT '',
  confirmado BOOLEAN DEFAULT NULL,
  acompanantes INTEGER DEFAULT 0,
  mensaje TEXT DEFAULT '',
  actualizado TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para búsquedas por slug
CREATE INDEX idx_invitados_slug ON invitados (slug);
