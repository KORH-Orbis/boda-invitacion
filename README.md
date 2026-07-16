# Invitación Boda — Kevin & Claudia

## Deploy en Vercel

### 1. Crear cuenta en Supabase (gratis)
1. Ir a https://supabase.com y crear cuenta
2. Crear un nuevo proyecto (región: US East o la más cercana)
3. Ir a **SQL Editor** → pegar contenido de `supabase-schema.sql` → Ejecutar
4. Ir a **Project Settings** → **API** → copiar `URL` y `anon public key`

### 2. Deploy en Vercel
1. Subir esta carpeta a un repositorio en GitHub
2. Ir a https://vercel.com → Importar repositorio
3. En **Environment Variables**:
   - `SUPABASE_URL` → pegar URL de Supabase
   - `SUPABASE_ANON_KEY` → pegar anon key
4. Hacer clic en **Deploy**

### 3. Agregar invitados
Una vez deployado:
- Ir a `https://tusitio.vercel.app/`
- Usar el panel admin para agregar invitados
- Enviarles el link: `https://tusitio.vercel.app/slug-del-invitado`

### URLs
- Admin: `/`
- Invitación genérica: `/invitacion.html`
- Invitación personalizada: `/juan-perez`
