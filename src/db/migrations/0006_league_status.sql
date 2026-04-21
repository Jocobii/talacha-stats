-- Migration 0006: league status
-- Agrega columna "status" a leagues para controlar el ciclo de vida de cada temporada.
-- active  → liga en curso (default)
-- finished → liga terminada (cerrada por el admin o detectada como rezagada)

ALTER TABLE leagues
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- Las ligas existentes quedan como 'active' por defecto.
-- El sistema detectará automáticamente las rezagadas al consultar el perfil del jugador.
