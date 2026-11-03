-- Eventos de la comuna ("Qué pasa en Petorca", página /eventos). Pedido del
-- usuario: un apartado de eventos ("Cocinando con el Diablo", el aniversario
-- de Petorca, el de algún club…). Un solo script para pegar en el SQL Editor
-- de city_tour, tal cual: se aplica en `legacy` y en `legacy_dev` (si
-- existe). No toca `public` (Papudo).
--
-- Qué hace, en cada esquema:
--   1. Crea `events` y `event_translations` (mismo diseño que
--      supabase/migrations/0026_events.sql), con RLS: todos leen lo
--      publicado; solo el equipo del panel escribe. Registro de cambios.
--   2. Carga los eventos que ya tienen fuente (docs/PROPUESTA-CONTENIDO-
--      PETORCA.md y docs/CATALOGO-CANDIDATOS-PETORCA.md), en español, inglés
--      y portugués. Solo lo que dice la fuente: sin fecha confirmada, solo el
--      mes; nunca un día inventado. El aniversario de Petorca y los de clubes
--      se cargan desde el panel cuando haya fecha y fuente.
--
-- Repetible (vuelve a dejar los textos de estos eventos como acá). Una sola
-- transacción: si algo falla, no cambia nada.

begin;

do $$
declare
  s text;
  t text;
  eid uuid;
  ev record;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    -- 1) Tablas -------------------------------------------------------------
    execute format(
      'create table if not exists %1$I.events (
         id uuid primary key default gen_random_uuid(),
         slug text not null unique,
         commune_id uuid not null references %1$I.communes (id) on delete cascade,
         locality_id uuid references %1$I.localities (id) on delete set null,
         place_id uuid references %1$I.places (id) on delete set null,
         starts_on date,
         ends_on date,
         start_time time,
         usual_month smallint check (usual_month between 1 and 12),
         usual_month_end smallint check (usual_month_end between 1 and 12),
         organizer text,
         source_url text,
         source_label text,
         cover_image text,
         published boolean not null default true,
         created_at timestamptz not null default now(),
         constraint events_has_when check (starts_on is not null or usual_month is not null),
         constraint events_end_after_start check (ends_on is null or (starts_on is not null and ends_on >= starts_on)),
         constraint events_month_end_needs_month check (usual_month_end is null or usual_month is not null)
       )', s);
    execute format('create index if not exists events_commune_idx on %1$I.events (commune_id)', s);
    execute format('create index if not exists events_locality_idx on %1$I.events (locality_id)', s);
    execute format('create index if not exists events_place_idx on %1$I.events (place_id)', s);

    execute format(
      'create table if not exists %1$I.event_translations (
         event_id uuid not null references %1$I.events (id) on delete cascade,
         locale %1$I.locale not null,
         name text not null,
         description text,
         when_note text,
         primary key (event_id, locale)
       )', s);

    execute format('alter table %1$I.events enable row level security', s);
    execute format('alter table %1$I.event_translations enable row level security', s);

    execute format('drop policy if exists events_public_read on %1$I.events', s);
    execute format(
      'create policy events_public_read on %1$I.events
         for select using (published or %1$I.is_admin())', s);
    execute format('drop policy if exists events_admin_write on %1$I.events', s);
    execute format(
      'create policy events_admin_write on %1$I.events
         for all using (%1$I.is_admin()) with check (%1$I.is_admin())', s);
    execute format('drop policy if exists event_translations_public_read on %1$I.event_translations', s);
    execute format(
      'create policy event_translations_public_read on %1$I.event_translations
         for select using (true)', s);
    execute format('drop policy if exists event_translations_admin_write on %1$I.event_translations', s);
    execute format(
      'create policy event_translations_admin_write on %1$I.event_translations
         for all using (%1$I.is_admin()) with check (%1$I.is_admin())', s);

    -- Igual que el resto de las tablas del diablo: el acceso real lo da la RLS.
    execute format(
      'grant all on table %1$I.events, %1$I.event_translations
         to anon, authenticated, service_role', s);

    -- Registro de cambios (supabase/manual/admin-roles.sql), si ya está.
    if to_regprocedure(format('%I.log_change()', s)) is not null then
      foreach t in array array['events', 'event_translations'] loop
        execute format('drop trigger if exists audit_changes on %I.%I', s, t);
        execute format(
          'create trigger audit_changes after insert or update or delete
             on %I.%I for each row execute function %I.log_change()',
          s, t, s);
      end loop;
    end if;

    -- 2) Eventos con fuente ---------------------------------------------------
    for ev in
      select * from (values
        (
          'cocinando-con-el-diablo', 'petorca', 'petorca-plaza',
          date '2026-10-31', '11:00'::time, 10, null::int,
          'Ruta Turística Donde el Diablo Perdió el Poncho y Municipalidad de Petorca',
          'https://laliguanoticias.cl/2026/10/23/cocinando-con-el-diablo-reunira-en-petorca-gastronomia-musica-y-patrimonio-este-31-de-octubre/',
          'La Ligua Noticias, 23-10-2026',
          'Cocinando con el Diablo',
          'Fiesta de cocina y patrimonio en la Plaza de Petorca: feria de emprendedores de la ruta y de la provincia, cocinerías y cocina en vivo, vinos del valle, talleres de oficios (tejido, alfarería, pigmentos, petroglifos), buses a viñas y petroglifos, y música hasta la noche. En 2026 fue su segunda versión.',
          'Fines de octubre',
          'Cocinando con el Diablo',
          'A food and heritage festival in Petorca''s main square: a fair of local entrepreneurs, food stalls and live cooking, valley wines, craft workshops (weaving, pottery, pigments, petroglyphs), buses to vineyards and petroglyphs, and music into the night. 2026 was its second edition.',
          'Late October',
          'Cocinando con el Diablo',
          'Festa de cozinha e patrimônio na praça de Petorca: feira de empreendedores da rota e da província, barracas de comida e cozinha ao vivo, vinhos do vale, oficinas de ofícios (tecelagem, cerâmica, pigmentos, petróglifos), ônibus para vinícolas e petróglifos, e música até a noite. Em 2026 foi a sua segunda edição.',
          'Fim de outubro'
        ),
        (
          'fiesta-de-la-merced-petorca', 'petorca', 'iglesia-la-merced-petorca',
          null::date, null::time, 9, null::int,
          'Unión Comunal de Cultura de Petorca',
          'https://g5noticias.cl/2025/10/01/religiosidad-patrimonio-y-cultura-comunitaria-petorca-celebro-con-alegria-la-fiesta-de-nuestra-senora-de-la-merced/',
          'G5 Noticias, 01-10-2025',
          'Fiesta de Nuestra Señora de la Merced',
          'La gran fiesta religiosa de Petorca, en torno a la Iglesia La Merced: canto a lo divino, misa, bajada de la Virgen y procesión por las calles sobre una alfombra de flores que arman vecinos y devotos, con bailes chinos.',
          'Fines de septiembre',
          'Feast of Our Lady of Mercy',
          'Petorca''s great religious festival, centred on La Merced church: sacred folk singing (canto a lo divino), mass, the bringing down of the Virgin and a procession through the streets over a carpet of flowers made by neighbours and devotees, with bailes chinos dancers.',
          'Late September',
          'Festa de Nossa Senhora das Mercês',
          'A grande festa religiosa de Petorca, em torno da Igreja La Merced: canto a lo divino, missa, descida da Virgem e procissão pelas ruas sobre um tapete de flores feito por vizinhos e devotos, com os bailes chinos.',
          'Fim de setembro'
        ),
        (
          'fiesta-de-la-merced-hierro-viejo', 'hierro-viejo', null,
          null::date, null::time, 9, null::int,
          null,
          'https://www.patrimonioinmaterial.gob.cl/sites/www.patrimonioinmaterial.gob.cl/files/2021-11/Infograf%C3%ADa-Bailes-Chinos-Valpara%C3%ADso_VERSION-DIGITAL.pdf',
          'Patrimonio Inmaterial de Chile, bailes chinos de Valparaíso',
          'Fiesta de la Virgen de la Merced',
          'Fiesta religiosa de Hierro Viejo en honor a la Virgen de la Merced, una de las fiestas de bailes chinos de la región.',
          null,
          'Feast of the Virgin of Mercy',
          'Hierro Viejo''s religious festival in honour of the Virgin of Mercy, one of the region''s bailes chinos festivals.',
          null,
          'Festa da Virgem das Mercês',
          'Festa religiosa de Hierro Viejo em honra à Virgem das Mercês, uma das festas de bailes chinos da região.',
          null
        ),
        (
          'fiesta-virgen-del-rosario-hierro-viejo', 'hierro-viejo', null,
          null::date, null::time, 10, null::int,
          null,
          'https://www.patrimonioinmaterial.gob.cl/sites/www.patrimonioinmaterial.gob.cl/files/2021-11/Infograf%C3%ADa-Bailes-Chinos-Valpara%C3%ADso_VERSION-DIGITAL.pdf',
          'Patrimonio Inmaterial de Chile, bailes chinos de Valparaíso',
          'Fiesta de la Virgen del Rosario',
          'Fiesta religiosa de Hierro Viejo en honor a la Virgen del Rosario, también con bailes chinos.',
          null,
          'Feast of Our Lady of the Rosary',
          'Hierro Viejo''s religious festival in honour of Our Lady of the Rosary, also with bailes chinos dancers.',
          null,
          'Festa de Nossa Senhora do Rosário',
          'Festa religiosa de Hierro Viejo em honra a Nossa Senhora do Rosário, também com os bailes chinos.',
          null
        ),
        (
          'natalicio-manuel-montt', 'petorca', 'petorca-plaza',
          date '2026-09-04', null::time, 9, null::int,
          null,
          'https://www.cultura.gob.cl/actualidad/ministro-francisco-undurraga-participo-en-el-217-aniversario-del-natalicio-del-expresidente-manuel-montt-en-petorca/',
          'Ministerio de las Culturas, 2026',
          'Natalicio de Manuel Montt',
          'Ceremonia cívica en la Plaza de Armas de Petorca para recordar el nacimiento del expresidente Manuel Montt, nacido en la comuna. En 2026 se cumplieron 217 años.',
          '4 de septiembre',
          'Manuel Montt''s birthday',
          'A civic ceremony in Petorca''s main square to remember the birth of former president Manuel Montt, who was born in the commune. 2026 marked 217 years.',
          'September 4',
          'Nascimento de Manuel Montt',
          'Cerimônia cívica na praça principal de Petorca para lembrar o nascimento do ex-presidente Manuel Montt, nascido na comuna. Em 2026 completaram-se 217 anos.',
          '4 de setembro'
        ),
        (
          'quema-de-judas-petorca', 'petorca', null,
          null::date, null::time, 4, null::int,
          null,
          'https://www.sernatur.cl/wp-content/uploads/2018/09/V-REGION-DE-VALPARAISO.pdf',
          'Sernatur, inventario de atractivos turísticos',
          'Quema de Judas',
          'Tradición de Semana Santa en Petorca, que Sernatur registra entre los acontecimientos de la comuna: la quema del Judas.',
          'Semana Santa',
          'Burning of Judas',
          'A Holy Week tradition in Petorca, listed by Sernatur among the commune''s events: the burning of the Judas.',
          'Holy Week',
          'Queima de Judas',
          'Tradição da Semana Santa em Petorca, registrada pelo Sernatur entre os eventos da comuna: a queima do Judas.',
          'Semana Santa'
        ),
        (
          'veranada-pedernal', 'pedernal', null,
          null::date, null::time, 12, 4,
          null,
          'https://www.sernatur.cl/wp-content/uploads/2018/09/V-REGION-DE-VALPARAISO.pdf',
          'Sernatur, inventario de atractivos turísticos',
          'Veranada',
          'De diciembre a abril, en Pedernal, el ganado se arrea a los pastos de la cordillera: una tradición de campo que Sernatur registra como atractivo de la comuna.',
          null,
          'Veranada (summer grazing)',
          'From December to April, in Pedernal, livestock is driven up to the mountain pastures: a rural tradition that Sernatur lists as one of the commune''s attractions.',
          null,
          'Veranada (pastagem de verão)',
          'De dezembro a abril, em Pedernal, o gado é levado às pastagens da cordilheira: uma tradição do campo que o Sernatur registra como atrativo da comuna.',
          null
        )
      ) as v (
        slug, locality_slug, place_slug, starts_on, start_time, usual_month,
        usual_month_end, organizer, source_url, source_label,
        es_name, es_description, es_when,
        en_name, en_description, en_when,
        pt_name, pt_description, pt_when
      )
    loop
      execute format(
        'insert into %1$I.events (
           slug, commune_id, locality_id, place_id, starts_on, start_time,
           usual_month, usual_month_end, organizer, source_url, source_label)
         select $1, c.id,
                (select l.id from %1$I.localities l
                  where l.commune_id = c.id and l.slug = $2),
                (select p.id from %1$I.places p where p.slug = $3),
                $4, $5, $6, $7, $8, $9, $10
           from %1$I.communes c
          where c.slug = ''petorca''
         on conflict (slug) do update
           set locality_id = excluded.locality_id,
               place_id = excluded.place_id,
               starts_on = excluded.starts_on,
               start_time = excluded.start_time,
               usual_month = excluded.usual_month,
               usual_month_end = excluded.usual_month_end,
               organizer = excluded.organizer,
               source_url = excluded.source_url,
               source_label = excluded.source_label
         returning id', s)
        into eid
        using ev.slug, ev.locality_slug, ev.place_slug, ev.starts_on,
              ev.start_time, ev.usual_month, ev.usual_month_end, ev.organizer,
              ev.source_url, ev.source_label;
      if eid is null then
        raise exception 'En %, no está la comuna de Petorca. No se cambió nada.', s;
      end if;

      execute format(
        'insert into %1$I.event_translations (event_id, locale, name, description, when_note)
         values ($1, ''es''::%1$I.locale, $2, $3, $4),
                ($1, ''en''::%1$I.locale, $5, $6, $7),
                ($1, ''pt''::%1$I.locale, $8, $9, $10)
         on conflict (event_id, locale) do update
           set name = excluded.name,
               description = excluded.description,
               when_note = excluded.when_note', s)
        using eid, ev.es_name, ev.es_description, ev.es_when,
              ev.en_name, ev.en_description, ev.en_when,
              ev.pt_name, ev.pt_description, ev.pt_when;
    end loop;

    raise notice 'Eventos listos en %.', s;
  end loop;
end $$;

notify pgrst, 'reload schema';

commit;
