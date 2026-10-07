-- Fuente del resumen de cada pueblo: el resumen se arma resumiendo (no
-- copiando) material publicado — Wikipedia, municipios, prensa — y la página
-- del pueblo muestra de dónde salió. `sources` (lugares/rutas/comunas) no
-- admite pueblos (su enum `entity_type` no tiene `locality`), así que la
-- fuente va como dos columnas opcionales en la propia fila del pueblo: una
-- sola fuente principal por pueblo, null mientras el resumen no tenga una.
alter table public.localities
  add column summary_source_url text,
  add column summary_source_label text;
