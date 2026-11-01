-- Portugués, paso 2 de 2 (2026-11-01): el contenido de la comuna de Petorca
-- en portugués (categorías, comunas, pueblos, lugares, rutas y
-- auspiciadores), traducido desde el español de la base. Correr DESPUÉS del
-- paso 1 (portugues-1-idioma.sql). Pegar tal cual en el SQL Editor de
-- city_tour: se aplica en `legacy` y `legacy_dev`. No toca `public` (Papudo).
--
-- Solo agrega lo que falta: si alguien ya cargó o corrigió una traducción
-- al portugués desde /admin, no se pisa. Repetible; si algo falla, no
-- cambia nada. Lo que no tenga traducción se ve en español en /pt.

begin;

do $$
declare
  s text;
  r record;
begin
  for s in
    select nspname from pg_namespace
    where nspname in ('legacy', 'legacy_dev')
    order by nspname
  loop
    if not exists (
      select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
       join pg_namespace n on n.oid = t.typnamespace
       where n.nspname = s and t.typname = 'locale' and e.enumlabel = 'pt'
    ) then
      raise exception 'En % falta el idioma pt: corre primero portugues-1-idioma.sql. No se cambió nada.', s;
    end if;

    for r in select * from (values
          ('naturaleza', 'Natureza e aventura'),
          ('gastronomia', 'Gastronomia'),
          ('cultura', 'Patrimônio e cultura'),
          ('playa', 'Praia'),
          ('alojamiento', 'Hospedagem'),
          ('recreacion', 'Lazer')
        ) as t(slug, name)
    loop
      execute format(
        'insert into %1$I.category_translations (category_id, locale, name)
         select id, ''pt''::%1$I.locale, $2 from %1$I.categories where slug = $1
         on conflict (category_id, locale) do nothing', s)
        using r.slug, r.name;
    end loop;

    for r in select * from (values
          ('la-ligua', 'La Ligua'),
          ('cabildo', 'Cabildo'),
          ('petorca', 'Petorca'),
          ('zapallar', 'Zapallar'),
          ('papudo', 'Papudo')
        ) as t(slug, name)
    loop
      execute format(
        'insert into %1$I.commune_translations (commune_id, locale, name)
         select id, ''pt''::%1$I.locale, $2 from %1$I.communes where slug = $1
         on conflict (commune_id, locale) do nothing', s)
        using r.slug, r.name;
    end loop;

    for r in select * from (values
          ('petorca', 'Petorca', 'Sede da comuna de Petorca (9.826 habitantes, Censo de 2017). Seu centro foi construído em meados do século XVIII onde antes havia uma horta paroquial; na praça ficam a Igreja La Merced (construída pelos jesuítas em 1640) e, ao lado, a casa onde nasceu o presidente Manuel Montt.'),
          ('chincolco', 'Chincolco', 'Povoado na parte alta do vale do rio Petorca, a uns 6,5 km a nordeste da cidade de Petorca. Foi uma comuna própria até 1928, quando foi anexada à comuna de Petorca.'),
          ('el-sobrante', 'El Sobrante', 'O rio Petorca nasce na cordilheira dos Andes com o nome de rio Sobrante; ao receber a confluência do riacho Pedernal, na altura de Chincolco, passa a se chamar rio Petorca.'),
          ('pedernal', 'Pedernal', null),
          ('frutillar-petorca', 'Frutillar', null),
          ('manuel-montt-petorca', 'Manuel Montt', null),
          ('pedegua', 'Pedegua', 'Antiga fazenda da comunidade religiosa agostiniana; quando se descobriu ouro em 1730 no setor de Hierro Viejo, trabalhadores e aventureiros mineiros ocuparam terras da fazenda. Em 1924 foi inaugurado um ramal ferroviário que a ligou à estação de Petorca.'),
          ('palquico', 'Palquico', null),
          ('las-palmas-petorca', 'Las Palmas', null),
          ('santa-julia', 'Santa Julia', null),
          ('la-polcura', 'La Polcura', null),
          ('la-chimba-petorca', 'La Chimba', null),
          ('la-nipa', 'La Ñipa', null),
          ('hierro-viejo', 'Hierro Viejo', 'Setor onde foi descoberta em 1730 uma rica jazida de ouro (''Los Tornos''), que atraiu os primeiros ocupantes de terras da fazenda Pedegua.'),
          ('chalaco', 'Chalaco', 'Lugarejo da parte alta da comuna, no vale do rio Pedernal, a uns 6,5 km a nordeste de Chincolco. Segundo o poema "La Muerte del Diablo", que Elías Lizana publicou em 1894 em La Voz de Petorca, foi aqui que o diabo perdeu o poncho; outras versões da lenda também passam por suas serras.')
        ) as t(slug, name, summary)
    loop
      execute format(
        'insert into %1$I.locality_translations (locality_id, locale, name, summary)
         select l.id, ''pt''::%1$I.locale, $2, $3
           from %1$I.localities l join %1$I.communes c on c.id = l.commune_id
          where l.slug = $1 and c.slug = ''petorca''
         on conflict (locality_id, locale) do nothing', s)
        using r.slug, r.name, r.summary;
    end loop;

    for r in select * from (values
          ('escalera-del-diablo', 'Escada do Diabo', 'Formação rochosa natural em forma de escada no setor de Hierro Viejo; segundo a lenda, o Diabo a usou para fugir de volta ao inferno.', 'Na comuna de Petorca (9.826 habitantes, Censo de 2017), no setor de Hierro Viejo, esta formação rochosa natural tem forma de escada. A lenda local — a mesma que dá nome a todo este site — conta que o Diabo a usou para fugir de volta ao inferno depois de passar pela região.'),
          ('turismo-rural-la-nina', 'Turismo Rural La Nina', 'Restaurante de beira de estrada na entrada de Pedegua, ponto de partida da rota «Donde el Diablo perdió el poncho»: empanadas de pino com mote con huesillo ou sucos naturais e, no verão, humitas e pastel de choclo. É tocado por César Arancibia e sua mãe, Cristina Delgado.', null),
          ('pedegua-puente', 'Ponte de Pedegua', 'Ponte ferroviária histórica junto a Pedegua, parte do antigo ramal Cabildo–Illapel; uma das duas pontes atravessadas na Rota dos Túneis.', 'Na comuna de Petorca (9.826 habitantes, Censo de 2017), esta ponte ferroviária fazia parte do ramal Pedegua–Petorca, inaugurado em 1927 como trecho interior da ferrovia Longitudinal Norte. Originalmente tinha 5 arcos; hoje os dois extremos foram substituídos por trechos modernos, e a ponte cruza o rio Petorca junto à foz do riacho Las Palmas.'),
          ('petorca-tunel-las-palmas', 'Túnel Las Palmas', 'Túnel ferroviário de 966 m inaugurado em 1914 (parte da rede Longitudinal Norte); declarado Monumento Histórico em 2011 junto com outros túneis e pontes do mesmo traçado.', 'Embora administrativamente o túnel fique do lado da Região de Coquimbo, ele faz parte do mesmo corredor ferroviário histórico que Pedegua e La Grupa, na comuna de Petorca (9.826 habitantes, Censo de 2017): 966 m inaugurados em 1914 como parte da rede Longitudinal Norte, cuja construção foi ordenada pelo presidente Balmaceda, declarado Monumento Histórico em 2011.'),
          ('petorca-plaza', 'Praça de Petorca', 'Praça central de Petorca, com um círculo onde fica o monumento a Manuel Montt; ali mesmo está a Igreja La Merced. Uma reforma recente a tornou conhecida como "a praça mais cara do Chile".', 'Na comuna de Petorca (9.826 habitantes, Censo de 2017), o centro do povoado foi construído em meados do século XVIII onde antes havia uma horta paroquial, seguindo o esquema clássico de praça com um chafariz no círculo central. Hoje é o coração administrativo, comercial e religioso da cidade, com o monumento a Manuel Montt e a Igreja La Merced ao lado.'),
          ('casa-natal-manuel-montt', 'Casa natal de Manuel Montt', 'Monumento histórico: a casa onde nasceu em 1809 o ex-presidente Manuel Montt, que governou o Chile entre 1851 e 1861 (Manuel Montt 845).', 'Ao lado da praça de Petorca (9.826 habitantes, Censo de 2017), esta casa é Monumento Histórico Nacional: aqui nasceu em 1809 Manuel Montt, que governou o Chile entre 1851 e 1861.'),
          ('pedegua', 'Pedegua', 'Localidade rural da comuna de Petorca, antiga parada do ramal ferroviário rumo a Illapel; conserva a fachada e os armazéns restaurados de sua estação de trem.', 'Localidade rural de Petorca (9.826 habitantes, Censo de 2017), antiga parada do ramal ferroviário rumo a Illapel; conserva a fachada e os armazéns restaurados de sua estação. O ator Etienne Bobenrieth percorreu suas histórias e lendas no programa Sabingo (Chilevisión), em um episódio dedicado a Pedegua, Chincolco e Hierro Viejo.'),
          ('hostal-el-rio-pedegua', 'Hostal El Río', 'Hostel em Pedegua, na rua Ferroviario: jardim, terraço, sala de estar, cozinha compartilhada e lareira; aceita animais de estimação.', null),
          ('tinajas-chincolco', 'Tinajas Chincolco', 'Refúgio natural em Chincolco com hospedagem e ofurôs termais com hidromassagem; também é possível ir só pelo ofurô (3 horas).', null),
          ('iglesia-de-chincolco', 'Igreja de Chincolco', 'Igreja do povoado de Chincolco, na avenida Pedro Montt.', null),
          ('plaza-de-armas-chincolco', 'Praça de Armas de Chincolco', 'Praça do povoado, na rua Pedro Montt: um lugar tranquilo para descansar, em frente à Casa Pueblo e à rádio de Chincolco.', null),
          ('medialuna-de-chincolco', 'Arena de rodeio de Chincolco', 'A medialuna do povoado, a arena onde se correm os rodeios.', null),
          ('plaza-hierro-viejo', 'Praça de Hierro Viejo', 'Praça do povoado de Hierro Viejo, que cresceu ao longo da estrada entre Cabildo e Petorca.', null),
          ('piscina-hierro-viejo', 'Piscina de Hierro Viejo', 'Piscina pública do povoado, à beira da estrada.', null),
          ('petroglifos-el-arenal', 'Campo de Petróglifos El Arenal', 'Arte rupestre em uma antiga planície aluvial: uns 80 blocos de rocha com gravuras de cerca do ano 800 d.C., a uns 27 km a nordeste de Petorca, a caminho de El Pedernal.', null),
          ('petorca-petroglifos-chincolco', 'Petróglifos de Chalaco', 'Gravuras rupestres no setor de Chalaco, onde, segundo a lenda, o diabo perdeu o poncho: 51 rochas e 70 painéis de 800 a 1.500 anos, associados às culturas El Molle, Las Ánimas, diaguita, mapuche e até inca; sem proteção oficial, alguns foram danificados por vandalismo em 2021.', 'Em Chalaco, setor rural da comuna de Petorca perto de Chincolco (9.826 habitantes na comuna, Censo de 2017), estas gravuras rupestres em pedra estão associadas às culturas El Molle, Las Ánimas, diaguita, mapuche e até inca, com motivos geométricos, humanos, animais e serpentes. Não têm proteção oficial — algumas foram danificadas por vandalismo em 2021. O mesmo episódio de Sabingo (Chilevisión) que percorreu Pedegua também passou por Chincolco.'),
          ('iglesia-la-merced-petorca', 'Igreja La Merced de Petorca', 'Construída pelos jesuítas em 1640 na Praça de Petorca; conserva linhas neogóticas com reminiscências neobarrocas.', 'Em frente à praça de Petorca (9.826 habitantes, Censo de 2017), esta igreja foi construída pelos jesuítas em 1640 e conserva linhas neogóticas com reminiscências neobarrocas — um dos templos mais antigos da província.'),
          ('panal-de-hierro-viejo', 'Panal de Hierro Viejo', 'Produtos agroartesanais de Hierro Viejo, como o mel, com registro vigente no Sernatur.', null),
          ('vina-el-sobrante', 'Viña El Sobrante', 'Vinícola da Fazenda El Sobrante, que guarda a herança das primeiras videiras do vale: chicha, chacolí e vinhos, com loja. Foi o ponto final da rota «Donde el Diablo perdió el poncho», com degustação.', null),
          ('el-rincon-criollo-chincolco', 'El Rincón Criollo', 'Restaurante de comida típica do campo chileno em Chincolco: churrascos, pastel de choclo, porotos granados, morcela assada e sobremesas como mote con huesillo e leche asada. Com registro vigente no Sernatur.', null)
        ) as t(slug, name, short_description, description)
    loop
      execute format(
        'insert into %1$I.place_translations (place_id, locale, name, short_description, description)
         select id, ''pt''::%1$I.locale, $2, $3, $4 from %1$I.places where slug = $1
         on conflict (place_id, locale) do nothing', s)
        using r.slug, r.name, r.short_description, r.description;
    end loop;

    for r in select * from (values
          ('ruta-del-diablo-pedegua-chincolco', 'Donde el Diablo perdió el poncho', 'Na trilha do diabo que, diz o ditado, morreu em Petorca: parte da antiga estação e da ponte de Pedegua e segue vale acima pela Escada do Diabo em Hierro Viejo e pela Igreja La Merced de Petorca até os petróglifos de Chincolco.'),
          ('ruta-ferroviaria-pedegua-las-palmas', 'Ruta Turística Ferroviaria Pedegua – Palquico – Las Palmas', 'Pelo antigo traçado da ferrovia: da estação de Pedegua, que conserva sua fachada e seus armazéns restaurados, pela ponte sobre o rio Petorca, até o Túnel Las Palmas: 966 m inaugurados em 1914 como parte da rede Longitudinal Norte, Monumento Histórico desde 2011.')
        ) as t(slug, name, description)
    loop
      execute format(
        'insert into %1$I.route_translations (route_id, locale, name, description)
         select id, ''pt''::%1$I.locale, $2, $3 from %1$I.routes where slug = $1
         on conflict (route_id, locale) do nothing', s)
        using r.slug, r.name, r.description;
    end loop;

    for r in select * from (values
          ('matichoc', 'Matichoc', 'Chocolate artesanal feito em La Ligua'),
          ('ember-accesorios', 'Ember Accesorios', null)
        ) as t(slug, name, tagline)
    loop
      execute format(
        'insert into %1$I.sponsor_translations (sponsor_id, locale, name, tagline)
         select id, ''pt''::%1$I.locale, $2, $3 from %1$I.sponsors where slug = $1
         on conflict (sponsor_id, locale) do nothing', s)
        using r.slug, r.name, r.tagline;
    end loop;

    raise notice 'Listo en %.', s;
  end loop;
end $$;

commit;
