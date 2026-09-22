-- Extensiones requeridas por el esquema de Petorca en Ruta.
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- búsqueda por similitud de texto
create extension if not exists "postgis";    -- índices/columnas geoespaciales
