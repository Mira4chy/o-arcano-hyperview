/* ════════════════════════════════════════════════════
   O Arcano — Codex App
   Hash router + animated views + global search + criação
   ════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ARCHIVE = window.ARCANO_ARCHIVE;
  if (!ARCHIVE) return;

  const TAB_ALIASES = { Grupos: 'Historias' };
  const canonicalTabId = (id) => TAB_ALIASES[id] || id;
  (ARCHIVE.entries || []).forEach((entry) => {
    entry.tab = canonicalTabId(entry.tab);
  });

  /* Categorias em que o usuário pode criar histórias */
  const CREATABLE_TABS = ['Paises', 'Cenarios', 'Biomas', 'Eras', 'Sistemas', 'Mapa', 'Deuses', 'Faccoes', 'Culturas', 'Campanhas', 'Historias', 'Itens', 'Racas', 'Bestiario', 'Magias'];
  const isCreatable = (id) => CREATABLE_TABS.includes(canonicalTabId(id));

  /* Categorias com layout alternativo (imagem ao lado do dossiê).
     O aspect-ratio do banner muda por categoria. */
  const PORTRAIT_TABS = new Set(['Itens', 'Racas', 'Bestiario']);
  const isPortrait = (id) => PORTRAIT_TABS.has(id);

  const BANNER_ASPECT = {
    Itens: '4 / 3',
    Racas: '2 / 3',
    Bestiario: '3 / 4'
  };
  function bannerAspectFor(tabId) {
    return BANNER_ASPECT[tabId] || '16 / 9';
  }
  function bannerLabelFor(tabId) {
    if (tabId === 'Itens') return { label: 'Banner (4:3)', hint: 'Proporção 4:3 (paisagem) — JPG, PNG ou WebP' };
    if (tabId === 'Racas') return { label: 'Banner (2:3)', hint: 'Proporção 2:3 (retrato) — JPG, PNG ou WebP' };
    if (tabId === 'Bestiario') return { label: 'Banner (3:4)', hint: 'Proporção 3:4 (retrato) — JPG, PNG ou WebP' };
    return { label: 'Banner (16:9)', hint: 'Proporção 16:9 — JPG, PNG ou WebP' };
  }
  function bannerStyleFor(tabId) {
    if (tabId === 'Itens') return 'aspect-ratio: 4 / 3; max-width: 480px;';
    if (tabId === 'Racas') return 'aspect-ratio: 2 / 3; max-width: 360px;';
    if (tabId === 'Bestiario') return 'aspect-ratio: 3 / 4; max-width: 380px;';
    return '';
  }

  /* Subtipos da categoria Itens com seus dossies. */
  const ITEM_SUBTYPES = {
    item: {
      label: 'Item',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>',
      fields: ['Raridade', 'Valor']
    },
    equipavel: {
      label: 'Equipável',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/></svg>',
      fields: ['Raridade', 'Valor', 'DF', 'DM', 'Efeito', 'Slot']
    },
    consumivel: {
      label: 'Consumível',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>',
      fields: ['Raridade', 'Valor', 'Efeito']
    }
  };
  const ITEM_EXTRA_FIELD_CUSTOM = '__custom__';
  const ITEM_EXTRA_FIELD_OPTIONS = [
    { key: 'Dano', placeholder: 'Ex.: 1d8 corte, 2d6 fogo' },
    { key: 'DF', placeholder: 'Nivel 0-6 contra dano fisico' },
    { key: 'DM', placeholder: 'Nivel 0-6 contra dano magico' },
    { key: 'Defesa', placeholder: 'Campo antigo; prefira DF/DM nos itens novos' },
    { key: 'Slot', placeholder: 'Ex.: Cabeça, mão, anel, peito' },
    { key: 'Alcance', placeholder: 'Ex.: 6q, toque, arremesso curto' },
    { key: 'Área', placeholder: 'Ex.: cone 3q, raio 2q' },
    { key: 'Duração', placeholder: 'Ex.: 3 turnos, cena, permanente' },
    { key: 'Cargas / usos', placeholder: 'Ex.: 3 cargas, 1/dia, consome ao usar' },
    { key: 'Recarga', placeholder: 'Ex.: descanso curto, amanhecer' },
    { key: 'Requisito', placeholder: 'Ex.: Força 14, vínculo arcano' },
    { key: 'Efeito passivo', placeholder: 'Bônus ou efeito sempre ativo' },
    { key: 'Condição de uso', placeholder: 'Ex.: apenas à noite, em combate' },
    { key: 'Penalidade', placeholder: 'Custo, risco ou maldição' },
    { key: 'Material obtido de', placeholder: 'Ex.: besta, mineral, região' },
    { key: 'Compatível com', placeholder: 'Ex.: lâminas, alquimia, rituais' },
    { key: 'Peso', placeholder: 'Ex.: 2 kg, leve, pesado' },
    { key: 'Origem', placeholder: 'Ex.: ruínas de Veyra, forja real' },
    { key: 'Observação do mestre', placeholder: 'Nota interna ou condição especial' }
  ];
  const ITEM_SUBTYPE_HINTS = {
    item: 'Objeto comum ou relíquia sem regra de equipar. Bom para chaves, livros, materiais e tesouros.',
    equipavel: 'Armas, armaduras e acessórios que podem ir para o inventário equipado da ficha.',
    consumivel: 'Poções, pergaminhos, bombas e itens que somem ou gastam cargas quando usados.'
  };
  const ITEM_FIELD_HINTS = {
    Raridade: 'Ajuda o Mestre e os jogadores a entenderem disponibilidade, preço e peso narrativo.',
    Valor: 'Use uma moeda, faixa de preço ou marque como inestimável quando for único.',
    DF: 'Nivel de Defesa Fisica que o item soma na ficha quando equipado (0 a 6).',
    DM: 'Nivel de Defesa Magica que o item soma na ficha quando equipado (0 a 6).',
    Defesa: 'Campo antigo mantido por compatibilidade; nos itens novos, prefira DF e DM separados.',
    Efeito: 'Descreva o efeito de mesa em uma frase objetiva.',
    Slot: 'Indica onde o item ocupa espaço: mão, peito, cabeça, anel e similares.',
    Dano: 'Use dados, tipo de dano e qualquer modificador relevante.',
    Alcance: 'Pode ser em quadrados, metros ou descrição curta como toque.',
    Area: 'Use cone, linha, raio ou alvo único quando fizer sentido.',
    Duracao: 'Tempo de efeito: turno, cena, descanso ou permanente.',
    'Cargas / usos': 'Quantidade de usos antes de recarregar, quebrar ou ser consumido.',
    Recarga: 'Quando o item recupera uso: descanso, amanhecer, ritual ou custo.',
    Requisito: 'Atributo, raça, perícia, vínculo ou condição para usar.',
    'Efeito passivo': 'Bônus constante enquanto portar ou equipar o item.',
    'Condicao de uso': 'Restrição situacional, gatilho ou momento certo de ativação.',
    Penalidade: 'Custo, risco, corrupção, maldição ou efeito colateral.',
    'Material obtido de': 'Origem de crafting ou criatura que fornece o componente.',
    'Compativel com': 'Outros itens, rituais ou sistemas que combinam com este item.',
    Peso: 'Peso exato ou categoria prática: leve, pesado, volumoso.',
    Origem: 'Lugar, povo, forja, facção ou evento ligado ao item.',
    'Observacao do mestre': 'Anotação privada de regra, segredo ou condição especial.'
  };
  const ITEM_SUBTYPE_GUIDES = {
    item: {
      title: 'Item de mundo',
      text: 'Use para objetos de lore, materiais, chaves, tesouros e relíquias sem regra de equipamento.',
      checks: ['Nome reconhecível', 'Valor ou raridade', 'Origem no texto'],
      suggestions: ['Origem', 'Peso', 'Material obtido de', 'Compatível com', 'Observação do mestre']
    },
    equipavel: {
      title: 'Equipável de ficha',
      text: 'Use para armas, armaduras e acessórios. DF e DM preenchidos aqui entram no inventário da Persona.',
      checks: ['Slot claro', 'DF/DM quando houver', 'Efeito em uma frase'],
      suggestions: ['Dano', 'Cargas / usos', 'Requisito', 'Efeito passivo', 'Penalidade']
    },
    consumivel: {
      title: 'Consumível de uso',
      text: 'Use para poções, bombas, pergaminhos e cargas gastáveis. Priorize gatilho, efeito e limite de uso.',
      checks: ['Quando usar', 'O que acontece', 'Se some ou recarrega'],
      suggestions: ['Cargas / usos', 'Duração', 'Condição de uso', 'Alcance', 'Penalidade']
    }
  };
  const ITEM_BASE_FIELD_KEYS = new Set(Object.values(ITEM_SUBTYPES).flatMap((cfg) => cfg.fields));
  ['Defesa', 'Defesa Fisica', 'Defesa Física', 'Defesa Magica', 'Defesa Mágica'].forEach((key) => ITEM_BASE_FIELD_KEYS.add(key));
  const ITEM_SUBTYPE_KEYS = Object.keys(ITEM_SUBTYPES);
  function subtypeFieldsFor(subtype) {
    return (ITEM_SUBTYPES[subtype] || ITEM_SUBTYPES.item).fields;
  }
  function subtypeLabel(subtype) {
    return (ITEM_SUBTYPES[subtype] || ITEM_SUBTYPES.item).label;
  }

  /* ── MAGIAS: tipos, afinidades e opções ───────── */
  const SPELL_TYPES = {
    ativa:   { label: 'Magia Ativa',   badge: 'ATIVA',   icon: '✦' },
    passiva: { label: 'Magia Passiva', badge: 'PASSIVA', icon: '◇' }
  };
  const SPELL_TYPE_KEYS = Object.keys(SPELL_TYPES);
  const isSpellType = (t) => SPELL_TYPE_KEYS.includes(t);

  const DURATION_OPTIONS = ['1 turno', '2 turnos', '3 turnos', '4 turnos', '5 turnos', '6 turnos', '7 turnos', '8 turnos', '9 turnos', '10 turnos', 'instantâneo', 'concentração'];
  const ACTIVATION_OPTIONS = ['Sempre ativa', 'Ao receber dano', 'Ao iniciar combate', 'Quando HP < X%', 'Manual (custo MP)'];
  const SPELL_CLASSIFICATIONS = ['Ancestral', 'T\u00e9cnica', 'Codificada', 'Fragmentada'];
  const SPELL_CONTROL_LEVELS = ['Selvagem', 'Inst\u00e1vel', 'Moldada', 'Refinada', 'Codificada', 'Degradada'];
  const SPELL_USE_FORMS = ['Instinto', 'Tradi\u00e7\u00e3o', 'T\u00e9cnica', 'Tecnologia', 'Anomalia'];

  /* Afinidades: cada uma carrega seu tema visual arcano. */
  const SPELL_AFFINITIES = {
    Elemental: { label: 'Elemental', hue: 22,  accent: '#fb923c', glow: '#f97316', icon: '🜂', rune: 'M12 2c2 4 5 6 8 7-3 1-6 4-8 7-2-3-5-6-8-7 3-1 6-3 8-7z' },
    Arcanista: { label: 'Arcanista', hue: 275, accent: '#c084fc', glow: '#a855f7', icon: '✶', rune: 'M12 2v20M2 12h20M5 5l14 14M19 5L5 19' },
    'Druídico': { label: 'Druídico', hue: 140, accent: '#4ade80', glow: '#22c55e', icon: '🌿', rune: 'M12 22c0-6 0-10 3-13M12 22c0-6 0-10-3-13M12 9c0-4 2-6 5-7M12 9c0-4-2-6-5-7' },
    Celestial: { label: 'Celestial', hue: 46,  accent: '#fcd34d', glow: '#fbbf24', icon: '✧', rune: 'M12 2l2.4 6.5L21 11l-6.6 2.5L12 20l-2.4-6.5L3 11l6.6-2.5L12 2z' }
  };
  const SPELL_AFFINITY_KEYS = Object.keys(SPELL_AFFINITIES);
  const affinityMeta = (name) => SPELL_AFFINITIES[name] || { label: name || '—', hue: 268, accent: 'var(--primary-2)', glow: 'var(--primary)', icon: '✦', rune: '' };

  const SPELL_SCOPES = {
    Dano:      '#f43f5e',
    Cura:      '#10b981',
    Buff:      '#3b82f6',
    Debuff:    '#f59e0b',
    Controle:  '#a855f7',
    Utilidade: '#9ca3af'
  };
  const SPELL_SCOPE_KEYS = Object.keys(SPELL_SCOPES);
  const scopeColor = (s) => SPELL_SCOPES[s] || '#9ca3af';
  const scopeIcon = (s) => ({ Dano: '⚔', Cura: '✚', Buff: '▲', Debuff: '▼', Controle: '✦', Utilidade: '◈' }[s] || '◆');
  const SCOPE_PLACEHOLDERS = {
    Dano:      'Ex.: 2d6 de dano de fogo na área',
    Cura:      'Ex.: cura 1d8 + modificador de Sabedoria',
    Buff:      'Ex.: +2 em Destreza por 3 turnos',
    Debuff:    'Ex.: -2 na Defesa do alvo até o fim do combate',
    Controle:  'Ex.: empurra 2 quadrados / atordoa por 1 turno',
    Utilidade: 'Ex.: ilumina 5q de raio / revela o invisível'
  };

  /* Unidades de custo — a magia não cobra necessariamente MP. */
  const COST_UNITS = ['MP', 'HP'];

  /* ── USO EM COMBATE ─────────────────────────────
     Um formato só para magias, itens e habilidades de bestas. O grid de combate
     lê estes campos; o texto livre continua sendo a regra escrita para a mesa.
     Guardado em fields.Combate (magias e itens) e em ability.combat (bestas). */
  /* COMBATE:PARSER:START */
  const COMBAT_ATTRS = ['Força', 'Destreza', 'Resistência', 'Inteligência', 'Sabedoria', 'Carisma'];
  const COMBAT_USES = { ataque: 'Ataque contra a DA', efeito: 'Efeito sem rolagem', nenhum: 'Não usa no grid' };
  const COMBAT_ACTIONS = { acao: 'Gasta a ação', livre: 'Livre', movimento: 'Gasta o movimento' };
  const COMBAT_TARGETS = { inimigos: 'Inimigos', aliados: 'Aliados', todos: 'Qualquer criatura', proprio: 'Só o próprio' };
  const COMBAT_SHAPES = {
    alvo: 'Alvo único', quadrado: 'Quadrado', raio: 'Raio', cone: 'Cone', linha: 'Linha', cena: 'Toda a cena'
  };
  const COMBAT_DAMAGE_TYPES = { fisico: 'Físico', magico: 'Mágico', cura: 'Cura' };
  const COMBAT_MOD_STATS = [
    'Força', 'Destreza', 'Resistência', 'Inteligência', 'Sabedoria', 'Carisma',
    'Movimento', 'DA', 'Iniciativa', 'Resultado Final', 'Ataques extras', 'Ações extras'
  ];
  const COMBAT_EFFECTS = [
    'Atordoamento', 'Cegueira', 'Condutividade', 'Corte de Cura', 'Dano por Tempo', 'Iluminação',
    'Escurecimento', 'Marcar Alvo', 'Desorientação', 'Pânico', 'Consumo de Mana', 'Propagação',
    'Imobilização', 'Silêncio', 'Veneno', 'Queimadura', 'Combustão Direta', 'Dano de Fogo Arcano'
  ];
  const COMBAT_LEVELS = ['', 'I', 'II', 'III', 'IV', 'V'];
  const COMBAT_COST_UNITS = ['MP', 'HP', 'Carga'];
  /* Atributo do ataque mágico, pela Forma de Uso (regra Combate em Grid). */
  const COMBAT_USEFORM_ATTR = {
    'Técnica': 'Inteligência', 'Tecnologia': 'Inteligência',
    'Instinto': 'Sabedoria', 'Tradição': 'Sabedoria', 'Anomalia': 'Carisma'
  };

  const cbNorm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const cbInt = (v, min = 0, max = 999) => {
    const n = parseInt(v, 10);
    return Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
  };
  const cbPick = (v, dict, fallback) => (Object.prototype.hasOwnProperty.call(dict, v) ? v : fallback);
  const cbDice = (v) => {
    const m = String(v || '').replace(/\s+/g, '').match(/^(\d{1,2})d(\d{1,3})$/i);
    return m ? `${parseInt(m[1], 10)}d${parseInt(m[2], 10)}` : '';
  };

  function emptyCombat(kind = 'magia') {
    return {
      v: 1, uso: 'ataque', acao: 'acao', alvos: 'inimigos', atributo: '',
      alcance: 1, forma: 'alvo', tamanho: 1, largura: 1,
      dano: [], mods: [], efeitos: [],
      custo: kind === 'magia' ? null : { valor: 0, unidade: 'MP' },
      nota: ''
    };
  }

  /* Garante o formato; aceita null e devolve null quando não há nada. */
  function normalizeCombat(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const forma = cbPick(raw.forma, COMBAT_SHAPES, 'alvo');
    const out = {
      v: 1,
      uso: cbPick(raw.uso, COMBAT_USES, 'ataque'),
      acao: cbPick(raw.acao, COMBAT_ACTIONS, 'acao'),
      alvos: cbPick(raw.alvos, COMBAT_TARGETS, 'inimigos'),
      atributo: COMBAT_ATTRS.includes(raw.atributo) ? raw.atributo : '',
      alcance: cbInt(raw.alcance, 0, 200),
      forma,
      tamanho: forma === 'alvo' || forma === 'cena' ? 1 : Math.max(1, cbInt(raw.tamanho, 1, 200)),
      largura: forma === 'quadrado' || forma === 'linha' ? Math.max(1, cbInt(raw.largura, 1, 200)) : 1,
      dano: (Array.isArray(raw.dano) ? raw.dano : []).map((d) => {
        const dados = cbDice(d && d.dados);
        if (!dados) return null;
        return {
          dados,
          bonus: cbInt(d.bonus, -99, 99),
          tipo: cbPick(d.tipo, COMBAT_DAMAGE_TYPES, 'fisico'),
          elemento: String(d.elemento || '').trim().slice(0, 40)
        };
      }).filter(Boolean).slice(0, 6),
      mods: (Array.isArray(raw.mods) ? raw.mods : []).map((m) => {
        if (!m || !COMBAT_MOD_STATS.includes(m.stat)) return null;
        const valor = cbInt(m.valor, -99, 99);
        if (!valor) return null;
        return { stat: m.stat, valor, turnos: cbInt(m.turnos, 0, 99) };
      }).filter(Boolean).slice(0, 8),
      efeitos: (Array.isArray(raw.efeitos) ? raw.efeitos : []).map((e) => {
        if (!e || !COMBAT_EFFECTS.includes(e.nome)) return null;
        return { nome: e.nome, nivel: COMBAT_LEVELS.includes(e.nivel) ? e.nivel : '', turnos: cbInt(e.turnos, 0, 99) };
      }).filter(Boolean).slice(0, 8),
      custo: null,
      nota: String(raw.nota || '').trim().slice(0, 400)
    };
    if (raw.custo && typeof raw.custo === 'object') {
      const valor = cbInt(raw.custo.valor, 0, 9999);
      if (valor) out.custo = { valor, unidade: COMBAT_COST_UNITS.includes(raw.custo.unidade) ? raw.custo.unidade : 'MP' };
    }
    return out;
  }

  /* Lê um alcance escrito ("4q", "Corpo a corpo", "Cone de 5q", "Linha de 10q por 3q"). */
  function combatParseRange(text) {
    const t = cbNorm(text).trim();
    const out = { alcance: 1, forma: 'alvo', tamanho: 1, largura: 1, alvos: '', ok: true };
    if (!t) { out.ok = false; return out; }
    let m;
    if (/corpo a corpo|toque|adjacente/.test(t)) return out;
    if (/^proprio|^pessoal|^si mesmo/.test(t)) { out.alcance = 0; out.alvos = 'proprio'; return out; }
    if (/toda a cena|cena inteira/.test(t)) { out.alcance = 0; out.forma = 'cena'; return out; }
    if ((m = t.match(/raio de (\d+)/))) {
      out.forma = 'raio'; out.tamanho = parseInt(m[1], 10);
      const at = t.match(/a (?:ate )?(\d+)\s*q/);
      out.alcance = at ? parseInt(at[1], 10) : 0;
      return out;
    }
    if ((m = t.match(/cone de (\d+)/))) { out.alcance = 0; out.forma = 'cone'; out.tamanho = parseInt(m[1], 10); return out; }
    if ((m = t.match(/linha de (\d+)\s*q?(?:\s*(?:por|x|×)\s*(\d+))?/))) {
      out.alcance = 0; out.forma = 'linha'; out.tamanho = parseInt(m[1], 10); out.largura = m[2] ? parseInt(m[2], 10) : 1;
      return out;
    }
    if ((m = t.match(/^(\d+)\s*(?:q|m|quadrados?|metros?)?$/))) { out.alcance = parseInt(m[1], 10); return out; }
    if ((m = t.match(/(\d+)\s*(?:q|m)\b/))) { out.alcance = parseInt(m[1], 10); out.ok = false; return out; }
    out.ok = false;
    return out;
  }

  const CB_ELEMENTS = ['fogo', 'gelo', 'eletrico', 'raio', 'veneno', 'acido', 'sombra', 'luz', 'sangue', 'arcano',
    'corte', 'perfuracao', 'impacto', 'esmagamento', 'necrotico', 'sonico', 'psiquico'];
  const CB_ELEMENT_LABEL = { eletrico: 'elétrico', perfuracao: 'perfuração', acido: 'ácido', necrotico: 'necrótico', sonico: 'sônico', psiquico: 'psíquico' };

  /* Lê o primeiro dano escrito ("3d6 físico de corte", "4d6 de dano de fogo").
     Danos seguintes ou condicionais viram dúvida para revisão. */
  function combatParseDamage(text, defaultType = 'fisico') {
    const raw = String(text || '');
    const t = cbNorm(raw);
    const re = /(\d{1,2})d(\d{1,3})(\s*\+\s*(\d{1,2})(?!\s*d))?/g;
    const found = [];
    let m;
    while ((m = re.exec(t))) found.push({ m, index: m.index });
    if (!found.length) return { dano: [], doubts: [] };
    const first = found[0];
    const tail = t.slice(first.index, first.index + 60);
    let tipo = defaultType;
    if (/\bfisic/.test(tail)) tipo = 'fisico';
    else if (/\bmagic/.test(tail)) tipo = 'magico';
    else if (/\bcura|recupera|restaura/.test(tail)) tipo = 'cura';
    const el = CB_ELEMENTS.filter((k) => new RegExp(`\\b${k}`).test(tail));
    const elemento = el.length ? el.map((k) => CB_ELEMENT_LABEL[k] || k).join(' ') : '';
    const dano = [{
      dados: `${parseInt(first.m[1], 10)}d${parseInt(first.m[2], 10)}`,
      bonus: first.m[4] ? parseInt(first.m[4], 10) : 0,
      tipo,
      elemento
    }];
    const doubts = [];
    if (found.length > 1) doubts.push('Tem mais de um dano no texto; só o primeiro entrou. Os outros parecem condicionais.');
    if (/\+\s*dados? de/.test(t)) doubts.push('O dano soma dados de atributo; confira na revisão.');
    return { dano, doubts };
  }

  function combatParseEffects(text) {
    const t = cbNorm(text);
    const out = [];
    COMBAT_EFFECTS.forEach((nome) => {
      const n = cbNorm(nome);
      const idx = t.indexOf(n);
      if (idx < 0) return;
      const after = t.slice(idx + n.length, idx + n.length + 40);
      const lv = after.match(/^\s+(i{1,3}|iv|v)\b/);
      const turns = after.match(/por (\d+)(?:\s*-\s*\d+)? turnos?/);
      out.push({ nome, nivel: lv ? lv[1].toUpperCase() : '', turnos: turns ? parseInt(turns[1], 10) : 0 });
    });
    return out;
  }

  function combatParseAttr(text) {
    const t = cbNorm(text);
    const m = t.match(/(?:ataque|teste) de (forca|destreza|resistencia|inteligencia|sabedoria|carisma)/);
    if (!m) return '';
    return COMBAT_ATTRS.find((a) => cbNorm(a) === m[1]) || '';
  }

  /* Converte uma magia já cadastrada (campos do formulário de magia). */
  function combatFromSpell(fields, subtype) {
    const f = fields || {};
    const doubts = [];
    const cb = emptyCombat('magia');
    const scopes = Array.isArray(f.Escopos) ? f.Escopos : [];
    const scopeText = scopes.map((s) => `${s.tipo}: ${s.detalhe}`).join(' \n');
    const allText = [scopeText, f['Descrição'], f['Efeito Contínuo'], f['Efeito Adicional']].filter(Boolean).join(' \n');
    const dmgScope = scopes.find((s) => s.tipo === 'Dano');
    const cureScope = scopes.find((s) => s.tipo === 'Cura');
    if (subtype === 'passiva') { cb.uso = 'efeito'; cb.alvos = 'proprio'; cb.alcance = 0; }
    else if (dmgScope) cb.uso = 'ataque';
    else cb.uso = 'efeito';
    cb.atributo = COMBAT_USEFORM_ATTR[f['Forma de Uso']] || '';
    if (cb.uso === 'ataque' && !cb.atributo) doubts.push('Sem Forma de Uso: escolha o atributo do ataque.');
    if (subtype !== 'passiva') {
      cb.alcance = cbInt(f.Alcance, 0, 200);
      const L = cbInt(f.AreaLargura, 0, 200), A = cbInt(f.AreaAltura, 0, 200);
      const dmgText = cbNorm(dmgScope ? dmgScope.detalhe : '');
      if (/\bcone\b/.test(dmgText)) {
        cb.forma = 'cone'; cb.tamanho = Math.max(L, A, 1); cb.alcance = 0;
        if (L !== A) doubts.push(`Cone com área ${L}×${A}; usei ${cb.tamanho}q de comprimento.`);
      } else if (L > 1 || A > 1) {
        cb.forma = 'quadrado'; cb.tamanho = Math.max(1, L); cb.largura = Math.max(1, A);
      } else if (L === 0 && A === 0) {
        cb.forma = 'alvo';
        if (cb.uso === 'efeito') { cb.alvos = 'proprio'; cb.alcance = 0; }
      }
    }
    if (cb.uso === 'efeito') {
      const buff = scopes.some((s) => s.tipo === 'Buff' || s.tipo === 'Cura');
      if (buff && cb.alvos === 'inimigos') cb.alvos = cb.alcance === 0 ? 'proprio' : 'aliados';
    }
    if (dmgScope) {
      const d = combatParseDamage(dmgScope.detalhe, 'magico');
      cb.dano = d.dano; doubts.push(...d.doubts);
      if (!d.dano.length) doubts.push('O escopo Dano não tem dados escritos (ex.: 4d6).');
    }
    if (cureScope) {
      const c = combatParseDamage(cureScope.detalhe, 'cura');
      c.dano.forEach((x) => { x.tipo = 'cura'; cb.dano.push(x); });
    }
    cb.efeitos = combatParseEffects(allText);
    const extra = cbNorm(scopeText).match(/ate (duas|tres|quatro|cinco|\d+) conjurac/);
    if (extra) {
      const n = { duas: 2, tres: 3, quatro: 4, cinco: 5 }[extra[1]] || parseInt(extra[1], 10) || 1;
      if (n > 1) {
        cb.mods.push({ stat: 'Ações extras', valor: n - 1, turnos: 0 });
        doubts.push(`Virou +${n - 1} ação extra (só para conjurar). Confira se vale para outras ações.`);
      }
    }
    if (/\bnao pode (usar|conjurar)|menos de \d+ (hp|mp)/.test(cbNorm(allText))) {
      cb.nota = 'Tem condição de uso: o site só mostra o aviso.';
    }
    return combatFinish(cb, doubts);
  }

  /* Converte um item (campos de dossiê + Campos adicionais). */
  function combatFromItem(fields, subtype) {
    const f = fields || {};
    const extras = Array.isArray(f.Campos) ? f.Campos : [];
    const get = (key) => {
      const hit = extras.find((x) => cbNorm(x.key) === cbNorm(key));
      return hit ? String(hit.value || '') : String(f[key] || '');
    };
    const doubts = [];
    const dmgText = get('Dano');
    const rangeText = get('Alcance');
    const areaText = get('Área') || get('Area');
    const effectText = [f.Efeito, get('Efeito passivo')].filter(Boolean).join(' \n');
    const slot = cbNorm(f.Slot);
    const isWeapon = !!dmgText || /mao/.test(slot);
    if (!isWeapon && subtype === 'equipavel') {
      return { combat: null, doubts: [] };
    }
    const cb = emptyCombat('item');
    cb.custo = null;
    const r = combatParseRange(rangeText || (isWeapon ? 'Corpo a corpo' : ''));
    Object.assign(cb, { alcance: r.alcance, forma: r.forma, tamanho: r.tamanho, largura: r.largura });
    if (r.alvos) cb.alvos = r.alvos;
    if (rangeText && !r.ok) doubts.push(`Alcance "${rangeText}" não ficou claro.`);
    if (areaText) {
      const a = combatParseRange(areaText);
      if (a.forma !== 'alvo') { cb.forma = a.forma; cb.tamanho = a.tamanho; cb.largura = a.largura; }
      else doubts.push(`Área "${areaText}" não ficou clara.`);
    }
    const d = combatParseDamage(dmgText, 'fisico');
    cb.dano = d.dano; doubts.push(...d.doubts);
    if (subtype === 'consumivel') {
      cb.uso = cb.dano.some((x) => x.tipo !== 'cura') ? 'ataque' : 'efeito';
      if (cb.uso === 'efeito') {
        const heal = combatParseDamage(effectText, 'cura');
        if (/cura|recupera|restaura/.test(cbNorm(effectText)) && heal.dano.length) {
          cb.dano = heal.dano.map((x) => ({ ...x, tipo: 'cura' }));
        }
        if (!rangeText) { cb.alcance = 0; cb.alvos = 'proprio'; }
      }
    } else {
      cb.uso = 'ataque';
      const ranged = cb.alcance > 1;
      cb.atributo = combatParseAttr(effectText) || (ranged ? 'Destreza' : 'Força');
      doubts.push(`Atributo sugerido: ${cb.atributo} (${ranged ? 'arma de distância' : 'corpo a corpo'}). Confirme.`);
      if (!cb.dano.length) doubts.push('Sem dano escrito.');
    }
    cb.efeitos = combatParseEffects(effectText);
    return combatFinish(cb, doubts);
  }

  /* Converte uma habilidade de besta (campos da linha de habilidade). */
  function combatFromBeastAbility(ability) {
    const a = ability || {};
    const doubts = [];
    if (a.kind === 'Passiva' || a.kind === 'Limitação') {
      return { combat: null, doubts: [] };
    }
    const cb = emptyCombat('habilidade');
    const r = combatParseRange(a.range);
    Object.assign(cb, { alcance: r.alcance, forma: r.forma, tamanho: r.tamanho, largura: r.largura });
    if (r.alvos) cb.alvos = r.alvos;
    if (!r.ok) doubts.push(`Alcance "${a.range || '—'}" não ficou claro.`);
    const text = [a.effect, a.limit].filter(Boolean).join(' \n');
    const d = combatParseDamage(a.effect, /magic/.test(cbNorm(a.effect)) ? 'magico' : 'fisico');
    cb.dano = d.dano; doubts.push(...d.doubts);
    const attr = combatParseAttr(a.effect);
    cb.uso = (cb.dano.some((x) => x.tipo !== 'cura') || attr || /contra a da/.test(cbNorm(a.effect))) ? 'ataque' : 'efeito';
    cb.atributo = attr;
    if (cb.uso === 'ataque' && !attr) doubts.push('O texto não diz o atributo do ataque.');
    if (cb.uso === 'efeito' && cb.alvos === 'inimigos' && cb.alcance === 0) cb.alvos = 'proprio';
    if (a.kind === 'Reação') { cb.acao = 'livre'; doubts.push('Reação: o grid ainda não tem reações; o Mestre aplica à mão.'); }
    const cost = cbNorm(a.cost).match(/(\d+)\s*(mp|hp)/);
    cb.custo = cost ? { valor: parseInt(cost[1], 10), unidade: cost[2].toUpperCase() } : { valor: 0, unidade: 'MP' };
    cb.efeitos = combatParseEffects(text);
    return combatFinish(cb, doubts);
  }
  /* Ajustes finais comuns a toda conversão. */
  function combatFinish(cb, doubts) {
    const c = normalizeCombat(cb);
    if (!c) return { combat: null, doubts };
    if (c.uso !== 'ataque') c.atributo = '';
    if (c.uso === 'efeito' && !c.dano.length && !c.mods.length && !c.efeitos.length && !c.nota) {
      doubts.push('O grid não sabe o que este efeito faz; descreva em "O que o grid não faz sozinho".');
    }
    return { combat: c, doubts };
  }
  /* COMBATE:PARSER:END */

  /* Uma linha curta: "Ataque · Força · 1q · Cone 5q · 3d6 físico corte". */
  function combatSummaryParts(cb, opts = {}) {
    const c = normalizeCombat(cb);
    if (!c || c.uso === 'nenhum') return [];
    const parts = [];
    parts.push(c.uso === 'ataque' ? 'Ataque' : 'Efeito');
    const attr = c.atributo || (c.uso === 'ataque' && opts.useForm ? COMBAT_USEFORM_ATTR[opts.useForm] : '');
    if (c.uso === 'ataque' && attr) parts.push(attr);
    if (c.alcance === 0) parts.push(c.forma === 'alvo' ? 'Próprio' : 'A partir de si');
    else parts.push(c.alcance === 1 ? 'Corpo a corpo' : `Alcance ${c.alcance}q`);
    if (c.forma === 'quadrado') parts.push(`Área ${c.tamanho}×${c.largura}q`);
    else if (c.forma === 'linha') parts.push(`Linha ${c.tamanho}×${c.largura}q`);
    else if (c.forma === 'raio' || c.forma === 'cone') parts.push(`${COMBAT_SHAPES[c.forma]} ${c.tamanho}q`);
    else if (c.forma === 'cena') parts.push('Toda a cena');
    c.dano.forEach((d) => parts.push(`${d.dados}${d.bonus ? (d.bonus > 0 ? `+${d.bonus}` : d.bonus) : ''} ${COMBAT_DAMAGE_TYPES[d.tipo].toLowerCase()}${d.elemento ? ` ${d.elemento}` : ''}`));
    c.mods.forEach((m) => parts.push(`${m.valor > 0 ? '+' : ''}${m.valor} ${m.stat}${m.turnos ? ` (${m.turnos}t)` : ''}`));
    c.efeitos.forEach((e) => parts.push(`${e.nome}${e.nivel ? ` ${e.nivel}` : ''}${e.turnos ? ` (${e.turnos}t)` : ''}`));
    if (c.acao !== 'acao') parts.push(COMBAT_ACTIONS[c.acao]);
    return parts;
  }

  function combatBadgeHTML(cb, opts = {}) {
    const parts = combatSummaryParts(cb, opts);
    if (!parts.length) return '';
    return `<div class="combat-badge" title="Como o grid de combate usa isto"><span class="combat-badge__ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/></svg></span>${parts.map((p) => `<span>${cbEsc(p)}</span>`).join('')}</div>`;
  }
  const cbEsc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const cbOptions = (dict, selected) => Object.entries(dict)
    .map(([k, label]) => `<option value="${cbEsc(k)}" ${k === selected ? 'selected' : ''}>${cbEsc(label)}</option>`).join('');
  const cbListOptions = (list, selected, blank) => (blank != null ? `<option value="">${cbEsc(blank)}</option>` : '') +
    list.map((v) => `<option value="${cbEsc(v)}" ${v === selected ? 'selected' : ''}>${cbEsc(v)}</option>`).join('');

  function combatDamageRowHTML(d = {}) {
    return `<div class="combat-row" data-cb-row="dano">
      <input type="text" class="create-form__input" data-cb-dados value="${cbEsc(d.dados || '')}" placeholder="3d6" maxlength="8" aria-label="Dados de dano" inputmode="text">
      <input type="number" class="create-form__input combat-row__num" data-cb-bonus value="${d.bonus ? cbEsc(d.bonus) : ''}" placeholder="+0" min="-99" max="99" aria-label="Bônus fixo">
      <select class="create-form__input char-select" data-cb-tipo aria-label="Tipo de dano">${cbOptions(COMBAT_DAMAGE_TYPES, d.tipo || 'fisico')}</select>
      <input type="text" class="create-form__input" data-cb-elemento value="${cbEsc(d.elemento || '')}" placeholder="corte, fogo…" maxlength="40" aria-label="Natureza do dano">
      <button type="button" class="combat-row__x" data-cb-remove aria-label="Remover dano">×</button>
    </div>`;
  }
  function combatModRowHTML(m = {}) {
    return `<div class="combat-row" data-cb-row="mods">
      <select class="create-form__input char-select" data-cb-stat aria-label="O que muda">${cbListOptions(COMBAT_MOD_STATS, m.stat || 'Destreza')}</select>
      <input type="number" class="create-form__input combat-row__num" data-cb-valor value="${m.valor != null ? cbEsc(m.valor) : ''}" placeholder="+1" min="-99" max="99" aria-label="Quanto muda">
      <input type="number" class="create-form__input combat-row__num" data-cb-turnos value="${m.turnos ? cbEsc(m.turnos) : ''}" placeholder="turnos" min="0" max="99" aria-label="Por quantos turnos (vazio = enquanto durar)">
      <button type="button" class="combat-row__x" data-cb-remove aria-label="Remover modificador">×</button>
    </div>`;
  }
  function combatEffectRowHTML(e = {}) {
    return `<div class="combat-row" data-cb-row="efeitos">
      <select class="create-form__input char-select" data-cb-efeito aria-label="Efeito">${cbListOptions(COMBAT_EFFECTS, e.nome || COMBAT_EFFECTS[0])}</select>
      <select class="create-form__input char-select combat-row__num" data-cb-nivel aria-label="Nível">${COMBAT_LEVELS.map((l) => `<option value="${l}" ${l === (e.nivel || '') ? 'selected' : ''}>${l ? `Nível ${l}` : 'Sem nível'}</option>`).join('')}</select>
      <input type="number" class="create-form__input combat-row__num" data-cb-turnos value="${e.turnos ? cbEsc(e.turnos) : ''}" placeholder="turnos" min="0" max="99" aria-label="Por quantos turnos">
      <button type="button" class="combat-row__x" data-cb-remove aria-label="Remover efeito">×</button>
    </div>`;
  }

  /* Bloco do formulário. kind: 'magia' | 'item' | 'habilidade'. */
  function combatFormHTML(cbRaw, kind = 'magia', opts = {}) {
    const c = normalizeCombat(cbRaw) || emptyCombat(kind);
    const showSize = c.forma !== 'alvo' && c.forma !== 'cena';
    const showWidth = c.forma === 'quadrado' || c.forma === 'linha';
    const attrBlank = kind === 'magia' ? 'Pela Forma de Uso' : 'Escolha…';
    const off = c.uso === 'nenhum';
    return `
      <section class="combat-form ${opts.compact ? 'combat-form--compact' : ''}" data-combat-form data-kind="${cbEsc(kind)}">
        <header class="combat-form__head">
          <div><strong>Uso em combate</strong><span>Como o grid lê ${kind === 'magia' ? 'esta magia' : (kind === 'item' ? 'este item' : 'esta habilidade')}. 1 quadrado = 1 metro.</span></div>
        </header>
        <div class="combat-form__grid">
          <label class="combat-field"><span>Uso</span><select class="create-form__input char-select" data-cb-uso>${cbOptions(COMBAT_USES, c.uso)}</select></label>
          <label class="combat-field" data-cb-when="on" ${off ? 'hidden' : ''}><span>Custa</span><select class="create-form__input char-select" data-cb-acao>${cbOptions(COMBAT_ACTIONS, c.acao)}</select></label>
          <label class="combat-field" data-cb-when="on" ${off ? 'hidden' : ''}><span>Alvos</span><select class="create-form__input char-select" data-cb-alvos>${cbOptions(COMBAT_TARGETS, c.alvos)}</select></label>
          <label class="combat-field" data-cb-when="ataque" ${c.uso === 'ataque' ? '' : 'hidden'}><span>Atributo do ataque</span><select class="create-form__input char-select" data-cb-atributo>${cbListOptions(COMBAT_ATTRS, c.atributo, attrBlank)}</select></label>
          <label class="combat-field" data-cb-when="on" ${off ? 'hidden' : ''}><span>Alcance (q)</span><input type="number" class="create-form__input" data-cb-alcance value="${cbEsc(c.alcance)}" min="0" max="200"><small>1 = corpo a corpo · 0 = próprio</small></label>
          <label class="combat-field" data-cb-when="on" ${off ? 'hidden' : ''}><span>Área</span><select class="create-form__input char-select" data-cb-forma>${cbOptions(COMBAT_SHAPES, c.forma)}</select></label>
          <label class="combat-field" data-cb-when="on" data-cb-size ${showSize && !off ? '' : 'hidden'}><span>${c.forma === 'linha' ? 'Comprimento' : (c.forma === 'quadrado' ? 'Largura' : 'Tamanho')} (q)</span><input type="number" class="create-form__input" data-cb-tamanho value="${cbEsc(c.tamanho)}" min="1" max="200"></label>
          <label class="combat-field" data-cb-when="on" data-cb-width ${showWidth && !off ? '' : 'hidden'}><span>${c.forma === 'linha' ? 'Espessura' : 'Altura'} (q)</span><input type="number" class="create-form__input" data-cb-largura value="${cbEsc(c.largura)}" min="1" max="200"></label>
          ${kind === 'magia' ? '' : `<label class="combat-field" data-cb-when="on" ${off ? 'hidden' : ''}><span>Custo</span><span class="combat-cost"><input type="number" class="create-form__input" data-cb-custo value="${c.custo && c.custo.valor ? cbEsc(c.custo.valor) : ''}" min="0" max="9999" placeholder="0"><select class="create-form__input char-select" data-cb-custo-unidade>${cbListOptions(COMBAT_COST_UNITS, (c.custo && c.custo.unidade) || 'MP')}</select></span></label>`}
        </div>
        <div class="combat-form__lists" data-cb-when="on" ${off ? 'hidden' : ''}>
          <div class="combat-list" data-cb-list="dano">
            <div class="combat-list__head"><span>Dano ou cura</span><button type="button" class="combat-list__add" data-cb-add="dano">+ Dano</button></div>
            <div class="combat-list__rows">${c.dano.map(combatDamageRowHTML).join('')}</div>
          </div>
          <div class="combat-list" data-cb-list="mods">
            <div class="combat-list__head"><span>Muda atributos ou o turno</span><button type="button" class="combat-list__add" data-cb-add="mods">+ Modificador</button></div>
            <div class="combat-list__rows">${c.mods.map(combatModRowHTML).join('')}</div>
          </div>
          <div class="combat-list" data-cb-list="efeitos">
            <div class="combat-list__head"><span>Efeitos da Lista de Efeitos</span><button type="button" class="combat-list__add" data-cb-add="efeitos">+ Efeito</button></div>
            <div class="combat-list__rows">${c.efeitos.map(combatEffectRowHTML).join('')}</div>
          </div>
          <label class="combat-field combat-field--wide"><span>O que o grid não faz sozinho</span><input type="text" class="create-form__input" data-cb-nota value="${cbEsc(c.nota)}" maxlength="400" placeholder="Ex.: empurra 2q; o Mestre aplica"></label>
        </div>
      </section>`;
  }

  function syncCombatForm(root) {
    if (!root) return;
    const uso = root.querySelector('[data-cb-uso]')?.value || 'ataque';
    root.querySelectorAll('[data-cb-when]').forEach((el) => {
      const when = el.dataset.cbWhen;
      let show = uso !== 'nenhum';
      if (when === 'ataque') show = uso === 'ataque';
      if (el.hasAttribute('data-cb-size') || el.hasAttribute('data-cb-width')) return;
      el.hidden = !show;
    });
    const forma = root.querySelector('[data-cb-forma]')?.value || 'alvo';
    const size = root.querySelector('[data-cb-size]');
    const width = root.querySelector('[data-cb-width]');
    if (size) {
      size.hidden = uso === 'nenhum' || forma === 'alvo' || forma === 'cena';
      const lab = size.querySelector('span');
      if (lab) lab.textContent = `${forma === 'linha' ? 'Comprimento' : (forma === 'quadrado' ? 'Largura' : 'Tamanho')} (q)`;
    }
    if (width) {
      width.hidden = uso === 'nenhum' || !(forma === 'quadrado' || forma === 'linha');
      const lab = width.querySelector('span');
      if (lab) lab.textContent = `${forma === 'linha' ? 'Espessura' : 'Altura'} (q)`;
    }
  }

  function readCombatForm(root) {
    if (!root) return null;
    const q = (sel) => root.querySelector(sel);
    const kind = root.dataset.kind || 'magia';
    const raw = {
      uso: q('[data-cb-uso]')?.value,
      acao: q('[data-cb-acao]')?.value,
      alvos: q('[data-cb-alvos]')?.value,
      atributo: q('[data-cb-atributo]')?.value,
      alcance: q('[data-cb-alcance]')?.value,
      forma: q('[data-cb-forma]')?.value,
      tamanho: q('[data-cb-tamanho]')?.value,
      largura: q('[data-cb-largura]')?.value,
      nota: q('[data-cb-nota]')?.value,
      dano: [...root.querySelectorAll('[data-cb-row="dano"]')].map((r) => ({
        dados: r.querySelector('[data-cb-dados]')?.value,
        bonus: r.querySelector('[data-cb-bonus]')?.value,
        tipo: r.querySelector('[data-cb-tipo]')?.value,
        elemento: r.querySelector('[data-cb-elemento]')?.value
      })),
      mods: [...root.querySelectorAll('[data-cb-row="mods"]')].map((r) => ({
        stat: r.querySelector('[data-cb-stat]')?.value,
        valor: r.querySelector('[data-cb-valor]')?.value,
        turnos: r.querySelector('[data-cb-turnos]')?.value
      })),
      efeitos: [...root.querySelectorAll('[data-cb-row="efeitos"]')].map((r) => ({
        nome: r.querySelector('[data-cb-efeito]')?.value,
        nivel: r.querySelector('[data-cb-nivel]')?.value,
        turnos: r.querySelector('[data-cb-turnos]')?.value
      }))
    };
    if (kind !== 'magia') raw.custo = { valor: q('[data-cb-custo]')?.value, unidade: q('[data-cb-custo-unidade]')?.value };
    return normalizeCombat(raw);
  }

  /* Dados digitados errado ("3d", "d6") ficam marcados antes de salvar. */
  function combatFormErrors(root) {
    if (!root) return [];
    const bad = [];
    root.querySelectorAll('[data-cb-dados]').forEach((el) => {
      const ok = !el.value.trim() || !!cbDice(el.value);
      el.classList.toggle('is-invalid', !ok);
      if (!ok) bad.push(el);
    });
    return bad;
  }

  /* Uso em combate de uma entrada do livro: o salvo ou, se ainda não houver,
     o convertido do texto (marcado como derived). */
  function combatOfEntry(entry) {
    const f = (entry && entry.fields) || {};
    const saved = normalizeCombat(f.Combate);
    if (saved) return { combat: saved, derived: false, doubts: [] };
    const tab = String((entry && entry.tab) || '');
    let r = { combat: null, doubts: [] };
    if (/^magias$/i.test(tab)) r = combatFromSpell(f, entry.subtype);
    else if (/^itens$/i.test(tab) && entry.subtype && entry.subtype !== 'item') r = combatFromItem(f, entry.subtype);
    return { combat: r.combat, derived: true, doubts: r.doubts };
  }
  function combatSectionHTML(entry, opts = {}) {
    const info = combatOfEntry(entry);
    const badge = combatBadgeHTML(info.combat, opts);
    if (!badge) return '';
    return `<div class="combat-read">${badge}${info.derived ? '<small class="combat-read__note">Lido do texto. Ao editar, o Mestre confirma e salva.</small>' : ''}</div>`;
  }

  let combatFormsBound = false;
  function bindCombatForms() {
    if (combatFormsBound) return;
    combatFormsBound = true;
    document.addEventListener('click', (e) => {
      const add = e.target.closest('[data-cb-add]');
      if (add) {
        e.preventDefault();
        const list = add.closest('[data-cb-list]');
        const rows = list && list.querySelector('.combat-list__rows');
        if (!rows) return;
        const type = add.dataset.cbAdd;
        const html = type === 'dano' ? combatDamageRowHTML({}) : (type === 'mods' ? combatModRowHTML({}) : combatEffectRowHTML({}));
        rows.insertAdjacentHTML('beforeend', html);
        rows.lastElementChild?.querySelector('input, select')?.focus();
        return;
      }
      const rm = e.target.closest('[data-cb-remove]');
      if (rm && rm.closest('[data-combat-form]')) {
        e.preventDefault();
        rm.closest('[data-cb-row]')?.remove();
      }
    });
    document.addEventListener('change', (e) => {
      if (!e.target.closest('[data-cb-uso], [data-cb-forma]')) return;
      syncCombatForm(e.target.closest('[data-combat-form]'));
    });
  }

  const safeCostUnit = (unit) => COST_UNITS.includes(unit) ? unit : 'MP';

  /* Escopos: novo formato fields.Escopos = [{tipo, detalhe}].
     Mantém compat com o legado fields.Escopo (array/string de nomes). */
  function spellScopeEntries(fields) {
    const f = fields || {};
    if (Array.isArray(f.Escopos)) {
      return f.Escopos
        .map((s) => (s && typeof s === 'object')
          ? { tipo: s.tipo, detalhe: s.detalhe || '' }
          : { tipo: String(s), detalhe: '' })
        .filter((s) => s.tipo);
    }
    const raw = f.Escopo;
    let names = [];
    if (Array.isArray(raw)) names = raw;
    else if (typeof raw === 'string') {
      try { const a = JSON.parse(raw); names = Array.isArray(a) ? a : raw.split(','); }
      catch { names = raw.split(','); }
    }
    return names.map((n) => String(n).trim()).filter(Boolean).map((tipo) => ({ tipo, detalhe: '' }));
  }
  const spellScopeNames = (fields) => spellScopeEntries(fields).map((s) => s.tipo);
  function spellScopePills(names, extraClass = '') {
    return (names || []).map((s) =>
      `<span class="scope-pill ${extraClass}" style="--pill:${scopeColor(s)}">${escapeHtml(s)}</span>`
    ).join('');
  }
  /* "12 MP", "5 HP" ou "—" quando sem custo. */
  function formatCusto(fields) {
    const f = fields || {};
    const v = String(f['Custo'] ?? '').trim();
    if (!v) return '—';
    const unit = safeCostUnit(f['CustoUnidade'] || 'MP');
    return `${v} ${unit}`;
  }
  const SPELL_EFFECT_SYMBOLS = ['✦', '✧', '✶', '✷', '☉', '☽', '☿', '⬡', '◆', '◇', '▲', '▼', '⚔', '✚', '!', '+'];
  const SPELL_EFFECT_COLORS = ['#22d3ee', '#f5b84b', '#f05264', '#a78bfa', '#4ade80', '#fb923c'];
  const SPELL_EFFECT_TYPES = ['Gatilho', 'Dano', 'Cura', 'Buff', 'Debuff', 'Controle', 'Condição', 'Complicação', 'Especial'];
  const SPELL_EFFECT_DURATIONS = ['Instantâneo', '1 turno', '2 turnos', '3 turnos', 'Cena', 'Até dissipar', 'Permanente'];

  function safeSpellEffectColor(value, fallback = SPELL_EFFECT_COLORS[0]) {
    const color = String(value || '').trim();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback;
  }

  function spellEffectDraft(effect = {}, index = 0) {
    const raw = (effect && typeof effect === 'object') ? effect : {};
    const symbol = String(raw.symbol || raw.simbolo || '').trim();
    const color = raw.color || raw.cor || SPELL_EFFECT_COLORS[index % SPELL_EFFECT_COLORS.length];
    const type = String(raw.type || raw.tipo || '').trim();
    const duration = String(raw.duration || raw.duracao || raw['Duração'] || '').trim();
    return {
      title: String(raw.title || raw.titulo || raw.name || '').trim(),
      text: String(raw.text || raw.descricao || raw.description || raw.efeito || '').trim(),
      symbol: SPELL_EFFECT_SYMBOLS.includes(symbol) ? symbol : SPELL_EFFECT_SYMBOLS[index % SPELL_EFFECT_SYMBOLS.length],
      color: safeSpellEffectColor(color, SPELL_EFFECT_COLORS[index % SPELL_EFFECT_COLORS.length]),
      type: SPELL_EFFECT_TYPES.includes(type) ? type : '',
      duration: SPELL_EFFECT_DURATIONS.includes(duration) ? duration : ''
    };
  }

  function normalizeSpellEffects(fields) {
    const f = fields || {};
    const raw = f['Efeitos Adicionais'];
    let list = [];
    let legacyText = '';

    if (Array.isArray(raw)) {
      list = raw;
    } else if (raw && typeof raw === 'object') {
      list = [raw];
    } else if (typeof raw === 'string' && raw.trim()) {
      const trimmed = raw.trim();
      try {
        const parsed = JSON.parse(trimmed);
        list = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? [parsed] : []);
      } catch {
        legacyText = trimmed;
      }
    }

    const normalized = list
      .map((effect, index) => {
        const draft = spellEffectDraft(effect, index);
        if (!draft.title && draft.text) draft.title = `Efeito ${index + 1}`;
        return draft;
      })
      .filter((effect) => effect.title || effect.text);

    if (!normalized.length) {
      const legacy = legacyText || String(f['Efeito Adicional'] || '').trim();
      legacy.split(/\n+/)
        .map((text) => text.trim())
        .filter(Boolean)
        .forEach((text, index) => {
          normalized.push({
            title: index ? `Efeito ${index + 1}` : 'Efeito adicional',
            text,
            symbol: SPELL_EFFECT_SYMBOLS[index % SPELL_EFFECT_SYMBOLS.length],
            color: SPELL_EFFECT_COLORS[(index + 3) % SPELL_EFFECT_COLORS.length],
            type: 'Especial',
            duration: ''
          });
        });
    }

    return normalized;
  }

  function spellEffectFormRowHTML(effect = {}, index = 0) {
    const draft = spellEffectDraft(effect, index);
    const symbolButtons = SPELL_EFFECT_SYMBOLS.map((symbol) => `
      <button type="button" class="spell-effect-symbol ${symbol === draft.symbol ? 'is-active' : ''}" data-effect-symbol="${escapeHtml(symbol)}" aria-pressed="${symbol === draft.symbol}">
        ${escapeHtml(symbol)}
      </button>`).join('');
    const colorButtons = SPELL_EFFECT_COLORS.map((color) => `
      <button type="button" class="spell-effect-color ${color === draft.color ? 'is-active' : ''}" data-effect-color="${escapeHtml(color)}" style="--swatch:${escapeHtml(color)}" aria-pressed="${color === draft.color}"></button>`).join('');
    const typeOptions = SPELL_EFFECT_TYPES.map((type) => `<option value="${escapeHtml(type)}" ${type === draft.type ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('');
    const durationOptions = SPELL_EFFECT_DURATIONS.map((duration) => `<option value="${escapeHtml(duration)}" ${duration === draft.duration ? 'selected' : ''}>${escapeHtml(duration)}</option>`).join('');
    return `
      <article class="spell-effect-form-row" data-effect-row style="--effect:${escapeHtml(draft.color)}">
        <input type="hidden" data-effect-symbol-value value="${escapeHtml(draft.symbol)}">
        <input type="hidden" data-effect-color-value value="${escapeHtml(draft.color)}">
        <div class="spell-effect-form-row__top">
          <div class="spell-effect-preview" aria-hidden="true">
            <span class="spell-effect-preview__symbol">${escapeHtml(draft.symbol)}</span>
            <span class="spell-effect-preview__label">Nota ${index + 1}</span>
          </div>
          <button type="button" class="spell-effect-remove" data-effect-remove aria-label="Remover efeito">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="spell-effect-form-row__grid">
          <label class="spell-effect-field spell-effect-field--title">
            <span>Título da nota</span>
            <input type="text" class="create-form__input" data-effect-title maxlength="80" placeholder="Ex.: Chamas persistentes" value="${escapeHtml(draft.title)}">
          </label>
          <label class="spell-effect-field spell-effect-field--select">
            <span>Tipo</span>
            <select class="create-form__input" data-effect-type>
              <option value="">Livre</option>
              ${typeOptions}
            </select>
          </label>
          <label class="spell-effect-field spell-effect-field--select">
            <span>Duração</span>
            <select class="create-form__input" data-effect-duration>
              <option value="">Sem duração</option>
              ${durationOptions}
            </select>
          </label>
        </div>
        <label class="spell-effect-field spell-effect-field--text">
          <span>O que acontece</span>
          <textarea class="create-form__input spell-textarea" data-effect-text rows="3" placeholder="Descreva a condição, benefício, penalidade, evolução ou variação desse efeito.">${escapeHtml(draft.text)}</textarea>
        </label>
        <div class="spell-effect-customize">
          <div>
            <span class="spell-effect-customize__label">Símbolo</span>
            <div class="spell-effect-symbols">${symbolButtons}</div>
          </div>
          <div>
            <span class="spell-effect-customize__label">Cor</span>
            <div class="spell-effect-colors">${colorButtons}</div>
          </div>
        </div>
      </article>`;
  }

  function spellEffectCardHTML(effect = {}, index = 0) {
    const draft = spellEffectDraft(effect, index);
    if (!draft.title && !draft.text) return '';
    const title = draft.title || `Efeito ${index + 1}`;
    const meta = [draft.type, draft.duration].filter(Boolean);
    return `
      <article class="spell-effect-card" style="--effect:${escapeHtml(draft.color)}">
        <div class="spell-effect-card__sigil" aria-hidden="true"><span>${escapeHtml(draft.symbol)}</span></div>
        <div class="spell-effect-card__body">
          <div class="spell-effect-card__head">
            <h3>${escapeHtml(title)}</h3>
            ${meta.length ? `<div class="spell-effect-card__meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
          </div>
          ${draft.text ? `<p>${escapeHtml(draft.text)}</p>` : ''}
        </div>
      </article>`;
  }

  const isMagiasTab = (id) => canonicalTabId(id) === 'Magias';

  function spellField(fields, ...keys) {
    const source = fields || {};
    for (const key of keys) {
      const value = source[key];
      if (value != null && String(value).trim() !== '') return value;
    }
    return '';
  }

  function normalizeSpellArcaneFields(fields) {
    const source = fields || {};
    const classificationRaw = String(spellField(source, 'Classifica\u00e7\u00e3o Arcana', 'Classifica\u00e7\u00e3o', 'Classificacao') || '').trim();
    const controlRaw = String(spellField(source, 'Grau de Controle', 'Controle') || '').trim();
    const useRaw = String(spellField(source, 'Forma de Uso', 'Uso') || '').trim();
    return {
      classificacao: SPELL_CLASSIFICATIONS.includes(classificationRaw) ? classificationRaw : '',
      control: SPELL_CONTROL_LEVELS.includes(controlRaw) ? controlRaw : '',
      useForm: SPELL_USE_FORMS.includes(useRaw) ? useRaw : ''
    };
  }

  const EMPTY_SPELL_FILTERS = { type: '', affinity: '', classification: '' };
  function normalizeSpellFilters(filters) {
    const src = filters || {};
    const type = isSpellType(src.type) ? src.type : '';
    const affinity = SPELL_AFFINITY_KEYS.includes(src.affinity) ? src.affinity : '';
    const classification = SPELL_CLASSIFICATIONS.includes(src.classification) ? src.classification : '';
    return { type, affinity, classification };
  }
  function hasSpellFilters(filters) {
    const f = normalizeSpellFilters(filters);
    return !!(f.type || f.affinity || f.classification);
  }
  function spellFilterStats(entries) {
    const types = SPELL_TYPE_KEYS.map((key) => ({ key, label: SPELL_TYPES[key].label, count: 0 }));
    const affinities = SPELL_AFFINITY_KEYS.map((key) => ({ key, label: SPELL_AFFINITIES[key].label, count: 0, meta: SPELL_AFFINITIES[key] }));
    const classifications = SPELL_CLASSIFICATIONS.map((key) => ({ key, label: key, count: 0 }));
    const byType = Object.fromEntries(types.map((row) => [row.key, row]));
    const byAffinity = Object.fromEntries(affinities.map((row) => [row.key, row]));
    const byClassification = Object.fromEntries(classifications.map((row) => [row.key, row]));

    entries.forEach((entry) => {
      const fields = entry.fields || {};
      const type = isSpellType(entry.subtype) ? entry.subtype : 'ativa';
      const arcane = normalizeSpellArcaneFields(fields);
      if (byType[type]) byType[type].count += 1;
      if (byAffinity[fields['Afinidade']]) byAffinity[fields['Afinidade']].count += 1;
      if (byClassification[arcane.classificacao]) byClassification[arcane.classificacao].count += 1;
    });

    return {
      types: types.filter((row) => row.count > 0),
      affinities: affinities.filter((row) => row.count > 0),
      classifications: classifications.filter((row) => row.count > 0)
    };
  }
  function spellFilterLabel(key, value) {
    if (!value) return '';
    if (key === 'type') return SPELL_TYPES[value]?.label || value;
    if (key === 'affinity') return SPELL_AFFINITIES[value]?.label || value;
    if (key === 'classification') return value;
    return value;
  }

  function spellActiveFilterLabels(filters) {
    const active = normalizeSpellFilters(filters);
    return Object.entries(active)
      .filter(([, value]) => !!value)
      .map(([key, value]) => spellFilterLabel(key, value))
      .filter(Boolean);
  }

  function spellCategoryFiltersHTML(entries, filters, open = false) {
    const active = normalizeSpellFilters(filters);
    const stats = spellFilterStats(entries);
    if (!stats.types.length && !stats.affinities.length && !stats.classifications.length) return '';

    const group = (label, key, rows, renderLabel) => rows.length ? `
      <div class="spell-filter-group" aria-label="${escapeHtml(label)}">
        <span class="spell-filter-group__label">${escapeHtml(label)}</span>
        <div class="spell-filter-group__chips">
          <button type="button" class="spell-filter-chip ${!active[key] ? 'is-active' : ''}" data-spell-filter="${key}" data-spell-filter-value="">
            Todas
          </button>
          ${rows.map((row) => `
            <button type="button" class="spell-filter-chip ${active[key] === row.key ? 'is-active' : ''}"
                    data-spell-filter="${key}" data-spell-filter-value="${escapeHtml(row.key)}"
                    ${row.meta ? `style="--chip-hue:${row.meta.hue};--chip-color:${row.meta.accent}"` : ''}>
              ${renderLabel(row)}
              <small>${row.count}</small>
            </button>
          `).join('')}
        </div>
      </div>` : '';

    return `
      <section class="spell-filter-panel ${open ? 'is-open' : ''}" aria-label="Filtros de magia" ${open ? '' : 'hidden'}>
        <div class="spell-filter-panel__head">
          <span>Filtros do grim\u00f3rio</span>
          ${hasSpellFilters(active) ? '<button type="button" class="spell-filter-reset" data-spell-filter-reset>Limpar filtros</button>' : ''}
        </div>
        ${group('Tipo', 'type', stats.types, (row) => `<span>${escapeHtml(SPELL_TYPES[row.key].badge)}</span>`)}
        ${group('Afinidade', 'affinity', stats.affinities, (row) => `<span class="spell-filter-chip__icon">${row.meta.icon}</span><span>${escapeHtml(row.label)}</span>`)}
        ${group('Classifica\u00e7\u00e3o', 'classification', stats.classifications, (row) => `<span>${escapeHtml(row.label)}</span>`)}
      </section>
    `;
  }

  /* Raridades possiveis em ordem crescente. As classes CSS batem com .rarity-chip--<x>. */
  const RARITY_OPTIONS = [
    { value: 'Comum',     cssClass: 'rarity-chip--common' },
    { value: 'Incomum',   cssClass: 'rarity-chip--uncommon' },
    { value: 'Raro',      cssClass: 'rarity-chip--rare' },
    { value: 'Épico',     cssClass: 'rarity-chip--epic' },
    { value: 'Lendário',  cssClass: 'rarity-chip--legendary' },
    { value: 'Único',     cssClass: 'rarity-chip--unique' }
  ];
  function rarityCssClass(value) {
    const key = normalize(value || '');
    if (/incomum/.test(key)) return 'rarity-chip--uncommon';
    if (/comum/.test(key)) return 'rarity-chip--common';
    if (/raro|rara/.test(key)) return 'rarity-chip--rare';
    if (/epico|epica/.test(key)) return 'rarity-chip--epic';
    if (/lendar/.test(key)) return 'rarity-chip--legendary';
    if (/unico|unica/.test(key)) return 'rarity-chip--unique';
    return 'rarity-chip--default';
  }

  /* ── RAÇAS: Atlas dos Povos ──────────────────────
     Os campos novos continuam dentro de stories.fields, portanto não exigem
     tabela ou migração. Leitores abaixo convertem o formato antigo sob demanda. */
  const RACE_HP_PARTS = ['Cabeça', 'Peito', 'Abdômen', 'Braço Direito', 'Braço Esquerdo', 'Perna Direita', 'Perna Esquerda'];
  const RACE_TYPES = ['Humanoide', 'Ancestral', 'Etérico', 'Artificial', 'Bestial', 'Abissal', 'Outro'];
  const RACE_SIZES = ['Minúsculo', 'Pequeno', 'Médio', 'Grande', 'Enorme'];
  const RACE_RELATION_TABS = [
    { tab: 'Paises', label: 'Países' },
    { tab: 'Biomas', label: 'Biomas' },
    { tab: 'Culturas', label: 'Culturas' },
    { tab: 'Faccoes', label: 'Facções' },
    { tab: 'Deuses', label: 'Deuses' }
  ];
  const RACE_SECTIONS = [
    {
      id: 'identidade',
      title: 'Identidade',
      fields: [
        { key: 'Raridade', type: 'rarity', promoted: true },
        { key: 'Tipo', type: 'select', options: RACE_TYPES, placeholder: 'Natureza biológica' },
        { key: 'Origem', type: 'text', placeholder: 'Ex.: Véu Cinzento' }
      ]
    },
    {
      id: 'fisiologia',
      title: 'Fisiologia',
      fields: [
        { key: 'Porte', type: 'select', options: RACE_SIZES, placeholder: 'Porte médio' },
        { key: 'Longevidade', type: 'text', placeholder: 'Ex.: 80–110 anos' },
        { key: 'Deslocamento', type: 'text', placeholder: 'Ex.: 1 metro' },
        { key: 'Alimentação', type: 'text', placeholder: 'Ex.: Onívora' },
        { key: 'Constituição', type: 'text', placeholder: 'Ex.: Semicorpórea, mineral, orgânica' },
        { key: 'Sentidos', type: 'text', placeholder: 'Ex.: Visão térmica em 12 metros' },
        { key: 'Resistência natural', type: 'text', placeholder: 'Ex.: Frio, veneno, Mana morta' },
        { key: 'Limitação física', type: 'text', placeholder: 'Ex.: Luz intensa, repouso prolongado' }
      ]
    },
    {
      id: 'regras',
      title: 'Impacto na ficha',
      view: 'raceRules',
      fields: []
    },
    {
      id: 'anatomia',
      title: 'Anatomia e vitalidade',
      view: 'raceAnatomy',
      fields: []
    },
    {
      id: 'aptidoes',
      title: 'Aptidões e limitações',
      view: 'raceAbilities',
      fields: []
    },
    {
      id: 'mundo',
      title: 'Presença no mundo',
      view: 'raceRelations',
      fields: []
    }
  ];
  function defaultHpFor(part) {
    if (part === 'Peito') return '85';
    if (part === 'Abdômen') return '75';
    if (part === 'Cabeça') return '55';
    return '65';
  }
  function isRaceSectionField(key) {
    return RACE_SECTIONS.some((s) => s.fields.some((f) => f.key === key));
  }
  function raceFieldDef(key) {
    for (const s of RACE_SECTIONS) {
      for (const f of s.fields) if (f.key === key) return f;
    }
    return null;
  }

  function normalizeRaceAttributes(fields) {
    const data = fields || {};
    const raw = data.Atributos;
    const legacy = parseRaceModifier(data.Modificador || '');
    const out = {};
    CHAR_ATTRIBUTES.forEach((attr) => {
      const candidate = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw[attr] : legacy[attr];
      const value = parseInt(candidate, 10);
      out[attr] = Number.isFinite(value) ? Math.max(-2, Math.min(2, value)) : 0;
    });
    return out;
  }

  function raceModifierText(attributes) {
    return CHAR_ATTRIBUTES
      .map((attr) => ({ attr, value: Number(attributes && attributes[attr]) || 0 }))
      .filter((row) => row.value)
      .map((row) => `${row.value > 0 ? '+' : ''}${row.value} ${row.attr}`)
      .join(', ');
  }

  function raceAnatomy(fields, fillDefaults = false) {
    const data = fields || {};
    const source = Array.isArray(data.Anatomia) ? data.Anatomia : (Array.isArray(data.PartesHP) ? data.PartesHP : []);
    const normalized = source
      .map((part) => ({
        name: String(part && (part.name || part.nome) || '').trim(),
        hp: String(part && (part.hp ?? part.value) || '').trim()
      }))
      .filter((part) => part.name);
    if (normalized.length) return normalized;
    const legacy = RACE_HP_PARTS
      .filter((part) => data[part] != null && data[part] !== '')
      .map((part) => ({ name: part, hp: String(data[part]) }));
    if (legacy.length || !fillDefaults) return legacy;
    return RACE_HP_PARTS.map((part) => ({ name: part, hp: defaultHpFor(part) }));
  }

  function normalizeRaceAbilities(fields) {
    const data = fields || {};
    if (Array.isArray(data.Aptidoes)) return normalizeBeastAbilities(data.Aptidoes);
    const legacy = [];
    if (data['Talento racial']) legacy.push({ name: data['Talento racial'], kind: 'Passiva', effect: 'Talento racial inato.' });
    (Array.isArray(data.Passivas) ? data.Passivas : []).forEach((name) => legacy.push({ name, kind: 'Passiva', effect: '' }));
    if (data.Penalidade) legacy.push({ name: data.Penalidade, kind: 'Limitação', effect: 'Limitação racial inata.' });
    return normalizeBeastAbilities(legacy);
  }

  function normalizeRaceRelations(fields) {
    const raw = fields && fields.Relacoes;
    const out = {};
    RACE_RELATION_TABS.forEach(({ tab }) => {
      const list = raw && typeof raw === 'object' && Array.isArray(raw[tab]) ? raw[tab] : [];
      out[tab] = [...new Set(list.map((id) => String(id || '').trim()).filter(Boolean))];
    });
    return out;
  }

  function raceTotalHp(fields) {
    return raceAnatomy(fields).reduce((sum, part) => sum + (parseInt(part.hp, 10) || 0), 0);
  }

  const EMPTY_RACE_FILTERS = { type: '', size: '', rarity: '', origin: '' };
  function normalizeRaceFilters(filters) {
    const source = filters || {};
    return {
      type: String(source.type || '').trim(),
      size: String(source.size || '').trim(),
      rarity: String(source.rarity || '').trim(),
      origin: String(source.origin || '').trim()
    };
  }
  function hasRaceFilters(filters) {
    return Object.values(normalizeRaceFilters(filters)).some(Boolean);
  }
  function raceFilterValues(entries, field) {
    const values = new Map();
    entries.forEach((entry) => {
      const value = String((entry.fields || {})[field] || '').trim();
      if (!value) return;
      const key = normalize(value);
      const row = values.get(key) || { value, count: 0 };
      row.count += 1;
      values.set(key, row);
    });
    return [...values.values()].sort((a, b) => a.value.localeCompare(b.value, 'pt-BR'));
  }
  function raceCategoryFiltersHTML(entries, filters, open = false) {
    const active = normalizeRaceFilters(filters);
    const groups = [
      { key: 'type', label: 'Natureza', rows: raceFilterValues(entries, 'Tipo') },
      { key: 'size', label: 'Porte', rows: raceFilterValues(entries, 'Porte') },
      { key: 'rarity', label: 'Raridade', rows: raceFilterValues(entries, 'Raridade') },
      { key: 'origin', label: 'Origem', rows: raceFilterValues(entries, 'Origem') }
    ].filter((group) => group.rows.length);
    if (!groups.length) return '';
    return `
      <section class="beast-filter-panel race-filter-panel ${open ? 'is-open' : ''}" aria-label="Filtros do Atlas das Raças" ${open ? '' : 'hidden'}>
        <div class="beast-filter-panel__head">
          <div><strong>Refinar atlas</strong><span>Encontre povos por natureza, porte, raridade ou origem.</span></div>
          ${hasRaceFilters(active) ? '<button type="button" class="beast-filter-reset" data-race-filter-reset>Limpar filtros</button>' : ''}
        </div>
        <div class="beast-filter-groups">
          ${groups.map((group) => `
            <div class="beast-filter-group">
              <span class="beast-filter-group__label">${escapeHtml(group.label)}</span>
              <div class="beast-filter-group__chips">
                <button type="button" class="beast-filter-chip ${!active[group.key] ? 'is-active' : ''}" data-race-filter="${group.key}" data-race-filter-value="">Todos</button>
                ${group.rows.map((row) => `<button type="button" class="beast-filter-chip ${normalize(active[group.key]) === normalize(row.value) ? 'is-active' : ''}" data-race-filter="${group.key}" data-race-filter-value="${escapeHtml(row.value)}"><span>${escapeHtml(row.value)}</span><small>${row.count}</small></button>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </section>`;
  }

  /* ── BESTIÁRIO: ficha de criatura ────────────────
     Usa o dossiê seccionado de Raças, com atributos, HP anatômico
     flexível e drops vinculados aos Itens do codex. */
  const BEAST_THREATS = [
    { value: 'Trivial',    cssClass: 'rarity-chip--common' },
    { value: 'Perigoso',   cssClass: 'rarity-chip--uncommon' },
    { value: 'Mortal',     cssClass: 'rarity-chip--rare' },
    { value: 'Letal',      cssClass: 'rarity-chip--epic' },
    { value: 'Pesadelo',   cssClass: 'rarity-chip--legendary' },
    { value: 'Cataclismo', cssClass: 'rarity-chip--unique' }
  ];
  const threatCssClass = (value) => {
    const found = BEAST_THREATS.find((t) => normalize(t.value) === normalize(value));
    return found ? found.cssClass : 'rarity-chip--default';
  };

  const EMPTY_BEAST_FILTERS = { threat: '', type: '', habitat: '' };
  function normalizeBeastFilters(filters) {
    const source = filters || {};
    return {
      threat: String(source.threat || '').trim(),
      type: String(source.type || '').trim(),
      habitat: String(source.habitat || '').trim()
    };
  }
  function hasBeastFilters(filters) {
    const normalized = normalizeBeastFilters(filters);
    return !!(normalized.threat || normalized.type || normalized.habitat);
  }
  function beastFilterOptions(entries, key) {
    const counts = new Map();
    entries.forEach((entry) => {
      const value = String((entry.fields || {})[key] || '').trim();
      if (!value) return;
      const normalized = normalize(value);
      const current = counts.get(normalized) || { value, count: 0 };
      current.count += 1;
      counts.set(normalized, current);
    });
    return [...counts.values()].sort((a, b) => a.value.localeCompare(b.value, 'pt-BR'));
  }
  function beastCategoryFiltersHTML(entries, filters, open = false) {
    const active = normalizeBeastFilters(filters);
    const groups = [
      { key: 'threat', label: 'Perigo', rows: BEAST_THREATS.map((item) => ({ value: item.value, count: entries.filter((entry) => normalize((entry.fields || {}).Perigo) === normalize(item.value)).length })).filter((item) => item.count) },
      { key: 'type', label: 'Tipo', rows: beastFilterOptions(entries, 'Tipo') },
      { key: 'habitat', label: 'Habitat', rows: beastFilterOptions(entries, 'Habitat') }
    ];
    if (!groups.some((group) => group.rows.length)) return '';
    return `
      <section class="beast-filter-panel ${open ? 'is-open' : ''}" aria-label="Filtros do Bestiário" ${open ? '' : 'hidden'}>
        <div class="beast-filter-panel__head">
          <div>
            <strong>Refinar acervo</strong>
            <span>Encontre criaturas pela ameaça, natureza ou território.</span>
          </div>
          ${hasBeastFilters(active) ? '<button type="button" class="beast-filter-reset" data-beast-filter-reset>Limpar filtros</button>' : ''}
        </div>
        <div class="beast-filter-groups">
          ${groups.map((group) => group.rows.length ? `
            <div class="beast-filter-group">
              <span class="beast-filter-group__label">${escapeHtml(group.label)}</span>
              <div class="beast-filter-group__chips">
                <button type="button" class="beast-filter-chip ${!active[group.key] ? 'is-active' : ''}" data-beast-filter="${group.key}" data-beast-filter-value="">Todos</button>
                ${group.rows.map((row) => `
                  <button type="button" class="beast-filter-chip ${normalize(active[group.key]) === normalize(row.value) ? 'is-active' : ''}"
                          data-beast-filter="${group.key}" data-beast-filter-value="${escapeHtml(row.value)}">
                    <span>${escapeHtml(row.value)}</span><small>${row.count}</small>
                  </button>`).join('')}
              </div>
            </div>` : '').join('')}
        </div>
      </section>`;
  }

  const BEAST_DEFENSE_REDUCTION = [0, 10, 20, 35, 50, 65, 75];
  const BEAST_VITALS = ['DF', 'DM'];
  const BEAST_SECTIONS = [
    {
      id: 'natureza',
      title: 'Natureza',
      fields: [
        { key: 'Perigo', type: 'threat', promoted: true },
        { key: 'Tipo', type: 'text', placeholder: 'Ex.: Aberração, Fera, Morto-vivo' },
        { key: 'Habitat', type: 'text', placeholder: 'Ex.: Pântanos de mana morta' },
        { key: 'Instinto', type: 'text', placeholder: 'Ex.: Caçar ao anoitecer / proteger o ninho' }
      ]
    },
    {
      id: 'atributos',
      title: 'Atributos',
      view: 'attributes',
      fields: [
        { key: 'Atributos', type: 'attributes' }
      ]
    },
    {
      id: 'vitalidade',
      title: 'Vitalidade e Defesas',
      view: 'vitals',
      fields: [
        { key: 'PartesHP', type: 'hpParts' },
        { key: 'DF', type: 'defense', default: '0' },
        { key: 'DM', type: 'defense', default: '0' },
        { key: 'Mana', type: 'mana', default: '', placeholder: 'Opcional — ex.: 30/30' }
      ]
    },
    {
      id: 'orientacao',
      title: 'Guia do Mestre',
      fields: [
        { key: 'Sinais', type: 'textarea', placeholder: 'Pistas, rastros ou presságios que anunciam a criatura.' },
        { key: 'Comportamento', type: 'textarea', placeholder: 'Como ela reage, caça, foge, protege território ou negocia.' },
        { key: 'Fraquezas', type: 'textarea', placeholder: 'Vulnerabilidades conhecidas, limitações e formas de evitá-la.' },
        { key: 'Condução', type: 'textarea', placeholder: 'Orientações para interpretar e apresentar a criatura na história.' }
      ]
    },
    {
      id: 'drops',
      title: 'Drops',
      view: 'drops',
      fields: [
        { key: 'Drops', type: 'drops' },
        { key: 'Espólio', type: 'text', placeholder: 'Nota narrativa opcional / legado' }
      ]
    },
    {
      id: 'habilidades',
      title: 'Habilidades',
      view: 'abilities',
      fields: [
        { key: 'Habilidades', type: 'abilities' }
      ]
    }
  ];

  /* Dossiês seccionados por categoria (Raças e Bestiário). */
  const SECTIONED_DOSSIERS = {
    Racas: { sections: RACE_SECTIONS, rootId: 'raceDossier', promotedKey: 'Raridade' },
    Bestiario: { sections: BEAST_SECTIONS, rootId: 'beastDossier', promotedKey: 'Perigo' }
  };
  const isSectionedTab = (id) => Object.prototype.hasOwnProperty.call(SECTIONED_DOSSIERS, canonicalTabId(id));
  const sectionsForTab = (id) => (SECTIONED_DOSSIERS[canonicalTabId(id)] || SECTIONED_DOSSIERS.Racas).sections;
  const dossierConfigFor = (id) => SECTIONED_DOSSIERS[canonicalTabId(id)] || SECTIONED_DOSSIERS.Racas;

  /* ── FICHAS DE PERSONAGEM (aba Persona) ───────────
     Atributos do sistema O Arcano. Para mudar a lista, edite só este array.
     Todos começam em CHAR_ATTR_BASE (10) e distribuem CHAR_POINT_POOL (6)
     pontos, com teto de CHAR_ATTR_MAX (16) por atributo. A ficha converte
     cada valor em uma pilha de d6 para os testes; o "Modificador" da raca
     soma dados ao atributo final. Magos usam Fragilidade Arcana em testes
     fisicos prolongados, sem trava fixa de Resistencia. */
  const CHAR_ATTRIBUTES = ['Força', 'Destreza', 'Inteligência', 'Resistência', 'Carisma', 'Sabedoria'];
  const CHAR_ATTR_BASE = 10;
  const CHAR_POINT_POOL = 6;
  const CHAR_ATTR_MAX = 16;
  const CHAR_RES_ATTR = 'Resistência';

  const BEAST_EXTRA_PARTS = ['Cauda', 'Asa', 'Braço Extra', 'Tentáculo', 'Personalizada'];
  const BEAST_ABILITY_KINDS = ['Ativa', 'Passiva', 'Reação', 'Limitação'];

  function defaultBeastAttributes() {
    const out = {};
    CHAR_ATTRIBUTES.forEach((a) => { out[a] = CHAR_ATTR_BASE; });
    return out;
  }

  function normalizeBeastAttributes(raw, fillDefaults = false) {
    const out = fillDefaults ? defaultBeastAttributes() : {};
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      CHAR_ATTRIBUTES.forEach((a) => {
        if (raw[a] != null && raw[a] !== '') {
          const n = parseInt(raw[a], 10);
          out[a] = Number.isFinite(n) ? n : CHAR_ATTR_BASE;
        }
      });
    }
    return out;
  }

  function beastDiceForScore(score) {
    return Math.max(1, Math.floor((Number(score || CHAR_ATTR_BASE) - CHAR_ATTR_BASE) / 2) + 1);
  }

  function beastScoreForDice(dice) {
    return CHAR_ATTR_BASE + (Math.max(1, Number(dice) || 1) - 1) * 2;
  }

  function beastDaAttribute(fields) {
    const data = fields || {};
    const candidate = data['DA Base'] || data['Atributo de DA'] || data.DA;
    return CHAR_ATTRIBUTES.includes(candidate) ? candidate : '';
  }

  function beastDefenseLevel(fields, key) {
    const raw = parseInt((fields || {})[key], 10);
    return Math.max(0, Math.min(BEAST_DEFENSE_REDUCTION.length - 1, Number.isFinite(raw) ? raw : 0));
  }

  function beastDefensePercent(level) {
    const parsed = parseInt(level, 10);
    const safeLevel = Math.max(0, Math.min(BEAST_DEFENSE_REDUCTION.length - 1, Number.isFinite(parsed) ? parsed : 0));
    return BEAST_DEFENSE_REDUCTION[safeLevel] || 0;
  }

  function defaultBeastHpParts() {
    return [{ name: 'Corpo', hp: '' }];
  }

  function normalizeBeastHpParts(raw) {
    const source = Array.isArray(raw)
      ? raw
      : (raw && typeof raw === 'object'
        ? Object.entries(raw).map(([name, hp]) => ({ name, hp }))
        : []);
    return source
      .map((part) => {
        if (part && typeof part === 'object') {
          return {
            name: String(part.name || part.nome || part.part || '').trim(),
            hp: String(part.hp || part.HP || part.value || '').trim()
          };
        }
        return null;
      })
      .filter((part) => part && part.name);
  }

  function legacyBeastHpParts(fields) {
    const data = fields || {};
    const parts = RACE_HP_PARTS
      .filter((p) => data[p] != null && data[p] !== '')
      .map((p) => ({ name: p, hp: String(data[p]) }));
    if (parts.length) return parts;
    return data.HP != null && data.HP !== ''
      ? [{ name: 'HP Total', hp: String(data.HP) }]
      : [];
  }

  function beastHpPartsForForm(fields) {
    const parts = normalizeBeastHpParts((fields || {}).PartesHP);
    if (parts.length) return parts;
    const legacy = legacyBeastHpParts(fields);
    return legacy.length ? legacy : defaultBeastHpParts();
  }

  function beastHpPartsForView(fields) {
    const parts = normalizeBeastHpParts((fields || {}).PartesHP);
    return parts.length ? parts : legacyBeastHpParts(fields);
  }

  function beastHpTotal(fields) {
    return beastHpPartsForView(fields).reduce((total, part) => {
      const match = String(part.hp || '').replace(',', '.').match(/\d+(?:\.\d+)?/);
      const value = Number(match ? match[0] : 0);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function normalizeBeastDrops(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((drop) => {
        if (!drop || typeof drop !== 'object') return null;
        const refId = String(drop.refId || drop.id || '').trim();
        const item = refId ? entryById(refId) : null;
        const name = String((item && item.title) || drop.name || '').trim();
        if (!refId && !name) return null;
        return {
          refId,
          name,
          summary: String((item && item.summary) || drop.summary || '').trim(),
          quantity: String(drop.quantity || drop.qty || '').trim(),
          chance: String(drop.chance || '').trim(),
          note: String(drop.note || drop.condicao || drop.condição || '').trim()
        };
      })
      .filter(Boolean);
  }

  function beastAbilityKindFrom(value) {
    const key = normalize(value);
    if (key === 'passiva') return 'Passiva';
    if (key === 'reacao') return 'Reação';
    if (key === 'limitacao' || key === 'penalidade') return 'Limitação';
    return 'Ativa';
  }

  function abilityFromMagicEntry(entry, overrides = {}) {
    const f = (entry && entry.fields) || {};
    const type = isSpellType(entry && entry.subtype) ? entry.subtype : 'ativa';
    const isPassive = type === 'passiva';
    return {
      source: 'magic',
      refId: entry ? entry.id : '',
      name: (entry && entry.title) || overrides.name || '',
      kind: isPassive ? 'Passiva' : 'Ativa',
      trigger: isPassive ? (f['Condição de Ativação'] || '') : '',
      cost: formatCusto(f) === '—' ? '' : formatCusto(f),
      range: isPassive ? '' : (f['Alcance'] ? `${f['Alcance']}q` : ''),
      duration: isPassive ? '' : (f['Duração'] || ''),
      effect: isPassive ? (f['Efeito Contínuo'] || entry?.summary || '') : (f['Descrição'] || entry?.summary || ''),
      limit: isPassive ? (f['Manutenção'] ? `Manutenção: ${f['Manutenção']}` : '') : (f['Efeito Adicional'] || ''),
      summary: (entry && entry.summary) || ''
    };
  }

  function normalizeBeastAbilities(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((ability) => {
        if (typeof ability === 'string') {
          const name = ability.trim();
          return name ? {
            source: 'custom', refId: '', name, kind: 'Ativa',
            trigger: '', cost: '', range: '', duration: '', effect: name, limit: '', summary: ''
          } : null;
        }
        if (!ability || typeof ability !== 'object') return null;
        const source = ability.source === 'magic' || ability.refId ? 'magic' : 'custom';
        const refId = String(ability.refId || '').trim();
        const linked = source === 'magic' && refId ? entryById(refId) : null;
        const fromMagic = linked ? abilityFromMagicEntry(linked, ability) : null;
        const name = String((fromMagic && fromMagic.name) || ability.name || '').trim();
        if (!name && !refId) return null;
        return {
          source,
          refId,
          name: name || 'Habilidade',
          kind: beastAbilityKindFrom(ability.kind || (fromMagic && fromMagic.kind)),
          trigger: String(ability.trigger || (fromMagic && fromMagic.trigger) || '').trim(),
          cost: String(ability.cost || (fromMagic && fromMagic.cost) || '').trim(),
          range: String(ability.range || (fromMagic && fromMagic.range) || '').trim(),
          duration: String(ability.duration || (fromMagic && fromMagic.duration) || '').trim(),
          effect: String(ability.effect || (fromMagic && fromMagic.effect) || '').trim(),
          limit: String(ability.limit || (fromMagic && fromMagic.limit) || '').trim(),
          summary: String((fromMagic && fromMagic.summary) || ability.summary || '').trim(),
          combat: source === 'magic' ? null : normalizeCombat(ability.combat)
        };
      })
      .filter(Boolean);
  }

  /* O Despertar: rolagens de 1d100. */
  const AWAKEN_MAGE_MIN = 71;   // 1–70 não-mago, 71–100 mago
  const AWAKEN_MAX_ATTEMPTS = 3;
  const MAGIC_SCHOOLS = [
    { id: 'elemental', name: 'Elemental', min: 1,  max: 50,  hue: 18,
      lore: 'A Mana se manifesta como fogo, geada, raio e pedra — bruta e faminta.' },
    { id: 'arcanista', name: 'Arcanista', min: 51, max: 85,  hue: 268,
      lore: 'A Mana obedece à fórmula e ao símbolo: feitiçaria estudada, precisa e fria.' },
    { id: 'druidico',  name: 'Druídico',  min: 86, max: 95,  hue: 140,
      lore: 'A Mana flui da carne viva, da seiva e do instinto das feras.' },
    { id: 'celestial', name: 'Celestial', min: 96, max: 100, hue: 48,
      lore: 'A Mana desce de algo que dorme acima — luz que cura e que julga.' }
  ];
  function rollD100() { return Math.floor(Math.random() * 100) + 1; }
  function schoolForRoll(roll) {
    return MAGIC_SCHOOLS.find((s) => roll >= s.min && roll <= s.max) || MAGIC_SCHOOLS[0];
  }
  function schoolById(id) {
    return MAGIC_SCHOOLS.find((s) => s.id === id) || null;
  }
  /* Teto de um atributo na criacao; o sistema atual nao trava Resistencia de mago. */
  function attrCapFor(attr, isMageAccepted) {
    return CHAR_ATTR_MAX;
  }
  /* Valor legado: mantido para telas antigas que ainda leem modificador. */
  function attrModifierFor(score, attr, raceMod) {
    return Math.floor((Number(score) - 10) / 2) + Number((raceMod && raceMod[attr]) || 0);
  }
  const fmtMod = (m) => (m > 0 ? '+' + m : String(m));

  /* Ícones (stroke) usados nos cabeçalhos da ficha redesenhada. */
  const FICON = {
    attr:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15l-4.8 2.5.9-5.4L4.2 7.7l5.4-.8z"/></svg>',
    feat:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3l1.6 4.6L18 9l-3.4 2.7L15 16l-3-2.4L9 16l.4-4.3L6 9l4.4-1.4z"/><path d="M5 4v3M3.5 5.5h3M18 16v3M16.5 17.5h3"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3z"/></svg>',
    check:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    heart:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C7 17 3 13 3 8.5 3 6 5 4 7.5 4 9.2 4 10.7 5 12 7c1.3-2 2.8-3 4.5-3C19 4 21 6 21 8.5 21 13 17 17 12 21z"/></svg>',
    bolt:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>',
    sword:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5l6 6M3 21l4-1L18 9l-3-3L4 17l-1 4z"/></svg>',
    bag:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16v13H4zM9 7V4h6v3"/></svg>',
    spark:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l1.8 5.6L20 9.4l-4.8 3.6L17 19l-5-3.5L7 19l1.8-6L4 9.4l6.2-1.8z"/></svg>',
    mana:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 2l4 7-4 13-4-13z"/></svg>',
    status: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    clock:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    gem:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3 7 9l5 12 5-12-2-6"/></svg>',
    book:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/></svg>',
    dice:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none"/></svg>'
  };

  /* Dados de atributo já com bônus do Despertar aplicado. */
  /* Dados = metade do que passa da base (arredondado para baixo), mínimo 1d6.
     10–13 = 1d6 · 14–15 = 2d6 · 16–17 = 3d6 · 18–19 = 4d6. A raça soma depois. */
  function attrDiceForScore(score, raceMod = 0) {
    const baseDice = Math.max(1, Math.floor((Number(score || CHAR_ATTR_BASE) - CHAR_ATTR_BASE) / 2));
    return Math.max(1, baseDice + Number(raceMod || 0));
  }
  const fmtDice = (n) => `${Math.max(1, Number(n) || 1)}d6`;

  /* Efeitos livres da ficha. Por enquanto pertencem à Persona; mais adiante
     poderão apontar para a biblioteca interna sem alterar a apresentação. */
  const CHARACTER_EFFECT_MAX = 30;
  function characterEffectDraft(effect = {}, index = 0) {
    const raw = (effect && typeof effect === 'object' && !Array.isArray(effect)) ? effect : {};
    const symbol = String(raw.symbol || raw.simbolo || '').trim();
    return {
      symbol: SPELL_EFFECT_SYMBOLS.includes(symbol) ? symbol : SPELL_EFFECT_SYMBOLS[index % SPELL_EFFECT_SYMBOLS.length],
      title: String(raw.title || raw.titulo || raw.name || '').trim().slice(0, 80),
      description: String(raw.description || raw.descricao || raw.text || raw.efeito || '').trim().slice(0, 700)
    };
  }
  function characterEffects(c) {
    const raw = c && c.identity && Array.isArray(c.identity.effects) ? c.identity.effects : [];
    return raw.map((effect, index) => characterEffectDraft(effect, index))
      .filter((effect) => effect.title || effect.description)
      .slice(0, CHARACTER_EFFECT_MAX);
  }
  function setCharacterEffects(c, effects) {
    c.identity = (c.identity && typeof c.identity === 'object' && !Array.isArray(c.identity)) ? c.identity : {};
    c.identity.effects = (Array.isArray(effects) ? effects : [])
      .map((effect, index) => characterEffectDraft(effect, index))
      .filter((effect) => effect.title || effect.description)
      .slice(0, CHARACTER_EFFECT_MAX);
  }
  function characterEffectEditorHTML(effect = {}, index = -1) {
    const draft = characterEffectDraft(effect, Math.max(0, index));
    return `
      <article class="arc-effect-editor" data-char-effect-editor data-char-effect-index="${index}">
        <input type="hidden" data-char-effect-symbol-value value="${escapeHtml(draft.symbol)}">
        <div class="arc-effect-editor__head"><strong>${index < 0 ? 'Novo efeito' : 'Editar efeito'}</strong><button type="button" class="arc-effect-editor__cancel" data-char-effect-cancel aria-label="Cancelar edição">×</button></div>
        <label class="arc-effect-editor__field"><span>Título</span><input type="text" class="create-form__input" data-char-effect-title maxlength="80" value="${escapeHtml(draft.title)}" placeholder="Nome do efeito"></label>
        <label class="arc-effect-editor__field"><span>Descrição</span><textarea class="create-form__input" data-char-effect-description rows="3" maxlength="700" placeholder="O que este efeito faz">${escapeHtml(draft.description)}</textarea></label>
        <div class="arc-effect-editor__icons"><span>Ícone</span><div>${SPELL_EFFECT_SYMBOLS.map((symbol) => `<button type="button" class="arc-effect-editor__icon ${symbol === draft.symbol ? 'is-active' : ''}" data-char-effect-symbol="${escapeHtml(symbol)}" aria-pressed="${symbol === draft.symbol}" title="${escapeHtml(symbol)}">${escapeHtml(symbol)}</button>`).join('')}</div></div>
        <button type="button" class="btn btn-primary arc-effect-editor__save" data-char-effect-save>${FICON.check}<span>Salvar efeito</span></button>
      </article>`;
  }
  function characterEffectsInner(c, canEdit) {
    const effects = characterEffects(c);
    return `
      <div class="arc-effects">
        <div class="arc-effects__head"><span>Efeitos</span>${canEdit ? `<button type="button" class="btn btn-ghost arc-effects__add" data-char-effect-add><span>+</span>Adicionar efeito</button>` : ''}</div>
        <div class="arc-effects__list" data-char-effect-list>
          ${effects.length ? effects.map((effect, index) => `
            <article class="arc-effect" data-char-effect="${index}">
              <span class="arc-effect__sigil" aria-hidden="true">${escapeHtml(effect.symbol)}</span>
              <div class="arc-effect__body"><strong>${escapeHtml(effect.title || `Efeito ${index + 1}`)}</strong>${effect.description ? `<p>${escapeHtml(effect.description)}</p>` : ''}</div>
              ${canEdit ? `<div class="arc-effect__actions"><button type="button" data-char-effect-edit="${index}" aria-label="Editar ${escapeHtml(effect.title || `efeito ${index + 1}`)}" title="Editar efeito"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button><button type="button" data-char-effect-remove="${index}" aria-label="Remover ${escapeHtml(effect.title || `efeito ${index + 1}`)}" title="Remover efeito">×</button></div>` : ''}
            </article>`).join('') : '<p class="char-empty arc-effects__empty">Nenhum efeito registrado.</p>'}
        </div>
      </div>`;
  }

  function rollDicePool(dice) {
    const d6s = [];
    const n = Math.max(1, Number(dice) || 1);
    for (let i = 0; i < n; i++) d6s.push(1 + Math.floor(Math.random() * 6));
    const destiny = 1 + Math.floor(Math.random() * 12);
    return {
      dice: n,
      d6s,
      destiny,
      total: destiny + d6s.reduce((sum, v) => sum + v, 0)
    };
  }
  function destinyReading(n) {
    const v = Number(n) || 0;
    if (v === 1) return { title: 'Complicacao grave', text: 'O mundo piora a situacao, mesmo se a acao tiver sucesso.' };
    if (v >= 2 && v <= 6) return { title: 'Sem vantagem', text: 'Sucesso direto ou falha direta, sem abertura extra.' };
    if (v >= 7 && v <= 9) return { title: 'Custo', text: 'O resultado cobra dano, tempo, ruido, recurso ou exposicao.' };
    if (v >= 10 && v <= 11) return { title: 'Limpo', text: 'Resultado sem custo adicional relevante.' };
    if (v === 12) return { title: 'Oportunidade', text: 'Surge vantagem, informacao, abertura ou caminho alternativo.' };
    return { title: 'Destino', text: '' };
  }

  function attrModsView(c, mod, bonusAttr) {
    const out = {};
    CHAR_ATTRIBUTES.forEach((a) => {
      const bonus = (bonusAttr && bonusAttr === a) ? 1 : 0;
      const score = (c.attributes && c.attributes[a] != null ? Number(c.attributes[a]) : CHAR_ATTR_BASE) + bonus;
      const raceMod = Number((mod && mod[a]) || 0);
      out[a] = { score, m: attrModifierFor(score, a, mod), dice: attrDiceForScore(score, raceMod), bonus, raceMod };
    });
    return out;
  }

  /* Interpreta o campo "Modificador" de uma raça em { atributo: delta }.
     Aceita formatos como "+1 Força, -1 Destreza", "Força +2; Vontade -1". */
  function parseRaceModifier(text) {
    const out = {};
    if (!text) return out;
    const norm = (s) => normalize(s);
    const lookup = {};
    CHAR_ATTRIBUTES.forEach((a) => { lookup[norm(a)] = a; });
    // Captura pares número↔atributo em qualquer ordem.
    const re = /([+-]?\d+)\s*([a-zà-ú]+)|([a-zà-ú]+)\s*([+-]?\d+)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const num = m[1] != null ? m[1] : m[4];
      const word = (m[2] != null ? m[2] : m[3]) || '';
      const attr = lookup[norm(word)];
      const delta = parseInt(num, 10);
      if (attr && !Number.isNaN(delta)) out[attr] = (out[attr] || 0) + delta;
    }
    return out;
  }

  /* ── SUPABASE CLIENT ──────────────────────────── */
  const cfg = window.ARCANO_CONFIG || {};
  const supabaseConfigured =
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.startsWith('COLE_') &&
    !cfg.supabaseAnonKey.startsWith('COLE_') &&
    window.supabase;
  const sb = supabaseConfigured
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;
  if (!sb) {
    console.warn('[O Arcano] Supabase não configurado — preencha assets/js/config.js para ativar o salvamento online.');
  }
  const BANNERS_BUCKET = 'banners';

  /* ── AUTH STATE ───────────────────────────────── */
  const auth = {
    user: null,
    role: null,
    profile: null,
    status: null,
    requestedRole: null,
    approvedRole: null,
    canRead: false,
    tier: null,
    // isAdmin = pode editar o Livro do Arcano (Ouro e Platina).
    isAdmin: false,
    isPlatina: false,
    isPlayer: false
  };

  /* Niveis de conta. Mestre e Jogador existem so dentro de cada mesa. */
  const TIERS = {
    bronze:  { label: 'Bronze',  tone: 'Usuário comum' },
    prata:   { label: 'Prata',   tone: 'VIP' },
    ouro:    { label: 'Ouro',    tone: 'Moderador · edita o Livro do Arcano' },
    platina: { label: 'Platina', tone: 'Administrador · livro, todas as mesas e painel' }
  };
  /* Por enquanto so estes dois sao oferecidos no painel. */
  const TIERS_ACTIVE = ['bronze', 'platina'];

  function setAuthState(session) {
    if (session && session.user) {
      auth.user = session.user;
      auth.role = null;
      auth.profile = null;
      auth.status = null;
      auth.requestedRole = session.user.user_metadata?.requested_role || null;
      auth.approvedRole = null;
      auth.canRead = false;
      auth.tier = null;
      auth.isAdmin = false;
      auth.isPlatina = false;
      auth.isPlayer = false;
    } else {
      auth.user = null;
      auth.role = null;
      auth.profile = null;
      auth.status = null;
      auth.requestedRole = null;
      auth.approvedRole = null;
      auth.canRead = false;
      auth.tier = null;
      auth.isAdmin = false;
      auth.isPlatina = false;
      auth.isPlayer = false;
    }
    document.body.classList.toggle('is-locked', !auth.canRead);
    document.body.classList.toggle('is-admin', auth.isAdmin);
    document.body.classList.toggle('is-player', auth.isPlayer);
  }

  function tierLabel(tier) {
    return (TIERS[tier] || TIERS.bronze).label;
  }

  function applyAccessProfile(profile) {
    auth.profile = profile || null;

    // Sem aprovacao: toda conta com perfil entra. O nivel define o resto.
    const tier = profile ? (TIERS[profile.tier] ? profile.tier : 'bronze') : null;
    auth.tier = tier;
    auth.status = tier ? 'approved' : 'pending';
    auth.requestedRole = null;
    auth.approvedRole = profile?.approved_role || null;
    auth.role = tier || 'pending';
    auth.isAdmin = tier === 'ouro' || tier === 'platina';
    auth.isPlatina = tier === 'platina';
    auth.isPlayer = !!tier && !auth.isAdmin;
    auth.canRead = !!tier;

    document.body.classList.toggle('is-locked', !auth.canRead);
    document.body.classList.toggle('is-admin', auth.isAdmin);
    document.body.classList.toggle('is-player', auth.isPlayer);
  }

  async function loadAccessProfile() {
    if (!sb || !auth.user) return null;
    const { data, error } = await sb
      .from('access_requests')
      .select('user_id,email,display_name,approved_role,status,tier')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (error) {
      console.warn('[O Arcano] Nao foi possivel carregar access_requests:', error);
      applyAccessProfile(null);
      return null;
    }

    applyAccessProfile(data);
    return data;
  }

  /* ── AUTH GATE, LOGOUT + ROLE BADGE ───────────── */
  function ensureAuthGate() {
    let gate = document.getElementById('authGate');
    if (gate) {
      window.ArcanoAuthExperience?.mount(gate);
      return gate;
    }

    gate = document.createElement('div');
    gate.id = 'authGate';
    gate.className = 'auth-gate';
    gate.dataset.mode = 'login';
    gate.innerHTML = `
      <div class="auth-gate__world" aria-hidden="true">
        <div class="auth-gate__layer auth-gate__base" data-auth-depth="5"></div>
        <div class="auth-gate__layer auth-gate__nebula" data-auth-depth="18"></div>
        <div class="auth-gate__layer auth-gate__starlight" data-auth-depth="34"></div>
        <div class="auth-gate__layer auth-gate__foreground" data-auth-depth="52"></div>
        <canvas class="auth-gate__fog" data-auth-fog></canvas>
        <canvas class="auth-gate__dust" data-auth-dust></canvas>
        <div class="auth-gate__grade"></div>
        <div class="auth-gate__grain"></div>
        <div class="auth-gate__vignette"></div>
      </div>

      <header class="auth-gate__masthead">
        <span class="auth-gate__mark"><img src="assets/images/Logo.webp" width="452" height="402" alt="Logo O Arcano"></span>
        <span class="auth-gate__identity"><strong>O Arcano</strong><span>Codex de campanha</span></span>
      </header>

      <section class="auth-gate__console" aria-labelledby="authGateTitle">
        <span class="arc-trace arc-trace--top" aria-hidden="true"></span>
        <span class="arc-trace arc-trace--bottom" aria-hidden="true"></span>
        <div class="auth-gate__intro">
          <h1 id="authGateTitle" data-auth-title>Abrir o Codex</h1>
          <p data-auth-subtitle>Conhecimento algum é consultado sem deixar vestígios.</p>
        </div>

        <div class="auth-gate__workspace">
          <form class="auth-gate__form auth-gate__form--login" id="authLoginForm" data-auth-panel="login" novalidate>
            <label class="auth-gate__field">
              <span>E-mail do iniciado</span>
              <span class="auth-gate__control"><input type="email" id="authEmail" placeholder="seu@email.com" autocomplete="email" required></span>
            </label>
            <label class="auth-gate__field">
              <span>Chave de acesso</span>
              <span class="auth-gate__control"><input type="password" id="authPassword" placeholder="••••••••" autocomplete="current-password" required></span>
            </label>
            <button type="submit" class="auth-gate__submit" id="authSubmit">
              <span>Entrar no Codex</span><span aria-hidden="true">→</span>
            </button>
            <p class="auth-gate__feedback auth-gate__error" data-auth-error role="alert"></p>
          </form>

          <form class="auth-gate__form auth-gate__form--request" id="authRequestForm" data-auth-panel="request" novalidate hidden>
            <label class="auth-gate__field">
              <span>Nome no arquivo</span>
              <span class="auth-gate__control"><input type="text" id="requestName" placeholder="Como deseja aparecer" autocomplete="name" maxlength="80" required></span>
            </label>
            <label class="auth-gate__field">
              <span>E-mail</span>
              <span class="auth-gate__control"><input type="email" id="requestEmail" placeholder="seu@email.com" autocomplete="email" required></span>
            </label>
            <label class="auth-gate__field">
              <span>Crie sua chave</span>
              <span class="auth-gate__control"><input type="password" id="requestPassword" placeholder="Mínimo de 6 caracteres" autocomplete="new-password" minlength="6" required></span>
            </label>
            <button type="submit" class="auth-gate__submit" id="requestSubmit">
              <span>Criar conta</span><span aria-hidden="true">→</span>
            </button>
            <p class="auth-gate__feedback auth-gate__error" data-auth-error role="alert"></p>
            <p class="auth-gate__feedback auth-gate__message" data-auth-message aria-live="polite"></p>
          </form>

          <div class="auth-gate__meta">
            <button type="button" data-auth-switch="request">Criar uma conta</button>
            <button type="button" data-auth-switch="login" hidden>Voltar ao login</button>
            <span data-auth-note>Mesas de RPG e o Livro do Arcano</span>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(gate);
    window.ArcanoAuthExperience?.mount(gate);

    const panels = gate.querySelectorAll('[data-auth-panel]');
    const switchers = gate.querySelectorAll('[data-auth-switch]');
    const title = gate.querySelector('[data-auth-title]');
    const subtitle = gate.querySelector('[data-auth-subtitle]');
    const note = gate.querySelector('[data-auth-note]');

    function setMode(mode) {
      const requestMode = mode === 'request';
      gate.dataset.mode = requestMode ? 'request' : 'login';
      panels.forEach((panel) => { panel.hidden = panel.dataset.authPanel !== gate.dataset.mode; });
      switchers.forEach((button) => { button.hidden = button.dataset.authSwitch === gate.dataset.mode; });
      title.textContent = requestMode ? 'Criar conta' : 'Abrir o Codex';
      subtitle.textContent = requestMode
        ? 'Crie sua conta e entre na hora. Toda conta começa como Bronze.'
        : 'Conhecimento algum é consultado sem deixar vestígios.';
      note.textContent = requestMode
        ? 'Sem aprovação: sua conta fica pronta assim que for criada'
        : 'Mesas de RPG e o Livro do Arcano';
      gate.querySelectorAll('[data-auth-error], [data-auth-message]').forEach((element) => { element.textContent = ''; });
      const focusTarget = requestMode ? gate.querySelector('#requestName') : gate.querySelector('#authEmail');
      setTimeout(() => focusTarget?.focus(), 80);
    }

    switchers.forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.authSwitch));
    });

    const requestForm = gate.querySelector('#authRequestForm');

    const loginForm = gate.querySelector('#authLoginForm');
    const emailInput = gate.querySelector('#authEmail');
    const passInput = gate.querySelector('#authPassword');
    const loginErr = loginForm.querySelector('[data-auth-error]');
    const submitBtn = gate.querySelector('#authSubmit');

    async function finishLogin(session) {
      setAuthState(session);
      await loadAccessProfile();

      if (!auth.canRead) {
        renderPendingGate(gate);
        render();
        return;
      }

      gate.classList.add('is-gone');
      setTimeout(() => {
        gate.remove();
        syncAmbientMode(parseHash().tab);
      }, 500);
      await Promise.all([loadIndexCustom(), loadUserEntries()]);
      renderRoleBadge();
      render(true);
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginErr.textContent = '';
      const email = emailInput.value.trim();
      const password = passInput.value;
      if (!email || !password) {
        loginErr.textContent = 'Informe e-mail e senha.';
        return;
      }
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Abrindo...';
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await finishLogin(data.session);
      } catch (err) {
        console.error(err);
        loginErr.textContent = 'E-mail ou senha incorretos.';
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Entrar no Codex';
      }
    });

    const requestName = gate.querySelector('#requestName');
    const requestEmail = gate.querySelector('#requestEmail');
    const requestPassword = gate.querySelector('#requestPassword');
    const requestErr = requestForm.querySelector('[data-auth-error]');
    const requestMsg = requestForm.querySelector('[data-auth-message]');
    const requestBtn = gate.querySelector('#requestSubmit');

    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      requestErr.textContent = '';
      requestMsg.textContent = '';
      const displayName = requestName.value.trim();
      const email = requestEmail.value.trim();
      const password = requestPassword.value;

      if (!displayName || !email || password.length < 6) {
        requestErr.textContent = 'Preencha nome, e-mail e uma chave com pelo menos 6 caracteres.';
        return;
      }

      requestBtn.disabled = true;
      requestBtn.querySelector('span').textContent = 'Enviando...';
      try {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName
            }
          }
        });
        if (error) throw error;

        requestMsg.textContent = 'Conta criada. Se pedirmos, confirme seu e-mail e depois entre pelo login.';
        requestForm.reset();

        if (data.session) await finishLogin(data.session);
      } catch (err) {
        console.error(err);
        requestErr.textContent = err.message?.includes('already registered')
          ? 'Esse e-mail já existe. Volte ao login para entrar.'
          : 'Não foi possível criar a conta agora.';
      } finally {
        requestBtn.disabled = false;
        requestBtn.querySelector('span').textContent = 'Criar conta';
      }
    });

    if (auth.user && !auth.canRead) renderPendingGate(gate);
    return gate;
  }

  function renderPendingGate(gate) {
    const card = gate.querySelector('.auth-gate__console');
    const title = 'Conta em preparo';
    const text = 'Sua conta existe, mas o perfil ainda não carregou. Saia e entre de novo em alguns instantes.';
    const statusLabel = 'preparando';

    gate.dataset.mode = 'pending';
    card.innerHTML = `
      <span class="arc-trace arc-trace--top" aria-hidden="true"></span>
      <span class="arc-trace arc-trace--bottom" aria-hidden="true"></span>
      <div class="auth-gate__intro">
        <h1>${escapeHtml(title)}</h1>
        <p>O arquivo reconheceu sua presença.</p>
      </div>
      <div class="auth-pending">
        <span class="auth-pending__status">${escapeHtml(statusLabel)}</span>
        <div>
          <h2>Quase lá</h2>
          <p>${escapeHtml(text)}</p>
        </div>
        <button type="button" class="auth-gate__submit" data-pending-logout>Sair</button>
      </div>
    `;

    card.querySelector('[data-pending-logout]').addEventListener('click', async () => {
      if (sb) await sb.auth.signOut();
      location.reload();
    });
  }

  function renderRoleBadge() {
    const right = document.querySelector('.topbar__right');
    if (!right) return;
    let pill = right.querySelector('.role-pill');
    let logout = right.querySelector('[data-logout]');
    if (!auth.canRead) {
      pill && pill.remove();
      logout && logout.remove();
      return;
    }
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'role-pill';
      right.insertBefore(pill, right.firstChild);
    }
    pill.dataset.role = auth.tier;
    pill.title = (TIERS[auth.tier] || TIERS.bronze).tone;
    pill.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/></svg><strong>${escapeHtml(tierLabel(auth.tier).toUpperCase())}</strong>`;

    if (!logout) {
      logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'btn-icon';
      logout.dataset.logout = '1';
      logout.title = 'Sair';
      logout.setAttribute('aria-label', 'Sair');
      logout.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/></svg>';
      logout.addEventListener('click', async () => {
        if (!(await askConfirm('Sair da sessão?', { confirmLabel: 'Sair' }))) return;
        if (sb) await sb.auth.signOut();
        location.reload();
      });
      right.appendChild(logout);
    }
  }

  /* ── ICONS (inline SVG, lucide-style) ─────────── */
  const ICONS = {
    Painel:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/><circle cx="12" cy="10" r="2.5"/><path d="M8 16c.8-1.8 2.3-2.7 4-2.7s3.2.9 4 2.7"/></svg>',
    Mesas:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="10" rx="9" ry="4"/><path d="M3 10v2c0 2.2 4 4 9 4s9-1.8 9-4v-2"/><path d="M7 15.5V20M17 15.5V20"/></svg>',
    Arcano:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M12 7l1.5 3 3 .5-2.2 2 .6 3-2.9-1.5L9.1 15.5l.6-3-2.2-2 3-.5z"/></svg>',
    Index:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-8 9 8M5 10v10h4v-6h6v6h4V10"/></svg>',
    Itens:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6-9 9-3 1 1-3 9-9zM5 20l3-1"/></svg>',
    Magias:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.8 5.6L20 9.4l-4.8 3.6L17 19l-5-3.5L7 19l1.8-6L4 9.4l6.2-1.8L12 2z"/></svg>',
    Bestiario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11c0-3 2-5 5-5s5 2 5 5v3l3 3v3h-4l-2-2-2 2H5l-2-2v-3l2-3z"/><circle cx="9" cy="11" r=".7" fill="currentColor"/><circle cx="13" cy="11" r=".7" fill="currentColor"/></svg>',
    Paises:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4l7-1 7 2v11l-7-2-7 1z"/><line x1="5" y1="21" x2="5" y2="3"/></svg>',
    Cenarios:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l4-3 4 3v3h6l4 3v6"/><path d="M3 21h18M9 21v-6h2v6M15 21v-3h2v3"/></svg>',
    Biomas:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="M7 14c-2.8 0-5-2.2-5-5 3.8-.2 6.3 1.5 7 5"/><path d="M17 11c2.8 0 5-2.2 5-5-3.8-.2-6.3 1.5-7 5"/><path d="M6 21h12"/></svg>',
    Eras:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    Sistemas:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    Persona:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>',
    Campanhas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M8 8h8M8 12h8M8 16h5"/><path d="M16 3v4h4"/></svg>',
    Historias: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3.5 4.5-3.5S22 18 22 20"/></svg>',
    Racas:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="12" cy="17" r="3"/><path d="M7 10v3M17 10v3M9 15l1.5-1M15 15l-1.5-1"/></svg>',
    Culturas:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7c2.2-2.7 5-4 8-4s5.8 1.3 8 4v8c-2.2 3.4-5 5-8 6-3-1-5.8-2.6-8-6z"/><path d="M8 9h.01M16 9h.01M8 15c2.7 1.5 5.3 1.5 8 0"/><path d="M12 6v7"/></svg>',
    Faccoes:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v5c0 4.5-3.2 7.7-8 9-4.8-1.3-8-4.5-8-9V7z"/><path d="M8 12h8M12 8v8"/></svg>',
    Mapa:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/></svg>',
    Deuses:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 9.5l-5 4.3 1.4 6.7L12 17l-5.4 3.5L8 13.8l-5-4.3 6.6-.9L12 2z"/></svg>',
  };

  /* ── CATEGORY THEMES ─────────────────────────── */
  const THEMES = {
    Mesas:     { hue: 28,  label: 'MESAS' },
    Painel:    { hue: 200, label: 'PLATINA' },
    Arcano:    { hue: 268, label: 'SISTEMA ARCANO' },
    Index:     { hue: 268, label: 'INÍCIO' },
    Itens:     { hue: 38,  label: 'ARTEFATOS' },
    Magias:    { hue: 285, label: 'PODER' },
    Bestiario: { hue: 0,   label: 'AMEAÇAS' },
    Paises:    { hue: 220, label: 'TERRITÓRIO' },
    Cenarios:  { hue: 200, label: 'LUGARES' },
    Biomas:    { hue: 150, label: 'NATUREZA' },
    Eras:      { hue: 45,  label: 'TEMPO' },
    Sistemas:  { hue: 160, label: 'REGRAS' },
    Persona:   { hue: 320, label: 'PESSOAS' },
    Campanhas: { hue: 18,  label: 'CAMPANHAS' },
    Historias: { hue: 250, label: 'HISTÓRIAS' },
    Racas:     { hue: 130, label: 'POVOS' },
    Culturas:  { hue: 328, label: 'IDENTIDADE' },
    Faccoes:   { hue: 12,  label: 'FACÇÕES' },
    Mapa:      { hue: 195, label: 'MUNDO' },
    Deuses:    { hue: 50,  label: 'DIVINO' },
  };

  const NAV_GROUPS = [
    {
      id: 'mundo',
      title: 'Mundo',
      tone: 'Territórios, paisagens e lugares',
      tabs: ['Mapa', 'Paises', 'Cenarios', 'Biomas']
    },
    {
      id: 'sociedades',
      title: 'Sociedades',
      tone: 'Povos, culturas, poderes e crenças',
      tabs: ['Racas', 'Culturas', 'Faccoes', 'Deuses']
    },
    {
      id: 'arcano',
      title: 'Regras & Arcano',
      tone: 'Poder, artefatos e ameaças',
      tabs: ['Sistemas', 'Magias', 'Itens', 'Bestiario']
    },
    {
      id: 'historias',
      title: 'Histórias',
      tone: 'Campanhas, pessoas e memória',
      tabs: ['Campanhas', 'Eras', 'Historias']
    }
  ];

  /* ── DOM REFS ─────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const view = $('view');
  const sidenav = $('sidenav');
  const sidebarCount = $('sidebarCount');
  const menuBtn = $('menuBtn');
  const appShell = $('appShell');
  const globalSearch = $('globalSearch');
  const searchResults = $('searchResults');
  const intro = $('intro');

  /* ── HELPERS ──────────────────────────────────── */
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ── Avisos e confirmações (no lugar de alert/confirm) ── */
  function toast(message, type) {
    const kind = type || (/^(erro|não foi possível|nao foi possivel)/i.test(String(message)) ? 'error' : 'info');
    let region = document.getElementById('toastRegion');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toastRegion';
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `toast toast--${kind}`;
    item.textContent = String(message);
    item.title = 'Fechar';
    const close = () => {
      if (!item.isConnected) return;
      item.classList.add('is-leaving');
      setTimeout(() => item.remove(), 200);
    };
    item.addEventListener('click', close);
    region.appendChild(item);
    while (region.children.length > 4) region.firstElementChild.remove();
    setTimeout(close, kind === 'error' ? 8000 : 4500);
  }

  function askConfirm(message, options = {}) {
    const { confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, title = '' } = options;
    return new Promise((resolve) => {
      const previous = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'dlg';
      overlay.innerHTML = `
        <div class="dlg__box ${danger ? 'is-danger' : ''}" role="alertdialog" aria-modal="true" aria-labelledby="dlgMsg">
          ${title ? `<h2 class="dlg__title">${escapeHtml(title)}</h2>` : ''}
          <p class="dlg__msg" id="dlgMsg">${escapeHtml(message)}</p>
          <div class="dlg__actions">
            <button type="button" class="btn btn-ghost" data-dlg="no">${escapeHtml(cancelLabel)}</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-dlg="yes">${escapeHtml(confirmLabel)}</button>
          </div>
        </div>`;
      const finish = (value) => {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        if (previous && previous.focus) previous.focus();
        resolve(value);
      };
      const onKey = (event) => {
        if (event.key === 'Escape') { event.preventDefault(); finish(false); }
        if (event.key === 'Tab') {
          const buttons = [...overlay.querySelectorAll('button')];
          const index = buttons.indexOf(document.activeElement);
          event.preventDefault();
          buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
        }
      };
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) finish(false);
        const button = event.target.closest('[data-dlg]');
        if (button) finish(button.dataset.dlg === 'yes');
      });
      document.addEventListener('keydown', onKey, true);
      document.body.appendChild(overlay);
      overlay.querySelector('[data-dlg="no"]').focus();
    });
  }

  const normalize = (s) => String(s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  const hintIconSvg = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 17v-5"/><path d="M12 8h.01"/></svg>';

  function uiHint(text, label = 'Dica') {
    const safe = escapeHtml(text || '');
    if (!safe) return '';
    return `<span class="ui-hint" tabindex="0" role="img" aria-label="${escapeHtml(label)}: ${safe}" title="${safe}">
      ${hintIconSvg}
      <span class="ui-hint__bubble" role="tooltip">${safe}</span>
    </span>`;
  }

  function hintedLabel(label, hint) {
    return `<span class="field-label-inline"><span>${escapeHtml(label)}</span>${uiHint(hint)}</span>`;
  }

  function itemHintFor(field) {
    const key = Object.keys(ITEM_FIELD_HINTS).find((k) => normalize(k) === normalize(field));
    return key ? ITEM_FIELD_HINTS[key] : '';
  }

  function itemSubtypeGuide(subtype) {
    return ITEM_SUBTYPE_GUIDES[subtype] || ITEM_SUBTYPE_GUIDES.item;
  }

  function fieldSearchValues(value) {
    if (value == null) return [];
    if (Array.isArray(value)) return value.flatMap(fieldSearchValues);
    if (typeof value === 'object') return Object.values(value).flatMap(fieldSearchValues);
    return [String(value)];
  }

  function normalizeItemExtraFields(raw) {
    let source = raw;
    if (typeof raw === 'string') {
      try {
        source = JSON.parse(raw);
      } catch {
        source = raw.split(/\n+/).map((line) => {
          const parts = line.split(':');
          return parts.length > 1
            ? { key: parts.shift(), value: parts.join(':') }
            : null;
        }).filter(Boolean);
      }
    }
    if (!Array.isArray(source)) return [];
    return source
      .map((field) => {
        if (typeof field === 'string') {
          const parts = field.split(':');
          const key = (parts.shift() || '').trim();
          const value = parts.join(':').trim();
          return key && value ? { key, value } : null;
        }
        if (!field || typeof field !== 'object') return null;
        const key = String(field.key || field.name || field.label || '').trim();
        const value = String(field.value ?? field.valor ?? field.text ?? '').trim();
        return key && value ? { key, value } : null;
      })
      .filter(Boolean);
  }

  function itemExtraFieldOption(key) {
    const wanted = normalize(key);
    return ITEM_EXTRA_FIELD_OPTIONS.find((opt) => normalize(opt.key) === wanted) || null;
  }

  function itemExtraFieldPlaceholder(key) {
    const found = itemExtraFieldOption(key);
    return found ? found.placeholder : 'Descreva o valor do campo';
  }

  function itemExtraFieldsForForm(fields) {
    const data = fields || {};
    const extras = normalizeItemExtraFields(data.Campos);
    const seen = new Set(extras.map((field) => normalize(field.key)));
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'Campos' || ITEM_BASE_FIELD_KEYS.has(key)) return;
      if (Array.isArray(value) || (value && typeof value === 'object')) return;
      const text = String(value ?? '').trim();
      if (!text || seen.has(normalize(key))) return;
      extras.push({ key, value: text });
      seen.add(normalize(key));
    });
    return extras;
  }

  function itemBaseFieldEntries(fields) {
    return Object.entries(fields || {}).filter(([key, value]) => {
      if (key === 'Campos') return false;
      if (Array.isArray(value) || (value && typeof value === 'object')) return false;
      return String(value ?? '').trim() !== '';
    });
  }

  function itemFieldValue(fields, key) {
    const data = fields || {};
    if (data[key] != null && data[key] !== '') return data[key];
    const found = normalizeItemExtraFields(data.Campos).find((field) => normalize(field.key) === normalize(key));
    return found ? found.value : '';
  }

  const tabById = (id) => ARCHIVE.tabs.find((t) => t.id === canonicalTabId(id));
  const entriesIn = (tabId) => ARCHIVE.entries.filter((e) => canonicalTabId(e.tab) === canonicalTabId(tabId));
  const entryById = (id) => ARCHIVE.entries.find((e) => e.id === id);
  /* Persona conta fichas; as demais abas contam entries. */
  const tabCount = (id) => {
    const tabId = canonicalTabId(id);
    if (tabId === 'Persona') {
      return auth.user ? CHARACTERS.filter((c) => auth.isPlatina || c.userId === auth.user.id).length : 0;
    }
    return entriesIn(id).length;
  };

  const themeOf = (id) => THEMES[canonicalTabId(id)] || { hue: 268, label: 'CODEX' };
  const iconOf = (id) => ICONS[canonicalTabId(id)] || ICONS.Index;
  const TAG_COLOR_RE = /^#[0-9a-f]{6}$/i;
  const DEFAULT_TAG_COLOR = '#f59e0b';
  const categoryState = {};

  function slugify(str) {
    return normalize(str).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'historia';
  }

  function safeTagColor(color) {
    const value = String(color || '').trim();
    return TAG_COLOR_RE.test(value) ? value : DEFAULT_TAG_COLOR;
  }

  function cleanTagLabel(label) {
    return String(label || '').replace(/\s+/g, ' ').trim().slice(0, 32);
  }

  function sanitizeTags(tags) {
    const source = typeof tags === 'string'
      ? (() => { try { return JSON.parse(tags); } catch { return []; } })()
      : tags;
    if (!Array.isArray(source)) return [];

    const seen = new Set();
    const clean = [];
    for (const tag of source) {
      const label = cleanTagLabel(typeof tag === 'string' ? tag : tag?.label);
      if (!label) continue;
      const key = normalize(label);
      if (seen.has(key)) continue;
      seen.add(key);
      clean.push({ label, color: safeTagColor(tag?.color) });
      if (clean.length >= 8) break;
    }
    return clean;
  }

  function tagKey(label) {
    return normalize(label);
  }

  function tagChipHTML(tag, className = 'story-tag', attrs = '') {
    const color = safeTagColor(tag.color);
    return `<span class="${className}" style="--tag:${color}" ${attrs}>${escapeHtml(tag.label)}</span>`;
  }

  function categoryTagStats(entries) {
    const map = new Map();
    entries.forEach((entry) => {
      sanitizeTags(entry.tags).forEach((tag) => {
        const key = tagKey(tag.label);
        const current = map.get(key) || { ...tag, count: 0, key };
        current.count += 1;
        map.set(key, current);
      });
    });
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }

  function uniqueId(base) {
    let id = base;
    let n = 2;
    while (ARCHIVE.entries.some((e) => e.id === id)) {
      id = `${base}-${n++}`;
    }
    return id;
  }

  /* ── PERSISTENCE (Supabase) ───────────────────── */
  const ENTRY_META_COLUMNS = 'id,tab,title,summary,image,image_path,tags,subtype,created_at';
  const tabFieldsLoaded = new Set();
  let searchCorpusPromise = null;

  function rowToEntry(row) {
    const hasBody = Object.prototype.hasOwnProperty.call(row, 'body_html');
    const hasFields = Object.prototype.hasOwnProperty.call(row, 'fields');
    return {
      id: row.id,
      tab: canonicalTabId(row.tab),
      title: row.title,
      summary: row.summary || '',
      image: row.image || '',
      imagePath: row.image_path || '',
      bodyHtml: row.body_html || '',
      tags: sanitizeTags(row.tags || []),
      subtype: row.subtype || '',
      fields: (row.fields && typeof row.fields === 'object') ? row.fields : {},
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      isUserCreated: true,
      detailLoaded: hasBody && hasFields,
      fieldsLoaded: hasFields
    };
  }

  async function loadUserEntries() {
    if (!sb) return;
    const { data, error } = await sb
      .from('stories')
      .select(ENTRY_META_COLUMNS)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao carregar histórias:', error);
      return;
    }
    (data || []).forEach((row) => {
      if (!entryById(row.id)) ARCHIVE.entries.push(rowToEntry(row));
    });
  }

  async function loadEntryDetails(entry) {
    if (!sb || !entry?.isUserCreated || entry.detailLoaded) return;
    const { data, error } = await sb
      .from('stories')
      .select('id,body_html,fields')
      .eq('id', entry.id)
      .maybeSingle();
    if (error) {
      console.error('Erro ao carregar detalhes da história:', error);
      return;
    }
    if (!data) return;
    entry.bodyHtml = data.body_html || '';
    entry.fields = (data.fields && typeof data.fields === 'object') ? data.fields : {};
    entry.fieldsLoaded = true;
    entry.detailLoaded = true;
  }

  async function loadTabFields(tabId) {
    const canonical = canonicalTabId(tabId);
    if (!sb || tabFieldsLoaded.has(canonical)) return;
    const { data, error } = await sb
      .from('stories')
      .select('id,fields')
      .eq('tab', canonical);
    if (error) {
      console.error(`Erro ao carregar campos de ${canonical}:`, error);
      return;
    }
    (data || []).forEach((row) => {
      const entry = entryById(row.id);
      if (!entry) return;
      entry.fields = (row.fields && typeof row.fields === 'object') ? row.fields : {};
      entry.fieldsLoaded = true;
    });
    tabFieldsLoaded.add(canonical);
  }

  async function loadSearchCorpus() {
    if (!sb) return;
    if (searchCorpusPromise) return searchCorpusPromise;
    searchCorpusPromise = (async () => {
      const { data, error } = await sb.from('stories').select('id,body_html,fields');
      if (error) throw error;
      (data || []).forEach((row) => {
        const entry = entryById(row.id);
        if (!entry) return;
        entry.bodyHtml = row.body_html || '';
        entry.fields = (row.fields && typeof row.fields === 'object') ? row.fields : {};
        entry.fieldsLoaded = true;
        entry.detailLoaded = true;
      });
    })().catch((error) => {
      searchCorpusPromise = null;
      console.error('Erro ao carregar índice de busca:', error);
    });
    return searchCorpusPromise;
  }

  async function optimizeImageForUpload(file) {
    if (!file || !/^image\/(png|jpe?g|webp)$/i.test(file.type) || typeof createImageBitmap !== 'function') {
      return file;
    }

    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const maxDimension = 1920;
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      if (scale === 1 && file.type === 'image/webp' && file.size <= 900 * 1024) return file;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) return file;
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
      if (!blob || (scale === 1 && blob.size >= file.size)) return file;
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'imagem';
      return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: file.lastModified });
    } catch (error) {
      console.warn('[O Arcano] Não foi possível otimizar a imagem; enviando o arquivo original.', error);
      return file;
    } finally {
      bitmap?.close?.();
    }
  }

  async function uploadBanner(file, prefix) {
    if (!sb || !file) return { url: '', path: '' };
    const uploadFile = await optimizeImageForUpload(file);
    const ext = (uploadFile.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${prefix}-${Date.now()}.${ext || 'png'}`;
    const { error } = await sb.storage.from(BANNERS_BUCKET).upload(path, uploadFile, {
      contentType: uploadFile.type || 'image/png',
      cacheControl: '31536000'
    });
    if (error) throw error;
    const { data } = sb.storage.from(BANNERS_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async function removeBanner(path) {
    if (!sb || !path) return;
    try {
      await sb.storage.from(BANNERS_BUCKET).remove([path]);
    } catch (err) {
      console.warn('Falha ao remover imagem do storage:', err);
    }
  }

  async function prepareInlineImages(editor, entryId, root = 'stories') {
    const uploadedPaths = [];
    if (!editor) return { html: '', uploadedPaths };
    const images = [...editor.querySelectorAll('img.rt-inline-image')].filter((image) => INLINE_DATA_IMAGE_RE.test(image.src));
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      const response = await fetch(image.src);
      const blob = await response.blob();
      const extension = blob.type.includes('png') ? 'png' : (blob.type.includes('webp') ? 'webp' : 'jpg');
      const file = new File([blob], `inline-${index + 1}.${extension}`, { type: blob.type || 'image/jpeg' });
      const upload = await uploadBanner(file, `${root}/${entryId}/inline`);
      image.src = upload.url;
      image.loading = 'lazy';
      image.decoding = 'async';
      uploadedPaths.push(upload.path);
    }
    return { html: sanitizeHtml(editor.innerHTML).trim(), uploadedPaths };
  }

  async function persistUserEntry(entry) {
    if (!sb) throw new Error('Supabase não configurado');
    const payload = {
      id: entry.id,
      tab: entry.tab,
      title: entry.title,
      summary: entry.summary || '',
      image: entry.image || '',
      image_path: entry.imagePath || '',
      body_html: entry.bodyHtml || '',
      tags: sanitizeTags(entry.tags),
      subtype: entry.subtype || null,
      fields: entry.fields || {}
    };
    const { error } = await sb.from('stories').insert(payload);
    if (error) {
      const msg = error.message || '';
      if (error.code === 'PGRST204' || /tags.*schema cache|schema cache.*tags/i.test(msg)) {
        throw new Error('A coluna tags ainda não foi ativada no Supabase. Rode o arquivo supabase-tags.sql no SQL Editor e tente novamente.');
      }
      if (/subtype|fields/i.test(msg) && /column|schema cache/i.test(msg)) {
        throw new Error('As colunas subtype/fields ainda não foram criadas. Rode o arquivo supabase-itens.sql no SQL Editor e tente novamente.');
      }
      throw error;
    }
  }

  async function updateUserEntry(entry) {
    if (!sb) throw new Error('Supabase não configurado');
    const payload = {
      tab: entry.tab,
      title: entry.title,
      summary: entry.summary || '',
      image: entry.image || '',
      image_path: entry.imagePath || '',
      body_html: entry.bodyHtml || '',
      tags: sanitizeTags(entry.tags),
      subtype: entry.subtype || null,
      fields: entry.fields || {}
    };
    const { error } = await sb.from('stories').update(payload).eq('id', entry.id);
    if (error) {
      const msg = error.message || '';
      if (error.code === 'PGRST204' || /tags.*schema cache|schema cache.*tags/i.test(msg)) {
        throw new Error('A coluna tags ainda não foi ativada no Supabase. Rode o arquivo supabase-tags.sql no SQL Editor e tente novamente.');
      }
      if (/subtype|fields/i.test(msg) && /column|schema cache/i.test(msg)) {
        throw new Error('As colunas subtype/fields ainda não foram criadas. Rode o arquivo supabase-itens.sql no SQL Editor e tente novamente.');
      }
      throw error;
    }
  }

  async function deleteUserEntry(entry) {
    if (!sb) throw new Error('Supabase não configurado');
    const { error } = await sb.from('stories').delete().eq('id', entry.id);
    if (error) throw error;
    if (entry.imagePath) await removeBanner(entry.imagePath);
  }

  /* ── FICHAS DE PERSONAGEM (CRUD) ──────────────── */
  let CHARACTERS = [];
  let charactersLoaded = false;
  let charactersLoadPromise = null;
  const characterById = (id) => CHARACTERS.find((c) => c.id === id);

  /* O registro do Despertar fica guardado na coluna jsonb `magic`. */
  function defaultAwakening() {
    return {
      resolved: false, mageRoll: 0, attempts: 0,
      accepted: false, renounced: false,
      school: '', schoolRoll: 0, bonusAttr: ''
    };
  }
  function normalizeAwakening(obj) {
    const d = defaultAwakening();
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return d;
    return { ...d, ...obj };
  }

  function rowToCharacter(row) {
    const safeObj = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
    const safeArr = (v) => Array.isArray(v) ? v : [];
    const magic = normalizeAwakening(row.magic);
    const identity = safeObj(row.identity);
    const sheetBackup = safeObj(identity.__sheetState);
    const directVitals = safeObj(row.vitals);
    const directStatuses = safeArr(row.statuses);
    const directInventory = safeArr(row.inventory);
    const directSpells = safeArr(row.spells);
    const preferBackup = sheetBackup.storage === 'fallback';
    const backedObj = (direct, key) => (preferBackup || !Object.keys(direct).length) && Object.keys(safeObj(sheetBackup[key])).length
      ? safeObj(sheetBackup[key])
      : direct;
    const backedArr = (direct, key) => (preferBackup || !direct.length) && Array.isArray(sheetBackup[key])
      ? sheetBackup[key]
      : direct;
    // Fichas antigas (sistema com toggle): sintetiza um despertar resolvido.
    if (!magic.resolved && (row.is_mage || (row.magic && Object.keys(safeObj(row.magic)).length))) {
      magic.resolved = true;
      magic.accepted = !!row.is_mage;
    }
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name || '',
      raceId: row.race_id || '',
      raceName: row.race_name || '',
      isMage: !!row.is_mage,
      attributes: safeObj(row.attributes),
      pointPool: row.point_pool || 0,
      skills: safeArr(row.skills),
      magic,
      hp: safeObj(row.hp),
      mana: row.mana || '',
      identity,
      // Estado vivo da ficha (supabase-characters-sheet.sql)
      vitals: backedObj(directVitals, 'vitals'),
      statuses: backedArr(directStatuses, 'statuses'),
      inventory: backedArr(directInventory, 'inventory'),
      spells: backedArr(directSpells, 'spells'),
      image: row.image || '',
      imagePath: row.image_path || '',
      mesaId: row.mesa_id || '',
      isNpc: !!row.is_npc,
      npcVisible: !!row.npc_visible,
      levelGrant: safeObj(row.level_grant),
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    };
  }

  function identityWithSheetState(c, storage = 'columns') {
    return {
      ...(c.identity || {}),
      __sheetState: {
        version: 1,
        storage,
        vitals: c.vitals || {},
        statuses: Array.isArray(c.statuses) ? c.statuses : [],
        inventory: Array.isArray(c.inventory) ? c.inventory : [],
        spells: Array.isArray(c.spells) ? c.spells : []
      }
    };
  }

  function characterToRow(c) {
    return {
      // Preserva o dono original (o Mestre pode editar fichas de outros).
      user_id: c.userId || (auth.user ? auth.user.id : null),
      name: c.name,
      race_id: c.raceId || null,
      race_name: c.raceName || '',
      is_mage: !!c.isMage,
      attributes: c.attributes || {},
      point_pool: c.pointPool || 0,
      skills: Array.isArray(c.skills) ? c.skills : [],
      magic: c.magic || {},
      hp: c.hp || {},
      mana: c.mana || '',
      identity: identityWithSheetState(c),
      vitals: c.vitals || {},
      statuses: Array.isArray(c.statuses) ? c.statuses : [],
      inventory: Array.isArray(c.inventory) ? c.inventory : [],
      spells: Array.isArray(c.spells) ? c.spells : [],
      image: c.image || '',
      image_path: c.imagePath || '',
      // So envia a coluna quando ha mesa (funciona antes do supabase-mesas.sql).
      ...(c.mesaId ? { mesa_id: c.mesaId } : {}),
      ...(c.isNpc ? { is_npc: true, npc_visible: !!c.npcVisible } : {})
    };
  }

  /* Colunas da ficha interativa — podem nao existir se o SQL nao foi rodado. */
  const SHEET_COLS = ['vitals', 'statuses', 'inventory', 'spells'];
  function isMissingSheetCol(error) {
    const msg = (error && error.message) || '';
    return new RegExp(SHEET_COLS.join('|'), 'i').test(msg) && /column|schema cache/i.test(msg);
  }

  function characterTableMissing(error) {
    const msg = (error && error.message) || '';
    return /relation .*characters.* does not exist/i.test(msg) ||
           /could not find the table 'public\.characters'/i.test(msg) ||
           (error && error.code === '42P01');
  }
  const CHAR_TABLE_HINT = 'A tabela characters ainda não foi criada. Rode o arquivo supabase-characters.sql no SQL Editor do Supabase.';

  async function loadCharacters() {
    if (!sb || !auth.user || charactersLoaded) return;
    if (charactersLoadPromise) return charactersLoadPromise;
    charactersLoadPromise = (async () => {
      const { data, error } = await sb
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (characterTableMissing(error)) console.warn('[O Arcano] ' + CHAR_TABLE_HINT);
        else console.error('Erro ao carregar fichas:', error);
        return;
      }
      CHARACTERS = (data || []).map(rowToCharacter);
      charactersLoaded = true;
    })().finally(() => { charactersLoadPromise = null; });
    return charactersLoadPromise;
  }

  async function persistCharacter(c) {
    if (!sb) throw new Error('Supabase não configurado');
    const row = characterToRow(c);
    let { data, error } = await sb.from('characters').insert(row).select().single();
    if (error && isMissingSheetCol(error)) {
      // Migração da ficha interativa ainda não rodou: salva sem essas colunas.
      SHEET_COLS.forEach((k) => delete row[k]);
      row.identity = identityWithSheetState(c, 'fallback');
      ({ data, error } = await sb.from('characters').insert(row).select().single());
    }
    if (error) {
      if (characterTableMissing(error)) throw new Error(CHAR_TABLE_HINT);
      throw error;
    }
    return rowToCharacter(data);
  }

  async function updateCharacter(c) {
    if (!sb) throw new Error('Supabase não configurado');
    const row = { ...characterToRow(c), updated_at: new Date().toISOString() };
    let { data, error } = await sb.from('characters').update(row).eq('id', c.id).select().single();
    if (error && isMissingSheetCol(error)) {
      SHEET_COLS.forEach((k) => delete row[k]);
      row.identity = identityWithSheetState(c, 'fallback');
      ({ data, error } = await sb.from('characters').update(row).eq('id', c.id).select().single());
    }
    if (error) {
      if (characterTableMissing(error)) throw new Error(CHAR_TABLE_HINT);
      throw error;
    }
    return rowToCharacter(data);
  }

  /* Salva só o estado vivo da ficha (HP, status, inventário, magias). */
  async function persistCharacterState(c) {
    if (!sb) throw new Error('Supabase não configurado');
    const payload = {
      vitals: c.vitals || {},
      statuses: Array.isArray(c.statuses) ? c.statuses : [],
      inventory: Array.isArray(c.inventory) ? c.inventory : [],
      spells: Array.isArray(c.spells) ? c.spells : [],
      identity: identityWithSheetState(c),
      updated_at: new Date().toISOString()
    };
    let { error } = await sb.from('characters').update(payload).eq('id', c.id);
    if (error && isMissingSheetCol(error)) {
      const fallbackPayload = {
        identity: identityWithSheetState(c, 'fallback'),
        updated_at: payload.updated_at
      };
      ({ error } = await sb.from('characters').update(fallbackPayload).eq('id', c.id));
    }
    if (error) {
      throw error;
    }
  }

  async function deleteCharacter(c) {
    if (!sb) throw new Error('Supabase não configurado');
    const { error } = await sb.from('characters').delete().eq('id', c.id);
    if (error) throw error;
    if (c.imagePath) await removeBanner(c.imagePath);
  }

  /* ── Estado vivo: helpers ─────────────────────── */
  function parseHpMax(v) {
    const n = parseInt(String(v).split('/')[0], 10);
    return Number.isFinite(n) ? n : 0;
  }
  function hpPartKeys(hp) {
    const data = hp && typeof hp === 'object' && !Array.isArray(hp) ? hp : {};
    const keys = Object.keys(data).filter((key) => data[key] != null && data[key] !== '');
    return [
      ...RACE_HP_PARTS.filter((part) => keys.includes(part)),
      ...keys.filter((part) => !RACE_HP_PARTS.includes(part))
    ];
  }
  /* Garante c.vitals.hp/mana a partir do HP/Mana da criação (sem persistir). */
  function ensureVitals(c) {
    c.vitals = (c.vitals && typeof c.vitals === 'object' && !Array.isArray(c.vitals)) ? c.vitals : {};
    if (!c.vitals.hp || typeof c.vitals.hp !== 'object') {
      c.vitals.hp = {};
      hpPartKeys(c.hp).forEach((p) => {
        if (c.hp && c.hp[p] != null && c.hp[p] !== '') {
          const max = parseHpMax(c.hp[p]);
          if (max > 0) c.vitals.hp[p] = { cur: max, max };
        }
      });
    }
    if (!c.vitals.mana) {
      const parts = String(c.mana || '').split('/').map((s) => parseInt(s, 10));
      const max = Number.isFinite(parts[1]) ? parts[1] : (Number.isFinite(parts[0]) ? parts[0] : 0);
      const cur = Number.isFinite(parts[0]) ? parts[0] : max;
      if (max > 0) c.vitals.mana = { cur, max };
    }
    return c.vitals;
  }
  /* Recalcula maxes do HP a partir do formulário, preservando o atual (clampado). */
  function mergeVitals(prev, hpFields, manaStr) {
    const out = {
      ...((prev && typeof prev === 'object' && !Array.isArray(prev)) ? prev : {}),
      hp: {},
      mana: null
    };
    const prevHp = (prev && prev.hp) || {};
    hpPartKeys(hpFields).forEach((p) => {
      if (hpFields[p] != null && hpFields[p] !== '') {
        const max = parseHpMax(hpFields[p]);
        if (max > 0) {
          const prevCur = prevHp[p] && Number.isFinite(prevHp[p].cur) ? prevHp[p].cur : max;
          out.hp[p] = { cur: Math.min(prevCur, max), max };
        }
      }
    });
    const parts = String(manaStr || '').split('/').map((s) => parseInt(s, 10));
    const mmax = Number.isFinite(parts[1]) ? parts[1] : (Number.isFinite(parts[0]) ? parts[0] : 0);
    if (mmax > 0) {
      const prevCur = prev && prev.mana && Number.isFinite(prev.mana.cur) ? prev.mana.cur : mmax;
      out.mana = { cur: Math.min(prevCur, mmax), max: mmax };
    }
    return out;
  }

  function syncArcaneCollapse(c) {
    if (!c) return false;
    c.statuses = Array.isArray(c.statuses) ? c.statuses : [];
    const isMage = awkIsAcceptedMage(normalizeAwakening(c.magic));
    const mana = c.vitals && c.vitals.mana;
    const idx = c.statuses.findIndex((s) => s && (s.source === 'auto-mana-collapse' || normalize(s.name) === 'colapso arcano'));
    if (isMage && mana && Number(mana.cur) <= 0) {
      if (idx < 0) {
        c.statuses.push({
          name: 'Colapso Arcano',
          source: 'auto-mana-collapse',
          note: 'Mana chegou a 0: inconsciente, incapaz de agir, lutar, conjurar ou mover-se sozinho.'
        });
        return true;
      }
    } else if (idx >= 0 && c.statuses[idx].source === 'auto-mana-collapse') {
      c.statuses.splice(idx, 1);
      return true;
    }
    return false;
  }

  async function loadIndexCustom() {
    if (!sb) return;
    const { data, error } = await sb
      .from('index_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      console.error('Erro ao carregar apresentação:', error);
      return;
    }
    if (!data) return;
    if (data.title) ARCHIVE.index.title = data.title;
    if (data.subtitle) ARCHIVE.index.subtitle = data.subtitle;
    if (data.image) ARCHIVE.index.image = data.image;
    if (data.image_path) ARCHIVE.index.imagePath = data.image_path;
    if (data.manifesto_html) ARCHIVE.index.manifestoHtml = data.manifesto_html;
  }

  /* ── PALETA DE CORES PERSONALIZADA DO MESTRE ──── */
  const masterPalette = { loaded: false, colors: [] };
  const MAX_PALETTE = 16;
  const MASTER_PALETTE_STORAGE_PREFIX = 'o-arcano:master-palette:';

  function normalizeMasterPalette(colors) {
    return (Array.isArray(colors) ? colors : [])
      .map((color) => safeTagColor(color))
      .filter((color, index, list) => list.indexOf(color) === index)
      .slice(0, MAX_PALETTE);
  }

  function masterPaletteStorageKey() {
    return auth.user ? `${MASTER_PALETTE_STORAGE_PREFIX}${auth.user.id}` : null;
  }

  function readLocalMasterPalette() {
    const key = masterPaletteStorageKey();
    if (!key) return [];
    try {
      return normalizeMasterPalette(JSON.parse(localStorage.getItem(key) || '[]'));
    } catch (_) {
      return [];
    }
  }

  function writeLocalMasterPalette(colors) {
    const key = masterPaletteStorageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(normalizeMasterPalette(colors)));
    } catch (err) {
      console.warn('[O Arcano] Não foi possível manter a paleta local:', err);
    }
  }

  function isMasterPaletteUnavailable(error) {
    const message = error?.message || '';
    return error?.code === 'PGRST205' ||
      /(?:master_palette.*(?:does not exist|schema cache)|relation .*master_palette)/i.test(message);
  }

  async function loadMasterPalette() {
    if (!sb || !auth.user) return;
    try {
      const { data, error } = await sb
        .from('master_palette')
        .select('colors')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = nenhuma linha. Se a migração ainda não chegou ao banco,
        // preserva a paleta no navegador até que o Supabase fique disponível.
        if (isMasterPaletteUnavailable(error)) {
          masterPalette.colors = readLocalMasterPalette();
        } else {
          console.warn('[O Arcano] Falha ao carregar paleta:', error);
        }
        masterPalette.loaded = true;
        return;
      }
      masterPalette.colors = normalizeMasterPalette(data?.colors);
      writeLocalMasterPalette(masterPalette.colors);
      masterPalette.loaded = true;
    } catch (err) {
      console.warn('[O Arcano] Erro paleta:', err);
      masterPalette.colors = readLocalMasterPalette();
      masterPalette.loaded = true;
    }
  }

  async function saveMasterPalette(colors) {
    if (!sb || !auth.user) throw new Error('Sessão indisponível');
    const clean = normalizeMasterPalette(colors);
    const { error } = await sb
      .from('master_palette')
      .upsert({ user_id: auth.user.id, colors: clean, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      if (isMasterPaletteUnavailable(error)) {
        // Permite continuar trabalhando enquanto a migração do Supabase não foi aplicada.
        // A paleta volta a sincronizar assim que a tabela estiver exposta pela Data API.
        writeLocalMasterPalette(clean);
        masterPalette.colors = clean;
        console.warn('[O Arcano] Paleta salva apenas neste navegador; aplique supabase-master-palette.sql para sincronizá-la.', error);
        return;
      }
      throw error;
    }
    masterPalette.colors = clean;
    writeLocalMasterPalette(clean);
  }

  async function persistIndexCustom(patch) {
    if (!sb) throw new Error('Supabase não configurado');
    const row = { id: 1, updated_at: new Date().toISOString() };
    if ('title' in patch) row.title = patch.title;
    if ('subtitle' in patch) row.subtitle = patch.subtitle;
    if ('image' in patch) row.image = patch.image;
    if ('imagePath' in patch) row.image_path = patch.imagePath;
    if ('manifestoHtml' in patch) row.manifesto_html = patch.manifestoHtml;
    const { error } = await sb.from('index_config').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  /* ── HTML SANITIZATION (rich text) ────────────── */
  /* Permite apenas tags e atributos básicos de formatação. */
  const ALLOWED_TAGS = new Set(['B','STRONG','I','EM','U','S','STRIKE','BR','HR','P','DIV','SPAN','UL','OL','LI','H1','H2','H3','H4','BLOCKQUOTE','CODE','PRE','A','FIGURE','FIGCAPTION','IMG']);
  const ALLOWED_ATTRS_BY_TAG = {
    A: new Set(['href','data-arcano-link','data-link-tab','data-link-entry','class']),
    FIGURE: new Set(['class']),
    FIGCAPTION: new Set(['class']),
    IMG: new Set(['src','alt','class','loading','decoding']),
    DEFAULT: new Set(['style'])
  };
  const COLOR_VALUE_RE = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;
  const ALIGN_VALUE_RE = /^(left|right|center|justify)$/i;
  const FONT_SIZE_RE = /^\d+(\.\d+)?(em|rem|px|%)$/i;
  /* Famílias permitidas: somente fontes carregadas via Google Fonts no index.html. */
  const ALLOWED_FONT_FAMILIES = new Set([
    'inter','cinzel','cormorant garamond','medievalsharp','jetbrains mono',
    'im fell english','uncial antiqua','eb garamond','unifrakturcook','spectral','pirata one',
    'georgia','serif','sans-serif','monospace'
  ]);
  /* Validador de gradients simples para a cor da linha divisora (HR).
     Aceita "linear-gradient(NUM[unit], <stop>, <stop>...)" onde cada stop é cor opcionalmente seguida de % e os tokens são limitados. */
  const SAFE_GRADIENT_RE = /^linear-gradient\(\s*\d+(?:\.\d+)?(?:deg|rad|turn|grad)?\s*(?:,\s*(?:transparent|#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))(?:\s+\d+(?:\.\d+)?%)?\s*){2,6}\)$/i;
  /* Validadores por propriedade. Tudo o que não casar é descartado. */
  const STYLE_PROP_VALIDATORS = {
    'color': (v) => COLOR_VALUE_RE.test(v),
    'background-color': (v) => COLOR_VALUE_RE.test(v),
    'background': (v) => SAFE_GRADIENT_RE.test(v) || COLOR_VALUE_RE.test(v),
    'font-weight': (v) => /^(bold|bolder|lighter|normal|[1-9]00)$/i.test(v),
    'font-style': (v) => /^(italic|normal|oblique)$/i.test(v),
    'font-size': (v) => FONT_SIZE_RE.test(v),
    'font-family': (v) => {
      const cleaned = v.replace(/['"]/g, '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean);
      return cleaned.length > 0 && cleaned.every((p) => ALLOWED_FONT_FAMILIES.has(p));
    },
    'text-decoration': (v) => /^(underline|line-through|none|overline)( [a-z\-]+)*$/i.test(v),
    'text-align': (v) => ALIGN_VALUE_RE.test(v)
  };
  /* Apenas links internos (rota hash) sao aceitos. Bloqueia javascript:, data:, http externo, etc. */
  const INTERNAL_HREF_RE = /^#\/[A-Za-z0-9_\-%/.]+$/;
  const INLINE_DATA_IMAGE_RE = /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=]+$/i;

  function safeInlineImageSource(value) {
    const src = String(value || '').trim();
    if (INLINE_DATA_IMAGE_RE.test(src)) return true;
    if (/^assets\/images\/[A-Za-z0-9_./%-]+$/i.test(src)) return true;
    try {
      const url = new URL(src, location.href);
      const storagePrefix = cfg.supabaseUrl ? `${cfg.supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${BANNERS_BUCKET}/` : '';
      return !!storagePrefix && url.href.startsWith(storagePrefix);
    } catch {
      return false;
    }
  }

  function sanitizeHtml(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = String(html || '');
    walk(tpl.content);
    return tpl.innerHTML;

    function walk(node) {
      const children = Array.from(node.childNodes);
      for (let child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          child = normalizeRichTextElement(child);
          if (!ALLOWED_TAGS.has(child.tagName)) {
            // desembrulhar nó mantendo filhos
            while (child.firstChild) node.insertBefore(child.firstChild, child);
            node.removeChild(child);
            continue;
          }
          const allowedForTag = ALLOWED_ATTRS_BY_TAG[child.tagName] || ALLOWED_ATTRS_BY_TAG.DEFAULT;
          // limpar atributos
          for (const attr of Array.from(child.attributes)) {
            const name = attr.name.toLowerCase();
            if (!allowedForTag.has(name)) {
              child.removeAttribute(attr.name);
              continue;
            }
            if (name === 'style') {
              const decls = attr.value.split(';')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((decl) => {
                  const idx = decl.indexOf(':');
                  if (idx < 0) return null;
                  const prop = decl.slice(0, idx).trim().toLowerCase();
                  const value = decl.slice(idx + 1).trim();
                  const validator = STYLE_PROP_VALIDATORS[prop];
                  if (!validator || !validator(value)) return null;
                  return `${prop}: ${value}`;
                })
                .filter(Boolean);
              if (decls.length) child.setAttribute('style', decls.join('; '));
              else child.removeAttribute('style');
            } else if (name === 'href') {
              const v = (attr.value || '').trim();
              if (!INTERNAL_HREF_RE.test(v)) {
                // href invalido: desembrulha e descarta a tag <a>
                while (child.firstChild) node.insertBefore(child.firstChild, child);
                node.removeChild(child);
                child = null;
                break;
              }
            } else if (name === 'src') {
              if (!safeInlineImageSource(attr.value)) child.removeAttribute('src');
            } else if (name === 'class') {
              const allowedClasses = child.tagName === 'A'
                ? new Set(['rt-internal-link'])
                : child.tagName === 'FIGURE'
                  ? new Set(['rt-figure', 'rt-figure--wide', 'rt-figure--full'])
                  : child.tagName === 'IMG'
                    ? new Set(['rt-inline-image'])
                    : child.tagName === 'FIGCAPTION'
                      ? new Set(['rt-figure__caption'])
                      : new Set();
              const allowed = attr.value.split(/\s+/).filter((c) => allowedClasses.has(c)).join(' ');
              if (allowed) child.setAttribute('class', allowed);
              else child.removeAttribute('class');
            }
          }
          if (!child) continue;
          walk(child);
        } else if (child.nodeType !== Node.TEXT_NODE) {
          node.removeChild(child);
        }
      }
    }

    function normalizeRichTextElement(el) {
      if (el.tagName === 'FONT') {
        const span = document.createElement('span');
        const style = (el.getAttribute('style') || '').trim();
        if (style) span.setAttribute('style', style);
        const color = (el.getAttribute('color') || '').trim();
        if (color && COLOR_VALUE_RE.test(color)) {
          const current = span.getAttribute('style') || '';
          span.setAttribute('style', `${current}; color: ${color}`);
        }
        while (el.firstChild) span.appendChild(el.firstChild);
        el.replaceWith(span);
        el = span;
      }

      if (el.tagName === 'A') {
        // Garante a classe de link interno e remove qualquer target/rel deixado por colagem.
        el.setAttribute('class', 'rt-internal-link');
        el.removeAttribute('target');
        el.removeAttribute('rel');
      }

      const align = (el.getAttribute('align') || '').trim().toLowerCase();
      if (align && ALIGN_VALUE_RE.test(align)) {
        const current = el.getAttribute('style') || '';
        el.setAttribute('style', `${current}; text-align: ${align}`);
      }

      return el;
    }
  }

  /* ── ROUTE PARSING ────────────────────────────── */
  function parseHash() {
    const raw = (location.hash || '#/').replace(/^#\/?/, '');
    if (!raw) return { tab: 'Index', entry: null, action: null };
    const parts = raw.split('/').filter(Boolean);
    if (!parts.length) return { tab: 'Index', entry: null, action: null };
    const tab = canonicalTabId(decodeURIComponent(parts[0]));
    if (parts.length === 1) return { tab, entry: null, action: null };
    // Última parte pode ser uma action (criar/editar). Caso contrário é parte do id.
    const last = decodeURIComponent(parts[parts.length - 1]);
    if (parts.length >= 2 && (last === 'criar' || last === 'editar')) {
      const middle = parts.slice(1, -1).map(decodeURIComponent).join('/');
      return { tab, entry: middle || null, action: last };
    }
    return { tab, entry: parts.slice(1).map(decodeURIComponent).join('/'), action: null };
  }

  /* ── SIDEBAR NAV ──────────────────────────────── */
  function renderSidenav(active) {
    sidebarCount.textContent = Math.max(0, ARCHIVE.tabs.length - 1);
    const itemMarkup = (tabId) => {
      const tab = tabById(tabId);
      if (!tab) return '';
      const theme = themeOf(tab.id);
      return `
        <a href="#/${tab.id}" class="sidenav__item ${tab.id === active ? 'is-active' : ''}" data-tab="${tab.id}" style="--hue:${theme.hue}">
          <span class="sidenav__icon">${iconOf(tab.id)}</span>
          <span class="sidenav__label">${escapeHtml(tab.title)}</span>
          <span class="sidenav__count">${tabCount(tab.id)}</span>
        </a>`;
    };

    sidenav.innerHTML = `
      <a href="#/" class="sidenav__item sidenav__home ${active === 'Index' ? 'is-active' : ''}" data-tab="Index" style="--hue:${themeOf('Index').hue}">
        <span class="sidenav__icon">${iconOf('Index')}</span>
        <span class="sidenav__label">Início</span>
      </a>
      <a href="#/Mesas" class="sidenav__item ${active === 'Mesas' ? 'is-active' : ''}" data-tab="Mesas" style="--hue:${themeOf('Mesas').hue}">
        <span class="sidenav__icon">${iconOf('Mesas')}</span>
        <span class="sidenav__label">Mesas</span>
        <span class="sidenav__count">${MESAS.length}</span>
      </a>
      ${auth.isPlatina ? `
      <a href="#/Painel" class="sidenav__item ${active === 'Painel' ? 'is-active' : ''}" data-tab="Painel" style="--hue:${themeOf('Painel').hue}">
        <span class="sidenav__icon">${iconOf('Painel')}</span>
        <span class="sidenav__label">Painel de contas</span>
      </a>` : ''}
      <span class="sidenav__section-label">Sistema Arcano</span>
      <a href="#/Arcano" class="sidenav__item ${active === 'Arcano' ? 'is-active' : ''}" data-tab="Arcano" style="--hue:${themeOf('Arcano').hue}">
        <span class="sidenav__icon">${iconOf('Arcano')}</span>
        <span class="sidenav__label">Livro do Arcano</span>
      </a>
      <div class="sidenav__groups">
        ${NAV_GROUPS.map((group) => {
          const open = group.tabs.includes(active);
          const total = group.tabs.reduce((sum, tabId) => sum + tabCount(tabId), 0);
          return `
            <section class="sidenav__group ${open ? 'is-open' : ''}" data-nav-group="${escapeHtml(group.id)}">
              <button type="button" class="sidenav__group-toggle" aria-expanded="${open ? 'true' : 'false'}">
                <span><strong>${escapeHtml(group.title)}</strong><small>${escapeHtml(group.tone)}</small></span>
                <span class="sidenav__group-meta"><b>${total}</b><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></span>
              </button>
              <div class="sidenav__subnav" ${open ? '' : 'hidden'}>
                ${group.tabs.map(itemMarkup).join('')}
              </div>
            </section>`;
        }).join('')}
      </div>`;
  }

  /* ── HOME VIEW ────────────────────────────────── */
  function viewHome() {
    const idx = ARCHIVE.index;
    const featured = pickFeatured(4);
    const directory = NAV_GROUPS.map((group) => ({
      ...group,
      entries: group.tabs.reduce((sum, tabId) => sum + tabCount(tabId), 0)
    }));
    const manifestoMarkup = idx.manifestoHtml
      ? `<div class="rt-content">${sanitizeHtml(idx.manifestoHtml)}</div>`
      : (idx.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');

    return `
      <section class="codex-home__hero" data-home-parallax>
        <div class="codex-home__world auth-gate__world" aria-hidden="true">
          <div class="auth-gate__layer auth-gate__base" data-auth-depth="5"></div>
          <div class="auth-gate__layer auth-gate__nebula" data-auth-depth="18"></div>
          <div class="auth-gate__layer auth-gate__starlight" data-auth-depth="34"></div>
          <div class="auth-gate__layer auth-gate__foreground" data-auth-depth="52"></div>
          <canvas class="auth-gate__fog" data-auth-fog></canvas>
          <canvas class="auth-gate__dust" data-auth-dust></canvas>
          <div class="auth-gate__grade"></div>
          <div class="auth-gate__grain"></div>
          <div class="auth-gate__vignette"></div>
        </div>
        <div class="codex-home__veil"></div>
        <span class="arc-trace arc-trace--top" aria-hidden="true"></span>
        <span class="arc-trace arc-trace--bottom" aria-hidden="true"></span>
        ${auth.isAdmin ? `
<div class="hero__tools">          <button type="button" class="hero__edit hero__edit--tool" data-edit-index aria-label="Editar apresentação">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            <span>Editar apresentação</span>
          </button><button type="button" class="hero__edit hero__edit--tool" data-backup="json" title="Baixar tudo em JSON (restaurável)"><span>Backup (JSON)</span></button><button type="button" class="hero__edit hero__edit--tool" data-backup="markdown" title="Baixar o texto do Codex em Markdown (leitura)"><span>Exportar (Markdown)</span></button></div>
        ` : ''}
        <div class="codex-home__copy">
          <div class="codex-home__eyebrow"><i></i><span>CAMPANHA DE RPG · DARK FANTASY</span></div>
          <p class="codex-home__kicker">Conhecimento preservado contra o fim</p>
          <h1 data-text-reveal>${escapeHtml(idx.title)}</h1>
          <p class="codex-home__subtitle">${escapeHtml(idx.subtitle)}</p>
          <div class="codex-home__actions">
            <a href="#/Cenarios" class="btn btn-primary arc-energy-button">
              <span>Abrir o Codex</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      <section class="codex-home__directory">
        <header class="codex-home__section-head">
          <div><span>ÍNDICE</span><h2>Por onde começar</h2></div>
          <p>O mundo, seus povos, suas forças e as histórias deixadas para trás.</p>
        </header>
        <div class="codex-home__groups">
          ${directory.map((group, index) => `
            <article class="codex-home__group" style="--group-delay:${index * 90}ms">
              <div class="codex-home__group-head"><span>0${index + 1}</span><div><h3>${escapeHtml(group.title)}</h3><p>${escapeHtml(group.tone)}</p></div><b>${group.entries}</b></div>
              <nav aria-label="${escapeHtml(group.title)}">
                ${group.tabs.map((tabId) => {
                  const tab = tabById(tabId);
                  if (!tab) return '';
                  const total = tabCount(tab.id);
                  return `<a href="#/${tab.id}" class="${total ? '' : 'is-empty'}" ${total ? '' : 'title="Ainda sem entradas"'} style="--hue:${themeOf(tab.id).hue}"><span>${iconOf(tab.id)}</span><strong>${escapeHtml(tab.title)}</strong><small>${total || 'vazio'}</small></a>`;
                }).join('')}
              </nav>
              <span class="codex-home__group-line" aria-hidden="true"></span>
            </article>`).join('')}
        </div>
      </section>

      ${featured.length ? `<section class="section codex-home__featured"><header class="codex-home__section-head"><div><span>EM DESTAQUE</span><h2>Do Codex</h2></div><p>Algumas entradas para começar a explorar.</p></header><div class="featured">${featured.map((e, i) => featuredCardHTML(e, i)).join('')}</div></section>` : ''}

      ${(idx.pillars || []).length ? `<section class="section"><header class="codex-home__section-head"><div><span>PILARES</span><h2>O que sustenta este mundo</h2></div></header><div class="pillars">${idx.pillars.map((p, i) => `<article class="pillar" style="--delay:${i * 80}ms"><div class="pillar__num">0${i + 1}</div><h3 class="pillar__title">${escapeHtml(p.title)}</h3><p class="pillar__text">${escapeHtml(p.text)}</p><div class="pillar__glow"></div></article>`).join('')}</div></section>` : ''}

      ${manifestoMarkup ? `
        <section class="section codex-home__manifesto">
          <div class="manifesto">
            <span class="section__eyebrow">SOBRE O MUNDO</span>
            ${manifestoMarkup}
          </div>
        </section>
      ` : ''}
    `;
  }

  function featuredCardHTML(e, i) {
    const theme = themeOf(e.tab);
    return `
      <a href="#/${e.tab}/${e.id}" class="feat" style="--hue:${theme.hue};--delay:${i * 80}ms">
        <div class="feat__media">
          ${e.image ? `<img loading="lazy" decoding="async" src="${e.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
          <div class="feat__fallback">${iconOf(e.tab)}</div>
          <div class="feat__shade"></div>
        </div>
        <div class="feat__body">
          <span class="feat__cat">${escapeHtml(theme.label)}</span>
          <h3 class="feat__title">${escapeHtml(e.title)}</h3>
          <p class="feat__summary">${escapeHtml(e.summary || '')}</p>
        </div>
      </a>
    `;
  }

  function pickFeatured(n) {
    const withImg = ARCHIVE.entries.filter((e) => e.image);
    const seen = new Set();
    const result = [];
    for (const e of withImg) {
      if (!seen.has(e.tab)) {
        seen.add(e.tab);
        result.push(e);
      }
      if (result.length >= n) break;
    }
    let i = 0;
    while (result.length < n && i < ARCHIVE.entries.length) {
      const c = ARCHIVE.entries[i++];
      if (!result.includes(c)) result.push(c);
    }
    return result.slice(0, n);
  }

  /* ── CRONOSCÓPIO (aba Eras) ─────────────────── */
  function narrativeEraOrder(entry) {
    const value = Number(entry?.fields?.Ordem);
    return Number.isFinite(value) ? value : 9999;
  }

  function narrativePosition(entry) {
    const value = Number(entry?.fields?.['Posição temporal']);
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
  }

  function narrativeIsBranch(entry) {
    return normalize(entry?.fields?.Realidade || 'Cânone') !== 'canone';
  }

  function narrativeEraEntries() {
    return entriesIn('Eras').slice().sort((a, b) => narrativeEraOrder(a) - narrativeEraOrder(b) || a.title.localeCompare(b.title, 'pt-BR'));
  }

  function narrativeEvents() {
    return entriesIn('Historias')
      .filter((entry) => entry.fields?.Era)
      .slice()
      .sort((a, b) => narrativePosition(a) - narrativePosition(b) || (a.createdAt || 0) - (b.createdAt || 0));
  }

  function narrativePreviewHTML(event, eras) {
    if (!event) return `
      <div class="chrono-preview__empty">
        <span aria-hidden="true"></span>
        <p>Selecione um acontecimento</p>
      </div>`;
    const era = eras.find((item) => item.id === event.fields?.Era);
    const branch = narrativeIsBranch(event);
    return `
      <div class="chrono-preview__media ${event.image ? '' : 'is-fallback'}">
        ${event.image ? `<img src="${escapeHtml(event.image)}" alt="" loading="lazy" decoding="async">` : ''}
      </div>
      <div class="chrono-preview__body">
        <div class="chrono-preview__meta"><small>${escapeHtml(event.fields?.['Data no mundo'] || era?.title || 'Sem data')}</small><span>${branch ? 'RAMIFICAÇÃO' : 'LINHA PRINCIPAL'}</span></div>
        <h3>${escapeHtml(event.title)}</h3>
        ${event.summary ? `<p>${escapeHtml(event.summary)}</p>` : ''}
        <a href="#/Historias/${encodeURIComponent(event.id)}" aria-label="Ler ${escapeHtml(event.title)}">Abrir <span aria-hidden="true">→</span></a>
      </div>`;
  }

  function viewChronoscope() {
    const eras = narrativeEraEntries();
    const events = narrativeEvents();
    const first = events.find((entry) => !narrativeIsBranch(entry)) || events[0];
    const branchCount = events.filter(narrativeIsBranch).length;
    const eraWidth = eras.length ? 100 / eras.length : 100;
    const showCreate = auth.isAdmin;

    if (!eras.length) {
      return `
        <section class="chronoscope chronoscope--empty" data-chronoscope>
          <header class="chronoscope__head"><div class="chronoscope__identity"><span class="chronoscope__mark" aria-hidden="true"></span><span><small>CRONOLOGIA</small><h1>Linha do tempo</h1></span></div>${showCreate ? '<a class="btn btn-primary chrono-action" href="#/Eras/criar">+ Era</a>' : ''}</header>
          <div class="chrono-empty-stage"><div class="chrono-empty-axis" aria-hidden="true"><i></i></div><p>Nenhuma era cadastrada.</p>${showCreate ? '<a href="#/Eras/criar">Criar a primeira era →</a>' : ''}</div>
        </section>`;
    }

    const eraBands = eras.map((era, index) => `
      <div class="chrono-era-band" id="chrono-era-${index}" data-era-index="${index}" aria-label="${escapeHtml(era.title)}" style="--era-left:${index * eraWidth}%;--era-width:${eraWidth}%;--era-color:${escapeHtml(era.fields?.Cor || '#a78bfa')}">
        <b aria-hidden="true">${String(index + 1).padStart(2, '0')}</b><strong>${escapeHtml(era.title)}</strong>${events.some((event) => event.fields?.Era === era.id) ? '' : `<em>Nenhum acontecimento</em>${showCreate ? '<a class="chrono-era-band__add" href="#/Historias/criar">+ Acontecimento</a>' : ''}`}<small>${escapeHtml(`${era.fields?.Início || '—'} · ${era.fields?.Fim || '—'}`)}</small>
      </div>`).join('');

    const lastLabelLeft = [-Infinity, -Infinity];
    const eventNodes = events.map((event, eventIndex) => {
      const eraIndex = Math.max(0, eras.findIndex((era) => era.id === event.fields?.Era));
      const left = eraIndex * eraWidth + (6 + narrativePosition(event) * 0.88) / 100 * eraWidth;
      const branch = narrativeIsBranch(event);
      const labelSide = eventIndex % 2;
      const labelQuiet = left - lastLabelLeft[labelSide] < 11;
      if (!labelQuiet) lastLabelLeft[labelSide] = left;
      const edgeClass = (left < 7 ? ' is-edge-start' : (left > 93 ? ' is-edge-end' : '')) + (labelSide ? ' is-label-below' : '') + (labelQuiet ? ' is-label-quiet' : '');
      return `<button type="button" class="chrono-event ${branch ? 'chrono-event--branch' : ''}${edgeClass}" style="--event-left:${left}%" data-chrono-event="${escapeHtml(event.id)}" data-chrono-era-index="${eraIndex}" aria-pressed="false" aria-label="${escapeHtml(`${event.title}, ${event.fields?.['Data no mundo'] || 'data não definida'}${branch ? ', realidade alternativa' : ''}`)}"><i></i><span>${escapeHtml(event.title)}</span></button>`;
    }).join('');

    const mobileEras = eras.map((era, eraIndex) => {
      const eraEvents = events.filter((event) => event.fields?.Era === era.id);
      return `<section class="chrono-mobile-era">
        <header><b>${String(eraIndex + 1).padStart(2, '0')}</b><span><strong>${escapeHtml(era.title)}</strong><small>${escapeHtml(era.summary || '')}</small></span></header>
        <div>${eraEvents.length ? eraEvents.map((event) => `<article class="chrono-mobile-event ${narrativeIsBranch(event) ? 'chrono-event--branch' : ''}"><button type="button" data-chrono-event="${escapeHtml(event.id)}" aria-expanded="false"><small>${escapeHtml(event.fields?.['Data no mundo'] || 'Sem data')}</small><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.fields?.Realidade || 'Cânone')}</span></button><div hidden><p>${escapeHtml(event.summary || '')}</p><a href="#/Historias/${encodeURIComponent(event.id)}">Ler acontecimento →</a></div></article>`).join('') : '<p class="chrono-mobile-empty">Nenhum acontecimento nesta era.</p>'}</div>
      </section>`;
    }).join('');

    return `
      <section class="chronoscope" data-chronoscope>
        <header class="chronoscope__head"><div class="chronoscope__identity"><span class="chronoscope__mark" aria-hidden="true"></span><span><small>CRONOLOGIA</small><h1>Linha do tempo</h1></span></div><div class="chronoscope__actions">${showCreate ? '<a class="btn btn-ghost chrono-action" href="#/Eras/criar">+ Era</a><a class="btn btn-primary chrono-action" href="#/Historias/criar">+ Acontecimento</a>' : ''}${branchCount ? `<button type="button" class="chrono-branch-toggle" data-chrono-branches aria-pressed="true">Ramificações <b>${branchCount}</b></button>` : ''}</div></header>
        <nav class="chrono-era-nav" style="--era-count:${eras.length}" aria-label="Ir para uma era">${eras.map((era, index) => `<button type="button" data-chrono-era="${index}" class="${index === 0 ? 'is-active' : ''}"><b>${String(index + 1).padStart(2, '0')}</b><span>${escapeHtml(era.title)}</span></button>`).join('')}</nav>
        <div class="chrono-stage" data-chrono-stage>
          <div class="chrono-atmosphere" aria-hidden="true"></div>
          <div class="chrono-track-scroll" tabindex="0" aria-label="Linha do tempo. Use Tab ou as setas para percorrer os acontecimentos."><div class="chrono-track"><div class="chrono-era-bands">${eraBands}</div><div class="chrono-canon-line" aria-hidden="true"></div>${branchCount ? '<div class="chrono-branch-line" aria-hidden="true"></div>' : ''}${eventNodes}</div></div>
          <aside class="chrono-preview is-revealed" data-chrono-preview aria-live="polite">${narrativePreviewHTML(first, eras)}</aside>
        </div>
        <div class="chrono-mobile">${mobileEras}</div>
        <footer class="chrono-legend"><span><i></i>Linha principal</span>${branchCount ? '<span><i class="is-branch"></i>Ramificação</span>' : ''}</footer>
      </section>`;
  }

  /* ── CATEGORY VIEW ────────────────────────────── */
  function viewCategory(tabId, query, selectedTag, spellFilters) {
    if (tabId === 'Eras') return viewChronoscope();
    const tab = tabById(tabId);
    if (!tab) return viewNotFound(tabId);
    const theme = themeOf(tabId);
    const all = entriesIn(tabId);
    const q = normalize(query || '');
    const spellTab = isMagiasTab(tabId);
    const beastTab = tabId === 'Bestiario';
    const raceTab = tabId === 'Racas';
    const tag = spellTab ? '' : tagKey(selectedTag || '');
    const spellFilter = normalizeSpellFilters(spellFilters);
    const beastFilter = normalizeBeastFilters(categoryState[tabId]?.beast || EMPTY_BEAST_FILTERS);
    const raceFilter = normalizeRaceFilters(categoryState[tabId]?.race || EMPTY_RACE_FILTERS);
    const tagStats = categoryTagStats(all);
    const list = all.filter((e) => {
      const entryTags = sanitizeTags(e.tags);
      const matchesTag = !tag || entryTags.some((t) => tagKey(t.label) === tag);
      if (!matchesTag) return false;
      if (spellTab) {
        const fields = e.fields || {};
        const type = isSpellType(e.subtype) ? e.subtype : 'ativa';
        const arcane = normalizeSpellArcaneFields(fields);
        if (spellFilter.type && type !== spellFilter.type) return false;
        if (spellFilter.affinity && fields['Afinidade'] !== spellFilter.affinity) return false;
        if (spellFilter.classification && arcane.classificacao !== spellFilter.classification) return false;
      }
      if (beastTab) {
        const fields = e.fields || {};
        if (beastFilter.threat && normalize(fields.Perigo) !== normalize(beastFilter.threat)) return false;
        if (beastFilter.type && normalize(fields.Tipo) !== normalize(beastFilter.type)) return false;
        if (beastFilter.habitat && normalize(fields.Habitat) !== normalize(beastFilter.habitat)) return false;
      }
      if (raceTab) {
        const fields = e.fields || {};
        if (raceFilter.type && normalize(fields.Tipo) !== normalize(raceFilter.type)) return false;
        if (raceFilter.size && normalize(fields.Porte) !== normalize(raceFilter.size)) return false;
        if (raceFilter.rarity && normalize(fields.Raridade) !== normalize(raceFilter.rarity)) return false;
        if (raceFilter.origin && normalize(fields.Origem) !== normalize(raceFilter.origin)) return false;
      }
      if (!q) return true;
      const tagText = entryTags.map((t) => t.label).join(' ');
      const hay = [e.title, e.summary, tagText, ...(e.body || []), e.bodyHtml || '', ...fieldSearchValues(e.fields || {})].join(' ');
      return normalize(hay).includes(q);
    });

    const showCreate = isCreatable(tabId) && auth.isAdmin;
    const totalCards = list.length + (showCreate && !spellTab && !beastTab && !raceTab ? 1 : 0);
    const activeTagLabel = !spellTab ? (tagStats.find((t) => t.key === tag)?.label || '') : '';
    const spellFiltersOpen = spellTab && !!(categoryState[tabId]?.spellFiltersOpen);
    const beastFiltersOpen = beastTab && !!(categoryState[tabId]?.beastFiltersOpen);
    const raceFiltersOpen = raceTab && !!(categoryState[tabId]?.raceFiltersOpen);
    const spellFilterLabels = spellActiveFilterLabels(spellFilter);
    const beastFilterLabels = Object.values(beastFilter).filter(Boolean);
    const raceFilterLabels = Object.values(raceFilter).filter(Boolean);
    const totalLabel = spellTab
      ? (all.length === 1 ? 'magia' : 'magias')
      : beastTab
        ? (all.length === 1 ? 'criatura' : 'criaturas')
        : raceTab
          ? (all.length === 1 ? 'raça' : 'raças')
        : (all.length === 1 ? 'registro' : 'registros');
    const visibleCountLabel = spellTab
      ? `${list.length} ${list.length === 1 ? 'magia vis\u00edvel' : 'magias vis\u00edveis'}`
      : beastTab
        ? `${list.length} ${list.length === 1 ? 'criatura visível' : 'criaturas visíveis'}`
        : raceTab
          ? `${list.length} ${list.length === 1 ? 'raça visível' : 'raças visíveis'}`
        : `${totalCards} ${totalCards === 1 ? 'item' : 'itens'}`;

    return `
      <section class="cat-hero ${spellTab ? 'cat-hero--magias' : ''} ${beastTab ? 'cat-hero--bestiario' : ''} ${raceTab ? 'cat-hero--racas' : ''}" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf(tabId)}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title" data-text-reveal>${escapeHtml(raceTab ? 'Atlas das Raças' : tab.title)}</h1>
          <p class="cat-hero__tone">${escapeHtml(tab.tone || '')}</p>
          <div class="cat-hero__meta">
            <span class="badge"><strong>${all.length}</strong> ${totalLabel}</span>
            ${!spellTab && showCreate ? '<span class="badge badge-soft">Cria\u00e7\u00e3o aberta</span>' : ''}
          </div>
        </div>
        ${(spellTab || beastTab || raceTab) && showCreate ? `
          <a href="#/${tabId}/criar" class="spell-primary-action ${beastTab ? 'beast-primary-action' : ''} ${raceTab ? 'race-primary-action' : ''}" aria-label="Criar nova ${beastTab ? 'criatura' : (raceTab ? 'raça' : 'magia')}">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>Nova ${beastTab ? 'criatura' : (raceTab ? 'raça' : 'magia')}</span>
          </a>` : ''}
      </section>

      <section class="filter-bar ${spellTab ? 'filter-bar--magias' : ''} ${beastTab ? 'filter-bar--bestiario' : ''} ${raceTab ? 'filter-bar--racas' : ''}">
        <label class="filter-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input id="catSearch" type="search" placeholder="${spellTab ? 'Buscar magia, afinidade, efeito...' : (beastTab ? 'Buscar criatura, habitat, habilidade...' : (raceTab ? 'Buscar raça, origem ou aptidão...' : `Filtrar em ${escapeHtml(tab.title)}...`))}" value="${escapeHtml(query || '')}" autocomplete="off">
        </label>
        <span class="filter-count">${escapeHtml(visibleCountLabel)}</span>
        ${spellTab ? `
          <button type="button" class="spell-filter-toggle ${spellFiltersOpen ? 'is-open' : ''}" data-spell-filter-toggle aria-expanded="${spellFiltersOpen ? 'true' : 'false'}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
            <span>Filtros</span>
            ${spellFilterLabels.length ? `<b>${spellFilterLabels.length}</b>` : ''}
          </button>` : beastTab && all.length ? `
          <button type="button" class="beast-filter-toggle ${beastFiltersOpen ? 'is-open' : ''}" data-beast-filter-toggle aria-expanded="${beastFiltersOpen ? 'true' : 'false'}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
            <span>Filtros</span>
            ${beastFilterLabels.length ? `<b>${beastFilterLabels.length}</b>` : ''}
          </button>` : raceTab && all.length ? `
          <button type="button" class="beast-filter-toggle race-filter-toggle ${raceFiltersOpen ? 'is-open' : ''}" data-race-filter-toggle aria-expanded="${raceFiltersOpen ? 'true' : 'false'}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
            <span>Filtros</span>
            ${raceFilterLabels.length ? `<b>${raceFilterLabels.length}</b>` : ''}
          </button>` : ''}
      </section>

      ${spellTab && spellFilterLabels.length ? `
        <div class="spell-active-filters">
          ${spellFilterLabels.map((label) => `<span>${escapeHtml(label)}</span>`).join('')}
        </div>` : ''}

      ${spellTab ? spellCategoryFiltersHTML(all, spellFilter, spellFiltersOpen) : ''}

      ${beastTab ? beastCategoryFiltersHTML(all, beastFilter, beastFiltersOpen) : ''}

      ${raceTab ? raceCategoryFiltersHTML(all, raceFilter, raceFiltersOpen) : ''}

      ${(!spellTab && tagStats.length) ? `
        <section class="tag-filter" aria-label="Filtrar por tag">
          <button type="button" class="tag-filter__chip ${!tag ? 'is-active' : ''}" data-tag-filter="">
            Todas
          </button>
          ${tagStats.map((t) => `
            <button type="button" class="tag-filter__chip ${t.key === tag ? 'is-active' : ''}" data-tag-filter="${escapeHtml(t.label)}" style="--tag:${safeTagColor(t.color)}">
              <span>${escapeHtml(t.label)}</span>
              <small>${t.count}</small>
            </button>
          `).join('')}
        </section>
      ` : ''}

      ${activeTagLabel ? `
        <div class="filter-note">
          Filtrando por <strong>${escapeHtml(activeTagLabel)}</strong>
        </div>
      ` : ''}

      ${(list.length === 0 && (!showCreate || spellTab || beastTab || raceTab)) ? emptyStateHTML(tab) : `
        <section class="entry-grid ${spellTab ? 'entry-grid--magias' : ''} ${beastTab ? 'entry-grid--bestiario' : ''} ${raceTab ? 'entry-grid--racas' : ''}">
          ${showCreate && !spellTab && !beastTab && !raceTab ? createCardHTML(tabId) : ''}
          ${list.map((e, i) => entryCardHTML(e, i + ((showCreate && !spellTab && !beastTab && !raceTab) ? 1 : 0))).join('')}
        </section>
      `}
    `;
  }

  function createCardHTML(tabId) {
    const theme = themeOf(tabId);
    const noun = isMagiasTab(tabId) ? 'magia' : (tabId === 'Itens' ? 'item' : (tabId === 'Racas' ? 'raça' : (tabId === 'Bestiario' ? 'criatura' : 'história')));
    const title = tabById(tabId)?.title || tabId;
    return `
      <a href="#/${tabId}/criar" class="entry-card create-card" style="--hue:${theme.hue};--delay:0ms" aria-label="Criar nova ${noun} em ${escapeHtml(title)}">
        <div class="create-card__inner">
          <div class="create-card__plus">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span class="create-card__label">Criar</span>
          <span class="create-card__hint">Nova ${noun} em ${escapeHtml(title)}</span>
        </div>
      </a>
    `;
  }

  function beastCardHTML(entry, index) {
    const theme = themeOf(entry.tab);
    const fields = entry.fields || {};
    const tags = sanitizeTags(entry.tags);
    const parts = beastHpPartsForView(fields);
    const totalHp = beastHpTotal(fields);
    const abilities = normalizeBeastAbilities(fields.Habilidades);
    return `
      <a href="#/${entry.tab}/${entry.id}" class="entry-card entry-card--beast" style="--hue:${theme.hue};--delay:${index * 40}ms">
        <div class="beast-card__media ${entry.image ? '' : 'is-fallback'}">
          ${entry.image ? `<img loading="lazy" decoding="async" src="${entry.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
          <div class="beast-card__fallback">${iconOf(entry.tab)}</div>
          <div class="beast-card__shade"></div>
          <span class="rarity-chip ${threatCssClass(fields.Perigo)}">${escapeHtml(fields.Perigo || 'Perigo não definido')}</span>
        </div>
        <div class="beast-card__body">
          <div class="beast-card__identity">
            <div>
              <span class="beast-card__type">${escapeHtml(fields.Tipo || 'Criatura')}</span>
              <h3>${escapeHtml(entry.title)}</h3>
            </div>
            <span class="beast-card__arrow" aria-hidden="true">→</span>
          </div>
          ${entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : '<p>Sem resumo cadastrado.</p>'}
          <div class="beast-card__facts">
            <span><small>Habitat</small><strong>${escapeHtml(fields.Habitat || '—')}</strong></span>
            <span><small>Vitalidade</small><strong>${totalHp ? `${totalHp} HP` : `${parts.length} ${parts.length === 1 ? 'parte' : 'partes'}`}</strong></span>
            <span><small>Habilidades</small><strong>${abilities.length}</strong></span>
          </div>
          ${tags.length ? `<div class="beast-card__tags">${tags.slice(0, 3).map((tag) => tagChipHTML(tag, 'story-tag story-tag--card')).join('')}</div>` : ''}
        </div>
      </a>`;
  }

  function raceCardHTML(entry, index) {
    const fields = entry.fields || {};
    const tags = sanitizeTags(entry.tags);
    const attrs = normalizeRaceAttributes(fields);
    const modifiers = CHAR_ATTRIBUTES
      .map((attr) => ({ attr, value: Number(attrs[attr]) || 0 }))
      .filter((row) => row.value)
      .slice(0, 3);
    const abilities = normalizeRaceAbilities(fields);
    const anatomy = raceAnatomy(fields);
    const rarity = fields.Raridade || 'Raridade não definida';
    return `
      <a href="#/${entry.tab}/${entry.id}" class="entry-card entry-card--race" style="--hue:${themeOf(entry.tab).hue};--delay:${index * 45}ms">
        <div class="race-card__media ${entry.image ? '' : 'is-fallback'}">
          ${entry.image ? `<img loading="lazy" decoding="async" src="${entry.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
          <div class="race-card__fallback" aria-hidden="true">${iconOf('Racas')}</div>
          <div class="race-card__veil"></div>
          <span class="race-card__archive">ARQ · ${String(index + 1).padStart(2, '0')}</span>
          <span class="rarity-chip ${rarityCssClass(rarity)}">${escapeHtml(rarity)}</span>
        </div>
        <div class="race-card__body">
          <span class="race-card__type">${escapeHtml([fields.Tipo || 'Povo', fields.Porte].filter(Boolean).join(' · '))}</span>
          <h3>${escapeHtml(entry.title)}</h3>
          <p>${escapeHtml(entry.summary || 'Registro ainda sem frase de identidade.')}</p>
          <div class="race-card__facts">
            <span><small>Origem</small><strong>${escapeHtml(fields.Origem || '—')}</strong></span>
            <span><small>Vitalidade</small><strong>${raceTotalHp(fields) ? `${raceTotalHp(fields)} HP` : `${anatomy.length} ${anatomy.length === 1 ? 'parte' : 'partes'}`}</strong></span>
            <span><small>Heranças</small><strong>${abilities.length || '—'}</strong></span>
          </div>
          ${(modifiers.length || tags.length) ? `<div class="race-card__footer">
            <div class="race-card__mods">${modifiers.map((row) => `<span class="${row.value < 0 ? 'is-penalty' : ''}">${row.value > 0 ? '+' : ''}${row.value}d6 ${escapeHtml(row.attr)}</span>`).join('')}</div>
            ${tags.length ? `<div class="race-card__tags">${tags.slice(0, 2).map((tag) => tagChipHTML(tag, 'story-tag story-tag--card')).join('')}</div>` : ''}
          </div>` : ''}
        </div>
      </a>`;
  }

  function entryCardHTML(e, i) {
    if (isMagiasTab(e.tab)) return spellCardHTML(e, i);
    if (e.tab === 'Bestiario') return beastCardHTML(e, i);
    if (e.tab === 'Racas') return raceCardHTML(e, i);
    const theme = themeOf(e.tab);
    const fieldKeys = Object.keys(e.fields || {});
    const tags = sanitizeTags(e.tags);
    const subtypeName = e.subtype ? subtypeLabel(e.subtype) : null;
    // Em itens (com subtype) os campos do dossie sao fixos por tipo,
    // entao mostrar como chips no card e redundante.
    const showChips = fieldKeys.length && !e.subtype;
    return `
      <a href="#/${e.tab}/${e.id}" class="entry-card" style="--hue:${theme.hue};--delay:${i * 40}ms">
        <div class="entry-card__media">
          ${e.image ? `<img loading="lazy" decoding="async" src="${e.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
          <div class="entry-card__fallback">${iconOf(e.tab)}</div>
          <div class="entry-card__shade"></div>
          <div class="entry-card__tags">
            ${tags.length
              ? tags.slice(0, 3).map((tag) => tagChipHTML(tag, 'story-tag story-tag--card')).join('')
              : `<span class="entry-card__cat">${escapeHtml(subtypeName || theme.label)}</span>`}
          </div>
        </div>
        <div class="entry-card__body">
          <h3 class="entry-card__title">${escapeHtml(e.title)}</h3>
          <p class="entry-card__summary">${escapeHtml(e.summary || '')}</p>
          ${showChips ? `
            <div class="entry-card__chips">
              ${fieldKeys.slice(0, 3).map((k) => `<span class="chip">${escapeHtml(k)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </a>
    `;
  }

  function emptyStateHTML(tab) {
    return `
      <section class="empty-state">
        <div class="empty-state__icon">${iconOf(tab.id)}</div>
        <h3>Nenhuma entrada ainda</h3>
        <p>Esta categoria ainda não possui registros.</p>
      </section>
    `;
  }

  /* ── RICH-TEXT EDITOR (markup compartilhado) ──── */
  /* Famílias de fonte disponíveis no dropdown do editor.
     Os valores devem casar com ALLOWED_FONT_FAMILIES no sanitizer. */
  const RT_FONT_FAMILIES = [
    { id: '',                    label: 'Padrão',     css: '' },
    { id: 'cinzel',              label: 'Decorativo', css: "'Cinzel', Georgia, serif" },
    { id: 'cormorant-garamond',  label: 'Elegante',   css: "'Cormorant Garamond', Georgia, serif" },
    { id: 'eb-garamond',         label: 'Clássico',   css: "'EB Garamond', Georgia, serif" },
    { id: 'spectral',            label: 'Refinado',   css: "'Spectral', Georgia, serif" },
    { id: 'im-fell-english',     label: 'Manuscrito', css: "'IM Fell English', Georgia, serif" },
    { id: 'medievalsharp',       label: 'Medieval',   css: "'MedievalSharp', Cinzel, serif" },
    { id: 'uncial-antiqua',      label: 'Antigo',     css: "'Uncial Antiqua', Cinzel, serif" },
    { id: 'unifrakturcook',      label: 'Gótico',     css: "'UnifrakturCook', Cinzel, serif" },
    { id: 'pirata-one',          label: 'Pirata',     css: "'Pirata One', Cinzel, serif" },
    { id: 'jetbrains-mono',      label: 'Mono',       css: "'JetBrains Mono', monospace" }
  ];

  function ensureEditorFonts() {
    if (document.getElementById('arcanoEditorFonts')) return;
    const link = document.createElement('link');
    link.id = 'arcanoEditorFonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=IM+Fell+English&family=MedievalSharp&family=Pirata+One&family=Spectral:wght@300;400;500&family=Uncial+Antiqua&family=UnifrakturCook:wght@700&display=swap';
    document.head.appendChild(link);
  }
  /* Tamanhos absolutos em px para evitar composição em wraps aninhados. */
  const RT_FONT_SIZES = [
    { id: '10px', label: '10' },
    { id: '12px', label: '12' },
    { id: '14px', label: '14' },
    { id: '',     label: '16' },
    { id: '18px', label: '18' },
    { id: '22px', label: '22' },
    { id: '28px', label: '28' },
    { id: '36px', label: '36' },
    { id: '48px', label: '48' }
  ];
  /* Cores rápidas oferecidas no popover de cor da linha divisória.
     '' = padrão da categoria (cor herdada do tema, sem inline style). */
  const RT_HR_COLORS = ['', '#a78bfa', '#22d3ee', '#10b981', '#f59e0b', '#f43f5e', '#f3eefe'];

  function editorToolbarHTML(initialHtml) {
    const palette = ['#f3eefe','#a78bfa','#22d3ee','#10b981','#f59e0b','#f43f5e','#ec4899'];
    return `
      <div class="editor">
        <div class="editor__toolbar" id="editorToolbar" role="toolbar" aria-label="Formatação">
          <button type="button" class="rt-btn" data-cmd="bold" title="Negrito (Ctrl+B)"><strong>B</strong></button>
          <button type="button" class="rt-btn" data-cmd="italic" title="Itálico (Ctrl+I)"><em>I</em></button>
          <button type="button" class="rt-btn" data-cmd="underline" title="Sublinhado (Ctrl+U)"><span style="text-decoration:underline">U</span></button>
          <button type="button" class="rt-btn" data-cmd="strikeThrough" title="Tachado"><span style="text-decoration:line-through">S</span></button>
          <span class="rt-sep"></span>
          <button type="button" class="rt-btn rt-btn--text" data-cmd="formatBlock" data-arg="H2" title="Título grande">H2</button>
          <button type="button" class="rt-btn rt-btn--text" data-cmd="formatBlock" data-arg="H3" title="Título médio">H3</button>
          <button type="button" class="rt-btn" data-cmd="formatBlock" data-arg="P" title="Parágrafo">¶</button>
          <button type="button" class="rt-btn" data-cmd="formatBlock" data-arg="BLOCKQUOTE" title="Citação">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h4v6H5v-3a3 3 0 0 1 3-3zM17 7h4v6h-6v-3a3 3 0 0 1 3-3z"/></svg>
          </button>
          <span class="rt-sep"></span>
          <label class="rt-select" title="Família da fonte">
            <select id="rtFontFamily" class="rt-select__input" aria-label="Família da fonte">
              ${RT_FONT_FAMILIES.map((f) => `<option value="${escapeHtml(f.id)}" style="${f.css ? `font-family:${f.css}` : ''}">${escapeHtml(f.label)}</option>`).join('')}
            </select>
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </label>
          <label class="rt-select rt-select--size" title="Tamanho do texto">
            <select id="rtFontSize" class="rt-select__input" aria-label="Tamanho do texto">
              ${RT_FONT_SIZES.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.label)}</option>`).join('')}
            </select>
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </label>
          <span class="rt-sep"></span>
          <button type="button" class="rt-btn" data-cmd="insertUnorderedList" title="Lista com marcadores">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="6" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="18" r="1" fill="currentColor"/><path d="M10 6h11M10 12h11M10 18h11"/></svg>
          </button>
          <button type="button" class="rt-btn" data-cmd="insertOrderedList" title="Lista numerada">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 6h11M10 12h11M10 18h11M4 6h2M4 18h3M4 12h3v0a2 2 0 0 1-2 2H4"/></svg>
          </button>
          <button type="button" class="rt-btn" data-cmd="justifyLeft" title="Alinhar à esquerda">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h12M3 18h18"/></svg>
          </button>
          <button type="button" class="rt-btn" data-cmd="justifyCenter" title="Centralizar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M6 12h12M3 18h18"/></svg>
          </button>
          <span class="rt-sep"></span>
          <button type="button" class="rt-btn" data-rt-action="link" title="Link para outra história">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
          </button>
          <button type="button" class="rt-btn rt-btn--image" data-rt-action="image" title="Inserir imagem entre os parágrafos" aria-label="Inserir imagem entre os parágrafos">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg><span>Imagem</span>
          </button>
          <span class="rt-hr" id="rtHrWrap">
            <button type="button" class="rt-btn" data-rt-action="hr" title="Linha separadora (clique para escolher cor)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h18M6 6l-2 2M18 6l2 2M6 18l-2-2M18 18l2-2"/></svg>
            </button>
            <div class="rt-hr__popover" id="rtHrPopover" hidden role="dialog" aria-label="Cor da linha divisória">
              <span class="rt-hr__label">Cor da linha</span>
              <div class="rt-hr__swatches">
                ${RT_HR_COLORS.map((c) => `
                  <button type="button" class="rt-hr__swatch ${c ? '' : 'rt-hr__swatch--default'}" data-hr-color="${escapeHtml(c)}" style="${c ? `background:${c}` : ''}" title="${c || 'Padrão da categoria'}" aria-label="${c ? `Cor ${c}` : 'Padrão da categoria'}">
                    ${c ? '' : '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 12h18"/></svg>'}
                  </button>
                `).join('')}
                <label class="rt-hr__custom" title="Cor personalizada">
                  <span class="rt-hr__custom-swatch" id="rtHrCustomSwatch" style="background:#a78bfa"></span>
                  <input type="color" id="rtHrCustom" value="#a78bfa" aria-label="Cor personalizada">
                </label>
              </div>
            </div>
          </span>
          <button type="button" class="rt-btn rt-btn--text" data-rt-action="code" title="Código">&lt;/&gt;</button>
          <span class="rt-sep"></span>
          <label class="rt-color" title="Cor do texto">
            <span class="rt-color__swatch" id="rtColorSwatch" style="background:#c4b5fd"></span>
            <span>Cor</span>
            <input type="color" id="rtColor" value="#c4b5fd" aria-label="Cor do texto">
          </label>
          <div class="rt-palette" aria-label="Paleta rápida">
            ${palette.map((c) => `
              <button type="button" class="rt-swatch" data-color="${c}" style="background:${c}" title="${c}" aria-label="Aplicar cor ${c}"></button>
            `).join('')}
          </div>
          <div class="rt-saved" aria-label="Cores salvas">
            <span class="rt-saved__sep" aria-hidden="true"></span>
            <div class="rt-saved__list" id="rtSavedColors" data-empty-label="Nenhuma cor salva"></div>
            <button type="button" class="rt-btn rt-btn--save" id="rtSaveColor" title="Salvar a cor atual">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
          <span class="rt-sep"></span>
          <button type="button" class="rt-btn" data-cmd="removeFormat" title="Limpar formatação">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M5 19l8-8M11 5h8l-3 8"/></svg>
          </button>
        </div>
        <input type="file" id="rtImageInput" accept="image/png,image/jpeg,image/webp" hidden>
        <div class="rt-editor" id="rtEditor" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Conte sua história...">${initialHtml ? sanitizeHtml(initialHtml) : ''}</div>
      </div>
    `;
  }

  /* ── CREATE / EDIT VIEW ───────────────────────── */
  function viewCreate(tabId, entryId, npcCtx) {
    if (!auth.isAdmin && !npcCtx) return viewForbidden();
    const tab = tabById(tabId);
    if (!tab || !isCreatable(tabId)) return viewNotFound(tabId);

    const editing = !!entryId;
    const existingEntry = editing ? (npcCtx ? npcCtx.npc : entryById(entryId)) : null;
    if (editing && (!existingEntry || canonicalTabId(existingEntry.tab) !== canonicalTabId(tabId))) {
      return viewNotFound(entryId);
    }

    if (isMagiasTab(tabId)) return spellCreateView(tabId, entryId, editing, existingEntry);

    const theme = themeOf(tabId);
    const portrait = isPortrait(tabId);
    const isItens = tabId === 'Itens';
    const isRacas = tabId === 'Racas';
    const isBestiario = tabId === 'Bestiario';
    const isStories = tabId === 'Historias';
    const isEras = tabId === 'Eras';
    const isSectioned = isSectionedTab(tabId);

    const banner = bannerLabelFor(tabId);
    const bannerStyle = bannerStyleFor(tabId);
    const titleLabel = isEras ? 'Nome da era' : ((isItens || isSectioned) ? 'Nome' : 'Título');
    const titlePlaceholder = isEras
      ? 'Nome definido pelo Mestre'
      : (isItens ? 'Nome do item' : (isRacas ? 'Nome da raça' : (isBestiario ? 'Nome da criatura' : 'Dê um nome à sua história')));
    const summaryPlaceholder = isEras
      ? 'Descrição breve desta era'
      : `Uma frase curta que descreve ${isItens ? 'o item' : (isRacas ? 'a raça' : (isBestiario ? 'a criatura' : 'a história'))}`;
    const descLabel = isStories
      ? 'Relato'
      : (isEras ? 'Descrição da era' : ((isItens || isSectioned) ? 'Descrição' : 'Texto'));

    const saveLabel = editing
      ? 'Salvar alterações'
      : (isStories
          ? 'Salvar acontecimento'
          : (isEras
              ? 'Salvar era'
              : (isItens ? 'Salvar item' : (isRacas ? 'Salvar raça' : (isBestiario ? 'Salvar criatura' : 'Salvar história')))));
    const heroSubtitle = editing
      ? 'Atualize os campos e salve para sobrescrever esta entrada.'
      : (isItens
          ? 'Escolha o tipo, anexe uma imagem 4:3 e preencha o dossiê.'
          : isRacas
            ? 'Construa identidade, fisiologia, regras, anatomia, aptidões e vínculos com o mundo.'
            : isBestiario
              ? 'Anexe uma imagem 3:4 e organize natureza, vitalidade, instruções, espólios e habilidades.'
              : isStories
                ? 'Posicione o acontecimento no tempo e construa o relato com texto, imagens e ritmo.'
                : isEras
                  ? 'Defina a identidade, os limites e a ordem desta era no Cronoscópio.'
                  : 'Preencha o banner, o título e o relato. Use a barra de ferramentas para formatar e colorir o texto.');
    const heroH1 = editing
      ? `Editar ${isStories ? 'acontecimento' : (isEras ? 'era' : (isItens ? 'item' : (isRacas ? 'raça' : (isBestiario ? 'criatura' : 'história'))))} · `
      : (isStories
          ? 'Novo acontecimento · '
          : (isEras
              ? 'Nova era · '
              : (isItens ? 'Novo item em ' : (isRacas ? 'Nova raça em ' : (isBestiario ? 'Nova criatura em ' : 'Nova história em ')))));
    const heroEyebrow = editing ? `EDITAR · ${theme.label}` : `CRIAR · ${theme.label}`;
    const cancelHref = editing ? `#/${tabId}/${entryId}` : `#/${tabId}`;

    const initial = editing ? {
      title: existingEntry.title || '',
      summary: existingEntry.summary || '',
      bodyHtml: existingEntry.bodyHtml || (existingEntry.body || []).map((p) => `<p>${escapeHtml(p)}</p>`).join(''),
      tags: existingEntry.tags || [],
      image: existingEntry.image || '',
      imagePath: existingEntry.imagePath || '',
      subtype: existingEntry.subtype || '',
      fields: existingEntry.fields || {}
    } : null;

    const subtypeActiveKey = editing && initial.subtype ? initial.subtype : ITEM_SUBTYPE_KEYS[0];
    const previewStyle = editing && initial.image
      ? `background-image:url('${initial.image}')`
      : '';

    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf(tabId)}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(heroEyebrow)}</span>
          <h1 class="cat-hero__title">${escapeHtml(heroH1)}${escapeHtml(editing ? existingEntry.title : tab.title)}</h1>
          <p class="cat-hero__tone">${escapeHtml(heroSubtitle)}</p>
        </div>
      </section>

      <form class="create-form ${portrait ? 'create-form--portrait' : ''} ${isRacas ? 'race-creator' : ''} ${(isStories || isEras) ? 'narrative-creator' : ''}" id="createForm"
            data-tab="${escapeHtml(tabId)}"
            ${editing ? `data-edit-id="${escapeHtml(entryId)}"` : ''}
            style="--hue:${theme.hue}" novalidate>
        ${isRacas ? `
        <aside class="race-creator__nav" aria-label="Etapas da criação de raça">
          <header>
            <span>${editing ? 'EDIÇÃO DO ATLAS' : 'NOVO REGISTRO'}</span>
            <strong>${editing ? 'Revisar raça' : 'Criar raça'}</strong>
            <p>Construa o povo capítulo por capítulo.</p>
          </header>
          <div class="race-creator__progress"><i data-race-wizard-progress></i></div>
          <nav>
            ${[
              ['Identidade', 'Imagem, nome e natureza'],
              ['Fisiologia', 'Corpo, sentidos e limites'],
              ['Corpo e regras', 'Atributos, Mana e anatomia'],
              ['Heranças', 'Aptidões e limitações'],
              ['Presença no mundo', 'Territórios, culturas e crenças'],
              ['Relato', 'Tags, história e revisão']
            ].map(([label, hint], index) => `<button type="button" class="race-creator__step ${index === 0 ? 'is-active' : ''}" data-race-wizard-go="${index}" aria-current="${index === 0 ? 'step' : 'false'}"><b>${String(index + 1).padStart(2, '0')}</b><span><strong>${label}</strong><small>${hint}</small></span></button>`).join('')}
          </nav>
          <a href="${cancelHref}" class="race-creator__cancel">Cancelar e voltar</a>
        </aside>
        <div class="race-creator__mobile-progress" aria-live="polite"><span data-race-wizard-label>01 · Identidade</span><small data-race-wizard-count>1 de 6</small></div>
        <section class="race-creator__page race-creator__page--identity" data-race-wizard-page="0">
          <header class="race-creator__page-head"><b><i>I</i></b><span><small>PRIMEIRO CAPÍTULO</small><h2>Identidade do povo</h2><p>A imagem, o nome e a frase que tornam esta raça reconhecível no Atlas.</p></span></header>
        ` : ''}
        ${isItens ? `
        <div class="create-form__field">
          <label class="create-form__label">${hintedLabel('Tipo', 'Escolha o modelo do item para carregar os campos certos sem preencher dados desnecessários.')}</label>
          <div class="subtype-tabs" id="subtypeTabs" role="tablist">
            ${ITEM_SUBTYPE_KEYS.map((key) => `
              <button type="button" class="subtype-tab ${key === subtypeActiveKey ? 'is-active' : ''}" data-subtype="${key}" role="tab"
                      aria-selected="${key === subtypeActiveKey ? 'true' : 'false'}"
                      data-tip="${escapeHtml(ITEM_SUBTYPE_HINTS[key] || '')}"
                      aria-label="${escapeHtml(ITEM_SUBTYPES[key].label)}. ${escapeHtml(ITEM_SUBTYPE_HINTS[key] || '')}">
                <span class="subtype-tab__icon">${ITEM_SUBTYPES[key].icon}</span>
                <span class="subtype-tab__label">${escapeHtml(ITEM_SUBTYPES[key].label)}</span>
              </button>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="create-form__field">
          <label class="create-form__label">${hintedLabel(banner.label, isItens ? 'Imagem 4:3 funciona melhor para cards e detalhes de item. Evite texto pequeno na arte.' : banner.hint)}</label>
          <div class="banner-drop ${portrait ? 'banner-drop--portrait' : ''}" id="bannerDrop"
               style="${bannerStyle}"
               tabindex="0" role="button" aria-label="Selecionar imagem do banner">
            <input type="file" accept="image/*" id="bannerInput" hidden>
            <div class="banner-drop__preview" id="bannerPreview" ${editing && initial.image ? '' : 'hidden'} style="${previewStyle}"></div>
            <div class="banner-drop__placeholder" id="bannerPlaceholder" ${editing && initial.image ? 'hidden' : ''}>
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 17l-5-5-9 9"/></svg>
              <strong>Clique ou arraste uma imagem</strong>
              <span>${escapeHtml(banner.hint)}</span>
            </div>
            <button type="button" class="banner-drop__clear" id="bannerClear" ${editing && initial.image ? '' : 'hidden'} aria-label="Remover imagem">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="titleInput">${isItens ? hintedLabel(titleLabel, 'Use um nome curto e distinto; ele aparece em listas, busca e inventário.') : escapeHtml(titleLabel)}</label>
          <input type="text" id="titleInput" class="create-form__input" placeholder="${escapeHtml(titlePlaceholder)}" maxlength="120" required value="${editing ? escapeHtml(initial.title) : ''}">
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="summaryInput">${isItens ? hintedLabel('Resumo (opcional)', 'Uma linha clara ajuda a reconhecer o item no inventário e nos resultados de busca.') : 'Resumo (opcional)'}</label>
          <input type="text" id="summaryInput" class="create-form__input" placeholder="${escapeHtml(summaryPlaceholder)}" maxlength="200" value="${editing ? escapeHtml(initial.summary) : ''}">
        </div>

        ${isStories ? `
        <section class="narrative-context" aria-labelledby="narrativeContextTitle">
          <header><span>II</span><div><small>CONTEXTO TEMPORAL</small><h2 id="narrativeContextTitle">Onde o destino toca a história</h2><p>Esses campos posicionam o acontecimento no Cronoscópio.</p></div></header>
          <div class="narrative-context__grid">
            <label class="create-form__field" for="narrativeEra"><span class="create-form__label">Era</span><select class="create-form__input" id="narrativeEra" required><option value="">Selecione uma era</option>${narrativeEraEntries().map((era) => `<option value="${escapeHtml(era.id)}" ${editing && initial.fields.Era === era.id ? 'selected' : ''}>${escapeHtml(era.title)}</option>`).join('')}</select></label>
            <label class="create-form__field" for="narrativeDate"><span class="create-form__label">Data no mundo</span><input class="create-form__input" id="narrativeDate" value="${editing ? escapeHtml(initial.fields['Data no mundo'] || '') : ''}" placeholder="Ex.: Ano 638 ou Décimo inverno"></label>
            <label class="create-form__field" for="narrativePosition"><span class="create-form__label">Posição dentro da era <b data-narrative-position-label>${editing ? escapeHtml(initial.fields['Posição temporal'] ?? 50) : '50'}%</b></span><input id="narrativePosition" type="range" min="0" max="100" value="${editing ? escapeHtml(initial.fields['Posição temporal'] ?? 50) : '50'}"></label>
            <label class="create-form__field" for="narrativeReality"><span class="create-form__label">Realidade</span><select class="create-form__input" id="narrativeReality"><option value="Cânone" ${!editing || initial.fields.Realidade !== 'Realidade alternativa' ? 'selected' : ''}>Linha principal</option><option ${editing && initial.fields.Realidade === 'Realidade alternativa' ? 'selected' : ''}>Realidade alternativa</option></select></label>
            <label class="create-form__field" for="narrativeImportance"><span class="create-form__label">Natureza</span><select class="create-form__input" id="narrativeImportance">${['Vestígio','Descoberta','Pacto','Ascensão','Guerra','Catástrofe','Ruptura de era','Fim'].map((value) => `<option ${editing && initial.fields.Importância === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
            <label class="create-form__field" for="narrativeDivergence"><span class="create-form__label">Ponto de divergência</span><select class="create-form__input" id="narrativeDivergence"><option value="">Nenhum — linha principal</option>${narrativeEvents().filter((entry) => entry.id !== entryId && !narrativeIsBranch(entry)).map((entry) => `<option value="${escapeHtml(entry.id)}" ${editing && initial.fields['Ponto de divergência'] === entry.id ? 'selected' : ''}>${escapeHtml(entry.title)}</option>`).join('')}</select></label>
          </div>
        </section>` : ''}

        ${isEras ? `
        <section class="narrative-context" aria-labelledby="eraContextTitle">
          <header><span>II</span><div><small>LIMITES DA ERA</small><h2 id="eraContextTitle">Um capítulo do mundo</h2><p>Ordem e limites organizam a leitura sem prender o calendário a números absolutos.</p></div></header>
          <div class="narrative-context__grid">
            <label class="create-form__field" for="eraOrder"><span class="create-form__label">Ordem</span><input class="create-form__input" id="eraOrder" type="number" min="1" value="${editing ? escapeHtml(initial.fields.Ordem || '') : narrativeEraEntries().length + 1}" required></label>
            <label class="create-form__field" for="eraStart"><span class="create-form__label">Início</span><input class="create-form__input" id="eraStart" value="${editing ? escapeHtml(initial.fields.Início || '') : ''}" placeholder="Ex.: Antes do calendário"></label>
            <label class="create-form__field" for="eraEnd"><span class="create-form__label">Fim</span><input class="create-form__input" id="eraEnd" value="${editing ? escapeHtml(initial.fields.Fim || '') : ''}" placeholder="Ex.: Ano 300"></label>
            <label class="create-form__field" for="eraColor"><span class="create-form__label">Cor no Cronoscópio</span><input class="narrative-color" id="eraColor" type="color" value="${editing ? escapeHtml(initial.fields.Cor || '#a78bfa') : '#a78bfa'}"></label>
          </div>
        </section>` : ''}

        ${isRacas ? '</section>' : ''}

        ${isItens ? `
        <div class="create-form__field">
          <label class="create-form__label">${hintedLabel('Dossiê', 'Preencha só o que afeta regra, economia ou narrativa; campos vazios não aparecem na ficha do item.')}</label>
          <div class="dossier-fields" id="dossierFields"></div>
        </div>
        ` : ''}

        ${isSectioned && !isRacas ? `
        <div class="create-form__field">
          <label class="create-form__label">${isBestiario ? 'Ficha' : 'Dossiê'}</label>
          ${raceDossierFormHTML(tabId, editing ? initial.fields : {})}
        </div>
        ` : ''}

        ${isRacas ? raceDossierFormHTML(tabId, editing ? initial.fields : {}) : ''}

        ${isRacas ? `
        <section class="race-creator__page race-creator__page--story" data-race-wizard-page="5" hidden>
          <header class="race-creator__page-head"><b><i>VI</i></b><span><small>ÚLTIMO CAPÍTULO</small><h2>Relato e revisão</h2><p>Organize as marcas de busca, escreva a história e confira o registro antes de salvar.</p></span></header>
          <div class="race-creator__review" aria-live="polite">
            <span class="section__eyebrow">PRÉVIA DO REGISTRO</span>
            <div><strong data-race-review-name>${escapeHtml(editing ? initial.title : 'Raça sem nome')}</strong><small data-race-review-summary>${escapeHtml(editing && initial.summary ? initial.summary : 'Adicione uma frase de identidade.')}</small></div>
            <dl><div><dt>Partes anatômicas</dt><dd data-race-review-parts>—</dd></div><div><dt>Aptidões</dt><dd data-race-review-abilities>—</dd></div><div><dt>Vínculos</dt><dd data-race-review-relations>—</dd></div></dl>
          </div>
        ` : ''}

        <div class="create-form__field">
          <label class="create-form__label">Tags</label>
          <div class="tag-builder" id="tagBuilder">
            <div class="tag-builder__row">
              <input type="text" id="tagNameInput" class="create-form__input tag-builder__name" placeholder="Ex.: Tempo, Fome, Reino" maxlength="32" autocomplete="off">
              <label class="tag-builder__color" title="Cor da nova tag">
                <span id="tagColorPreview" style="background:${DEFAULT_TAG_COLOR}"></span>
                <input type="color" id="tagColorInput" value="${DEFAULT_TAG_COLOR}" aria-label="Cor da nova tag">
              </label>
              <button type="button" class="btn btn-ghost tag-builder__add" id="tagAddBtn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span>Adicionar</span>
              </button>
            </div>
            <div class="tag-builder__suggestions tag-suggest" id="tagSuggestions" aria-live="polite"></div>
            <div class="tag-builder__list" id="tagList" aria-live="polite"></div>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label">${isItens ? hintedLabel(descLabel, 'Use este espaço para lore, aparência, origem e consequências que não cabem no dossiê técnico.') : escapeHtml(descLabel)}</label>
          ${editorToolbarHTML(editing ? initial.bodyHtml : '')}
        </div>

        ${isRacas ? '</section>' : ''}

        ${isRacas ? `
        <div class="race-creator__controls">
          <button type="button" class="btn btn-ghost" data-race-wizard-prev hidden>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5m7-7-7 7 7 7"/></svg><span>Anterior</span>
          </button>
          <span><b data-race-wizard-current>01</b><small>/ 06</small></span>
          <button type="button" class="btn btn-primary" data-race-wizard-next><span>Próximo capítulo</span><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></button>
        </div>
        ` : ''}

        <div class="create-form__actions ${isRacas ? 'race-creator__final-actions' : ''}" ${isRacas ? 'data-race-wizard-page="5" hidden' : ''}>
          <a href="${cancelHref}" class="btn btn-ghost">Cancelar</a>
          ${isStories ? '<button type="button" class="btn btn-ghost" data-story-preview>Visualizar como leitor</button>' : ''}
          <button type="submit" class="btn btn-primary" id="createSave">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span>${escapeHtml(saveLabel)}</span>
          </button>
        </div>
      </form>
    `;
  }

  /* ── MAGIAS: criação / edição ─────────────────── */
  function spellSelectHTML(id, options, selected, placeholder) {
    return `
      <div class="spell-select">
        <select id="${id}" class="spell-input">
          <option value="" disabled ${selected ? '' : 'selected'}>${escapeHtml(placeholder || '—')}</option>
          ${options.map((o) => `<option value="${escapeHtml(o)}" ${o === selected ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
        </select>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </div>`;
  }

  function spellCreateView(tabId, entryId, editing, existingEntry) {
    const theme = themeOf(tabId);
    const f = (editing && existingEntry.fields) ? existingEntry.fields : {};
    const type = (editing && isSpellType(existingEntry.subtype)) ? existingEntry.subtype : 'ativa';
    const affinity = f['Afinidade'] || '';
    const aff = affinityMeta(affinity);
    const scopeEntries = spellScopeEntries(f);
    const effectEntries = normalizeSpellEffects(f);
    const v = (x) => escapeHtml(x ?? '');
    const arcane = normalizeSpellArcaneFields(f);
    const heroEyebrow = editing ? `EDITAR · ${theme.label}` : `CRIAR · ${theme.label}`;
    const heroH1 = editing ? `Editar magia · ${existingEntry.title}` : 'Nova magia em Magias';
    const heroTone = 'Defina os atributos arcanos e os efeitos desta magia.';

    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf(tabId)}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(heroEyebrow)}</span>
          <h1 class="cat-hero__title">${escapeHtml(heroH1)}</h1>
          <p class="cat-hero__tone">${escapeHtml(heroTone)}</p>
        </div>
      </section>

      <form class="create-form spell-form" id="spellCreateForm"
            data-tab="${escapeHtml(tabId)}"
            ${editing ? `data-edit-id="${escapeHtml(entryId)}"` : ''}
            data-affinity="${v(affinity)}"
            style="--hue:${aff.hue};--accent:${aff.accent};--glow:${aff.glow}" novalidate>

        <div class="create-form__field">
          <label class="create-form__label">Tipo</label>
          <div class="spell-type-tabs" id="spellTypeTabs" role="tablist">
            ${SPELL_TYPE_KEYS.map((key) => `
              <button type="button" class="spell-type-tab ${key === type ? 'is-active' : ''}" data-spell-type="${key}" role="tab" aria-selected="${key === type}">
                <span class="spell-type-tab__icon">${SPELL_TYPES[key].icon}</span>
                <span class="spell-type-tab__label">${escapeHtml(SPELL_TYPES[key].label)}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="spellName">Nome</label>
          <input type="text" id="spellName" class="create-form__input" placeholder="Nome da magia" maxlength="120" required value="${editing ? v(existingEntry.title) : ''}">
        </div>

        <div class="create-form__field">
          <label class="create-form__label">Imagem <span class="spell-opt">(opcional)</span></label>
          <div class="banner-drop banner-drop--spell" id="bannerDrop" tabindex="0" role="button" aria-label="Selecionar imagem da magia">
            <input type="file" accept="image/*" id="bannerInput" hidden>
            <div class="banner-drop__preview" id="bannerPreview" ${editing && existingEntry.image ? '' : 'hidden'} style="${editing && existingEntry.image ? `background-image:url('${existingEntry.image}')` : ''}"></div>
            <div class="banner-drop__placeholder" id="bannerPlaceholder" ${editing && existingEntry.image ? 'hidden' : ''}>
              <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 17l-5-5-9 9"/></svg>
              <strong>Clique ou arraste</strong>
              <span>Sigilo ou ilustração da magia</span>
            </div>
            <button type="button" class="banner-drop__clear" id="bannerClear" ${editing && existingEntry.image ? '' : 'hidden'} aria-label="Remover imagem">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label">Afinidade</label>
          <div class="affinity-picker" id="affinityPicker">
            ${SPELL_AFFINITY_KEYS.map((key) => {
              const a = SPELL_AFFINITIES[key];
              return `
                <button type="button" class="affinity-chip ${key === affinity ? 'is-active' : ''}" data-affinity="${escapeHtml(key)}"
                        style="--a-hue:${a.hue};--a-accent:${a.accent};--a-glow:${a.glow}" aria-pressed="${key === affinity}">
                  <span class="affinity-chip__icon">${a.icon}</span>
                  <span class="affinity-chip__label">${escapeHtml(a.label)}</span>
                </button>`;
            }).join('')}
          </div>
          <input type="hidden" id="spellAffinity" value="${v(affinity)}">
        </div>

        <section class="spell-history-form" aria-label="Características arcanas">
          <div class="spell-history-form__head">
            <span>Características arcanas</span>
            <p>Defina a classificação, o grau de controle e a forma de uso.</p>
          </div>
          <div class="create-form__row create-form__row--history">
            <div class="create-form__field">
              <label class="create-form__label" for="spClassification">Classificação Arcana</label>
              ${spellSelectHTML('spClassification', SPELL_CLASSIFICATIONS, arcane.classificacao, '—')}
            </div>
            <div class="create-form__field">
              <label class="create-form__label" for="spControlLevel">Grau de Controle</label>
              ${spellSelectHTML('spControlLevel', SPELL_CONTROL_LEVELS, arcane.control, '—')}
            </div>
            <div class="create-form__field">
              <label class="create-form__label" for="spUseForm">Forma de Uso</label>
              ${spellSelectHTML('spUseForm', SPELL_USE_FORMS, arcane.useForm, '—')}
            </div>
          </div>
        </section>

        <div class="create-form__field">
          <label class="create-form__label" for="spCusto">Custo <span class="spell-opt" id="spCustoHint" ${type === 'passiva' ? '' : 'hidden'}>(opcional)</span></label>
          <div class="cost-input">
            <input type="number" id="spCusto" class="create-form__input" min="0" placeholder="Valor" value="${v(f['Custo'])}">
            <div class="spell-select cost-input__unit">
              <select id="spCustoUnidade" class="create-form__input">
                ${COST_UNITS.map((u) => `<option value="${u}" ${safeCostUnit(f['CustoUnidade'] || 'MP') === u ? 'selected' : ''}>${u}</option>`).join('')}
              </select>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label">Escopo <span class="spell-opt">— marque cada escopo e descreva seu efeito</span></label>
          <div class="scope-builder" id="scopeBuilder">
            ${SPELL_SCOPE_KEYS.map((s) => {
              const found = scopeEntries.find((x) => x.tipo === s);
              const on = !!found;
              return `
                <div class="scope-item ${on ? 'is-on' : ''}" data-scope="${escapeHtml(s)}" style="--pill:${scopeColor(s)}">
                  <button type="button" class="scope-toggle" aria-pressed="${on}">
                    <span class="scope-toggle__ic">${scopeIcon(s)}</span>
                    <span class="scope-toggle__label">${escapeHtml(s)}</span>
                    <span class="scope-toggle__check" aria-hidden="true"></span>
                  </button>
                  <input type="text" class="create-form__input scope-detail" maxlength="200"
                         placeholder="${escapeHtml(SCOPE_PLACEHOLDERS[s] || 'Descreva o efeito')}"
                         value="${found ? v(found.detalhe) : ''}" ${on ? '' : 'disabled'}>
                </div>`;
            }).join('')}
          </div>
        </div>

        <!-- ATIVA -->
        <div data-spell-group="ativa" ${type === 'ativa' ? '' : 'hidden'}>
          <div class="create-form__row">
            <div class="create-form__field">
              <label class="create-form__label" for="spAlcance">Alcance</label>
              <input type="number" id="spAlcance" class="create-form__input" min="0" placeholder="Quadrados (1q = 1m)" value="${v(f['Alcance'])}">
            </div>
            <div class="create-form__field">
              <label class="create-form__label">Área</label>
              <div class="spell-area">
                <input type="number" id="spAreaL" class="create-form__input" min="0" placeholder="X" value="${v(f['AreaLargura'])}">
                <span class="spell-area__x">×</span>
                <input type="number" id="spAreaA" class="create-form__input" min="0" placeholder="X q" value="${v(f['AreaAltura'])}">
              </div>
            </div>
          </div>
          <div class="create-form__field">
            <label class="create-form__label" for="spDuracao">Duração</label>
            ${spellSelectHTML('spDuracao', DURATION_OPTIONS, f['Duração'] || '', '—')}
          </div>
          <div class="create-form__field">
            <label class="create-form__label" for="spDescricao">Descrição</label>
            <textarea id="spDescricao" class="create-form__input spell-textarea" rows="3" placeholder="Descreva a magia...">${v(f['Descrição'])}</textarea>
          </div>
        </div>

        <!-- PASSIVA -->
        <div data-spell-group="passiva" ${type === 'passiva' ? '' : 'hidden'}>
          <div class="create-form__field">
            <label class="create-form__label" for="spAtivacao">Condição de Ativação</label>
            ${spellSelectHTML('spAtivacao', ACTIVATION_OPTIONS, f['Condição de Ativação'] || '', '—')}
          </div>
          <div class="create-form__field">
            <label class="create-form__label" for="spEfeitoContinuo">Efeito Contínuo</label>
            <textarea id="spEfeitoContinuo" class="create-form__input spell-textarea" rows="3" placeholder="O que a passiva faz permanentemente...">${v(f['Efeito Contínuo'])}</textarea>
          </div>
          <div class="create-form__field">
            <label class="create-form__label" for="spManutencao">Manutenção <span class="spell-opt">(opcional · por turno)</span></label>
            <input type="number" id="spManutencao" class="create-form__input" min="0" placeholder="Custo recorrente por turno" value="${v(f['Manutenção'])}">
          </div>
        </div>

        ${combatFormHTML(f.Combate || (editing ? combatFromSpell(f, type).combat : null), 'magia')}

        <div class="create-form__field">
          <div class="spell-effects-builder" id="spellEffectsBuilder">
            <div class="spell-effects-builder__head">
              <div>
                <label class="create-form__label">Efeitos adicionais</label>
                <p>Notas opcionais para variações, gatilhos, upgrades, penalidades e exceções da magia.</p>
              </div>
              <span class="spell-effects-builder__badge">modular</span>
            </div>
            <div class="spell-effect-form-list" data-effect-list>
              ${(effectEntries.length ? effectEntries : [{}]).map((effect, index) => spellEffectFormRowHTML(effect, index)).join('')}
            </div>
            <button type="button" class="btn btn-ghost spell-effect-add" data-effect-add>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              <span>Adicionar efeito</span>
            </button>
          </div>
        </div>

        <p class="create-form__error" id="spellError" hidden></p>

        <div class="create-form__actions">
          <a href="${editing ? `#/${tabId}/${entryId}` : `#/${tabId}`}" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" id="spellSave">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span>${editing ? 'Salvar alterações' : 'Salvar magia'}</span>
          </button>
        </div>
      </form>
    `;
  }

  function attachSpellForm() {
    const form = document.getElementById('spellCreateForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    const tabId = form.dataset.tab;
    const editId = form.dataset.editId || '';
    const editing = !!editId;
    const existing = editing ? entryById(editId) : null;

    const $f = (id) => document.getElementById(id);
    const errorBox = $f('spellError');
    const submitBtn = $f('spellSave');
    const banner = bindBannerDrop({ initialUrl: existing?.image || '' });
    let type = (existing && isSpellType(existing.subtype)) ? existing.subtype : 'ativa';

    const custoHint = $f('spCustoHint');
    const showGroups = () => {
      form.querySelectorAll('[data-spell-group]').forEach((el) => {
        el.hidden = el.dataset.spellGroup !== type;
      });
      if (custoHint) custoHint.hidden = (type !== 'passiva');
    };

    // Toggle tipo
    form.querySelector('#spellTypeTabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.spell-type-tab');
      if (!btn) return;
      type = btn.dataset.spellType;
      form.querySelectorAll('.spell-type-tab').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      showGroups();
    });

    // Afinidade
    const affHidden = $f('spellAffinity');
    form.querySelector('#affinityPicker').addEventListener('click', (e) => {
      const btn = e.target.closest('.affinity-chip');
      if (!btn) return;
      const key = btn.dataset.affinity;
      affHidden.value = key;
      form.querySelectorAll('.affinity-chip').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      const a = affinityMeta(key);
      form.style.setProperty('--hue', a.hue);
      form.style.setProperty('--accent', a.accent);
      form.style.setProperty('--glow', a.glow);
      form.dataset.affinity = key;
    });

    // Escopos dinâmicos: ligar/desligar e habilitar o campo de detalhe
    form.querySelector('#scopeBuilder').addEventListener('click', (e) => {
      const toggle = e.target.closest('.scope-toggle');
      if (!toggle) return;
      const item = toggle.closest('.scope-item');
      const on = !item.classList.contains('is-on');
      item.classList.toggle('is-on', on);
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      const detail = item.querySelector('.scope-detail');
      detail.disabled = !on;
      form.querySelector('#scopeBuilder').classList.remove('is-invalid');
      if (on) detail.focus(); else { detail.value = ''; detail.classList.remove('is-invalid'); }
    });

    const getScopeEntries = () =>
      [...form.querySelectorAll('#scopeBuilder .scope-item.is-on')].map((item) => ({
        tipo: item.dataset.scope,
        detalhe: item.querySelector('.scope-detail').value.trim()
      }));

    const effectsBuilder = form.querySelector('#spellEffectsBuilder');
    const effectList = effectsBuilder ? effectsBuilder.querySelector('[data-effect-list]') : null;
    const refreshEffectRows = () => {
      if (!effectList) return;
      [...effectList.querySelectorAll('[data-effect-row]')].forEach((row, index) => {
        const label = row.querySelector('.spell-effect-preview__label');
        if (label) label.textContent = `Nota ${index + 1}`;
      });
    };
    if (effectsBuilder && effectList) {
      effectsBuilder.addEventListener('click', (evt) => {
        const add = evt.target.closest('[data-effect-add]');
        if (add) {
          const index = effectList.querySelectorAll('[data-effect-row]').length;
          effectList.insertAdjacentHTML('beforeend', spellEffectFormRowHTML({}, index));
          refreshEffectRows();
          const row = effectList.querySelector('[data-effect-row]:last-child');
          row?.querySelector('[data-effect-title]')?.focus();
          return;
        }

        const remove = evt.target.closest('[data-effect-remove]');
        if (remove) {
          remove.closest('[data-effect-row]')?.remove();
          if (!effectList.querySelector('[data-effect-row]')) {
            effectList.insertAdjacentHTML('beforeend', spellEffectFormRowHTML({}, 0));
          }
          refreshEffectRows();
          return;
        }

        const symbol = evt.target.closest('[data-effect-symbol]');
        if (symbol) {
          const row = symbol.closest('[data-effect-row]');
          row?.querySelectorAll('[data-effect-symbol]').forEach((btn) => {
            const on = btn === symbol;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          const hidden = row?.querySelector('[data-effect-symbol-value]');
          if (hidden) hidden.value = symbol.dataset.effectSymbol || '';
          const preview = row?.querySelector('.spell-effect-preview__symbol');
          if (preview) preview.textContent = symbol.dataset.effectSymbol || '';
          return;
        }

        const color = evt.target.closest('[data-effect-color]');
        if (color) {
          const row = color.closest('[data-effect-row]');
          const value = safeSpellEffectColor(color.dataset.effectColor);
          row?.querySelectorAll('[data-effect-color]').forEach((btn) => {
            const on = btn === color;
            btn.classList.toggle('is-active', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          row?.style.setProperty('--effect', value);
          const hidden = row?.querySelector('[data-effect-color-value]');
          if (hidden) hidden.value = value;
        }
      });
    }

    const readSpellEffects = () => {
      if (!effectList) return [];
      return [...effectList.querySelectorAll('[data-effect-row]')]
        .map((row, index) => {
          const title = row.querySelector('[data-effect-title]')?.value.trim() || '';
          const text = row.querySelector('[data-effect-text]')?.value.trim() || '';
          if (!title && !text) return null;
          return {
            title: title || `Efeito ${index + 1}`,
            text,
            symbol: row.querySelector('[data-effect-symbol-value]')?.value || SPELL_EFFECT_SYMBOLS[index % SPELL_EFFECT_SYMBOLS.length],
            color: safeSpellEffectColor(row.querySelector('[data-effect-color-value]')?.value, SPELL_EFFECT_COLORS[index % SPELL_EFFECT_COLORS.length]),
            type: row.querySelector('[data-effect-type]')?.value || '',
            duration: row.querySelector('[data-effect-duration]')?.value || ''
          };
        })
        .filter(Boolean);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!sb) {
        toast('Supabase não configurado. Edite assets/js/config.js com sua URL e anon key.');
        return;
      }

      const val = (id) => ($f(id) ? $f(id).value.trim() : '');
      const name = val('spellName');
      const affinity = affHidden.value;
      const classification = val('spClassification');
      const controlLevel = val('spControlLevel');
      const useForm = val('spUseForm');
      const custo = val('spCusto');
      const custoUnidade = safeCostUnit($f('spCustoUnidade') ? $f('spCustoUnidade').value : 'MP');
      const scopeEntries = getScopeEntries();
      const spellEffects = readSpellEffects();
      const legacyEffectText = spellEffects.map((effect) => effect.text).filter(Boolean).join('\n');

      const missing = [];
      const clearInvalid = () => form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
      const mark = (id) => { const el = $f(id); if (el) el.classList.add('is-invalid'); };
      clearInvalid();

      if (!name) { missing.push('Nome'); mark('spellName'); }
      if (!affinity) { missing.push('Afinidade'); form.querySelector('#affinityPicker').classList.add('is-invalid'); }
      if (!classification) { missing.push('Classifica\u00e7\u00e3o Arcana'); mark('spClassification'); }
      if (!controlLevel) { missing.push('Grau de Controle'); mark('spControlLevel'); }
      if (!useForm) { missing.push('Forma de Uso'); mark('spUseForm'); }
      // Custo é obrigatório nas ativas; opcional nas passivas
      if (type === 'ativa' && !custo) { missing.push('Custo'); mark('spCusto'); }
      // Escopos: ao menos um, e cada um precisa do detalhe escrito
      if (!scopeEntries.length) {
        missing.push('Escopo');
        form.querySelector('#scopeBuilder').classList.add('is-invalid');
      } else {
        scopeEntries.forEach((s) => {
          if (!s.detalhe) {
            missing.push('detalhe de ' + s.tipo);
            const item = form.querySelector(`.scope-item[data-scope="${s.tipo}"]`);
            if (item) item.querySelector('.scope-detail').classList.add('is-invalid');
          }
        });
      }

      const arcaneFields = {
        'Classifica\u00e7\u00e3o Arcana': classification,
        'Grau de Controle': controlLevel,
        'Forma de Uso': useForm
      };

      let fields, summary;
      if (type === 'ativa') {
        const alcance = val('spAlcance');
        const areaL = val('spAreaL'), areaA = val('spAreaA');
        const duracao = val('spDuracao'), descricao = val('spDescricao');
        if (!alcance) { missing.push('Alcance'); mark('spAlcance'); }
        if (!areaL) { missing.push('Área'); mark('spAreaL'); }
        if (!areaA) { missing.push('Área'); mark('spAreaA'); }
        if (!duracao) { missing.push('Duração'); mark('spDuracao'); }
        if (!descricao) { missing.push('Descrição'); mark('spDescricao'); }
        fields = {
          ...arcaneFields,
          Custo: custo, CustoUnidade: custoUnidade, Alcance: alcance,
          AreaLargura: areaL, AreaAltura: areaA,
          'Duração': duracao, Afinidade: affinity,
          Escopos: scopeEntries, 'Descrição': descricao,
          'Efeitos Adicionais': spellEffects,
          'Efeito Adicional': legacyEffectText
        };
        summary = descricao;
      } else {
        const ativacao = val('spAtivacao'), efeito = val('spEfeitoContinuo');
        if (!ativacao) { missing.push('Condição de Ativação'); mark('spAtivacao'); }
        if (!efeito) { missing.push('Efeito Contínuo'); mark('spEfeitoContinuo'); }
        fields = {
          ...arcaneFields,
          Custo: custo, CustoUnidade: custoUnidade,
          'Condição de Ativação': ativacao, Afinidade: affinity,
          Escopos: scopeEntries, 'Efeito Contínuo': efeito,
          'Manutenção': val('spManutencao')
        };
        fields['Efeitos Adicionais'] = spellEffects;
        fields['Efeito Adicional'] = legacyEffectText;
        summary = efeito;
      }

      const combatRoot = form.querySelector('[data-combat-form]');
      if (combatFormErrors(combatRoot).length) missing.push('dados de dano no formato 3d6');
      fields.Combate = readCombatForm(combatRoot);
      if (editing && existing && existing.fields) {
        /* Mantém campos que este formulário não edita (Era, Linhagem…). */
        fields = { ...existing.fields, ...fields };
      }

      if (missing.length) {
        errorBox.textContent = 'Preencha os campos obrigatórios: ' + [...new Set(missing)].join(', ') + '.';
        errorBox.hidden = false;
        const firstBad = form.querySelector('.is-invalid');
        if (firstBad && firstBad.focus) firstBad.focus();
        return;
      }
      errorBox.hidden = true;

      submitBtn.disabled = true;
      const originalLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Salvando…</span>';

      try {
        if (editing) {
          const file = banner.getFile();
          const currentDataUrl = banner.getDataUrl();
          let nextImage = existing.image || '';
          let nextImagePath = existing.imagePath || '';
          const toRemove = [];
          if (file) {
            const up = await uploadBanner(file, `spells/${existing.id}`);
            if (existing.imagePath) toRemove.push(existing.imagePath);
            nextImage = up.url; nextImagePath = up.path;
          } else if (!currentDataUrl && existing.image) {
            if (existing.imagePath) toRemove.push(existing.imagePath);
            nextImage = ''; nextImagePath = '';
          }
          const updated = {
            ...existing, tab: tabId, subtype: type,
            title: name, summary: (summary || '').slice(0, 200),
            image: nextImage, imagePath: nextImagePath,
            fields, bodyHtml: '', tags: []
          };
          await updateUserEntry(updated);
          const i = ARCHIVE.entries.indexOf(existing);
          if (i >= 0) ARCHIVE.entries[i] = updated;
          for (const p of toRemove) await removeBanner(p);
          location.hash = `#/${tabId}/${updated.id}`;
        } else {
          const id = uniqueId(slugify(name));
          let imageUrl = '', imagePath = '';
          const file = banner.getFile();
          if (file) {
            const up = await uploadBanner(file, `spells/${id}`);
            imageUrl = up.url; imagePath = up.path;
          }
          const newEntry = {
            id, tab: tabId, subtype: type,
            title: name, summary: (summary || '').slice(0, 200),
            image: imageUrl, imagePath, bodyHtml: '', tags: [],
            fields, createdAt: Date.now(), isUserCreated: true
          };
          try {
            await persistUserEntry(newEntry);
          } catch (err) {
            if (imagePath) await removeBanner(imagePath);
            throw err;
          }
          ARCHIVE.entries.push(newEntry);
          location.hash = `#/${tabId}/${id}`;
        }
      } catch (err) {
        console.error(err);
        toast('Erro ao salvar: ' + (err.message || err));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
    });

    showGroups();
  }

  /* ── MAGIAS: ficha detalhada (viewEntry) ──────── */
  function spellEntryView(tabId, e) {
    const tab = tabById(tabId);
    const f = e.fields || {};
    const type = isSpellType(e.subtype) ? e.subtype : 'ativa';
    const typeMeta = SPELL_TYPES[type];
    const aff = affinityMeta(f['Afinidade']);
    const scopeEntries = spellScopeEntries(f);
    const arcane = normalizeSpellArcaneFields(f);
    const unit = safeCostUnit(f['CustoUnidade'] || 'MP');

    const area = (f['AreaLargura'] && f['AreaAltura'])
      ? `${escapeHtml(f['AreaLargura'])} × ${escapeHtml(f['AreaAltura'])} <i>q</i>` : '—';

    const stone = (label, value, cls) => `
      <div class="runestone ${cls || ''}">
        <span class="runestone__v">${value}</span>
        <span class="runestone__l">${escapeHtml(label)}</span>
      </div>`;

    const stones = type === 'ativa' ? [
      stone('Custo', formatCusto(f), 'is-cost'),
      stone('Classifica\u00e7\u00e3o', escapeHtml(arcane.classificacao || '—'), 'is-classification'),
      stone('Alcance', f['Alcance'] ? `${escapeHtml(f['Alcance'])} <i>q</i>` : '—'),
      stone('Área', area),
      stone('Duração', escapeHtml(f['Duração'] || '—'), 'is-duration')
    ].join('') : [
      stone('Custo', formatCusto(f), 'is-cost'),
      stone('Classifica\u00e7\u00e3o', escapeHtml(arcane.classificacao || '—'), 'is-classification'),
      stone('Ativação', escapeHtml(f['Condição de Ativação'] || '—')),
      stone('Manutenção', f['Manutenção'] ? `${escapeHtml(f['Manutenção'])} <i>${escapeHtml(unit)}/t</i>` : '—', 'is-duration')
    ].join('');

    const sectionHead = (title) => `
      <h2 class="grimoire-sec__h"><span class="grimoire-sec__rule"></span>${escapeHtml(title)}<span class="grimoire-sec__rule"></span></h2>`;

    const inscriptions = scopeEntries.length ? `
      <section class="grimoire-sec">
        ${sectionHead('Escopos')}
        <div class="inscriptions">
          ${scopeEntries.map((s) => `
            <div class="inscription" style="--pill:${scopeColor(s.tipo)}">
              <span class="inscription__sigil" aria-hidden="true">${scopeIcon(s.tipo)}</span>
              <div class="inscription__b">
                <span class="inscription__name">${escapeHtml(s.tipo)}</span>
                <p>${s.detalhe ? escapeHtml(s.detalhe) : '—'}</p>
              </div>
            </div>`).join('')}
        </div>
      </section>` : '';

    const proseSec = (title, html, cls = '', lead = false) => html ? `
      <section class="grimoire-sec ${cls}">
        ${sectionHead(title)}
        <p class="grimoire-prose ${lead ? 'grimoire-prose--lead' : ''}">${html}</p>
      </section>` : '';

    const mainText = type === 'ativa'
      ? proseSec('Descrição', escapeHtml(f['Descrição'] || ''), '', true)
      : proseSec('Efeito Contínuo', escapeHtml(f['Efeito Contínuo'] || ''), '', true);

    const extraText = (type === 'ativa' && f['Efeito Adicional'])
      ? proseSec('Efeito Adicional', escapeHtml(f['Efeito Adicional']), 'grimoire-sec--quote')
      : '';

    let howWorks = '';
    if (type === 'passiva') {
      const cond = (f['Condição de Ativação'] || 'Sempre ativa').toLowerCase();
      const condTxt = cond === 'sempre ativa'
        ? 'Esta passiva fica sempre ativa assim que a magia é aprendida.'
        : `Esta passiva entra em efeito: ${escapeHtml(cond)}.`;
      const upkeep = f['Manutenção']
        ? ` O custo de manutenção de <b>${escapeHtml(f['Manutenção'])} ${escapeHtml(unit)}/turno</b> é pago no início de cada turno; sem recurso suficiente, o efeito se encerra até voltar a ser pago.`
        : (f['Custo'] ? ` Custa <b>${escapeHtml(formatCusto(f))}</b> para ativar.` : '');
      howWorks = proseSec('Como funciona', condTxt + upkeep, 'grimoire-sec--note');
    }

    const editButton = (e.isUserCreated && auth.isAdmin) ? `
      <a class="back-link back-link--edit" href="#/${tabId}/${encodeURIComponent(e.id)}/editar">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        Editar magia
      </a>` : '';
    const deleteButton = (e.isUserCreated && auth.isAdmin) ? `
      <button type="button" class="back-link back-link--danger" data-delete-entry="${escapeHtml(e.id)}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        Apagar magia
      </button>` : '';

    const runeSvg = aff.rune
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="${aff.rune}"/></svg>`
      : aff.icon;

    const readSpellField = (...keys) => {
      const key = keys.find((candidate) => f[candidate] != null && String(f[candidate]).trim() !== '');
      return key ? f[key] : '';
    };
    const effectEntries = normalizeSpellEffects(f);
    const bookDescription = type === 'ativa'
      ? readSpellField('Descrição')
      : readSpellField('Efeito Contínuo');
    const bookSummary = e.summary || bookDescription || '';
    const bookActivation = readSpellField('Condição de Ativação') || 'Sempre ativa';
    const bookMaintenance = readSpellField('Manutenção');
    const bookStat = (label, value, cls = '') => `
      <div class="spell-book-rule ${cls}">
        <span>${escapeHtml(label)}</span>
        <strong>${value}</strong>
      </div>`;
    const bookStats = type === 'ativa' ? [
      bookStat('Custo', escapeHtml(formatCusto(f)), 'is-cost'),
      bookStat('Classifica\u00e7\u00e3o', escapeHtml(arcane.classificacao || '\u2014'), 'is-classification'),
      bookStat('Alcance', f['Alcance'] ? `${escapeHtml(f['Alcance'])} <i>q</i>` : '—'),
      bookStat('Área', area),
      bookStat('Duração', escapeHtml(readSpellField('Duração') || '—'), 'is-duration')
    ].join('') : [
      bookStat('Custo', escapeHtml(formatCusto(f)), 'is-cost'),
      bookStat('Classifica\u00e7\u00e3o', escapeHtml(arcane.classificacao || '\u2014'), 'is-classification'),
      bookStat('Ativação', escapeHtml(bookActivation)),
      bookStat('Controle', escapeHtml(arcane.control || '\u2014'), 'is-duration'),
      bookStat('Manutenção', bookMaintenance ? `${escapeHtml(bookMaintenance)} <i>${escapeHtml(unit)}/t</i>` : '—', 'is-duration')
    ].join('');
    const bookScopeNotes = scopeEntries.length ? `
      <div class="spell-book-scope-list">
        ${scopeEntries.map((s) => `
          <article class="spell-book-scope" style="--pill:${scopeColor(s.tipo)}">
            <span class="spell-book-scope__icon">${scopeIcon(s.tipo)}</span>
            <div>
              <strong>${escapeHtml(s.tipo)}</strong>
              <p>${s.detalhe ? escapeHtml(s.detalhe) : '—'}</p>
            </div>
          </article>`).join('')}
      </div>` : '<p class="spell-empty-text">Nenhum escopo definido.</p>';
    const bookEffects = effectEntries.length
      ? `<div class="spell-effect-list">${effectEntries.map((effect, index) => spellEffectCardHTML(effect, index)).join('')}</div>`
      : '<p class="spell-empty-text">Nenhum efeito adicional cadastrado.</p>';
    const bookHowWorks = type === 'passiva' ? `
      <section class="spell-book-section spell-book-section--note">
        <h2>Como ativa</h2>
        <p>${escapeHtml(bookActivation === 'Sempre ativa'
          ? 'Esta passiva permanece ativa assim que a magia é aprendida.'
          : `Esta passiva entra em efeito: ${bookActivation}.`)}</p>
        ${bookMaintenance ? `<p>Manutenção: <b>${escapeHtml(bookMaintenance)} ${escapeHtml(unit)}/turno</b>.</p>` : ''}
      </section>` : '';
    const spellBookEntries = entriesIn(tabId)
      .filter((entry) => isMagiasTab(entry.tab))
      .slice()
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.title || '').localeCompare(String(b.title || ''), 'pt-BR'));
    const bookIndex = spellBookEntries.findIndex((entry) => entry.id === e.id);
    const hasPageTurns = spellBookEntries.length > 1 && bookIndex >= 0;
    const prevSpell = hasPageTurns ? spellBookEntries[(bookIndex - 1 + spellBookEntries.length) % spellBookEntries.length] : null;
    const nextSpell = hasPageTurns ? spellBookEntries[(bookIndex + 1) % spellBookEntries.length] : null;
    const bookPageStart = Math.max(0, bookIndex) * 2 + 1;
    const toRoman = (value) => {
      const numerals = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let remaining = Math.max(1, value);
      return numerals.map(([amount, symbol]) => {
        const count = Math.floor(remaining / amount);
        remaining %= amount;
        return symbol.repeat(count);
      }).join('');
    };
    const bookKicker = `INSCRIÇÃO ${aff.label.toUpperCase()} · ${typeMeta.label.toUpperCase()}`;
    let arrivingTurn = '';
    try {
      arrivingTurn = sessionStorage.getItem('arcanoSpellPageTurn') || '';
      sessionStorage.removeItem('arcanoSpellPageTurn');
    } catch {}
    const arrivingClass = ['next', 'prev'].includes(arrivingTurn) ? ` is-page-arriving is-page-arriving--${arrivingTurn}` : '';
    const pageTurnButton = (target, dir, label) => target ? `
      <button type="button" class="spell-page-button spell-page-button--${dir}" data-spell-page-turn="${dir}" data-target-hash="#/${tabId}/${encodeURIComponent(target.id)}" aria-label="${escapeHtml(label)}: ${escapeHtml(target.title)}">
        <span class="spell-page-button__k">${dir === 'prev' ? 'Anterior' : 'Pr\u00f3xima'}</span>
        <strong>${escapeHtml(target.title)}</strong>
      </button>` : '';
    const pageTurnEdge = (target, dir) => target ? `
      <button type="button" class="spell-page-edge spell-page-edge--${dir}" data-spell-page-turn="${dir}" data-target-hash="#/${tabId}/${encodeURIComponent(target.id)}" title="${escapeHtml(dir === 'prev' ? 'Magia anterior' : 'Pr\u00f3xima magia')}: ${escapeHtml(target.title)}" aria-label="${escapeHtml(dir === 'prev' ? 'Magia anterior' : 'Pr\u00f3xima magia')}: ${escapeHtml(target.title)}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'}"/></svg>
      </button>` : '';
    const pageTurnControls = hasPageTurns ? `
      <div class="spell-page-controls" aria-label="Virar p\u00e1ginas do grim\u00f3rio">
        ${pageTurnButton(prevSpell, 'prev', 'Magia anterior')}
        <span class="spell-page-counter">${bookIndex + 1}<i>/</i>${spellBookEntries.length}</span>
        ${pageTurnButton(nextSpell, 'next', 'Pr\u00f3xima magia')}
      </div>` : '';

    return `
      <article class="entry grimoire spell-book-open grimoire--${type}${arrivingClass}" style="--hue:${aff.hue};--accent:${aff.accent};--glow:${aff.glow}">
        <span class="grimoire__corner grimoire__corner--tl" aria-hidden="true"></span>
        <span class="grimoire__corner grimoire__corner--tr" aria-hidden="true"></span>
        <span class="grimoire__corner grimoire__corner--bl" aria-hidden="true"></span>
        <span class="grimoire__corner grimoire__corner--br" aria-hidden="true"></span>

        <nav class="breadcrumb">
          <a href="#/">Codex</a><span>/</span>
          <a href="#/${tabId}">${escapeHtml(tab.title)}</a><span>/</span>
          <span class="breadcrumb__current">${escapeHtml(e.title)}</span>
        </nav>

        ${pageTurnControls}

        <div class="spell-book-shell">
          <span class="spell-book-frame" aria-hidden="true"></span>
          <div class="spell-book">
          <span class="spell-book__page-stack spell-book__page-stack--left" aria-hidden="true"></span>
          <span class="spell-book__page-stack spell-book__page-stack--right" aria-hidden="true"></span>
          <span class="spell-book__corner spell-book__corner--tl" aria-hidden="true"></span>
          <span class="spell-book__corner spell-book__corner--tr" aria-hidden="true"></span>
          <span class="spell-book__corner spell-book__corner--br" aria-hidden="true"></span>
          <span class="spell-book__corner spell-book__corner--bl" aria-hidden="true"></span>
          <span class="spell-book__bookmark" aria-hidden="true"></span>
          ${hasPageTurns ? `${pageTurnEdge(prevSpell, 'prev')}${pageTurnEdge(nextSpell, 'next')}` : ''}
          <section class="spell-book__page spell-book__page--identity">
            <span class="spell-book__margin-runes spell-book__margin-runes--left" aria-hidden="true">✦ ◇ ✶ ☽ ◆ ✧ ⬡ ✦ ◇ ✶</span>
            <div class="spell-book__watermark" aria-hidden="true">${aff.icon}</div>
            <span class="spell-book__kicker">${escapeHtml(bookKicker)}</span>
            <div class="spell-book__media ${e.image ? 'has-img' : ''}" aria-hidden="true">
              <span class="spell-book__media-ring spell-book__media-ring--outer"></span>
              <span class="spell-book__media-ring"></span>
              <span class="spell-book__media-ring spell-book__media-ring--inner"></span>
              ${e.image ? `<img src="${e.image}" alt="" onerror="this.closest('.spell-book__media').classList.add('is-fallback')">` : ''}
              <span class="spell-book__media-rune">${runeSvg}</span>
            </div>
            <div class="spell-book__badges">
              <span class="spell-type-badge spell-type-badge--${type}">${escapeHtml(typeMeta.badge)}</span>
              <span class="spell-affinity-badge"><span class="spell-affinity-badge__ic">${aff.icon}</span>${escapeHtml(aff.label)}</span>
              <span class="spell-classification-badge">${escapeHtml(arcane.classificacao || 'Sem classifica\u00e7\u00e3o')}</span>
            </div>
            <h1 class="spell-book__title">${escapeHtml(e.title)}</h1>
            ${bookSummary ? `
              <div class="spell-book__summary">
                <span>Resumo</span>
                <p>${escapeHtml(bookSummary)}</p>
              </div>` : ''}
            ${scopeEntries.length ? `<div class="spell-book__pills">${spellScopePills(scopeEntries.map((s) => s.tipo))}</div>` : ''}
            <div class="spell-book-rules">${bookStats}</div>
            <span class="spell-book__folio spell-book__folio--left">${toRoman(bookPageStart)}</span>
          </section>

          <section class="spell-book__page spell-book__page--notes">
            <span class="spell-book__margin-runes spell-book__margin-runes--right" aria-hidden="true">✦ ◇ ✶ ☽ ◆ ✧ ⬡ ✦ ◇ ✶</span>
            <section class="spell-book-section spell-book-section--lead">
              <h2>${type === 'ativa' ? 'Descrição' : 'Efeito contínuo'}</h2>
              ${bookDescription ? `<p>${escapeHtml(bookDescription)}</p>` : '<p class="spell-empty-text">Sem descrição.</p>'}
            </section>
            <section class="spell-book-section">
              <h2>Efeito mecânico</h2>
              ${bookScopeNotes}
              ${combatSectionHTML(e, { useForm: arcane.useForm })}
            </section>
            ${bookHowWorks}
            <section class="spell-book-section">
              <div class="spell-book-section__head">
                <h2>Notas de efeito</h2>
                <span>${effectEntries.length}</span>
              </div>
              ${bookEffects}
            </section>
            <span class="spell-book__folio spell-book__folio--right">${toRoman(bookPageStart + 1)}</span>
          </section>
          </div>
        </div>

        <div class="entry__actions-row">
          ${editButton}
          ${deleteButton}
          <a href="#/${tabId}" class="back-link">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Voltar a ${escapeHtml(tab.title)}
          </a>
        </div>
      </article>
    `;

    return `
      <article class="entry grimoire grimoire--${type}" style="--hue:${aff.hue};--accent:${aff.accent};--glow:${aff.glow}">
        <span class="grimoire__corner grimoire__corner--tl" aria-hidden="true"></span>
        <span class="grimoire__corner grimoire__corner--tr" aria-hidden="true"></span>
        <span class="grimoire__corner grimoire__corner--bl" aria-hidden="true"></span>
        <span class="grimoire__corner grimoire__corner--br" aria-hidden="true"></span>

        <nav class="breadcrumb">
          <a href="#/">Codex</a><span>/</span>
          <a href="#/${tabId}">${escapeHtml(tab.title)}</a><span>/</span>
          <span class="breadcrumb__current">${escapeHtml(e.title)}</span>
        </nav>

        <header class="grimoire__hero">
          ${e.image ? `<div class="grimoire__bg" style="background-image:url('${e.image}')" aria-hidden="true"></div>` : ''}
          <div class="arcane-circle ${e.image ? 'has-img' : ''}" aria-hidden="true">
            <span class="arcane-circle__halo"></span>
            <span class="arcane-circle__ring arcane-circle__ring--out"></span>
            <span class="arcane-circle__ring arcane-circle__ring--mid"></span>
            <span class="arcane-circle__ring arcane-circle__ring--in"></span>
            <span class="arcane-core">
              ${e.image ? `<img class="arcane-core__img" src="${e.image}" alt="" onerror="this.closest('.arcane-circle').classList.add('is-fallback')">` : ''}
              <span class="arcane-core__rune">${runeSvg}</span>
            </span>
          </div>
          <div class="grimoire__id">
            <div class="grimoire__badges">
              <span class="spell-type-badge spell-type-badge--${type}">${escapeHtml(typeMeta.badge)}</span>
              <span class="spell-affinity-badge"><span class="spell-affinity-badge__ic">${aff.icon}</span>${escapeHtml(aff.label)}</span>
            </div>
            <h1 class="grimoire__title" data-text-reveal>${escapeHtml(e.title)}</h1>
            <div class="grimoire__flourish" aria-hidden="true">
              <svg viewBox="0 0 240 12" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"><path d="M4 6h86M236 6h-86"/><path d="M98 6l9-4M98 6l9 4M142 6l-9-4M142 6l-9 4"/></svg>
              <span class="grimoire__flourish-gem">${aff.icon}</span>
            </div>
            ${e.summary ? `<p class="grimoire__summary">${escapeHtml(e.summary)}</p>` : ''}
            ${scopeEntries.length ? `<div class="grimoire__scopes">${spellScopePills(scopeEntries.map((s) => s.tipo))}</div>` : ''}
          </div>
        </header>

        <div class="runestones">${stones}</div>

        <div class="grimoire__body">
          ${mainText}
          ${inscriptions}
          ${extraText}
          ${howWorks}
          ${(!mainText && !inscriptions) ? '<p class="spell-empty-text">Sem descrição.</p>' : ''}
        </div>

        <div class="entry__actions-row">
          ${editButton}
          ${deleteButton}
          <a href="#/${tabId}" class="back-link">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Voltar a ${escapeHtml(tab.title)}
          </a>
        </div>
      </article>
    `;
  }

  /* ── MAGIAS: card na grade da categoria (token arcano) ─ */
  function spellCardHTML(e, i) {
    const f = e.fields || {};
    const type = isSpellType(e.subtype) ? e.subtype : 'ativa';
    const aff = affinityMeta(f['Afinidade']);
    const arcane = normalizeSpellArcaneFields(f);
    const names = spellScopeNames(f);
    const hasCusto = String(f['Custo'] ?? '').trim() !== '';
    const runeSvg = aff.rune
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="${aff.rune}"/></svg>`
      : aff.icon;
    return `
      <a href="#/${e.tab}/${e.id}" class="tome-card grimoire--${type}" style="--accent:${aff.accent};--glow:${aff.glow};--hue:${aff.hue};--delay:${i * 45}ms">
        <span class="tome-card__bg-rune" aria-hidden="true">${aff.icon}</span>
        <div class="tome-card__top">
          <span class="spell-type-badge spell-type-badge--${type} tome-card__type">${escapeHtml(SPELL_TYPES[type].badge)}</span>
          ${hasCusto ? `<span class="tome-card__orb"><b>${escapeHtml(String(f['Custo']))}</b><small>${escapeHtml(safeCostUnit(f['CustoUnidade'] || 'MP'))}</small></span>` : ''}
        </div>
        <div class="tome-card__medal ${e.image ? 'has-img' : ''}" aria-hidden="true">
          <span class="tome-card__medal-ring"></span>
          ${e.image ? `<img class="tome-card__img" loading="lazy" decoding="async" src="${e.image}" alt="" onerror="this.closest('.tome-card__medal').classList.add('is-fallback')">` : ''}
          <span class="tome-card__medal-rune">${runeSvg}</span>
        </div>
        <div class="tome-card__body">
          <h3 class="tome-card__name">${escapeHtml(e.title)}</h3>
        </div>
        <div class="tome-card__meta">
          <span class="tome-card__classification">${escapeHtml(arcane.classificacao || 'Sem classifica\u00e7\u00e3o')}</span>
          <span class="tome-card__aff"><span>${aff.icon}</span>${escapeHtml(aff.label)}</span>
        </div>
        <div class="tome-card__footer">
          ${names.length ? `<div class="tome-card__runes">${names.slice(0, 5).map((s) => `<span class="rune-chip" style="--pill:${scopeColor(s)}" title="${escapeHtml(s)}">${scopeIcon(s)}</span>`).join('')}</div>` : '<span></span>'}
          <span class="tome-card__open">Abrir grim\u00f3rio</span>
        </div>
      </a>
    `;
  }

  /* ── EDIT INDEX VIEW ──────────────────────────── */
  function viewEditIndex() {
    if (!auth.isAdmin) return viewForbidden();
    const idx = ARCHIVE.index;
    const theme = themeOf('Index');
    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf('Index')}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">EDITAR · ${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title">Editar apresentação</h1>
          <p class="cat-hero__tone">Personalize o título, a frase de abertura e o manifesto da página inicial.</p>
        </div>
      </section>

      <form class="create-form" id="editIndexForm" style="--hue:${theme.hue}" novalidate>
        <div class="create-form__field">
          <label class="create-form__label" for="titleInput">Título</label>
          <input type="text" id="titleInput" class="create-form__input" value="${escapeHtml(idx.title || '')}" maxlength="120" required>
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="summaryInput">Subtítulo</label>
          <input type="text" id="summaryInput" class="create-form__input" value="${escapeHtml(idx.subtitle || '')}" maxlength="240">
        </div>

        <div class="create-form__field">
          <label class="create-form__label">Manifesto</label>
          ${editorToolbarHTML(idx.manifestoHtml || (idx.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join(''))}
        </div>

        <div class="create-form__actions">
          <a href="#/" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span>Salvar apresentação</span>
          </button>
        </div>
      </form>
    `;
  }

  /* ── ENTRY DETAIL VIEW ────────────────────────── */
  function storyReaderView(entry, { draft = false } = {}) {
    const fields = entry.fields || {};
    const era = entryById(fields.Era);
    const tags = sanitizeTags(entry.tags);
    const branch = narrativeIsBranch(entry);
    const related = entriesIn('Historias').filter((item) => item.id !== entry.id && item.fields?.Era === fields.Era).slice(0, 3);
    const body = entry.bodyHtml
      ? sanitizeHtml(entry.bodyHtml)
      : (entry.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
    const edit = (!draft && entry.isUserCreated && auth.isAdmin) ? `<a class="btn btn-ghost" href="#/Historias/${encodeURIComponent(entry.id)}/editar">Editar história</a>` : '';
    const remove = (!draft && entry.isUserCreated && auth.isAdmin) ? `<button type="button" class="btn btn-ghost story-reader__delete" data-delete-entry="${escapeHtml(entry.id)}">Apagar</button>` : '';
    return `
      <article class="story-reader ${draft ? 'story-reader--draft' : ''}" data-story-reader>
        <div class="story-reader__progress"><i data-reading-progress></i></div>
        <header class="story-reader__hero ${entry.image ? '' : 'is-fallback'}">
          ${entry.image ? `<img src="${escapeHtml(entry.image)}" alt="" decoding="async">` : ''}
          <div class="story-reader__shade"></div>
          <div class="story-reader__nav"><a href="#/Eras">← Linha do tempo</a><button type="button" data-reader-focus aria-pressed="false">Modo focado</button></div>
          <div class="story-reader__heading">
            <span class="section__eyebrow">${escapeHtml(era?.title || 'ERA NÃO CLASSIFICADA')} · ${escapeHtml(fields['Data no mundo'] || 'SEM DATA')}</span>
            <h1>${escapeHtml(entry.title || 'História sem título')}</h1>
            ${entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : ''}
            <div>${draft ? '<span>PRÉVIA DO RASCUNHO</span>' : ''}<span>${branch ? 'REALIDADE ALTERNATIVA' : 'CÂNONE'}</span>${fields.Importância ? `<span>${escapeHtml(fields.Importância)}</span>` : ''}</div>
          </div>
        </header>
        <div class="story-reader__layout">
          <aside class="story-reader__context">
            <span class="section__eyebrow">POSIÇÃO NO TEMPO</span>
            <h2>${escapeHtml(era?.title || 'Não classificada')}</h2>
            <p>${escapeHtml(fields['Data no mundo'] || 'Data não definida')}</p>
            <div class="story-reader__mini-time"><i style="--position:${narrativePosition(entry)}%"></i></div>
            <a href="#/Eras">Ver no Cronoscópio</a>
            ${tags.length ? `<div>${tags.map((tag) => tagChipHTML(tag, 'story-tag')).join('')}</div>` : ''}
          </aside>
          <main class="story-reader__prose entry__body--rich">
            <span class="section__eyebrow">${draft ? 'CRÔNICA EM REVISÃO' : 'RELATO PRESERVADO'}</span>
            <div class="rt-content">${body || '<p>Esta história ainda não recebeu seu relato.</p>'}</div>
            <footer><span>FIM DO REGISTRO</span><h2>A história termina aqui — por enquanto.</h2></footer>
          </main>
          <aside class="story-reader__relations">
            <span class="section__eyebrow">OUTRAS CICATRIZES</span>
            ${related.map((item) => `<a href="#/Historias/${encodeURIComponent(item.id)}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.fields?.['Data no mundo'] || '')}</small></a>`).join('') || '<p>Nenhuma história relacionada nesta era.</p>'}
          </aside>
        </div>
        <footer class="story-reader__actions">${edit}${remove}<a class="btn btn-ghost" href="#/Historias">Voltar às histórias</a></footer>
      </article>`;
  }

  function viewEntry(tabId, entryId, npcCtx) {
    const e = npcCtx ? npcCtx.entry : entryById(entryId);
    if (!e || e.tab !== tabId) return viewNotFound(entryId);
    if (isMagiasTab(tabId)) return spellEntryView(tabId, e);
    if (tabId === 'Historias') return storyReaderView(e);
    const theme = themeOf(tabId);
    const tab = tabById(tabId);
    const fields = Object.entries(e.fields || {});
    const related = npcCtx ? [] : ARCHIVE.entries.filter((x) => x.tab === tabId && x.id !== e.id).slice(0, 3);
    const tags = sanitizeTags(e.tags);
    const portrait = isPortrait(tabId);
    const subtypeName = e.subtype ? subtypeLabel(e.subtype) : null;

    const bodyMarkup = e.bodyHtml
      ? `<div class="entry__body entry__body--rich">
           <span class="section__eyebrow">${tabId === 'Itens' ? 'DESCRIÇÃO' : 'RELATO'}</span>
           <div class="rt-content">${sanitizeHtml(e.bodyHtml)}</div>
         </div>`
      : (e.body || []).length
        ? `<div class="entry__body">
             <span class="section__eyebrow">${tabId === 'Itens' ? 'DESCRIÇÃO' : 'RELATO'}</span>
             ${e.body.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
           </div>`
        : '';

    const subtypeIcon = (e.subtype && ITEM_SUBTYPES[e.subtype]) ? ITEM_SUBTYPES[e.subtype].icon : '';
    const isRacas = tabId === 'Racas';
    const isBestiario = tabId === 'Bestiario';
    const isSectioned = isSectionedTab(tabId);

    function dossierValueHTML(key, value) {
      if (key === 'Perigo') {
        return `<span class="rarity-chip ${threatCssClass(value)}">${escapeHtml(value)}</span>`;
      }
      if (key === 'Raridade') {
        const k = normalize(value);
        let cls = 'rarity-chip rarity-chip--default';
        if (/comum/.test(k) && !/inco/.test(k)) cls = 'rarity-chip rarity-chip--common';
        else if (/incomum/.test(k)) cls = 'rarity-chip rarity-chip--uncommon';
        else if (/raro|rara/.test(k)) cls = 'rarity-chip rarity-chip--rare';
        else if (/epico|epica/.test(k)) cls = 'rarity-chip rarity-chip--epic';
        else if (/lendar/.test(k)) cls = 'rarity-chip rarity-chip--legendary';
        else if (/unico|unica/.test(k)) cls = 'rarity-chip rarity-chip--unique';
        return `<span class="${cls}">${escapeHtml(value)}</span>`;
      }
      return escapeHtml(value);
    }

    function renderItensDossier() {
      const itemFields = e.fields || {};
      const baseFields = itemBaseFieldEntries(itemFields);
      const extraFields = normalizeItemExtraFields(itemFields.Campos);
      const combatRead = combatSectionHTML(e);
      if (!baseFields.length && !extraFields.length && !combatRead) return '';
      return `
        <aside class="entry__dossier-side">
          <header class="entry__dossier-head">
            ${subtypeIcon ? `<span class="entry__dossier-icon" aria-hidden="true">${subtypeIcon}</span>` : ''}
            <div>
              <span class="section__eyebrow">DOSSIÊ</span>
              ${subtypeName ? `<span class="entry__dossier-subtype">${escapeHtml(subtypeName)}</span>` : ''}
            </div>
          </header>
          ${baseFields.length ? `
            <dl class="meta-list">
              ${baseFields.map(([k, v]) => `
                <div class="meta-row">
                  <dt>${escapeHtml(k)}</dt>
                  <dd>${dossierValueHTML(k, v)}</dd>
                </div>
              `).join('')}
            </dl>
          ` : ''}
          ${extraFields.length ? `
            <div class="item-extra-view">
              <span class="section__eyebrow">CAMPOS</span>
              <dl class="meta-list">
                ${extraFields.map((field) => `
                  <div class="meta-row">
                    <dt>${escapeHtml(field.key)}</dt>
                    <dd>${dossierValueHTML(field.key, field.value)}</dd>
                  </div>
                `).join('')}
              </dl>
            </div>
          ` : ''}
          ${combatRead ? `<div class="item-extra-view"><span class="section__eyebrow">NO GRID</span>${combatRead}</div>` : ''}
        </aside>
      `;
    }

    function renderVitalsCard(section, data, sectionHead) {
      // Bestiário: HP anatômico + defesas do sistema, Mana como callout.
      const hpParts = beastHpPartsForView(data);
      const stats = BEAST_VITALS.filter((k) => data[k] != null && data[k] !== '');
      const hasMana = data['Mana'] != null && data['Mana'] !== '';
      if (!hpParts.length && !stats.length && !hasMana) return '';
      return `
        <aside class="entry__dossier-side dossier-card--hpmp">
          ${sectionHead}
          ${(hpParts.length || stats.length) ? `
            <div class="hp-grid">
              ${hpParts.map((part) => `
                <div class="hp-part">
                  <span class="hp-part__name">${escapeHtml(part.name)}</span>
                  <span class="hp-part__value">${escapeHtml(String(part.hp))}<em>HP</em></span>
                </div>
              `).join('')}
              ${stats.map((k) => `
                <div class="hp-part">
                  <span class="hp-part__name">${escapeHtml(k)}</span>
                  <span class="hp-part__value">Nível ${beastDefenseLevel(data, k)}<em>${beastDefensePercent(beastDefenseLevel(data, k))}%</em></span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${hasMana ? `
            <div class="mana-callout">
              <span class="mana-callout__rune" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.5 3 4 5 7 6-3 1-5.5 3-7 6-1.5-3-4-5-7-6 3-1 5.5-3 7-6z"/><circle cx="12" cy="14" r="1.5"/></svg>
              </span>
              <span class="mana-callout__label">MANA</span>
              <strong class="mana-callout__value">${escapeHtml(String(data['Mana']))}</strong>
            </div>
          ` : ''}
        </aside>
      `;
    }

    function renderBeastAttributesCard(section, data, sectionHead) {
      const attrs = normalizeBeastAttributes(data['Atributos'], false);
      const hasAny = Object.keys(attrs).length > 0;
      if (!hasAny) return '';
      return `
        <aside class="entry__dossier-side beast-attr-card">
          ${sectionHead}
          <div class="beast-attr-grid">
            ${CHAR_ATTRIBUTES.map((attr) => {
              const score = attrs[attr] != null ? attrs[attr] : CHAR_ATTR_BASE;
              return `
                <div class="beast-attr">
                  <span class="beast-attr__name">${escapeHtml(attr)}</span>
                  <strong class="beast-attr__score">${beastDiceForScore(score)}d6</strong>
                </div>
              `;
            }).join('')}
          </div>
        </aside>
      `;
    }

    function renderBeastDropsCard(section, data, sectionHead) {
      const drops = normalizeBeastDrops(data['Drops']);
      const spoil = data['Espólio'] || data['Espolio'] || '';
      if (!drops.length && !spoil) return '';
      return `
        <aside class="entry__dossier-side beast-drops-card">
          ${sectionHead}
          ${drops.length ? `
            <ul class="beast-drop-list">
              ${drops.map((drop) => {
                const linked = drop.refId && entryById(drop.refId);
                const name = drop.name || 'Item';
                return `
                  <li class="beast-drop-item">
                    <div class="beast-drop-item__main">
                      ${linked
                        ? `<a href="#/Itens/${encodeURIComponent(drop.refId)}" class="beast-drop-item__name">${escapeHtml(name)}</a>`
                        : `<span class="beast-drop-item__name">${escapeHtml(name)}</span>`}
                      ${drop.summary ? `<span class="beast-drop-item__summary">${escapeHtml(drop.summary)}</span>` : ''}
                    </div>
                    <div class="beast-drop-item__meta">
                      ${drop.quantity ? `<span>${escapeHtml(drop.quantity)}</span>` : ''}
                      ${drop.chance ? `<span>${escapeHtml(drop.chance)}%</span>` : ''}
                    </div>
                    ${drop.note ? `<p class="beast-drop-item__note">${escapeHtml(drop.note)}</p>` : ''}
                  </li>
                `;
              }).join('')}
            </ul>
          ` : ''}
          ${spoil ? `<p class="beast-spoil-note">${escapeHtml(spoil)}</p>` : ''}
        </aside>
      `;
    }

    function renderBeastAbilitiesCard(section, data, sectionHead) {
      const abilities = normalizeBeastAbilities(data['Habilidades']);
      if (!abilities.length) return '';
      return `
        <aside class="entry__dossier-side beast-abilities-card">
          ${sectionHead}
          <div class="beast-ability-list">
            ${abilities.map((ability, index) => {
              const hasCodex = ability.source === 'magic' && ability.refId && entryById(ability.refId);
              const detail = ability.effect || ability.summary || ability.trigger || 'Clique para ver detalhes.';
              return `
                <article class="beast-ability-item">
                  <button type="button" class="beast-ability-open" data-beast-ability-index="${index}">
                    <span class="beast-ability-open__top">
                      <strong>${escapeHtml(ability.name)}</strong>
                      <span class="beast-ability-kind">${escapeHtml(ability.kind)}</span>
                    </span>
                    <span class="beast-ability-open__text">${escapeHtml(detail)}</span>
                  </button>
                  ${hasCodex ? `<a class="beast-ability-codex" href="#/Magias/${encodeURIComponent(ability.refId)}">Codex</a>` : ''}
                </article>
              `;
            }).join('')}
          </div>
        </aside>
      `;
    }

    function renderRaceDossierView(viewTabId, rawFields, opts = {}) {
      const data = rawFields || {};
      const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
      const sections = sectionsForTab(viewTabId);
      // Campo "promoted" (Raridade/Perigo) já aparece no tagline; não repetir na lista.
      return `
        <div class="race-dossier-view">
          ${sections.map((section, idx) => {
            if (opts.skipAttributes && section.view === 'attributes') return '';
            const numeral = ROMAN[idx] || '';
            const sectionHead = `
              <header class="entry__dossier-head dossier-head--ornate">
                <span class="dossier-mark">${numeral}</span>
                <span class="section__eyebrow">${escapeHtml(section.title.toUpperCase())}</span>
                <span class="dossier-rule" aria-hidden="true"></span>
              </header>
            `;

            if (viewTabId === 'Bestiario' && section.view === 'attributes') return renderBeastAttributesCard(section, data, sectionHead);
            if (viewTabId === 'Bestiario' && section.view === 'drops') return renderBeastDropsCard(section, data, sectionHead);
            if (viewTabId === 'Bestiario' && section.view === 'abilities') return renderBeastAbilitiesCard(section, data, sectionHead);
            if (section.view === 'vitals') return renderVitalsCard(section, data, sectionHead);

            if (section.id === 'hpmp') {
              const hasAny = RACE_HP_PARTS.some((p) => data[p]) || data['Mana'];
              if (!hasAny) return '';
              return `
                <aside class="entry__dossier-side dossier-card--hpmp">
                  ${sectionHead}
                  ${RACE_HP_PARTS.some((p) => data[p]) ? `
                    <div class="hp-grid">
                      ${RACE_HP_PARTS.filter((p) => data[p]).map((p) => `
                        <div class="hp-part">
                          <span class="hp-part__name">${escapeHtml(p)}</span>
                          <span class="hp-part__value">${escapeHtml(data[p])}<em>HP</em></span>
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                  ${data['Mana'] ? `
                    <div class="mana-callout">
                      <span class="mana-callout__rune" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.5 3 4 5 7 6-3 1-5.5 3-7 6-1.5-3-4-5-7-6 3-1 5.5-3 7-6z"/><circle cx="12" cy="14" r="1.5"/></svg>
                      </span>
                      <span class="mana-callout__label">MANA</span>
                      <strong class="mana-callout__value">${escapeHtml(data['Mana'])}</strong>
                    </div>
                  ` : ''}
                </aside>
              `;
            }

            // Campo promovido (vai como destaque no tagline) não se repete na lista.
            const visible = section.fields.filter((f) => {
              if (f.promoted) return false;
              const v = data[f.key];
              if (f.type === 'list') return Array.isArray(v) && v.length > 0;
              return v != null && v !== '';
            });
            if (!visible.length) return '';
            // Lista "bare" (ex.: Habilidades): o cabeçalho da seção já nomeia,
            // então mostramos os itens em largura total, sem repetir o rótulo.
            const bareLists = visible.filter((f) => f.type === 'list' && f.bare);
            const rows = visible.filter((f) => !(f.type === 'list' && f.bare));
            return `
              <aside class="entry__dossier-side">
                ${sectionHead}
                ${rows.length ? `<dl class="meta-list">
                  ${rows.map((f) => {
                    const v = data[f.key];
                    if (f.type === 'list') {
                      return `
                        <div class="meta-row">
                          <dt>${escapeHtml(f.key)}</dt>
                          <dd>
                            <ul class="meta-list-items">
                              ${v.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                            </ul>
                          </dd>
                        </div>
                      `;
                    }
                    return `
                      <div class="meta-row">
                        <dt>${escapeHtml(f.key)}</dt>
                        <dd>${dossierValueHTML(f.key, v)}</dd>
                      </div>
                    `;
                  }).join('')}
                </dl>` : ''}
                ${bareLists.map((f) => `
                  <ul class="ability-list">
                    ${data[f.key].map((item) => `<li class="ability-list__item">${escapeHtml(item)}</li>`).join('')}
                  </ul>
                `).join('')}
              </aside>
            `;
          }).join('')}
        </div>
      `;
    }

    function renderBestiaryEntry(actionsMarkup) {
      const data = e.fields || {};
      const hpParts = beastHpPartsForView(data);
      const abilities = normalizeBeastAbilities(data.Habilidades);
      const drops = normalizeBeastDrops(data.Drops);
      const guideFields = ['Sinais', 'Comportamento', 'Fraquezas', 'Condução']
        .map((key) => [key, String(data[key] || '').trim()])
        .filter(([, value]) => value);
      const natureFields = ['Tipo', 'Habitat', 'Instinto']
        .map((key) => [key, String(data[key] || '').trim()])
        .filter(([, value]) => value);
      const attrs = normalizeBeastAttributes(data.Atributos, true);
      const daAttr = beastDaAttribute(data);
      const daDice = daAttr ? beastDiceForScore(attrs[daAttr]) : 0;
      const dfLevel = beastDefenseLevel(data, 'DF');
      const dmLevel = beastDefenseLevel(data, 'DM');
      const description = e.bodyHtml
        ? `<div class="rt-content">${sanitizeHtml(e.bodyHtml)}</div>`
        : (e.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');

      const cardHead = (label, meta = '') => `
        <header class="beast-entry-section__head">
          <h2>${escapeHtml(label)}</h2>
          ${meta ? `<span>${escapeHtml(meta)}</span>` : ''}
        </header>`;

      const anatomyMarkup = `
        <section class="beast-entry-section beast-entry-section--anatomy">
          ${cardHead('Vitalidade e defesas', `${hpParts.length} ${hpParts.length === 1 ? 'campo de HP' : 'campos de HP'}`)}
          ${hpParts.length ? `<div class="beast-entry-hp-grid">
            ${hpParts.map((part) => `<div class="beast-entry-hp"><span>${escapeHtml(part.name)}</span><strong>${escapeHtml(part.hp || '—')}<small>HP</small></strong></div>`).join('')}
          </div>` : '<p class="beast-entry-empty">Nenhum campo de HP cadastrado.</p>'}
          <div class="beast-entry-vitals beast-entry-vitals--system">
            <span><small>DF · dano físico</small><strong>Nível ${dfLevel}</strong><em>${beastDefensePercent(dfLevel)}% de redução</em></span>
            <span><small>DM · dano mágico</small><strong>Nível ${dmLevel}</strong><em>${beastDefensePercent(dmLevel)}% de redução</em></span>
            <span><small>Reserva de Mana</small><strong>${escapeHtml(data.Mana || '—')}</strong><em>${data.Mana ? 'recurso arcano' : 'não definida'}</em></span>
          </div>
        </section>`;

      const attributesMarkup = Object.keys(attrs).length ? `
        <section class="beast-entry-section beast-entry-section--attributes">
          ${cardHead('Atributos', 'Pilhas de teste')}
          <div class="beast-entry-da">
            <span><small>DA · atributo-base</small><strong>${escapeHtml(daAttr || 'Não definida')}</strong></span>
            <em>${daAttr ? `${daDice}d6 + 1d12 no início do combate` : 'Escolha na edição da criatura'}</em>
          </div>
          <div class="beast-entry-attributes">
            ${CHAR_ATTRIBUTES.map((attr) => {
              const score = attrs[attr] != null ? attrs[attr] : CHAR_ATTR_BASE;
              return `<div><span>${escapeHtml(attr)}</span><strong>${beastDiceForScore(score)}d6</strong></div>`;
            }).join('')}
          </div>
        </section>` : '';

      const abilitiesMarkup = `
        <section class="beast-entry-section beast-entry-section--abilities">
          ${cardHead('Habilidades', `${abilities.length} ${abilities.length === 1 ? 'registro' : 'registros'}`)}
          ${abilities.length ? `<div class="beast-entry-abilities">
            ${abilities.map((ability, index) => {
              const hasCodex = ability.source === 'magic' && ability.refId && entryById(ability.refId);
              const detail = ability.effect || ability.summary || ability.trigger || 'Sem descrição.';
              const meta = [ability.cost, ability.range, ability.duration].filter(Boolean);
              return `<article class="beast-entry-ability">
                <button type="button" data-beast-ability-index="${index}">
                  <span class="beast-entry-ability__icon" aria-hidden="true">${ability.kind === 'Passiva' ? '◇' : '✦'}</span>
                  <span class="beast-entry-ability__content"><span><strong>${escapeHtml(ability.name)}</strong><em>${escapeHtml(ability.kind)}</em></span><small>${escapeHtml(detail)}</small></span>
                  ${meta.length ? `<span class="beast-entry-ability__meta">${meta.map((item) => `<b>${escapeHtml(item)}</b>`).join('')}</span>` : ''}
                </button>
                ${hasCodex ? `<a href="#/Magias/${encodeURIComponent(ability.refId)}" aria-label="Abrir ${escapeHtml(ability.name)} no Codex">Codex</a>` : ''}
              </article>`;
            }).join('')}
          </div>` : '<p class="beast-entry-empty">Nenhuma habilidade cadastrada.</p>'}
        </section>`;

      const dropsMarkup = (drops.length || data.Espólio || data.Espolio) ? `
        <section class="beast-entry-section beast-entry-section--drops">
          ${cardHead('Espólios', `${drops.length} ${drops.length === 1 ? 'item' : 'itens'}`)}
          ${drops.length ? `<div class="beast-entry-drops">${drops.map((drop) => {
            const linked = drop.refId && entryById(drop.refId);
            return `<div><span class="beast-entry-drop__icon">◇</span><span>${linked ? `<a href="#/Itens/${encodeURIComponent(drop.refId)}">${escapeHtml(drop.name)}</a>` : `<strong>${escapeHtml(drop.name)}</strong>`}<small>${escapeHtml([drop.quantity, drop.chance ? `${drop.chance}%` : '', drop.note].filter(Boolean).join(' · '))}</small></span></div>`;
          }).join('')}</div>` : ''}
          ${(data.Espólio || data.Espolio) ? `<p class="beast-entry-spoil">${escapeHtml(data.Espólio || data.Espolio)}</p>` : ''}
        </section>` : '';

      return `
        <article class="entry beast-entry" style="--hue:${theme.hue}">
          <section class="beast-entry__shell" data-beast-entry-id="${escapeHtml(e.id)}">
            <header class="beast-entry__header">
              ${npcCtx ? npcCtx.crumb : `<nav class="breadcrumb"><a href="#/">Codex</a><span>/</span><a href="#/Bestiario">Bestiário</a><span>/</span><span class="breadcrumb__current">${escapeHtml(e.title)}</span></nav>`}
              <div class="beast-entry__title-row">
                <span class="beast-entry__crest" aria-hidden="true">${iconOf('Bestiario')}</span>
                <div class="beast-entry__identity">
                  <span class="section__eyebrow">${escapeHtml(data.Tipo || 'CRIATURA')}</span>
                  <h1>${escapeHtml(e.title)}</h1>
                  <div class="beast-entry__tags">
                    ${data.Perigo ? `<span class="rarity-chip ${threatCssClass(data.Perigo)}">${escapeHtml(data.Perigo)}</span>` : ''}
                    ${tags.map((tag) => tagChipHTML(tag, 'story-tag story-tag--hero')).join('')}
                  </div>
                </div>
                <div class="beast-entry__actions">${actionsMarkup}</div>
              </div>
            </header>
            <div class="beast-entry__layout">
              <aside class="beast-entry__portrait-column">
                <div class="beast-entry__portrait ${e.image ? '' : 'is-fallback'}">
                  ${e.image ? `<img src="${e.image}" alt="${escapeHtml(e.title)}" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
                  <div class="beast-entry__portrait-fallback">${iconOf('Bestiario')}</div>
                </div>
                ${e.summary ? `<p class="beast-entry__summary">${escapeHtml(e.summary)}</p>` : ''}
                ${natureFields.length ? `<dl class="beast-entry__nature">${natureFields.map(([key, value]) => `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl>` : ''}
              </aside>
              <div class="beast-entry__technical">
                ${anatomyMarkup}
                ${attributesMarkup}
                ${abilitiesMarkup}
                ${dropsMarkup}
              </div>
              <aside class="beast-entry__guide">
                <header><span class="section__eyebrow">INSTRUÇÕES</span><h2>Guia do Mestre</h2><p>Referências para apresentar a criatura com consistência.</p></header>
                ${guideFields.length ? `<div class="beast-entry-guide-list">${guideFields.map(([key, value]) => `<section><h3>${escapeHtml(key)}</h3><p>${escapeHtml(value).replace(/\n/g, '<br>')}</p></section>`).join('')}</div>` : '<p class="beast-entry-empty">Nenhuma orientação específica cadastrada.</p>'}
                ${description ? `<section class="beast-entry__description"><h3>Relato</h3>${description}</section>` : ''}
              </aside>
            </div>
          </section>
          ${relatedMarkup ? `<div class="entry__main entry__main--full">${relatedMarkup}</div>` : ''}
      </article>`;
    }

    function renderRaceEntry(actionsMarkup) {
      const data = e.fields || {};
      const attributes = normalizeRaceAttributes(data);
      const anatomy = raceAnatomy(data);
      const abilities = normalizeRaceAbilities(data);
      const relations = normalizeRaceRelations(data);
      const totalHp = raceTotalHp(data);
      const physiology = [
        ['Constituição', data['Constituição']],
        ['Sentidos', data.Sentidos],
        ['Resistência', data['Resistência natural'] || data['Ponto forte']],
        ['Limitação', data['Limitação física'] || data.Penalidade || data['Ponto fraco']]
      ].filter(([, value]) => value);
      const identity = [
        ['Porte', data.Porte],
        ['Longevidade', data.Longevidade],
        ['Deslocamento', data.Deslocamento],
        ['Alimentação', data['Alimentação']],
        ['Origem', data.Origem]
      ].filter(([, value]) => value);
      const relationGroups = RACE_RELATION_TABS.map(({ tab: relationTab, label }) => ({
        tab: relationTab,
        label,
        entries: (relations[relationTab] || []).map((id) => entryById(id)).filter(Boolean)
      })).filter((group) => group.entries.length);
      const description = e.bodyHtml
        ? `<div class="rt-content">${sanitizeHtml(e.bodyHtml)}</div>`
        : (e.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
      const statIcon = {
        'Constituição': '⌁', Sentidos: '◉', Resistência: '◇', Limitação: '△'
      };
      const abilityGlyph = (kind) => kind === 'Limitação' ? '△' : (kind === 'Reação' ? '◇' : (kind === 'Passiva' ? '✦' : '◆'));
      const modifierLabel = (value) => value ? `${value > 0 ? '+' : ''}${value}d6` : '—';
      const manaMax = parseHpMax(data.Mana || '');

      return `
        <article class="race-entry" style="--hue:${theme.hue}">
          <header class="race-entry__masthead">
            <nav class="breadcrumb"><a href="#/">Codex</a><span>/</span><a href="#/Racas">Atlas das Raças</a><span>/</span><span class="breadcrumb__current">${escapeHtml(e.title)}</span></nav>
            <div class="race-entry__title-row">
              <span class="race-entry__emblem" aria-hidden="true">${raceEmblem}</span>
              <div class="race-entry__identity">
                <span class="section__eyebrow">${escapeHtml(data.Tipo || 'POVO')}</span>
                <h1>${escapeHtml(e.title)}</h1>
                ${e.summary ? `<p>${escapeHtml(e.summary)}</p>` : ''}
                <div class="race-entry__chips">
                  ${data.Raridade ? `<span class="rarity-chip ${rarityCssClass(data.Raridade)}">${escapeHtml(data.Raridade)}</span>` : ''}
                  ${data.Porte ? `<span>${escapeHtml(data.Porte)}</span>` : ''}
                  ${tags.map((tag) => tagChipHTML(tag, 'story-tag story-tag--hero')).join('')}
                </div>
              </div>
              <div class="race-entry__actions">${actionsMarkup}</div>
            </div>
          </header>

          <div class="race-entry__layout">
            <aside class="race-entry__portrait-column">
              <div class="race-entry__portrait-sticky">
                <div class="race-entry__portrait ${e.image ? '' : 'is-fallback'}">
                  ${e.image ? `<img src="${e.image}" alt="${escapeHtml(e.title)}" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
                  <span class="race-entry__portrait-fallback">${iconOf('Racas')}</span>
                  <small>ESPÉCIME · ${escapeHtml(String(e.id || '').slice(0, 8).toUpperCase())}</small>
                </div>
                ${identity.length ? `<section class="race-entry__specimen"><span class="section__eyebrow">IDENTIFICAÇÃO</span><dl>${identity.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(String(value))}</dd></div>`).join('')}</dl></section>` : ''}
              </div>
            </aside>

            <div class="race-entry__folio">
              <section class="race-folio-section">
                <header class="race-folio-head"><b><i>I</i></b><h2>Fisiologia</h2><span></span></header>
                ${physiology.length ? `<div class="race-biology-grid">${physiology.map(([label, value]) => `<article><i>${statIcon[label] || '◇'}</i><small>${escapeHtml(label)}</small><strong>${escapeHtml(String(value))}</strong></article>`).join('')}</div>` : '<p class="race-entry__empty">A fisiologia ainda não foi descrita.</p>'}
              </section>

              <section class="race-folio-section">
                <header class="race-folio-head"><b><i>II</i></b><h2>Anatomia e heranças</h2><span></span></header>
                <div class="race-anatomy-view">
                  <div class="race-anatomy-figure" data-race-anatomy-parallax aria-hidden="true">
                    <div class="race-anatomy-parallax__sigil"><i></i><i></i><i></i></div>
                    <div class="race-anatomy-parallax__plane race-anatomy-parallax__plane--mist"><img src="assets/images/race-anatomy-abstract.webp" alt=""></div>
                    <div class="race-anatomy-parallax__plane race-anatomy-parallax__plane--aura"><img src="assets/images/race-anatomy-abstract.webp" alt=""></div>
                    <div class="race-anatomy-parallax__plane race-anatomy-parallax__plane--core"><img src="assets/images/race-anatomy-abstract.webp" alt=""></div>
                    <div class="race-anatomy-parallax__dust">${Array.from({ length: 9 }, (_, index) => `<i style="--dust-duration:${(5.2 + index * .41).toFixed(2)}s;--dust-delay:${(-index * .67).toFixed(2)}s"></i>`).join('')}</div>
                    <span class="race-anatomy-figure__count">${totalHp ? `${totalHp} HP` : `${anatomy.length} partes`}</span>
                  </div>
                  <div class="race-anatomy-parts">
                    ${anatomy.length ? anatomy.map((part) => `<span><small>${escapeHtml(part.name)}</small><strong>${escapeHtml(part.hp || '—')}<em>HP</em></strong></span>`).join('') : '<p class="race-entry__empty">Nenhuma parte anatômica definida.</p>'}
                  </div>
                </div>
                ${abilities.length ? `<div class="race-ability-view">${abilities.map((ability, index) => `<article><span class="race-ability-view__glyph">${abilityGlyph(ability.kind)}</span><div><strong>${escapeHtml(ability.name || `Aptidão ${index + 1}`)}<small>${escapeHtml(ability.kind)}</small></strong><p>${escapeHtml(ability.effect || ability.summary || ability.trigger || 'Sem descrição.')}</p>${ability.limit ? `<em>${escapeHtml(ability.limit)}</em>` : ''}</div>${ability.source === 'magic' && ability.refId && entryById(ability.refId) ? `<a href="#/Magias/${encodeURIComponent(ability.refId)}">Grimório</a>` : ''}</article>`).join('')}</div>` : ''}
              </section>

              ${relationGroups.length ? `<section class="race-folio-section"><header class="race-folio-head"><b><i>III</i></b><h2>Presença no mundo</h2><span></span></header><div class="race-relation-view">${relationGroups.map((group) => `<section><small>${escapeHtml(group.label)}</small>${group.entries.map((entry) => `<a href="#/${entry.tab}/${encodeURIComponent(entry.id)}"><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.summary || 'Abrir registro no Codex')}</span></a>`).join('')}</section>`).join('')}</div></section>` : ''}

              ${description ? `<section class="race-folio-section race-folio-section--lore"><header class="race-folio-head"><b><i>${relationGroups.length ? 'IV' : 'III'}</i></b><h2>Relato</h2><span></span></header>${description}</section>` : ''}
            </div>

            <aside class="race-impact">
              <header><span>APLICAÇÃO AUTOMÁTICA</span><h2>Impacto na ficha</h2></header>
              <div class="race-impact__attrs">${CHAR_ATTRIBUTES.map((attr) => { const value = Number(attributes[attr]) || 0; return `<div class="${value > 0 ? 'is-boost' : (value < 0 ? 'is-penalty' : '')}"><small>${escapeHtml(attr)}</small><strong>${escapeHtml(modifierLabel(value))}</strong></div>`; }).join('')}</div>
              <div class="race-impact__vitals">
                <div><span>Vitalidade anatômica <b>${totalHp || '—'}${totalHp ? ' HP' : ''}</b></span><i><em style="width:${totalHp ? Math.min(100, Math.max(18, totalHp / 7)) : 0}%"></em></i></div>
                <div><span>Reserva de Mana <b>${escapeHtml(data.Mana || '—')}</b></span><i><em style="width:${manaMax ? Math.min(100, Math.max(18, manaMax * 2.5)) : 0}%"></em></i></div>
              </div>
              <div class="race-impact__summary"><div><small>Movimento</small><strong>${escapeHtml(data.Deslocamento || '—')}</strong></div><div><small>Sentidos</small><strong>${escapeHtml(data.Sentidos || '—')}</strong></div><div><small>Aptidões</small><strong>${abilities.filter((ability) => ability.kind !== 'Limitação').length}</strong></div><div><small>Limitações</small><strong>${abilities.filter((ability) => ability.kind === 'Limitação').length}</strong></div></div>
              <a class="race-impact__persona" href="#/Mesas">Usar numa mesa</a>
            </aside>
          </div>
          ${relatedMarkup ? `<div class="entry__main entry__main--full race-entry__related">${relatedMarkup}</div>` : ''}
        </article>`;
    }

    const beastAttrMarkup = isBestiario
      ? renderBeastAttributesCard(null, e.fields || {}, `
          <header class="entry__dossier-head dossier-head--ornate">
            <span class="dossier-mark">II</span>
            <span class="section__eyebrow">ATRIBUTOS</span>
            <span class="dossier-rule" aria-hidden="true"></span>
          </header>
        `)
      : '';

    const dossierMarkup = isSectioned
      ? renderRaceDossierView(tabId, e.fields, { skipAttributes: isBestiario })
      : renderItensDossier();

    const promotedKey = isSectioned ? dossierConfigFor(tabId).promotedKey : '';
    const raceRarity = isSectioned && e.fields ? (e.fields[promotedKey] || '') : '';
    const raceEmblem = isBestiario
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9c0-3.3 3.1-6 7-6s7 2.7 7 6c0 2.1-1 3.6-2.2 5.1-.8 1-1.1 1.7-1.3 3.1-.2 1.4-1.4 2.3-3.5 2.3s-3.3-.9-3.5-2.3c-.2-1.4-.5-2.1-1.3-3.1C6 12.6 5 11.1 5 9z"/><path d="M9.5 9.5l-1.5 3M14.5 9.5l1.5 3M12 14v4"/><circle cx="9.5" cy="9" r=".6" fill="currentColor"/><circle cx="14.5" cy="9" r=".6" fill="currentColor"/></svg>'
      : (isRacas
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.7 4.6L18 8l-3.6 2.7 1.4 4.5L12 12.7 8.2 15.2l1.4-4.5L6 8l4.3-1.4L12 2z"/><circle cx="12" cy="20" r="1"/><path d="M9 17h6"/></svg>'
        : '');

    const heroPortrait = `
      <div class="entry__portrait-card ${isSectioned ? 'entry__portrait-card--tall' : ''} ${isBestiario ? 'entry__portrait-card--beast' : ''}" ${isBestiario ? `data-beast-entry-id="${escapeHtml(e.id)}"` : ''} style="--hue:${theme.hue}">
        ${subtypeIcon ? `<div class="entry__subtype-emblem" aria-hidden="true">${subtypeIcon}</div>` : ''}
        ${raceEmblem ? `<div class="entry__subtype-emblem entry__subtype-emblem--race" aria-hidden="true">${raceEmblem}</div>` : ''}
        <header class="entry__portrait-header">
          <nav class="breadcrumb">
            <a href="#/">Codex</a>
            <span>/</span>
            <a href="#/${tabId}">${escapeHtml(tab.title)}</a>
            <span>/</span>
            <span class="breadcrumb__current">${escapeHtml(e.title)}</span>
          </nav>
          <div class="entry__tagline">
            ${subtypeName ? `<span class="entry__cat entry__cat--subtype">${escapeHtml(subtypeName.toUpperCase())}</span>` : ''}
            ${raceRarity ? dossierValueHTML(promotedKey, raceRarity) : ''}
            ${tags.length
              ? tags.map((tag) => tagChipHTML(tag, 'story-tag story-tag--hero')).join('')
              : (subtypeName || raceRarity ? '' : `<span class="entry__cat">${escapeHtml(theme.label)}</span>`)}
          </div>
          <h1 class="entry__title entry__title--portrait" data-text-reveal>${escapeHtml(e.title)}</h1>
          ${e.summary ? `<p class="entry__summary">${escapeHtml(e.summary)}</p>` : ''}
        </header>
        <div class="entry__portrait-grid">
          <div class="entry__portrait-stack">
            <div class="entry__portrait" style="aspect-ratio: ${bannerAspectFor(tabId)};">
              ${e.image ? `<img class="entry__portrait-img" src="${e.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
              <div class="entry__portrait-fallback">${iconOf(tabId)}</div>
              <div class="entry__portrait-shine" aria-hidden="true"></div>
            </div>
            ${beastAttrMarkup}
          </div>
          ${dossierMarkup}
        </div>
      </div>
    `;

    const heroLandscape = `
      <div class="entry__hero">
        ${e.image ? `<img class="entry__img" src="${e.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
        <div class="entry__fallback">${iconOf(tabId)}</div>
        <div class="entry__shade"></div>
        <div class="entry__hero-content">
          <nav class="breadcrumb">
            <a href="#/">Codex</a>
            <span>/</span>
            <a href="#/${tabId}">${escapeHtml(tab.title)}</a>
            <span>/</span>
            <span class="breadcrumb__current">${escapeHtml(e.title)}</span>
          </nav>
          <div class="entry__tagline">
            ${tags.length
              ? tags.map((tag) => tagChipHTML(tag, 'story-tag story-tag--hero')).join('')
              : `<span class="entry__cat">${escapeHtml(theme.label)}</span>`}
          </div>
          <h1 class="entry__title" data-text-reveal>${escapeHtml(e.title)}</h1>
          ${e.summary ? `<p class="entry__summary">${escapeHtml(e.summary)}</p>` : ''}
        </div>
        <div class="hero__scroll" aria-hidden="true">
          <span>scroll</span>
          <div class="hero__scrollLine"></div>
        </div>
      </div>
    `;

    const relatedMarkup = related.length ? `
      <div class="related">
        <span class="section__eyebrow">VEJA TAMBÉM</span>
        <div class="related__grid">
          ${related.map((r, i) => `
            <a href="#/${r.tab}/${r.id}" class="related__card" style="--delay:${i * 60}ms">
              <span class="related__title">${escapeHtml(r.title)}</span>
              <span class="related__summary">${escapeHtml(r.summary || '')}</span>
              <span class="related__arrow">→</span>
            </a>
          `).join('')}
        </div>
      </div>
    ` : '';

    const editButton = (e.isUserCreated && auth.isAdmin) ? `
      <a class="back-link back-link--edit" href="#/${tabId}/${encodeURIComponent(e.id)}/editar">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
        Editar ${tabId === 'Itens' ? 'item' : (tabId === 'Racas' ? 'raça' : (tabId === 'Bestiario' ? 'criatura' : 'história'))}
      </a>
    ` : '';

    const deleteButton = (e.isUserCreated && auth.isAdmin) ? `
      <button type="button" class="back-link back-link--danger" data-delete-entry="${escapeHtml(e.id)}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        Apagar ${tabId === 'Itens' ? 'item' : (tabId === 'Racas' ? 'raça' : (tabId === 'Bestiario' ? 'criatura' : 'história'))}
      </button>
    ` : '';

    const backLink = `
      <a href="#/${tabId}" class="back-link">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Voltar a ${escapeHtml(tab.title)}
      </a>
    `;

    if (isBestiario) {
      return renderBestiaryEntry(npcCtx ? npcCtx.actions : `${editButton}${deleteButton}${backLink}`);
    }

    if (isRacas) {
      return renderRaceEntry(`${editButton}${deleteButton}${backLink}`);
    }

    if (portrait) {
      return `
        <article class="entry entry--portrait" style="--hue:${theme.hue}">
          ${heroPortrait}
          ${bodyMarkup ? `<div class="entry__main entry__main--full">${bodyMarkup}</div>` : ''}
          ${relatedMarkup ? `<div class="entry__main entry__main--full">${relatedMarkup}</div>` : ''}
          <div class="entry__actions-row">
            ${editButton}
            ${deleteButton}
            ${backLink}
          </div>
        </article>
      `;
    }

    return `
      <article class="entry" style="--hue:${theme.hue}">
        ${heroLandscape}

        <div class="entry__layout">
          <div class="entry__main">
            ${bodyMarkup}
            ${relatedMarkup}
          </div>

          <aside class="entry__aside">
            ${fields.length ? `
              <div class="meta-card">
                <span class="section__eyebrow">DOSSIÊ</span>
                <dl class="meta-list">
                  ${fields.map(([k, v]) => `
                    <div class="meta-row">
                      <dt>${escapeHtml(k)}</dt>
                      <dd>${escapeHtml(v)}</dd>
                    </div>
                  `).join('')}
                </dl>
              </div>
            ` : ''}
            ${editButton}
            ${deleteButton}
            ${backLink}
          </aside>
        </div>
      </article>
    `;
  }

  /* ════════════════════════════════════════════════
     MESAS — o centro da plataforma
     Cada mesa escolhe um sistema e tem Chat, Fichas, NPCs e Membros.
     ════════════════════════════════════════════════ */
  const MESA_SYSTEMS = {
    arcano: {
      name: 'Arcano',
      tone: 'Dark fantasy de magia viva, mana morta e sobrevivência.',
      href: '#/Arcano',
      image: 'assets/images/hero-arcano.webp'
    }
  };
  const MESA_TABS = [
    { id: 'chat', label: 'Chat' },
    { id: 'fichas', label: 'Fichas' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'membros', label: 'Membros' }
  ];
  const MESA_TABLE_HINT = 'As mesas ainda não existem no banco. Rode o arquivo supabase-mesas.sql no SQL Editor do Supabase.';

  let MESAS = [];
  // Mesas que Platina enxerga sem participar (papel 'observador').
  let MESAS_OBSERVED = [];
  let mesasLoaded = false;
  let mesasUnavailable = false;
  const MESA_MEMBERS = {};
  const MESA_NPCS = {};
  const MESA_MESSAGES = {};
  let mesaChannel = null;
  let mesaChannelId = '';
  let characterFormMesaId = '';
  let characterFormNpc = false;
  let npcFormCtx = null;
  let viewedNpc = null;

  function mesaTableMissing(error) {
    const msg = (error && error.message) || '';
    return (error && (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST200')) ||
      /mesa(s|_members|_npcs|_messages)/i.test(msg) && /does not exist|schema cache|could not find/i.test(msg);
  }

  function rowToMesa(row, role) {
    return {
      id: row.id,
      name: row.name || 'Mesa sem nome',
      description: row.description || '',
      system: row.system || 'arcano',
      ownerId: row.owner_id,
      inviteCode: row.invite_code || '',
      hasPassword: !!row.has_password,
      role: role || (auth.user && row.owner_id === auth.user.id ? 'mestre' : 'jogador'),
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    };
  }

  function rowToNpc(row) {
    return {
      id: row.id,
      tab: 'Bestiario',
      mesaId: row.mesa_id,
      title: row.title || 'NPC',
      summary: row.summary || '',
      image: row.image || '',
      imagePath: row.image_path || '',
      bodyHtml: row.body_html || '',
      tags: sanitizeTags(row.tags || []),
      subtype: '',
      fields: (row.fields && typeof row.fields === 'object') ? row.fields : {},
      sourceEntryId: row.source_entry_id || '',
      visible: !!row.visible,
      isUserCreated: true,
      isNpc: true,
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
    };
  }

  const mesaById = (id) => MESAS.find((m) => m.id === id) || MESAS_OBSERVED.find((m) => m.id === id) || null;
  const MESA_ROLE_LABELS = { mestre: 'Mestre', jogador: 'Jogador', observador: 'Platina · observando' };
  const mesaRoleLabel = (role) => MESA_ROLE_LABELS[role] || 'Jogador';
  const isMesaMaster = (id) => !!id && mesaById(id)?.role === 'mestre';

  function characterBase(c) {
    if (!c || !c.mesaId) return '#/Persona';
    return `#/Mesas/${encodeURIComponent(c.mesaId)}/${c.isNpc ? 'npcs' : 'fichas'}`;
  }

  /* Mestre da mesa da ficha (ou Platina): cria livre, concede nível, atribui dono. */
  function isCharacterMaster(c) {
    return auth.isPlatina || (!!c && !!c.mesaId && isMesaMaster(c.mesaId));
  }

  function canEditCharacter(c) {
    if (!c || !auth.user) return false;
    return auth.isPlatina || c.userId === auth.user.id || isMesaMaster(c.mesaId);
  }

  function myDisplayName() {
    return (auth.profile && auth.profile.display_name) ||
      auth.user?.user_metadata?.display_name ||
      (auth.user?.email || 'Jogador').split('@')[0];
  }

  function memberName(mesaId, userId) {
    const member = (MESA_MEMBERS[mesaId] || []).find((m) => m.userId === userId);
    return (member && member.displayName) || 'Jogador';
  }

  async function loadMesas(force) {
    if (!sb || !auth.user || (mesasLoaded && !force)) return;
    const { data, error } = await sb
      .from('mesa_members')
      .select('role, mesa:mesas(*)')
      .eq('user_id', auth.user.id);
    if (error) {
      if (mesaTableMissing(error)) {
        mesasUnavailable = true;
        console.warn('[O Arcano] ' + MESA_TABLE_HINT);
      } else {
        console.error('Erro ao carregar mesas:', error);
      }
      return;
    }
    mesasUnavailable = false;
    MESAS = (data || [])
      .filter((row) => row.mesa)
      .map((row) => rowToMesa(row.mesa, row.role))
      .sort((a, b) => b.createdAt - a.createdAt);
    MESAS_OBSERVED = [];
    if (auth.isPlatina) {
      const all = await sb.from('mesas').select('*').order('created_at', { ascending: false });
      if (all.error) console.error('Erro ao carregar todas as mesas:', all.error);
      const mine = new Set(MESAS.map((m) => m.id));
      MESAS_OBSERVED = (all.data || []).filter((row) => !mine.has(row.id)).map((row) => rowToMesa(row, 'observador'));
    }
    mesasLoaded = true;
  }

  async function loadMesaDetail(mesaId) {
    if (!sb || !mesaById(mesaId)) return;
    const [members, npcs, messages] = await Promise.all([
      sb.from('mesa_members').select('*').eq('mesa_id', mesaId).order('joined_at'),
      sb.from('mesa_npcs').select('*').eq('mesa_id', mesaId).order('created_at'),
      sb.from('mesa_messages').select('*').eq('mesa_id', mesaId).order('created_at', { ascending: false }).limit(200)
    ]);
    if (members.error) console.error('Erro ao carregar membros:', members.error);
    if (npcs.error) console.error('Erro ao carregar NPCs:', npcs.error);
    if (messages.error) console.error('Erro ao carregar o chat:', messages.error);
    MESA_MEMBERS[mesaId] = (members.data || []).map((m) => ({
      userId: m.user_id,
      role: m.role,
      displayName: m.display_name || '',
      joinedAt: m.joined_at
    }));
    MESA_NPCS[mesaId] = (npcs.data || []).map(rowToNpc);
    MESA_MESSAGES[mesaId] = (messages.data || []).reverse();
    const state = await sb.from('mesa_state').select('initiative').eq('mesa_id', mesaId).maybeSingle();
    if (state.error) console.error('Erro ao carregar a iniciativa:', state.error);
    MESA_STATE[mesaId] = (state.data && state.data.initiative) || {};
    if (isMesaMaster(mesaId)) await Promise.all([loadMesaImages(mesaId), loadMesaSecrets(mesaId)]);
    // Fichas: a RLS devolve as da mesa para todos os membros.
    charactersLoaded = false;
    await loadCharacters();
  }

  async function createMesa({ name, description, system }) {
    const { data, error } = await sb
      .from('mesas')
      .insert({ name, description, system, owner_id: auth.user.id })
      .select()
      .single();
    if (error) throw mesaTableMissing(error) ? new Error(MESA_TABLE_HINT) : error;
    const mesa = rowToMesa(data, 'mestre');
    MESAS.unshift(mesa);
    return mesa;
  }

  /* Mesa com senha: o banco responde MESA_SENHA_NECESSARIA / MESA_SENHA_INCORRETA. */
  let mesaJoinPrompt = null;
  const isPasswordError = (err, kind) => String(err && err.message || '').includes(kind);

  async function joinMesa(code, password) {
    const { data, error } = await sb.rpc('join_mesa', { p_code: code, p_password: password || null });
    if (error) throw mesaTableMissing(error) ? new Error(MESA_TABLE_HINT) : error;
    await loadMesas(true);
    return data;
  }

  async function saveMesaNpc(mesaId, existing, payload) {
    const row = {
      mesa_id: mesaId,
      title: payload.title,
      summary: payload.summary || '',
      image: payload.image || '',
      image_path: payload.imagePath || '',
      body_html: payload.bodyHtml || '',
      tags: payload.tags || [],
      fields: payload.fields || {},
      updated_at: new Date().toISOString()
    };
    const query = existing
      ? sb.from('mesa_npcs').update(row).eq('id', existing.id)
      : sb.from('mesa_npcs').insert(row);
    const { data, error } = await query.select().single();
    if (error) throw error;
    const npc = rowToNpc(data);
    const list = MESA_NPCS[mesaId] || (MESA_NPCS[mesaId] = []);
    const index = list.findIndex((n) => n.id === npc.id);
    if (index >= 0) list[index] = npc; else list.push(npc);
    return npc;
  }

  async function importBestiaryNpc(mesaId, entryId) {
    const source = entryById(entryId);
    if (!source) throw new Error('Criatura não encontrada no Bestiário.');
    await loadEntryDetails(source);
    const { data, error } = await sb.from('mesa_npcs').insert({
      mesa_id: mesaId,
      title: source.title,
      summary: source.summary || '',
      // A imagem continua sendo do Bestiário: o NPC não é dono do arquivo.
      image: source.image || '',
      image_path: '',
      body_html: source.bodyHtml || '',
      tags: source.tags || [],
      fields: source.fields || {},
      source_entry_id: source.id
    }).select().single();
    if (error) throw error;
    const npc = rowToNpc(data);
    (MESA_NPCS[mesaId] || (MESA_NPCS[mesaId] = [])).push(npc);
    return npc;
  }

  /* ── Rotas: #/Mesas, #/Mesas/criar, #/Mesas/entrar/<codigo>,
     #/Mesas/<id>[/<aba>], #/Mesas/<id>/fichas|npcs/<item>[/editar] ── */
  function parseMesaRoute(entry, action) {
    if (!entry) return { view: action === 'criar' ? 'create' : 'list' };
    const parts = entry.split('/').filter(Boolean);
    if (parts[0] === 'entrar') return { view: 'join', code: parts[1] || '' };
    const [mesaId, tab = 'chat', itemId = ''] = parts;
    if (tab === 'fichas') {
      if (action === 'criar' && !itemId) return { view: 'character-form', mesaId };
      if (itemId) return { view: action === 'editar' ? 'character-form' : 'character', mesaId, itemId };
    }
    if (tab === 'npcs') {
      if (action === 'criar' && !itemId) return { view: 'npc-form', mesaId };
      if (itemId) return { view: action === 'editar' ? 'npc-form' : 'npc', mesaId, itemId };
    }
    return { view: 'mesa', mesaId, tab: MESA_TABS.some((t) => t.id === tab) ? tab : 'chat' };
  }

  async function prepareMesaRoute(route) {
    if (route.view === 'join' && route.code) {
      try {
        const mesaId = await joinMesa(route.code);
        mesaJoinPrompt = null;
        location.replace(`#/Mesas/${encodeURIComponent(mesaId)}`);
      } catch (err) {
        if (isPasswordError(err, 'MESA_SENHA_NECESSARIA')) {
          mesaJoinPrompt = { code: route.code };
          return true;
        }
        console.error(err);
        toast('Não foi possível entrar na mesa: ' + (err.message || err));
        location.replace('#/Mesas');
      }
      return false;
    }
    if (route.mesaId) {
      await loadMesaDetail(route.mesaId);
      if (route.view === 'npc-form' || route.view === 'npc' || route.tab === 'npcs') await Promise.all([loadTabFields('Bestiario'), loadTabFields('Racas')]);
      if (route.view === 'character-form' || (route.view === 'mesa' && route.tab === 'chat')) await loadTabFields('Racas');
    }
    return true;
  }

  function viewMesaRoute(route) {
    if (route.view === 'list') return viewMesasList();
    if (route.view === 'create') return viewMesaCreate();
    if (route.view === 'join') return viewMesaJoining(route);
    const mesa = mesaById(route.mesaId);
    if (!mesa) return viewMesaMissing();
    if (route.view === 'character-form') {
      if (route.itemId && characterById(route.itemId)?.mesaId !== mesa.id) return viewNotFound(route.itemId);
      characterFormMesaId = mesa.id;
      return viewCharacterForm(route.itemId || null);
    }
    if (route.view === 'character') {
      if (characterById(route.itemId)?.mesaId !== mesa.id) return viewNotFound(route.itemId);
      return viewCharacterSheetFolio(route.itemId);
    }
    if (route.view === 'npc-form') {
      if (mesa.role !== 'mestre') return viewForbidden();
      const npcChar = route.itemId ? characterById(route.itemId) : null;
      if (!route.itemId || (npcChar && npcChar.isNpc && npcChar.mesaId === mesa.id)) {
        characterFormMesaId = mesa.id;
        characterFormNpc = true;
        return viewCharacterForm(npcChar ? npcChar.id : null);
      }
      const npc = route.itemId ? (MESA_NPCS[mesa.id] || []).find((n) => n.id === route.itemId) : null;
      if (route.itemId && !npc) return viewNotFound(route.itemId);
      npcFormCtx = { mesaId: mesa.id, npc };
      const base = `#/Mesas/${encodeURIComponent(mesa.id)}/npcs`;
      return viewCreate('Bestiario', npc ? npc.id : null, npcFormCtx)
        .replace('id="createForm"', `id="createForm" data-npc-mesa="${escapeHtml(mesa.id)}"`)
        .replaceAll('href="#/Bestiario', `href="${base}`);
    }
    if (route.view === 'npc') {
      const npcChar = characterById(route.itemId);
      if (npcChar && npcChar.isNpc && npcChar.mesaId === mesa.id) return viewCharacterSheetFolio(npcChar.id);
      return viewMesaNpc(mesa, route.itemId);
    }
    return viewMesa(mesa, route.tab);
  }

  /* ── PÁGINA INICIAL DA PLATAFORMA (#/) ───────── */
  function viewPlatformHome() {
    const mesas = MESAS.slice(0, 5);
    const systems = Object.entries(MESA_SYSTEMS);
    return `
      <section class="codex-home__hero platform-hero" data-home-parallax>
        <div class="codex-home__world auth-gate__world" aria-hidden="true">
          <div class="auth-gate__layer auth-gate__base" data-auth-depth="5"></div>
          <div class="auth-gate__layer auth-gate__nebula" data-auth-depth="18"></div>
          <div class="auth-gate__layer auth-gate__starlight" data-auth-depth="34"></div>
          <div class="auth-gate__layer auth-gate__foreground" data-auth-depth="52"></div>
          <canvas class="auth-gate__fog" data-auth-fog></canvas>
          <canvas class="auth-gate__dust" data-auth-dust></canvas>
          <div class="auth-gate__grade"></div>
          <div class="auth-gate__grain"></div>
          <div class="auth-gate__vignette"></div>
        </div>
        <div class="codex-home__veil"></div>
        <span class="arc-trace arc-trace--top" aria-hidden="true"></span>
        <span class="arc-trace arc-trace--bottom" aria-hidden="true"></span>
        <div class="codex-home__copy">
          <div class="codex-home__eyebrow"><i></i><span>RPG E MUITO MAIS</span></div>
          <p class="codex-home__kicker">Mesas de RPG</p>
          <h1 data-text-reveal>O Arcano</h1>
          <p class="codex-home__subtitle">Crie uma mesa, convide seu grupo e jogue com chat, fichas e NPCs no mesmo lugar. Cada mesa escolhe seu sistema, começando pelo Arcano.</p>
          <div class="codex-home__actions">
            <a href="#/Mesas/criar" class="btn btn-primary arc-energy-button">
              <span>Criar mesa</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <a href="#/Mesas" class="btn btn-ghost"><span>Minhas mesas</span></a>
          </div>
        </div>
      </section>

      <section class="section platform-section">
        <header class="codex-home__section-head">
          <div><span>MESAS</span><h2>Onde você joga</h2></div>
          <p>${mesasUnavailable ? escapeHtml(MESA_TABLE_HINT) : 'Suas mesas, como Mestre ou jogador.'}</p>
        </header>
        <div class="entry-grid">
          ${mesaCreateCardHTML()}
          ${mesas.map((m, i) => mesaCardHTML(m, i + 1)).join('')}
        </div>
        ${MESAS.length > mesas.length ? `<p class="platform-more"><a href="#/Mesas" class="back-link">Ver todas as ${MESAS.length} mesas</a></p>` : ''}
      </section>

      <section class="section platform-section">
        <header class="codex-home__section-head">
          <div><span>SISTEMAS</span><h2>Escolha as regras da mesa</h2></div>
          <p>Cada sistema tem seu próprio livro, com mundo, regras e criaturas.</p>
        </header>
        <div class="platform-systems">
          ${systems.map(([id, sys]) => `
            <a href="${sys.href}" class="platform-system" style="--hue:${themeOf('Arcano').hue}">
              <img src="${sys.image}" alt="" loading="lazy" decoding="async">
              <span class="platform-system__shade"></span>
              <span class="platform-system__body">
                <small>SISTEMA</small>
                <strong>${escapeHtml(sys.name)}</strong>
                <span>${escapeHtml(sys.tone)}</span>
                <em>Abrir o livro →</em>
              </span>
            </a>`).join('')}
          <div class="platform-system platform-system--soon">
            <span class="platform-system__body">
              <small>SISTEMA</small>
              <strong>Outros sistemas</strong>
              <span>Novos sistemas de jogo chegam nas próximas atualizações.</span>
              <em>Em breve</em>
            </span>
          </div>
        </div>
      </section>
    `;
  }

  /* ── LISTA (#/Mesas) ─────────────────────────── */
  function mesaCreateCardHTML() {
    return `
      <a href="#/Mesas/criar" class="entry-card create-card" style="--hue:${themeOf('Mesas').hue};--delay:0ms" aria-label="Criar nova mesa">
        <div class="create-card__inner">
          <div class="create-card__plus">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span class="create-card__label">Criar mesa</span>
          <span class="create-card__hint">Você será o Mestre</span>
        </div>
      </a>`;
  }

  function mesaCardHTML(m, i) {
    const sys = MESA_SYSTEMS[m.system] || { name: m.system, image: '' };
    return `
      <a href="#/Mesas/${encodeURIComponent(m.id)}" class="entry-card mesa-card" style="--hue:${themeOf('Mesas').hue};--delay:${i * 40}ms">
        <div class="entry-card__media">
          ${sys.image ? `<img loading="lazy" decoding="async" src="${sys.image}" alt="">` : ''}
          <div class="entry-card__fallback">${iconOf('Mesas')}</div>
          <div class="entry-card__shade"></div>
          <div class="entry-card__tags">
            <span class="char-badge ${m.role === 'mestre' ? 'char-badge--mage' : 'char-badge--mundane'}">${escapeHtml(mesaRoleLabel(m.role))}</span>
          </div>
        </div>
        <div class="entry-card__body">
          <h3 class="entry-card__title">${escapeHtml(m.name)}</h3>
          <p class="entry-card__summary">${escapeHtml(m.description || 'Sem descrição.')}</p>
          <div class="entry-card__chips"><span class="chip">Sistema ${escapeHtml(sys.name)}</span>${m.hasPassword ? '<span class="chip">Com senha</span>' : ''}</div>
        </div>
      </a>`;
  }

  function viewMesasList() {
    const theme = themeOf('Mesas');
    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf('Mesas')}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title" data-text-reveal>Mesas</h1>
          <p class="cat-hero__tone">Cada mesa reúne o chat da sessão, as fichas dos jogadores e os NPCs do Mestre.</p>
          <div class="cat-hero__meta">
            <span class="badge"><strong>${MESAS.length}</strong> ${MESAS.length === 1 ? 'mesa' : 'mesas'}</span>
          </div>
        </div>
      </section>
      ${mesasUnavailable ? `<p class="mesa-notice">${escapeHtml(MESA_TABLE_HINT)}</p>` : ''}
      <form class="mesa-join" id="mesaJoinForm">
        <label for="mesaJoinCode"><strong>Recebeu um convite?</strong><span>Cole o código ou o link da mesa.</span></label>
        <input id="mesaJoinCode" name="code" type="text" autocomplete="off" placeholder="ex.: 3f9a1c2b" required>
        <button type="submit" class="btn btn-primary"><span>Entrar na mesa</span></button>
      </form>
      <section class="entry-grid">
        ${mesaCreateCardHTML()}
        ${MESAS.map((m, i) => mesaCardHTML(m, i + 1)).join('')}
      </section>
      ${auth.isPlatina ? `
        <section class="section">
          <header class="section__head">
            <div>
              <span class="section__eyebrow">VISÃO PLATINA</span>
              <h2 class="section__title">Todas as outras mesas</h2>
            </div>
          </header>
          ${MESAS_OBSERVED.length
            ? `<div class="entry-grid">${MESAS_OBSERVED.map((m, i) => mesaCardHTML(m, i)).join('')}</div>`
            : '<p class="mesa-notice mesa-notice--soft">Nenhuma outra mesa por enquanto.</p>'}
        </section>` : ''}`;
  }

  function viewMesaCreate() {
    const theme = themeOf('Mesas');
    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf('Mesas')}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">CRIAR · MESAS</span>
          <h1 class="cat-hero__title" data-text-reveal>Nova mesa</h1>
          <p class="cat-hero__tone">Dê um nome, escolha o sistema e convide seu grupo depois.</p>
        </div>
      </section>
      <form class="mesa-form" id="mesaCreateForm">
        <label class="mesa-form__field">
          <span>Nome da mesa</span>
          <input name="name" type="text" maxlength="80" required placeholder="ex.: As Cinzas de Valdrek">
        </label>
        <label class="mesa-form__field">
          <span>Descrição</span>
          <textarea name="description" rows="3" maxlength="600" placeholder="Do que se trata a campanha, dia e horário das sessões..."></textarea>
        </label>
        <fieldset class="mesa-form__systems">
          <legend>Sistema</legend>
          ${Object.entries(MESA_SYSTEMS).map(([id, sys], i) => `
            <label class="mesa-form__system">
              <input type="radio" name="system" value="${id}" ${i === 0 ? 'checked' : ''}>
              <span><strong>${escapeHtml(sys.name)}</strong><small>${escapeHtml(sys.tone)}</small></span>
            </label>`).join('')}
          <label class="mesa-form__system is-disabled">
            <input type="radio" name="system" value="" disabled>
            <span><strong>Outros sistemas</strong><small>Em breve.</small></span>
          </label>
        </fieldset>
        <div class="mesa-form__actions">
          <a href="#/Mesas" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary"><span>Criar mesa</span></button>
        </div>
      </form>`;
  }

  function viewMesaJoining(route) {
    if (!mesaJoinPrompt || mesaJoinPrompt.code !== route.code) return `<p class="mesa-notice">Entrando na mesa…</p>`;
    return `
      <form class="mesa-lock" id="mesaPasswordForm" data-code="${escapeHtml(route.code)}">
        <span class="mesa-lock__icon" aria-hidden="true">${TOOL_ICON('<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 018 0v4"/>')}</span>
        <h2>Mesa com senha</h2>
        <input type="password" name="password" autocomplete="off" maxlength="72" required aria-label="Senha da mesa" placeholder="Senha">
        <p class="mesa-lock__error" data-lock-error aria-live="polite"></p>
        <div class="mesa-lock__actions">
          <a href="#/Mesas" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary"><span>Entrar</span></button>
        </div>
      </form>`;
  }

  function viewMesaMissing() {
    return `
      <section class="empty-state">
        <div class="empty-state__icon">${iconOf('Mesas')}</div>
        <h3>Mesa não encontrada</h3>
        <p>Ela não existe ou você ainda não participa dela. Peça o convite ao Mestre.</p>
        <a href="#/Mesas" class="btn btn-primary">Ver minhas mesas</a>
      </section>`;
  }

  /* ── MESA (#/Mesas/<id>/<aba>) ───────────────── */
  function viewMesa(mesa, tabId) {
    const theme = themeOf('Mesas');
    const sys = MESA_SYSTEMS[mesa.system] || { name: mesa.system, href: '#/' };
    const base = `#/Mesas/${encodeURIComponent(mesa.id)}`;
    const characters = CHARACTERS.filter((c) => c.mesaId === mesa.id && !c.isNpc);
    const npcs = MESA_NPCS[mesa.id] || [];
    const members = MESA_MEMBERS[mesa.id] || [];
    const isChat = !['fichas', 'npcs', 'membros'].includes(tabId);
    const panel = tabId === 'fichas' ? mesaFichasPanel(mesa, characters)
      : tabId === 'npcs' ? mesaNpcsPanel(mesa, npcs)
      : tabId === 'membros' ? mesaMembersPanel(mesa, members)
      : mesaChatPanel(mesa);
    const page = MESA_TABS.find((t) => t.id === tabId);

    // No chat a barra some: o painel de ferramentas já leva a fichas, NPCs e membros.
    // As páginas completas (criar ficha, convite, senha) ganham só uma volta ao chat.
    return `
      ${isChat ? '' : `
      <header class="mesa-bar" style="--hue:${theme.hue}">
        <a href="${base}" class="mesa-bar__back" aria-label="Voltar ao chat" title="Voltar ao chat"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></a>
        <div class="mesa-bar__id" ${mesa.description ? `title="${escapeHtml(mesa.description)}"` : ''}>
          <strong>${escapeHtml(page ? page.label : '')}</strong>
          <span>${escapeHtml(mesa.name)} · <a href="${sys.href}">${escapeHtml(sys.name)}</a></span>
        </div>
        <a href="${base}" class="mesa-bar__chat">Voltar ao chat</a>
      </header>`}
      <div class="mesa-panel" data-mesa-panel="${escapeHtml(tabId)}" data-mesa-id="${escapeHtml(mesa.id)}">
        ${panel}
      </div>`;
  }

  /* ════════════════════════════════════════════════
     CHAT DA MESA
     Falar como personagem/NPC, comandos, dados, cenas, imagens e presença.
     ════════════════════════════════════════════════ */
  const CHAT_COLORS = ['#c8a25a', '#b8674f', '#7f9f78', '#6e98b8', '#a97a9c', '#c4894f', '#8d8cb8', '#5e9f9a', '#b96a6a', '#9aa36a'];
  const CHAT_DICE = [3, 4, 6, 8, 10, 12, 20, 100];
  const CHAT_GROUP_MS = 4 * 60 * 1000;
  const CHAT_IMAGE_TTL_MS = 24 * 60 * 60 * 1000;
  const CHAT_COMMANDS = [
    { cmd: '/me', example: '/me saca a espada', hint: 'ação do personagem' },
    { cmd: '/w', example: '/w Rafa texto', hint: 'sussurro' },
    { cmd: '/grita', example: '/grita Parem!', hint: 'voz alta' },
    { cmd: '/baixo', example: '/baixo ouviu isso?', hint: 'voz baixa' },
    { cmd: '/ooc', example: '/ooc volto em 5 min', hint: 'fora do personagem' },
    { cmd: '/r', example: '/r 2d6+1', hint: 'rolar dados' },
    { cmd: '/gr', example: '/gr 1d20', hint: 'rolar em segredo', master: true },
    { cmd: '/narrar', example: '/narrar A chuva aperta.', hint: 'narração', master: true },
    { cmd: '/cena', example: '/cena A estrada de cinzas', hint: 'abrir cena', master: true }
  ];

  const MESA_IMAGES = {};
  const MESA_SECRETS = {};
  const chatState = { mesaId: '', speakerKey: '', pool: {}, typing: {}, typingTimer: null, lastTypingSent: 0, online: [] };

  function chatColorFor(seed) {
    let h = 0;
    const text = String(seed || '');
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return CHAT_COLORS[h % CHAT_COLORS.length];
  }

  const safeChatColor = (value, seed) => (/^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : chatColorFor(seed));

  function storageGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sem armazenamento local */ }
  }

  const avulsosKey = (mesaId) => `arcano.avulsos.${mesaId}`;
  const speakerKeyStore = (mesaId) => `arcano.speaker.${mesaId}`;

  function chatAvulsos(mesaId) {
    const list = storageGet(avulsosKey(mesaId), []);
    return Array.isArray(list) ? list.filter((a) => a && a.name).slice(0, 12) : [];
  }

  function chatSpeakers(mesa) {
    const mine = auth.user?.id;
    const master = mesa.role === 'mestre';
    const list = [{ key: 'self', type: 'self', name: memberName(mesa.id, mine) || myDisplayName(), image: '', color: '' }];
    if (master) list.push({ key: 'narrador', type: 'narrador', name: 'Narrador', image: '', color: '' });
    CHARACTERS
      .filter((c) => c.mesaId === mesa.id && c.userId === mine && !c.isNpc)
      .forEach((c) => list.push({ key: `c:${c.id}`, type: 'character', id: c.id, name: c.name || 'Sem nome', image: c.image || '', color: safeChatColor(c.identity?.chatColor, c.id) }));
    if (master) {
      CHARACTERS
        .filter((c) => c.mesaId === mesa.id && c.isNpc)
        .forEach((c) => list.push({ key: `c:${c.id}`, type: 'character', npc: true, id: c.id, name: c.name || 'NPC', image: c.image || '', color: safeChatColor(c.identity?.chatColor, c.id) }));
      (MESA_NPCS[mesa.id] || []).forEach((n) => list.push({ key: `n:${n.id}`, type: 'npc', id: n.id, name: n.title, image: n.image || '', color: chatColorFor(n.id) }));
      chatAvulsos(mesa.id).forEach((a) => list.push({ key: `a:${a.name}`, type: 'avulso', name: a.name, image: a.image || '', color: chatColorFor(`a:${a.name}`) }));
    }
    return list;
  }

  function currentSpeaker(mesa) {
    const list = chatSpeakers(mesa);
    const wanted = chatState.mesaId === mesa.id && chatState.speakerKey ? chatState.speakerKey : storageGet(speakerKeyStore(mesa.id), '');
    return list.find((s) => s.key === wanted) || list.find((s) => s.type === 'character') || list[0];
  }

  function speakerPayload(s) {
    return { type: s.type, id: s.id || null, name: s.name, image: s.image || '', color: s.color || '' };
  }

  function messageSpeaker(msg) {
    const s = msg.speaker && msg.speaker.type ? msg.speaker : null;
    if (s) return s;
    return { type: msg.kind === 'narracao' ? 'narrador' : 'self', name: msg.author || 'Jogador' };
  }

  /* Formatação leve: **negrito**, *itálico*, ~~riscado~~, ||spoiler||. */
  /* Formatação do chat:
     **ação** (negrito na cor do personagem) · -- fala -- · ((pensamento))
     *itálico* · ~~riscado~~ · ||spoiler|| · >> no fim = passou a vez. */
  function chatInline(text) {
    return escapeHtml(text || '')
      .replace(/\|\|([\s\S]+?)\|\|/g, '<span class="chat-spoiler" tabindex="0" role="button" aria-label="Revelar spoiler">$1</span>')
      .replace(/\(\(([\s\S]+?)\)\)/g, '<span class="chat-thought">“$1”</span>')
      .replace(/--\s*([\s\S]+?)\s*--/g, '<span class="chat-speech">— $1 —</span>')
      .replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="chat-action">$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/\s*&gt;&gt;\s*$/, ' <span class="chat-turn" title="Passou a vez">»</span>')
      .replace(/\n/g, '<br>');
  }

  function chatAvatarHTML(s) {
    if (s.image) return `<span class="chat-avatar"><img src="${escapeHtml(s.image)}" alt="" loading="lazy" decoding="async"></span>`;
    return `<span class="chat-avatar chat-avatar--initial" aria-hidden="true">${escapeHtml((s.name || '?').trim().charAt(0).toUpperCase())}</span>`;
  }

  function chatTime(msg) {
    const date = new Date(msg.created_at || Date.now());
    const sameDay = new Date().toDateString() === date.toDateString();
    const when = date.toLocaleString('pt-BR', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return msg.pinned ? `${when} · fixada` : when;
  }

  function chatGroupKey(msg) {
    const s = messageSpeaker(msg);
    return `${msg.user_id}|${s.type}|${s.id || s.name}|${msg.whisper_to || ''}`;
  }

  function chatIsGrouped(msg, prev) {
    if (!prev || prev.kind !== 'fala' || msg.kind !== 'fala') return false;
    if (chatGroupKey(prev) !== chatGroupKey(msg)) return false;
    return new Date(msg.created_at) - new Date(prev.created_at) < CHAT_GROUP_MS;
  }

  function chatWhisperLine(mesaId, msg) {
    if (!msg.whisper_to) return '';
    const mine = msg.user_id === auth.user?.id;
    const other = mine ? memberName(mesaId, msg.whisper_to) : memberName(mesaId, msg.user_id);
    return `<span class="chat-whisper">${mine ? `sussurro para ${escapeHtml(other)}` : `sussurro de ${escapeHtml(other)}`}</span>`;
  }

  function chatToolsHTML(mesaId, msg, { editable = false } = {}) {
    const mine = msg.user_id === auth.user?.id;
    const master = isMesaMaster(mesaId);
    const tools = [];
    if (editable && mine) tools.push(`<button type="button" data-chat-edit="${escapeHtml(msg.id)}">editar</button>`);
    if (master) tools.push(`<button type="button" data-chat-pin="${escapeHtml(msg.id)}">${msg.pinned ? 'desafixar' : 'fixar'}</button>`);
    if (mine || master) tools.push(`<button type="button" data-chat-delete="${escapeHtml(msg.id)}">apagar</button>`);
    return tools.length ? `<span class="chat-tools">${tools.join('')}</span>` : '';
  }

  function chatDiceChips(group) {
    return group.rolls.map((v) => {
      const crit = v === group.sides ? ' is-max' : (v === 1 ? ' is-min' : '');
      return `<span class="chat-die${crit}" title="d${group.sides}">${v}</span>`;
    }).join('');
  }

  function chatRollResultHTML(result) {
    if (!result) return '';
    if (result.test) {
      const t = result.test;
      return `
        <span class="chat-roll__dice">${t.d6s.map((v) => `<span class="chat-die${v === 6 ? ' is-max' : (v === 1 ? ' is-min' : '')}">${v}</span>`).join('')}<span class="chat-roll__plus">+</span><span class="chat-die chat-die--destiny${t.destiny === 12 ? ' is-max' : (t.destiny === 1 ? ' is-min' : '')}" title="Destino (d12)">${t.destiny}</span></span>
        <span class="chat-roll__total">${result.total}</span>
        <span class="chat-roll__reading"><b>${escapeHtml(t.reading.title)}</b> ${escapeHtml(t.reading.text)}</span>`;
    }
    if (result.calc != null) {
      const chips = (result.groups || []).map((g) => chatDiceChips(g)).join('<span class="chat-roll__plus">·</span>');
      const showCalc = (result.groups || []).length && result.calc !== String(result.total);
      return `
        ${chips ? `<span class="chat-roll__dice">${chips}</span>` : ''}
        ${showCalc ? `<span class="chat-roll__calc">${escapeHtml(result.calc)}</span>` : ''}
        <span class="chat-roll__total">${escapeHtml(formatRollNumber(result.total))}</span>`;
    }
    const dice = (result.groups || []).map((g) => chatDiceChips(g)).join('<span class="chat-roll__plus">+</span>');
    const mod = Number(result.mod || 0);
    return `
      <span class="chat-roll__dice">${dice}${mod ? `<span class="chat-roll__plus">${mod > 0 ? '+' : '−'}</span><span class="chat-roll__mod">${Math.abs(mod)}</span>` : ''}</span>
      <span class="chat-roll__total">${result.total}</span>`;
  }

  function chatRollHTML(mesaId, msg) {
    const s = messageSpeaker(msg);
    const d = msg.data || {};
    if (d.levelUp) return chatLevelUpHTML(mesaId, msg, s, d.levelUp);
    const label = d.test ? `Teste de ${escapeHtml(d.test.attr)} · ${escapeHtml(fmtDice(d.test.dice))} + Destino` : escapeHtml(d.expr || '');
    const master = isMesaMaster(mesaId);
    let result = '';
    if (d.secret && !d.revealed) {
      const hidden = MESA_SECRETS[msg.id];
      result = master && hidden
        ? `<span class="chat-roll__secret">${chatRollResultHTML(hidden)}</span><button type="button" class="chat-link" data-chat-reveal="${escapeHtml(msg.id)}">revelar</button>`
        : '<span class="chat-roll__hidden">resultado oculto</span>';
    } else {
      result = chatRollResultHTML(d);
    }
    return `
      <li class="chat-msg chat-msg--roll" data-mesa-msg="${escapeHtml(msg.id)}" style="--who:${safeChatColor(s.color, s.id || s.name)}">
        ${chatWhisperLine(mesaId, msg)}
        <p class="chat-roll">
          <span class="chat-who">${escapeHtml(s.name)}</span>
          <span class="chat-roll__label">${d.secret ? (d.revealed ? 'rolou em segredo e revelou' : 'rolou em segredo') : 'rolou'} ${label}</span>
          ${result}
        </p>
        <span class="chat-time">${escapeHtml(chatTime(msg))}</span>
        ${chatToolsHTML(mesaId, msg)}
      </li>`;
  }

  function chatImageExpired(msg) {
    const d = msg.data || {};
    if (d.kept || !d.expiresAt) return !!d.expired;
    return d.expired || Date.now() > new Date(d.expiresAt).getTime();
  }

  function chatImageHTML(mesaId, msg) {
    const s = messageSpeaker(msg);
    const d = msg.data || {};
    const master = isMesaMaster(mesaId);
    const expired = chatImageExpired(msg);
    const keep = master && !expired && d.expiresAt && !d.kept
      ? `<button type="button" class="chat-link" data-chat-keep="${escapeHtml(msg.id)}">guardar no acervo</button>` : '';
    const left = !expired && d.expiresAt && !d.kept
      ? `<span class="chat-image__ttl">some em ${Math.max(1, Math.ceil((new Date(d.expiresAt).getTime() - Date.now()) / 3600000))}h</span>` : '';
    return `
      <li class="chat-msg chat-msg--image" data-mesa-msg="${escapeHtml(msg.id)}" style="--who:${safeChatColor(s.color, s.id || s.name)}">
        ${chatWhisperLine(mesaId, msg)}
        <p class="chat-line"><span class="chat-who">${escapeHtml(s.name)}</span> <span class="chat-muted">mostrou uma imagem</span></p>
        ${expired
          ? '<p class="chat-muted chat-image__gone">A imagem expirou.</p>'
          : `<figure class="chat-image">
              <a href="${escapeHtml(d.url)}" target="_blank" rel="noopener"><img src="${escapeHtml(d.url)}" alt="${escapeHtml(d.title || '')}" loading="lazy" decoding="async"></a>
              ${d.title ? `<figcaption>${escapeHtml(d.title)}</figcaption>` : ''}
            </figure>`}
        <span class="chat-time">${escapeHtml(chatTime(msg))}</span>
        ${left}${keep}
        ${chatToolsHTML(mesaId, msg)}
      </li>`;
  }

  function mesaMessageHTML(mesaId, msg, prev) {
    const s = messageSpeaker(msg);
    const kind = msg.kind || 'fala';
    const color = safeChatColor(s.color, s.id || s.name);
    const edited = msg.edited_at ? ' · editada' : '';
    const id = escapeHtml(msg.id);

    if (kind === 'cena') {
      const d = msg.data || {};
      return `
        <li class="chat-scene" data-mesa-msg="${id}">
          ${d.image ? `<img class="chat-scene__image" src="${escapeHtml(d.image)}" alt="" loading="lazy" decoding="async">` : ''}
          <span class="chat-scene__rule" aria-hidden="true"></span>
          <h3 class="chat-scene__title">${escapeHtml(d.title || msg.body || 'Nova cena')}</h3>
          ${d.title && msg.body ? `<p class="chat-scene__text">${chatInline(msg.body)}</p>` : ''}
          ${chatToolsHTML(mesaId, msg)}
        </li>`;
    }
    if (kind === 'rolagem') return chatRollHTML(mesaId, msg);
    if (kind === 'combate') return chatCombatHTML(mesaId, msg);
    if (kind === 'imagem') return chatImageHTML(mesaId, msg);

    const tone = msg.tone && msg.tone !== 'normal' ? ` chat-tone--${msg.tone}` : '';
    const whisper = msg.whisper_to ? ' is-whisper' : '';
    const text = `<span class="chat-text" data-chat-text>${chatInline(msg.body)}</span>`;

    if (kind === 'narracao') {
      return `
        <li class="chat-msg chat-msg--narracao${whisper}" data-mesa-msg="${id}">
          ${chatWhisperLine(mesaId, msg)}
          <p class="chat-line">${text}</p>
          <span class="chat-time">${escapeHtml(chatTime(msg))}${edited}</span>
          ${chatToolsHTML(mesaId, msg, { editable: true })}
        </li>`;
    }
    if (kind === 'acao') {
      return `
        <li class="chat-msg chat-msg--acao${whisper}" data-mesa-msg="${id}" style="--who:${color}">
          ${chatWhisperLine(mesaId, msg)}
          <p class="chat-line"><span class="chat-who">${escapeHtml(s.name)}</span> ${text}</p>
          <span class="chat-time">${escapeHtml(chatTime(msg))}${edited}</span>
          ${chatToolsHTML(mesaId, msg, { editable: true })}
        </li>`;
    }
    if (kind === 'fora' || s.type === 'self') {
      return `
        <li class="chat-msg chat-msg--fora${tone}${whisper}" data-mesa-msg="${id}">
          ${chatWhisperLine(mesaId, msg)}
          <p class="chat-line"><span class="chat-who">${escapeHtml(s.name)}</span> ${text}</p>
          <span class="chat-time">${escapeHtml(chatTime(msg))}${edited}</span>
          ${chatToolsHTML(mesaId, msg, { editable: true })}
        </li>`;
    }
    const grouped = chatIsGrouped(msg, prev);
    return `
      <li class="chat-msg chat-msg--fala${tone}${whisper}${grouped ? ' is-grouped' : ''}" data-mesa-msg="${id}" style="--who:${color}">
        ${grouped ? '<span class="chat-avatar chat-avatar--spacer" aria-hidden="true"></span>' : chatAvatarHTML(s)}
        <div class="chat-msg__body">
          ${grouped ? '' : `<header class="chat-msg__head"><span class="chat-who">${escapeHtml(s.name)}</span><span class="chat-time">${escapeHtml(chatTime(msg))}${edited}</span></header>`}
          ${chatWhisperLine(mesaId, msg)}
          <p class="chat-line">${text}</p>
        </div>
        ${chatToolsHTML(mesaId, msg, { editable: true })}
      </li>`;
  }

  function chatLogHTML(mesaId) {
    const messages = MESA_MESSAGES[mesaId] || [];
    if (!messages.length) return '<li class="chat-empty">A mesa está em silêncio.</li>';
    return messages.map((m, i) => mesaMessageHTML(mesaId, m, messages[i - 1])).join('');
  }

  function chatSpeakerButtonHTML(s) {
    return `${s.type === 'character' || s.type === 'npc' || s.type === 'avulso' ? chatAvatarHTML(s) : ''}<span class="chat-speaker__name" style="--who:${s.color || 'var(--chat-muted)'}">${escapeHtml(s.type === 'self' ? `${s.name} (você)` : s.name)}</span>`;
  }

  function chatSpeakerMenuHTML(mesa, current) {
    const list = chatSpeakers(mesa);
    const section = (title, items) => items.length ? `
      <p class="chat-menu__title">${title}</p>
      ${items.map((s) => `
        <button type="button" class="chat-menu__item ${s.key === current.key ? 'is-current' : ''}" data-chat-speaker="${escapeHtml(s.key)}" style="--who:${s.color || 'var(--chat-muted)'}">
          ${s.type === 'self' || s.type === 'narrador' ? '' : chatAvatarHTML(s)}
          <span>${escapeHtml(s.type === 'self' ? `${s.name} (você)` : s.name)}</span>
        </button>`).join('')}` : '';
    const master = mesa.role === 'mestre';
    const colorRow = current.type === 'character' ? `
      <p class="chat-menu__title">Cor de ${escapeHtml(current.name)}</p>
      <div class="chat-menu__colors">
        ${CHAT_COLORS.map((c) => `<button type="button" class="chat-swatch ${c === current.color ? 'is-current' : ''}" style="--swatch:${c}" data-chat-color="${c}" aria-label="Cor ${c}"></button>`).join('')}
      </div>` : '';
    return `
      ${section('Você', list.filter((s) => s.type === 'self' || s.type === 'narrador'))}
      ${section('Personagens', list.filter((s) => s.type === 'character' && !s.npc))}
      ${master ? section('NPCs da mesa', list.filter((s) => s.type === 'npc' || s.npc)) : ''}
      ${master ? section('NPCs avulsos', list.filter((s) => s.type === 'avulso')) : ''}
      ${master ? `
        <div class="chat-menu__avulso">
          <input type="text" maxlength="60" placeholder="Novo NPC avulso" aria-label="Nome do NPC avulso" data-chat-avulso-name>
          <button type="button" data-chat-avulso-add>Falar</button>
        </div>` : ''}
      ${!list.some((s) => s.type === 'character') ? `<p class="chat-menu__hint">Crie uma ficha na aba Fichas para falar como personagem.</p>` : ''}
      ${colorRow}`;
  }

  /* ── Painel de ferramentas (ao lado do chat, nunca por cima) ── */
  const TOOL_ICON = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const CHAT_TOOLS = [
    { id: 'dados', label: 'Dados', icon: TOOL_ICON('<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 22V12M3.5 7L12 12l8.5-5"/>') },
    { id: 'ficha', label: 'Fichas', icon: TOOL_ICON('<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h4"/>') },
    { id: 'combate', label: 'Combate', icon: TOOL_ICON('<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/>') },
    { id: 'notas', label: 'Notas', icon: TOOL_ICON('<path d="M20 4c-6 0-12 4-14 12l-2 4"/><path d="M8 14c4 0 7-2 9-6"/>') },
    { id: 'npcs', label: 'NPCs', master: true, icon: TOOL_ICON('<circle cx="12" cy="10" r="6"/><path d="M9 21v-3h6v3M10 10h.01M14 10h.01"/>') },
    { id: 'acervo', label: 'Acervo', master: true, icon: TOOL_ICON('<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>') },
    { id: 'cena', label: 'Cena', master: true, icon: TOOL_ICON('<path d="M3 20h18M5 20V9l7-5 7 5v11"/><path d="M10 20v-6h4v6"/>') },
    { id: 'mestre', label: 'Anotações do Mestre', master: true, icon: TOOL_ICON('<path d="M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4z"/><path d="M9 9h6M9 13h4"/>') },
    { id: 'opcoes', label: 'Opções', bottom: true, icon: TOOL_ICON('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>') }
  ];
  const MESA_STATE = {};
  const MESA_NOTES = {};

  const toolStoreKey = 'arcano.chatTool';
  function chatToolsFor(mesa) {
    return CHAT_TOOLS.filter((t) => !t.master || mesa.role === 'mestre');
  }
  function activeChatTool(mesa) {
    const saved = storageGet(toolStoreKey, { id: 'dados', open: true });
    const tools = chatToolsFor(mesa).filter((t) => !t.soon);
    const id = tools.some((t) => t.id === saved.id) ? saved.id : 'dados';
    return { id, open: saved.open !== false };
  }

  function emptyInitiative() {
    return { round: 1, turn: 0, entries: [] };
  }
  function mesaInitiative(mesaId) {
    const ini = MESA_STATE[mesaId];
    return ini && Array.isArray(ini.entries) ? ini : emptyInitiative();
  }

  /* ── Dados: ícone vetorial de cada dado com o número dentro ── */
  const DIE_SHAPES = {
    3: { d: '<polygon points="20,6 35,33 5,33"/>', y: 25 },
    4: { d: '<polygon points="20,4 37,35 3,35"/>', y: 25 },
    6: { d: '<rect x="6" y="6" width="28" height="28" rx="4"/>', y: 20 },
    8: { d: '<polygon points="20,3 37,20 20,37 3,20"/>', y: 20 },
    10: { d: '<polygon points="20,3 36,17 20,37 4,17"/><path d="M4 17l16 5 16-5" opacity=".45"/>', y: 18 },
    12: { d: '<polygon points="20,3 37,15 31,36 9,36 3,15"/>', y: 21 },
    20: { d: '<polygon points="20,3 36,12 36,28 20,37 4,28 4,12"/><polygon points="20,10 30,27 10,27" opacity=".45"/>', y: 22 },
    100: { d: '<circle cx="20" cy="20" r="17"/><circle cx="20" cy="20" r="12" opacity=".35"/>', y: 20 }
  };
  function dieIconSVG(sides, size = 40, text = null) {
    const shape = DIE_SHAPES[sides] || DIE_SHAPES[6];
    const label = text == null ? String(sides) : String(text);
    return `<svg class="die-ico" viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">${shape.d}</g><text x="20" y="${shape.y}" text-anchor="middle" dominant-baseline="central" font-size="${label.length > 2 ? 9.5 : 12}" font-weight="600" fill="currentColor">${label}</text></svg>`;
  }

  function firstDieSides(expr) {
    const m = /\d*d(\d+)/i.exec(String(expr || ''));
    return m && DIE_SHAPES[Number(m[1])] ? Number(m[1]) : 20;
  }

  function diceStageHTML() {
    const sides = chatState.stageSides || firstDieSides(chatState.expr);
    const r = chatState.stageResult;
    return `
      <div class="dice-stage__die" data-stage-die>${dieIconSVG(sides, 132, r ? formatRollNumber(r.total) : null)}</div>
      <div class="dice-stage__calc" data-stage-calc>${r ? escapeHtml(r.groups.length && r.calc !== String(r.total) ? `${r.calc} = ${formatRollNumber(r.total)}` : r.expr) : 'Monte a rolagem'}</div>`;
  }

  function toolDadosHTML(mesa) {
    const master = mesa.role === 'mestre';
    return `
      <div class="dice-stage" data-dice-stage>${diceStageHTML()}</div>
      <input class="dice-calc" data-dice-expr value="${escapeHtml(chatState.expr || '')}" placeholder="2d6 + 1d8 × 2 − 3" spellcheck="false" autocomplete="off" inputmode="text" aria-label="Conta da rolagem">
      <div class="dice-keys">
        ${['+', '−', '×', '÷', '(', ')', '%'].map((k) => `<button type="button" data-calc-key="${k}">${k}</button>`).join('')}
        <button type="button" data-calc-key="+1">+1</button>
        <button type="button" data-calc-key="−1">−1</button>
      </div>
      <div class="dice-grid">
        ${CHAT_DICE.map((sides) => `<button type="button" class="dice-btn" data-chat-die="${sides}" title="d${sides} · clique direito tira">${dieIconSVG(sides)}</button>`).join('')}
      </div>
      ${master ? '<label class="chat-tray__secret"><input type="checkbox" data-chat-secret> Em segredo</label>' : ''}
      <div class="tool-row">
        <button type="button" class="chat-button" data-chat-clear>Limpar</button>
        <button type="button" class="chat-button chat-button--primary" data-chat-roll>Rolar</button>
      </div>`;
  }

  /* ── Medidores e etiquetas ── */
  function toolMeterHTML(attr, key, label, cur, max) {
    const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    return `
      <div class="tool-meter" ${attr}="${escapeHtml(key)}">
        <span class="tool-meter__label">${escapeHtml(label)}</span>
        <button type="button" data-meter-step="-1" aria-label="Diminuir ${escapeHtml(label)}">−</button>
        <b>${cur}<small>/${max}</small></b>
        <button type="button" data-meter-step="1" aria-label="Aumentar ${escapeHtml(label)}">+</button>
        <i class="tool-meter__bar" style="width:${pct}%"></i>
      </div>`;
  }

  function toolChipsHTML(items, removeAttr, inputAttr, placeholder) {
    return `
      <div class="tool-chips">
        ${items.map((name, i) => `<span class="tool-chip">${escapeHtml(name)}<button type="button" ${removeAttr}="${i}" aria-label="Remover ${escapeHtml(name)}">×</button></span>`).join('')}
        <input type="text" maxlength="40" ${inputAttr} placeholder="${escapeHtml(placeholder)}" aria-label="${escapeHtml(placeholder)}">
      </div>`;
  }

  function npcCombat(npc) {
    const raw = npc.combat && typeof npc.combat === 'object' ? npc.combat : {};
    const max = Number(raw.max) > 0 ? Number(raw.max) : (Math.round(beastHpTotal(npc.fields || {})) || 10);
    const cur = Number.isFinite(Number(raw.cur)) ? Math.max(0, Math.min(max, Number(raw.cur))) : max;
    return { cur, max, conds: Array.isArray(raw.conds) ? raw.conds : [] };
  }

  /* ── Fichas: jogadores e NPCs ── */
  function charHpSummary(c) {
    ensureVitals(c);
    const parts = Object.values(c.vitals.hp || {});
    const max = parts.reduce((a, p) => a + (Number(p.max) || 0), 0);
    const cur = parts.reduce((a, p) => a + (Number(p.cur) || 0), 0);
    return { cur, max };
  }

  function fichaEntries(mesa) {
    const master = mesa.role === 'mestre';
    const players = CHARACTERS
      .filter((c) => c.mesaId === mesa.id && !c.isNpc && (master || c.userId === auth.user?.id))
      .map((c) => ({ key: `c:${c.id}`, name: c.name || 'Sem nome', image: c.image, color: safeChatColor(c.identity?.chatColor, c.id), sub: master ? memberName(mesa.id, c.userId) : (c.raceName || ''), hp: charHpSummary(c) }));
    const npcs = !master ? [] : [
      ...CHARACTERS.filter((c) => c.mesaId === mesa.id && c.isNpc)
        .map((c) => ({ key: `c:${c.id}`, name: c.name || 'NPC', image: c.image, color: safeChatColor(c.identity?.chatColor, c.id), sub: c.npcVisible ? 'revelado' : 'oculto', hp: charHpSummary(c) })),
      ...(MESA_NPCS[mesa.id] || []).map((n) => {
        const cb = npcCombat(n);
        return { key: `n:${n.id}`, name: n.title, image: n.image, color: chatColorFor(n.id), sub: n.visible ? 'revelado' : 'oculto', hp: { cur: cb.cur, max: cb.max } };
      })
    ];
    return { players, npcs };
  }

  function toolListItemHTML(e, attr) {
    const pct = e.hp && e.hp.max ? Math.round((e.hp.cur / e.hp.max) * 100) : null;
    return `
      <li><button type="button" class="tool-list__item" ${attr}="${escapeHtml(e.key)}" style="--who:${e.color}">
        ${chatAvatarHTML({ name: e.name, image: e.image })}
        <span class="tool-list__text"><span class="chat-who">${escapeHtml(e.name)}</span>${e.sub ? `<small>${escapeHtml(e.sub)}</small>` : ''}</span>
        ${pct != null ? `<span class="tool-list__hp" title="${e.hp.cur}/${e.hp.max}"><i style="width:${pct}%"></i></span>` : ''}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      </button></li>`;
  }

  function fichaSelection(mesa) {
    const key = chatState.fichaSel || '';
    const [type, id] = key.split(':');
    if (type === 'c') {
      const c = characterById(id);
      const master = mesa.role === 'mestre';
      if (c && c.mesaId === mesa.id && (master || c.userId === auth.user?.id)) return { type, c };
    }
    if (type === 'n' && mesa.role === 'mestre') {
      const n = (MESA_NPCS[mesa.id] || []).find((x) => x.id === id);
      if (n) return { type, n };
    }
    return null;
  }

  function fichaDetailHTML(mesa, sel) {
    const sub = chatState.fichaSub === 'condicao' ? 'condicao' : 'combate';
    const isChar = sel.type === 'c';
    const name = isChar ? sel.c.name : sel.n.title;
    const image = isChar ? sel.c.image : sel.n.image;
    const color = isChar ? safeChatColor(sel.c.identity?.chatColor, sel.c.id) : chatColorFor(sel.n.id);
    const editHref = isChar
      ? `${characterBase(sel.c)}/${encodeURIComponent(sel.c.id)}/editar`
      : `#/Mesas/${encodeURIComponent(mesa.id)}/npcs/${encodeURIComponent(sel.n.id)}/editar`;
    let body = '';
    if (sub === 'combate') {
      if (isChar) {
        const c = sel.c;
        ensureVitals(c);
        const hp = c.vitals.hp || {};
        const { mod } = raceDataFor(c.raceId);
        const awk = normalizeAwakening(c.magic);
        const A = attrModsView(c, mod, awkIsNonMage(awk) ? awk.bonusAttr : '');
        body = `
          <div class="tool-meters" data-char="${escapeHtml(c.id)}">
            ${Object.keys(hp).map((part) => toolMeterHTML('data-hp-part', part, part, hp[part].cur, hp[part].max)).join('') || '<p class="tool-empty">Sem HP na ficha.</p>'}
            ${c.vitals.mana ? toolMeterHTML('data-mana', 'mana', 'Mana', c.vitals.mana.cur, c.vitals.mana.max) : ''}
          </div>
          <p class="chat-tool__sub">Testes</p>
          <div class="chat-tray__tests">${CHAR_ATTRIBUTES.map((a) => {
            const dice = Math.max(1, A[a].dice || 1);
            return `<button type="button" class="chat-tray__test" data-chat-test="${escapeHtml(a)}" data-chat-test-dice="${dice}" data-test-char="${escapeHtml(c.id)}"><span>${escapeHtml(a)}</span><small>${fmtDice(dice)} + d12</small></button>`;
          }).join('')}</div>`;
      } else {
        const cb = npcCombat(sel.n);
        body = `<div class="tool-meters" data-npc="${escapeHtml(sel.n.id)}">${toolMeterHTML('data-npc-hp', sel.n.id, 'HP', cb.cur, cb.max)}</div>`;
      }
    } else {
      const items = isChar ? (sel.c.statuses || []).map((s) => s.name) : npcCombat(sel.n).conds;
      body = `<div data-cond-target="${escapeHtml(chatState.fichaSel)}">${toolChipsHTML(items, 'data-cond-remove', 'data-cond-input', 'Nova condição')}</div>`;
    }
    return `
      <div class="tool-view tool-anim" data-tool-view="detail">
        <div class="tool-detail__head" style="--who:${color}">
          <button type="button" class="tool-back" data-ficha-back aria-label="Voltar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          ${chatAvatarHTML({ name, image })}
          <span class="chat-who">${escapeHtml(name)}</span>
        </div>
        <nav class="tool-seg" aria-label="Opções da ficha">
          <button type="button" class="${sub === 'combate' ? 'is-on' : ''}" data-ficha-sub="combate">Combate</button>
          <button type="button" class="${sub === 'condicao' ? 'is-on' : ''}" data-ficha-sub="condicao">Condição</button>
          <a href="${editHref}">Edição</a>
        </nav>
        <div class="tool-sub tool-anim" data-ficha-body>${body}</div>
      </div>`;
  }

  function toolFichaHTML(mesa) {
    const sel = fichaSelection(mesa);
    if (sel) return fichaDetailHTML(mesa, sel);
    chatState.fichaSel = '';
    const { players, npcs } = fichaEntries(mesa);
    const master = mesa.role === 'mestre';
    return `
      <div class="tool-view tool-anim" data-tool-view="list">
        <p class="chat-tool__sub">Jogadores</p>
        ${players.length
          ? `<ul class="tool-list">${players.map((e) => toolListItemHTML(e, 'data-ficha-open')).join('')}</ul>`
          : `<a class="chat-button" href="#/Mesas/${encodeURIComponent(mesa.id)}/fichas/criar">Criar ficha</a>`}
        ${master ? `
          <p class="chat-tool__sub">NPCs</p>
          ${npcs.length
            ? `<ul class="tool-list">${npcs.map((e) => toolListItemHTML(e, 'data-ficha-open')).join('')}</ul>`
            : `<a class="chat-button" href="#/Mesas/${encodeURIComponent(mesa.id)}/npcs/criar">Criar NPC</a>`}` : ''}
      </div>`;
  }

  /* ── Notas com formatação ── */
  const NOTE_COLORS = ['#e6dfd1', '#c8a25a', '#b96a6a', '#7f9f78', '#6e98b8', '#a97a9c'];
  const notesKey = (mesaId, userId, kind, target = '') => `${mesaId}|${userId}|${kind}|${target}`;

  function notesEditorHTML(attrs, html, placeholder) {
    return `
      <div class="note-tools" role="toolbar" aria-label="Formatação">
        <button type="button" data-fmt="bold" aria-label="Negrito"><b>N</b></button>
        <button type="button" data-fmt="italic" aria-label="Itálico"><i>I</i></button>
        <button type="button" data-fmt="underline" aria-label="Sublinhado"><u>S</u></button>
        <button type="button" data-fmt="strikeThrough" aria-label="Riscado"><s>R</s></button>
        <button type="button" data-fmt="insertUnorderedList" aria-label="Lista">•</button>
        <span class="note-tools__sep"></span>
        ${NOTE_COLORS.map((c) => `<button type="button" class="note-swatch" data-fmt-color="${c}" style="--swatch:${c}" aria-label="Cor"></button>`).join('')}
        <button type="button" data-fmt="removeFormat" aria-label="Limpar formatação">⌫</button>
      </div>
      <div class="note-editor" contenteditable="true" ${attrs} data-placeholder="${escapeHtml(placeholder)}">${sanitizeHtml(html || '')}</div>
      <p class="tool-status" data-notes-status></p>`;
  }

  function toolNotasHTML(mesa) {
    const me = auth.user?.id;
    const all = MESA_NOTES[`${mesa.id}|all`];
    if (!all) return '<p class="tool-empty">Carregando…</p>';
    const view = chatState.notesView && chatState.notesView !== me && all[chatState.notesView] != null ? chatState.notesView : me;
    const others = Object.keys(all).filter((uid) => uid !== me && String(all[uid] || '').replace(/<[^>]+>/g, '').trim());
    const pills = others.length ? `
      <div class="tool-pills">
        <button type="button" class="${view === me ? 'is-on' : ''}" data-notes-view="${escapeHtml(me)}">Minhas</button>
        ${others.map((uid) => `<button type="button" class="${view === uid ? 'is-on' : ''}" data-notes-view="${escapeHtml(uid)}">${escapeHtml(memberName(mesa.id, uid))}</button>`).join('')}
      </div>` : '';
    if (view !== me) {
      return `${pills}<div class="note-editor is-readonly tool-anim">${sanitizeHtml(all[view] || '')}</div>`;
    }
    return `${pills}${notesEditorHTML('data-chat-notes="pessoal"', all[me] || '', 'Suas notas. Todos da mesa podem ler.')}`;
  }

  function toolMestreHTML(mesa) {
    const key = notesKey(mesa.id, auth.user?.id, 'mestre');
    if (!Object.prototype.hasOwnProperty.call(MESA_NOTES, key)) return '<p class="tool-empty">Carregando…</p>';
    return notesEditorHTML('data-chat-notes="mestre"', MESA_NOTES[key], 'Roteiro, segredos, ganchos… Só você vê.');
  }

  /* ── NPCs (Mestre): notas e edição rápida ── */
  function toolNpcsHTML(mesa) {
    const { npcs } = fichaEntries(mesa);
    const sel = chatState.npcSel ? npcs.find((e) => e.key === chatState.npcSel) : null;
    if (!sel) {
      chatState.npcSel = '';
      return npcs.length
        ? `<div class="tool-view tool-anim"><ul class="tool-list">${npcs.map((e) => toolListItemHTML(e, 'data-npc-open')).join('')}</ul></div>`
        : `<a class="chat-button" href="#/Mesas/${encodeURIComponent(mesa.id)}/npcs/criar">Criar NPC</a>`;
    }
    const [type, id] = sel.key.split(':');
    const isChar = type === 'c';
    const c = isChar ? characterById(id) : null;
    const n = isChar ? null : (MESA_NPCS[mesa.id] || []).find((x) => x.id === id);
    const visible = isChar ? c.npcVisible : n.visible;
    const sheetHref = isChar ? `${characterBase(c)}/${encodeURIComponent(c.id)}` : `#/Mesas/${encodeURIComponent(mesa.id)}/npcs/${encodeURIComponent(n.id)}`;
    const noteKey = notesKey(mesa.id, auth.user?.id, 'npc', id);
    const loaded = Object.prototype.hasOwnProperty.call(MESA_NOTES, noteKey);
    return `
      <div class="tool-view tool-anim" data-tool-view="detail">
        <div class="tool-detail__head" style="--who:${sel.color}">
          <button type="button" class="tool-back" data-npc-back aria-label="Voltar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
          </button>
          ${chatAvatarHTML({ name: sel.name, image: sel.image })}
          <span class="chat-who">${escapeHtml(sel.name)}</span>
        </div>
        <label class="chat-field"><span>Nome</span><input type="text" maxlength="80" value="${escapeHtml(sel.name)}" data-npc-name="${escapeHtml(sel.key)}"></label>
        <div class="tool-row tool-row--wrap">
          <button type="button" class="chat-button" data-npc-toggle-visible="${escapeHtml(sel.key)}">${visible ? 'Revelado aos jogadores' : 'Oculto dos jogadores'}</button>
          <button type="button" class="chat-button" data-chat-speaker="${isChar ? `c:${escapeHtml(id)}` : `n:${escapeHtml(id)}`}">Falar como</button>
        </div>
        <div class="tool-row tool-row--wrap">
          <a class="chat-button" href="${sheetHref}">Abrir ficha</a>
          <a class="chat-button" href="${sheetHref}/editar">Editar ficha</a>
        </div>
        <p class="chat-tool__sub">Notas sobre o NPC</p>
        ${loaded ? notesEditorHTML(`data-chat-notes="npc" data-note-target="${escapeHtml(id)}"`, MESA_NOTES[noteKey], 'Motivações, segredos, falas…') : '<p class="tool-empty">Carregando…</p>'}
      </div>`;
  }

  /* ── Acervo (discreto) e cena ── */
  function toolAcervoHTML(mesa) {
    const images = MESA_IMAGES[mesa.id] || [];
    return `
      ${chatState.acervoOpen ? `
        <div class="tool-upload tool-anim">
          <label class="chat-button">Escolher imagem<input type="file" accept="image/*" data-acervo-file hidden></label>
          <input type="text" maxlength="120" data-acervo-title placeholder="Título" aria-label="Título da imagem">
          <div class="tool-row">
            <button type="button" class="chat-button" data-acervo-toggle>Cancelar</button>
            <button type="button" class="chat-button chat-button--primary" data-acervo-add>Guardar</button>
          </div>
        </div>` : '<button type="button" class="chat-button tool-new" data-acervo-toggle>+ Nova imagem</button>'}
      ${images.length ? `<ul class="tool-gallery">${images.map((img) => `
        <li>
          <img src="${escapeHtml(img.url)}" alt="" loading="lazy" decoding="async">
          <span>${escapeHtml(img.title || 'Sem título')}</span>
          <span class="tool-gallery__tools">
            <button type="button" class="chat-link" data-acervo-send="${escapeHtml(img.id)}">enviar</button>
            <button type="button" class="chat-link" data-acervo-scene="${escapeHtml(img.id)}">cena</button>
            <button type="button" class="chat-link" data-acervo-remove="${escapeHtml(img.id)}">remover</button>
          </span>
        </li>`).join('')}</ul>` : ''}`;
  }

  function toolCenaHTML(mesa) {
    const images = MESA_IMAGES[mesa.id] || [];
    const draft = chatState.sceneDraft || {};
    return `
      <label class="chat-field"><span>Título</span><input type="text" data-cena-title maxlength="120" value="${escapeHtml(draft.title || '')}" placeholder="Capítulo 3 · A estrada"></label>
      <label class="chat-field"><span>Abertura</span><textarea data-cena-body rows="4" maxlength="1200">${escapeHtml(draft.body || '')}</textarea></label>
      ${images.length ? `<label class="chat-field"><span>Imagem</span><select data-cena-image><option value="">—</option>${images.map((i) => `<option value="${escapeHtml(i.id)}" ${draft.imageId === i.id ? 'selected' : ''}>${escapeHtml(i.title || 'Sem título')}</option>`).join('')}</select></label>` : ''}
      <button type="button" class="chat-button chat-button--primary" data-cena-open>Abrir cena</button>`;
  }

  /* ── Opções: membros e fixadas ── */
  function toolFixadasHTML(mesa) {
    const pinned = (MESA_MESSAGES[mesa.id] || []).filter((m) => m.pinned);
    if (!pinned.length) return '<p class="tool-empty">Nada fixado.</p>';
    return `<ul class="tool-pins">${pinned.map((m) => {
      const s = messageSpeaker(m);
      const text = m.kind === 'cena' ? (m.data?.title || m.body) : (m.kind === 'imagem' ? (m.data?.title || 'Imagem') : m.body);
      return `<li><button type="button" data-chat-jump="${escapeHtml(m.id)}" style="--who:${safeChatColor(s.color, s.id || s.name)}"><span class="chat-who">${escapeHtml(s.name)}</span>${escapeHtml(String(text || '').slice(0, 140))}</button></li>`;
    }).join('')}</ul>`;
  }

  function notifyOptionsHTML(mesa) {
    const prefs = notifyPrefs();
    const supported = 'Notification' in window;
    const denied = supported && Notification.permission === 'denied';
    return `
      <label class="tool-toggle"><input type="checkbox" data-notify="sound" ${prefs.sound ? 'checked' : ''}> Som de nova mensagem</label>
      <label class="tool-toggle ${supported ? '' : 'is-off'}"><input type="checkbox" data-notify="system" ${prefs.system && supported && !denied ? 'checked' : ''} ${supported ? '' : 'disabled'}> Avisos do celular e do computador</label>
      ${!supported ? '<p class="tool-empty">No iPhone, adicione o site à Tela de Início para receber avisos.</p>' : ''}
      ${denied ? '<p class="tool-empty">Os avisos estão bloqueados nas configurações do navegador.</p>' : ''}
      <label class="tool-toggle"><input type="checkbox" data-notify-mute ${prefs.muted && prefs.muted[mesa.id] ? 'checked' : ''}> Silenciar esta mesa</label>`;
  }

  function toolOpcoesHTML(mesa) {
    const online = new Set(chatState.online.map(([id]) => id));
    const members = MESA_MEMBERS[mesa.id] || [];
    const base = `#/Mesas/${encodeURIComponent(mesa.id)}`;
    const sys = MESA_SYSTEMS[mesa.system] || { name: mesa.system, href: '#/' };
    const owner = mesa.ownerId === auth.user?.id;
    return `
      <div class="tool-mesa">
        <strong>${escapeHtml(mesa.name)}</strong>
        <span><a href="${sys.href}">${escapeHtml(sys.name)}</a> · ${escapeHtml(mesaRoleLabel(mesa.role))}</span>
      </div>
      <a class="chat-button chat-button--primary tool-home" href="#/">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>
        Voltar ao início
      </a>
      <div class="tool-row tool-row--wrap">
        <a class="chat-button" href="#/Mesas">Minhas mesas</a>
        <a class="chat-button" href="${base}/fichas">Página de fichas</a>
        ${mesa.role === 'mestre' ? `<a class="chat-button" href="${base}/npcs">Página de NPCs</a>` : ''}
      </div>
      <p class="chat-tool__sub">Membros</p>
      <ul class="tool-members">
        ${members.map((m) => `
          <li class="${online.has(m.userId) ? 'is-online' : ''}">
            <span class="tool-members__dot" aria-hidden="true"></span>
            <span class="tool-members__name">${escapeHtml(m.displayName || 'Jogador')}${m.userId === auth.user?.id ? ' <small>(você)</small>' : ''}</span>
            <small>${escapeHtml(mesaRoleLabel(m.role))}</small>
          </li>`).join('')}
      </ul>
      <a class="chat-link" href="${base}/membros">${mesa.role === 'mestre' ? (owner ? 'convite, senha e apagar mesa' : 'convite e membros') : 'sair da mesa'}</a>
      <p class="chat-tool__sub">Fixadas</p>
      ${toolFixadasHTML(mesa)}
      <p class="chat-tool__sub">Notificações</p>
      ${notifyOptionsHTML(mesa)}`;
  }

  function chatToolHTML(mesa, toolId) {
    const tool = chatToolsFor(mesa).find((t) => t.id === toolId && !t.soon) || chatToolsFor(mesa)[0];
    const body = {
      dados: () => toolDadosHTML(mesa),
      combate: () => toolCombateHTML(mesa),
      ficha: () => toolFichaHTML(mesa),
      notas: () => toolNotasHTML(mesa),
      npcs: () => toolNpcsHTML(mesa),
      acervo: () => toolAcervoHTML(mesa),
      cena: () => toolCenaHTML(mesa),
      mestre: () => toolMestreHTML(mesa),
      opcoes: () => toolOpcoesHTML(mesa)
    }[tool.id]();
    return `<p class="chat-tool__title">${escapeHtml(tool.label)}</p><div class="chat-tool__body" data-tool-body="${tool.id}">${body}</div>`;
  }

  function chatRailHTML(mesa, tool) {
    const tools = chatToolsFor(mesa);
    const button = (t) => t.soon
      ? `<button type="button" class="chat-rail__btn is-soon" title="${escapeHtml(t.label)}" aria-label="${escapeHtml(t.label)}" aria-disabled="true" tabindex="-1">${t.icon}</button>`
      : `<button type="button" class="chat-rail__btn ${t.id === tool.id && tool.open ? 'is-active' : ''}" data-chat-tool="${t.id}" title="${escapeHtml(t.label)}" aria-label="${escapeHtml(t.label)}" aria-pressed="${t.id === tool.id && tool.open}">${t.icon}</button>`;
    const main = tools.filter((t) => !t.master && !t.bottom);
    const master = tools.filter((t) => t.master);
    const bottom = tools.filter((t) => t.bottom);
    return `
      ${main.map(button).join('')}
      ${master.length ? `<span class="chat-rail__sep" aria-hidden="true"></span>${master.map(button).join('')}` : ''}
      <span class="chat-rail__spacer" aria-hidden="true"></span>
      ${bottom.map(button).join('')}`;
  }

  /* ══════════════════════════════════════════════
     COMBATE EM GRID (mesa)
     Uma linha em mesa_combates por combate aberto. O Mestre edita mapa e peças
     direto na tabela; jogadores agem por RPC (mover, correr, agir, fim do turno,
     iniciativa). 1 quadrado = 1 metro. Regras: Sistemas › Combate em Grid.
     map.cells: um caractere por quadrado — ' ' fora, '0' chão, '1' parede,
     '2' terreno difícil. map.revealed: '1' onde o Mestre revelou a névoa.
     ══════════════════════════════════════════════ */
  const MESA_COMBATS = {};
  const COMBAT_DEFAULT_W = 24;
  const COMBAT_DEFAULT_H = 16;
  const COMBAT_MAX_SIDE = 80;
  const COMBAT_SIZES = [1, 2, 3, 4, 6];
  const COMBAT_FOG_MODES = { ambos: 'Visão das peças e revelado à mão', visao: 'Só a visão das peças', manual: 'Só o revelado à mão', nenhuma: 'Sem névoa' };
  const COMBAT_BRUSHES = [
    { id: 'chao', label: 'Chão', hint: 'Área jogável' },
    { id: 'parede', label: 'Parede', hint: 'Bloqueia passagem e visão. Só o Mestre vê o vermelho.' },
    { id: 'dificil', label: 'Difícil', hint: 'Cada quadrado custa 2q' },
    { id: 'apagar', label: 'Apagar', hint: 'Volta a ficar fora do mapa' },
    { id: 'revelar', label: 'Revelar', hint: 'Tira a névoa' },
    { id: 'esconder', label: 'Esconder', hint: 'Devolve a névoa' }
  ];
  const DUNGEON_SIZES = { pequena: { w: 24, h: 16, rooms: 5 }, media: { w: 36, h: 24, rooms: 8 }, grande: { w: 52, h: 34, rooms: 13 } };
  const combatUi = {
    brush: '', zoom: 0, view: 'grid', selected: '', placing: '', reach: null, hover: null,
    saveTimer: null, painting: false, imgCache: {}, act: null, fitted: '', pointers: new Map(), pinch: null
  };

  const CI = (d, size = 16) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const COMBAT_ICONS = {
    sword: CI('<path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6M16 16l4 4M19 21l2-2"/>'),
    run: CI('<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2v5M6 12l3-4 4 1 3 3 3 1"/>'),
    flag: CI('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    plus: CI('<path d="M12 5v14M5 12h14"/>'),
    minus: CI('<path d="M5 12h14"/>'),
    fit: CI('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    dice: CI('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>'),
    x: CI('<path d="M18 6L6 18M6 6l12 12"/>'),
    check: CI('<path d="M20 6L9 17l-5-5"/>'),
    shield: CI('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'),
    map: CI('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>')
  };

  function combatOf(mesaId) {
    const c = MESA_COMBATS[mesaId];
    return c && c.status !== 'encerrado' ? c : null;
  }
  const isCombatMaster = (mesa) => !!mesa && mesa.role === 'mestre';

  function normalizeCombatRow(row) {
    if (!row) return null;
    const map = row.map && typeof row.map === 'object' ? { ...row.map } : {};
    map.w = Math.max(4, Math.min(COMBAT_MAX_SIDE, parseInt(map.w, 10) || COMBAT_DEFAULT_W));
    map.h = Math.max(4, Math.min(COMBAT_MAX_SIDE, parseInt(map.h, 10) || COMBAT_DEFAULT_H));
    const n = map.w * map.h;
    map.cells = String(map.cells || '').padEnd(n, ' ').slice(0, n);
    map.revealed = String(map.revealed || '').padEnd(n, '0').slice(0, n);
    map.fog = COMBAT_FOG_MODES[map.fog] ? map.fog : 'ambos';
    map.vision = Math.max(1, Math.min(60, parseInt(map.vision, 10) || 12));
    map.bg = map.bg && map.bg.url ? { x: 0, y: 0, scale: 100, opacity: 100, ...map.bg } : null;
    const pieces = (Array.isArray(row.pieces) ? row.pieces : []).filter((p) => p && p.id);
    const turn = row.turn && typeof row.turn === 'object' ? row.turn : {};
    return {
      ...row, map, pieces,
      turn: { round: 1, index: 0, order: [], moveLeft: 0, actions: 1, attacks: 0, actionUsed: false, oa: [], ...turn }
    };
  }

  async function loadMesaCombat(mesaId) {
    if (!sb) return null;
    const { data, error } = await sb.from('mesa_combates').select('*').eq('mesa_id', mesaId)
      .in('status', ['preparando', 'ativo']).order('created_at', { ascending: false }).limit(1);
    if (error) { console.error('Erro ao carregar o combate:', error); return null; }
    MESA_COMBATS[mesaId] = normalizeCombatRow((data || [])[0] || null);
    return MESA_COMBATS[mesaId];
  }

  /* ── Geometria ── */
  const cellIdx = (map, x, y) => y * map.w + x;
  const cellAt = (map, x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h) ? ' ' : map.cells[cellIdx(map, x, y)];
  const pieceSize = (p) => (COMBAT_SIZES.includes(Number(p.size)) ? Number(p.size) : 1);
  const placed = (p) => Number.isInteger(p.x) && Number.isInteger(p.y);
  const pieceSide = (p) => (p.owner ? 'j' : 'm');
  const pieceCenter = (p) => ({ x: p.x + (pieceSize(p) - 1) / 2, y: p.y + (pieceSize(p) - 1) / 2 });
  function pieceCovers(p, x, y) {
    const s = pieceSize(p);
    return placed(p) && x >= p.x && y >= p.y && x < p.x + s && y < p.y + s;
  }
  /* Quadrados vazios entre duas peças (0 = encostadas, inclusive na diagonal). */
  function pieceGap(a, b) {
    const as = pieceSize(a), bs = pieceSize(b);
    return Math.max(0, b.x - (a.x + as), a.x - (b.x + bs), b.y - (a.y + as), a.y - (b.y + bs));
  }
  /* Distância em quadrados de uma peça até um quadrado (1 = encostado). */
  function pieceDistToCell(p, x, y) {
    const s = pieceSize(p);
    const dx = Math.max(0, p.x - x, x - (p.x + s - 1));
    const dy = Math.max(0, p.y - y, y - (p.y + s - 1));
    return Math.max(dx, dy);
  }
  function pieceAtCell(cb, x, y, filter) {
    for (let i = cb.pieces.length - 1; i >= 0; i--) {
      const p = cb.pieces[i];
      if (pieceCovers(p, x, y) && (!filter || filter(p))) return p;
    }
    return null;
  }
  /* A peça cabe com o canto em (x,y)? Fora do mapa, parede e outras peças de pé bloqueiam. */
  function pieceFits(cb, p, x, y) {
    const s = pieceSize(p);
    for (let dy = 0; dy < s; dy++) {
      for (let dx = 0; dx < s; dx++) {
        const c = cellAt(cb.map, x + dx, y + dy);
        if (c === ' ' || c === '1') return false;
        if (cb.pieces.some((o) => o.id !== p.id && !o.down && pieceCovers(o, x + dx, y + dy))) return false;
      }
    }
    return true;
  }
  function stepCost(cb, p, x, y) {
    const s = pieceSize(p);
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) if (cellAt(cb.map, x + dx, y + dy) === '2') return 2;
    return 1;
  }
  /* Quadrados alcançáveis com o movimento que sobra (diagonal custa 1, difícil 2). */
  function reachableCells(cb, p, budget) {
    const map = cb.map;
    const best = new Map();
    const key = (x, y) => `${x},${y}`;
    const queue = [[p.x, p.y, 0]];
    best.set(key(p.x, p.y), 0);
    while (queue.length) {
      let bi = 0;
      for (let i = 1; i < queue.length; i++) if (queue[i][2] < queue[bi][2]) bi = i;
      const [x, y, cost] = queue.splice(bi, 1)[0];
      if (cost > (best.get(key(x, y)) ?? Infinity)) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
          if (!pieceFits(cb, p, nx, ny)) continue;
          const nc = cost + stepCost(cb, p, nx, ny);
          if (nc > budget) continue;
          if (nc < (best.get(key(nx, ny)) ?? Infinity)) { best.set(key(nx, ny), nc); queue.push([nx, ny, nc]); }
        }
      }
    }
    best.delete(key(p.x, p.y));
    return best;
  }
  /* Linha de visão entre centros de quadrados: paredes no meio bloqueiam. */
  function lineCells(x0, y0, x1, y1) {
    const out = [];
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, x = x0, y = y0;
    while (!(x === x1 && y === y1)) {
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
      if (x === x1 && y === y1) break;
      out.push([x, y]);
    }
    return out;
  }
  const lineOfSight = (map, x0, y0, x1, y1) => !lineCells(x0, y0, x1, y1).some(([x, y]) => cellAt(map, x, y) === '1');
  /* Quadrados que um conjunto de peças enxerga (Set de índices). */
  function visionOf(cb, pieces) {
    const map = cb.map;
    const seen = new Set();
    const r = map.vision;
    pieces.filter((p) => placed(p) && !p.down).forEach((p) => {
      const s = pieceSize(p);
      for (let oy = 0; oy < s; oy++) {
        for (let ox = 0; ox < s; ox++) {
          const cx = p.x + ox, cy = p.y + oy;
          for (let y = Math.max(0, cy - r); y <= Math.min(map.h - 1, cy + r); y++) {
            for (let x = Math.max(0, cx - r); x <= Math.min(map.w - 1, cx + r); x++) {
              const i = cellIdx(map, x, y);
              if (seen.has(i)) continue;
              if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
              if (lineOfSight(map, cx, cy, x, y)) seen.add(i);
            }
          }
        }
      }
    });
    return seen;
  }
  /* null = tudo visível. O Mestre recebe a visão somada de todos os jogadores. */
  function visibleCellsFor(cb, mesa) {
    const map = cb.map;
    if (map.fog === 'nenhuma') return null;
    const me = auth.user?.id;
    const owners = isCombatMaster(mesa) ? cb.pieces.filter((p) => p.owner) : cb.pieces.filter((p) => p.owner && p.owner === me);
    const set = (map.fog === 'visao' || map.fog === 'ambos') ? visionOf(cb, owners) : new Set();
    if (map.fog === 'manual' || map.fog === 'ambos') {
      for (let i = 0; i < map.revealed.length; i++) if (map.revealed[i] === '1') set.add(i);
    }
    return set;
  }
  /* O jogador só sabe de peças que vê (ou que são dele). */
  function pieceSeenBy(mesa, cb, p, vis) {
    if (isCombatMaster(mesa)) return true;
    if (p.owner && p.owner === auth.user?.id) return true;
    if (p.hidden || !placed(p)) return false;
    if (!vis) return true;
    const s = pieceSize(p);
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) if (vis.has(cellIdx(cb.map, p.x + dx, p.y + dy))) return true;
    return false;
  }

  /* ── Peças: estado de combate tirado das fichas, NPCs e bestiário ── */
  function parsePool(text) {
    const parts = String(text || '').split('/').map((s) => parseInt(s, 10));
    const max = Number.isFinite(parts[1]) ? parts[1] : (Number.isFinite(parts[0]) ? parts[0] : 0);
    const cur = Number.isFinite(parts[0]) ? Math.min(parts[0], max || parts[0]) : max;
    return max > 0 ? { cur, max } : null;
  }
  function hpFromBeastFields(fields) {
    const parts = {};
    beastHpPartsForView(fields || {}).forEach((part) => {
      const m = String(part.hp || '').replace(',', '.').match(/\d+/);
      const max = m ? parseInt(m[0], 10) : 0;
      if (max > 0) parts[part.name] = { cur: max, max };
    });
    return Object.keys(parts).length ? parts : { Corpo: { cur: 10, max: 10 } };
  }
  function beastAttrDice(fields) {
    const attrs = (fields && fields.Atributos) || {};
    const out = {};
    CHAR_ATTRIBUTES.forEach((a) => { out[a] = attrDiceForScore(Number(attrs[a]) || CHAR_ATTR_BASE, 0); });
    return out;
  }
  function pieceMoveFromBeast(fields) {
    return computedMovementFor('', beastAttrDice(fields).Destreza);
  }
  function combatPieceSources(mesa) {
    const out = [];
    CHARACTERS.filter((c) => c.mesaId === mesa.id).forEach((c) => out.push({
      key: `c:${c.id}`, group: c.isNpc ? 'NPCs da mesa' : 'Fichas dos jogadores', name: c.name || 'Sem nome'
    }));
    (MESA_NPCS[mesa.id] || []).forEach((n) => out.push({ key: `n:${n.id}`, group: 'NPCs da mesa', name: n.title }));
    entriesIn('Bestiario').forEach((e) => out.push({ key: `b:${e.id}`, group: 'Bestiário', name: e.title }));
    return out;
  }
  function makeCombatPiece(mesa, key) {
    const [kind, ref] = key.split(':');
    const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const base = { id, ref, x: null, y: null, size: 1, hidden: false, hpVisible: false, initBonus: 0, down: false, mods: [], effects: [] };
    if (kind === 'c') {
      const c = CHARACTERS.find((x) => x.id === ref);
      if (!c) return null;
      const v = ensureVitals(c);
      const awk = normalizeAwakening(c.magic);
      const A = attrModsView(c, raceDataFor(c.raceId).mod, awkIsNonMage(awk) ? awk.bonusAttr : '');
      const attrs = {};
      CHAR_ATTRIBUTES.forEach((a) => { attrs[a] = A[a] ? A[a].dice : 1; });
      const hp = {};
      Object.entries(v.hp || {}).forEach(([part, slot]) => { if (Number(slot.max) > 0) hp[part] = { cur: Number(slot.cur) || 0, max: Number(slot.max) }; });
      const da = daStateOf(c);
      return {
        ...base, kind: 'char', name: c.name || 'Sem nome', image: c.image || '', color: safeChatColor(c.identity?.chatColor, c.id),
        owner: c.isNpc ? null : (c.userId || null), move: Math.max(1, parseInt(movementLabelOf(c, A), 10) || 1),
        hpVisible: !c.isNpc, attrs, daAttr: daAttrOf(c), sheetDa: Number(da.value) || 0,
        hp: Object.keys(hp).length ? hp : { Corpo: { cur: 10, max: 10 } },
        mp: v.mana && Number(v.mana.max) > 0 ? { cur: Number(v.mana.cur) || 0, max: Number(v.mana.max) } : null,
        df: totalDf(c), dm: totalDm(c)
      };
    }
    const beastLike = (title, image, colorSeed, fields, extra) => ({
      ...base, name: title, image: image || '', color: chatColorFor(colorSeed), owner: null,
      move: pieceMoveFromBeast(fields), attrs: beastAttrDice(fields), daAttr: beastDaAttribute(fields) || 'Destreza',
      hp: hpFromBeastFields(fields), mp: parsePool(fields && fields.Mana),
      df: beastDefenseLevel(fields, 'DF'), dm: beastDefenseLevel(fields, 'DM'), ...extra
    });
    if (kind === 'n') {
      const n = (MESA_NPCS[mesa.id] || []).find((x) => x.id === ref);
      if (!n) return null;
      return beastLike(n.title, n.image, n.id, n.fields || {}, { kind: 'npc', hidden: !n.visible });
    }
    if (kind === 'b') {
      const e = entryById(ref);
      if (!e) return null;
      return beastLike(e.title, e.image, e.id, e.fields || {}, { kind: 'beast', hidden: true });
    }
    return null;
  }
  function hpTotals(p) {
    if (p.hp && typeof p.hp === 'object') {
      const parts = Object.values(p.hp);
      return { cur: parts.reduce((s, x) => s + (Number(x.cur) || 0), 0), max: parts.reduce((s, x) => s + (Number(x.max) || 0), 0) };
    }
    return null;
  }
  const currentTurnPiece = (cb) => (cb && cb.status === 'ativo' && cb.turn.phase !== 'iniciativa')
    ? cb.pieces.find((p) => p.id === (cb.turn.order || [])[cb.turn.index || 0]) || null : null;
  const canControl = (mesa, p) => !!p && (isCombatMaster(mesa) || (p.owner && p.owner === auth.user?.id));
  const initTotal = (p) => (Number(p.initRoll) || 0) + (Number(p.initBonus) || 0) + modSum(p, 'Iniciativa');
  const modSum = (p, stat) => (Array.isArray(p.mods) ? p.mods : []).filter((m) => m.stat === stat).reduce((s, m) => s + (Number(m.valor) || 0), 0);
  const pieceMove = (p) => Math.max(0, (Number(p.move) || 1) + modSum(p, 'Movimento') + modSum(p, 'Destreza'));
  const pieceDa = (p) => (Number(p.da) || 0) + modSum(p, 'DA');
  const attrDiceOf = (p, attr) => Math.max(1, (Number(p.attrs && p.attrs[attr]) || 1) + modSum(p, attr));
  function turnFor(p) {
    return {
      moveLeft: pieceMove(p), actions: Math.max(0, 1 + modSum(p, 'Ações extras')),
      attacks: Math.max(0, modSum(p, 'Ataques extras')), actionUsed: false, dashed: false, oa: []
    };
  }

  /* ── Dados ── */
  function rollDiceExpr(dados, bonus = 0) {
    const m = String(dados || '').match(/^(\d+)d(\d+)$/i);
    if (!m) return { rolls: [], total: Math.max(0, bonus), text: String(bonus) };
    const rolls = Array.from({ length: Number(m[1]) }, () => randomInt(Number(m[2])));
    const total = Math.max(0, rolls.reduce((s, v) => s + v, 0) + bonus);
    return { rolls, total, text: `${rolls.join(' + ')}${bonus ? ` ${bonus > 0 ? '+' : '−'} ${Math.abs(bonus)}` : ''}` };
  }
  function halveDice(dados) {
    const m = String(dados || '').match(/^(\d+)d(\d+)$/i);
    return m ? `${Math.max(1, Math.floor(Number(m[1]) / 2))}d${m[2]}` : dados;
  }

  /* ── Ações disponíveis para uma peça ── */
  function combatActionOptions(mesa, p) {
    const out = [];
    const push = (opt) => { if (opt.combat && opt.combat.uso !== 'nenhum') out.push(opt); };
    const entryCost = (entry, combat) => {
      const f = (entry && entry.fields) || {};
      const valor = parseInt(f.Custo, 10);
      if (Number.isFinite(valor) && valor > 0) return { valor, unidade: f.CustoUnidade === 'HP' ? 'HP' : 'MP' };
      return combat && combat.custo ? combat.custo : null;
    };
    if (p.kind === 'char') {
      const c = CHARACTERS.find((x) => x.id === p.ref);
      if (c) {
        (Array.isArray(c.inventory) ? c.inventory : []).filter((it) => it.equipped && it.refId).forEach((it, i) => {
          const entry = entryById(it.refId);
          if (!entry) return;
          const info = combatOfEntry(entry);
          push({ id: `w${i}:${it.refId}`, group: 'Armas e itens', name: it.name || entry.title, combat: info.combat, cost: info.combat && info.combat.custo, weapon: true });
        });
        (Array.isArray(c.spells) ? c.spells : []).filter((sp) => sp.refId).forEach((sp, i) => {
          const entry = entryById(sp.refId);
          if (!entry) return;
          const info = combatOfEntry(entry);
          push({ id: `s${i}:${sp.refId}`, group: 'Magias', name: sp.name || entry.title, combat: info.combat, cost: entryCost(entry, info.combat), useForm: (entry.fields || {})['Forma de Uso'] || '' });
        });
      }
    } else {
      const fields = p.kind === 'npc'
        ? (((MESA_NPCS[mesa.id] || []).find((x) => x.id === p.ref) || {}).fields || {})
        : ((entryById(p.ref) || {}).fields || {});
      normalizeBeastAbilities(fields.Habilidades).forEach((a, i) => {
        const info = combatOfAbility(a);
        const linked = a.source === 'magic' && a.refId ? entryById(a.refId) : null;
        push({ id: `h${i}`, group: 'Habilidades', name: a.name, combat: info.combat, cost: linked ? entryCost(linked, info.combat) : (info.combat && info.combat.custo), useForm: info.useForm || '' });
      });
    }
    return out;
  }
  function optionAttr(opt) {
    const c = opt.combat;
    return c.atributo || (opt.useForm ? COMBAT_USEFORM_ATTR[opt.useForm] : '') || (c.alcance > 1 ? 'Destreza' : 'Força');
  }

  /* Quadrados da área, a partir da peça que age e do quadrado escolhido. */
  function areaCells(cb, actor, combat, cx, cy) {
    const map = cb.map;
    const cells = [];
    const add = (x, y) => { if (x >= 0 && y >= 0 && x < map.w && y < map.h && map.cells[cellIdx(map, x, y)] !== ' ') cells.push([x, y]); };
    const o = pieceCenter(actor);
    const n = Math.max(1, combat.tamanho), wdt = Math.max(1, combat.largura);
    if (combat.forma === 'cena') {
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) add(x, y);
      return cells;
    }
    if (combat.forma === 'quadrado') {
      const x0 = cx - Math.floor((n - 1) / 2), y0 = cy - Math.floor((wdt - 1) / 2);
      for (let y = y0; y < y0 + wdt; y++) for (let x = x0; x < x0 + n; x++) add(x, y);
      return cells;
    }
    if (combat.forma === 'raio') {
      const c = combat.alcance === 0 ? o : { x: cx, y: cy };
      for (let y = Math.floor(c.y - n); y <= Math.ceil(c.y + n); y++) {
        for (let x = Math.floor(c.x - n); x <= Math.ceil(c.x + n); x++) {
          if ((x - c.x) ** 2 + (y - c.y) ** 2 <= n * n + 0.01 && lineOfSight(map, Math.round(c.x), Math.round(c.y), x, y)) add(x, y);
        }
      }
      return cells.filter(([x, y]) => combat.alcance > 0 || !pieceCovers(actor, x, y));
    }
    const dx = cx - o.x, dy = cy - o.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const s = pieceSize(actor);
    for (let y = actor.y - n - s; y <= actor.y + n + s; y++) {
      for (let x = actor.x - n - s; x <= actor.x + n + s; x++) {
        if (pieceCovers(actor, x, y)) continue;
        const vx = x - o.x, vy = y - o.y;
        const along = vx * ux + vy * uy;
        const across = Math.abs(-vx * uy + vy * ux);
        const reach = along - (s - 1) / 2;
        let inside = false;
        if (combat.forma === 'cone') inside = reach > 0 && reach <= n + 0.01 && across <= along + 0.01;
        if (combat.forma === 'linha') inside = reach > 0 && reach <= n + 0.01 && across <= wdt / 2;
        if (inside && lineOfSight(map, Math.round(o.x), Math.round(o.y), x, y)) add(x, y);
      }
    }
    return cells;
  }
  function targetAllowed(actor, target, combat) {
    if (target.down && combat.uso === 'ataque') return false;
    if (combat.alvos === 'proprio') return target.id === actor.id;
    if (combat.alvos === 'inimigos') return pieceSide(target) !== pieceSide(actor);
    if (combat.alvos === 'aliados') return pieceSide(target) === pieceSide(actor);
    return true;
  }
  /* Cobertura: outra criatura de pé na linha entre o atacante e o alvo dá +2 na DA. */
  function hasCover(cb, actor, target) {
    const a = pieceCenter(actor), t = pieceCenter(target);
    return lineCells(Math.round(a.x), Math.round(a.y), Math.round(t.x), Math.round(t.y))
      .some(([x, y]) => cb.pieces.some((q) => q.id !== actor.id && q.id !== target.id && !q.down && pieceCovers(q, x, y)));
  }
  /* Arco ou besta disparados com um inimigo encostado perdem metade dos dados. */
  function engagedInMelee(cb, actor) {
    return cb.pieces.some((q) => q.id !== actor.id && !q.down && placed(q) && pieceSide(q) !== pieceSide(actor) && pieceGap(actor, q) === 0);
  }

  /* ── Escrita ── */
  async function combatUpdate(mesaId, patch) {
    const cb = combatOf(mesaId);
    if (!cb) return;
    Object.assign(cb, patch);
    renderCombatAll(mesaId);
    const { error } = await sb.from('mesa_combates').update(patch).eq('id', cb.id);
    if (error) toast('Erro no combate: ' + error.message);
  }
  function combatSaveMapSoon(mesaId) {
    clearTimeout(combatUi.saveTimer);
    combatUi.saveTimer = setTimeout(() => {
      const cb = combatOf(mesaId);
      if (cb) sb.from('mesa_combates').update({ map: cb.map }).eq('id', cb.id).then(({ error }) => { if (error) toast('Erro ao salvar o mapa: ' + error.message); });
    }, 450);
  }
  function combatSetPieces(mesaId, fn) {
    const cb = combatOf(mesaId);
    if (!cb) return;
    const pieces = cb.pieces.map((p) => ({ ...p }));
    fn(pieces);
    combatUpdate(mesaId, { pieces });
  }
  async function combatRpc(mesaId, name, args) {
    const { error } = await sb.rpc(name, args);
    if (error) { toast(error.message); return false; }
    await loadMesaCombat(mesaId);
    renderCombatAll(mesaId);
    return true;
  }
  async function combatChat(mesa, speakerPiece, data, body = '') {
    try {
      await sendChatMessage(mesa.id, {
        kind: 'combate', body,
        speaker: speakerPiece
          ? { type: speakerPiece.kind === 'char' ? 'character' : 'avulso', id: speakerPiece.ref, name: speakerPiece.name, image: speakerPiece.image || '', color: speakerPiece.color || '' }
          : { type: 'narrador', name: 'Combate' },
        data
      });
    } catch (err) { console.error(err); }
  }
  async function createCombat(mesa) {
    const n = COMBAT_DEFAULT_W * COMBAT_DEFAULT_H;
    const row = {
      mesa_id: mesa.id, status: 'preparando',
      map: { w: COMBAT_DEFAULT_W, h: COMBAT_DEFAULT_H, cells: ' '.repeat(n), revealed: '0'.repeat(n), fog: 'ambos', vision: 12, bg: null },
      pieces: [], turn: { round: 1, index: 0, order: [], moveLeft: 0, actions: 1, attacks: 0, actionUsed: false, oa: [] }
    };
    const { data, error } = await sb.from('mesa_combates').insert(row).select().single();
    if (error) { toast('Não foi possível abrir o combate: ' + error.message); return; }
    MESA_COMBATS[mesa.id] = normalizeCombatRow(data);
    combatUi.brush = 'chao';
    combatUi.view = 'grid';
    combatUi.fitted = '';
    renderCombatAll(mesa.id);
  }
  function rollDaFor(p) {
    const dice = attrDiceOf(p, p.daAttr || 'Destreza');
    let total = randomInt(12);
    for (let i = 0; i < dice; i++) total += randomInt(6);
    return total;
  }
  /* Passo 1: os jogadores passam a ver o grid e rolam iniciativa e DA. */
  function callInitiative(mesa) {
    const cb = combatOf(mesa.id);
    if (!cb) return;
    if (!cb.pieces.some(placed)) { toast('Ponha ao menos uma peça no mapa.'); return; }
    const pieces = cb.pieces.map((p) => (placed(p) && !p.owner && !p.initRoll ? { ...p, initRoll: randomInt(100), da: p.da || rollDaFor(p) } : p));
    combatUpdate(mesa.id, { pieces, status: 'ativo', turn: { ...cb.turn, phase: 'iniciativa', order: [], index: 0, round: 1 } });
    combatChat(mesa, null, { event: 'iniciativa' }, 'O combate começou. Rolem iniciativa e DA.');
  }
  /* Passo 2: a ordem sai da iniciativa e a primeira peça age. */
  function startRounds(mesa) {
    const cb = combatOf(mesa.id);
    if (!cb) return;
    const missing = cb.pieces.filter((p) => placed(p) && !p.initRoll);
    if (missing.length && !confirm(`${missing.map((p) => p.name).join(', ')} ainda não rolou. Rolar por eles e começar?`)) return;
    const pieces = cb.pieces.map((p) => (placed(p) && !p.initRoll ? { ...p, initRoll: randomInt(100), da: p.da || rollDaFor(p) } : (placed(p) && !p.da ? { ...p, da: rollDaFor(p) } : p)));
    const order = pieces.filter(placed).map((p) => ({ id: p.id, t: initTotal(p), r: Math.random() }))
      .sort((a, b) => b.t - a.t || b.r - a.r).map((x) => x.id);
    const first = pieces.find((p) => p.id === order[0]);
    combatUpdate(mesa.id, { pieces, status: 'ativo', turn: { round: 1, index: 0, order, phase: 'rodadas', ...turnFor(first) } });
  }

  /* ── Desenho ── */
  function combatImage(url, onload) {
    if (!url) return null;
    let img = combatUi.imgCache[url];
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => onload && onload();
      img.src = url;
      combatUi.imgCache[url] = img;
    }
    return img.complete && img.naturalWidth ? img : null;
  }
  /* Ajuste inicial: preenche a largura sem deixar o quadrado ilegível (rola na vertical).
     whole = mapa inteiro na tela, nem que fique pequeno. */
  function fitCombatZoom(mesaId, whole = false) {
    const cb = combatOf(mesaId);
    const scroll = document.querySelector('[data-combat-scroll]');
    if (!cb || !scroll) return;
    const availW = Math.max(160, scroll.clientWidth - 16);
    const availH = Math.max(160, scroll.clientHeight - 16);
    const byW = Math.floor(availW / cb.map.w);
    const byBoth = Math.floor(Math.min(availW / cb.map.w, availH / cb.map.h));
    const z = whole ? byBoth : Math.max(byBoth, Math.min(byW, 26));
    combatUi.zoom = Math.max(whole ? 8 : 22, Math.min(48, z));
    combatUi.fitted = `${mesaId}|${cb.map.w}x${cb.map.h}`;
  }
  function drawCombat(mesaId) {
    const canvas = document.querySelector('[data-combat-canvas]');
    const mesa = mesaById(mesaId);
    const cb = combatOf(mesaId);
    if (!canvas || !cb || !mesa) return;
    if (!combatUi.zoom || combatUi.fitted !== `${mesaId}|${cb.map.w}x${cb.map.h}`) fitCombatZoom(mesaId);
    const master = isCombatMaster(mesa);
    const map = cb.map;
    const cs = combatUi.zoom;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = map.w * cs, H = map.h * cs;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const redraw = () => drawCombat(mesaId);
    const bg = map.bg ? combatImage(map.bg.url, redraw) : null;
    const visible = visibleCellsFor(cb, mesa);
    const isVis = (i) => !visible || visible.has(i);

    ctx.fillStyle = '#0b0915';
    ctx.fillRect(0, 0, W, H);
    if (bg) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, (Number(map.bg.opacity) || 100) / 100));
      const scale = Math.max(10, Number(map.bg.scale) || 100) / 100;
      ctx.drawImage(bg, (Number(map.bg.x) || 0) * cs, (Number(map.bg.y) || 0) * cs, W * scale, (W * scale) * (bg.naturalHeight / bg.naturalWidth));
      ctx.restore();
    }

    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        const c = map.cells[cellIdx(map, x, y)];
        const px = x * cs, py = y * cs;
        if (c === ' ') {
          ctx.fillStyle = master ? (bg ? 'rgba(5,4,10,0.6)' : '#0d0b18') : '#07060d';
          ctx.fillRect(px, py, cs, cs);
          if (master && !bg) { ctx.fillStyle = 'rgba(196,181,253,0.06)'; ctx.fillRect(px + cs / 2 - 1, py + cs / 2 - 1, 2, 2); }
          continue;
        }
        if (!bg) { ctx.fillStyle = (x + y) % 2 ? '#1b1731' : '#1d1934'; ctx.fillRect(px, py, cs, cs); }
        if (c === '2') {
          ctx.fillStyle = 'rgba(180,120,40,0.28)'; ctx.fillRect(px, py, cs, cs);
          ctx.fillStyle = 'rgba(230,180,90,0.45)';
          for (let k = 0; k < 3; k++) ctx.fillRect(px + cs * (0.25 + k * 0.25) - 1, py + cs * (k % 2 ? 0.35 : 0.65) - 1, 2, 2);
        }
        if (c === '1') {
          if (master) {
            ctx.fillStyle = 'rgba(244,63,94,0.42)'; ctx.fillRect(px, py, cs, cs);
            ctx.strokeStyle = 'rgba(244,63,94,0.55)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px, py + cs); ctx.lineTo(px + cs, py); ctx.stroke();
          } else if (!bg) { ctx.fillStyle = '#100d1d'; ctx.fillRect(px, py, cs, cs); }
        }
        ctx.strokeStyle = 'rgba(196,181,253,0.14)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, cs - 1, cs - 1);
      }
    }

    // Alcance do movimento.
    if (combatUi.reach) {
      combatUi.reach.forEach((cost, k) => {
        const [x, y] = k.split(',').map(Number);
        ctx.fillStyle = cost > (cb.turn.moveLeft || 0) - 0 ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.24)';
        ctx.fillRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4);
        if (cs >= 26) {
          ctx.fillStyle = 'rgba(110,231,183,0.85)'; ctx.font = `600 ${Math.round(cs * 0.28)}px Inter, sans-serif`;
          ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(String(cost), x * cs + cs - 4, y * cs + cs - 3);
        }
      });
    }

    // Mira de ação: alcance (azul) e área (laranja).
    const act = combatUi.act;
    if (act && act.step === 'target') {
      const actor = cb.pieces.find((p) => p.id === act.actor);
      if (actor && act.opt.combat.alcance > 0) {
        for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
          if (map.cells[cellIdx(map, x, y)] === ' ') continue;
          if (pieceDistToCell(actor, x, y) <= act.opt.combat.alcance && !pieceCovers(actor, x, y)) {
            ctx.fillStyle = 'rgba(96,165,250,0.13)'; ctx.fillRect(x * cs, y * cs, cs, cs);
          }
        }
      }
      (act.preview || []).forEach(([x, y]) => {
        ctx.fillStyle = 'rgba(251,146,60,0.32)'; ctx.fillRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2);
      });
    }

    // Névoa.
    if (visible) {
      for (let y = 0; y < map.h; y++) {
        for (let x = 0; x < map.w; x++) {
          const i = cellIdx(map, x, y);
          if (isVis(i) || map.cells[i] === ' ') continue;
          ctx.fillStyle = master ? 'rgba(0,0,0,0.4)' : '#06050b';
          ctx.fillRect(x * cs, y * cs, cs, cs);
        }
      }
    }

    // Peças.
    const turnPiece = currentTurnPiece(cb);
    const targeted = new Set(act && act.targets ? act.targets : []);
    cb.pieces.forEach((p) => {
      if (!placed(p) || !pieceSeenBy(mesa, cb, p, visible)) return;
      const s = pieceSize(p);
      const cx = (p.x + s / 2) * cs, cy = (p.y + s / 2) * cs, r = (s * cs) / 2 - 3;
      ctx.save();
      if (turnPiece && turnPiece.id === p.id) { ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 16; }
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#221c3a'; ctx.fill();
      ctx.restore();
      const img = combatImage(p.image, redraw);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); ctx.clip();
      if (img) {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 4, side, side, cx - r, cy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = p.color || '#8b5cf6'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.fillStyle = '#fff'; ctx.font = `600 ${Math.round(r)}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText((p.name || '?').charAt(0).toUpperCase(), cx, cy + 1);
      }
      if (p.down) { ctx.fillStyle = 'rgba(10,8,20,0.55)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const isSel = combatUi.selected === p.id || targeted.has(p.id);
      ctx.lineWidth = isSel ? 3.5 : 2.2;
      ctx.strokeStyle = targeted.has(p.id) ? '#fb923c' : (isSel ? '#f3eefe' : (p.color || '#8b5cf6'));
      ctx.stroke();
      if (p.hidden && master) {
        ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(243,238,254,0.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      if (p.down) {
        ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx - r * 0.55, cy - r * 0.55); ctx.lineTo(cx + r * 0.55, cy + r * 0.55);
        ctx.moveTo(cx + r * 0.55, cy - r * 0.55); ctx.lineTo(cx - r * 0.55, cy + r * 0.55); ctx.stroke();
      }
      if ((p.effects || []).length) {
        ctx.fillStyle = '#a855f7'; ctx.beginPath(); ctx.arc(cx + r * 0.72, cy - r * 0.72, Math.max(3, cs * 0.1), 0, Math.PI * 2); ctx.fill();
      }
      const showHp = master || p.hpVisible || p.owner === auth.user?.id;
      const hp = showHp ? hpTotals(p) : null;
      if (hp && hp.max) {
        const bw = s * cs - 8, pct = Math.max(0, Math.min(1, hp.cur / hp.max));
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(p.x * cs + 4, (p.y + s) * cs - 6, bw, 4);
        ctx.fillStyle = pct > 0.5 ? '#10b981' : (pct > 0.25 ? '#f59e0b' : '#f43f5e');
        ctx.fillRect(p.x * cs + 4, (p.y + s) * cs - 6, bw * pct, 4);
      }
    });

    if (combatUi.hover && (combatUi.brush || combatUi.placing) && master) {
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.strokeRect(combatUi.hover.x * cs + 1, combatUi.hover.y * cs + 1, cs - 2, cs - 2);
    }
  }

  /* ── Cabeçalho do grid ── */
  function combatHudHTML(mesa, cb) {
    const master = isCombatMaster(mesa);
    const vis = master ? null : visibleCellsFor(cb, mesa);
    const turnPiece = currentTurnPiece(cb);
    const mine = turnPiece && canControl(mesa, turnPiece);
    const me = auth.user?.id;
    let status;
    if (cb.status === 'preparando') status = '<span class="combat-pill combat-pill--prep">Preparando</span><span class="combat-hud__sub">só o Mestre vê o mapa</span>';
    else if (cb.turn.phase === 'iniciativa') status = '<span class="combat-pill">Iniciativa</span><span class="combat-hud__sub">rolem iniciativa e DA</span>';
    else if (turnPiece) {
      const seen = pieceSeenBy(mesa, cb, turnPiece, vis);
      status = `<span class="combat-pill">Rodada ${cb.turn.round}</span><span class="combat-hud__sub">vez de <b style="color:${escapeHtml(seen ? (turnPiece.color || 'inherit') : 'inherit')}">${escapeHtml(seen ? turnPiece.name : 'alguém que você não vê')}</b></span>`;
    } else status = `<span class="combat-pill">Rodada ${cb.turn.round}</span>`;

    // Ataques de oportunidade abertos para peças que eu controlo.
    const oa = (cb.turn.oa || []).filter((e) => {
      const by = cb.pieces.find((p) => p.id === e.by);
      return by && canControl(mesa, by);
    });
    const oaHTML = oa.map((e) => {
      const by = cb.pieces.find((p) => p.id === e.by);
      const target = cb.pieces.find((p) => p.id === e.target);
      if (!by || !target) return '';
      return `<div class="combat-oa">
        <span>${COMBAT_ICONS.sword}<b>${escapeHtml(by.name)}</b> pode atacar <b>${escapeHtml(target.name)}</b>, que saiu de perto.</span>
        <span class="combat-oa__btns">
          <button type="button" class="cbtn cbtn--primary" data-combat-oa="${escapeHtml(by.id)}" data-oa-target="${escapeHtml(target.id)}">Atacar</button>
          <button type="button" class="cbtn" data-combat-oa-skip="${escapeHtml(by.id)}">Deixar</button>
        </span>
      </div>`;
    }).join('');

    const myUnrolled = cb.status === 'ativo' && cb.pieces.some((p) => p.owner === me && !p.initRoll && placed(p));
    const actions = Number(cb.turn.actions ?? (cb.turn.actionUsed ? 0 : 1));
    const attacks = Number(cb.turn.attacks || 0);
    const acting = combatUi.act && combatUi.act.actor;
    return `
      <div class="combat-hud__row">
        <div class="combat-hud__status">${status}</div>
      </div>
      ${myUnrolled ? `<div class="combat-hud__row"><button type="button" class="cbtn cbtn--primary cbtn--wide" data-combat-roll-init>${COMBAT_ICONS.dice}Rolar iniciativa e DA</button></div>` : ''}
      ${master && cb.turn.phase === 'iniciativa' ? `<div class="combat-hud__row"><button type="button" class="cbtn cbtn--primary cbtn--wide" data-combat-rounds>${COMBAT_ICONS.flag}Começar a rodada 1</button></div>` : ''}
      ${mine && !acting ? `
        <div class="combat-hud__row combat-hud__turn">
          <span class="combat-stat" title="Movimento que sobra"><b>${cb.turn.moveLeft}q</b><small>mover</small></span>
          <span class="combat-stat ${actions > 0 ? '' : 'is-used'}"><b>${actions}</b><small>${actions === 1 ? 'ação' : 'ações'}</small></span>
          ${attacks ? `<span class="combat-stat"><b>${attacks}</b><small>atq. extra</small></span>` : ''}
          <span class="combat-hud__spacer"></span>
          <button type="button" class="cbtn cbtn--primary" data-combat-act ${actions > 0 || attacks > 0 ? '' : 'disabled'}>${COMBAT_ICONS.sword}<span>Agir</span></button>
          <button type="button" class="cbtn" data-combat-dash ${actions > 0 ? '' : 'disabled'} title="Troca uma ação por mais movimento">${COMBAT_ICONS.run}<span>Correr</span></button>
          <button type="button" class="cbtn" data-combat-endturn>${COMBAT_ICONS.flag}<span>Fim do turno</span></button>
        </div>` : ''}
      ${oaHTML}`;
  }

  function combatStageHTML(mesa) {
    const cb = combatOf(mesa.id);
    if (!cb) return '';
    return `
      <div class="combat-hud" data-combat-hud>${combatHudHTML(mesa, cb)}</div>
      <div class="combat-mapwrap">
        <div class="combat-scroll" data-combat-scroll><canvas class="combat-canvas" data-combat-canvas aria-label="Mapa do combate"></canvas></div>
        <div class="combat-zoom" role="group" aria-label="Zoom do mapa">
          <button type="button" class="cbtn cbtn--icon" data-combat-zoom="1" aria-label="Aproximar">${COMBAT_ICONS.plus}</button>
          <button type="button" class="cbtn cbtn--icon" data-combat-zoom="-1" aria-label="Afastar">${COMBAT_ICONS.minus}</button>
          <button type="button" class="cbtn cbtn--icon" data-combat-fit aria-label="Mapa inteiro na tela">${COMBAT_ICONS.fit}</button>
        </div>
      </div>
      <div class="combat-sheet" data-combat-sheet hidden></div>
      <p class="combat-hint" data-combat-hint>${escapeHtml(combatHintText(mesa, cb))}</p>`;
  }
  function combatHintText(mesa, cb) {
    const master = isCombatMaster(mesa);
    const act = combatUi.act;
    if (act && act.step === 'target') {
      if (act.opt.combat.forma === 'alvo') return 'Toque no alvo. A área azul é o alcance.';
      return act.opt.combat.alcance === 0 ? 'Toque para apontar a direção da área.' : 'Toque no centro da área, dentro do azul.';
    }
    if (combatUi.placing) return 'Toque num quadrado para pôr a peça.';
    if (master && combatUi.brush) {
      const b = COMBAT_BRUSHES.find((x) => x.id === combatUi.brush);
      return `Pincel ${b ? b.label : ''}: toque e arraste no mapa. Toque de novo no pincel para soltar.`;
    }
    if (combatUi.selected && combatUi.reach) return 'Toque num quadrado verde para andar. O número é o custo.';
    if (master && combatUi.selected) {
      const sp = cb.pieces.find((p) => p.id === combatUi.selected);
      if (sp) return `Toque num quadrado para levar ${sp.name} até lá, ou na peça de novo para soltar.`;
    }
    const t = currentTurnPiece(cb);
    if (t && canControl(mesa, t)) return 'Sua vez: toque na sua peça para andar, ou em Agir.';
    if (master) return cb.status === 'preparando' ? 'Pinte o chão, ponha as peças e chame a iniciativa.' : 'Toque numa peça para movê-la.';
    if (cb.turn.phase === 'iniciativa') return 'Role iniciativa e DA para entrar na ordem.';
    return 'Aguarde a sua vez.';
  }

  /* ── Folha de ação (escolher, mirar, rolar, aplicar) ── */
  function combatSheetHTML(mesa, cb) {
    const act = combatUi.act;
    if (!act) return '';
    const actor = cb.pieces.find((p) => p.id === act.actor);
    if (!actor) return '';
    const close = `<button type="button" class="cbtn cbtn--icon cbtn--ghost" data-act-cancel aria-label="Cancelar">${COMBAT_ICONS.x}</button>`;
    if (act.step === 'pick') {
      const opts = combatActionOptions(mesa, actor).filter((o) => act.mode !== 'oportunidade' || (o.combat.uso === 'ataque' && o.combat.forma === 'alvo'));
      const groups = [...new Set(opts.map((o) => o.group))];
      return `
        <header class="combat-sheet__head"><div><strong>${act.mode === 'oportunidade' ? 'Ataque de oportunidade' : 'Agir'}</strong><small>${escapeHtml(actor.name)}</small></div>${close}</header>
        <div class="combat-sheet__body">
          ${opts.length ? groups.map((g) => `
            <p class="combat-sheet__group">${escapeHtml(g)}</p>
            <div class="combat-options">
              ${opts.filter((o) => o.group === g).map((o) => {
                const parts = combatSummaryParts(o.combat, { useForm: o.useForm }).slice(1, 5);
                const cost = o.cost && o.cost.valor ? `${o.cost.valor} ${o.cost.unidade}` : '';
                return `<button type="button" class="combat-option" data-act-pick="${escapeHtml(o.id)}">
                  <span class="combat-option__name">${escapeHtml(o.name)}${cost ? `<em>${escapeHtml(cost)}</em>` : ''}</span>
                  <span class="combat-option__meta">${parts.map((x) => `<i>${escapeHtml(x)}</i>`).join('')}</span>
                </button>`;
              }).join('')}
            </div>`).join('') : `<p class="combat-sheet__empty">Nada para usar. ${actor.kind === 'char' ? 'Equipe uma arma ou aprenda uma magia na ficha.' : 'Cadastre habilidades com uso em combate na besta.'}</p>`}
        </div>`;
    }
    const opt = act.opt;
    const c = opt.combat;
    const targets = act.targets.map((id) => cb.pieces.find((p) => p.id === id)).filter(Boolean);
    const head = `<header class="combat-sheet__head"><div><strong>${escapeHtml(opt.name)}</strong><small>${escapeHtml(combatSummaryParts(c, { useForm: opt.useForm }).join(' · '))}</small></div>${close}</header>`;
    if (act.step === 'target') {
      return `${head}
        <div class="combat-sheet__body">
          <p class="combat-sheet__lead">${escapeHtml(targets.length ? (c.forma === 'alvo' ? 'Alvo escolhido. Toque em outro para trocar.' : 'Toque em outro ponto para mover a área.') : combatHintText(mesa, cb))}</p>
          ${targets.length ? `<div class="combat-chips">${targets.map((t) => `<span>${escapeHtml(t.name)}</span>`).join('')}</div>` : '<p class="combat-sheet__empty">Nenhum alvo escolhido.</p>'}
          ${act.warn ? `<p class="combat-sheet__warn">${escapeHtml(act.warn)}</p>` : ''}
        </div>
        <footer class="combat-sheet__foot">
          <button type="button" class="cbtn" data-act-back>Voltar</button>
          <button type="button" class="cbtn cbtn--primary" data-act-confirm ${targets.length ? '' : 'disabled'}>${c.uso === 'ataque' ? `${COMBAT_ICONS.dice}Rolar ataque` : (c.dano.length ? `${COMBAT_ICONS.dice}Continuar` : `${COMBAT_ICONS.check}Aplicar`)}</button>
        </footer>`;
    }
    if (act.step === 'result') {
      const r = act.roll;
      const lines = act.results.map((res) => {
        const t = cb.pieces.find((p) => p.id === res.target);
        const name = t ? t.name : '?';
        const parts = t && t.hp ? Object.keys(t.hp) : [];
        const partPick = res.hit && act.needsDamage && parts.length > 1 && res.choosePart
          ? `<select class="combat-select" data-act-part="${escapeHtml(res.target)}">${parts.map((pt) => `<option ${pt === res.part ? 'selected' : ''}>${escapeHtml(pt)}</option>`).join('')}</select>`
          : (res.hit && res.part && parts.length > 1 ? `<small>${escapeHtml(res.partRoll || '')}${escapeHtml(res.part)}</small>` : '');
        return `<li class="${res.hit ? 'is-hit' : 'is-miss'}">
          <span class="combat-result__name">${escapeHtml(name)}</span>
          ${c.uso === 'ataque' ? `<span class="combat-result__vs">DA ${res.da}${res.cover ? ' (+2 cobertura)' : ''}</span><b>${res.hit ? 'Acertou' : 'Errou'}</b>` : '<b>Atingido</b>'}
          ${partPick}
        </li>`;
      }).join('');
      return `${head}
        <div class="combat-sheet__body">
          ${r ? `<div class="combat-roll">
            <span class="combat-roll__dice">${r.d6s.map((v) => `<i>${v}</i>`).join('')}<i class="is-destiny" title="Destino">${r.destiny}</i>${r.bonus ? `<em>${r.bonus > 0 ? '+' : '−'}${Math.abs(r.bonus)}</em>` : ''}</span>
            <span class="combat-roll__total">${r.total}</span>
            <small>${escapeHtml(`${r.attr} ${r.dice}d6 + Destino`)} · ${escapeHtml(destinyReading(r.destiny).title)}</small>
          </div>` : ''}
          <ul class="combat-results">${lines}</ul>
          ${act.halved ? '<p class="combat-sheet__warn">Disparo com inimigo encostado: metade dos dados de dano.</p>' : ''}
          ${act.warn ? `<p class="combat-sheet__warn">${escapeHtml(act.warn)}</p>` : ''}
        </div>
        <footer class="combat-sheet__foot">
          ${act.needsDamage && act.results.some((x) => x.hit)
            ? `<button type="button" class="cbtn cbtn--primary cbtn--wide" data-act-damage>${COMBAT_ICONS.dice}Rolar ${c.dano.every((d) => d.tipo === 'cura') ? 'cura' : 'dano'}</button>`
            : `<button type="button" class="cbtn cbtn--primary cbtn--wide" data-act-apply>${act.results.some((x) => x.hit) ? `${COMBAT_ICONS.check}Aplicar` : 'Encerrar a ação'}</button>`}
        </footer>`;
    }
    if (act.step === 'done') {
      return `${head}
        <div class="combat-sheet__body">
          <ul class="combat-results">${(act.summary || []).map((l) => `<li class="${l.cls || ''}"><span class="combat-result__name">${escapeHtml(l.name)}</span><b>${escapeHtml(l.text)}</b></li>`).join('')}</ul>
        </div>
        <footer class="combat-sheet__foot"><button type="button" class="cbtn cbtn--primary cbtn--wide" data-act-cancel>Fechar</button></footer>`;
    }
    return '';
  }

  /* Rola o ataque contra cada alvo (um teste e um Destino para todos). */
  function performAttackRoll(cb, act) {
    const actor = cb.pieces.find((p) => p.id === act.actor);
    const c = act.opt.combat;
    const attr = optionAttr(act.opt);
    const dice = attrDiceOf(actor, attr);
    const d6s = Array.from({ length: dice }, () => randomInt(6));
    const destiny = randomInt(12);
    const bonus = modSum(actor, 'Resultado Final');
    const total = d6s.reduce((s, v) => s + v, 0) + destiny + bonus;
    act.roll = { attr, dice, d6s, destiny, bonus, total };
    act.results = act.targets.map((id) => {
      const t = cb.pieces.find((p) => p.id === id);
      const cover = c.forma === 'alvo' && c.alcance > 1 && hasCover(cb, actor, t);
      const da = pieceDa(t) + (cover ? 2 : 0);
      return { target: id, da, cover, hit: total >= da, ...pickPart(t, destiny) };
    });
    act.needsDamage = c.dano.length > 0;
    act.step = 'result';
  }
  function pickPart(t, destiny) {
    const parts = t && t.hp ? Object.keys(t.hp) : [];
    if (parts.length <= 1) return { part: parts[0] || '', choosePart: false };
    if (destiny >= 10) return { part: parts[0], choosePart: true };
    const roll = randomInt(parts.length);
    return { part: parts[roll - 1], choosePart: false, partRoll: `d${parts.length} → ${roll}: ` };
  }

  /* Rola dano (ou cura) e grava tudo de uma vez. */
  async function applyCombatAction(mesa, cb, act, withDamage) {
    const actor = cb.pieces.find((p) => p.id === act.actor);
    const c = act.opt.combat;
    const updates = new Map();
    const touch = (p) => {
      if (!updates.has(p.id)) updates.set(p.id, { piece: p.id, hp: JSON.parse(JSON.stringify(p.hp || {})), mp: p.mp ? { ...p.mp } : null, mods: [...(p.mods || [])], effects: [...(p.effects || [])], down: !!p.down });
      return updates.get(p.id);
    };
    const summary = [];
    const chatLines = [];
    let damageRolls = null;
    if (withDamage && c.dano.length) {
      damageRolls = c.dano.map((d) => {
        const dados = act.halved && d.tipo !== 'cura' ? halveDice(d.dados) : d.dados;
        return { ...d, dados, roll: rollDiceExpr(dados, d.bonus) };
      });
    }
    act.results.forEach((res) => {
      if (!res.hit) {
        const t = cb.pieces.find((p) => p.id === res.target);
        summary.push({ name: t ? t.name : '?', text: 'Errou', cls: 'is-miss' });
        chatLines.push({ target: t ? t.name : '?', hit: false, da: res.da });
        return;
      }
      const t = cb.pieces.find((p) => p.id === res.target);
      if (!t) return;
      const u = touch(t);
      const texts = [];
      let dealt = 0, healed = 0;
      (damageRolls || []).forEach((d) => {
        const part = res.part && u.hp[res.part] ? res.part : Object.keys(u.hp).sort((a, b) => (u.hp[b].cur || 0) - (u.hp[a].cur || 0))[0];
        if (!part) return;
        if (d.tipo === 'cura') {
          // A cura vai para a parte mais ferida.
          const hurt = Object.keys(u.hp).sort((a, b) => (u.hp[b].max - u.hp[b].cur) - (u.hp[a].max - u.hp[a].cur))[0];
          const slot = u.hp[hurt];
          const before = slot.cur;
          slot.cur = Math.min(slot.max, slot.cur + d.roll.total);
          healed += slot.cur - before;
        } else {
          const level = d.tipo === 'magico' ? (Number(t.dm) || 0) : (Number(t.df) || 0);
          const pct = defPct(level);
          const final = Math.max(0, Math.round(d.roll.total * (1 - pct / 100)));
          u.hp[part].cur = Math.max(0, u.hp[part].cur - final);
          dealt += final;
          texts.push(`${final} ${COMBAT_DAMAGE_TYPES[d.tipo].toLowerCase()}${pct ? ` (−${pct}%)` : ''} em ${part}`);
        }
      });
      if (healed) texts.push(`+${healed} HP`);
      c.mods.forEach((m) => u.mods.push({ stat: m.stat, valor: m.valor, turnos: m.turnos, from: act.opt.name }));
      c.efeitos.forEach((e) => {
        u.effects = u.effects.filter((x) => x.nome !== e.nome);
        u.effects.push({ nome: e.nome, nivel: e.nivel, turnos: e.turnos, from: act.opt.name });
      });
      if (c.mods.length) texts.push(c.mods.map((m) => `${m.valor > 0 ? '+' : ''}${m.valor} ${m.stat}`).join(', '));
      if (c.efeitos.length) texts.push(c.efeitos.map((e) => `${e.nome}${e.nivel ? ` ${e.nivel}` : ''}`).join(', '));
      const tot = Object.values(u.hp).reduce((s, x) => s + (Number(x.cur) || 0), 0);
      if (tot <= 0 && !u.down) { u.down = true; texts.push('caiu'); }
      if (!texts.length) texts.push(c.uso === 'ataque' ? 'Acertou' : 'Atingido');
      summary.push({ name: t.name, text: texts.join(' · '), cls: 'is-hit' });
      chatLines.push({ target: t.name, hit: true, da: res.da, part: res.part, dealt, healed, text: texts.join(' · ') });
    });
    // Custo da magia ou habilidade.
    if (act.opt.cost && act.opt.cost.valor) {
      const u = touch(actor);
      if (act.opt.cost.unidade === 'MP' && u.mp) u.mp.cur = Math.max(0, u.mp.cur - act.opt.cost.valor);
      if (act.opt.cost.unidade === 'HP') {
        const part = Object.keys(u.hp).sort((a, b) => (u.hp[b].cur || 0) - (u.hp[a].cur || 0))[0];
        if (part) u.hp[part].cur = Math.max(0, u.hp[part].cur - act.opt.cost.valor);
      }
    }
    const mode = act.mode;
    const ok = await combatRpc(mesa.id, 'combate_acao', { p_id: cb.id, p_actor: actor.id, p_mode: mode, p_updates: [...updates.values()] });
    if (!ok) return;
    act.step = 'done';
    act.summary = summary;
    combatChat(mesa, actor, {
      action: act.opt.name, mode, uso: c.uso,
      roll: act.roll || null,
      damage: damageRolls ? damageRolls.map((d) => ({ dados: d.dados, rolls: d.roll.rolls, total: d.roll.total, tipo: d.tipo })) : null,
      lines: chatLines, halved: !!act.halved,
      cost: act.opt.cost && act.opt.cost.valor ? act.opt.cost : null
    });
    renderCombatAll(mesa.id);
  }

  /* Mensagem de combate no chat. */
  function chatCombatHTML(mesaId, msg) {
    const s = messageSpeaker(msg);
    const d = msg.data || {};
    const color = safeChatColor(s.color, s.id || s.name);
    if (!d.action) {
      return `<li class="chat-msg chat-msg--combat-note" data-mesa-msg="${escapeHtml(msg.id)}"><p class="chat-line">${COMBAT_ICONS.sword}<span>${chatInline(msg.body || '')}</span></p>${chatToolsHTML(mesaId, msg)}</li>`;
    }
    const r = d.roll;
    return `
      <li class="chat-msg chat-msg--combat" data-mesa-msg="${escapeHtml(msg.id)}" style="--who:${color}">
        <p class="chat-combat__head"><span class="chat-who">${escapeHtml(s.name)}</span> <span>${d.mode === 'oportunidade' ? 'ataque de oportunidade com' : 'usou'}</span> <b>${escapeHtml(d.action)}</b>${d.cost ? ` <em>${escapeHtml(`${d.cost.valor} ${d.cost.unidade}`)}</em>` : ''}</p>
        ${r ? `<p class="chat-combat__roll"><span>${escapeHtml(r.attr)} ${r.d6s.join(' + ')} + <b title="Destino">${r.destiny}</b>${r.bonus ? ` ${r.bonus > 0 ? '+' : '−'} ${Math.abs(r.bonus)}` : ''}</span><strong>${r.total}</strong></p>` : ''}
        ${Array.isArray(d.damage) && d.damage.length ? `<p class="chat-combat__roll chat-combat__roll--dmg">${d.damage.map((x) => `<span>${escapeHtml(x.dados)}: ${x.rolls.join(' + ') || '0'}</span><strong>${x.total}</strong>`).join('')}${d.halved ? '<em>metade dos dados</em>' : ''}</p>` : ''}
        <ul class="chat-combat__lines">${(d.lines || []).map((l) => `<li class="${l.hit ? 'is-hit' : 'is-miss'}"><span>${escapeHtml(l.target)}</span>${d.uso === 'ataque' ? `<small>DA ${l.da}</small>` : ''}<b>${escapeHtml(l.hit ? l.text : 'errou')}</b></li>`).join('')}</ul>
        <span class="chat-time">${escapeHtml(chatTime(msg))}</span>
        ${chatToolsHTML(mesaId, msg)}
      </li>`;
  }

  /* Mostra ou esconde o grid no lugar do chat. */
  function renderCombatStage(mesaId) {
    const root = document.querySelector(`[data-chat="${CSS.escape(mesaId)}"]`);
    if (!root) return;
    const mesa = mesaById(mesaId);
    const cb = combatOf(mesaId);
    const stage = root.querySelector('[data-combat-stage]');
    const toggle = root.querySelector('[data-combat-view]');
    const show = !!cb && combatUi.view === 'grid';
    root.classList.toggle('is-grid', show);
    if (toggle) {
      toggle.hidden = !cb;
      toggle.innerHTML = cb ? `
        <div class="combat-seg" role="tablist" aria-label="Vista">
          <button type="button" role="tab" aria-selected="${show}" data-combat-view-set="grid" class="${show ? 'is-on' : ''}">${COMBAT_ICONS.map}<span>Grid</span></button>
          <button type="button" role="tab" aria-selected="${!show}" data-combat-view-set="chat" class="${show ? '' : 'is-on'}">${TOOL_ICON('<path d="M4 5h16v11H8l-4 4z"/>')}<span>Chat</span></button>
        </div>` : '';
    }
    if (!stage) return;
    stage.hidden = !show;
    if (!show) { stage.innerHTML = ''; return; }
    stage.classList.toggle('is-painting', isCombatMaster(mesa) && !!combatUi.brush);
    // No celular, quando a luta começa, o painel de ferramentas recolhe uma vez para o mapa respirar.
    if (isCompactChat() && cb.status === 'ativo' && combatUi.collapsedFor !== cb.id) {
      combatUi.collapsedFor = cb.id;
      const side = root.querySelector('[data-chat-side]');
      if (side && !side.classList.contains('is-collapsed')) {
        storageSet(toolStoreKey, { ...activeChatTool(mesa), open: false });
        side.classList.add('is-collapsed');
        const panel = root.querySelector('[data-chat-tool-panel]');
        if (panel) panel.innerHTML = '';
        side.querySelectorAll('[data-chat-tool]').forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        fitChatHeight();
      }
    }
    if (!stage.querySelector('[data-combat-canvas]')) stage.innerHTML = combatStageHTML(mesa);
    else {
      const hud = stage.querySelector('[data-combat-hud]');
      if (hud) hud.innerHTML = combatHudHTML(mesa, cb);
      const hint = stage.querySelector('[data-combat-hint]');
      if (hint) hint.textContent = combatHintText(mesa, cb);
    }
    const sheet = stage.querySelector('[data-combat-sheet]');
    if (sheet) {
      const html = combatSheetHTML(mesa, cb);
      sheet.hidden = !html;
      if (sheet.dataset.sig !== html) { sheet.innerHTML = html; sheet.dataset.sig = html; }
    }
    drawCombat(mesaId);
  }
  function renderCombatAll(mesaId) {
    const cb = combatOf(mesaId);
    if (combatUi.selected && (!cb || !cb.pieces.some((p) => p.id === combatUi.selected))) { combatUi.selected = ''; combatUi.reach = null; }
    if (combatUi.act && (!cb || !cb.pieces.some((p) => p.id === combatUi.act.actor))) combatUi.act = null;
    renderCombatStage(mesaId);
    chatState.renderTool?.('combate');
  }

  /* ── Painel "Combate" ── */
  function combatOrderHTML(mesa, cb) {
    const master = isCombatMaster(mesa);
    const vis = master ? null : visibleCellsFor(cb, mesa);
    const turnPiece = currentTurnPiece(cb);
    const inRounds = cb.status === 'ativo' && cb.turn.phase !== 'iniciativa' && (cb.turn.order || []).length;
    const list = inRounds
      ? (cb.turn.order || []).map((id) => cb.pieces.find((p) => p.id === id)).filter(Boolean)
      : cb.pieces.slice().sort((a, b) => initTotal(b) - initTotal(a));
    const rows = list.filter((p) => pieceSeenBy(mesa, cb, p, vis)).map((p) => {
      const hp = (master || p.hpVisible || p.owner === auth.user?.id) ? hpTotals(p) : null;
      const pct = hp && hp.max ? Math.round((hp.cur / hp.max) * 100) : null;
      const effects = (p.effects || []).map((e) => `${e.nome}${e.nivel ? ` ${e.nivel}` : ''}${e.turnos ? ` · ${e.turnos}t` : ''}`)
        .concat((p.mods || []).map((m) => `${m.valor > 0 ? '+' : ''}${m.valor} ${m.stat}${m.turnos ? ` · ${m.turnos}t` : ''}`));
      return `
        <li class="${turnPiece && turnPiece.id === p.id ? 'is-turn' : ''} ${p.down ? 'is-down' : ''}" style="--who:${escapeHtml(p.color || '#8b5cf6')}">
          <button type="button" class="combat-order__row" ${master ? `data-combat-select="${escapeHtml(p.id)}"` : 'tabindex="-1"'}>
            ${chatAvatarHTML({ name: p.name, image: p.image })}
            <span class="combat-order__name"><span class="chat-who">${escapeHtml(p.name)}</span>
              <small>${[!placed(p) ? 'fora do mapa' : '', p.initRoll ? `inic. ${initTotal(p)}` : 'sem iniciativa', master && p.da ? `DA ${pieceDa(p)}` : '', p.hidden ? 'oculto' : '', p.down ? 'caído' : ''].filter(Boolean).join(' · ')}</small>
              ${effects.length ? `<span class="combat-order__fx">${effects.map((e) => `<i>${escapeHtml(e)}</i>`).join('')}</span>` : ''}
            </span>
            ${pct != null ? `<span class="combat-order__hp" title="${hp.cur}/${hp.max}"><i style="width:${pct}%"></i></span>` : ''}
          </button>
        </li>`;
    }).join('');
    return `<ol class="combat-order">${rows || '<li class="tool-empty">Sem peças.</li>'}</ol>`;
  }

  function toolCombateHTML(mesa) {
    const cb = combatOf(mesa.id);
    const master = isCombatMaster(mesa);
    if (!cb) {
      return master
        ? `<div class="combat-intro">
             <p>O grid começa vazio. Você pinta a área jogável (ou gera uma masmorra), põe as peças e só depois os jogadores veem.</p>
             <button type="button" class="cbtn cbtn--primary cbtn--wide" data-combat-new>${COMBAT_ICONS.sword}Preparar combate</button>
           </div>`
        : '<p class="tool-empty">Nenhum combate agora. O grid aparece aqui quando o Mestre começar a luta.</p>';
    }
    if (!master) {
      const t = currentTurnPiece(cb);
      return `
        ${t && canControl(mesa, t) ? `<p class="combat-myturn">Sua vez. Use os botões em cima do mapa.</p>` : ''}
        ${combatOrderHTML(mesa, cb)}`;
    }
    const sources = combatPieceSources(mesa);
    const groups = [...new Set(sources.map((s) => s.group))];
    const images = MESA_IMAGES[mesa.id] || [];
    const sel = cb.pieces.find((p) => p.id === combatUi.selected);
    const bg = cb.map.bg;
    const prep = cb.status === 'preparando';
    return `
      <div class="combat-panel">
        <div class="combat-panel__main">
          ${prep ? `<button type="button" class="cbtn cbtn--primary" data-combat-call>${COMBAT_ICONS.dice}Chamar iniciativa</button>`
            : (cb.turn.phase === 'iniciativa' ? `<button type="button" class="cbtn cbtn--primary" data-combat-rounds>${COMBAT_ICONS.flag}Começar a rodada 1</button>`
              : `<button type="button" class="cbtn" data-combat-endturn>${COMBAT_ICONS.flag}Passar a vez</button>`)}
          <button type="button" class="cbtn cbtn--danger" data-combat-close>${prep ? 'Descartar' : 'Encerrar'}</button>
        </div>

        <details class="combat-sec" ${prep ? 'open' : ''}>
          <summary>Mapa</summary>
          <div class="combat-sec__body">
            <p class="combat-sec__label">Pincel</p>
            <div class="combat-brushes" role="group" aria-label="Pincel">
              ${COMBAT_BRUSHES.map((b) => `<button type="button" class="cbtn cbtn--toggle ${combatUi.brush === b.id ? 'is-on' : ''}" aria-pressed="${combatUi.brush === b.id}" data-combat-brush="${b.id}" title="${escapeHtml(b.hint)}">${escapeHtml(b.label)}</button>`).join('')}
            </div>
            <div class="combat-btnrow">
              <button type="button" class="cbtn cbtn--sm" data-combat-fill="chao">Tudo chão</button>
              <button type="button" class="cbtn cbtn--sm" data-combat-fill="revelar">Revelar tudo</button>
              <button type="button" class="cbtn cbtn--sm" data-combat-fill="esconder">Esconder tudo</button>
            </div>
            <div class="combat-size">
              <label>Largura <input type="number" inputmode="numeric" min="4" max="${COMBAT_MAX_SIDE}" value="${cb.map.w}" data-combat-w></label>
              <label>Altura <input type="number" inputmode="numeric" min="4" max="${COMBAT_MAX_SIDE}" value="${cb.map.h}" data-combat-h></label>
              <button type="button" class="cbtn" data-combat-resize>Aplicar</button>
            </div>
          </div>
        </details>

        <details class="combat-sec">
          <summary>Gerar masmorra</summary>
          <div class="combat-sec__body">
            <div class="combat-size">
              <label>Tamanho <select data-dungeon-size>${Object.keys(DUNGEON_SIZES).map((k) => `<option value="${k}" ${k === 'media' ? 'selected' : ''}>${k === 'pequena' ? 'Pequena' : (k === 'media' ? 'Média' : 'Grande')}</option>`).join('')}</select></label>
              <label>Semente <input type="text" maxlength="24" value="${escapeHtml(cb.map.seed || '')}" placeholder="aleatória" data-dungeon-seed></label>
            </div>
            <label class="combat-check"><input type="checkbox" data-dungeon-rubble checked> Escombros (terreno difícil)</label>
            <button type="button" class="cbtn cbtn--primary cbtn--wide" data-dungeon-go>Gerar</button>
            <small class="combat-note">Troca o mapa inteiro e tira as peças do lugar. A mesma semente gera a mesma masmorra.</small>
          </div>
        </details>

        <details class="combat-sec">
          <summary>Imagem de fundo</summary>
          <div class="combat-sec__body">
            <label class="combat-label">Imagem do Acervo
              <select data-combat-bg>
                <option value="">Sem imagem</option>
                ${images.map((img) => `<option value="${escapeHtml(img.id)}" ${bg && bg.url === img.url ? 'selected' : ''}>${escapeHtml(img.title || 'Imagem')}</option>`).join('')}
              </select>
            </label>
            ${bg ? `
              <div class="combat-size combat-size--4">
                <label>X (q) <input type="number" step="0.5" value="${Number(bg.x) || 0}" data-bg="x"></label>
                <label>Y (q) <input type="number" step="0.5" value="${Number(bg.y) || 0}" data-bg="y"></label>
                <label>Escala % <input type="number" min="10" max="400" step="5" value="${Number(bg.scale) || 100}" data-bg="scale"></label>
                <label>Opac. % <input type="number" min="10" max="100" step="5" value="${Number(bg.opacity) || 100}" data-bg="opacity"></label>
              </div>
              <button type="button" class="cbtn cbtn--sm" data-bg-reset>Encaixar no grid</button>` : '<small class="combat-note">Suba imagens na ferramenta Acervo para usar aqui.</small>'}
          </div>
        </details>

        <details class="combat-sec">
          <summary>Névoa de guerra</summary>
          <div class="combat-sec__body">
            <label class="combat-label">Modo
              <select data-combat-fog>${Object.entries(COMBAT_FOG_MODES).map(([k, v]) => `<option value="${k}" ${cb.map.fog === k ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}</select>
            </label>
            <label class="combat-label">Visão das peças (q)
              <input type="number" inputmode="numeric" min="1" max="60" value="${cb.map.vision}" data-combat-vision>
            </label>
            <small class="combat-note">Você vê tudo. O escurecido é o que nenhum jogador enxerga.</small>
          </div>
        </details>

        <details class="combat-sec" open>
          <summary>Peças</summary>
          <div class="combat-sec__body">
            <div class="combat-add">
              <select data-combat-source aria-label="Peça para adicionar">
                ${groups.map((g) => `<optgroup label="${escapeHtml(g)}">${sources.filter((s) => s.group === g).map((s) => `<option value="${escapeHtml(s.key)}">${escapeHtml(s.name)}</option>`).join('')}</optgroup>`).join('')}
              </select>
              <button type="button" class="cbtn cbtn--primary" data-combat-add>${COMBAT_ICONS.plus}Pôr</button>
            </div>
            ${sel ? combatPieceEditorHTML(sel) : '<small class="combat-note">Toque numa peça na lista ou no mapa para editar.</small>'}
          </div>
        </details>
        ${combatOrderHTML(mesa, cb)}
      </div>`;
  }
  function combatPieceEditorHTML(p) {
    const hp = p.hp || {};
    return `
      <div class="combat-piece" data-combat-piece="${escapeHtml(p.id)}">
        <div class="combat-piece__head"><strong>${escapeHtml(p.name)}</strong><button type="button" class="cbtn cbtn--icon cbtn--ghost" data-combat-deselect aria-label="Fechar">${COMBAT_ICONS.x}</button></div>
        <div class="combat-piece__grid">
          <label>Tamanho <select data-cp="size">${COMBAT_SIZES.map((s) => `<option value="${s}" ${pieceSize(p) === s ? 'selected' : ''}>${s}×${s}</option>`).join('')}</select></label>
          <label>Movimento <input type="number" inputmode="numeric" min="0" max="60" value="${Number(p.move) || 1}" data-cp="move"></label>
          <label>Iniciativa <input type="number" inputmode="numeric" min="1" max="100" value="${p.initRoll || ''}" placeholder="1d100" data-cp="initRoll"></label>
          <label>Bônus inic. <input type="number" inputmode="numeric" min="-50" max="100" value="${Number(p.initBonus) || 0}" data-cp="initBonus"></label>
          <label>DA <input type="number" inputmode="numeric" min="0" max="200" value="${p.da || ''}" placeholder="rola ao começar" data-cp="da"></label>
          <label>DF / DM <span class="combat-pair"><input type="number" min="0" max="6" value="${Number(p.df) || 0}" data-cp="df" aria-label="DF"><input type="number" min="0" max="6" value="${Number(p.dm) || 0}" data-cp="dm" aria-label="DM"></span></label>
        </div>
        <p class="combat-sec__label">HP por parte</p>
        <div class="combat-hp">
          ${Object.entries(hp).map(([part, slot]) => `<label><span>${escapeHtml(part)}</span><input type="number" inputmode="numeric" min="0" max="${slot.max}" value="${slot.cur}" data-cp-hp="${escapeHtml(part)}"><small>/${slot.max}</small></label>`).join('')}
          ${p.mp ? `<label><span>MP</span><input type="number" inputmode="numeric" min="0" max="${p.mp.max}" value="${p.mp.cur}" data-cp-mp><small>/${p.mp.max}</small></label>` : ''}
        </div>
        ${(p.effects || []).length || (p.mods || []).length ? `
          <p class="combat-sec__label">Efeitos ativos</p>
          <div class="combat-chips combat-chips--x">
            ${(p.effects || []).map((e, i) => `<span>${escapeHtml(`${e.nome}${e.nivel ? ` ${e.nivel}` : ''}${e.turnos ? ` · ${e.turnos}t` : ''}`)}<button type="button" data-cp-rmfx="${i}" aria-label="Tirar">×</button></span>`).join('')}
            ${(p.mods || []).map((m, i) => `<span>${escapeHtml(`${m.valor > 0 ? '+' : ''}${m.valor} ${m.stat}${m.turnos ? ` · ${m.turnos}t` : ''}`)}<button type="button" data-cp-rmmod="${i}" aria-label="Tirar">×</button></span>`).join('')}
          </div>` : ''}
        <div class="combat-toggles">
          <label class="combat-check"><input type="checkbox" data-cp="hidden" ${p.hidden ? 'checked' : ''}> Oculta dos jogadores</label>
          <label class="combat-check"><input type="checkbox" data-cp="hpVisible" ${p.hpVisible ? 'checked' : ''}> Jogadores veem o HP</label>
          <label class="combat-check"><input type="checkbox" data-cp="down" ${p.down ? 'checked' : ''}> Caída</label>
        </div>
        <div class="combat-btnrow">
          <button type="button" class="cbtn cbtn--sm" data-combat-place>${placed(p) ? 'Mudar de lugar' : 'Pôr no mapa'}</button>
          ${placed(p) ? '<button type="button" class="cbtn cbtn--sm" data-combat-unplace>Tirar do mapa</button>' : ''}
          <button type="button" class="cbtn cbtn--sm cbtn--danger" data-combat-remove>Remover</button>
        </div>
      </div>`;
  }

  /* ── Gerador de masmorras (salas e corredores com semente) ── */
  function seededRandom(seedText) {
    let h = 1779033703 ^ String(seedText).length;
    for (let i = 0; i < String(seedText).length; i++) { h = Math.imul(h ^ String(seedText).charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generateDungeon(sizeKey, seed, rubble) {
    const cfg = DUNGEON_SIZES[sizeKey] || DUNGEON_SIZES.media;
    const rnd = seededRandom(seed);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const { w, h } = cfg;
    const grid = Array.from({ length: h }, () => Array(w).fill(' '));
    const rooms = [];
    for (let tries = 0; tries < cfg.rooms * 30 && rooms.length < cfg.rooms; tries++) {
      const rw = ri(4, Math.max(5, Math.floor(w / 5))), rh = ri(3, Math.max(4, Math.floor(h / 4)));
      const x = ri(1, w - rw - 2), y = ri(1, h - rh - 2);
      if (rooms.some((r) => x < r.x + r.w + 2 && x + rw + 2 > r.x && y < r.y + r.h + 2 && y + rh + 2 > r.y)) continue;
      rooms.push({ x, y, w: rw, h: rh, cx: x + Math.floor(rw / 2), cy: y + Math.floor(rh / 2) });
    }
    rooms.forEach((r) => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) grid[y][x] = '0'; });
    // Liga cada sala à mais próxima já ligada (árvore), com corredores em L.
    const linked = [rooms[0]];
    const dig = (x, y) => { if (x > 0 && y > 0 && x < w - 1 && y < h - 1) grid[y][x] = '0'; };
    rooms.slice(1).forEach((r) => {
      const near = linked.reduce((b, o) => (Math.abs(o.cx - r.cx) + Math.abs(o.cy - r.cy) < Math.abs(b.cx - r.cx) + Math.abs(b.cy - r.cy) ? o : b), linked[0]);
      const horizFirst = rnd() < 0.5;
      let x = r.cx, y = r.cy;
      const tx = near.cx, ty = near.cy;
      const stepX = () => { while (x !== tx) { dig(x, y); x += Math.sign(tx - x); } };
      const stepY = () => { while (y !== ty) { dig(x, y); y += Math.sign(ty - y); } };
      if (horizFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
      dig(x, y);
      linked.push(r);
    });
    // Um laço extra deixa a masmorra menos linear.
    if (rooms.length > 3) {
      const a = rooms[ri(0, rooms.length - 1)], b = rooms[ri(0, rooms.length - 1)];
      let x = a.cx, y = a.cy;
      while (x !== b.cx) { dig(x, y); x += Math.sign(b.cx - x); }
      while (y !== b.cy) { dig(x, y); y += Math.sign(b.cy - y); }
    }
    if (rubble) {
      rooms.forEach((r) => {
        if (rnd() < 0.5) return;
        const n = ri(2, Math.max(2, Math.floor((r.w * r.h) / 6)));
        for (let i = 0; i < n; i++) { const x = ri(r.x, r.x + r.w - 1), y = ri(r.y, r.y + r.h - 1); if (grid[y][x] === '0') grid[y][x] = '2'; }
      });
    }
    // Paredes em volta de tudo que é chão.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (grid[y][x] !== ' ') continue;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const v = grid[y + dy] && grid[y + dy][x + dx];
        if (v === '0' || v === '2') grid[y][x] = '1';
      }
    }
    return { w, h, cells: grid.map((row) => row.join('')).join(''), start: rooms[0] ? { x: rooms[0].cx, y: rooms[0].cy } : null };
  }

  /* ── Eventos do grid e do painel ── */
  function attachCombat(root, mesa) {
    const mesaId = mesa.id;
    const master = isCombatMaster(mesa);
    if (master && !MESA_IMAGES[mesaId]) loadMesaImages(mesaId).then(() => chatState.renderTool?.('combate'));
    loadMesaCombat(mesaId).then(() => renderCombatAll(mesaId));

    const cellFromPoint = (clientX, clientY) => {
      const canvas = root.querySelector('[data-combat-canvas]');
      const cb = combatOf(mesaId);
      if (!canvas || !cb) return null;
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / combatUi.zoom);
      const y = Math.floor((clientY - rect.top) / combatUi.zoom);
      return (x >= 0 && y >= 0 && x < cb.map.w && y < cb.map.h) ? { x, y } : null;
    };
    const paint = (cell) => {
      const cb = combatOf(mesaId);
      if (!cb || !cell) return false;
      const i = cellIdx(cb.map, cell.x, cell.y);
      const map = cb.map;
      const setCh = (key, ch) => { if (map[key][i] === ch) return false; map[key] = map[key].slice(0, i) + ch + map[key].slice(i + 1); return true; };
      switch (combatUi.brush) {
        case 'chao': return setCh('cells', '0');
        case 'parede': return setCh('cells', '1');
        case 'dificil': return setCh('cells', '2');
        case 'apagar': return setCh('cells', ' ');
        case 'revelar': return setCh('revealed', '1');
        case 'esconder': return setCh('revealed', '0');
        default: return false;
      }
    };
    const selectPiece = (p) => {
      const cb = combatOf(mesaId);
      combatUi.selected = p ? p.id : '';
      combatUi.reach = null;
      if (p && cb && placed(p) && cb.status === 'ativo') {
        const turn = currentTurnPiece(cb);
        if (turn && turn.id === p.id && canControl(mesa, p)) combatUi.reach = reachableCells(cb, p, cb.turn.moveLeft || 0);
      }
      renderCombatAll(mesaId);
    };
    const tryMove = async (cell) => {
      const cb = combatOf(mesaId);
      const p = cb && cb.pieces.find((x) => x.id === combatUi.selected);
      if (!p || !cell) return false;
      const turn = currentTurnPiece(cb);
      const isTurn = turn && turn.id === p.id;
      const cost = combatUi.reach ? combatUi.reach.get(`${cell.x},${cell.y}`) : undefined;
      if (isTurn && cost != null) {
        combatUi.reach = null;
        const ok = await combatRpc(mesaId, 'combate_mover', { p_id: cb.id, p_piece: p.id, p_x: cell.x, p_y: cell.y, p_cost: cost });
        const fresh = combatOf(mesaId);
        const np = fresh && fresh.pieces.find((x) => x.id === p.id);
        if (ok && np && fresh.turn.moveLeft > 0) { combatUi.reach = reachableCells(fresh, np, fresh.turn.moveLeft); renderCombatAll(mesaId); }
        else { combatUi.selected = ''; renderCombatAll(mesaId); }
        return true;
      }
      if (master) {
        if (!pieceFits(cb, p, cell.x, cell.y)) { toast('A peça não cabe aí.'); return true; }
        if (isTurn && cb.status === 'ativo' && !confirm('Esse quadrado está além do movimento do turno. Mover mesmo assim, sem gastar movimento?')) return true;
        combatUi.reach = null;
        combatSetPieces(mesaId, (list) => { const t = list.find((x) => x.id === p.id); if (t) { t.x = cell.x; t.y = cell.y; } });
        return true;
      }
      return false;
    };
    /* Toque no mapa durante a mira de uma ação. */
    const aimAt = (cell) => {
      const cb = combatOf(mesaId);
      const act = combatUi.act;
      const actor = cb && cb.pieces.find((p) => p.id === act.actor);
      if (!actor) return;
      const c = act.opt.combat;
      act.warn = '';
      if (c.forma === 'alvo') {
        const vis = visibleCellsFor(cb, mesa);
        const t = pieceAtCell(cb, cell.x, cell.y, (p) => pieceSeenBy(mesa, cb, p, vis));
        if (!t) return;
        if (!targetAllowed(actor, t, c)) { act.warn = `${t.name} não é um alvo válido para isto.`; renderCombatStage(mesaId); return; }
        const dist = t.id === actor.id ? 0 : pieceGap(actor, t) + 1;
        // O ataque de oportunidade acontece no momento em que o alvo sai de perto.
        const oaNow = act.mode === 'oportunidade' && act.fixedTarget === t.id;
        if (!oaNow && dist > Math.max(1, c.alcance)) { act.warn = `${t.name} está a ${dist}q; o alcance é ${c.alcance}q.`; renderCombatStage(mesaId); return; }
        const a = pieceCenter(actor), tc = pieceCenter(t);
        if (!oaNow && dist > 1 && !lineOfSight(cb.map, Math.round(a.x), Math.round(a.y), Math.round(tc.x), Math.round(tc.y))) { act.warn = 'Uma parede bloqueia a visão até o alvo.'; renderCombatStage(mesaId); return; }
        if (act.fixedTarget && act.fixedTarget !== t.id) return;
        act.targets = [t.id];
        act.preview = [];
        renderCombatStage(mesaId);
        return;
      }
      if (c.alcance > 0 && pieceDistToCell(actor, cell.x, cell.y) > c.alcance) { act.warn = `Fora do alcance de ${c.alcance}q.`; renderCombatStage(mesaId); return; }
      const cells = areaCells(cb, actor, c, cell.x, cell.y);
      act.preview = cells;
      const vis = visibleCellsFor(cb, mesa);
      act.targets = cb.pieces.filter((p) => placed(p) && pieceSeenBy(mesa, cb, p, vis) && targetAllowed(actor, p, c)
        && cells.some(([x, y]) => pieceCovers(p, x, y))).map((p) => p.id);
      renderCombatStage(mesaId);
    };

    /* Toque curto = ação; arrastar = rolar o mapa (no celular); dois dedos = zoom. */
    let tap = null;
    root.addEventListener('pointerdown', (e) => {
      const canvas = e.target.closest('[data-combat-canvas]');
      if (!canvas) return;
      combatUi.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (combatUi.pointers.size === 2) {
        const [a, b] = [...combatUi.pointers.values()];
        combatUi.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: combatUi.zoom };
        tap = null; combatUi.painting = false;
        return;
      }
      const cb = combatOf(mesaId);
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cb || !cell) return;
      if (master && combatUi.brush && !combatUi.placing) {
        combatUi.painting = true;
        canvas.setPointerCapture?.(e.pointerId);
        if (paint(cell)) { drawCombat(mesaId); combatSaveMapSoon(mesaId); }
        return;
      }
      tap = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    root.addEventListener('pointermove', (e) => {
      if (combatUi.pointers.has(e.pointerId)) combatUi.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (combatUi.pinch && combatUi.pointers.size === 2) {
        const [a, b] = [...combatUi.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const z = Math.max(12, Math.min(80, Math.round(combatUi.pinch.zoom * (d / combatUi.pinch.d))));
        if (z !== combatUi.zoom) { combatUi.zoom = z; drawCombat(mesaId); }
        return;
      }
      if (!e.target.closest('[data-combat-canvas]')) return;
      if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8) tap = null;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (master && (combatUi.brush || combatUi.placing)) {
        const prev = combatUi.hover;
        combatUi.hover = cell;
        if (combatUi.painting && cell && paint(cell)) { drawCombat(mesaId); combatSaveMapSoon(mesaId); return; }
        if (!prev || !cell || prev.x !== cell.x || prev.y !== cell.y) drawCombat(mesaId);
        return;
      }
      // Prévia da área ao passar o mouse durante a mira.
      const act = combatUi.act;
      if (act && act.step === 'target' && act.opt.combat.forma !== 'alvo' && cell && e.pointerType === 'mouse') {
        const cb = combatOf(mesaId);
        const actor = cb && cb.pieces.find((p) => p.id === act.actor);
        if (actor && (act.opt.combat.alcance === 0 || pieceDistToCell(actor, cell.x, cell.y) <= act.opt.combat.alcance)) {
          act.preview = areaCells(cb, actor, act.opt.combat, cell.x, cell.y);
          drawCombat(mesaId);
        }
      }
    });
    const endPointer = (e) => {
      combatUi.pointers.delete(e.pointerId);
      if (combatUi.pointers.size < 2) combatUi.pinch = null;
      combatUi.painting = false;
    };
    root.addEventListener('pointerup', (e) => {
      const wasTap = tap && tap.id === e.pointerId && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) <= 8;
      endPointer(e);
      if (!wasTap) { tap = null; return; }
      tap = null;
      handleTap(cellFromPoint(e.clientX, e.clientY));
    });
    root.addEventListener('pointercancel', (e) => { tap = null; endPointer(e); });
    root.addEventListener('pointerleave', (e) => { if (e.target.closest && e.target.closest('[data-combat-canvas]') && combatUi.hover) { combatUi.hover = null; drawCombat(mesaId); } });
    root.addEventListener('wheel', (e) => {
      if (!e.target.closest('[data-combat-canvas]') || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      combatUi.zoom = Math.max(12, Math.min(80, combatUi.zoom + (e.deltaY < 0 ? 3 : -3)));
      drawCombat(mesaId);
    }, { passive: false });

    const handleTap = (cell) => {
      const cb = combatOf(mesaId);
      if (!cb || !cell) return;
      if (combatUi.act && combatUi.act.step === 'target') { aimAt(cell); return; }
      if (combatUi.placing && master) {
        const p = cb.pieces.find((x) => x.id === combatUi.placing);
        combatUi.placing = '';
        combatUi.hover = null;
        if (p && pieceFits(cb, p, cell.x, cell.y)) combatSetPieces(mesaId, (list) => { const t = list.find((x) => x.id === p.id); if (t) { t.x = cell.x; t.y = cell.y; } });
        else { toast('A peça não cabe aí.'); renderCombatAll(mesaId); }
        return;
      }
      const vis = visibleCellsFor(cb, mesa);
      const piece = pieceAtCell(cb, cell.x, cell.y, (p) => pieceSeenBy(mesa, cb, p, vis));
      if (combatUi.selected && (!piece || piece.id === combatUi.selected)) {
        if (piece && piece.id === combatUi.selected) { selectPiece(null); return; }
        tryMove(cell);
        return;
      }
      if (piece && canControl(mesa, piece)) selectPiece(piece);
      else if (piece) toast(piece.name);
    };

    const startAction = (mode, fixedTarget) => {
      const cb = combatOf(mesaId);
      let actor;
      if (mode === 'oportunidade') actor = cb.pieces.find((p) => p.id === fixedTarget.by);
      else actor = currentTurnPiece(cb);
      if (!actor || !canControl(mesa, actor)) return;
      combatUi.selected = ''; combatUi.reach = null; combatUi.brush = '';
      const turnMode = mode === 'oportunidade' ? 'oportunidade' : ((cb.turn.actions ?? 1) > 0 ? 'acao' : 'extra');
      combatUi.act = { actor: actor.id, step: 'pick', mode: turnMode, targets: [], preview: [], fixedTarget: fixedTarget ? fixedTarget.target : '' };
      renderCombatAll(mesaId);
    };

    root.addEventListener('click', async (e) => {
      const t = e.target;
      const hit = (sel) => t.closest(sel);
      const cb = combatOf(mesaId);
      let el;
      if ((el = hit('[data-combat-view-set]'))) { combatUi.view = el.dataset.combatViewSet; renderCombatStage(mesaId); fitChatHeight(); return; }
      if ((el = hit('[data-combat-zoom]'))) {
        combatUi.zoom = Math.max(12, Math.min(80, combatUi.zoom + Number(el.dataset.combatZoom) * 6));
        drawCombat(mesaId); return;
      }
      if (hit('[data-combat-fit]')) { fitCombatZoom(mesaId, true); drawCombat(mesaId); return; }
      if (hit('[data-combat-new]')) { createCombat(mesa); return; }
      if (!cb) return;

      // Folha de ação.
      const act = combatUi.act;
      if (hit('[data-act-cancel]')) { combatUi.act = null; renderCombatAll(mesaId); return; }
      if (act && hit('[data-act-back]')) { act.step = 'pick'; act.targets = []; act.preview = []; act.warn = ''; renderCombatAll(mesaId); return; }
      if (act && (el = hit('[data-act-pick]'))) {
        const actor = cb.pieces.find((p) => p.id === act.actor);
        const opt = combatActionOptions(mesa, actor).find((o) => o.id === el.dataset.actPick);
        if (!opt) return;
        act.opt = opt;
        if (opt.combat.acao === 'livre' && act.mode !== 'oportunidade') act.mode = 'livre';
        act.step = 'target';
        act.targets = []; act.preview = []; act.warn = '';
        act.halved = !!(opt.weapon && opt.combat.alcance > 1 && engagedInMelee(cb, actor));
        if (opt.combat.alvos === 'proprio' && opt.combat.forma === 'alvo') act.targets = [actor.id];
        if (opt.combat.forma === 'cena') aimAt({ x: actor.x, y: actor.y });
        if (act.fixedTarget) {
          const target = cb.pieces.find((p) => p.id === act.fixedTarget);
          if (target) aimAt({ x: target.x, y: target.y });
        }
        if (opt.cost && opt.cost.valor) {
          const pool = opt.cost.unidade === 'MP' ? actor.mp : hpTotals(actor);
          if (pool && pool.cur < opt.cost.valor) act.warn = `Custa ${opt.cost.valor} ${opt.cost.unidade} e ${actor.name} tem ${pool.cur}.`;
        }
        renderCombatAll(mesaId); return;
      }
      if (act && hit('[data-act-confirm]')) {
        if (!act.targets.length) return;
        if (act.opt.combat.uso === 'ataque') performAttackRoll(cb, act);
        else {
          act.roll = null;
          act.results = act.targets.map((id) => ({ target: id, hit: true, da: 0, part: '' }));
          act.needsDamage = act.opt.combat.dano.length > 0;
          act.step = 'result';
          if (!act.needsDamage) { await applyCombatAction(mesa, cb, act, false); return; }
        }
        renderCombatAll(mesaId); return;
      }
      if (act && hit('[data-act-damage]')) { await applyCombatAction(mesa, cb, act, true); return; }
      if (act && hit('[data-act-apply]')) { await applyCombatAction(mesa, cb, act, false); return; }

      if (hit('[data-combat-act]')) { startAction('turno'); return; }
      if ((el = hit('[data-combat-oa]'))) { startAction('oportunidade', { by: el.dataset.combatOa, target: el.dataset.oaTarget }); return; }
      if ((el = hit('[data-combat-oa-skip]'))) { combatRpc(mesaId, 'combate_acao', { p_id: cb.id, p_actor: el.dataset.combatOaSkip, p_mode: 'recusar', p_updates: [] }); return; }
      if (hit('[data-combat-endturn]')) { combatUi.selected = ''; combatUi.reach = null; combatUi.act = null; combatRpc(mesaId, 'combate_fim_turno', { p_id: cb.id }); return; }
      if (hit('[data-combat-dash]')) {
        const ok = await combatRpc(mesaId, 'combate_correr', { p_id: cb.id });
        const fresh = combatOf(mesaId); const p = currentTurnPiece(fresh);
        if (ok && p) { combatUi.selected = p.id; combatUi.reach = reachableCells(fresh, p, fresh.turn.moveLeft); renderCombatAll(mesaId); }
        return;
      }
      if (hit('[data-combat-roll-init]')) {
        const mine = cb.pieces.filter((p) => p.owner === auth.user?.id && !p.initRoll && placed(p));
        for (const p of mine) {
          const roll = randomInt(100);
          const da = p.da || rollDaFor(p);
          const { error } = await sb.rpc('combate_iniciativa', { p_id: cb.id, p_piece: p.id, p_roll: roll, p_da: da });
          if (error) { toast(error.message); continue; }
          combatChat(mesa, p, { event: 'iniciativa' }, `${p.name} rolou iniciativa **${roll + (Number(p.initBonus) || 0)}** e DA **${da}**.`);
        }
        await loadMesaCombat(mesaId); renderCombatAll(mesaId); return;
      }
      if (!master) return;
      if (hit('[data-combat-call]')) { combatUi.brush = ''; callInitiative(mesa); return; }
      if (hit('[data-combat-rounds]')) { startRounds(mesa); return; }
      if (hit('[data-combat-close]')) {
        const prep = cb.status === 'preparando';
        if (!confirm(prep ? 'Descartar este combate? O mapa e as peças serão apagados.' : 'Encerrar o combate? O grid some para todos.')) return;
        combatUi.selected = ''; combatUi.reach = null; combatUi.brush = ''; combatUi.act = null;
        if (prep) {
          const { error } = await sb.from('mesa_combates').delete().eq('id', cb.id);
          if (error) { toast(error.message); return; }
        } else {
          if (confirm('Levar o HP e o MP de agora para as fichas e NPCs da mesa?')) await syncCombatToSheets(mesa, cb);
          await combatUpdate(mesaId, { status: 'encerrado' });
          combatChat(mesa, null, { event: 'fim' }, 'O combate terminou.');
        }
        MESA_COMBATS[mesaId] = null;
        renderCombatAll(mesaId);
        return;
      }
      if ((el = hit('[data-combat-brush]'))) {
        combatUi.brush = combatUi.brush === el.dataset.combatBrush ? '' : el.dataset.combatBrush;
        combatUi.selected = ''; combatUi.reach = null; combatUi.view = 'grid'; combatUi.placing = '';
        renderCombatAll(mesaId); return;
      }
      if ((el = hit('[data-combat-fill]'))) {
        const n = cb.map.w * cb.map.h;
        const map = { ...cb.map };
        if (el.dataset.combatFill === 'chao') map.cells = map.cells.split('').map((c) => (c === ' ' ? '0' : c)).join('');
        if (el.dataset.combatFill === 'revelar') map.revealed = '1'.repeat(n);
        if (el.dataset.combatFill === 'esconder') map.revealed = '0'.repeat(n);
        combatUpdate(mesaId, { map }); return;
      }
      if (hit('[data-combat-resize]')) {
        const panel = hit('.combat-sec__body');
        const w = Math.max(4, Math.min(COMBAT_MAX_SIDE, parseInt(panel.querySelector('[data-combat-w]').value, 10) || cb.map.w));
        const h = Math.max(4, Math.min(COMBAT_MAX_SIDE, parseInt(panel.querySelector('[data-combat-h]').value, 10) || cb.map.h));
        const resize = (str, fill) => {
          let out = '';
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out += (x < cb.map.w && y < cb.map.h) ? str[y * cb.map.w + x] : fill;
          return out;
        };
        const map = { ...cb.map, w, h, cells: resize(cb.map.cells, ' '), revealed: resize(cb.map.revealed, '0') };
        const pieces = cb.pieces.map((p) => (placed(p) && (p.x + pieceSize(p) > w || p.y + pieceSize(p) > h) ? { ...p, x: null, y: null } : p));
        combatUpdate(mesaId, { map, pieces }); return;
      }
      if (hit('[data-dungeon-go]')) {
        const panel = hit('.combat-sec__body');
        const hasMap = /[012]/.test(cb.map.cells);
        if (hasMap && !confirm('Gerar uma masmorra nova troca o mapa atual. Continuar?')) return;
        const seed = (panel.querySelector('[data-dungeon-seed]').value || '').trim() || Math.random().toString(36).slice(2, 8);
        const g = generateDungeon(panel.querySelector('[data-dungeon-size]').value, seed, panel.querySelector('[data-dungeon-rubble]').checked);
        const map = { ...cb.map, w: g.w, h: g.h, cells: g.cells, revealed: '0'.repeat(g.w * g.h), seed };
        combatUi.fitted = '';
        combatUpdate(mesaId, { map, pieces: cb.pieces.map((p) => ({ ...p, x: null, y: null })) });
        toast(`Masmorra gerada (semente ${seed}). Ponha as peças de novo.`);
        return;
      }
      if (hit('[data-bg-reset]')) { combatUpdate(mesaId, { map: { ...cb.map, bg: { ...cb.map.bg, x: 0, y: 0, scale: 100 } } }); return; }
      if (hit('[data-combat-add]')) {
        const key = root.querySelector('[data-combat-source]')?.value;
        const p = key && makeCombatPiece(mesa, key);
        if (!p) return;
        combatUi.selected = p.id;
        combatUi.placing = p.id;
        combatUi.brush = '';
        combatUi.view = 'grid';
        combatSetPieces(mesaId, (list) => list.push(p));
        return;
      }
      if ((el = hit('[data-combat-select]'))) {
        const p = cb.pieces.find((x) => x.id === el.dataset.combatSelect);
        combatUi.brush = '';
        selectPiece(combatUi.selected === (p && p.id) ? null : p); return;
      }
      if (hit('[data-combat-deselect]')) { selectPiece(null); return; }
      const editor = hit('[data-combat-piece]');
      if (editor) {
        const id = editor.dataset.combatPiece;
        if (hit('[data-combat-place]')) { combatUi.placing = id; combatUi.brush = ''; combatUi.view = 'grid'; renderCombatAll(mesaId); return; }
        if (hit('[data-combat-unplace]')) { combatSetPieces(mesaId, (list) => { const p = list.find((x) => x.id === id); if (p) { p.x = null; p.y = null; } }); return; }
        if ((el = hit('[data-cp-rmfx]'))) { combatSetPieces(mesaId, (list) => { const p = list.find((x) => x.id === id); if (p) p.effects = (p.effects || []).filter((_, i) => i !== Number(el.dataset.cpRmfx)); }); return; }
        if ((el = hit('[data-cp-rmmod]'))) { combatSetPieces(mesaId, (list) => { const p = list.find((x) => x.id === id); if (p) p.mods = (p.mods || []).filter((_, i) => i !== Number(el.dataset.cpRmmod)); }); return; }
        if (hit('[data-combat-remove]')) {
          combatUi.selected = ''; combatUi.reach = null;
          const turn = cb.turn || {};
          const order = (turn.order || []).filter((x) => x !== id);
          combatUpdate(mesaId, { pieces: cb.pieces.filter((p) => p.id !== id), turn: { ...turn, order, index: Math.min(turn.index || 0, Math.max(0, order.length - 1)) } });
        }
      }
    });

    root.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-act-part]') && combatUi.act && combatUi.act.results) {
        const res = combatUi.act.results.find((r) => r.target === t.dataset.actPart);
        if (res) res.part = t.value;
        return;
      }
      if (!master) return;
      const cb = combatOf(mesaId);
      if (!cb) return;
      if (t.matches('[data-combat-fog]')) { combatUpdate(mesaId, { map: { ...cb.map, fog: t.value } }); return; }
      if (t.matches('[data-combat-vision]')) { combatUpdate(mesaId, { map: { ...cb.map, vision: Math.max(1, Math.min(60, parseInt(t.value, 10) || 12)) } }); return; }
      if (t.matches('[data-combat-bg]')) {
        const img = (MESA_IMAGES[mesaId] || []).find((x) => x.id === t.value);
        combatUpdate(mesaId, { map: { ...cb.map, bg: img ? { url: img.url, path: img.path || '', title: img.title || '', x: 0, y: 0, scale: 100, opacity: 100 } : null } });
        return;
      }
      if (t.matches('[data-bg]') && cb.map.bg) {
        const v = parseFloat(t.value);
        combatUpdate(mesaId, { map: { ...cb.map, bg: { ...cb.map.bg, [t.dataset.bg]: Number.isFinite(v) ? v : 0 } } });
        return;
      }
      const editor = t.closest('[data-combat-piece]');
      if (!editor) return;
      const id = editor.dataset.combatPiece;
      if (t.matches('[data-cp-hp]') || t.matches('[data-cp-mp]')) {
        combatSetPieces(mesaId, (list) => {
          const p = list.find((x) => x.id === id);
          if (!p) return;
          const v = Math.max(0, parseInt(t.value, 10) || 0);
          if (t.matches('[data-cp-mp]') && p.mp) p.mp = { ...p.mp, cur: Math.min(p.mp.max, v) };
          else if (p.hp && p.hp[t.dataset.cpHp]) { p.hp = { ...p.hp, [t.dataset.cpHp]: { ...p.hp[t.dataset.cpHp], cur: Math.min(p.hp[t.dataset.cpHp].max, v) } }; }
          const tot = hpTotals(p);
          if (tot && tot.cur <= 0) p.down = true;
        });
        return;
      }
      const field = t.dataset.cp;
      if (!field) return;
      combatSetPieces(mesaId, (list) => {
        const p = list.find((x) => x.id === id);
        if (!p) return;
        if (t.type === 'checkbox') p[field] = t.checked;
        else if (field === 'initRoll') { const v = parseInt(t.value, 10); if (v >= 1 && v <= 100) p.initRoll = v; else delete p.initRoll; }
        else if (field === 'da') { const v = parseInt(t.value, 10); if (v > 0) p.da = v; else delete p.da; }
        else p[field] = parseInt(t.value, 10) || 0;
        if (field === 'size' && placed(p) && !pieceFits({ ...cb, pieces: list }, p, p.x, p.y)) { p.x = null; p.y = null; toast('A peça não coube. Ponha de novo no mapa.'); }
      });
    });

    if (!combatUi.resizeBound) {
      combatUi.resizeBound = true;
      window.addEventListener('resize', () => { const id = chatState.mesaId; if (id && combatOf(id)) { combatUi.fitted = ''; drawCombat(id); } });
    }
  }

  /* Fim do combate: HP e MP voltam para as fichas e NPCs da mesa. */
  async function syncCombatToSheets(mesa, cb) {
    let failed = 0;
    for (const p of cb.pieces) {
      try {
        if (p.kind === 'char') {
          const c = CHARACTERS.find((x) => x.id === p.ref);
          if (!c) continue;
          const v = ensureVitals(c);
          Object.entries(p.hp || {}).forEach(([part, slot]) => { if (v.hp[part]) v.hp[part].cur = Math.min(v.hp[part].max, slot.cur); });
          if (p.mp && v.mana) v.mana.cur = Math.min(v.mana.max, p.mp.cur);
          await persistCharacterState(c);
        } else if (p.kind === 'npc') {
          const n = (MESA_NPCS[mesa.id] || []).find((x) => x.id === p.ref);
          const tot = hpTotals(p);
          if (!n || !tot) continue;
          const combat = { ...npcCombat(n), cur: tot.cur };
          const { error } = await sb.from('mesa_npcs').update({ combat }).eq('id', n.id);
          if (error) throw error;
          n.combat = combat;
        }
      } catch (err) { failed++; console.error(err); }
    }
    if (failed) toast(`${failed} ficha(s) não foram atualizadas.`);
  }

  /* Tempo real: chamado pelo canal da mesa. */
  function onCombatChange(mesaId, payload) {
    if (payload.eventType === 'DELETE') {
      const cur = MESA_COMBATS[mesaId];
      if (cur && payload.old && payload.old.id === cur.id) MESA_COMBATS[mesaId] = null;
    } else if (payload.new) {
      const row = normalizeCombatRow(payload.new);
      MESA_COMBATS[mesaId] = row.status === 'encerrado' ? null : row;
    }
    const cb = combatOf(mesaId);
    if (cb && combatUi.selected) {
      const p = cb.pieces.find((x) => x.id === combatUi.selected);
      const turn = currentTurnPiece(cb);
      combatUi.reach = (p && turn && turn.id === p.id && placed(p)) ? reachableCells(cb, p, cb.turn.moveLeft || 0) : null;
    }
    renderCombatAll(mesaId);
  }

  function mesaChatPanel(mesa) {
    const observer = mesa.role === 'observador';
    const speaker = currentSpeaker(mesa);
    chatState.mesaId = mesa.id;
    chatState.speakerKey = speaker.key;
    const tool = activeChatTool(mesa);
    const master = mesa.role === 'mestre';
    return `
      <section class="chat ${observer ? 'chat--observer' : ''}" data-chat="${escapeHtml(mesa.id)}">
        <div class="chat__main">
          <div class="chat__presence" data-chat-presence><strong class="chat-presence__mesa">${escapeHtml(mesa.name)}</strong></div>
          <div class="combat-viewtoggle" data-combat-view hidden></div>
          <div class="combat-stage" data-combat-stage hidden></div>
          <ol class="chat__log" data-mesa-chat-log="${escapeHtml(mesa.id)}" aria-live="polite">${chatLogHTML(mesa.id)}</ol>
          <p class="chat__typing" data-chat-typing aria-live="polite"></p>
          ${observer ? '<p class="chat__observer">Observando como Platina. <a class="chat-link" href="#/Mesas">Voltar às mesas</a></p>' : `
          <form class="chat__composer" id="mesaChatForm" data-mesa-id="${escapeHtml(mesa.id)}">
            <ul class="chat__commands" data-chat-commands hidden>
              ${CHAT_COMMANDS.filter((c) => master || !c.master).map((c) => `<li><button type="button" data-chat-command="${c.cmd} "><code>${escapeHtml(c.example)}</code><span>${escapeHtml(c.hint)}</span></button></li>`).join('')}
            </ul>
            <div class="chat__attach" data-chat-attach hidden>
              <img alt="" data-attach-thumb>
              <input type="text" maxlength="120" data-attach-title aria-label="Título da imagem" placeholder="Título">
              <button type="button" class="chat-button chat-button--primary" data-attach-send>Enviar</button>
              <button type="button" class="chat-button" data-attach-cancel aria-label="Descartar imagem">×</button>
            </div>
            <div class="chat__fmt" role="toolbar" aria-label="Formatação">
              <button type="button" data-chat-wrap="action" title="Ação: **texto**"><b>Ação</b></button>
              <button type="button" data-chat-wrap="speech" title="Fala: -- texto --">— Fala —</button>
              <button type="button" data-chat-wrap="thought" title="Pensamento: ((texto))"><i>“Pensamento”</i></button>
              <button type="button" data-chat-wrap="spoiler" title="Spoiler: ||texto||">Spoiler</button>
              <button type="button" data-chat-wrap="turn" title="Passar a vez: >>">Passar a vez »</button>
            </div>
            <div class="chat__input">
              <div class="chat-speaker">
                <button type="button" class="chat-speaker__toggle" data-chat-speaker-toggle aria-haspopup="true" aria-expanded="false" title="Falando como">${chatSpeakerButtonHTML(speaker)}</button>
                <div class="chat-menu" data-chat-speaker-menu hidden>${chatSpeakerMenuHTML(mesa, speaker)}</div>
              </div>
              <textarea name="body" rows="1" maxlength="4000" placeholder="Mensagem" aria-label="Mensagem"></textarea>
              <label class="chat-icon-button" title="Imagem">${TOOL_ICON('<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>')}<input type="file" accept="image/*" data-chat-image hidden></label>
              <button type="submit" class="chat-icon-button chat-icon-button--send" aria-label="Enviar">${TOOL_ICON('<path d="M4 12l16-8-6 16-2-7z"/>')}</button>
            </div>
          </form>`}
        </div>
        ${observer ? '' : `
        <aside class="chat-side ${tool.open ? '' : 'is-collapsed'}" data-chat-side>
          <nav class="chat-rail" aria-label="Ferramentas">${chatRailHTML(mesa, tool)}</nav>
          <div class="chat-tool" data-chat-tool-panel>${tool.open ? chatToolHTML(mesa, tool.id) : ''}</div>
        </aside>`}
      </section>`;
  }

  /* ── Dados ───────────────────────────────────── */
  function randomInt(max) {
    const buffer = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do { crypto.getRandomValues(buffer); value = buffer[0]; } while (value >= limit);
    return (value % max) + 1;
  }

  function arcanoTest(attr, dice) {
    const d6s = Array.from({ length: dice }, () => randomInt(6));
    const destiny = randomInt(12);
    return {
      total: destiny + d6s.reduce((a, b) => a + b, 0),
      test: { attr, dice, d6s, destiny, reading: destinyReading(destiny) }
    };
  }

  /* ── Calculadora de rolagem ──────────────────────
     Números, dados (NdM), + − × ÷, % (porcentagem) e parênteses.
     "2d6 + 1d8 × 2 − 3", "(1d20 + 5) ÷ 2", "1d100 × 50%". */
  const ROLL_MAX_DICE = 100;
  function formatRollNumber(n) {
    return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
  function evaluateRoll(input) {
    const src = String(input || '')
      .toLowerCase()
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/(\d|\))\s*x\s*(?=[\d(])/g, '$1*')
      .replace(/,/g, '.')
      .trim();
    if (!src) return { error: 'vazio' };
    const tokens = [];
    const re = /\s*(\d*d\d+|\d+(?:\.\d+)?|[()+\-*/%])/y;
    let pos = 0;
    while (pos < src.length) {
      re.lastIndex = pos;
      const m = re.exec(src);
      if (!m) return { error: 'invalido' };
      tokens.push(m[1]);
      pos = re.lastIndex;
      while (pos < src.length && /\s/.test(src[pos])) pos++;
    }
    let i = 0;
    let diceCount = 0;
    const groups = [];
    const peek = () => tokens[i];
    const take = () => tokens[i++];
    const fail = (why) => { throw new Error(why); };

    function primary() {
      const t = take();
      if (t === undefined) fail('fim');
      if (t === '(') {
        const inner = expr();
        if (take() !== ')') fail('parenteses');
        return { v: inner.v, s: `(${inner.s})` };
      }
      if (/^\d*d\d+$/.test(t)) {
        const [n, sides] = t.split('d');
        const qty = Number(n || 1);
        const faces = Number(sides);
        if (qty < 1 || faces < 2 || faces > 1000) fail('dado');
        diceCount += qty;
        if (diceCount > ROLL_MAX_DICE) fail('muitos');
        const rolls = Array.from({ length: qty }, () => randomInt(faces));
        groups.push({ sides: faces, rolls });
        const sum = rolls.reduce((a, b) => a + b, 0);
        return { v: sum, s: rolls.length > 1 ? `(${rolls.join('+')})` : String(sum), dice: `${qty}d${faces}` };
      }
      if (/^\d/.test(t)) return { v: Number(t), s: formatRollNumber(Number(t)) };
      return fail('token');
    }
    function factor() {
      if (peek() === '-') { take(); const f = factor(); return { v: -f.v, s: `−${f.s}` }; }
      if (peek() === '+') { take(); return factor(); }
      let p = primary();
      while (peek() === '%') { take(); p = { v: p.v / 100, s: `${p.s}%` }; }
      return p;
    }
    function term() {
      let left = factor();
      while (peek() === '*' || peek() === '/') {
        const op = take();
        const right = factor();
        if (op === '/' && right.v === 0) fail('zero');
        left = { v: op === '*' ? left.v * right.v : left.v / right.v, s: `${left.s} ${op === '*' ? '×' : '÷'} ${right.s}` };
      }
      return left;
    }
    function expr() {
      let left = term();
      while (peek() === '+' || peek() === '-') {
        const op = take();
        const right = term();
        left = { v: op === '+' ? left.v + right.v : left.v - right.v, s: `${left.s} ${op === '+' ? '+' : '−'} ${right.s}` };
      }
      return left;
    }
    try {
      const out = expr();
      if (i < tokens.length) fail('sobra');
      const pretty = tokens.join(' ')
        .replace(/\s*\*\s*/g, ' × ').replace(/\s*\/\s*/g, ' ÷ ').replace(/\s+-\s+/g, ' − ')
        .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').replace(/\s+%/g, '%').replace(/^-\s*/, '−');
      const total = Math.round(out.v * 100) / 100;
      return { expr: pretty, groups, total, calc: out.s };
    } catch (err) {
      return { error: err.message || 'invalido' };
    }
  }

  /* ── Notificações de mensagens: som e aviso do sistema ── */
  const NOTIFY_KEY = 'arcano.notify';
  const MESA_UNREAD = {};
  let notifyChannel = null;
  let notifyAudio = null;
  let notifySW = null;

  function notifyPrefs() {
    return { sound: true, system: false, muted: {}, ...storageGet(NOTIFY_KEY, {}) };
  }
  function setNotifyPrefs(prefs) {
    storageSet(NOTIFY_KEY, prefs);
  }

  // O navegador só deixa tocar som depois de um toque ou clique na página.
  document.addEventListener('pointerdown', () => {
    try {
      notifyAudio = notifyAudio || new (window.AudioContext || window.webkitAudioContext)();
      if (notifyAudio.state === 'suspended') notifyAudio.resume();
    } catch { /* sem áudio */ }
  }, { once: true, capture: true });

  function playChime() {
    try {
      if (!notifyAudio) return;
      const t = notifyAudio.currentTime;
      [660, 990].forEach((freq, n) => {
        const osc = notifyAudio.createOscillator();
        const gain = notifyAudio.createGain();
        const at = t + n * 0.11;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.09, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.38);
        osc.connect(gain).connect(notifyAudio.destination);
        osc.start(at);
        osc.stop(at + 0.4);
      });
    } catch { /* sem áudio */ }
  }

  async function registerNotifyWorker() {
    if (notifySW || !('serviceWorker' in navigator)) return notifySW;
    try {
      notifySW = await navigator.serviceWorker.register('sw.js');
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'open' && event.data.hash) location.hash = event.data.hash;
      });
    } catch (err) {
      console.warn('[O Arcano] Sem service worker:', err);
    }
    return notifySW;
  }

  async function showSystemNotification(title, body, hash, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const reg = notifySW || await registerNotifyWorker();
    const options = { body, tag, renotify: true, icon: 'assets/images/Logo.png', data: { hash } };
    if (reg && reg.showNotification) {
      reg.showNotification(title, options);
      return;
    }
    try {
      const n = new Notification(title, options);
      n.onclick = () => { window.focus(); location.hash = hash; n.close(); };
    } catch { /* celular sem service worker */ }
  }

  function refreshUnreadTitle() {
    const total = Object.values(MESA_UNREAD).reduce((a, b) => a + b, 0);
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = total ? `(${total}) ${base}` : base;
  }

  function clearMesaUnread(mesaId) {
    if (MESA_UNREAD[mesaId]) {
      delete MESA_UNREAD[mesaId];
      refreshUnreadTitle();
    }
  }

  function messagePreview(msg) {
    if (msg.kind === 'combate') return msg.data && msg.data.action ? `usou ${msg.data.action}` : 'combate';
    if (msg.kind === 'rolagem') return msg.data && msg.data.secret ? 'rolou dados em segredo' : `rolou ${msg.data?.expr || 'dados'}`;
    if (msg.kind === 'imagem') return 'enviou uma imagem';
    if (msg.kind === 'cena') return `abriu a cena ${msg.data?.title || ''}`.trim();
    return String(msg.body || '').replace(/\*\*|\(\(|\)\)|\|\||~~|--|>>/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }

  function onAnyMesaMessage(msg) {
    if (!msg || !auth.user || msg.user_id === auth.user.id) return;
    const prefs = notifyPrefs();
    if (prefs.muted && prefs.muted[msg.mesa_id]) return;
    const viewing = chatState.mesaId === msg.mesa_id && !!document.querySelector(`[data-chat="${CSS.escape(msg.mesa_id)}"]`);
    if (viewing && !document.hidden) return;
    MESA_UNREAD[msg.mesa_id] = (MESA_UNREAD[msg.mesa_id] || 0) + 1;
    refreshUnreadTitle();
    if (prefs.sound) playChime();
    if (prefs.system && document.hidden) {
      const mesa = mesaById(msg.mesa_id);
      const s = messageSpeaker(msg);
      showSystemNotification(`${s.name} · ${mesa ? mesa.name : 'Mesa'}`, messagePreview(msg), `#/Mesas/${msg.mesa_id}/chat`, `mesa-${msg.mesa_id}`);
    }
  }

  function startMessageNotifications() {
    if (!sb || !auth.user || notifyChannel) return;
    notifyChannel = sb.channel('arcano-notify')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesa_messages' }, (payload) => onAnyMesaMessage(payload.new))
      .subscribe();
    if (notifyPrefs().system) registerNotifyWorker();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && chatState.mesaId && document.querySelector(`[data-chat="${CSS.escape(chatState.mesaId)}"]`)) clearMesaUnread(chatState.mesaId);
  });

  /* ── Envio ───────────────────────────────────── */
  async function sendChatMessage(mesaId, row) {
    const { data, error } = await sb.from('mesa_messages')
      .insert({ mesa_id: mesaId, user_id: auth.user.id, author: row.speaker?.name || myDisplayName(), body: '', tone: 'normal', data: {}, ...row })
      .select()
      .single();
    if (error) throw error;
    addMesaMessage(mesaId, data);
    return data;
  }

  async function sendChatRoll(mesa, result, { secret = false, speaker: forced = null } = {}) {
    const speaker = forced || speakerPayload(currentSpeaker(mesa));
    if (!secret) return sendChatMessage(mesa.id, { kind: 'rolagem', speaker, data: { ...result } });
    const label = result.test ? { test: { attr: result.test.attr, dice: result.test.dice } } : { expr: result.expr };
    const msg = await sendChatMessage(mesa.id, { kind: 'rolagem', speaker, data: { ...label, secret: true, revealed: false } });
    const { error } = await sb.from('mesa_secret_rolls').insert({ message_id: msg.id, mesa_id: mesa.id, result });
    if (error) throw error;
    MESA_SECRETS[msg.id] = result;
    rerenderChatMessage(mesa.id, msg.id);
    return msg;
  }

  function findWhisperTarget(mesaId, rest) {
    const members = (MESA_MEMBERS[mesaId] || []).filter((m) => m.userId !== auth.user?.id && m.displayName);
    const quoted = rest.match(/^"([^"]+)"\s+([\s\S]+)$/);
    if (quoted) {
      const m = members.find((x) => normalize(x.displayName) === normalize(quoted[1]));
      return m ? { member: m, text: quoted[2] } : null;
    }
    const sorted = members.slice().sort((a, b) => b.displayName.length - a.displayName.length);
    for (const m of sorted) {
      const name = normalize(m.displayName);
      const head = normalize(rest.slice(0, m.displayName.length));
      if (head === name && /\s/.test(rest.charAt(m.displayName.length))) return { member: m, text: rest.slice(m.displayName.length).trim() };
    }
    return null;
  }

  /* Interpreta a caixa de texto e devolve a ação a executar. */
  function parseChatInput(mesa, raw) {
    const text = raw.trim();
    const master = mesa.role === 'mestre';
    const speaker = currentSpeaker(mesa);
    let kind = speaker.type === 'self' ? 'fora' : (speaker.type === 'narrador' ? 'narracao' : 'fala');
    let tone = 'normal';
    let whisperTo = null;
    let body = text;
    const command = text.match(/^\/(\w+)(?:\s+([\s\S]*))?$/);
    if (command) {
      const name = command[1].toLowerCase();
      const rest = (command[2] || '').trim();
      if (name === 'r' || name === 'gr') {
        if (name === 'gr' && !master) return { error: 'Só o Mestre rola em segredo.' };
        const roll = evaluateRoll(rest || '1d20');
        if (roll.error) return { error: 'Não entendi a conta. Exemplo: /r 2d6 + 1d8 × 2 − 3' };
        return { roll, secret: name === 'gr' };
      }
      if (name === 'cena') {
        if (!master) return { error: 'Só o Mestre abre cenas.' };
        return { scene: { title: rest } };
      }
      if (!rest) return { error: 'Escreva algo depois do comando.' };
      if (name === 'me') kind = 'acao';
      else if (name === 'grita') tone = 'grita';
      else if (name === 'baixo') tone = 'baixo';
      else if (name === 'ooc') kind = 'fora';
      else if (name === 'narrar') {
        if (!master) return { error: 'Só o Mestre narra.' };
        kind = 'narracao';
      } else if (name === 'w') {
        const target = findWhisperTarget(mesa.id, rest);
        if (!target || !target.text) return { error: 'Para quem? Exemplo: /w Rafa texto' };
        whisperTo = target.member.userId;
        body = target.text;
      } else {
        return { error: `Comando ${command[1]} não existe. Digite / para ver a lista.` };
      }
      if (name !== 'w') body = rest;
    }
    if (kind === 'fora' || kind === 'narracao') {
      const self = kind === 'narracao'
        ? { type: 'narrador', name: 'Narrador' }
        : { type: 'self', name: memberName(mesa.id, auth.user.id) || myDisplayName() };
      return { message: { kind, tone, body, whisper_to: whisperTo, speaker: self } };
    }
    return { message: { kind, tone, body, whisper_to: whisperTo, speaker: speakerPayload(speaker) } };
  }

  /* ── Imagens e acervo ────────────────────────── */
  async function loadMesaImages(mesaId) {
    const { data, error } = await sb.from('mesa_images').select('*').eq('mesa_id', mesaId).order('created_at', { ascending: false });
    if (error) { console.error('Erro ao carregar o acervo:', error); return; }
    MESA_IMAGES[mesaId] = data || [];
  }

  async function loadMesaSecrets(mesaId) {
    const { data, error } = await sb.from('mesa_secret_rolls').select('message_id,result').eq('mesa_id', mesaId);
    if (error) { console.error('Erro ao carregar rolagens secretas:', error); return; }
    (data || []).forEach((row) => { MESA_SECRETS[row.message_id] = row.result; });
  }

  function prettyFileTitle(file) {
    return String(file?.name || 'Imagem').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Imagem';
  }

  async function uploadChatImage(mesa, file, title) {
    const master = mesa.role === 'mestre';
    const speaker = speakerPayload(currentSpeaker(mesa));
    if (master) {
      const up = await uploadBanner(file, `mesas/${mesa.id}/acervo/imagem`);
      const { data: image, error } = await sb.from('mesa_images').insert({ mesa_id: mesa.id, title, url: up.url, path: up.path }).select().single();
      if (error) { await removeBanner(up.path); throw error; }
      (MESA_IMAGES[mesa.id] || (MESA_IMAGES[mesa.id] = [])).unshift(image);
      return sendChatMessage(mesa.id, { kind: 'imagem', speaker, data: { url: up.url, title, imageId: image.id } });
    }
    const up = await uploadBanner(file, `mesas/${mesa.id}/chat/${auth.user.id}/imagem`);
    try {
      return await sendChatMessage(mesa.id, {
        kind: 'imagem',
        speaker,
        data: { url: up.url, path: up.path, title, expiresAt: new Date(Date.now() + CHAT_IMAGE_TTL_MS).toISOString() }
      });
    } catch (err) {
      await removeBanner(up.path);
      throw err;
    }
  }

  /* Imagens de jogador vencidas: apaga o arquivo quando o dono ou o Mestre abre o chat. */
  async function cleanupExpiredChatImages(mesaId) {
    const master = isMesaMaster(mesaId);
    const expired = (MESA_MESSAGES[mesaId] || []).filter((m) => m.kind === 'imagem'
      && m.data && m.data.path && m.data.expiresAt && !m.data.kept && !m.data.expired
      && Date.now() > new Date(m.data.expiresAt).getTime()
      && (master || m.user_id === auth.user?.id));
    for (const msg of expired) {
      await removeBanner(msg.data.path);
      const data = { ...msg.data, expired: true, url: '', path: '' };
      const { error } = await sb.from('mesa_messages').update({ data }).eq('id', msg.id);
      if (!error) msg.data = data;
    }
  }

  /* ── Tempo real: mensagens, presença e "digitando" ── */
  function unsubscribeMesaChat() {
    if (mesaChannel && sb) sb.removeChannel(mesaChannel);
    mesaChannel = null;
    mesaChannelId = '';
    chatState.online = [];
    chatState.typing = {};
  }

  function subscribeMesaChat(mesaId) {
    if (!sb || (mesaChannel && mesaChannelId === mesaId)) return;
    unsubscribeMesaChat();
    mesaChannelId = mesaId;
    const filter = `mesa_id=eq.${mesaId}`;
    mesaChannel = sb.channel(`mesa-chat-${mesaId}`, { config: { presence: { key: auth.user?.id || 'anon' } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesa_messages', filter }, (payload) => addMesaMessage(mesaId, payload.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mesa_messages', filter }, (payload) => updateMesaMessage(mesaId, payload.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'mesa_messages' }, (payload) => removeMesaMessage(mesaId, payload.old && payload.old.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesa_state', filter }, (payload) => {
        if (!payload.new) return;
        MESA_STATE[mesaId] = payload.new.initiative || {};
        renderChatPresence();
        chatState.renderTool?.('iniciativa');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesa_combates', filter }, (payload) => onCombatChange(mesaId, payload))
      .on('presence', { event: 'sync' }, () => {
        const state = mesaChannel?.presenceState ? mesaChannel.presenceState() : {};
        const names = new Map();
        Object.values(state).flat().forEach((p) => { if (p && p.user) names.set(p.user, p.name || 'Jogador'); });
        chatState.online = [...names.entries()];
        renderChatPresence();
        chatState.renderTool?.('opcoes');
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.user === auth.user?.id) return;
        chatState.typing[payload.user] = { name: payload.name, at: Date.now() };
        renderChatTyping();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && mesaChannel?.track) {
          mesaChannel.track({ user: auth.user?.id, name: memberName(mesaId, auth.user?.id) || myDisplayName() });
        }
      });
  }

  function renderChatPresence() {
    const box = document.querySelector('[data-chat-presence]');
    if (!box) return;
    const others = chatState.online.filter(([id]) => id !== auth.user?.id);
    const ini = mesaInitiative(chatState.mesaId);
    const turn = ini.entries[ini.turn];
    const mesa = mesaById(chatState.mesaId);
    box.innerHTML = `${mesa ? `<strong class="chat-presence__mesa">${escapeHtml(mesa.name)}</strong>` : ''}${chatState.online.length
      ? `<span class="chat-presence__dot" aria-hidden="true"></span><span>${chatState.online.length === 1 ? 'Só você aqui' : chatState.online.map(([, n]) => escapeHtml(n)).join(', ')}</span>`
      : ''}${turn ? `<span class="chat-presence__turn" style="--who:${turn.color || 'inherit'}">Rodada ${ini.round} · vez de <b>${escapeHtml(turn.name)}</b></span>` : ''}`;
    box.classList.toggle('is-alone', !others.length);
  }

  function renderChatTyping() {
    const box = document.querySelector('[data-chat-typing]');
    if (!box) return;
    const now = Date.now();
    const names = Object.entries(chatState.typing).filter(([, t]) => now - t.at < 4000).map(([, t]) => t.name);
    box.textContent = !names.length ? '' : names.length === 1 ? `${names[0]} está escrevendo…` : `${names.join(', ')} estão escrevendo…`;
    clearTimeout(chatState.typingTimer);
    if (names.length) chatState.typingTimer = setTimeout(renderChatTyping, 1500);
  }

  function notifyTyping(mesaId) {
    if (!mesaChannel || !mesaChannel.send || Date.now() - chatState.lastTypingSent < 2500) return;
    chatState.lastTypingSent = Date.now();
    mesaChannel.send({ type: 'broadcast', event: 'typing', payload: { user: auth.user?.id, name: memberName(mesaId, auth.user?.id) || myDisplayName() } });
  }

  function chatLogEl(mesaId) {
    return document.querySelector(`[data-mesa-chat-log="${CSS.escape(mesaId)}"]`);
  }

  function addMesaMessage(mesaId, row) {
    const list = MESA_MESSAGES[mesaId] || (MESA_MESSAGES[mesaId] = []);
    if (!row || list.some((m) => m.id === row.id)) return;
    list.push(row);
    if (row.user_id && chatState.typing[row.user_id]) { delete chatState.typing[row.user_id]; renderChatTyping(); }
    const log = chatLogEl(mesaId);
    if (!log) return;
    log.querySelector('.chat-empty')?.remove();
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 140;
    log.insertAdjacentHTML('beforeend', mesaMessageHTML(mesaId, row, list[list.length - 2]));
    if (row.kind === 'rolagem' && !(row.data && row.data.levelUp)) animateRollNode(log.lastElementChild);
    if (nearBottom || row.user_id === auth.user?.id) log.scrollTop = log.scrollHeight;
  }

  function rerenderChatMessage(mesaId, id) {
    const list = MESA_MESSAGES[mesaId] || [];
    const index = list.findIndex((m) => m.id === id);
    const node = document.querySelector(`[data-mesa-msg="${CSS.escape(id)}"]`);
    if (index < 0 || !node) return;
    node.outerHTML = mesaMessageHTML(mesaId, list[index], list[index - 1]);
  }

  function updateMesaMessage(mesaId, row) {
    const list = MESA_MESSAGES[mesaId] || [];
    const index = list.findIndex((m) => m.id === row?.id);
    if (index < 0) return;
    list[index] = { ...list[index], ...row };
    rerenderChatMessage(mesaId, row.id);
  }

  function removeMesaMessage(mesaId, id) {
    const list = MESA_MESSAGES[mesaId] || [];
    const index = list.findIndex((m) => m.id === id);
    if (index < 0) return;
    list.splice(index, 1);
    document.querySelector(`[data-mesa-msg="${CSS.escape(id)}"]`)?.remove();
    // A mensagem seguinte pode precisar voltar a mostrar o cabeçalho.
    if (list[index]) rerenderChatMessage(mesaId, list[index].id);
  }

  /* ── Handlers do chat ────────────────────────── */
  let chatResizeBound = false;
  const isCompactChat = () => window.matchMedia('(max-width: 980px)').matches;
  /* Celular: a altura vem do CSS (100dvh menos o topo), e o navegador ajusta
     sozinho quando o teclado abre. Aqui só medimos onde o chat começa. */
  function fitChatHeight() {
    const chat = document.querySelector('.chat');
    if (!chat) return;
    const top = Math.max(0, chat.getBoundingClientRect().top + window.scrollY);
    if (isCompactChat()) chat.style.setProperty('--chat-top', `${Math.round(top)}px`);
    else chat.style.setProperty('--chat-h', `${Math.max(420, Math.round(window.innerHeight - top - 14))}px`);
    const log = chat.querySelector('.chat__log');
    if (log && log.dataset.stick !== '0') log.scrollTop = log.scrollHeight;
  }
  let chatFitFrame = 0;
  function scheduleChatFit() {
    cancelAnimationFrame(chatFitFrame);
    chatFitFrame = requestAnimationFrame(fitChatHeight);
  }

  /* Notas pessoais: todos da mesa leem; cada um escreve a sua. */
  async function loadMesaNotesAll(mesaId) {
    const { data, error } = await sb.from('mesa_notes').select('user_id,body').eq('mesa_id', mesaId).eq('kind', 'pessoal');
    if (error) { console.error('Erro ao carregar notas:', error); MESA_NOTES[`${mesaId}|all`] = {}; return; }
    const map = {};
    (data || []).forEach((row) => { map[row.user_id] = row.body || ''; });
    if (auth.user && map[auth.user.id] == null) map[auth.user.id] = '';
    MESA_NOTES[`${mesaId}|all`] = map;
  }

  /* Notas privadas do Mestre (gerais ou de um NPC). */
  async function loadPrivateNote(mesaId, kind, target = '') {
    const key = notesKey(mesaId, auth.user?.id, kind, target);
    if (Object.prototype.hasOwnProperty.call(MESA_NOTES, key)) return;
    const { data, error } = await sb.from('mesa_notes').select('body').eq('mesa_id', mesaId).eq('user_id', auth.user.id).eq('kind', kind).eq('target', target).maybeSingle();
    if (error) { console.error('Erro ao carregar notas:', error); MESA_NOTES[key] = ''; return; }
    MESA_NOTES[key] = data ? data.body : '';
  }

  /* Rolagem chegando ao chat: os dados giram e o total aparece no fim. */
  function animateRollNode(node) {
    if (!node || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dice = [...node.querySelectorAll('.chat-roll__dice .chat-die')];
    if (!dice.length) return;
    const finals = dice.map((d) => d.textContent);
    const sides = dice.map((d) => {
      if (d.classList.contains('chat-die--destiny')) return 12;
      const m = /d(\d+)/.exec(d.getAttribute('title') || '');
      return m ? Number(m[1]) : 6;
    });
    node.classList.add('is-rolling');
    const started = performance.now();
    const tick = () => {
      if (performance.now() - started > 700) {
        dice.forEach((d, i) => { d.textContent = finals[i]; });
        node.classList.remove('is-rolling');
        node.classList.add('is-rolled');
        return;
      }
      dice.forEach((d, i) => { d.textContent = String(1 + Math.floor(Math.random() * sides[i])); });
      setTimeout(tick, 55);
    };
    tick();
  }

  function attachMesaChat() {
    const root = document.querySelector('[data-chat]');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';
    const mesaId = root.dataset.chat;
    const mesa = mesaById(mesaId);
    if (!mesa) return;
    document.body.classList.add('is-mesa-chat');
    clearMesaUnread(mesaId);
    fitChatHeight();
    if (!chatResizeBound) {
      chatResizeBound = true;
      window.addEventListener('resize', scheduleChatFit);
    }
    const log = chatLogEl(mesaId);
    if (log) {
      log.scrollTop = log.scrollHeight;
      // Só gruda no fim se a pessoa já estava no fim (não puxa quem está lendo o histórico).
      log.addEventListener('scroll', () => {
        log.dataset.stick = log.scrollHeight - log.scrollTop - log.clientHeight < 80 ? '1' : '0';
      }, { passive: true });
    }
    subscribeMesaChat(mesaId);
    renderChatPresence();
    attachCombat(root, mesa);
    cleanupExpiredChatImages(mesaId).then(() => {
      (MESA_MESSAGES[mesaId] || []).filter((m) => m.kind === 'imagem').forEach((m) => rerenderChatMessage(mesaId, m.id));
    });

    const form = document.getElementById('mesaChatForm');
    const textarea = form?.querySelector('textarea');
    const commands = form?.querySelector('[data-chat-commands]');
    const menu = form?.querySelector('[data-chat-speaker-menu]');
    const toggle = form?.querySelector('[data-chat-speaker-toggle]');
    const side = root.querySelector('[data-chat-side]');
    const panel = root.querySelector('[data-chat-tool-panel]');
    let attachFile = null;
    let fichaTimer = null;
    let notesTimer = null;

    const currentTool = () => activeChatTool(mesa);
    const ensureToolData = (tool) => {
      if (tool.id === 'notas' && !MESA_NOTES[`${mesaId}|all`]) {
        loadMesaNotesAll(mesaId).then(() => chatState.renderTool('notas'));
      }
      if (tool.id === 'mestre') {
        const key = notesKey(mesaId, auth.user?.id, 'mestre');
        if (!Object.prototype.hasOwnProperty.call(MESA_NOTES, key)) loadPrivateNote(mesaId, 'mestre').then(() => chatState.renderTool('mestre'));
      }
      if (tool.id === 'npcs' && chatState.npcSel) {
        const id = chatState.npcSel.split(':')[1];
        const key = notesKey(mesaId, auth.user?.id, 'npc', id);
        if (!Object.prototype.hasOwnProperty.call(MESA_NOTES, key)) loadPrivateNote(mesaId, 'npc', id).then(() => chatState.renderTool('npcs'));
      }
    };
    const renderTool = ({ animate = false } = {}) => {
      if (!panel) return;
      const tool = currentTool();
      side.classList.toggle('is-collapsed', !tool.open);
      side.querySelectorAll('[data-chat-tool]').forEach((b) => {
        const on = tool.open && b.dataset.chatTool === tool.id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      panel.innerHTML = tool.open ? chatToolHTML(mesa, tool.id) : '';
      if (animate && tool.open) {
        panel.classList.remove('is-opening'); void panel.offsetWidth; panel.classList.add('is-opening');
      }
      if (tool.open) ensureToolData(tool);
      fitChatHeight();
    };
    const openTool = (id) => {
      storageSet(toolStoreKey, { id, open: true });
      renderTool({ animate: true });
    };
    chatState.renderTool = (only) => {
      if (document.querySelector('[data-chat]') !== root) return;
      const tool = currentTool();
      if (!tool.open) return;
      if (!only || tool.id === only) {
        // Não redesenha por cima de quem está digitando numa nota.
        if (panel.contains(document.activeElement) && document.activeElement.closest('[data-chat-notes], input, textarea')) return;
        renderTool();
      }
    };

    const setSpeaker = (key) => {
      chatState.speakerKey = key;
      storageSet(speakerKeyStore(mesaId), key);
      const speaker = currentSpeaker(mesa);
      if (toggle) toggle.innerHTML = chatSpeakerButtonHTML(speaker);
      if (menu) menu.innerHTML = chatSpeakerMenuHTML(mesa, speaker);
    };
    const closeMenu = () => { if (menu) { menu.hidden = true; toggle?.setAttribute('aria-expanded', 'false'); } };

    /* Dados: a conta digitada é a fonte da verdade; os botões só a editam. */
    const syncDice = ({ fromInput = false } = {}) => {
      const input = root.querySelector('[data-dice-expr]');
      if (input && !fromInput) input.value = chatState.expr;
      if (input) {
        const check = chatState.expr.trim() ? evaluateRoll(chatState.expr) : null;
        input.classList.toggle('is-invalid', !!(check && check.error));
      }
      const stage = root.querySelector('[data-dice-stage]');
      if (stage && !stage.classList.contains('is-rolling')) stage.innerHTML = diceStageHTML();
    };
    const addDie = (sides) => {
      const expr = chatState.expr.trim();
      const last = new RegExp(`(\\d*)d${sides}$`, 'i').exec(expr);
      if (last) chatState.expr = expr.slice(0, last.index) + `${Number(last[1] || 1) + 1}d${sides}`;
      else chatState.expr = !expr || /[+\-−×÷*/(]$/.test(expr) ? `${expr}${expr ? ' ' : ''}1d${sides}` : `${expr} + 1d${sides}`;
      chatState.stageSides = sides;
      chatState.stageResult = null;
    };
    const removeDie = (sides) => {
      const expr = chatState.expr;
      const re = new RegExp(`(\\s*[+\\-−]\\s*)?(\\d*)d${sides}(?!\\d)`, 'gi');
      let match = null;
      let m;
      while ((m = re.exec(expr))) match = m;
      if (!match) return;
      const qty = Number(match[2] || 1);
      const replacement = qty > 1 ? `${match[1] || ''}${qty - 1}d${sides}` : '';
      chatState.expr = (expr.slice(0, match.index) + replacement + expr.slice(match.index + match[0].length)).replace(/^\s*[+]\s*/, '').trim();
    };
    const addKey = (key) => {
      const expr = chatState.expr.trim();
      if (key === '+1' || key === '−1') {
        const m = /\s*([+\-−])\s*(\d+)$/.exec(expr);
        const delta = key === '+1' ? 1 : -1;
        if (m && !/d\d*$/i.test(expr.slice(0, m.index + m[0].length - m[2].length))) {
          const value = (m[1] === '+' ? 1 : -1) * Number(m[2]) + delta;
          const head = expr.slice(0, m.index);
          chatState.expr = value === 0 ? head : `${head} ${value > 0 ? '+' : '−'} ${Math.abs(value)}`;
        } else {
          // Depois de um operador entra só o número (× −1); senão soma ou subtrai 1.
          if (/[+\-−×÷*/(]$/.test(expr)) chatState.expr = `${expr} ${delta > 0 ? '' : '−'}1`;
          else chatState.expr = expr ? `${expr} ${delta > 0 ? '+' : '−'} 1` : String(delta);
        }
        return;
      }
      chatState.expr = key === '(' || key === ')' || key === '%' ? `${expr}${key === '(' && expr && !/[(+\-−×÷]$/.test(expr) ? ' × ' : ''}${key}` : `${expr} ${key} `;
    };
    chatState.expr = chatState.expr || '';

    const rollOnStage = (result) => {
      const stage = root.querySelector('[data-dice-stage]');
      chatState.stageResult = result;
      chatState.stageSides = result.groups.length ? result.groups[0].sides : (chatState.stageSides || 20);
      if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { syncDice(); return; }
      const sides = chatState.stageSides;
      stage.classList.add('is-rolling');
      const started = performance.now();
      const spin = () => {
        if (!stage.isConnected) return;
        if (performance.now() - started > 750) {
          stage.classList.remove('is-rolling');
          stage.innerHTML = diceStageHTML();
          stage.classList.remove('is-landed'); void stage.offsetWidth; stage.classList.add('is-landed');
          return;
        }
        stage.querySelector('[data-stage-die]').innerHTML = dieIconSVG(sides, 132, 1 + Math.floor(Math.random() * sides));
        setTimeout(spin, 60);
      };
      spin();
    };

    const saveFicha = (c) => {
      clearTimeout(fichaTimer);
      fichaTimer = setTimeout(() => {
        persistCharacterState(c).catch((err) => { console.error(err); toast('Ficha não salva: ' + (err.message || err)); });
      }, 600);
    };
    const saveNpcCombat = async (npc, patch) => {
      npc.combat = { ...npcCombat(npc), ...patch };
      const { error } = await sb.from('mesa_npcs').update({ combat: npc.combat, updated_at: new Date().toISOString() }).eq('id', npc.id);
      if (error) toast('NPC não salvo: ' + error.message);
    };
    const npcById = (id) => (MESA_NPCS[mesaId] || []).find((n) => n.id === id);
    const condTarget = (key) => {
      const [type, id] = String(key || '').split(':');
      return type === 'c' ? { c: characterById(id) } : { n: npcById(id) };
    };
    const charSpeaker = (c) => ({ type: 'character', id: c.id, name: c.name, image: c.image || '', color: safeChatColor(c.identity?.chatColor, c.id) });

    const saveNote = (editor) => {
      const kind = editor.dataset.chatNotes;
      const target = editor.dataset.noteTarget || '';
      const html = sanitizeHtml(editor.innerHTML).trim();
      if (kind === 'pessoal') {
        const all = MESA_NOTES[`${mesaId}|all`] || (MESA_NOTES[`${mesaId}|all`] = {});
        all[auth.user.id] = html;
      } else {
        MESA_NOTES[notesKey(mesaId, auth.user.id, kind, target)] = html;
      }
      const status = root.querySelector('[data-notes-status]');
      if (status) status.textContent = '…';
      clearTimeout(notesTimer);
      notesTimer = setTimeout(async () => {
        const { error } = await sb.from('mesa_notes').upsert(
          { mesa_id: mesaId, user_id: auth.user.id, kind, target, body: html, updated_at: new Date().toISOString() },
          { onConflict: 'mesa_id,user_id,kind,target' }
        );
        const now = root.querySelector('[data-notes-status]');
        if (now) now.textContent = error ? 'Não salvou' : 'Salvo';
      }, 700);
    };

    root.addEventListener('contextmenu', (event) => {
      const die = event.target.closest('[data-chat-die]');
      if (!die) return;
      event.preventDefault();
      removeDie(die.dataset.chatDie);
      syncDice();
    });

    // Botões de formatação não podem roubar a seleção do editor.
    root.addEventListener('mousedown', (event) => {
      if (event.target.closest('[data-fmt], [data-fmt-color]')) event.preventDefault();
    });

    root.addEventListener('click', async (event) => {
      const target = event.target;
      const spoiler = target.closest('.chat-spoiler');
      if (spoiler) { spoiler.classList.add('is-open'); return; }

      const touchedMsg = target.closest('[data-mesa-msg]');
      if (touchedMsg && !target.closest('button, a, input, textarea, select, .chat-edit') && window.matchMedia('(hover: none)').matches) {
        const wasOpen = touchedMsg.classList.contains('is-touched');
        root.querySelectorAll('.is-touched').forEach((n) => n.classList.remove('is-touched'));
        if (!wasOpen) touchedMsg.classList.add('is-touched');
        return;
      }

      const toolBtn = target.closest('[data-chat-tool]');
      if (toolBtn) {
        const tool = currentTool();
        const closing = tool.open && tool.id === toolBtn.dataset.chatTool;
        storageSet(toolStoreKey, { id: toolBtn.dataset.chatTool, open: !closing });
        renderTool({ animate: !closing });
        return;
      }

      if (target.closest('[data-chat-speaker-toggle]')) {
        menu.hidden = !menu.hidden;
        toggle.setAttribute('aria-expanded', String(!menu.hidden));
        return;
      }
      const pick = target.closest('[data-chat-speaker]');
      if (pick) { setSpeaker(pick.dataset.chatSpeaker); closeMenu(); textarea?.focus(); return; }
      const swatch = target.closest('[data-chat-color]');
      if (swatch) {
        const speaker = currentSpeaker(mesa);
        const c = speaker.type === 'character' ? characterById(speaker.id) : null;
        if (!c) return;
        c.identity = { ...(c.identity || {}), chatColor: swatch.dataset.chatColor };
        setSpeaker(speaker.key);
        try { await persistCharacterState(c); } catch (err) { console.error(err); toast('Cor não salva.'); }
        return;
      }
      if (menu && !menu.hidden && !target.closest('.chat-speaker')) closeMenu();

      const cmd = target.closest('[data-chat-command]');
      if (cmd) { textarea.value = cmd.dataset.chatCommand; commands.hidden = true; textarea.focus(); return; }

      const jump = target.closest('[data-chat-jump]');
      if (jump) {
        const node = document.querySelector(`[data-mesa-msg="${CSS.escape(jump.dataset.chatJump)}"]`);
        if (node) {
          node.scrollIntoView({ block: 'center', behavior: 'smooth' });
          node.classList.remove('is-flash'); void node.offsetWidth; node.classList.add('is-flash');
        }
        return;
      }

      /* Dados */
      const die = target.closest('[data-chat-die]');
      if (die) { addDie(Number(die.dataset.chatDie)); syncDice(); return; }
      const calcKey = target.closest('[data-calc-key]');
      if (calcKey) { addKey(calcKey.dataset.calcKey); chatState.stageResult = null; syncDice(); return; }
      if (target.closest('[data-chat-clear]')) {
        chatState.expr = '';
        chatState.stageResult = null;
        chatState.stageSides = 0;
        syncDice();
        return;
      }
      const rollBtn = target.closest('[data-chat-roll]');
      if (rollBtn) {
        const result = evaluateRoll(chatState.expr);
        if (result.error) {
          const input = root.querySelector('[data-dice-expr]');
          input?.classList.add('is-invalid', 'is-nudge');
          setTimeout(() => input?.classList.remove('is-nudge'), 400);
          return;
        }
        const secret = !!root.querySelector('[data-chat-secret]')?.checked;
        rollBtn.disabled = true;
        rollOnStage(result);
        try {
          await sendChatRoll(mesa, result, { secret });
        } catch (err) { console.error(err); toast('Rolagem não enviada: ' + (err.message || err)); }
        finally { rollBtn.disabled = false; }
        return;
      }
      const test = target.closest('[data-chat-test]');
      if (test) {
        const c = characterById(test.dataset.testChar);
        test.disabled = true;
        try {
          await sendChatRoll(mesa, arcanoTest(test.dataset.chatTest, Math.max(1, parseInt(test.dataset.chatTestDice, 10) || 1)), { speaker: c ? charSpeaker(c) : null });
        } catch (err) { console.error(err); toast('Teste não enviado: ' + (err.message || err)); }
        finally { test.disabled = false; }
        return;
      }

      /* Fichas: lista → detalhe (Combate, Condição, Edição) */
      const fichaOpen = target.closest('[data-ficha-open]');
      if (fichaOpen) { chatState.fichaSel = fichaOpen.dataset.fichaOpen; chatState.fichaSub = 'combate'; renderTool(); return; }
      if (target.closest('[data-ficha-back]')) { chatState.fichaSel = ''; renderTool(); return; }
      const fichaSub = target.closest('[data-ficha-sub]');
      if (fichaSub) { chatState.fichaSub = fichaSub.dataset.fichaSub; renderTool(); return; }

      /* Medidores (shift = 5) */
      const step = target.closest('[data-meter-step]');
      if (step) {
        const meter = step.closest('.tool-meter');
        const delta = Number(step.dataset.meterStep) * (event.shiftKey ? 5 : 1);
        const charBox = meter.closest('[data-char]');
        if (charBox) {
          const c = characterById(charBox.dataset.char);
          if (!c) return;
          ensureVitals(c);
          const slot = meter.dataset.mana ? c.vitals.mana : c.vitals.hp[meter.dataset.hpPart];
          if (!slot) return;
          slot.cur = Math.max(0, Math.min(slot.max, slot.cur + delta));
          meter.querySelector('b').innerHTML = `${slot.cur}<small>/${slot.max}</small>`;
          meter.querySelector('.tool-meter__bar').style.width = `${slot.max ? (slot.cur / slot.max) * 100 : 0}%`;
          saveFicha(c);
        } else if (meter.dataset.npcHp) {
          const npc = npcById(meter.dataset.npcHp);
          if (!npc) return;
          const cb = npcCombat(npc);
          const cur = Math.max(0, Math.min(cb.max, cb.cur + delta));
          meter.querySelector('b').innerHTML = `${cur}<small>/${cb.max}</small>`;
          meter.querySelector('.tool-meter__bar').style.width = `${(cur / cb.max) * 100}%`;
          await saveNpcCombat(npc, { cur, max: cb.max });
        }
        return;
      }
      const condRemove = target.closest('[data-cond-remove]');
      if (condRemove) {
        const { c, n } = condTarget(condRemove.closest('[data-cond-target]').dataset.condTarget);
        const index = Number(condRemove.dataset.condRemove);
        if (c) { c.statuses = (c.statuses || []).filter((_, i) => i !== index); saveFicha(c); }
        else if (n) await saveNpcCombat(n, { conds: npcCombat(n).conds.filter((_, i) => i !== index) });
        renderTool();
        return;
      }

      /* Notas: formatação */
      const fmt = target.closest('[data-fmt]');
      const fmtColor = target.closest('[data-fmt-color]');
      if (fmt || fmtColor) {
        const editor = root.querySelector('.note-editor[contenteditable="true"]');
        if (!editor) return;
        if (!editor.contains(document.getSelection()?.anchorNode)) editor.focus();
        if (fmt) document.execCommand(fmt.dataset.fmt, false, null);
        else document.execCommand('foreColor', false, fmtColor.dataset.fmtColor);
        saveNote(editor);
        return;
      }
      const notesView = target.closest('[data-notes-view]');
      if (notesView) {
        chatState.notesView = notesView.dataset.notesView;
        await loadMesaNotesAll(mesaId);
        renderTool();
        return;
      }

      /* NPCs (Mestre) */
      const npcOpen = target.closest('[data-npc-open]');
      if (npcOpen) { chatState.npcSel = npcOpen.dataset.npcOpen; renderTool(); return; }
      if (target.closest('[data-npc-back]')) { chatState.npcSel = ''; renderTool(); return; }
      const npcVisible = target.closest('[data-npc-toggle-visible]');
      if (npcVisible) {
        const { c, n } = condTarget(npcVisible.dataset.npcToggleVisible);
        if (c) {
          const { error } = await sb.from('characters').update({ npc_visible: !c.npcVisible }).eq('id', c.id);
          if (error) { toast('Erro: ' + error.message); return; }
          c.npcVisible = !c.npcVisible;
        } else if (n) {
          const { error } = await sb.from('mesa_npcs').update({ visible: !n.visible, updated_at: new Date().toISOString() }).eq('id', n.id);
          if (error) { toast('Erro: ' + error.message); return; }
          n.visible = !n.visible;
        }
        renderTool();
        return;
      }

      /* Acervo e cena (Mestre) */
      if (target.closest('[data-acervo-toggle]')) {
        chatState.acervoOpen = !chatState.acervoOpen;
        renderTool();
        if (chatState.acervoOpen) root.querySelector('[data-acervo-file]')?.click();
        return;
      }
      if (target.closest('[data-acervo-add]')) {
        const fileInput = root.querySelector('[data-acervo-file]');
        const file = fileInput?.files && fileInput.files[0];
        if (!file) { fileInput?.closest('label')?.classList.add('is-nudge'); setTimeout(() => fileInput?.closest('label')?.classList.remove('is-nudge'), 400); return; }
        const title = root.querySelector('[data-acervo-title]').value.trim() || prettyFileTitle(file);
        const button = target.closest('[data-acervo-add]');
        button.disabled = true;
        try {
          const up = await uploadBanner(file, `mesas/${mesaId}/acervo/imagem`);
          const { data, error } = await sb.from('mesa_images').insert({ mesa_id: mesaId, title, url: up.url, path: up.path }).select().single();
          if (error) { await removeBanner(up.path); throw error; }
          (MESA_IMAGES[mesaId] || (MESA_IMAGES[mesaId] = [])).unshift(data);
          chatState.acervoOpen = false;
          renderTool();
        } catch (err) { console.error(err); toast('Imagem não guardada: ' + (err.message || err)); button.disabled = false; }
        return;
      }
      const acervoSend = target.closest('[data-acervo-send]');
      if (acervoSend) {
        const img = (MESA_IMAGES[mesaId] || []).find((i) => i.id === acervoSend.dataset.acervoSend);
        if (!img) return;
        try { await sendChatMessage(mesaId, { kind: 'imagem', speaker: speakerPayload(currentSpeaker(mesa)), data: { url: img.url, title: img.title, imageId: img.id } }); }
        catch (err) { toast('Imagem não enviada: ' + (err.message || err)); }
        return;
      }
      const acervoScene = target.closest('[data-acervo-scene]');
      if (acervoScene) {
        chatState.sceneDraft = { ...(chatState.sceneDraft || {}), imageId: acervoScene.dataset.acervoScene };
        openTool('cena');
        return;
      }
      const acervoRemove = target.closest('[data-acervo-remove]');
      if (acervoRemove) {
        const img = (MESA_IMAGES[mesaId] || []).find((i) => i.id === acervoRemove.dataset.acervoRemove);
        if (!img || !(await askConfirm(`Remover "${img.title || 'imagem'}" do acervo?`, { confirmLabel: 'Remover', danger: true }))) return;
        const { error } = await sb.from('mesa_images').delete().eq('id', img.id);
        if (error) { toast('Erro: ' + error.message); return; }
        if (img.path) await removeBanner(img.path);
        MESA_IMAGES[mesaId] = (MESA_IMAGES[mesaId] || []).filter((i) => i.id !== img.id);
        renderTool();
        return;
      }
      const cenaOpen = target.closest('[data-cena-open]');
      if (cenaOpen) {
        const titleInput = root.querySelector('[data-cena-title]');
        const title = titleInput.value.trim();
        if (!title) { titleInput.focus(); return; }
        const body = root.querySelector('[data-cena-body]').value.trim();
        const image = (MESA_IMAGES[mesaId] || []).find((i) => i.id === root.querySelector('[data-cena-image]')?.value);
        cenaOpen.disabled = true;
        try {
          await sendChatMessage(mesaId, { kind: 'cena', body, speaker: { type: 'narrador', name: 'Narrador' }, data: { title, image: image ? image.url : '' } });
          chatState.sceneDraft = {};
          renderTool();
        } catch (err) { toast('Cena não aberta: ' + (err.message || err)); cenaOpen.disabled = false; }
        return;
      }

      /* Mensagens */
      const reveal = target.closest('[data-chat-reveal]');
      if (reveal) {
        const id = reveal.dataset.chatReveal;
        const msg = (MESA_MESSAGES[mesaId] || []).find((m) => m.id === id);
        const result = MESA_SECRETS[id];
        if (!msg || !result) return;
        const data = { ...msg.data, ...result, secret: true, revealed: true };
        const { error } = await sb.from('mesa_messages').update({ data }).eq('id', id);
        if (error) { toast('Não foi possível revelar: ' + error.message); return; }
        updateMesaMessage(mesaId, { ...msg, data });
        return;
      }
      const pin = target.closest('[data-chat-pin]');
      if (pin) {
        const msg = (MESA_MESSAGES[mesaId] || []).find((m) => m.id === pin.dataset.chatPin);
        if (!msg) return;
        const { error } = await sb.from('mesa_messages').update({ pinned: !msg.pinned }).eq('id', msg.id);
        if (error) { toast('Erro: ' + error.message); return; }
        updateMesaMessage(mesaId, { ...msg, pinned: !msg.pinned });
        chatState.renderTool('opcoes');
        return;
      }
      const keep = target.closest('[data-chat-keep]');
      if (keep) {
        const msg = (MESA_MESSAGES[mesaId] || []).find((m) => m.id === keep.dataset.chatKeep);
        if (!msg) return;
        const { data: image, error } = await sb.from('mesa_images').insert({ mesa_id: mesaId, title: msg.data.title || 'Imagem', url: msg.data.url, path: msg.data.path || '' }).select().single();
        if (error) { toast('Não foi possível guardar: ' + error.message); return; }
        (MESA_IMAGES[mesaId] || (MESA_IMAGES[mesaId] = [])).unshift(image);
        const data = { ...msg.data, kept: true, imageId: image.id };
        await sb.from('mesa_messages').update({ data }).eq('id', msg.id);
        updateMesaMessage(mesaId, { ...msg, data });
        chatState.renderTool('acervo');
        return;
      }
      const del = target.closest('[data-chat-delete]');
      if (del) {
        const id = del.dataset.chatDelete;
        if (!(await askConfirm('Apagar esta mensagem?', { confirmLabel: 'Apagar', danger: true }))) return;
        const msg = (MESA_MESSAGES[mesaId] || []).find((m) => m.id === id);
        const { error } = await sb.from('mesa_messages').delete().eq('id', id);
        if (error) { toast('Erro ao apagar: ' + error.message); return; }
        if (msg?.kind === 'imagem' && msg.data?.path && !msg.data.kept && msg.data.expiresAt) await removeBanner(msg.data.path);
        removeMesaMessage(mesaId, id);
        return;
      }
      const edit = target.closest('[data-chat-edit]');
      if (edit) {
        const id = edit.dataset.chatEdit;
        const msg = (MESA_MESSAGES[mesaId] || []).find((m) => m.id === id);
        const node = document.querySelector(`[data-mesa-msg="${CSS.escape(id)}"]`);
        const textNode = node?.querySelector('[data-chat-text]');
        if (!msg || !textNode || node.querySelector('.chat-edit')) return;
        textNode.hidden = true;
        textNode.insertAdjacentHTML('afterend', `<span class="chat-edit"><textarea rows="2" maxlength="4000">${escapeHtml(msg.body)}</textarea><span><button type="button" class="chat-link" data-chat-edit-save>salvar</button><button type="button" class="chat-link" data-chat-edit-cancel>cancelar</button></span></span>`);
        const area = node.querySelector('.chat-edit textarea');
        area.focus();
        area.setSelectionRange(area.value.length, area.value.length);
        return;
      }
      if (target.closest('[data-chat-edit-cancel]')) {
        rerenderChatMessage(mesaId, target.closest('[data-mesa-msg]').dataset.mesaMsg);
        return;
      }
      if (target.closest('[data-chat-edit-save]')) {
        const node = target.closest('[data-mesa-msg]');
        const id = node.dataset.mesaMsg;
        const msg = (MESA_MESSAGES[mesaId] || []).find((m) => m.id === id);
        const body = node.querySelector('.chat-edit textarea').value.trim();
        if (!msg || !body) return;
        const edited_at = new Date().toISOString();
        const { error } = await sb.from('mesa_messages').update({ body, edited_at }).eq('id', id);
        if (error) { toast('Não foi possível editar: ' + error.message); return; }
        updateMesaMessage(mesaId, { ...msg, body, edited_at });
        return;
      }

      /* Anexo de imagem (faixa acima da caixa de texto) */
      if (target.closest('[data-attach-cancel]')) {
        attachFile = null;
        form.querySelector('[data-chat-attach]').hidden = true;
        return;
      }
      const attachSend = target.closest('[data-attach-send]');
      if (attachSend && attachFile) {
        const title = form.querySelector('[data-attach-title]').value.trim() || prettyFileTitle(attachFile);
        attachSend.disabled = true;
        try {
          await uploadChatImage(mesa, attachFile, title);
          attachFile = null;
          form.querySelector('[data-chat-attach]').hidden = true;
          chatState.renderTool('acervo');
        } catch (err) { console.error(err); toast('Imagem não enviada: ' + (err.message || err)); }
        finally { attachSend.disabled = false; }
      }
    });

    /* Enter nos campos das ferramentas */
    root.addEventListener('keydown', async (event) => {
      if (event.target.closest('.chat-spoiler') && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        event.target.closest('.chat-spoiler').classList.add('is-open');
        return;
      }
      if (event.key === 'Escape') { closeMenu(); return; }
      if (event.key !== 'Enter') return;
      const condInput = event.target.closest('[data-cond-input]');
      if (condInput) {
        event.preventDefault();
        const name = condInput.value.trim();
        const { c, n } = condTarget(condInput.closest('[data-cond-target]').dataset.condTarget);
        if (!name) return;
        if (c) { c.statuses = [...(c.statuses || []), { name }]; saveFicha(c); }
        else if (n) await saveNpcCombat(n, { conds: [...npcCombat(n).conds, name] });
        renderTool();
        root.querySelector('[data-cond-input]')?.focus();
        return;
      }
      if (event.target.closest('[data-dice-expr]')) {
        event.preventDefault();
        root.querySelector('[data-chat-roll]')?.click();
        return;
      }
      if (event.target.closest('[data-npc-name]')) {
        event.preventDefault();
        event.target.blur();
        return;
      }
      if (event.target.closest('[data-chat-avulso-name]')) {
        event.preventDefault();
        addAvulso();
      }
    });

    root.addEventListener('change', async (event) => {
      const notifyBox = event.target.closest('[data-notify], [data-notify-mute]');
      if (notifyBox) {
        const prefs = notifyPrefs();
        if (notifyBox.hasAttribute('data-notify-mute')) {
          prefs.muted = { ...(prefs.muted || {}) };
          if (notifyBox.checked) prefs.muted[mesaId] = true; else delete prefs.muted[mesaId];
        } else if (notifyBox.dataset.notify === 'sound') {
          prefs.sound = notifyBox.checked;
          if (prefs.sound) playChime();
        } else if (notifyBox.dataset.notify === 'system') {
          prefs.system = false;
          if (notifyBox.checked && 'Notification' in window) {
            const permission = await Notification.requestPermission();
            prefs.system = permission === 'granted';
            if (prefs.system) {
              await registerNotifyWorker();
              showSystemNotification('O Arcano', 'Avisos ativados para as suas mesas.', `#/Mesas/${mesaId}/chat`, 'arcano-teste');
            } else {
              toast('O navegador não permitiu os avisos.');
            }
          }
        }
        setNotifyPrefs(prefs);
        renderTool();
        return;
      }
      const acervoFile = event.target.closest('[data-acervo-file]');
      if (acervoFile && acervoFile.files[0]) {
        const title = root.querySelector('[data-acervo-title]');
        if (title && !title.value) title.value = prettyFileTitle(acervoFile.files[0]);
        acervoFile.closest('label').firstChild.textContent = acervoFile.files[0].name.slice(0, 24);
      }
      const npcName = event.target.closest('[data-npc-name]');
      if (npcName) {
        const name = npcName.value.trim().slice(0, 80);
        const { c, n } = condTarget(npcName.dataset.npcName);
        if (!name) { npcName.value = c ? c.name : (n ? n.title : ''); return; }
        try {
          if (c && name !== c.name) {
            c.name = name;
            const saved = await updateCharacter(c);
            Object.assign(c, saved);
          } else if (n && name !== n.title) {
            const { error } = await sb.from('mesa_npcs').update({ title: name, updated_at: new Date().toISOString() }).eq('id', n.id);
            if (error) throw error;
            n.title = name;
          }
          setSpeaker(chatState.speakerKey);
          renderTool();
        } catch (err) { toast('Nome não salvo: ' + (err.message || err)); }
      }
    });

    /* Notas salvam sozinhas; expressão de dados edita o monte. */
    root.addEventListener('input', (event) => {
      const editor = event.target.closest('[data-chat-notes]');
      if (editor) { saveNote(editor); return; }
      const expr = event.target.closest('[data-dice-expr]');
      if (expr) {
        chatState.expr = expr.value;
        chatState.stageResult = null;
        chatState.stageSides = 0;
        syncDice({ fromInput: true });
        return;
      }
      const cenaField = event.target.closest('[data-cena-title], [data-cena-body], [data-cena-image]');
      if (cenaField) {
        chatState.sceneDraft = {
          title: root.querySelector('[data-cena-title]')?.value || '',
          body: root.querySelector('[data-cena-body]')?.value || '',
          imageId: root.querySelector('[data-cena-image]')?.value || ''
        };
      }
    });

    if (!form) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const raw = textarea.value;
      if (!raw.trim()) return;
      const parsed = parseChatInput(mesa, raw);
      if (parsed.error) { toast(parsed.error); return; }
      if (parsed.scene) {
        chatState.sceneDraft = { ...(chatState.sceneDraft || {}), title: parsed.scene.title };
        textarea.value = '';
        commands.hidden = true;
        openTool('cena');
        root.querySelector('[data-cena-body]')?.focus();
        return;
      }
      // A caixa nunca é desativada: desativar tira o foco e fecha o teclado do celular.
      // O texto sai na hora e volta só se o envio falhar.
      textarea.value = '';
      textarea.style.height = '';
      commands.hidden = true;
      try {
        if (parsed.roll) await sendChatRoll(mesa, parsed.roll, { secret: parsed.secret });
        else await sendChatMessage(mesaId, parsed.message);
      } catch (err) {
        console.error(err);
        toast('Mensagem não enviada: ' + (err.message || err));
        if (!textarea.value) textarea.value = raw;
      }
    });

    // NPC avulso: só um nome, guardado neste navegador para reusar.
    function addAvulso() {
      const input = menu.querySelector('[data-chat-avulso-name]');
      const name = (input?.value || '').trim().slice(0, 60);
      if (!name) { input?.focus(); return; }
      const list = chatAvulsos(mesaId).filter((a) => normalize(a.name) !== normalize(name));
      list.unshift({ name });
      storageSet(avulsosKey(mesaId), list.slice(0, 12));
      setSpeaker(`a:${name}`);
      closeMenu();
      textarea.focus();
    }
    menu.addEventListener('click', (event) => {
      if (event.target.closest('[data-chat-avulso-add]')) addAvulso();
    });

    // Formatação: envolve o trecho selecionado (ou abre o par e põe o cursor no meio).
    const CHAT_WRAPS = { action: ['**', '**'], speech: ['-- ', ' --'], thought: ['((', '))'], spoiler: ['||', '||'] };
    form.querySelector('.chat__fmt')?.addEventListener('pointerdown', (event) => {
      if (event.target.closest('[data-chat-wrap]')) event.preventDefault();
    });
    form.querySelector('.chat__fmt')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-chat-wrap]');
      if (!button) return;
      const kind = button.dataset.chatWrap;
      const value = textarea.value;
      if (kind === 'turn') {
        if (!/>>\s*$/.test(value)) textarea.value = `${value.replace(/\s+$/, '')}${value.trim() ? '\n' : ''}>>`;
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      } else {
        const [open, close] = CHAT_WRAPS[kind];
        const start = textarea.selectionStart ?? value.length;
        const end = textarea.selectionEnd ?? value.length;
        const picked = value.slice(start, end);
        textarea.value = value.slice(0, start) + open + picked + close + value.slice(end);
        const caret = picked ? start + open.length + picked.length + close.length : start + open.length;
        textarea.setSelectionRange(caret, caret);
      }
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Tocar em Enviar não tira o foco: o teclado continua aberto entre mensagens.
    form.querySelector('.chat-icon-button--send')?.addEventListener('pointerdown', (event) => {
      if (document.activeElement === textarea) event.preventDefault();
    });

    // Digitando no celular: ferramentas saem de cena para sobrar espaço ao chat.
    textarea.addEventListener('focus', () => {
      if (isCompactChat()) side?.classList.add('is-typing');
    });
    textarea.addEventListener('blur', () => {
      setTimeout(() => {
        if (!document.activeElement || !document.activeElement.closest('.chat__composer')) side?.classList.remove('is-typing');
      }, 150);
    });

    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !isCompactChat()) {
        event.preventDefault();
        form.requestSubmit();
      }
    });
    textarea.addEventListener('input', () => {
      const value = textarea.value;
      textarea.style.height = '';
      textarea.style.height = `${Math.min(180, textarea.scrollHeight)}px`;
      commands.hidden = !(value.startsWith('/') && !/\s/.test(value));
      if (!commands.hidden) {
        const typed = value.toLowerCase();
        commands.querySelectorAll('[data-chat-command]').forEach((b) => {
          b.closest('li').hidden = !b.dataset.chatCommand.startsWith(typed);
        });
      }
      if (value.trim()) notifyTyping(mesaId);
    });

    form.querySelector('[data-chat-image]')?.addEventListener('change', (event) => {
      const input = event.target;
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      attachFile = file;
      const strip = form.querySelector('[data-chat-attach]');
      strip.hidden = false;
      const thumb = strip.querySelector('[data-attach-thumb]');
      if (thumb.src.startsWith('blob:')) URL.revokeObjectURL(thumb.src);
      thumb.src = URL.createObjectURL(file);
      const title = strip.querySelector('[data-attach-title]');
      title.value = prettyFileTitle(file);
      title.focus();
      title.select();
    });
    form.querySelector('[data-attach-title]')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); form.querySelector('[data-attach-send]').click(); }
    });
  }

  function mesaFichasPanel(mesa, characters) {
    const base = `#/Mesas/${encodeURIComponent(mesa.id)}/fichas`;
    const loose = CHARACTERS.filter((c) => !c.mesaId && c.userId === auth.user?.id);
    const hasMine = characters.some((c) => c.userId === auth.user?.id);
    if (mesa.role === 'observador') {
      return characters.length
        ? `<section class="entry-grid">${characters.map((c, i) => characterCardHTML(c, i, { owner: memberName(mesa.id, c.userId) })).join('')}</section>`
        : '<p class="mesa-notice mesa-notice--soft">Nenhuma ficha nesta mesa ainda.</p>';
    }
    return `
      ${loose.length ? `
        <form class="mesa-inline-form" id="mesaLinkCharacterForm" data-mesa-id="${escapeHtml(mesa.id)}">
          <label for="mesaLinkCharacter"><strong>Trazer uma ficha antiga</strong><span>Fichas suas que ainda não estão em nenhuma mesa.</span></label>
          <select id="mesaLinkCharacter" name="character" required>
            ${loose.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name || 'Sem nome')}</option>`).join('')}
          </select>
          <button type="submit" class="btn btn-ghost"><span>Trazer para a mesa</span></button>
        </form>` : ''}
      <section class="entry-grid">
        <a href="${base}/criar" class="entry-card create-card" style="--hue:${themeOf('Persona').hue};--delay:0ms" aria-label="Criar ficha nesta mesa">
          <div class="create-card__inner">
            <div class="create-card__plus">
              <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <span class="create-card__label">Criar ficha</span>
            <span class="create-card__hint">${hasMine ? 'Mais um personagem' : 'Seu personagem nesta mesa'}</span>
          </div>
        </a>
        ${characters.map((c, i) => characterCardHTML(c, i + 1, { owner: memberName(mesa.id, c.userId) })).join('')}
      </section>`;
  }

  function npcCardHTML(mesa, npc, i) {
    const href = `#/Mesas/${encodeURIComponent(mesa.id)}/npcs/${encodeURIComponent(npc.id)}`;
    return `
      <a href="${href}" class="entry-card npc-card ${npc.visible ? '' : 'is-hidden-npc'}" style="--hue:${themeOf('Bestiario').hue};--delay:${i * 40}ms">
        <div class="entry-card__media">
          ${npc.image ? `<img loading="lazy" decoding="async" src="${npc.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
          <div class="entry-card__fallback">${iconOf('Bestiario')}</div>
          <div class="entry-card__shade"></div>
          ${mesa.role !== 'jogador' ? `<div class="entry-card__tags"><span class="char-badge ${npc.visible ? 'char-badge--mage' : 'char-badge--mundane'}">${npc.visible ? 'Revelado' : 'Oculto'}</span></div>` : ''}
        </div>
        <div class="entry-card__body">
          <h3 class="entry-card__title">${escapeHtml(npc.title)}</h3>
          <p class="entry-card__summary">${escapeHtml(npc.summary || '')}</p>
        </div>
      </a>`;
  }

  function mesaNpcsPanel(mesa, npcs) {
    const master = mesa.role === 'mestre';
    const base = `#/Mesas/${encodeURIComponent(mesa.id)}/npcs`;
    const bestiary = entriesIn('Bestiario').slice().sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
    const shown = (master || mesa.role === 'observador') ? npcs : npcs.filter((n) => n.visible);
    const npcCharsFor = (m) => CHARACTERS.filter((c) => c.mesaId === m.id && c.isNpc);
    return `
      ${master ? `
        <p class="mesa-notice mesa-notice--soft">Os jogadores só veem os NPCs que você revelar.</p>
        ${bestiary.length ? `
          <form class="mesa-inline-form" id="mesaImportNpcForm" data-mesa-id="${escapeHtml(mesa.id)}">
            <label for="mesaImportNpc"><strong>Trazer do Bestiário</strong><span>Copia a ficha da criatura para esta mesa. Você pode editar a cópia.</span></label>
            <select id="mesaImportNpc" name="entry" required>
              ${bestiary.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title)}</option>`).join('')}
            </select>
            <button type="submit" class="btn btn-ghost"><span>Adicionar</span></button>
          </form>` : ''}` : ''}
      <section class="entry-grid">
        ${master ? `
          <a href="${base}/criar" class="entry-card create-card" style="--hue:${themeOf('Bestiario').hue};--delay:0ms" aria-label="Criar NPC">
            <div class="create-card__inner">
              <div class="create-card__plus">
                <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <span class="create-card__label">Criar NPC</span>
              <span class="create-card__hint">Raça e HP automáticos</span>
            </div>
          </a>` : ''}
        ${npcCharsFor(mesa).map((c, i) => characterCardHTML(c, i + 1, { owner: mesa.role === 'jogador' ? '' : (c.npcVisible ? 'Revelado' : 'Oculto') })).join('')}
        ${shown.map((n, i) => npcCardHTML(mesa, n, i + 1)).join('')}
      </section>
      ${!master && !shown.length && !npcCharsFor(mesa).length ? `<p class="mesa-notice mesa-notice--soft">${mesa.role === 'observador' ? 'Nenhum NPC nesta mesa.' : 'O Mestre ainda não revelou nenhum NPC.'}</p>` : ''}`;
  }

  function mesaMembersPanel(mesa, members) {
    const master = mesa.role === 'mestre';
    const inviteUrl = `${location.origin}${location.pathname}#/Mesas/entrar/${mesa.inviteCode}`;
    return `
      ${master ? `
        <section class="mesa-invite">
          <div><strong>Convite</strong><span>Envie o link ao seu grupo. Quem abrir entra como jogador.</span></div>
          <code>${escapeHtml(inviteUrl)}</code>
          <button type="button" class="btn btn-primary" data-mesa-copy="${escapeHtml(inviteUrl)}"><span>Copiar link</span></button>
        </section>` : ''}
      ${mesa.ownerId === auth.user?.id ? `
        <form class="mesa-password" id="mesaSetPasswordForm" data-mesa-id="${escapeHtml(mesa.id)}">
          <div><strong>Senha</strong><span>${mesa.hasPassword ? 'Ativa. Quem abrir o convite precisa dela.' : 'Sem senha.'}</span></div>
          <input type="password" name="password" autocomplete="new-password" minlength="4" maxlength="72" placeholder="${mesa.hasPassword ? 'Nova senha' : 'Definir senha'}" aria-label="Senha da mesa">
          <button type="submit" class="btn btn-primary"><span>${mesa.hasPassword ? 'Trocar' : 'Definir'}</span></button>
          ${mesa.hasPassword ? '<button type="button" class="btn btn-ghost" data-mesa-password-remove>Remover</button>' : ''}
        </form>` : ''}
      <ul class="mesa-members">
        ${members.map((m) => `
          <li>
            <span class="mesa-members__name">${escapeHtml(m.displayName || 'Jogador')}${m.userId === auth.user?.id ? ' <small>(você)</small>' : ''}</span>
            <span class="char-badge ${m.role === 'mestre' ? 'char-badge--mage' : 'char-badge--mundane'}">${escapeHtml(mesaRoleLabel(m.role))}</span>
            ${master && m.userId !== auth.user?.id ? `<button type="button" class="back-link back-link--danger" data-mesa-remove-member="${escapeHtml(m.userId)}">Remover</button>` : ''}
          </li>`).join('')}
      </ul>
      ${mesa.role === 'observador' ? '' : `<div class="mesa-danger">
        ${mesa.ownerId === auth.user?.id
          ? `<button type="button" class="back-link back-link--danger" data-mesa-delete="${escapeHtml(mesa.id)}">Apagar mesa</button>`
          : `<button type="button" class="back-link back-link--danger" data-mesa-leave="${escapeHtml(mesa.id)}">Sair da mesa</button>`}
      </div>`}`;
  }

  /* ── NPC (#/Mesas/<id>/npcs/<npc>) ───────────── */
  function viewMesaNpc(mesa, npcId) {
    const npc = (MESA_NPCS[mesa.id] || []).find((n) => n.id === npcId);
    if (!npc) return viewNotFound(npcId);
    viewedNpc = npc;
    const base = `#/Mesas/${encodeURIComponent(mesa.id)}/npcs`;
    const master = mesa.role === 'mestre';
    const crumb = `<nav class="breadcrumb"><a href="#/Mesas">Mesas</a><span>/</span><a href="#/Mesas/${encodeURIComponent(mesa.id)}">${escapeHtml(mesa.name)}</a><span>/</span><a href="${base}">NPCs</a><span>/</span><span class="breadcrumb__current">${escapeHtml(npc.title)}</span></nav>`;
    const actions = `
      ${master ? `
        <button type="button" class="back-link back-link--edit" data-npc-visibility="${escapeHtml(npc.id)}">${npc.visible ? 'Ocultar dos jogadores' : 'Revelar aos jogadores'}</button>
        <a class="back-link back-link--edit" href="${base}/${encodeURIComponent(npc.id)}/editar">Editar NPC</a>
        <button type="button" class="back-link back-link--danger" data-npc-delete="${escapeHtml(npc.id)}">Apagar NPC</button>` : ''}
      <a href="${base}" class="back-link">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Voltar aos NPCs
      </a>`;
    return viewEntry('Bestiario', npc.id, { entry: npc, crumb, actions });
  }

  /* ── PAINEL (#/Painel) — Platina troca o nivel das contas ── */
  let PANEL_USERS = [];

  async function loadPanelUsers() {
    if (!sb || !auth.isPlatina) return;
    const { data, error } = await sb
      .from('access_requests')
      .select('user_id,email,display_name,tier,created_at')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Erro ao carregar contas:', error);
      PANEL_USERS = [];
      return;
    }
    PANEL_USERS = data || [];
  }

  function viewPanel() {
    if (!auth.isPlatina) return viewForbidden();
    const theme = themeOf('Painel');
    const counts = PANEL_USERS.reduce((acc, u) => { acc[u.tier] = (acc[u.tier] || 0) + 1; return acc; }, {});
    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf('Painel')}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title" data-text-reveal>Painel de contas</h1>
          <p class="cat-hero__tone">Defina o nível de cada conta. Você não pode alterar o seu próprio nível.</p>
          <div class="cat-hero__meta">
            ${Object.keys(TIERS).filter((t) => counts[t]).map((t) => `<span class="badge"><strong>${counts[t]}</strong> ${escapeHtml(TIERS[t].label)}</span>`).join('')}
          </div>
        </div>
      </section>
      <ul class="tier-legend">
        ${TIERS_ACTIVE.map((t) => `<li><span class="role-pill" data-role="${t}"><strong>${escapeHtml(TIERS[t].label.toUpperCase())}</strong></span>${escapeHtml(TIERS[t].tone)}</li>`).join('')}
      </ul>
      <ul class="panel-users" id="panelUsers">
        ${PANEL_USERS.map((u) => {
          const self = u.user_id === auth.user?.id;
          const options = [...new Set([...TIERS_ACTIVE, u.tier])].filter((t) => TIERS[t]);
          return `
            <li>
              <span class="panel-users__who">
                <strong>${escapeHtml(u.display_name || 'Sem nome')}${self ? ' <small>(você)</small>' : ''}</strong>
                <small>${escapeHtml(u.email || '')}</small>
              </span>
              <select data-tier-user="${escapeHtml(u.user_id)}" aria-label="Nível de ${escapeHtml(u.display_name || u.email || 'conta')}" ${self ? 'disabled' : ''}>
                ${options.map((t) => `<option value="${t}" ${t === u.tier ? 'selected' : ''}>${escapeHtml(TIERS[t].label)}</option>`).join('')}
              </select>
            </li>`;
        }).join('')}
      </ul>`;
  }

  function attachPanelHandlers() {
    const list = document.getElementById('panelUsers');
    if (!list || list.dataset.bound) return;
    list.dataset.bound = '1';
    list.addEventListener('change', async (event) => {
      const select = event.target.closest('[data-tier-user]');
      if (!select) return;
      const user = PANEL_USERS.find((u) => u.user_id === select.dataset.tierUser);
      if (!user) return;
      const previous = user.tier;
      const next = select.value;
      const name = user.display_name || user.email || 'esta conta';
      if (!(await askConfirm(`Mudar ${name} de ${tierLabel(previous)} para ${tierLabel(next)}?`, { confirmLabel: 'Mudar nível' }))) {
        select.value = previous;
        return;
      }
      select.disabled = true;
      const { error } = await sb.rpc('set_user_tier', { p_user: user.user_id, p_tier: next });
      select.disabled = false;
      if (error) {
        console.error(error);
        toast('Não foi possível mudar o nível: ' + error.message);
        select.value = previous;
        return;
      }
      user.tier = next;
      toast(`${name} agora é ${tierLabel(next)}.`);
    });
  }

  /* ── Handlers ────────────────────────────────── */
  function attachMesaHandlers() {
    const createForm = document.getElementById('mesaCreateForm');
    if (createForm && !createForm.dataset.bound) {
      createForm.dataset.bound = '1';
      createForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(createForm);
        const name = String(data.get('name') || '').trim();
        if (!name) return;
        const button = createForm.querySelector('[type="submit"]');
        button.disabled = true;
        try {
          const mesa = await createMesa({
            name,
            description: String(data.get('description') || '').trim(),
            system: String(data.get('system') || 'arcano')
          });
          location.hash = `#/Mesas/${encodeURIComponent(mesa.id)}/membros`;
        } catch (err) {
          console.error(err);
          toast('Erro ao criar mesa: ' + (err.message || err));
          button.disabled = false;
        }
      });
    }

    const passwordForm = document.getElementById('mesaPasswordForm');
    if (passwordForm && !passwordForm.dataset.bound) {
      passwordForm.dataset.bound = '1';
      passwordForm.querySelector('input').focus();
      passwordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = passwordForm.querySelector('input');
        const errorEl = passwordForm.querySelector('[data-lock-error]');
        const button = passwordForm.querySelector('[type="submit"]');
        button.disabled = true;
        errorEl.textContent = '';
        try {
          const mesaId = await joinMesa(passwordForm.dataset.code, input.value);
          mesaJoinPrompt = null;
          location.replace(`#/Mesas/${encodeURIComponent(mesaId)}`);
        } catch (err) {
          errorEl.textContent = isPasswordError(err, 'MESA_SENHA_INCORRETA') ? 'Senha incorreta.' : ('Não foi possível entrar: ' + (err.message || err));
          input.select();
          button.disabled = false;
        }
      });
    }

    const setPasswordForm = document.getElementById('mesaSetPasswordForm');
    if (setPasswordForm && !setPasswordForm.dataset.bound) {
      setPasswordForm.dataset.bound = '1';
      const mesaId = setPasswordForm.dataset.mesaId;
      const savePassword = async (password) => {
        const { error } = await sb.rpc('set_mesa_password', { p_mesa: mesaId, p_password: password });
        if (error) { toast('Senha não salva: ' + error.message); return; }
        const mesa = mesaById(mesaId);
        if (mesa) mesa.hasPassword = !!password;
        toast(password ? 'Senha definida.' : 'Senha removida.');
        render(true);
      };
      setPasswordForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = setPasswordForm.querySelector('input').value;
        if (value.length < 4) { setPasswordForm.querySelector('input').focus(); return; }
        savePassword(value);
      });
      setPasswordForm.querySelector('[data-mesa-password-remove]')?.addEventListener('click', async () => {
        if (!(await askConfirm('Remover a senha da mesa? Qualquer pessoa com o convite poderá entrar.', { confirmLabel: 'Remover' }))) return;
        savePassword(null);
      });
    }

    const joinForm = document.getElementById('mesaJoinForm');
    if (joinForm && !joinForm.dataset.bound) {
      joinForm.dataset.bound = '1';
      joinForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const raw = String(new FormData(joinForm).get('code') || '').trim();
        const code = (raw.match(/entrar\/([a-z0-9]+)/i) || [null, raw])[1];
        if (code) location.hash = `#/Mesas/entrar/${encodeURIComponent(code)}`;
      });
    }

    attachMesaChat();

    const panel = document.querySelector('[data-mesa-panel]');
    if (panel && !panel.dataset.bound) {
      panel.dataset.bound = '1';
      const mesaId = panel.dataset.mesaId;
      panel.addEventListener('click', async (event) => {
        const copy = event.target.closest('[data-mesa-copy]');
        if (copy) {
          try {
            await navigator.clipboard.writeText(copy.dataset.mesaCopy);
            toast('Link de convite copiado.');
          } catch {
            toast('Copie o link manualmente.');
          }
          return;
        }
        const remove = event.target.closest('[data-mesa-remove-member]');
        if (remove) {
          const userId = remove.dataset.mesaRemoveMember;
          if (!(await askConfirm(`Remover ${memberName(mesaId, userId)} da mesa?`, { confirmLabel: 'Remover', danger: true }))) return;
          const { error } = await sb.from('mesa_members').delete().eq('mesa_id', mesaId).eq('user_id', userId);
          if (error) { toast('Erro ao remover: ' + error.message); return; }
          render(true);
          return;
        }
        const leave = event.target.closest('[data-mesa-leave]');
        if (leave) {
          if (!(await askConfirm('Sair desta mesa? Suas fichas continuam salvas.', { confirmLabel: 'Sair', danger: true }))) return;
          const { error } = await sb.from('mesa_members').delete().eq('mesa_id', mesaId).eq('user_id', auth.user.id);
          if (error) { toast('Erro ao sair: ' + error.message); return; }
          MESAS = MESAS.filter((m) => m.id !== mesaId);
          location.hash = '#/Mesas';
          return;
        }
        const drop = event.target.closest('[data-mesa-delete]');
        if (drop) {
          const mesa = mesaById(mesaId);
          if (!(await askConfirm(`Apagar a mesa "${mesa?.name}"? O chat e os NPCs serão apagados. As fichas continuam com os jogadores.`, { confirmLabel: 'Apagar mesa', danger: true }))) return;
          const { error } = await sb.from('mesas').delete().eq('id', mesaId);
          if (error) { toast('Erro ao apagar: ' + error.message); return; }
          MESAS = MESAS.filter((m) => m.id !== mesaId);
          location.hash = '#/Mesas';
        }
      });
    }

    const linkForm = document.getElementById('mesaLinkCharacterForm');
    if (linkForm && !linkForm.dataset.bound) {
      linkForm.dataset.bound = '1';
      linkForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const mesaId = linkForm.dataset.mesaId;
        const id = linkForm.querySelector('select').value;
        const { error } = await sb.from('characters').update({ mesa_id: mesaId }).eq('id', id);
        if (error) { toast('Erro ao trazer a ficha: ' + error.message); return; }
        const c = characterById(id);
        if (c) c.mesaId = mesaId;
        render(true);
      });
    }

    const importForm = document.getElementById('mesaImportNpcForm');
    if (importForm && !importForm.dataset.bound) {
      importForm.dataset.bound = '1';
      importForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const mesaId = importForm.dataset.mesaId;
        const button = importForm.querySelector('[type="submit"]');
        button.disabled = true;
        try {
          const npc = await importBestiaryNpc(mesaId, importForm.querySelector('select').value);
          location.hash = `#/Mesas/${encodeURIComponent(mesaId)}/npcs/${encodeURIComponent(npc.id)}`;
        } catch (err) {
          console.error(err);
          toast('Erro ao adicionar NPC: ' + (err.message || err));
          button.disabled = false;
        }
      });
    }

    document.querySelectorAll('[data-npc-visibility]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const npc = viewedNpc;
        if (!npc || npc.id !== btn.dataset.npcVisibility) return;
        const { error } = await sb.from('mesa_npcs').update({ visible: !npc.visible, updated_at: new Date().toISOString() }).eq('id', npc.id);
        if (error) { toast('Erro: ' + error.message); return; }
        npc.visible = !npc.visible;
        toast(npc.visible ? 'NPC revelado aos jogadores.' : 'NPC oculto dos jogadores.');
        render(true);
      });
    });

    document.querySelectorAll('[data-npc-delete]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const npc = viewedNpc;
        if (!npc || npc.id !== btn.dataset.npcDelete) return;
        if (!(await askConfirm(`Apagar o NPC "${npc.title}"? Esta ação não pode ser desfeita.`, { confirmLabel: 'Apagar', danger: true }))) return;
        const { error } = await sb.from('mesa_npcs').delete().eq('id', npc.id);
        if (error) { toast('Erro ao apagar: ' + error.message); return; }
        if (npc.imagePath) await removeBanner(npc.imagePath);
        MESA_NPCS[npc.mesaId] = (MESA_NPCS[npc.mesaId] || []).filter((n) => n.id !== npc.id);
        location.hash = `#/Mesas/${encodeURIComponent(npc.mesaId)}/npcs`;
      });
    });
  }

  /* ════════════════════════════════════════════════
     FICHAS DE PERSONAGEM — views (aba Persona)
     ════════════════════════════════════════════════ */

  /* Lê o dossiê de uma raça, aceitando tanto o Atlas novo quanto o formato antigo. */
  function raceDataFor(raceId) {
    const race = raceId ? entryById(raceId) : null;
    const fields = (race && race.fields) || {};
    const hp = {};
    raceAnatomy(fields).forEach((part) => { if (part.name && part.hp !== '') hp[part.name] = String(part.hp); });
    return {
      race,
      mod: normalizeRaceAttributes(fields),
      hp,
      mana: fields['Mana'] || ''
    };
  }

  /* Movimento (regra Combate em Grid): Deslocamento da raça + 1q por dado de
     Destreza além do primeiro. 1 quadrado = 1 metro. */
  function raceDisplacementOf(raceId) {
    const race = raceDataFor(raceId).race;
    const m = String(((race && race.fields) || {}).Deslocamento || '').match(/\d+/);
    return m ? Math.max(0, parseInt(m[0], 10)) : 1;
  }
  function computedMovementFor(raceId, dexDice) {
    return raceDisplacementOf(raceId) + Math.max(0, (Number(dexDice) || 1) - 1);
  }
  function movementTyped(c) {
    const idn = (c && c.identity) || {};
    return String(idn.movement || idn.movimento || '').trim();
  }
  function movementLabelOf(c, A) {
    const dex = A && A.Destreza ? A.Destreza.dice : 1;
    return movementTyped(c) || `${computedMovementFor(c && c.raceId, dex)}m`;
  }

  function characterHpFormHTML(values) {
    const data = values || {};
    const parts = hpPartKeys(data);
    const visible = parts.length ? parts : RACE_HP_PARTS;
    return visible.map((part) => `<label class="hp-form__row"><span class="hp-form__name">${escapeHtml(part)}</span><input type="text" inputmode="numeric" class="create-form__input hp-form__input" data-hp-part="${escapeHtml(part)}" value="${escapeHtml(data[part] != null ? data[part] : '')}" maxlength="9"></label>`).join('');
  }


  /* ── ROSTER (#/Persona) ───────────────────────── */
  function viewPersonaRoster() {
    const tab = tabById('Persona');
    const theme = themeOf('Persona');
    const mine = auth.user ? CHARACTERS.filter((c) => c.userId === auth.user.id) : [];
    const others = auth.isPlatina && auth.user
      ? CHARACTERS.filter((c) => c.userId !== auth.user.id)
      : [];

    const heroMine = `
      <section class="entry-grid">
        ${characterCreateCardHTML()}
        ${mine.map((c, i) => characterCardHTML(c, i + 1)).join('')}
      </section>
    `;

    const othersBlock = (auth.isPlatina && others.length) ? `
      <section class="section">
        <header class="section__head">
          <div>
            <span class="section__eyebrow">VISÃO PLATINA</span>
            <h2 class="section__title">Fichas de outros jogadores</h2>
          </div>
        </header>
        <div class="entry-grid">
          ${others.map((c, i) => characterCardHTML(c, i, { showOwner: true })).join('')}
        </div>
      </section>
    ` : '';

    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf('Persona')}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title" data-text-reveal>Personas</h1>
          <p class="cat-hero__tone">Crie e gerencie suas fichas de personagem. Cada ficha é vinculada à sua conta.</p>
          <div class="cat-hero__meta">
            <span class="badge"><strong>${mine.length}</strong> ${mine.length === 1 ? 'ficha sua' : 'fichas suas'}</span>
            ${auth.isPlatina && others.length ? `<span class="badge badge-soft">${others.length} de outros</span>` : ''}
          </div>
        </div>
      </section>
      ${heroMine}
      ${othersBlock}
    `;
  }

  function characterCreateCardHTML() {
    const theme = themeOf('Persona');
    return `
      <a href="#/Persona/criar" class="entry-card create-card" style="--hue:${theme.hue};--delay:0ms" aria-label="Criar nova ficha de personagem">
        <div class="create-card__inner">
          <div class="create-card__plus">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span class="create-card__label">Criar ficha</span>
          <span class="create-card__hint">Nova persona</span>
        </div>
      </a>
    `;
  }

  function characterCardHTML(c, i, opts = {}) {
    const theme = themeOf('Persona');
    const awk = normalizeAwakening(c.magic);
    const isMage = awkIsAcceptedMage(awk);
    const sc = isMage ? (schoolById(awk.school) || null) : null;
    const mageLabel = isMage ? ('Mago' + (sc ? ' · ' + sc.name : '')) : 'Não-mago';
    const owner = opts.showOwner && c.identity && c.identity.ownerLabel ? c.identity.ownerLabel : '';
    return `
      <a href="${characterBase(c)}/${encodeURIComponent(c.id)}" class="entry-card char-card" style="--hue:${theme.hue};--delay:${i * 40}ms">
        <div class="entry-card__media">
          ${c.image ? `<img loading="lazy" decoding="async" src="${c.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
          <div class="entry-card__fallback">${iconOf('Persona')}</div>
          <div class="entry-card__shade"></div>
          <div class="entry-card__tags">
            <span class="char-badge char-badge--${isMage ? 'mage' : 'mundane'}">${escapeHtml(mageLabel)}</span>
          </div>
        </div>
        <div class="entry-card__body">
          <h3 class="entry-card__title">${escapeHtml(c.name || 'Sem nome')}</h3>
          <p class="entry-card__summary">${escapeHtml(c.raceName || 'Raça não definida')}</p>
          <div class="entry-card__chips">
            <span class="chip">Nv ${Number(c.identity?.level) || 1}</span>
            ${c.levelGrant && c.levelGrant.at ? '<span class="chip chip--level">nível liberado</span>' : ''}
            ${(opts.owner || owner) ? `<span class="chip">${escapeHtml(opts.owner || owner)}</span>` : ''}
            ${c.skills && c.skills.length ? `<span class="chip">${c.skills.length} ${c.skills.length === 1 ? 'perícia' : 'perícias'}</span>` : ''}
          </div>
        </div>
      </a>
    `;
  }

  /* ── FICHA VIVA: blocos interativos ───────────── */
  function hpRatioClass(cur, max) {
    const r = max > 0 ? cur / max : 0;
    return r > 0.5 ? 'is-ok' : (r > 0.25 ? 'is-warn' : 'is-low');
  }
  function vbarPct(cur, max) { return max > 0 ? Math.max(0, Math.min(100, Math.round(cur / max * 100))) : 0; }

  const DEF_REDUCTION = [0, 10, 20, 35, 50, 65, 75];
  const DEF_MAX_LEVEL = DEF_REDUCTION.length - 1;
  function parseDefense(v) {
    const m = String(v == null ? '' : v).match(/-?\d+/);
    return m ? parseInt(m[0], 10) : 0;
  }
  function clampDefLevel(v) {
    return Math.max(0, Math.min(DEF_MAX_LEVEL, parseInt(v, 10) || 0));
  }
  function defPct(level) {
    return DEF_REDUCTION[clampDefLevel(level)] || 0;
  }
  function itemDf(it) {
    return Number(it && (it.df ?? it.defense) || 0);
  }
  function itemDm(it) {
    return Number(it && (it.dm ?? it.magicDefense) || 0);
  }
  function dfBaseOf(c) {
    const v = (c.vitals && (c.vitals.df ?? c.vitals.defense)) || 0;
    return clampDefLevel(v);
  }
  function dmBaseOf(c) {
    return clampDefLevel(c.vitals && c.vitals.dm);
  }
  function dfFromItems(c) {
    return (Array.isArray(c.inventory) ? c.inventory : [])
      .filter((it) => it.equipped)
      .reduce((sum, it) => sum + itemDf(it), 0);
  }
  function dmFromItems(c) {
    return (Array.isArray(c.inventory) ? c.inventory : [])
      .filter((it) => it.equipped)
      .reduce((sum, it) => sum + itemDm(it), 0);
  }
  function totalDf(c) {
    return clampDefLevel(dfBaseOf(c) + dfFromItems(c));
  }
  function totalDm(c) {
    return clampDefLevel(dmBaseOf(c) + dmFromItems(c));
  }
  /* Atualiza o escudo no DOM sem re-renderizar o bloco inteiro. */
  function refreshDefense(c) {
    document.querySelectorAll('[data-df-total], [data-def-total]').forEach((el) => { el.textContent = totalDf(c); });
    document.querySelectorAll('[data-df-items], [data-def-items]').forEach((el) => { el.textContent = dfFromItems(c); });
    document.querySelectorAll('[data-df-pct]').forEach((el) => { el.textContent = defPct(totalDf(c)) + '%'; });
    document.querySelectorAll('[data-dm-total]').forEach((el) => { el.textContent = totalDm(c); });
    document.querySelectorAll('[data-dm-items]').forEach((el) => { el.textContent = dmFromItems(c); });
    document.querySelectorAll('[data-dm-pct]').forEach((el) => { el.textContent = defPct(totalDm(c)) + '%'; });
  }
  function refreshCharacterVitals(c) {
    const v = ensureVitals(c);
    const parts = hpPartKeys(v.hp);
    const hpCur = parts.reduce((sum, part) => sum + (Number(v.hp[part].cur) || 0), 0);
    const hpMax = parts.reduce((sum, part) => sum + (Number(v.hp[part].max) || 0), 0);
    document.querySelectorAll('[data-vital-hp-cur]').forEach((el) => { el.textContent = hpCur; });
    document.querySelectorAll('[data-vital-hp-max]').forEach((el) => { el.textContent = hpMax; });
    document.querySelectorAll('[data-vital-hp-fill]').forEach((el) => { el.style.width = vbarPct(hpCur, hpMax) + '%'; });
    if (v.mana) {
      document.querySelectorAll('[data-vital-mana-cur]').forEach((el) => { el.textContent = v.mana.cur; });
      document.querySelectorAll('[data-vital-mana-max]').forEach((el) => { el.textContent = v.mana.max; });
      document.querySelectorAll('[data-vital-mana-fill]').forEach((el) => { el.style.width = vbarPct(v.mana.cur, v.mana.max) + '%'; });
    }
  }
  function daAttrOf(c) {
    const idn = (c && c.identity) || {};
    return CHAR_ATTRIBUTES.includes(idn.daAttr) ? idn.daAttr : 'Destreza';
  }
  function daStateOf(c) {
    const raw = c && c.vitals ? c.vitals.da : null;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return {
        value: Number(raw.value) || 0,
        attr: CHAR_ATTRIBUTES.includes(raw.attr) ? raw.attr : daAttrOf(c),
        destiny: Number(raw.destiny) || 0,
        dice: Number(raw.dice) || 0,
        d6s: Array.isArray(raw.d6s) ? raw.d6s : []
      };
    }
    return { value: Number(raw) || 0, attr: daAttrOf(c), destiny: 0, dice: 0, d6s: [] };
  }
  function rollResultHTML(attr, roll, label = 'Resultado') {
    const reading = destinyReading(roll.destiny);
    const d6Text = Array.isArray(roll.d6s) && roll.d6s.length ? roll.d6s.join(' + ') : '-';
    return `
      <span class="saves-roll__attr">${escapeHtml(attr)}</span>
      <span class="saves-roll__parts">${fmtDice(roll.dice)} <b>${d6Text}</b> + 1d12 <b>${roll.destiny || '-'}</b></span>
      <span class="saves-roll__eq">=</span>
      <span class="saves-roll__total">${roll.total}</span>
      <span class="saves-roll__destiny"><strong>${escapeHtml(label)} · ${escapeHtml(reading.title)}</strong>${reading.text ? ` ${escapeHtml(reading.text)}` : ''}</span>
    `;
  }

  function vitalRowHTML(key, label, slot, canEdit, opts = {}) {
    const mana = !!opts.mana;
    const dmgLabel = mana ? 'Gastar' : 'Dano';
    const healLabel = mana ? 'Restaurar' : 'Curar';
    const actAttr = mana ? 'data-mana-act' : 'data-hp';
    const dmgVal = mana ? 'spend' : 'dmg';
    const healVal = mana ? 'restore' : 'heal';
    const rowAttr = mana ? 'data-mana' : `data-part="${escapeHtml(key)}"`;
    return `
      <div class="vrow ${mana ? 'vrow--mana' : hpRatioClass(slot.cur, slot.max)}" ${rowAttr}>
        <div class="vrow__top">
          <span class="vrow__name">${escapeHtml(label)}</span>
          <span class="vrow__num"><strong data-cur>${slot.cur}</strong> / <span data-max>${slot.max}</span></span>
        </div>
        <div class="vbar ${mana ? 'vbar--mana' : ''}"><span class="vbar__fill" data-fill style="width:${vbarPct(slot.cur, slot.max)}%"></span></div>
        ${canEdit ? `
          <div class="vrow__ctl">
            <input type="number" class="vrow__amt" min="1" value="1" aria-label="Valor">
            <button type="button" class="vbtn vbtn--dmg" ${actAttr}="${dmgVal}">${dmgLabel}</button>
            <button type="button" class="vbtn vbtn--heal" ${actAttr}="${healVal}">${healLabel}</button>
          </div>` : ''}
      </div>
    `;
  }

  function defenseShieldHTML(c, canEdit) {
    const block = (kind, label, total, base, items, pct) => `
      <div class="defense">
        <span class="defense__shield" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3z"/></svg>
          <strong class="defense__total" data-${kind}-total>${total}</strong>
        </span>
        <div class="defense__info">
          <span class="defense__label">${label}</span>
          <span class="defense__detail">
            base
            ${canEdit
              ? `<input type="number" class="defense__base" data-${kind}-base value="${base}" min="0" max="${DEF_MAX_LEVEL}" aria-label="${label} base">`
              : `<strong>${base}</strong>`}
            + itens <strong data-${kind}-items>${items}</strong>
          </span>
          <span class="defense__detail"><strong data-${kind}-pct>${pct}%</strong> de reducao</span>
        </div>
      </div>
    `;
    return `
      <div class="defense-grid">
        ${block('df', 'DF FISICA', totalDf(c), dfBaseOf(c), dfFromItems(c), defPct(totalDf(c)))}
        ${block('dm', 'DM MAGICA', totalDm(c), dmBaseOf(c), dmFromItems(c), defPct(totalDm(c)))}
      </div>
    `;
  }

  function charVitalsInner(c, canEdit) {
    const v = ensureVitals(c);
    syncArcaneCollapse(c);
    const parts = hpPartKeys(v.hp);
    if (!parts.length) return '<p class="char-empty">Nenhum campo de HP definido.</p>';
    const positions = {
      'Cabeça': 'head',
      'Peito': 'chest',
      'Abdômen': 'abdomen',
      'Braço Direito': 'arm-r',
      'Braço Esquerdo': 'arm-l',
      'Perna Direita': 'leg-r',
      'Perna Esquerda': 'leg-l'
    };
    const hasCustomAnatomy = parts.some((part) => !positions[part]);
    const hpRows = parts.map((part) => {
      const slot = v.hp[part];
      return `
        <div class="vrow arc-body-part arc-body-part--${positions[part] || 'other'} ${hpRatioClass(slot.cur, slot.max)}" data-part="${escapeHtml(part)}">
          <div class="vrow__top">
            <span class="vrow__name">${escapeHtml(part)}</span>
            <span class="vrow__num"><strong data-cur>${slot.cur}</strong> / <span data-max>${slot.max}</span></span>
          </div>
          <div class="vbar"><span class="vbar__fill" data-fill style="width:${vbarPct(slot.cur, slot.max)}%"></span></div>
          ${canEdit ? `
            <div class="vrow__ctl">
              <input type="number" class="vrow__amt" min="1" value="1" aria-label="Valor para ${escapeHtml(part)}">
              <button type="button" class="vbtn vbtn--dmg" data-hp="dmg" aria-label="Causar dano em ${escapeHtml(part)}">−</button>
              <button type="button" class="vbtn vbtn--heal" data-hp="heal" aria-label="Curar ${escapeHtml(part)}">+</button>
            </div>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="arc-anatomy-map ${hasCustomAnatomy ? 'arc-anatomy-map--custom' : ''}">
        <svg class="arc-anatomy-figure" viewBox="0 0 160 360" role="img" aria-label="Silhueta anatômica do personagem">
          <circle cx="80" cy="35" r="24" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M58 68 Q80 58 102 68 L111 157 Q101 188 96 211 L107 332 M62 332 L66 211 Q58 184 49 157 Z" fill="currentColor" fill-opacity=".05" stroke="currentColor" stroke-width="2"/>
          <path d="M51 78 L20 170 M109 78 L140 170" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/>
          <path d="M80 64 L80 210 M52 127 L108 127 M60 170 L100 170" fill="none" stroke="currentColor" stroke-width="1" opacity=".7"/>
        </svg>
        ${hpRows}
      </div>`;
  }

  function charManaInner(c, canEdit) {
    const v = ensureVitals(c);
    if (!v.mana) return '<p class="char-empty">Este personagem não possui Mana.</p>';
    return vitalRowHTML('mana', 'Mana', v.mana, canEdit, { mana: true });
  }

  function charStatusInner(c, canEdit) {
    const list = Array.isArray(c.statuses) ? c.statuses : [];
    const head = `<h3 class="arc-sheet-section__title"><span>${FICON.status}</span>Condições</h3>`;
    const body = list.length
      ? `<div class="status-chips">${list.map((s, i) => `
          <span class="status-chip">${escapeHtml(s.name || '')}${canEdit ? `<button type="button" class="status-chip__x" data-status-remove="${i}" aria-label="Remover ${escapeHtml(s.name || '')}">×</button>` : ''}</span>
        `).join('')}</div>`
      : '<p class="char-empty">Nenhuma condição ativa.</p>';
    const adder = canEdit ? `
      <div class="char-add">
        <input type="text" class="create-form__input" data-status-input placeholder="Adicionar condição" maxlength="60">
        <button type="button" class="btn btn-ghost" data-status-add>Adicionar</button>
      </div>` : '';
    return head + body + adder;
  }

  /* Livro de magias — grade de cards (estado vivo). */
  function spellRuntimeInfo(it) {
    const entry = it && it.refId ? entryById(it.refId) : null;
    const f = (entry && entry.fields) || {};
    const arcane = entry ? normalizeSpellArcaneFields(f) : {};
    const costValue = parseInt((f['Custo'] ?? it.costValue ?? ''), 10);
    const costUnit = safeCostUnit(String(f['CustoUnidade'] || it.costUnit || 'MP').trim() || 'MP');
    const costText = Number.isFinite(costValue) && costValue > 0 ? `${costValue} ${costUnit}` : '';
    return {
      costValue: Number.isFinite(costValue) && costValue > 0 ? costValue : 0,
      costUnit,
      costText,
      classification: arcane.classificacao || it.classification || '',
      affinity: f['Afinidade'] || it.affinity || '',
      duration: f['Duração'] || it.duration || ''
    };
  }

  function spellRuntimeMetaHTML(it, canEdit, index, vitals) {
    const info = spellRuntimeInfo(it);
    const chips = [
      info.costText ? `Custo ${info.costText}` : '',
      info.classification || '',
      info.affinity || '',
      info.duration ? `Duracao ${info.duration}` : ''
    ].filter(Boolean);
    if (!chips.length && !(canEdit && info.costUnit === 'MP' && info.costValue && vitals.mana)) return '';
    return `
      <div class="spell-card__meta">
        ${chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join('')}
        ${canEdit && info.costUnit === 'MP' && info.costValue && vitals.mana
          ? `<button type="button" class="spell-use" data-spell-cast="${index}" data-spell-cost="${info.costValue}">Gastar ${info.costValue} MP</button>`
          : ''}
      </div>
    `;
  }

  function charCodexListInner(c, canEdit, kind) {
    const list = Array.isArray(c.spells) ? c.spells : [];
    const codex = entriesIn('Magias');
    const v = ensureVitals(c);
    const bar = `
      <div class="spell-bar">
        <span class="spell-bar__mana">${FICON.mana}<span>Mana <b data-vital-mana-cur>${v.mana ? v.mana.cur : '—'}</b>${v.mana ? ` / <span data-vital-mana-max>${v.mana.max}</span>` : ''}</span></span>
        <span class="spell-bar__m">Magias conhecidas <b>${list.length}</b></span>
        <span class="spell-bar__spacer"></span>
        ${canEdit ? `<button type="button" class="btn-primary spell-bar__add" data-spell-focus><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Adicionar magia</button>` : ''}
      </div>`;

    const tools = list.length ? `
      <div class="ftools" data-filter-scope>
        <label class="fsearch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="search" data-filter placeholder="Pesquisar magia…"></label>
      </div>` : '';

    const cards = list.length ? `<div class="spell-grid">${list.map((it, i) => `
      <article class="spell-card" data-filter-item>
        <div class="spell-card__top">
          <span class="spell-card__ico">${FICON.spark}</span>
          <div class="spell-card__id">
            <span class="spell-card__nameline">
              ${it.refId
                ? `<a href="#/Magias/${encodeURIComponent(it.refId)}" class="spell-card__name">${escapeHtml(it.name || '')}</a>`
                : `<span class="spell-card__name">${escapeHtml(it.name || '')}</span>`}
              ${it.refId ? `<span class="spell-card__codex" title="Magia do codex">${FICON.book}</span>` : ''}
            </span>
          </div>
          ${canEdit ? `<button type="button" class="spell-card__x" data-spell-remove="${i}" aria-label="Remover magia">×</button>` : ''}
        </div>
        ${it.summary ? `<p class="spell-card__d">${escapeHtml(it.summary)}</p>` : ''}
        ${spellRuntimeMetaHTML(it, canEdit, i, v)}
      </article>`).join('')}</div>` : `<p class="char-empty">Nenhuma magia registrada.</p>`;

    const adder = canEdit ? `
      <div class="char-add char-add--codex" data-spell-adder>
        <select class="create-form__input char-select" data-spell-select>
          <option value="">— escolher magia do codex —</option>
          ${codex.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title)}</option>`).join('')}
        </select>
        <input type="text" class="create-form__input" data-spell-custom placeholder="ou magia avulsa…" maxlength="80">
        <button type="button" class="btn btn-ghost" data-spell-add>Adicionar</button>
      </div>` : '';

    return bar + tools + cards + adder;
  }

  const INV_SHIELD_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3z"/></svg>';

  /* Slot de equipamento (grade Equipamentos). */
  function invSlotHTML(it, i, canEdit) {
    const df = itemDf(it);
    const dm = itemDm(it);
    return `
      <div class="eq-slot is-filled inv-row" data-idx="${i}" title="${escapeHtml(it.name || '')}">
        <span class="eq-slot__ico">${FICON.sword}</span>
        <span class="eq-slot__name">${escapeHtml(it.name || '')}</span>
        ${df ? `<span class="eq-slot__def">${INV_SHIELD_ICON}DF ${df}</span>` : ''}
        ${dm ? `<span class="eq-slot__def">${INV_SHIELD_ICON}DM ${dm}</span>` : ''}
        ${canEdit ? `<button type="button" class="eq-slot__x" data-inv-unequip aria-label="Desequipar ${escapeHtml(it.name || '')}">×</button>` : ''}
      </div>`;
  }

  /* Linha da mochila (visual tabular, mantém os hooks data-inv-*). */
  function invRowHTML(it, i, canEdit) {
    const df = itemDf(it);
    const dm = itemDm(it);
    const qty = it.qty || 1;
    const nameHTML = it.refId
      ? `<a href="#/Itens/${encodeURIComponent(it.refId)}" class="inv-row__name">${escapeHtml(it.name || '')}</a>`
      : `<span class="inv-row__name">${escapeHtml(it.name || '')}</span>`;
    return `
      <li class="inv-row" data-idx="${i}" data-filter-item>
        <span class="inv-row__ic">${FICON.bag}</span>
        <div class="inv-row__main">
          ${nameHTML}
          ${it.summary ? `<span class="inv-row__sum">${escapeHtml(it.summary)}</span>` : ''}
        </div>
        <span class="inv-row__qty">
          ${canEdit ? `<button type="button" class="qty-btn" data-inv-qty="-1" aria-label="Menos">−</button>` : ''}
          <span class="inv-row__q">×${qty}</span>
          ${canEdit ? `<button type="button" class="qty-btn" data-inv-qty="1" aria-label="Mais">+</button>` : ''}
        </span>
        <span class="inv-row__def" title="Defesa fisica">${INV_SHIELD_ICON}DF ${canEdit
          ? `<input type="number" class="inv-def-input" data-inv-df value="${df}" min="0" max="${DEF_MAX_LEVEL}" aria-label="DF do item">`
          : `<strong>${df}</strong>`}</span>
        <span class="inv-row__def" title="Defesa magica">${INV_SHIELD_ICON}DM ${canEdit
          ? `<input type="number" class="inv-def-input" data-inv-dm value="${dm}" min="0" max="${DEF_MAX_LEVEL}" aria-label="DM do item">`
          : `<strong>${dm}</strong>`}</span>
        <span class="inv-row__type">${it.refId ? 'Codex' : 'Avulso'}</span>
        <span class="inv-row__acts">
          ${canEdit ? `<button type="button" class="inv-act inv-act--equip" data-inv-equip>Equipar</button>` : ''}
          ${canEdit ? `<button type="button" class="inv-row__x" data-inv-remove aria-label="Remover">×</button>` : ''}
        </span>
      </li>`;
  }

  function charInventoryInner(c, canEdit) {
    const list = Array.isArray(c.inventory) ? c.inventory : [];
    const itens = entriesIn('Itens');
    const eq = []; const bpRows = [];
    list.forEach((it, i) => { if (it.equipped) eq.push([it, i]); else bpRows.push(invRowHTML(it, i, canEdit)); });
    const eqCount = eq.length;
    const totalQty = list.reduce((s, it) => s + (it.qty || 1), 0);

    const bar = `
      <div class="inv-bar">
        <span class="inv-bar__m">Itens <b>${list.length}</b></span>
        <span class="inv-bar__m">Unidades <b>${totalQty}</b></span>
        <span class="inv-bar__m">DF por itens <b>+${dfFromItems(c)}</b></span>
        <span class="inv-bar__m">DM por itens <b>+${dmFromItems(c)}</b></span>
        <span class="inv-bar__spacer"></span>
        ${canEdit ? `<button type="button" class="btn-primary inv-bar__add" data-inv-focus><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Adicionar item</button>` : ''}
      </div>`;

    const slots = eq.map(([item, index]) => invSlotHTML(item, index, canEdit));
    const equipCol = `
      <div class="fcard inv-equip">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.shield}</span>Equipamentos<span class="fcard__count">${eqCount}</span></h3>
        <div class="eq-grid">${slots.length ? slots.join('') : '<p class="char-empty">Nenhum item equipado.</p>'}</div>
      </div>`;

    const backpackCol = `
      <div class="inv-backpack" data-filter-scope>
        <div class="ftools">
          <label class="fsearch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input type="search" data-filter placeholder="Pesquisar item…"></label>
        </div>
        ${bpRows.length ? `
          <div class="fcard inv-list-card">
            <div class="inv-thead"><span>Item</span><span>Qtd.</span><span>DF</span><span>DM</span><span>Tipo</span><span></span></div>
            <ul class="inv-list">${bpRows.join('')}</ul>
          </div>`
          : `<div class="fcard"><p class="char-empty">Mochila vazia. ${canEdit ? 'Adicione itens abaixo.' : ''}</p></div>`}
      </div>`;

    const adder = canEdit ? `
      <div class="char-add char-add--codex" data-inv-adder>
        <select class="create-form__input char-select" data-inv-select>
          <option value="">— escolher item do codex —</option>
          ${itens.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title)}</option>`).join('')}
        </select>
        <input type="text" class="create-form__input" data-inv-custom placeholder="ou item avulso…" maxlength="80">
        <input type="number" class="create-form__input char-add__qty" data-inv-qty-input min="1" value="1" aria-label="Quantidade">
        <button type="button" class="btn btn-ghost" data-inv-add>Adicionar</button>
      </div>` : '';

    return bar + `<div class="inv-layout">${equipCol}${backpackCol}</div>` + adder;
  }

  /* ── FICHA (#/Persona/<id>) ───────────────────── */
  function viewCharacterSheetLegacy(id) {
    const c = characterById(id);
    if (!c) return viewNotFound(id);
    const canEdit = auth.isAdmin || (auth.user && c.userId === auth.user.id);
    const theme = themeOf('Persona');
    const tab = tabById('Persona');
    const { mod } = raceDataFor(c.raceId);
    const bodyHtml = (c.identity && c.identity.bodyHtml) || '';
    const awk = normalizeAwakening(c.magic);
    const isMage = awkIsAcceptedMage(awk);
    const bonusAttr = awkIsNonMage(awk) ? awk.bonusAttr : '';

    const A = attrModsView(c, mod, bonusAttr);
    const idn = c.identity || {};
    const sc = isMage ? (schoolById(awk.school) || MAGIC_SCHOOLS[0]) : null;
    const className = isMage ? ('Mago' + (sc && sc.name ? ' · ' + sc.name : '')) : 'Não-mago';

    // ── Vitais resumidos para o cabeçalho ──
    const v = ensureVitals(c);
    const hpParts = hpPartKeys(v.hp);
    const hpCur = hpParts.reduce((s, p) => s + (Number(v.hp[p].cur) || 0), 0);
    const hpMax = hpParts.reduce((s, p) => s + (Number(v.hp[p].max) || 0), 0);
    const initDice = A['Destreza'] ? A['Destreza'].dice : 1;
    const level = Math.max(1, Number(idn.level || c.level) || 1);
    const movement = movementLabelOf(c, A);
    const daAttr = daAttrOf(c);
    const daState = daStateOf(c);
    const playerName = (idn.ownerLabel || (auth.user && c.userId === auth.user.id ? (auth.user.name || auth.user.email) : '')) || '—';

    const vitalBar = (cls, k, dotHue, slot) => `
      <div class="hvital hvital--${cls}">
        <div class="hvital__top"><span class="hvital__k"><span class="hvital__dot"></span>${k}</span>
          <span class="hvital__v">${slot.cur}<small>/${slot.max}</small></span></div>
        <div class="hvbar"><span style="width:${vbarPct(slot.cur, slot.max)}%"></span></div>
      </div>`;
    const hpHead = hpMax ? vitalBar('hp', 'Vida', 0, { cur: hpCur, max: hpMax }) : '';
    const manaHead = v.mana ? vitalBar('mana', 'Mana', 0, v.mana) : '';

    const circles = `
      <div class="hcircles">
        <span class="hcircle"><b data-da-total>${daState.value || '—'}</b><span>DA</span></span>
        <span class="hcircle"><b data-df-total>${totalDf(c)}</b><span>DF <small data-df-pct>${defPct(totalDf(c))}%</small></span></span>
        <span class="hcircle"><b data-dm-total>${totalDm(c)}</b><span>DM <small data-dm-pct>${defPct(totalDm(c))}%</small></span></span>
        <span class="hcircle hcircle--muted"><b>${escapeHtml(movement)}</b><span>Movimento</span></span>
      </div>`;

    // ════ VISÃO GERAL ════
    const attrCard = `
      <div class="fcard">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.attr}</span>Atributos</h3>
        <div class="attr-rows">
          ${CHAR_ATTRIBUTES.map((a) => {
            const cell = A[a];
            const note = cell.bonus ? 'despertar' : (Number((mod && mod[a]) || 0) ? 'raça' : '');
            return `<div class="attr-row">
              <span class="attr-row__n">${escapeHtml(a)}${note ? `<em class="attr-row__note">${note}</em>` : ''}</span>
              <span class="attr-row__r"><span class="attr-row__v">${cell.score}</span><span class="attr-row__m">${fmtDice(cell.dice)}</span></span>
            </div>`;
          }).join('')}
        </div>
      </div>`;

    const featItems = [];
    if (isMage && sc) featItems.push([FICON.spark, sc.name, sc.lore]);
    if (isMage) featItems.push([FICON.status, 'Fragilidade Arcana', '-1d6 em testes de Resistencia para exaustao prolongada, doenca, sangramento ou recuperacao fisica.']);
    if (isMage) featItems.push([FICON.mana, 'Colapso Arcano', 'Ao chegar a 0 Mana, fica inconsciente e incapaz de agir, lutar, conjurar ou mover-se sozinho.']);
    if (idn.desejo) featItems.push([FICON.feat, 'Desejo', idn.desejo]);
    if (idn.ferida) featItems.push([FICON.status, 'Ferida', idn.ferida]);
    if (awk.resolved && !isMage) featItems.push([FICON.feat, 'Caminho mundano', `Sem Mana natural · +1 Nivel de HP${bonusAttr ? ` · +1 ${bonusAttr}` : ''}${awk.renounced ? ' · Mana renunciada' : ''}`]);
    const featCard = `
      <div class="fcard">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.feat}</span>Características</h3>
        ${featItems.length ? featItems.map(([ic, t, d]) => `
          <div class="feat-row">
            <span class="feat-row__ico">${ic}</span>
            <div class="feat-row__b"><div class="feat-row__t">${escapeHtml(t)}</div><div class="feat-row__d">${escapeHtml(d)}</div></div>
          </div>`).join('') : '<p class="char-empty">Nenhuma característica registrada.</p>'}
      </div>`;

    const resistCard = `
      <div class="fcard">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.shield}</span>Resistências</h3>
        <p class="char-empty char-empty--soft">Resistências e vulnerabilidades ainda não definidas.</p>
      </div>`;

    const skillsList = (c.skills && c.skills.length) ? c.skills : [];
    const profCard = `
      <div class="fcard">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.check}</span>Proficiências</h3>
        <dl class="kv-list">
          <div class="kv"><dt>Perícias</dt><dd>${skillsList.length ? escapeHtml(skillsList.join(', ')) : '<span class="dim">—</span>'}</dd></div>
          <div class="kv"><dt>Armas</dt><dd><span class="dim">a definir</span></dd></div>
          <div class="kv"><dt>Armaduras</dt><dd><span class="dim">a definir</span></dd></div>
        </dl>
      </div>`;

    // ════ COMBATE ════
    const daDice = A[daAttr] ? A[daAttr].dice : 1;
    const daRead = daState.destiny ? destinyReading(daState.destiny) : null;
    const daCard = `
      <div class="fcard">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.shield}</span>Dificuldade de Acerto</h3>
        <div class="res-row"><span>Atributo base</span><b>${escapeHtml(daAttr)} · ${fmtDice(daDice)}</b></div>
        <div class="res-row"><span>DA atual</span><b data-da-total>${daState.value || '—'}</b></div>
        ${daState.value ? `<p class="fcard__note">Destino ${daState.destiny || '—'}${daRead ? ` · ${escapeHtml(daRead.title)}` : ''}</p>` : '<p class="fcard__note">Role no inicio de cada combate. O valor permanece durante a luta.</p>'}
        ${canEdit ? `<button type="button" class="btn btn-ghost" data-da-roll data-da-attr="${escapeHtml(daAttr)}" data-da-dice="${daDice}">${daState.value ? 'Rerrolar DA' : 'Rolar DA'}</button>` : ''}
        <div class="saves-roll" data-da-result ${daState.value ? '' : 'hidden'}>${daState.value ? rollResultHTML(daState.attr, { dice: daState.dice || daDice, d6s: daState.d6s || [], destiny: daState.destiny || 0, total: daState.value }, 'DA') : ''}</div>
      </div>`;
    const initCard = `
      <div class="fcard fcard--center">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.bolt}</span>Iniciativa</h3>
        <div class="bignum">${fmtDice(initDice)}</div>
        <p class="fcard__note">Destreza + 1d12 quando houver disputa.</p>
      </div>`;
    const savesCard = `
      <div class="fcard">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.shield}</span>Testes de Atributo</h3>
        <div class="saves-list">
          ${CHAR_ATTRIBUTES.map((a) => {
            const nd = Math.max(1, A[a].dice || 1);
            return `<button type="button" class="res-row res-row--roll" data-save-roll="${escapeHtml(a)}" data-save-dice="${nd}" title="Rolar ${fmtDice(nd)} + 1d12">
              <span class="res-row__l"><span class="res-row__die">${FICON.dice}</span>${escapeHtml(a)}</span>
              <span class="res-row__f">${fmtDice(nd)}<em>+1d12</em></span>
            </button>`;
          }).join('')}
          ${isMage ? (() => {
            const nd = Math.max(1, (A[CHAR_RES_ATTR] ? A[CHAR_RES_ATTR].dice : 1) - 1);
            return `<button type="button" class="res-row res-row--roll" data-save-roll="Resistencia fisica prolongada" data-save-dice="${nd}" title="Fragilidade Arcana: -1d6">
              <span class="res-row__l"><span class="res-row__die">${FICON.dice}</span>Resistencia fisica</span>
              <span class="res-row__f">${fmtDice(nd)}<em>fragilidade</em></span>
            </button>`;
          })() : ''}
        </div>
        <div class="saves-roll" data-save-result hidden></div>
      </div>`;
    const manaCard = v.mana ? `
      <div class="fcard">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.mana}</span>Mana</h3>
        <div class="res-row"><span>Pontos de Mana</span><b>${v.mana.cur} / ${v.mana.max}</b></div>
        <p class="fcard__note">Recupera no descanso longo.</p>
      </div>` : '';

    // ════ HISTÓRIA ════
    const bodyMarkup = bodyHtml ? `<div class="fcard"><h3 class="fcard__h"><span class="fcard__ico">${FICON.feat}</span>História</h3><div class="rt-content">${sanitizeHtml(bodyHtml)}</div></div>` : '';

    const tabs = [
      { id: 'geral', label: 'Visão Geral', icon: FICON.clock },
      { id: 'combate', label: 'Combate', icon: FICON.sword },
      { id: 'inventario', label: 'Inventário', icon: FICON.bag },
      { id: 'magias', label: 'Magias', icon: FICON.spark },
      { id: 'historia', label: 'História', icon: FICON.feat }
    ];

    return `
      <article class="entry char-sheet char-sheet--v2" id="charSheet" style="--hue:${theme.hue}"
               data-char-id="${escapeHtml(c.id)}" data-can-edit="${canEdit ? '1' : '0'}">
        <nav class="breadcrumb">
          <a href="#/">Codex</a><span>/</span>
          <a href="#/Persona">${escapeHtml(tab.title)}</a><span>/</span>
          <span class="breadcrumb__current">${escapeHtml(c.name || 'Ficha')}</span>
        </nav>

        <header class="sheet-head">
          <div class="sheet-head__portrait">
            ${c.image ? `<img src="${c.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
            <div class="char-hero__fallback">${iconOf('Persona')}</div>
          </div>
          <div class="sheet-head__id">
            <div class="char-hero__badges">
              <span class="char-badge char-badge--${isMage ? 'mage' : 'mundane'}">${escapeHtml(className)}</span>
              ${c.raceName ? `<span class="char-badge char-badge--race">${escapeHtml(c.raceName)}</span>` : ''}
            </div>
            <h1 class="sheet-head__name" data-text-reveal>${escapeHtml(c.name || 'Sem nome')}</h1>
            <div class="sheet-head__lvl">
              <span class="lvl-chip">Nível ${level}</span>
              ${idn.papel ? `<span class="sheet-head__role">${escapeHtml(idn.papel)}</span>` : ''}
            </div>
            <div class="sheet-head__meta">
              <span class="shm"><span class="shm__k">Campanha</span><b>O Arcano</b></span>
              <span class="shm"><span class="shm__k">Jogador</span><b>${escapeHtml(playerName)}</b></span>
              <span class="shm"><span class="shm__k">Despertar</span><b>${awk.schoolRoll ? '1d100 · ' + awk.schoolRoll : (awk.resolved ? 'mundano' : '—')}</b></span>
            </div>
          </div>
          <div class="sheet-head__right">
            ${canEdit ? `
              <div class="sheet-head__actions">
                <a class="btn-line" href="#/Persona/${encodeURIComponent(c.id)}/editar" title="Editar ficha">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                  <span>Editar</span>
                </a>
                <button type="button" class="btn-line btn-line--danger" data-delete-character="${escapeHtml(c.id)}" title="Apagar ficha" aria-label="Apagar ficha">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
                </button>
              </div>` : ''}
            <div class="hvitals">${hpHead}${manaHead}</div>
            ${circles}
          </div>
        </header>

        <nav class="char-tabs" role="tablist">
          ${tabs.map((t, i) => `<button type="button" class="char-tab ${i === 0 ? 'is-active' : ''}" role="tab" data-tab="${t.id}"><span class="char-tab__ico">${t.icon}</span>${t.label}</button>`).join('')}
        </nav>

        <div class="char-panels">
          <section class="char-panel is-active" data-panel="geral">
            <div class="fgrid fgrid--geral">
              ${attrCard}
              ${featCard}
              <div class="fcol">${resistCard}${profCard}</div>
            </div>
          </section>

          <section class="char-panel" data-panel="combate">
            <div class="fgrid fgrid--combate">
              <div class="fcol">${daCard}${initCard}${savesCard}</div>
              <div class="fcard fcard--vitals" id="charVitals">${charVitalsInner(c, canEdit)}</div>
              <div class="fcol"><div class="fcard fcard--status" id="charStatus">${charStatusInner(c, canEdit)}</div>${manaCard}</div>
            </div>
          </section>

          <section class="char-panel" data-panel="inventario">
            <div id="charInventory">${charInventoryInner(c, canEdit)}</div>
          </section>

          <section class="char-panel" data-panel="magias">
            <div id="charSpells">${charCodexListInner(c, canEdit, 'spell')}</div>
          </section>

          <section class="char-panel" data-panel="historia">
            ${bodyMarkup || '<div class="fcard"><p class="char-empty">Nenhuma história escrita ainda.</p></div>'}
          </section>
        </div>

        <div class="char-sheet__foot">
          <a href="#/Persona" class="back-link">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Voltar às Personas
          </a>
        </div>
      </article>
    `;
  }

  function viewCharacterSheetFolio(id) {
    const c = characterById(id);
    if (!c) return viewNotFound(id);
    const canEdit = canEditCharacter(c);
    const base = characterBase(c);
    const backLabel = c.mesaId ? `Voltar à mesa ${mesaById(c.mesaId)?.name || ''}`.trim() : 'Voltar às Personas';
    const theme = themeOf('Persona');
    const tab = tabById('Persona');
    const { mod } = raceDataFor(c.raceId);
    const bodyHtml = (c.identity && c.identity.bodyHtml) || '';
    const awk = normalizeAwakening(c.magic);
    const isMage = awkIsAcceptedMage(awk);
    const bonusAttr = awkIsNonMage(awk) ? awk.bonusAttr : '';
    const A = attrModsView(c, mod, bonusAttr);
    const idn = c.identity || {};
    const sc = isMage ? (schoolById(awk.school) || MAGIC_SCHOOLS[0]) : null;
    const className = isMage ? `Mago${sc && sc.name ? ` · ${sc.name}` : ''}` : 'Não-mago';
    const v = ensureVitals(c);
    const hpParts = hpPartKeys(v.hp);
    const hpCur = hpParts.reduce((sum, part) => sum + (Number(v.hp[part].cur) || 0), 0);
    const hpMax = hpParts.reduce((sum, part) => sum + (Number(v.hp[part].max) || 0), 0);
    const level = Math.max(1, Number(idn.level || c.level) || 1);
    const movement = movementLabelOf(c, A);
    const daAttr = daAttrOf(c);
    const daState = daStateOf(c);
    const daDice = A[daAttr] ? A[daAttr].dice : 1;
    const daRead = daState.destiny ? destinyReading(daState.destiny) : null;
    const playerName = (idn.ownerLabel || (auth.user && c.userId === auth.user.id ? (auth.user.name || auth.user.email) : '')) || '—';
    const skills = Array.isArray(c.skills) ? c.skills : [];
    const showGrimoire = isMage || (Array.isArray(c.spells) && c.spells.length > 0);
    const awakeningLabel = awk.schoolRoll ? `1d100 · ${awk.schoolRoll}` : (awk.resolved ? 'Mundano' : '—');

    const headerLine = (label, value) => `
      <span class="arc-character-line"><small>${label}</small><strong>${escapeHtml(value || 'Não registrado')}</strong></span>`;
    const summaryVital = (cls, icon, label, value, detail = '', fill = '') => `
      <div class="arc-summary-vital arc-summary-vital--${cls}">
        <span class="arc-summary-vital__label"><span>${icon}</span>${label}</span>
        <span class="arc-summary-vital__value">${value}${detail ? `<small>${detail}</small>` : ''}</span>
        ${fill ? `<span class="arc-summary-vital__bar"><i ${cls === 'hp' ? 'data-vital-hp-fill' : 'data-vital-mana-fill'} style="width:${fill}"></i></span>` : ''}
      </div>`;

    const attrSection = `
      <section class="arc-sheet-section" data-roll-scope>
        <h3 class="arc-sheet-section__title"><span>${FICON.attr}</span>Atributos</h3>
        <div class="arc-attribute-grid">
          ${CHAR_ATTRIBUTES.map((attr) => {
            const cell = A[attr];
            const note = cell.bonus ? 'despertar' : (Number((mod && mod[attr]) || 0) ? 'raça' : '');
            const dice = Math.max(1, cell.dice || 1);
            return `<button type="button" class="arc-attribute" data-save-roll="${escapeHtml(attr)}" data-save-dice="${dice}" aria-label="Rolar ${escapeHtml(attr)}: ${fmtDice(dice)} mais 1d12">
              <span class="arc-attribute__die">d6</span>
              <span class="arc-attribute__name">${escapeHtml(attr)}${note ? `<small>${note}</small>` : ''}</span>
              <span class="arc-attribute__dice">${fmtDice(dice)} <small>+1d12</small></span>
              <strong>${cell.score}</strong>
            </button>`;
          }).join('')}
        </div>
        <div class="saves-roll arc-inline-roll" data-save-result hidden></div>
      </section>`;

    const narrativeSection = `
      <section class="arc-sheet-section">
        <h3 class="arc-sheet-section__title"><span>${FICON.feat}</span>Identidade narrativa</h3>
        <dl class="arc-ledger">
          <div><dt>Papel</dt><dd>${escapeHtml(idn.papel || 'Não registrado')}</dd></div>
          <div><dt>Desejo</dt><dd>${escapeHtml(idn.desejo || 'Não registrado')}</dd></div>
          <div><dt>Ferida</dt><dd>${escapeHtml(idn.ferida || 'Não registrada')}</dd></div>
          <div><dt>Perícias e talentos</dt><dd>${skills.length ? escapeHtml(skills.join(', ')) : 'Nenhum registrado'}</dd></div>
        </dl>
      </section>`;

    const arcaneSection = `
      <section class="arc-sheet-section arc-sheet-section--arcane">
        <h3 class="arc-sheet-section__title"><span>${FICON.spark}</span>Natureza arcana</h3>
        <dl class="arc-ledger arc-ledger--compact">
          <div><dt>Condição</dt><dd>${isMage ? 'Mago' : 'Não-mago'}</dd></div>
          ${isMage && sc ? `<div><dt>Afinidade</dt><dd>${escapeHtml(sc.name)}</dd></div>` : ''}
          <div><dt>Despertar</dt><dd>${escapeHtml(awakeningLabel)}</dd></div>
        </dl>
        <div id="charEffects">${characterEffectsInner(c, canEdit)}</div>
      </section>`;

    const daBlock = `
      <div class="arc-da-block">
        <span class="arc-da-block__mark">${FICON.shield}</span>
        <div><small>Dificuldade de Acerto</small><strong data-da-total>${daState.value || '—'}</strong></div>
        <div class="arc-da-block__base"><small>Atributo base</small><b>${escapeHtml(daAttr)} · ${fmtDice(daDice)}</b></div>
      </div>
      ${daState.value ? `<p class="arc-rule-note">Destino ${daState.destiny || '—'}${daRead ? ` · ${escapeHtml(daRead.title)}` : ''}. Este valor permanece durante o confronto.</p>` : '<p class="arc-rule-note">Role no início de cada confronto. O resultado permanece durante toda a luta.</p>'}
      ${canEdit ? `<button type="button" class="btn btn-ghost arc-da-roll" data-da-roll data-da-attr="${escapeHtml(daAttr)}" data-da-dice="${daDice}">${FICON.dice}<span data-da-roll-label>${daState.value ? 'Rerrolar DA' : 'Rolar DA'}</span></button>` : ''}
      <div class="saves-roll" data-da-result ${daState.value ? '' : 'hidden'}>${daState.value ? rollResultHTML(daState.attr, { dice: daState.dice || daDice, d6s: daState.d6s || [], destiny: daState.destiny || 0, total: daState.value }, 'DA') : ''}</div>`;

    const testsSection = `
      <section class="arc-sheet-section" data-roll-scope>
        <h3 class="arc-sheet-section__title"><span>${FICON.dice}</span>Testes de atributo</h3>
        <div class="arc-test-grid">
          ${CHAR_ATTRIBUTES.map((attr) => {
            const dice = Math.max(1, A[attr].dice || 1);
            return `<button type="button" class="res-row res-row--roll" data-save-roll="${escapeHtml(attr)}" data-save-dice="${dice}"><span class="res-row__l">${escapeHtml(attr)}</span><span class="res-row__f">${fmtDice(dice)}<em>+1d12</em></span></button>`;
          }).join('')}
          ${isMage ? (() => {
            const dice = Math.max(1, (A[CHAR_RES_ATTR] ? A[CHAR_RES_ATTR].dice : 1) - 1);
            return `<button type="button" class="res-row res-row--roll arc-test--fragility" data-save-roll="Resistência física prolongada" data-save-dice="${dice}" title="Fragilidade Arcana: −1d6"><span class="res-row__l">Resistência física</span><span class="res-row__f">${fmtDice(dice)}<em>fragilidade</em></span></button>`;
          })() : ''}
        </div>
        <div class="saves-roll" data-save-result hidden></div>
      </section>`;

    const bodyMarkup = bodyHtml ? `<div class="arc-history-copy rt-content">${sanitizeHtml(bodyHtml)}</div>` : '<p class="char-empty">Nenhuma história escrita ainda.</p>';
    const tabs = [
      { id: 'geral', label: 'Identidade' },
      { id: 'combate', label: 'Confronto' },
      { id: 'inventario', label: 'Equipamento' },
      ...(showGrimoire ? [{ id: 'magias', label: 'Grimório' }] : []),
      { id: 'historia', label: 'História' }
    ];

    return `
      <article class="entry char-sheet char-sheet--folio" id="charSheet" style="--hue:${theme.hue}" data-char-id="${escapeHtml(c.id)}" data-can-edit="${canEdit ? '1' : '0'}">
        ${c.mesaId
          ? `<nav class="breadcrumb"><a href="#/Mesas">Mesas</a><span>/</span><a href="#/Mesas/${encodeURIComponent(c.mesaId)}">${escapeHtml(mesaById(c.mesaId)?.name || 'Mesa')}</a><span>/</span><a href="${base}">Fichas</a><span>/</span><span class="breadcrumb__current">${escapeHtml(c.name || 'Ficha')}</span></nav>`
          : `<nav class="breadcrumb"><a href="#/">Codex</a><span>/</span><a href="#/Persona">${escapeHtml(tab.title)}</a><span>/</span><span class="breadcrumb__current">${escapeHtml(c.name || 'Ficha')}</span></nav>`}

        ${levelPanelHTML(c)}

        <div class="arc-folio">
          <header class="arc-folio-head">
            <div class="arc-folio-portrait">
              ${c.image ? `<img src="${c.image}" alt="Retrato de ${escapeHtml(c.name || 'personagem')}" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
              <div class="char-hero__fallback">${iconOf('Persona')}</div>
            </div>
            <div class="arc-folio-identity">
              <p class="arc-folio-kicker">Ficha de personagem</p>
              <h1 data-text-reveal>${escapeHtml(c.name || 'Sem nome')}</h1>
              <p class="arc-folio-class">${escapeHtml(c.raceName || 'Raça não definida')} · ${escapeHtml(className)}</p>
              <div class="arc-character-lines">${headerLine('Papel', idn.papel)}${headerLine('Jogador', playerName)}${headerLine('Desejo', idn.desejo)}${headerLine('Ferida', idn.ferida)}</div>
            </div>
            <div class="arc-folio-actions">
              <span class="arc-level-seal"><strong>${level}</strong><small>Nível</small></span>
              ${canEdit ? `<div class="arc-folio-actions__buttons">
                <a class="btn-line" href="${base}/${encodeURIComponent(c.id)}/editar"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg><span>Editar</span></a>
                <button type="button" class="btn-line btn-line--danger" data-delete-character="${escapeHtml(c.id)}" aria-label="Apagar ficha">×</button>
              </div>` : ''}
            </div>
          </header>

          <section class="arc-summary" aria-label="Resumo da ficha">
            ${summaryVital('hp', FICON.heart, 'Vida total', `<span data-vital-hp-cur>${hpCur}</span>`, `/ <span data-vital-hp-max>${hpMax}</span>`, vbarPct(hpCur, hpMax) + '%')}
            ${v.mana ? summaryVital('mana', FICON.mana, 'Mana', `<span data-vital-mana-cur>${v.mana.cur}</span>`, `/ <span data-vital-mana-max>${v.mana.max}</span>`, vbarPct(v.mana.cur, v.mana.max) + '%') : ''}
            ${summaryVital('da', FICON.shield, 'DA atual', `<span data-da-total>${daState.value || '—'}</span>`)}
            ${summaryVital('df', FICON.shield, 'DF', `<span data-df-total>${totalDf(c)}</span>`, `/ <span data-df-pct>${defPct(totalDf(c))}%</span>`)}
            ${summaryVital('dm', FICON.spark, 'DM', `<span data-dm-total>${totalDm(c)}</span>`, `/ <span data-dm-pct>${defPct(totalDm(c))}%</span>`)}
            ${summaryVital('move', FICON.bolt, 'Movimento', escapeHtml(movement))}
          </section>

          <nav class="char-tabs arc-chapters" role="tablist">
            ${tabs.map((item, index) => `<button type="button" class="char-tab ${index === 0 ? 'is-active' : ''}" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" data-tab="${item.id}">${item.label}</button>`).join('')}
          </nav>

          <div class="char-panels arc-folio-pages">
            <section class="char-panel is-active" data-panel="geral"><div class="arc-identity-layout"><div>${attrSection}${narrativeSection}</div><aside>${arcaneSection}</aside></div></section>

            <section class="char-panel" data-panel="combate">
              <div class="arc-combat-layout">
                <div><section class="arc-sheet-section arc-defense-zone"><h3 class="arc-sheet-section__title"><span>${FICON.shield}</span>Defesas</h3>${daBlock}${defenseShieldHTML(c, canEdit)}</section>${testsSection}</div>
                <section class="arc-sheet-section arc-anatomy-section"><h3 class="arc-sheet-section__title"><span>${FICON.heart}</span>Integridade anatômica</h3><div id="charVitals">${charVitalsInner(c, canEdit)}</div></section>
                <aside class="arc-combat-side"><section class="arc-sheet-section arc-status-section" id="charStatus">${charStatusInner(c, canEdit)}</section>${v.mana ? `<section class="arc-sheet-section"><h3 class="arc-sheet-section__title"><span>${FICON.mana}</span>Mana</h3><div id="charMana">${charManaInner(c, canEdit)}</div></section>` : ''}</aside>
              </div>
            </section>

            <section class="char-panel" data-panel="inventario"><div class="arc-page-heading"><span>${FICON.bag}</span><div><h2>Equipamento</h2><p>Itens equipados e pertences carregados pelo personagem.</p></div></div><div id="charInventory">${charInventoryInner(c, canEdit)}</div></section>
            ${showGrimoire ? `<section class="char-panel" data-panel="magias"><div class="arc-page-heading"><span>${FICON.book}</span><div><h2>Grimório</h2><p>Magias conhecidas por ${escapeHtml(c.name || 'este personagem')}.</p></div></div><div id="charSpells">${charCodexListInner(c, canEdit, 'spell')}</div></section>` : ''}
            <section class="char-panel" data-panel="historia"><div class="arc-history-opening">${headerLine('Papel', idn.papel)}${headerLine('Desejo', idn.desejo)}${headerLine('Ferida', idn.ferida)}</div><section class="arc-sheet-section arc-history-section"><h3 class="arc-sheet-section__title"><span>${FICON.feat}</span>História</h3>${bodyMarkup}</section></section>
          </div>
        </div>

        <div class="char-sheet__foot"><a href="${base}" class="back-link"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>${escapeHtml(backLabel)}</a></div>
      </article>`;
  }

  /* ── FORMULÁRIO DA FICHA (#/Persona/criar|editar) ─ */
  function viewCharacterForm(id) {
    if (!auth.canRead) return viewForbidden();
    const editing = !!id;
    const existing = editing ? characterById(id) : null;
    if (editing && !existing) return viewNotFound(id);
    if (editing && !canEditCharacter(existing)) return viewForbidden();

    const theme = themeOf('Persona');
    const races = entriesIn('Racas');
    const c = existing || {};
    const idn = c.identity || {};
    const allocated = c.attributes || {};
    const selectedRaceId = c.raceId || '';
    const { mod, hp: raceHp, mana: raceMana } = raceDataFor(selectedRaceId);
    const hpValues = (existing && c.hp && Object.keys(c.hp).length) ? c.hp : raceHp;
    const formAwakening = normalizeAwakening(c.magic);
    const formIsMage = awkIsAcceptedMage(formAwakening);
    const manaValue = formIsMage ? ((existing && c.mana) ? c.mana : raceMana) : '';

    const formMesaId = existing ? existing.mesaId : characterFormMesaId;
    const masterMode = auth.isPlatina || (!!formMesaId && isMesaMaster(formMesaId));
    const isNpcForm = existing ? !!existing.isNpc : characterFormNpc;
    const owners = masterMode && formMesaId && !isNpcForm ? (MESA_MEMBERS[formMesaId] || []) : [];
    const ownerId = existing ? existing.userId : auth.user?.id;
    const heroEyebrow = editing ? `EDITAR · ${isNpcForm ? 'NPC' : theme.label}` : `CRIAR · ${isNpcForm ? 'NPC' : theme.label}`;
    const heroTitle = editing ? `Editar ${c.name || 'ficha'}` : (isNpcForm ? 'Novo NPC' : 'Nova persona');
    const saveLabel = editing ? 'Salvar alterações' : 'Salvar ficha';
    const formBase = editing ? characterBase(existing) : (characterFormMesaId ? `#/Mesas/${encodeURIComponent(characterFormMesaId)}/fichas` : '#/Persona');
    const cancelHref = editing ? `${formBase}/${encodeURIComponent(id)}` : formBase;
    const defenseOptions = (selected) => Array.from({ length: DEF_MAX_LEVEL + 1 }, (_, level) =>
      `<option value="${level}" ${level === selected ? 'selected' : ''}>Nível ${level} · ${defPct(level)}%</option>`
    ).join('');

    return `
      <section class="char-create" style="--hue:${theme.hue}">
        <header class="char-create__masthead">
          <div>
            <span class="char-create__eyebrow">${escapeHtml(heroEyebrow)}</span>
            <h1>${escapeHtml(heroTitle)}</h1>
            <p>Registro de identidade, natureza arcana e recursos da persona.</p>
          </div>
          <span class="char-create__sigil" aria-hidden="true">${iconOf('Persona')}</span>
        </header>

        <form class="create-form create-form--portrait char-create__form" id="characterForm"
              data-char-id="${editing ? escapeHtml(id) : ''}" data-master="${masterMode ? '1' : ''}" data-npc="${isNpcForm ? '1' : ''}" novalidate>
          <nav class="char-create__index" aria-label="Seções da ficha">
            <button type="button" data-char-form-section="char-form-identidade"><b>I</b><span>Identidade</span></button>
            <button type="button" data-char-form-section="char-form-atributos"><b>II</b><span>Atributos</span></button>
            <button type="button" data-char-form-section="char-form-arcano"><b>III</b><span>Natureza Arcana</span></button>
            <button type="button" data-char-form-section="char-form-confronto"><b>IV</b><span>Confronto</span></button>
            <button type="button" data-char-form-section="char-form-historia"><b>V</b><span>História</span></button>
          </nav>

          <div class="char-create__pages">
            <section class="char-create__section" id="char-form-identidade">
              <header class="char-create__section-head"><span>I</span><div><h2>Identidade</h2><p>Quem é a persona dentro e fora da narrativa.</p></div></header>
              <div class="char-create__identity">
                <div class="char-create__portrait">
                  <label class="create-form__label">Retrato (2:3)</label>
                  <div class="banner-drop banner-drop--portrait" id="bannerDrop" tabindex="0" role="button" aria-label="Selecionar retrato">
                    <input type="file" accept="image/*" id="bannerInput" hidden>
                    <div class="banner-drop__preview" id="bannerPreview" ${c.image ? '' : 'hidden'} style="${c.image ? `background-image:url('${c.image}')` : ''}"></div>
                    <div class="banner-drop__placeholder" id="bannerPlaceholder" ${c.image ? 'hidden' : ''}>
                      <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 17l-5-5-9 9"/></svg>
                      <strong>Escolher retrato</strong><span>JPG, PNG ou WebP</span>
                    </div>
                    <button type="button" class="banner-drop__clear" id="bannerClear" ${c.image ? '' : 'hidden'} aria-label="Remover imagem">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
                <div class="char-create__identity-fields">
                  <label class="dossier-field char-create__name"><span>Nome</span><input type="text" id="charName" class="create-form__input" placeholder="Nome da persona" maxlength="120" required value="${escapeHtml(c.name || '')}"></label>
                  ${owners.length ? `<label class="dossier-field"><span>Jogador</span><select id="charOwner" class="create-form__input char-select">${owners.map((m) => `<option value="${escapeHtml(m.userId)}" ${m.userId === ownerId ? 'selected' : ''}>${escapeHtml(m.displayName || 'Jogador')}${m.role === 'mestre' ? ' (Mestre)' : ''}</option>`).join('')}</select></label>` : ''}
                  <label class="dossier-field"><span>Raça</span><select id="charRace" class="create-form__input char-select"><option value="">— Sem raça —</option>${races.map((r) => `<option value="${escapeHtml(r.id)}" ${r.id === selectedRaceId ? 'selected' : ''}>${escapeHtml(r.title)}</option>`).join('')}</select></label>
                  <div class="dossier-field char-color-field"><span>Cor primária</span><span class="char-color"><input type="color" id="charColor" value="${escapeHtml(safeChatColor(idn.chatColor, c.id || c.name || 'nova'))}" aria-label="Cor primária">${CHAT_COLORS.map((col) => `<button type="button" class="char-color__swatch" data-char-color="${col}" style="--swatch:${col}" aria-label="Usar ${col}"></button>`).join('')}</span><small>Cor do nome e das ações no chat.</small></div>
                  <label class="dossier-field"><span>Nível</span><input type="number" id="charLevel" class="create-form__input" min="1" max="99" value="${escapeHtml(String(idn.level || 1))}"></label>
                  <label class="dossier-field"><span>Movimento</span><input type="text" id="charMovement" class="create-form__input" maxlength="20" value="${escapeHtml(movementTyped(c))}" placeholder="${escapeHtml(`${computedMovementFor(selectedRaceId, attrDiceForScore((c.attributes && c.attributes.Destreza) || CHAR_ATTR_BASE, raceDataFor(selectedRaceId).mod.Destreza))}m`)}"><small>Vazio = calculado pela raça e pela Destreza.</small></label>
                  <label class="dossier-field char-create__wide"><span>Papel</span><input type="text" id="charPapel" class="create-form__input" maxlength="160" value="${escapeHtml(idn.papel || '')}" placeholder="Ex.: Mercenária errante"></label>
                  <label class="dossier-field"><span>Desejo</span><input type="text" id="charDesejo" class="create-form__input" maxlength="160" value="${escapeHtml(idn.desejo || '')}" placeholder="O que persegue"></label>
                  <label class="dossier-field"><span>Ferida</span><input type="text" id="charFerida" class="create-form__input" maxlength="160" value="${escapeHtml(idn.ferida || '')}" placeholder="O que carrega"></label>
                  ${races.length ? '' : '<p class="char-hint char-create__wide">Nenhuma raça cadastrada ainda. O Mestre pode criá-las na aba Raças.</p>'}
                </div>
              </div>
            </section>

            <section class="char-create__section" id="char-form-atributos">
              <header class="char-create__section-head"><span>II</span><div><h2>Atributos e talentos</h2><p>Capacidades naturais e conhecimentos adquiridos.</p></div></header>
              <div class="create-form__field">
          <div class="attr-buy" id="attrBuy"
               data-base="${CHAR_ATTR_BASE}" data-pool="livre" data-min="1" data-max="${masterMode ? 99 : CHAR_ATTR_MAX}">
            <div class="attr-buy__head">
                    <span>Base ${CHAR_ATTR_BASE}. Dados = metade do que passa de ${CHAR_ATTR_BASE}, mínimo 1d6 (14 = 2d6, 16 = 3d6); a raça soma nos dados.</span>
            </div>
            <div class="attr-buy__grid">
              ${CHAR_ATTRIBUTES.map((a) => {
                const val = allocated[a] != null ? Number(allocated[a]) : CHAR_ATTR_BASE;
                const m = attrDiceForScore(val, Number((mod && mod[a]) || 0));
                return `
                  <div class="attr-row" data-attr="${escapeHtml(a)}" data-racemod="${Number((mod && mod[a]) || 0)}">
                    <div class="attr-row__head">
                      <span class="attr-row__name">${escapeHtml(a)}</span>
                      <span class="attr-row__mod" data-attr-mod aria-label="Dados de teste">${fmtDice(m)}</span>
                    </div>
                    <div class="attr-row__stepper">
                      <button type="button" class="attr-step" data-step="-1" aria-label="Diminuir ${escapeHtml(a)}">−</button>
                      <span class="attr-row__value" data-attr-value>${val}</span>
                      <button type="button" class="attr-step" data-step="1" aria-label="Aumentar ${escapeHtml(a)}">+</button>
                    </div>
                    <span class="attr-row__tag" data-attr-tag></span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
                <div class="char-create__skills">
                  <label class="create-form__label">Perícias / Talentos</label>
                  <div class="list-builder" id="charSkills" data-items='${escapeHtml(JSON.stringify(Array.isArray(c.skills) ? c.skills : []))}'>
            <div class="list-builder__row">
              <input type="text" class="create-form__input list-builder__input" placeholder="Digite uma perícia e Enter…" maxlength="120">
              <button type="button" class="btn btn-ghost list-builder__add">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span>Adicionar</span>
              </button>
            </div>
            <div class="list-builder__items" aria-live="polite">
              ${(Array.isArray(c.skills) ? c.skills : []).map((item, i) => listBuilderItemHTML(item, i)).join('')}
            </div>
                  </div>
                </div>
          </div>
            </section>

            <section class="char-create__section" id="char-form-arcano">
              <header class="char-create__section-head"><span>III</span><div><h2>Natureza Arcana</h2><p>O Despertar define a relação da persona com a Mana.</p></div></header>
              <div class="awakening" id="awakening"></div>
            </section>

            <section class="char-create__section" id="char-form-confronto">
              <header class="char-create__section-head"><span>IV</span><div><h2>Confronto</h2><p>Bases defensivas, integridade anatômica e reserva de Mana.</p></div></header>
              <div class="char-create__defenses">
                <label class="dossier-field"><span>Atributo base de DA</span><select id="charDaAttr" class="create-form__input char-select">${CHAR_ATTRIBUTES.map((a) => `<option value="${escapeHtml(a)}" ${a === (idn.daAttr || 'Destreza') ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}</select><small>A DA atual é rolada na ficha.</small></label>
                <label class="dossier-field"><span>Defesa Física base</span><select id="charDfBase" class="create-form__input char-select">${defenseOptions(dfBaseOf(c))}</select><small>Equipamentos são somados na ficha.</small></label>
                <label class="dossier-field"><span>Defesa Mágica base</span><select id="charDmBase" class="create-form__input char-select">${defenseOptions(dmBaseOf(c))}</select><small>Equipamentos são somados na ficha.</small></label>
              </div>
              <div class="char-create__resources">
                <div>
                  <label class="create-form__label">Integridade anatômica</label>
                  <p class="char-hint">Valores máximos definidos pela raça, com ajuste manual quando necessário.</p>
                  <div class="hp-form" id="charHpForm">${characterHpFormHTML(hpValues)}</div>
                </div>
                <label class="dossier-field dossier-field--mana char-create__mana"><span>Mana</span><input type="text" id="charMana" class="create-form__input" value="${escapeHtml(manaValue || '')}" placeholder="15/15" maxlength="20"><small>Disponível apenas para quem aceita o Despertar.</small></label>
              </div>
            </section>

            <section class="char-create__section" id="char-form-historia">
              <header class="char-create__section-head"><span>V</span><div><h2>História</h2><p>Origem, vínculos e acontecimentos que formaram a persona.</p></div></header>
              ${editorToolbarHTML(idn.bodyHtml || '')}
            </section>
          </div>

          <div class="create-form__actions char-create__actions">
            <a href="${cancelHref}" class="btn btn-ghost">Cancelar</a>
            <button type="submit" class="btn btn-primary" id="charSave"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg><span>${escapeHtml(saveLabel)}</span></button>
          </div>
        </form>
      </section>
    `;
  }

  /* ── NOT FOUND ────────────────────────────────── */
  function viewNotFound(what) {
    return `
      <section class="not-found">
        <div class="not-found__glyph">404</div>
        <h2>Entrada não encontrada</h2>
        <p>O caminho <code>${escapeHtml(what || '?')}</code> não existe no codex.</p>
        <a href="#/" class="btn btn-primary">Voltar ao início</a>
      </section>
    `;
  }

  /* ── FORBIDDEN ────────────────────────────────── */
  function viewForbidden() {
    return `
      <section class="not-found">
        <div class="not-found__glyph">403</div>
        <h2>Acesso restrito</h2>
        <p>Esta área é exclusiva do Mestre da campanha.</p>
        <a href="#/" class="btn btn-primary">Voltar ao início</a>
      </section>
    `;
  }

  /* ── RENDER ───────────────────────────────────── */
  let lastRoute = '';
  let renderSequence = 0;
  let raceAnatomyParallaxCleanup = null;

  function syncAmbientMode(tabId) {
    const suspended = !!document.getElementById('authGate') || ((auth.canRead || !sb) && (tabId === 'Index' || tabId === 'Arcano' || tabId === 'Mesas'));
    window.dispatchEvent(new CustomEvent('arcano:ambient-mode', { detail: { suspended } }));
  }

  function attachRaceAnatomyParallax() {
    if (raceAnatomyParallaxCleanup) raceAnatomyParallaxCleanup();
    raceAnatomyParallaxCleanup = null;
    const roots = [...document.querySelectorAll('[data-race-anatomy-parallax]')];
    if (!roots.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const updateScroll = () => {
      frame = 0;
      roots.forEach((root) => {
        const rect = root.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const ratio = Math.max(-1, Math.min(1, (center - window.innerHeight / 2) / window.innerHeight));
        root.style.setProperty('--anatomy-scroll', `${ratio * -16}px`);
        root.style.setProperty('--anatomy-scroll-back', `${ratio * 5.1}px`);
        root.style.setProperty('--anatomy-scroll-mid', `${ratio * 9.3}px`);
        root.style.setProperty('--anatomy-scroll-sigil', `${ratio * 3.2}px`);
      });
    };
    const requestScrollUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScroll);
    };
    const listeners = [];
    roots.forEach((root) => {
      const move = (event) => {
        const rect = root.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
        const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
        root.style.setProperty('--anatomy-x', `${x * 12}px`);
        root.style.setProperty('--anatomy-y', `${y * 10}px`);
        root.style.setProperty('--anatomy-x-back', `${x * -5}px`);
        root.style.setProperty('--anatomy-y-back', `${y * -4.2}px`);
        root.style.setProperty('--anatomy-x-mid', `${x * -2.4}px`);
        root.style.setProperty('--anatomy-y-mid', `${y * -2}px`);
        root.style.setProperty('--anatomy-x-sigil', `${x * -3.6}px`);
        root.style.setProperty('--anatomy-y-sigil', `${y * -3}px`);
        root.style.setProperty('--anatomy-x-dust', `${x * 2.2}px`);
        root.style.setProperty('--anatomy-tilt-x', `${y * -2.2}deg`);
        root.style.setProperty('--anatomy-tilt-y', `${x * 2.8}deg`);
      };
      const leave = () => {
        root.style.setProperty('--anatomy-x', '0px');
        root.style.setProperty('--anatomy-y', '0px');
        root.style.setProperty('--anatomy-x-back', '0px');
        root.style.setProperty('--anatomy-y-back', '0px');
        root.style.setProperty('--anatomy-x-mid', '0px');
        root.style.setProperty('--anatomy-y-mid', '0px');
        root.style.setProperty('--anatomy-x-sigil', '0px');
        root.style.setProperty('--anatomy-y-sigil', '0px');
        root.style.setProperty('--anatomy-x-dust', '0px');
        root.style.setProperty('--anatomy-tilt-x', '0deg');
        root.style.setProperty('--anatomy-tilt-y', '0deg');
      };
      root.addEventListener('pointermove', move);
      root.addEventListener('pointerleave', leave);
      listeners.push([root, move, leave]);
    });
    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    updateScroll();
    raceAnatomyParallaxCleanup = () => {
      window.removeEventListener('scroll', requestScrollUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      listeners.forEach(([root, move, leave]) => {
        root.removeEventListener('pointermove', move);
        root.removeEventListener('pointerleave', leave);
      });
    };
  }

  async function render(force) {
    const { tab, entry, action } = parseHash();
    const routeKey = `${tab}|${entry || ''}|${action || ''}`;
    if (!force && routeKey === lastRoute) return;
    lastRoute = routeKey;
    document.body.classList.remove('is-mesa-chat');
    const sequence = ++renderSequence;
    document.body.classList.add('is-routing');
    view.setAttribute('aria-busy', 'true');
    setTimeout(() => { if (sequence === renderSequence) { document.body.classList.remove('is-routing'); view.removeAttribute('aria-busy'); } }, 10000);

    characterFormMesaId = '';
    characterFormNpc = false;
    npcFormCtx = null;
    viewedNpc = null;
    const mesaRoute = tab === 'Mesas' ? parseMesaRoute(entry, action) : null;
    if (!mesaRoute || mesaRoute.view !== 'mesa' || mesaRoute.tab !== 'chat') unsubscribeMesaChat();

    if (auth.canRead && sb) {
      await loadMesas();
      startMessageNotifications();
      if (mesaRoute) {
        if (!(await prepareMesaRoute(mesaRoute))) return;
      }
      else if (tab === 'Painel') await loadPanelUsers();
      else if (tab === 'Persona') await loadCharacters();
      else if (action && (tab === 'Historias' || tab === 'Eras')) {
        await Promise.all([
          entry ? loadEntryDetails(entryById(entry)) : Promise.resolve(),
          loadTabFields('Eras'),
          loadTabFields('Historias')
        ]);
      }
      else if (entry) await loadEntryDetails(entryById(entry));
      else if (tab === 'Eras' && !action) await Promise.all([loadTabFields('Eras'), loadTabFields('Historias')]);
      else if (tab !== 'Index' && !action && tabById(tab)) await loadTabFields(tab);
      if (sequence !== renderSequence) return;
    }

    renderSidenav(tab);

    let html;
    if (tab === 'Index' && !entry && !action) html = viewPlatformHome();
    else if (tab === 'Arcano' && !entry && !action) html = viewHome();
    else if (tab === 'Index' && action === 'editar') html = viewEditIndex();
    else if (mesaRoute) html = viewMesaRoute(mesaRoute);
    else if (tab === 'Painel') html = viewPanel();
    else if (tab === 'Persona') {
      // Persona = fichas de personagem dos jogadores (não usa o fluxo de stories).
      if (action === 'criar' && !entry) html = viewCharacterForm(null);
      else if (action === 'editar' && entry) html = viewCharacterForm(entry);
      else if (entry) html = viewCharacterSheetFolio(entry);
      else html = viewPersonaRoster();
    }
    else if (!tabById(tab)) html = viewNotFound(tab);
    else if (action === 'criar' && !entry) html = viewCreate(tab);
    else if (action === 'editar' && entry) html = viewCreate(tab, entry);
    else if (entry) html = viewEntry(tab, entry);
    else {
      const state = categoryState[tab] || {};
      html = viewCategory(tab, state.query || '', state.tag || '', state.spell || EMPTY_SPELL_FILTERS);
    }

    view.classList.add('is-leaving');
    setTimeout(() => {
      if (sequence !== renderSequence) return;
      view.innerHTML = html;
      document.body.classList.remove('is-routing');
      view.removeAttribute('aria-busy');
      syncAmbientMode(tab);
      view.classList.remove('is-leaving');
      view.classList.add('is-entering');
      requestAnimationFrame(() => {
        view.classList.remove('is-entering');
        animateView();
        attachCategoryFilter();
        attachChronoscope();
        attachStoryReader();
        attachCreateForm();
        attachSpellForm();
        attachCharacterForm();
        attachEditIndexForm();
        attachIndexEditButton();
        attachBackupButtons();
        attachHomeParallax();
        attachSpellPageTurns();
        attachDeleteHandlers();
        attachCharacterDeleteHandlers();
        attachCharacterSheet();
        attachMesaHandlers();
        attachPanelHandlers();
        attachLevelPanel();
        attachBeastAbilityCards();
        attachRaceAnatomyParallax();
      });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 180);
  }

  function beastAbilityRowsHTML(ability) {
    const rows = [
      ['Ativação', ability.trigger],
      ['Custo', ability.cost],
      ['Alcance', ability.range],
      ['Duração', ability.duration],
      ['Limite', ability.limit]
    ].filter(([, value]) => value);
    const combat = combatOfAbility(ability);
    const combatRead = combat.combat ? combatBadgeHTML(combat.combat, { useForm: combat.useForm }) : '';
    if (!rows.length && !combatRead) return '';
    return `
      ${rows.length ? `<dl class="ability-modal__meta">
        ${rows.map(([label, value]) => `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `).join('')}
      </dl>` : ''}
      ${combatRead ? `<div class="combat-read">${combatRead}${combat.derived ? '<small class="combat-read__note">Lido do texto. Ao editar a besta, o Mestre confirma e salva.</small>' : ''}</div>` : ''}
    `;
  }

  /* Uso em combate de uma habilidade de besta: a magia vinculada manda. */
  function combatOfAbility(ability) {
    const a = ability || {};
    if (a.source === 'magic' && a.refId) {
      const linked = entryById(a.refId);
      if (linked) return { ...combatOfEntry(linked), useForm: (linked.fields || {})['Forma de Uso'] || '' };
    }
    const saved = normalizeCombat(a.combat);
    if (saved) return { combat: saved, derived: false, doubts: [] };
    const r = combatFromBeastAbility(a);
    return { combat: r.combat, derived: true, doubts: r.doubts };
  }

  function openBeastAbilityModal(ability) {
    const existing = document.getElementById('beastAbilityModal');
    if (existing) existing.remove();
    const linked = ability.source === 'magic' && ability.refId && entryById(ability.refId);
    const overlay = document.createElement('div');
    overlay.id = 'beastAbilityModal';
    overlay.className = 'ability-modal';
    overlay.style.setProperty('--hue', themeOf('Bestiario').hue);
    overlay.innerHTML = `
      <div class="ability-modal__backdrop" data-ability-close></div>
      <article class="ability-modal__panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(ability.name)}">
        <header class="ability-modal__head">
          <div class="ability-modal__titlewrap">
            <span class="section__eyebrow">HABILIDADE</span>
            <h2>${escapeHtml(ability.name)}</h2>
          </div>
          <button type="button" class="ability-modal__close" data-ability-close aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </header>
        <div class="ability-modal__chips">
          <span class="beast-ability-kind">${escapeHtml(ability.kind)}</span>
          <span class="ability-modal__origin">${ability.source === 'magic' ? 'Magia vinculada' : 'Avulsa'}</span>
          ${linked ? `<a class="beast-ability-codex beast-ability-codex--modal" href="#/Magias/${encodeURIComponent(ability.refId)}">Codex</a>` : ''}
        </div>
        ${beastAbilityRowsHTML(ability)}
        ${ability.effect ? `
          <section class="ability-modal__effect">
            <span class="section__eyebrow">EFEITO</span>
            <p>${escapeHtml(ability.effect)}</p>
          </section>
        ` : ''}
        ${ability.summary && ability.summary !== ability.effect ? `<p class="ability-modal__summary">${escapeHtml(ability.summary)}</p>` : ''}
      </article>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('is-modal-open');
    const close = () => {
      overlay.remove();
      document.body.classList.remove('is-modal-open');
      document.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('click', (e) => {
      if (e.target.closest('[data-ability-close]')) { close(); return; }
      if (e.target.closest('.beast-ability-codex')) close();
    });
    document.addEventListener('keydown', onKey);
  }

  function attachBeastAbilityCards() {
    const root = document.querySelector('[data-beast-entry-id]');
    if (!root || root.dataset.abilitiesBound) return;
    root.dataset.abilitiesBound = '1';
    const entry = entryById(root.dataset.beastEntryId) || (viewedNpc && viewedNpc.id === root.dataset.beastEntryId ? viewedNpc : null);
    if (!entry) return;
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-beast-ability-index]');
      if (!btn) return;
      const abilities = normalizeBeastAbilities((entry.fields || {})['Habilidades']);
      const ability = abilities[Number(btn.dataset.beastAbilityIndex)];
      if (ability) openBeastAbilityModal(ability);
    });
  }

  /* ── ANIMATIONS ───────────────────────────────── */
  function animateView() {
    document.querySelectorAll('[data-text-reveal]').forEach((el) => {
      if (el.dataset.revealed) return;
      el.dataset.revealed = '1';
      const txt = el.textContent;
      el.innerHTML = '';
      [...txt].forEach((ch, i) => {
        const s = document.createElement('span');
        s.className = 'char';
        s.style.animationDelay = `${i * 35}ms`;
        s.textContent = ch === ' ' ? ' ' : ch;
        el.appendChild(s);
      });
    });
  }

  /* ── CATEGORY FILTER ──────────────────────────── */
  function attachChronoscope() {
    const root = document.querySelector('[data-chronoscope]');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';
    const eras = narrativeEraEntries();
    const events = narrativeEvents();
    const preview = root.querySelector('[data-chrono-preview]');
    const eventButtons = [...root.querySelectorAll('[data-chrono-event]')];
    const selectEvent = (id, focus = false) => {
      const entry = entryById(id);
      if (!entry) return;
      let selectedButton = null;
      root.querySelectorAll('[data-chrono-event]').forEach((button) => {
        const selected = button.dataset.chronoEvent === id;
        button.classList.toggle('is-active', selected);
        if (button.matches('.chrono-event')) button.setAttribute('aria-pressed', String(selected));
        if (selected && button.matches('.chrono-event')) selectedButton = button;
      });
      const eraIndex = selectedButton?.dataset.chronoEraIndex;
      root.querySelectorAll('[data-chrono-era]').forEach((button) => button.classList.toggle('is-active', button.dataset.chronoEra === eraIndex));
      root.querySelectorAll('.chrono-era-band').forEach((band) => band.classList.toggle('is-active', band.dataset.eraIndex === eraIndex));
      if (selectedButton) root.style.setProperty('--active-x', selectedButton.style.getPropertyValue('--event-left'));
      if (preview) {
        preview.classList.remove('is-revealed');
        preview.innerHTML = narrativePreviewHTML(entry, eras);
        requestAnimationFrame(() => preview.classList.add('is-revealed'));
      }
      if (focus) selectedButton?.focus();
    };
    eventButtons.forEach((button) => {
      if (button.closest('.chrono-mobile-event')) {
        button.addEventListener('click', () => {
          const article = button.closest('.chrono-mobile-event');
          const details = article.querySelector('div');
          const opening = button.getAttribute('aria-expanded') !== 'true';
          root.querySelectorAll('.chrono-mobile-event').forEach((item) => {
            item.querySelector('button').setAttribute('aria-expanded', 'false');
            item.querySelector('div').hidden = true;
            item.classList.remove('is-expanded');
          });
          button.setAttribute('aria-expanded', String(opening));
          details.hidden = !opening;
          article.classList.toggle('is-expanded', opening);
        });
        return;
      }
      button.addEventListener('pointerenter', () => selectEvent(button.dataset.chronoEvent));
      button.addEventListener('focus', () => selectEvent(button.dataset.chronoEvent));
      button.addEventListener('click', () => selectEvent(button.dataset.chronoEvent));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const visible = eventButtons.filter((item) => !item.closest('.chrono-mobile-event') && !item.hidden);
        const index = visible.indexOf(button);
        const next = visible[(index + (event.key === 'ArrowRight' ? 1 : -1) + visible.length) % visible.length];
        if (next) selectEvent(next.dataset.chronoEvent, true);
      });
    });
    const branchToggle = root.querySelector('[data-chrono-branches]');
    branchToggle?.addEventListener('click', () => {
      const visible = branchToggle.getAttribute('aria-pressed') !== 'true';
      branchToggle.setAttribute('aria-pressed', String(visible));
      root.classList.toggle('branches-hidden', !visible);
      root.querySelectorAll('.chrono-event--branch').forEach((item) => { item.hidden = !visible; });
    });
    root.querySelectorAll('[data-chrono-era]').forEach((button) => button.addEventListener('click', () => {
      const index = Number(button.dataset.chronoEra);
      root.querySelectorAll('[data-chrono-era]').forEach((item) => item.classList.toggle('is-active', item === button));
      const track = root.querySelector('.chrono-track-scroll');
      const target = root.querySelector(`#chrono-era-${index}`);
      if (track && target) track.scrollTo({ left: Math.max(0, target.offsetLeft - 24), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }));
    const stage = root.querySelector('[data-chrono-stage]');
    if (stage && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let frame = 0;
      let pointerX = 50;
      let pointerY = 50;
      let pointerBounds = null;
      const paintPointer = () => {
        frame = 0;
        stage.style.setProperty('--pointer-x', `${pointerX}%`);
        stage.style.setProperty('--pointer-y', `${pointerY}%`);
      };
      stage.addEventListener('pointerenter', () => { pointerBounds = stage.getBoundingClientRect(); });
      stage.addEventListener('pointermove', (event) => {
        const rect = pointerBounds || stage.getBoundingClientRect();
        pointerX = ((event.clientX - rect.left) / rect.width) * 100;
        pointerY = ((event.clientY - rect.top) / rect.height) * 100;
        if (!frame) frame = requestAnimationFrame(paintPointer);
      });
      stage.addEventListener('pointerleave', () => {
        pointerBounds = null;
        pointerX = 50;
        pointerY = 48;
        if (!frame) frame = requestAnimationFrame(paintPointer);
      });
    }
    const first = events.find((entry) => !narrativeIsBranch(entry)) || events[0];
    if (first) selectEvent(first.id);
  }

  function attachStoryReader(scope = document) {
    const reader = scope.querySelector('[data-story-reader]');
    if (!reader || reader.dataset.bound) return;
    reader.dataset.bound = '1';
    const focusButton = reader.querySelector('[data-reader-focus]');
    focusButton?.addEventListener('click', () => {
      const active = !reader.classList.contains('is-focused');
      reader.classList.toggle('is-focused', active);
      focusButton.setAttribute('aria-pressed', String(active));
      focusButton.textContent = active ? 'Sair do foco' : 'Modo focado';
    });
    const progress = reader.querySelector('[data-reading-progress]');
    const update = () => {
      if (!progress || !reader.isConnected) return;
      const start = reader.offsetTop;
      const total = Math.max(1, reader.offsetHeight - innerHeight);
      progress.style.width = `${Math.max(0, Math.min(100, ((scrollY - start) / total) * 100))}%`;
    };
    addEventListener('scroll', update, { passive: true });
    update();
  }

  function attachCategoryFilter() {
    const input = document.getElementById('catSearch');
    const tagButtons = document.querySelectorAll('[data-tag-filter]');
    const spellFilterButtons = document.querySelectorAll('[data-spell-filter]');
    const spellResetButtons = document.querySelectorAll('[data-spell-filter-reset]');
    const spellFilterToggle = document.querySelector('[data-spell-filter-toggle]');
    const beastFilterButtons = document.querySelectorAll('[data-beast-filter]');
    const beastFilterReset = document.querySelector('[data-beast-filter-reset]');
    const beastFilterToggle = document.querySelector('[data-beast-filter-toggle]');
    const raceFilterButtons = document.querySelectorAll('[data-race-filter]');
    const raceFilterReset = document.querySelector('[data-race-filter-reset]');
    const raceFilterToggle = document.querySelector('[data-race-filter-toggle]');
    if (!input && !tagButtons.length && !spellFilterButtons.length && !spellResetButtons.length && !spellFilterToggle && !beastFilterButtons.length && !beastFilterReset && !beastFilterToggle && !raceFilterButtons.length && !raceFilterReset && !raceFilterToggle) return;

    const refreshCategory = ({ keepFocus = false, cursor = null } = {}) => {
      const { tab } = parseHash();
      const state = categoryState[tab] || {};
      view.innerHTML = viewCategory(tab, state.query || '', state.tag || '', state.spell || EMPTY_SPELL_FILTERS);
      animateView();
      attachCategoryFilter();
      if (keepFocus) {
        const fresh = document.getElementById('catSearch');
        if (fresh) {
          fresh.focus();
          if (cursor !== null) fresh.setSelectionRange(cursor, cursor);
        }
      }
    };

    if (input && !input.dataset.bound) {
      input.dataset.bound = '1';
      let t;
      input.addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => {
          const { tab } = parseHash();
          categoryState[tab] = {
            ...(categoryState[tab] || {}),
            query: e.target.value
          };
          refreshCategory({ keepFocus: true, cursor: e.target.selectionStart });
        }, 110);
      });
    }

    tagButtons.forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const { tab } = parseHash();
        categoryState[tab] = {
          ...(categoryState[tab] || {}),
          tag: btn.dataset.tagFilter || ''
        };
        refreshCategory();
      });
    });

    beastFilterButtons.forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const { tab } = parseHash();
        const state = categoryState[tab] || {};
        const current = normalizeBeastFilters(state.beast);
        const key = btn.dataset.beastFilter;
        if (!Object.prototype.hasOwnProperty.call(current, key)) return;
        categoryState[tab] = {
          ...state,
          beastFiltersOpen: true,
          beast: { ...current, [key]: btn.dataset.beastFilterValue || '' }
        };
        refreshCategory();
      });
    });

    if (beastFilterReset && !beastFilterReset.dataset.bound) {
      beastFilterReset.dataset.bound = '1';
      beastFilterReset.addEventListener('click', () => {
        const { tab } = parseHash();
        categoryState[tab] = {
          ...(categoryState[tab] || {}),
          beastFiltersOpen: true,
          beast: { ...EMPTY_BEAST_FILTERS }
        };
        refreshCategory();
      });
    }

    if (beastFilterToggle && !beastFilterToggle.dataset.bound) {
      beastFilterToggle.dataset.bound = '1';
      beastFilterToggle.addEventListener('click', () => {
        const { tab } = parseHash();
        const state = categoryState[tab] || {};
        categoryState[tab] = { ...state, beastFiltersOpen: !state.beastFiltersOpen };
        refreshCategory();
      });
    }

    raceFilterButtons.forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const { tab } = parseHash();
        const state = categoryState[tab] || {};
        const current = normalizeRaceFilters(state.race);
        const key = btn.dataset.raceFilter;
        if (!Object.prototype.hasOwnProperty.call(current, key)) return;
        categoryState[tab] = {
          ...state,
          raceFiltersOpen: true,
          race: { ...current, [key]: btn.dataset.raceFilterValue || '' }
        };
        refreshCategory();
      });
    });

    if (raceFilterReset && !raceFilterReset.dataset.bound) {
      raceFilterReset.dataset.bound = '1';
      raceFilterReset.addEventListener('click', () => {
        const { tab } = parseHash();
        categoryState[tab] = {
          ...(categoryState[tab] || {}),
          raceFiltersOpen: true,
          race: { ...EMPTY_RACE_FILTERS }
        };
        refreshCategory();
      });
    }

    if (raceFilterToggle && !raceFilterToggle.dataset.bound) {
      raceFilterToggle.dataset.bound = '1';
      raceFilterToggle.addEventListener('click', () => {
        const { tab } = parseHash();
        const state = categoryState[tab] || {};
        categoryState[tab] = { ...state, raceFiltersOpen: !state.raceFiltersOpen };
        refreshCategory();
      });
    }

    spellFilterButtons.forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const { tab } = parseHash();
        const state = categoryState[tab] || {};
        const current = normalizeSpellFilters(state.spell);
        const key = btn.dataset.spellFilter;
        if (!Object.prototype.hasOwnProperty.call(current, key)) return;
        categoryState[tab] = {
          ...state,
          spellFiltersOpen: btn.closest('.spell-filter-panel') ? true : !!state.spellFiltersOpen,
          spell: {
            ...current,
            [key]: btn.dataset.spellFilterValue || ''
          }
        };
        refreshCategory();
      });
    });

    spellResetButtons.forEach((spellReset) => {
      if (spellReset.dataset.bound) return;
      spellReset.dataset.bound = '1';
      spellReset.addEventListener('click', () => {
        const { tab } = parseHash();
        categoryState[tab] = {
          ...(categoryState[tab] || {}),
          spellFiltersOpen: true,
          spell: { ...EMPTY_SPELL_FILTERS }
        };
        refreshCategory();
      });
    });

    if (spellFilterToggle && !spellFilterToggle.dataset.bound) {
      spellFilterToggle.dataset.bound = '1';
      spellFilterToggle.addEventListener('click', () => {
        const { tab } = parseHash();
        const state = categoryState[tab] || {};
        categoryState[tab] = {
          ...state,
          spellFiltersOpen: !state.spellFiltersOpen
        };
        refreshCategory();
      });
    }
  }

  /* ── FORM HELPERS ──────────────────────────────── */
  function bindBannerDrop({ initialUrl } = {}) {
    const drop = document.getElementById('bannerDrop');
    const fileInput = document.getElementById('bannerInput');
    const preview = document.getElementById('bannerPreview');
    const placeholder = document.getElementById('bannerPlaceholder');
    const clearBtn = document.getElementById('bannerClear');
    if (!drop) return { getDataUrl: () => '', getFile: () => null };

    let bannerDataUrl = initialUrl || '';
    let bannerFile = null;

    drop.addEventListener('click', (e) => {
      if (e.target.closest('.banner-drop__clear')) return;
      fileInput.click();
    });
    drop.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });
    drop.addEventListener('dragover', (e) => {
      e.preventDefault();
      drop.classList.add('is-dragging');
    });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-dragging'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('is-dragging');
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) loadBanner(file);
    });
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) loadBanner(file);
    });
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      bannerDataUrl = '';
      bannerFile = null;
      preview.style.backgroundImage = '';
      preview.hidden = true;
      placeholder.hidden = false;
      clearBtn.hidden = true;
      fileInput.value = '';
    });

    async function loadBanner(file) {
      if (!file.type.startsWith('image/')) {
        toast('Selecione um arquivo de imagem.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        if (!(await askConfirm('A imagem é grande (' + Math.round(file.size / 1024) + ' KB). Continuar?', { confirmLabel: 'Continuar' }))) return;
      }
      bannerFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        bannerDataUrl = reader.result;
        preview.style.backgroundImage = `url('${bannerDataUrl}')`;
        preview.hidden = false;
        placeholder.hidden = true;
        clearBtn.hidden = false;
      };
      reader.readAsDataURL(file);
    }

    return {
      getDataUrl: () => bannerDataUrl,
      getFile: () => bannerFile
    };
  }

  function bindTagBuilder({ tabId = '', initialTags = [], excludeEntryId = '' } = {}) {
    const root = document.getElementById('tagBuilder');
    if (!root) return { getTags: () => [] };

    const nameInput = document.getElementById('tagNameInput');
    const colorInput = document.getElementById('tagColorInput');
    const colorPreview = document.getElementById('tagColorPreview');
    const addBtn = document.getElementById('tagAddBtn');
    const list = document.getElementById('tagList');
    const suggestions = document.getElementById('tagSuggestions');
    let tags = sanitizeTags(initialTags);

    /* Coleta tags ja usadas em outras entries da mesma categoria.
       Cada sugestao tem {label, color, count} e a cor mais recente. */
    function collectKnownTags() {
      if (!tabId) return [];
      const map = new Map();
      ARCHIVE.entries.forEach((entry) => {
        if (entry.id === excludeEntryId) return;
        if (canonicalTabId(entry.tab) !== canonicalTabId(tabId)) return;
        sanitizeTags(entry.tags).forEach((t) => {
          const key = tagKey(t.label);
          const cur = map.get(key) || { label: t.label, color: t.color, count: 0, key };
          cur.count += 1;
          // Atualiza para a cor mais recente vista (entries vem em ordem de criação desc).
          cur.color = t.color;
          map.set(key, cur);
        });
      });
      return [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'pt-BR'));
    }

    const known = collectKnownTags();

    function renderTags() {
      list.innerHTML = tags.length
        ? tags.map((tag, i) => `
            <span class="story-tag story-tag--editable" style="--tag:${safeTagColor(tag.color)}">
              ${escapeHtml(tag.label)}
              <button type="button" data-remove-tag="${i}" aria-label="Remover tag ${escapeHtml(tag.label)}">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </span>
          `).join('')
        : '<span class="tag-builder__empty">Nenhuma tag adicionada</span>';
    }

    function activeKeys() {
      return new Set(tags.map((t) => tagKey(t.label)));
    }

    function renderSuggestions() {
      if (!suggestions) return;
      const used = activeKeys();
      const q = normalize(nameInput.value || '').trim();
      const pool = known.filter((s) => !used.has(s.key));
      const filtered = q
        ? pool.filter((s) => normalize(s.label).includes(q)).slice(0, 12)
        : pool.slice(0, 12);
      if (!filtered.length) {
        suggestions.innerHTML = q
          ? `<span class="tag-suggest__empty">Nenhuma tag existente. Pressione Adicionar para criar “${escapeHtml(q.slice(0, 32))}”.</span>`
          : (known.length
              ? '<span class="tag-suggest__empty">Todas as tags da categoria já foram usadas aqui.</span>'
              : '<span class="tag-suggest__empty">Sem tags ainda nesta categoria. Crie a primeira ao lado.</span>');
        return;
      }
      suggestions.innerHTML = `
        <span class="tag-suggest__label">Tags da categoria</span>
        <div class="tag-suggest__list">
          ${filtered.map((s) => `
            <button type="button" class="story-tag story-tag--suggest" data-suggest-label="${escapeHtml(s.label)}" data-suggest-color="${s.color}" style="--tag:${s.color}" title="Usar tag existente">
              ${escapeHtml(s.label)}
              ${s.count > 1 ? `<em class="tag-suggest__count">${s.count}</em>` : ''}
            </button>
          `).join('')}
        </div>
      `;
    }

    function addFromInputs() {
      const label = cleanTagLabel(nameInput.value);
      if (!label) {
        nameInput.focus();
        return;
      }
      const knownMatch = known.find((s) => s.key === tagKey(label));
      const color = knownMatch ? knownMatch.color : safeTagColor(colorInput.value);
      addTag(label, color);
    }

    function addTag(label, color) {
      const key = tagKey(label);
      const existing = tags.find((tag) => tagKey(tag.label) === key);
      if (existing) existing.color = safeTagColor(color);
      else if (tags.length < 8) tags.push({ label, color: safeTagColor(color) });
      else {
        toast('Use no máximo 8 tags por história.');
        return;
      }
      nameInput.value = '';
      renderTags();
      renderSuggestions();
      nameInput.focus();
    }

    colorInput.addEventListener('input', () => {
      colorPreview.style.background = safeTagColor(colorInput.value);
    });
    addBtn.addEventListener('click', addFromInputs);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addFromInputs();
      }
    });
    nameInput.addEventListener('input', renderSuggestions);
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-tag]');
      if (!btn) return;
      tags.splice(Number(btn.dataset.removeTag), 1);
      renderTags();
      renderSuggestions();
    });
    if (suggestions) {
      suggestions.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-suggest-label]');
        if (!btn) return;
        addTag(btn.dataset.suggestLabel, btn.dataset.suggestColor);
      });
    }

    renderTags();
    renderSuggestions();
    return { getTags: () => sanitizeTags(tags) };
  }

  /* Dossier dinâmico para a categoria Itens (subtype + campos). */
  function bindDossierFields({ subtype = '', fields = {} } = {}) {
    const tabs = document.getElementById('subtypeTabs');
    const wrap = document.getElementById('dossierFields');
    if (!tabs || !wrap) return { getFields: () => ({}), getSubtype: () => null };

    let current = (subtype && ITEM_SUBTYPES[subtype]) ? subtype : ITEM_SUBTYPE_KEYS[0];
    let extraFields = itemExtraFieldsForForm(fields);
    /* Uso em combate: o salvo, ou o convertido do texto ao editar um item antigo. */
    let combat = normalizeCombat(fields && fields.Combate);
    if (!combat && fields && Object.keys(fields).length) {
      combat = combatFromItem(fields, current).combat;
    }
    const cache = {};
    Object.keys(ITEM_SUBTYPES).forEach((k) => {
      cache[k] = {};
      ITEM_SUBTYPES[k].fields.forEach((f) => {
        const direct = (fields && fields[f] != null) ? String(fields[f]) : '';
        const legacyDf = f === 'DF' ? itemFieldValue(fields, 'Defesa Fisica') || itemFieldValue(fields, 'Defesa Física') || itemFieldValue(fields, 'Defesa') : '';
        const legacyDm = f === 'DM' ? itemFieldValue(fields, 'Defesa Magica') || itemFieldValue(fields, 'Defesa Mágica') : '';
        cache[k][f] = direct || legacyDf || legacyDm || '';
      });
    });

    function placeholderFor(field) {
      switch (field) {
        case 'Valor': return 'Ex.: 30 moedas, Inestimável';
        case 'Efeito': return 'O que ele faz quando usado';
        case 'Slot': return 'Cabeça, Mão, Peito, Anel…';
        case 'DF': return '0 a 6; reduz dano fisico na ficha';
        case 'DM': return '0 a 6; reduz dano magico na ficha';
        case 'Defesa': return 'Campo antigo; prefira DF/DM';
        default: return field;
      }
    }

    function readValue(el) {
      if (!el) return '';
      if (el.classList && el.classList.contains('rarity-picker')) return el.dataset.value || '';
      return (el.value || '').toString();
    }

    function readExtraFieldsFromDOM() {
      const list = wrap.querySelector('[data-item-fields-list]');
      if (!list) return extraFields.slice();
      return Array.from(list.querySelectorAll('[data-item-field-row]'))
        .map((row) => {
          const selector = row.querySelector('[data-item-field-key]');
          const custom = row.querySelector('[data-item-field-custom]');
          const valueInput = row.querySelector('[data-item-field-value]');
          const selected = selector ? selector.value : '';
          const key = (selected === ITEM_EXTRA_FIELD_CUSTOM ? (custom?.value || '') : selected).trim();
          const value = String(valueInput?.value || '').trim();
          return key && value ? { key, value } : null;
        })
        .filter(Boolean);
    }

    function persistCurrent() {
      wrap.querySelectorAll('[data-dossier-field]').forEach((el) => {
        const k = el.dataset.dossierField;
        if (cache[current]) cache[current][k] = readValue(el);
      });
      extraFields = readExtraFieldsFromDOM();
      const combatRoot = wrap.querySelector('[data-combat-form]');
      if (combatRoot) combat = readCombatForm(combatRoot);
    }

    function usedFieldKeys() {
      const used = new Set(subtypeFieldsFor(current).map((key) => normalize(key)));
      extraFields.forEach((field) => used.add(normalize(field.key)));
      return used;
    }

    function addExtraField(key) {
      extraFields = readExtraFieldsFromDOM();
      const used = new Set(extraFields.map((field) => normalize(field.key)));
      if (used.has(normalize(key)) || subtypeFieldsFor(current).some((field) => normalize(field) === normalize(key))) return false;
      extraFields.push({ key, value: '' });
      return true;
    }

    function nextExtraFieldKey() {
      const used = new Set([
        ...subtypeFieldsFor(current).map((key) => normalize(key)),
        ...extraFields.map((field) => normalize(field.key))
      ]);
      const guide = itemSubtypeGuide(current);
      const suggested = guide.suggestions.find((key) => !used.has(normalize(key)));
      if (suggested) return suggested;
      const fallback = ITEM_EXTRA_FIELD_OPTIONS.find((opt) => !used.has(normalize(opt.key)));
      return fallback ? fallback.key : ITEM_EXTRA_FIELD_OPTIONS[0].key;
    }

    function guideHTML() {
      const guide = itemSubtypeGuide(current);
      return `
        <section class="item-guide" aria-live="polite">
          <div class="item-guide__mark" aria-hidden="true">${ITEM_SUBTYPES[current].icon}</div>
          <div class="item-guide__body">
            <div class="item-guide__top">
              <strong>${escapeHtml(guide.title)}</strong>
              <span>${escapeHtml(subtypeLabel(current))}</span>
            </div>
            <p>${escapeHtml(guide.text)}</p>
            <div class="item-guide__checks">
              ${guide.checks.map((check) => `<span>${escapeHtml(check)}</span>`).join('')}
            </div>
          </div>
        </section>
      `;
    }

    function fieldHTML(field) {
      const value = cache[current][field] || '';
      if (field === 'Raridade') {
        return `
          <div class="dossier-field">
            ${hintedLabel(field, itemHintFor(field))}
            <div class="rarity-picker" data-dossier-field="${escapeHtml(field)}" data-value="${escapeHtml(value)}" role="radiogroup" aria-label="Raridade">
              ${RARITY_OPTIONS.map((opt) => `
                <button type="button"
                        class="rarity-chip ${opt.cssClass} rarity-pick ${opt.value === value ? 'is-selected' : ''}"
                        data-rarity="${escapeHtml(opt.value)}"
                        role="radio"
                        aria-checked="${opt.value === value ? 'true' : 'false'}">
                  ${escapeHtml(opt.value)}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }
      return `
        <label class="dossier-field">
          ${hintedLabel(field, itemHintFor(field))}
          <input type="text" class="create-form__input" data-dossier-field="${escapeHtml(field)}"
                 placeholder="${escapeHtml(placeholderFor(field))}"
                 title="${escapeHtml(itemHintFor(field))}"
                 value="${escapeHtml(value)}" maxlength="160">
        </label>
      `;
    }

    function extraFieldOptionsHTML(selected) {
      const known = itemExtraFieldOption(selected);
      const selectedValue = known ? known.key : ITEM_EXTRA_FIELD_CUSTOM;
      return `
        ${ITEM_EXTRA_FIELD_OPTIONS.map((opt) => `
          <option value="${escapeHtml(opt.key)}" ${opt.key === selectedValue ? 'selected' : ''}>${escapeHtml(opt.key)}</option>
        `).join('')}
        <option value="${escapeHtml(ITEM_EXTRA_FIELD_CUSTOM)}" ${selectedValue === ITEM_EXTRA_FIELD_CUSTOM ? 'selected' : ''}>Campo personalizado</option>
      `;
    }

    function extraFieldRowHTML(field = {}) {
      const rawKey = field.key || ITEM_EXTRA_FIELD_OPTIONS[0].key;
      const known = itemExtraFieldOption(rawKey);
      const customHidden = known ? 'hidden' : '';
      const customValue = known ? '' : rawKey;
      const placeholder = itemExtraFieldPlaceholder(rawKey);
      const hint = itemHintFor(rawKey);
      return `
        <div class="item-field-row" data-item-field-row>
          <select class="create-form__input char-select item-field-select" data-item-field-key aria-label="Campo adicional" title="Escolha um campo comum ou personalize.">
            ${extraFieldOptionsHTML(rawKey)}
          </select>
          <input type="text" class="create-form__input item-field-custom" data-item-field-custom ${customHidden}
                 placeholder="Nome do campo" value="${escapeHtml(customValue)}" maxlength="48" title="Nome curto do campo personalizado.">
          <input type="text" class="create-form__input item-field-value" data-item-field-value
                 placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(field.value || '')}" maxlength="220"
                 aria-label="${escapeHtml(rawKey)}" title="${escapeHtml(hint || placeholder)}">
          <button type="button" class="item-field-remove" data-item-field-remove aria-label="Remover campo">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      `;
    }

    function extraFieldsHTML() {
      const used = usedFieldKeys();
      const guide = itemSubtypeGuide(current);
      const suggestions = guide.suggestions.filter((key) => !used.has(normalize(key)));
      return `
        <section class="item-field-builder">
          <header class="item-field-builder__head">
            <span class="item-field-builder__title">${hintedLabel('Campos adicionais', 'Use campos extras para regras específicas sem sobrecarregar todos os itens.')}</span>
            <button type="button" class="item-field-add" data-item-field-add>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              <span>Adicionar campo</span>
            </button>
          </header>
          ${suggestions.length ? `
            <div class="item-field-suggestions" aria-label="Campos sugeridos para ${escapeHtml(subtypeLabel(current))}">
              <span>Adicionar rápido</span>
              <div class="item-field-suggestions__list">
                ${suggestions.map((key) => `
                  <button type="button" class="item-field-suggest" data-item-field-suggest="${escapeHtml(key)}" title="${escapeHtml(itemHintFor(key) || itemExtraFieldPlaceholder(key))}">
                    ${escapeHtml(key)}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
          <div class="item-field-list" data-item-fields-list>
            ${extraFields.length
              ? extraFields.map(extraFieldRowHTML).join('')
              : '<p class="item-field-empty">Nenhum campo adicional. Use as sugestões acima apenas quando o item precisar de regra extra.</p>'}
          </div>
        </section>
      `;
    }

    function render(options = {}) {
      if (options.persist !== false) persistCurrent();
      const fields = subtypeFieldsFor(current);
      wrap.innerHTML = `
        ${guideHTML()}
        <div class="dossier-fields__base">
          ${fields.map(fieldHTML).join('')}
        </div>
        ${extraFieldsHTML()}
        ${current === 'item' ? '' : combatFormHTML(combat || { uso: 'nenhum' }, 'item')}
      `;
    }

    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.subtype-tab');
      if (!btn) return;
      persistCurrent();
      tabs.querySelectorAll('.subtype-tab').forEach((b) => b.classList.toggle('is-active', b === btn));
      tabs.querySelectorAll('.subtype-tab').forEach((b) => b.setAttribute('aria-selected', b === btn ? 'true' : 'false'));
      current = btn.dataset.subtype;
      render({ persist: false });
    });

    // Delegacao: chips de raridade e campos adicionais.
    wrap.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-item-field-add]');
      if (addBtn) {
        e.preventDefault();
        addExtraField(nextExtraFieldKey());
        render({ persist: false });
        return;
      }
      const suggestBtn = e.target.closest('[data-item-field-suggest]');
      if (suggestBtn) {
        e.preventDefault();
        addExtraField(suggestBtn.dataset.itemFieldSuggest || ITEM_EXTRA_FIELD_OPTIONS[0].key);
        render({ persist: false });
        return;
      }
      const removeBtn = e.target.closest('[data-item-field-remove]');
      if (removeBtn) {
        e.preventDefault();
        const row = removeBtn.closest('[data-item-field-row]');
        if (row) row.remove();
        extraFields = readExtraFieldsFromDOM();
        return;
      }
      const btn = e.target.closest('.rarity-pick');
      if (!btn) return;
      e.preventDefault();
      const picker = btn.closest('.rarity-picker');
      if (!picker) return;
      const value = btn.dataset.rarity || '';
      const newValue = picker.dataset.value === value ? '' : value;
      picker.dataset.value = newValue;
      picker.querySelectorAll('.rarity-pick').forEach((b) => {
        const active = b.dataset.rarity === newValue;
        b.classList.toggle('is-selected', active);
        b.setAttribute('aria-checked', active ? 'true' : 'false');
      });
    });

    wrap.addEventListener('change', (e) => {
      const selector = e.target.closest('[data-item-field-key]');
      if (!selector) return;
      const row = selector.closest('[data-item-field-row]');
      if (!row) return;
      const custom = row.querySelector('[data-item-field-custom]');
      const valueInput = row.querySelector('[data-item-field-value]');
      const isCustom = selector.value === ITEM_EXTRA_FIELD_CUSTOM;
      if (custom) {
        custom.hidden = !isCustom;
        if (!isCustom) custom.value = '';
      }
      if (valueInput) {
        const placeholder = itemExtraFieldPlaceholder(selector.value);
        const key = isCustom ? (custom?.value || 'Campo personalizado') : selector.value;
        valueInput.placeholder = placeholder;
        valueInput.title = itemHintFor(selector.value) || placeholder;
        valueInput.setAttribute('aria-label', key);
      }
    });

    render({ persist: false });

    return {
      getSubtype: () => current,
      getFields: () => {
        persistCurrent();
        const out = {};
        wrap.querySelectorAll('[data-dossier-field]').forEach((el) => {
          const v = readValue(el).trim();
          if (v) out[el.dataset.dossierField] = v;
        });
        const extras = readExtraFieldsFromDOM();
        if (extras.length) out.Campos = extras;
        if (current !== 'item' && combat) out.Combate = combat;
        return out;
      },
      getCombatErrors: () => combatFormErrors(wrap.querySelector('[data-combat-form]'))
    };
  }

  function raceRulesFormHTML(values) {
    const attrs = normalizeRaceAttributes(values);
    const options = [-2, -1, 0, 1, 2];
    return `
      <div class="race-rule-note"><strong>Dados raciais</strong><span>Cada ponto soma ou remove 1d6 dos testes do atributo na ficha de Personagem.</span></div>
      <div class="race-attr-form">
        ${CHAR_ATTRIBUTES.map((attr) => `<label class="race-attr-field"><span>${escapeHtml(attr)}</span><select class="create-form__input char-select" data-race-attr="${escapeHtml(attr)}">${options.map((value) => `<option value="${value}" ${attrs[attr] === value ? 'selected' : ''}>${value === 0 ? 'Sem alteração' : `${value > 0 ? '+' : ''}${value}d6`}</option>`).join('')}</select></label>`).join('')}
      </div>
      <label class="dossier-field dossier-field--mana race-mana-field"><span>Reserva de Mana</span><input type="text" class="create-form__input" data-dossier-field="Mana" value="${escapeHtml(values.Mana != null ? values.Mana : '15/15')}" placeholder="15/15" maxlength="20"><small>Define a reserva inicial para personagens que aceitam o Despertar.</small></label>`;
  }

  function raceAnatomyFormHTML(values) {
    const parts = raceAnatomy(values, true);
    return `
      <div class="beast-part-builder race-anatomy-builder" data-beast-parts>
        <div class="beast-part-builder__head"><div><strong>Partes do corpo</strong><span>A anatomia pode ser humanoide, alada, quadrúpede ou inteiramente própria.</span></div><small>${parts.length} ${parts.length === 1 ? 'parte' : 'partes'}</small></div>
        <div class="beast-part-list" data-beast-part-list>${parts.map((part, index) => beastHpPartRowHTML(part, index)).join('')}</div>
        <div class="beast-part-add">
          <select class="create-form__input char-select" data-beast-part-preset aria-label="Tipo de parte"><option value="Cabeça">Cabeça</option><option value="Peito">Peito</option><option value="Abdômen">Abdômen</option>${BEAST_EXTRA_PARTS.map((part) => `<option value="${escapeHtml(part)}">${escapeHtml(part)}</option>`).join('')}</select>
          <input type="text" class="create-form__input" data-beast-part-custom placeholder="ou nome personalizado..." maxlength="80">
          <button type="button" class="btn btn-ghost" data-beast-part-add><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg><span>Adicionar parte</span></button>
        </div>
      </div>`;
  }

  function raceAbilitiesFormHTML(values) {
    const abilities = normalizeRaceAbilities(values);
    return `
      <div class="beast-ability-builder race-ability-builder" data-beast-abilities>
        <div class="race-rule-note"><strong>Aptidões estruturadas</strong><span>Registre talento, gatilho, efeito e limite. Magias do Grimório também podem ser vinculadas.</span></div>
        <div class="beast-ability-list-form" data-beast-ability-list>${abilities.map((ability, index) => beastAbilityRowHTML(ability, index)).join('')}</div>
        <button type="button" class="btn btn-ghost beast-ability-add" data-beast-ability-add><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg><span>Adicionar aptidão</span></button>
      </div>`;
  }

  function raceRelationsFormHTML(values) {
    const relations = normalizeRaceRelations(values);
    return `
      <div class="race-relation-builder">
        <div class="race-rule-note"><strong>Raça não é cultura</strong><span>Vincule povos, territórios e crenças sem transformá-los em características biológicas obrigatórias.</span></div>
        ${RACE_RELATION_TABS.map(({ tab, label }) => {
          const entries = entriesIn(tab);
          const selected = new Set(relations[tab] || []);
          return `<section class="race-relation-group" data-race-relation="${tab}" data-selected='${escapeHtml(JSON.stringify([...selected]))}'>
            <header><span>${escapeHtml(label)}</span><small>${selected.size} vinculado${selected.size === 1 ? '' : 's'}</small></header>
            ${entries.length ? `<div>${entries.map((entry) => `<button type="button" class="race-relation-chip ${selected.has(entry.id) ? 'is-selected' : ''}" data-race-relation-id="${escapeHtml(entry.id)}" aria-pressed="${selected.has(entry.id) ? 'true' : 'false'}">${escapeHtml(entry.title)}</button>`).join('')}</div>` : `<p>Nenhum registro disponível em ${escapeHtml(label)}.</p>`}
          </section>`;
        }).join('')}
      </div>`;
  }

  /* Dossier sectioned (Racas / Bestiario): seções com tipos de campo variados. */
  function raceDossierFormHTML(tabId, values) {
    const v = values || {};
    const cfg = dossierConfigFor(tabId);
    const sectionContent = (section) => tabId === 'Racas' && section.view === 'raceRules'
      ? raceRulesFormHTML(v)
      : tabId === 'Racas' && section.view === 'raceAnatomy'
        ? raceAnatomyFormHTML(v)
        : tabId === 'Racas' && section.view === 'raceAbilities'
          ? raceAbilitiesFormHTML(v)
          : tabId === 'Racas' && section.view === 'raceRelations'
            ? raceRelationsFormHTML(v)
            : tabId === 'Bestiario' && section.view === 'attributes'
      ? beastAttributesFormHTML(v)
      : tabId === 'Bestiario' && section.view === 'vitals'
        ? beastVitalsFormHTML(v)
        : tabId === 'Bestiario' && section.view === 'drops'
          ? beastDropsFormHTML(v)
          : tabId === 'Bestiario' && section.view === 'abilities'
            ? beastAbilitiesFormHTML(v)
            : section.id === 'hpmp'
              ? raceHpFormHTML(v)
              : `<div class="dossier-section__fields">
                   ${section.fields.map((f) => raceFieldFormHTML(f, v[f.key])).join('')}
                 </div>`;
    const beastSectionHints = {
      natureza: 'Identidade, território e instinto da criatura.',
      atributos: 'Valores usados pelo sistema para testes e resistências.',
      vitalidade: 'Defina HP anatômico, DF, DM e a reserva de Mana.',
      orientacao: 'Instruções para apresentar e conduzir a criatura na história.',
      drops: 'Itens e espólios que podem ser obtidos.',
      habilidades: 'Poderes próprios ou magias vinculadas ao Codex.'
    };
    const raceSectionHints = {
      identidade: 'Nome, natureza e procedência reconhecível.',
      fisiologia: 'Corpo, sentidos, longevidade e limitações físicas.',
      regras: 'Modificadores aplicados diretamente à ficha de Personagem.',
      anatomia: 'Partes do corpo e vitalidade, sem anatomia obrigatoriamente humanoide.',
      aptidoes: 'Talentos, passivas, reações e limitações inatas.',
      mundo: 'Países, biomas, culturas, facções e deuses relacionados.'
    };
    if (tabId === 'Racas') {
      const pageGroups = [
        { page: 0, roman: 'I', eyebrow: 'IDENTIDADE', title: 'Classificação do Atlas', hint: 'Defina a natureza e a procedência reconhecível deste povo.', ids: ['identidade'], compact: true },
        { page: 1, roman: 'II', eyebrow: 'SEGUNDO CAPÍTULO', title: 'Fisiologia e percepção', hint: 'Descreva o corpo, os sentidos, a longevidade e os limites físicos.', ids: ['fisiologia'] },
        { page: 2, roman: 'III', eyebrow: 'TERCEIRO CAPÍTULO', title: 'Corpo e regras', hint: 'Modele o impacto na ficha e uma anatomia que pode fugir do humanoide.', ids: ['regras', 'anatomia'] },
        { page: 3, roman: 'IV', eyebrow: 'QUARTO CAPÍTULO', title: 'Heranças e aptidões', hint: 'Registre talentos, passivas, reações e limitações inatas.', ids: ['aptidoes'] },
        { page: 4, roman: 'V', eyebrow: 'QUINTO CAPÍTULO', title: 'Presença no mundo', hint: 'Conecte a raça a territórios, culturas, facções e crenças.', ids: ['mundo'] }
      ];
      return `
        <div class="race-dossier" id="${cfg.rootId}">
          ${pageGroups.map((group) => {
            const sections = group.ids.map((id) => cfg.sections.find((section) => section.id === id)).filter(Boolean);
            return `
              <section class="race-creator__page race-creator__chapter ${group.compact ? 'race-creator__chapter--compact' : ''}" data-race-wizard-page="${group.page}" ${group.page === 0 ? '' : 'hidden'}>
                ${group.compact ? `
                  <div class="race-creator__subchapter"><span>${escapeHtml(group.eyebrow)}</span><strong>${escapeHtml(group.title)}</strong><small>${escapeHtml(group.hint)}</small></div>
                ` : `
                  <header class="race-creator__page-head"><b><i>${group.roman}</i></b><span><small>${escapeHtml(group.eyebrow)}</small><h2>${escapeHtml(group.title)}</h2><p>${escapeHtml(group.hint)}</p></span></header>
                `}
                ${sections.map((section) => `
                  <div class="race-form-section" data-race-section="${escapeHtml(section.id)}">
                    ${sections.length > 1 ? `<header class="race-form-section__head"><span>${escapeHtml(section.title)}</span><small>${escapeHtml(raceSectionHints[section.id] || '')}</small></header>` : ''}
                    <div class="beast-form-section__body">${sectionContent(section)}</div>
                  </div>
                `).join('')}
              </section>`;
          }).join('')}
        </div>`;
    }
    return `
      <div class="race-dossier" id="${cfg.rootId}">
        ${cfg.sections.map((section, index) => tabId === 'Bestiario' ? `
          <details class="dossier-section beast-form-section" ${index === 0 ? 'open' : ''}>
            <summary class="beast-form-section__summary">
              <span class="beast-form-section__number">${String(index + 1).padStart(2, '0')}</span>
              <span><strong>${escapeHtml(section.title)}</strong><small>${escapeHtml(beastSectionHints[section.id] || '')}</small></span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </summary>
            <div class="beast-form-section__body">${sectionContent(section)}</div>
          </details>
        ` : `
          <div class="dossier-section">
            <header class="dossier-section__head"><span class="section__eyebrow">${escapeHtml(section.title.toUpperCase())}</span></header>
            ${sectionContent(section)}
          </div>
        `).join('')}
      </div>`;
  }

  function raceFieldFormHTML(field, value) {
    const v = value != null ? value : (field.default || '');
    if (field.type === 'rarity' || field.type === 'threat') {
      const opts = field.type === 'threat' ? BEAST_THREATS : RARITY_OPTIONS;
      return `
        <div class="dossier-field">
          <span>${escapeHtml(field.key)}</span>
          <div class="rarity-picker" data-dossier-field="${escapeHtml(field.key)}" data-value="${escapeHtml(v)}" role="radiogroup" aria-label="${escapeHtml(field.key)}">
            ${opts.map((opt) => `
              <button type="button"
                      class="rarity-chip ${opt.cssClass} rarity-pick ${opt.value === v ? 'is-selected' : ''}"
                      data-rarity="${escapeHtml(opt.value)}"
                      role="radio"
                      aria-checked="${opt.value === v ? 'true' : 'false'}">
                ${escapeHtml(opt.value)}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }
    if (field.type === 'textarea') {
      return `
        <label class="dossier-field dossier-field--textarea">
          <span>${escapeHtml(field.key)}</span>
          <textarea class="create-form__input" data-dossier-field="${escapeHtml(field.key)}"
                    placeholder="${escapeHtml(field.placeholder || '')}" maxlength="900" rows="4">${escapeHtml(v)}</textarea>
        </label>
      `;
    }
    if (field.type === 'select') {
      const options = Array.isArray(field.options) ? field.options : [];
      return `<label class="dossier-field"><span>${escapeHtml(field.key)}</span><select class="create-form__input char-select" data-dossier-field="${escapeHtml(field.key)}"><option value="">— ${escapeHtml(field.placeholder || 'selecionar')} —</option>${options.map((option) => `<option value="${escapeHtml(option)}" ${option === v ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></label>`;
    }
    if (field.type === 'list') {
      const items = Array.isArray(v) ? v : [];
      return `
        <div class="dossier-field dossier-field--list">
          <span>${escapeHtml(field.key)}</span>
          <div class="list-builder" data-dossier-field="${escapeHtml(field.key)}" data-items='${escapeHtml(JSON.stringify(items))}'>
            <div class="list-builder__row">
              <input type="text" class="create-form__input list-builder__input" placeholder="${escapeHtml(field.placeholder || '')}" maxlength="120">
              <button type="button" class="btn btn-ghost list-builder__add">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span>Adicionar</span>
              </button>
            </div>
            <div class="list-builder__items" aria-live="polite">
              ${items.map((item, i) => listBuilderItemHTML(item, i)).join('')}
            </div>
          </div>
        </div>
      `;
    }
    return `
      <label class="dossier-field">
        <span>${escapeHtml(field.key)}</span>
        <input type="text" class="create-form__input" data-dossier-field="${escapeHtml(field.key)}"
               placeholder="${escapeHtml(field.placeholder || field.default || '')}"
               value="${escapeHtml(v)}" maxlength="200">
      </label>
    `;
  }

  function beastAttributesFormHTML(values) {
    const attrs = normalizeBeastAttributes(values['Atributos'], true);
    const daAttr = beastDaAttribute(values);
    const diceOptions = Array.from({ length: 11 }, (_, index) => index + 1);
    return `
      <label class="beast-da-picker">
        <span class="beast-da-picker__copy">
          <strong>Atributo-base da DA</strong>
          <small>Escolha como a criatura evita ser atingida.</small>
        </span>
        <select class="create-form__input char-select" data-dossier-field="DA Base" aria-label="Atributo-base da DA" required>
          <option value="" disabled ${daAttr ? '' : 'selected'}>— escolher atributo —</option>
          ${CHAR_ATTRIBUTES.map((attr) => `<option value="${escapeHtml(attr)}" ${attr === daAttr ? 'selected' : ''}>${escapeHtml(attr)}</option>`).join('')}
        </select>
        <span class="beast-da-picker__result" data-beast-da-preview>${daAttr ? `${beastDiceForScore(attrs[daAttr])}d6 + 1d12` : 'Escolha obrigatória'}</span>
      </label>
      <div class="beast-attr-form">
        ${CHAR_ATTRIBUTES.map((attr) => `
          <label class="beast-attr-field">
            <span>${escapeHtml(attr)}</span>
            <select class="create-form__input char-select" data-beast-attr="${escapeHtml(attr)}" aria-label="Dados de ${escapeHtml(attr)}">
              ${diceOptions.map((dice) => {
                const score = beastScoreForDice(dice);
                return `<option value="${score}" ${dice === beastDiceForScore(attrs[attr]) ? 'selected' : ''}>${dice}d6</option>`;
              }).join('')}
            </select>
          </label>
        `).join('')}
      </div>
    `;
  }

  function beastHpPartRowHTML(part, index) {
    const p = part || {};
    return `
      <div class="beast-part-row" data-beast-part-row>
        <input type="text" class="create-form__input" data-beast-part-name
               value="${escapeHtml(p.name || '')}" placeholder="Parte do corpo" maxlength="80"
               aria-label="Nome da parte ${index + 1}">
        <input type="text" inputmode="numeric" class="create-form__input hp-form__input" data-beast-part-hp
               value="${escapeHtml(p.hp || '')}" placeholder="HP" maxlength="8"
               aria-label="HP da parte ${index + 1}">
        <span class="hp-form__suffix">HP</span>
        <button type="button" class="beast-row-remove" data-beast-part-remove aria-label="Remover parte">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `;
  }

  function beastVitalsFormHTML(values) {
    const parts = beastHpPartsForForm(values);
    const defenseSelect = (key, label) => {
      const selected = beastDefenseLevel(values, key);
      return `
        <label class="dossier-field beast-defense-field">
          <span>${escapeHtml(label)}</span>
          <select class="create-form__input char-select" data-dossier-field="${escapeHtml(key)}">
            ${BEAST_DEFENSE_REDUCTION.map((pct, level) => `<option value="${level}" ${level === selected ? 'selected' : ''}>Nível ${level} · ${pct}%</option>`).join('')}
          </select>
          <em>${key === 'DF' ? 'Reduz dano físico após o acerto.' : 'Reduz dano mágico após o acerto.'}</em>
        </label>`;
    };
    return `
      <div class="beast-part-builder" data-beast-parts>
        <div class="beast-part-builder__head">
          <div><strong>Campos de HP</strong><span>Crie uma anatomia simples ou detalhada.</span></div>
          <small>Sem limite de campos</small>
        </div>
        <div class="beast-part-list" data-beast-part-list>
          ${parts.map((part, i) => beastHpPartRowHTML(part, i)).join('')}
        </div>
        <div class="beast-part-add">
          <select class="create-form__input char-select" data-beast-part-preset aria-label="Tipo de parte">
            ${BEAST_EXTRA_PARTS.map((part) => `<option value="${escapeHtml(part)}">${escapeHtml(part)}</option>`).join('')}
          </select>
          <input type="text" class="create-form__input" data-beast-part-custom placeholder="ou nome personalizado..." maxlength="80">
          <button type="button" class="btn btn-ghost" data-beast-part-add>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>Adicionar campo de HP</span>
          </button>
        </div>
      </div>
      <div class="create-form__row beast-vitals-row">
        ${defenseSelect('DF', 'Defesa Física · DF')}
        ${defenseSelect('DM', 'Defesa Mágica · DM')}
        <label class="dossier-field dossier-field--mana">
          <span>Reserva de Mana</span>
          <input type="text" class="create-form__input" data-dossier-field="Mana"
                 value="${escapeHtml(values['Mana'] != null ? values['Mana'] : '')}"
                 placeholder="Opcional — ex.: 30/30" maxlength="20">
        </label>
      </div>
    `;
  }

  function beastDropOptionsHTML(selectedId, fallbackName) {
    const items = entriesIn('Itens');
    const hasSelected = selectedId && items.some((item) => item.id === selectedId);
    return `
      <option value="">— escolher item —</option>
      ${selectedId && !hasSelected ? `<option value="${escapeHtml(selectedId)}" selected>${escapeHtml(fallbackName || 'Item removido')}</option>` : ''}
      ${items.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedId ? 'selected' : ''}>${escapeHtml(item.title)}</option>`).join('')}
    `;
  }

  function beastDropRowHTML(drop, index) {
    const d = normalizeBeastDrops([drop])[0] || { refId: '', name: '', summary: '', quantity: '', chance: '', note: '' };
    return `
      <div class="beast-drop-row" data-beast-drop-row data-drop-name="${escapeHtml(d.name)}" data-drop-summary="${escapeHtml(d.summary)}">
        <select class="create-form__input char-select beast-drop-select" data-beast-drop-ref aria-label="Item do drop ${index + 1}">
          ${beastDropOptionsHTML(d.refId, d.name)}
        </select>
        <input type="text" class="create-form__input beast-drop-qty" data-beast-drop-qty
               value="${escapeHtml(d.quantity)}" placeholder="Qtd." maxlength="20" aria-label="Quantidade do drop ${index + 1}">
        <input type="number" class="create-form__input beast-drop-chance" data-beast-drop-chance
               value="${escapeHtml(d.chance)}" min="0" max="100" placeholder="%" aria-label="Chance do drop ${index + 1}">
        <input type="text" class="create-form__input beast-drop-note" data-beast-drop-note
               value="${escapeHtml(d.note)}" placeholder="Condição / observação" maxlength="120" aria-label="Observação do drop ${index + 1}">
        <button type="button" class="beast-row-remove" data-beast-drop-remove aria-label="Remover drop">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    `;
  }

  function beastDropsFormHTML(values) {
    const drops = normalizeBeastDrops(values['Drops']);
    const hasItems = entriesIn('Itens').length > 0;
    const spoil = values['Espólio'] || values['Espolio'] || '';
    return `
      <div class="beast-drop-builder" data-beast-drops>
        <div class="beast-drop-list-form" data-beast-drop-list>
          ${drops.map((drop, i) => beastDropRowHTML(drop, i)).join('')}
        </div>
        ${hasItems ? `
          <button type="button" class="btn btn-ghost beast-drop-add" data-beast-drop-add>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>Adicionar drop</span>
          </button>
        ` : '<p class="beast-builder-hint">Nenhum item cadastrado. Crie itens na aba Itens para vincular drops.</p>'}
      </div>
      <label class="dossier-field beast-spoil-field">
        <span>Nota de espólio</span>
        <input type="text" class="create-form__input" data-dossier-field="Espólio"
               value="${escapeHtml(spoil)}" placeholder="Espólio narrativo opcional / legado" maxlength="200">
      </label>
    `;
  }

  function beastMagicOptionsHTML(selectedId, fallbackName) {
    const magias = entriesIn('Magias');
    const hasSelected = selectedId && magias.some((spell) => spell.id === selectedId);
    return `
      <option value="">— escolher magia —</option>
      ${selectedId && !hasSelected ? `<option value="${escapeHtml(selectedId)}" selected>${escapeHtml(fallbackName || 'Magia removida')}</option>` : ''}
      ${magias.map((spell) => `<option value="${escapeHtml(spell.id)}" ${spell.id === selectedId ? 'selected' : ''}>${escapeHtml(spell.title)}</option>`).join('')}
    `;
  }

  function beastAbilityRowHTML(ability, index) {
    const a = normalizeBeastAbilities([ability])[0] || {
      source: 'custom', refId: '', name: '', kind: 'Ativa',
      trigger: '', cost: '', range: '', duration: '', effect: '', limit: '', summary: ''
    };
    return `
      <div class="beast-ability-row" data-beast-ability-row data-ability-name="${escapeHtml(a.name)}" data-ability-summary="${escapeHtml(a.summary)}">
        <div class="beast-ability-row__top">
          <select class="create-form__input char-select" data-beast-ability-source aria-label="Origem da habilidade ${index + 1}">
            <option value="custom" ${a.source === 'custom' ? 'selected' : ''}>Avulsa</option>
            <option value="magic" ${a.source === 'magic' ? 'selected' : ''}>Magia do Codex</option>
          </select>
          <select class="create-form__input char-select" data-beast-ability-kind aria-label="Tipo da habilidade ${index + 1}">
            ${BEAST_ABILITY_KINDS.map((kind) => `<option value="${escapeHtml(kind)}" ${a.kind === kind ? 'selected' : ''}>${escapeHtml(kind)}</option>`).join('')}
          </select>
          <button type="button" class="beast-row-remove" data-beast-ability-remove aria-label="Remover habilidade">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="beast-ability-row__codex" ${a.source === 'magic' ? '' : 'hidden'}>
          <select class="create-form__input char-select" data-beast-ability-ref aria-label="Magia vinculada ${index + 1}">
            ${beastMagicOptionsHTML(a.refId, a.name)}
          </select>
        </div>
        <input type="text" class="create-form__input" data-beast-ability-name
               value="${escapeHtml(a.source === 'custom' ? a.name : '')}" placeholder="Nome da habilidade avulsa" maxlength="120"
               ${a.source === 'magic' ? 'hidden' : ''} aria-label="Nome da habilidade ${index + 1}">
        <div class="beast-ability-row__grid">
          <input type="text" class="create-form__input" data-beast-ability-trigger value="${escapeHtml(a.trigger)}" placeholder="Ativação / condição" maxlength="120">
          <input type="text" class="create-form__input" data-beast-ability-cost value="${escapeHtml(a.cost)}" placeholder="Custo" maxlength="60">
          <input type="text" class="create-form__input" data-beast-ability-range value="${escapeHtml(a.range)}" placeholder="Alcance" maxlength="60">
          <input type="text" class="create-form__input" data-beast-ability-duration value="${escapeHtml(a.duration)}" placeholder="Duração" maxlength="60">
        </div>
        <textarea class="create-form__input beast-ability-row__effect" data-beast-ability-effect rows="2" placeholder="Efeito completo da habilidade" maxlength="700">${escapeHtml(a.effect)}</textarea>
        <input type="text" class="create-form__input" data-beast-ability-limit value="${escapeHtml(a.limit)}" placeholder="Limite / recarga / observação" maxlength="160">
        <details class="combat-details" data-beast-ability-combat ${a.source === 'magic' ? 'hidden' : ''}>
          <summary>Uso em combate${a.combat ? '' : ' <small>convertido do texto, revise</small>'}</summary>
          ${combatFormHTML(a.combat || combatFromBeastAbility(a).combat || { uso: 'nenhum' }, 'habilidade', { compact: true })}
        </details>
      </div>
    `;
  }

  function beastAbilitiesFormHTML(values) {
    const abilities = normalizeBeastAbilities(values['Habilidades']);
    return `
      <div class="beast-ability-builder" data-beast-abilities>
        <div class="beast-ability-list-form" data-beast-ability-list>
          ${abilities.map((ability, i) => beastAbilityRowHTML(ability, i)).join('')}
        </div>
        <button type="button" class="btn btn-ghost beast-ability-add" data-beast-ability-add>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span>Adicionar habilidade</span>
        </button>
      </div>
    `;
  }

  function listBuilderItemHTML(item, index) {
    return `
      <span class="list-builder__item">
        ${escapeHtml(item)}
        <button type="button" class="list-builder__remove" data-remove-list="${index}" aria-label="Remover ${escapeHtml(item)}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </span>
    `;
  }

  function raceHpFormHTML(values) {
    return `
      <div class="hp-form">
        ${RACE_HP_PARTS.map((p) => `
          <label class="hp-form__row">
            <span class="hp-form__name">${escapeHtml(p)}</span>
            <input type="text" inputmode="numeric" class="create-form__input hp-form__input"
                   data-dossier-field="${escapeHtml(p)}"
                   value="${escapeHtml(values[p] != null ? values[p] : defaultHpFor(p))}"
                   maxlength="6">
            <span class="hp-form__suffix">HP</span>
          </label>
        `).join('')}
      </div>
      <label class="dossier-field dossier-field--mana">
        <span>Mana</span>
        <input type="text" class="create-form__input" data-dossier-field="Mana"
               value="${escapeHtml(values['Mana'] != null ? values['Mana'] : '15/15')}"
               placeholder="15/15" maxlength="20">
      </label>
    `;
  }

  function bindRaceDossier(rootId) {
    const root = document.getElementById(rootId || 'raceDossier');
    if (!root) return { getFields: () => ({}) };

    function readListItems(builder) {
      try { return JSON.parse(builder.dataset.items || '[]') || []; } catch { return []; }
    }

    function refreshListItems(builder, items) {
      builder.dataset.items = JSON.stringify(items);
      const list = builder.querySelector('.list-builder__items');
      list.innerHTML = items.map((item, i) => listBuilderItemHTML(item, i)).join('');
    }

    function readBeastPartRows() {
      return [...root.querySelectorAll('[data-beast-part-row]')]
        .map((row) => ({
          name: (row.querySelector('[data-beast-part-name]')?.value || '').trim(),
          hp: (row.querySelector('[data-beast-part-hp]')?.value || '').trim()
        }))
        .filter((part) => part.name);
    }

    function refreshBeastParts(parts) {
      const list = root.querySelector('[data-beast-part-list]');
      if (list) list.innerHTML = parts.map((part, i) => beastHpPartRowHTML(part, i)).join('');
    }

    function uniquePartName(name, parts) {
      let next = name;
      let n = 2;
      const exists = (candidate) => parts.some((part) => normalize(part.name) === normalize(candidate));
      while (exists(next)) next = `${name} ${n++}`;
      return next;
    }

    function addBeastPart() {
      const builder = root.querySelector('[data-beast-parts]');
      if (!builder) return;
      const select = builder.querySelector('[data-beast-part-preset]');
      const custom = builder.querySelector('[data-beast-part-custom]');
      const raw = ((custom && custom.value.trim()) || (select && select.value) || '').trim();
      if (!raw || raw === 'Personalizada') {
        if (custom) custom.focus();
        return;
      }
      const parts = readBeastPartRows();
      parts.push({ name: uniquePartName(raw, parts), hp: '' });
      refreshBeastParts(parts);
      if (custom) custom.value = '';
      const lastHp = root.querySelector('[data-beast-part-list] [data-beast-part-row]:last-child [data-beast-part-hp]');
      if (lastHp) lastHp.focus();
    }

    function readBeastDropRows() {
      return [...root.querySelectorAll('[data-beast-drop-row]')]
        .map((row) => {
          const select = row.querySelector('[data-beast-drop-ref]');
          const refId = (select?.value || '').trim();
          if (!refId) return null;
          const item = entryById(refId);
          const selectedLabel = select && select.selectedOptions[0] ? select.selectedOptions[0].textContent.trim() : '';
          return {
            refId,
            name: (item && item.title) || row.dataset.dropName || selectedLabel,
            summary: (item && item.summary) || row.dataset.dropSummary || '',
            quantity: (row.querySelector('[data-beast-drop-qty]')?.value || '').trim(),
            chance: (row.querySelector('[data-beast-drop-chance]')?.value || '').trim(),
            note: (row.querySelector('[data-beast-drop-note]')?.value || '').trim()
          };
        })
        .filter(Boolean);
    }

    function refreshBeastDrops(drops) {
      const list = root.querySelector('[data-beast-drop-list]');
      if (list) list.innerHTML = drops.map((drop, i) => beastDropRowHTML(drop, i)).join('');
    }

    function addBeastDrop() {
      if (!entriesIn('Itens').length) {
        toast('Crie ao menos um item na aba Itens antes de vincular drops.');
        return;
      }
      const drops = readBeastDropRows();
      drops.push({ refId: '', name: '', summary: '', quantity: '1', chance: '', note: '' });
      refreshBeastDrops(drops);
      const lastSelect = root.querySelector('[data-beast-drop-list] [data-beast-drop-row]:last-child [data-beast-drop-ref]');
      if (lastSelect) lastSelect.focus();
    }

    function readBeastAbilityRows() {
      return [...root.querySelectorAll('[data-beast-ability-row]')]
        .map((row) => {
          const source = row.querySelector('[data-beast-ability-source]')?.value || 'custom';
          const refId = (row.querySelector('[data-beast-ability-ref]')?.value || '').trim();
          const linked = source === 'magic' && refId ? entryById(refId) : null;
          const name = source === 'magic'
            ? ((linked && linked.title) || row.dataset.abilityName || '')
            : (row.querySelector('[data-beast-ability-name]')?.value || '').trim();
          const ability = {
            source,
            refId: source === 'magic' ? refId : '',
            name,
            kind: beastAbilityKindFrom(row.querySelector('[data-beast-ability-kind]')?.value || 'Ativa'),
            trigger: (row.querySelector('[data-beast-ability-trigger]')?.value || '').trim(),
            cost: (row.querySelector('[data-beast-ability-cost]')?.value || '').trim(),
            range: (row.querySelector('[data-beast-ability-range]')?.value || '').trim(),
            duration: (row.querySelector('[data-beast-ability-duration]')?.value || '').trim(),
            effect: (row.querySelector('[data-beast-ability-effect]')?.value || '').trim(),
            limit: (row.querySelector('[data-beast-ability-limit]')?.value || '').trim(),
            summary: (linked && linked.summary) || row.dataset.abilitySummary || '',
            combat: source === 'magic' ? null : readCombatForm(row.querySelector('[data-combat-form]'))
          };
          if (ability.source === 'magic' && !ability.refId) return null;
          if (ability.source === 'custom' && !ability.name && !ability.effect) return null;
          return ability;
        })
        .filter(Boolean);
    }

    function refreshBeastAbilities(abilities) {
      const list = root.querySelector('[data-beast-ability-list]');
      if (list) list.innerHTML = abilities.map((ability, i) => beastAbilityRowHTML(ability, i)).join('');
    }

    function addBeastAbility() {
      const abilities = readBeastAbilityRows();
      abilities.push({
        source: entriesIn('Magias').length ? 'magic' : 'custom',
        refId: '', name: '', kind: 'Ativa',
        trigger: '', cost: '', range: '', duration: '', effect: '', limit: '', summary: ''
      });
      refreshBeastAbilities(abilities);
      const last = root.querySelector('[data-beast-ability-list] [data-beast-ability-row]:last-child');
      const focusable = last && last.querySelector('[data-beast-ability-ref], [data-beast-ability-name]');
      if (focusable) focusable.focus();
    }

    function toggleBeastAbilitySource(row) {
      if (!row) return;
      const source = row.querySelector('[data-beast-ability-source]')?.value || 'custom';
      const codex = row.querySelector('.beast-ability-row__codex');
      const name = row.querySelector('[data-beast-ability-name]');
      if (codex) codex.hidden = source !== 'magic';
      if (name) name.hidden = source === 'magic';
      const combatBox = row.querySelector('[data-beast-ability-combat]');
      if (combatBox) combatBox.hidden = source === 'magic';
    }

    function addItemFrom(input) {
      const builder = input.closest('.list-builder');
      if (!builder) return;
      const v = (input.value || '').trim();
      if (!v) { input.focus(); return; }
      const items = readListItems(builder);
      const lower = v.toLowerCase();
      if (items.some((x) => x.toLowerCase() === lower)) {
        input.value = '';
        input.focus();
        return;
      }
      if (items.length >= 12) {
        toast('Máximo de 12 itens por lista.');
        return;
      }
      items.push(v);
      refreshListItems(builder, items);
      input.value = '';
      input.focus();
    }

    root.addEventListener('click', (e) => {
      const rarityBtn = e.target.closest('.rarity-pick');
      if (rarityBtn) {
        e.preventDefault();
        const picker = rarityBtn.closest('.rarity-picker');
        if (picker) {
          const value = rarityBtn.dataset.rarity || '';
          const newValue = picker.dataset.value === value ? '' : value;
          picker.dataset.value = newValue;
          picker.querySelectorAll('.rarity-pick').forEach((b) => {
            const active = b.dataset.rarity === newValue;
            b.classList.toggle('is-selected', active);
            b.setAttribute('aria-checked', active ? 'true' : 'false');
          });
        }
        return;
      }
      const addBtn = e.target.closest('.list-builder__add');
      if (addBtn) {
        e.preventDefault();
        const input = addBtn.parentElement.querySelector('.list-builder__input');
        if (input) addItemFrom(input);
        return;
      }
      const removeBtn = e.target.closest('[data-remove-list]');
      if (removeBtn) {
        e.preventDefault();
        const builder = removeBtn.closest('.list-builder');
        if (!builder) return;
        const idx = Number(removeBtn.dataset.removeList);
        const items = readListItems(builder);
        items.splice(idx, 1);
        refreshListItems(builder, items);
        return;
      }
      const relationChip = e.target.closest('[data-race-relation-id]');
      if (relationChip) {
        e.preventDefault();
        const group = relationChip.closest('[data-race-relation]');
        const selected = !relationChip.classList.contains('is-selected');
        relationChip.classList.toggle('is-selected', selected);
        relationChip.setAttribute('aria-pressed', selected ? 'true' : 'false');
        if (group) {
          const count = group.querySelectorAll('[data-race-relation-id].is-selected').length;
          const counter = group.querySelector('header small');
          if (counter) counter.textContent = `${count} vinculado${count === 1 ? '' : 's'}`;
        }
        return;
      }
      if (e.target.closest('[data-beast-part-add]')) {
        e.preventDefault();
        addBeastPart();
        return;
      }
      const partRemove = e.target.closest('[data-beast-part-remove]');
      if (partRemove) {
        e.preventDefault();
        partRemove.closest('[data-beast-part-row]')?.remove();
        return;
      }
      if (e.target.closest('[data-beast-drop-add]')) {
        e.preventDefault();
        addBeastDrop();
        return;
      }
      const dropRemove = e.target.closest('[data-beast-drop-remove]');
      if (dropRemove) {
        e.preventDefault();
        dropRemove.closest('[data-beast-drop-row]')?.remove();
        return;
      }
      if (e.target.closest('[data-beast-ability-add]')) {
        e.preventDefault();
        addBeastAbility();
        return;
      }
      const abilityRemove = e.target.closest('[data-beast-ability-remove]');
      if (abilityRemove) {
        e.preventDefault();
        abilityRemove.closest('[data-beast-ability-row]')?.remove();
      }
    });

    root.addEventListener('change', (e) => {
      if (e.target.matches('[data-beast-attr], [data-dossier-field="DA Base"]')) {
        const daSelect = root.querySelector('[data-dossier-field="DA Base"]');
        const scoreSelect = daSelect && root.querySelector(`[data-beast-attr="${CSS.escape(daSelect.value)}"]`);
        const preview = root.querySelector('[data-beast-da-preview]');
        if (daSelect && daSelect.value) daSelect.classList.remove('is-invalid');
        if (preview) preview.textContent = `${beastDiceForScore(scoreSelect && scoreSelect.value)}d6 + 1d12`;
      } else if (e.target.matches('[data-beast-ability-source]')) {
        toggleBeastAbilitySource(e.target.closest('[data-beast-ability-row]'));
      } else if (e.target.matches('[data-beast-ability-ref]')) {
        const row = e.target.closest('[data-beast-ability-row]');
        const spell = entryById(e.target.value);
        if (row && spell) {
          const base = abilityFromMagicEntry(spell);
          row.dataset.abilityName = base.name;
          row.dataset.abilitySummary = base.summary;
          const kind = row.querySelector('[data-beast-ability-kind]');
          const trigger = row.querySelector('[data-beast-ability-trigger]');
          const cost = row.querySelector('[data-beast-ability-cost]');
          const range = row.querySelector('[data-beast-ability-range]');
          const duration = row.querySelector('[data-beast-ability-duration]');
          const effect = row.querySelector('[data-beast-ability-effect]');
          const limit = row.querySelector('[data-beast-ability-limit]');
          if (kind) kind.value = base.kind;
          if (trigger && !trigger.value) trigger.value = base.trigger;
          if (cost && !cost.value) cost.value = base.cost;
          if (range && !range.value) range.value = base.range;
          if (duration && !duration.value) duration.value = base.duration;
          if (effect && !effect.value) effect.value = base.effect;
          if (limit && !limit.value) limit.value = base.limit;
        }
      }
    });

    root.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('list-builder__input') && e.key === 'Enter') {
        e.preventDefault();
        addItemFrom(e.target);
      } else if (e.target.matches('[data-beast-part-custom]') && e.key === 'Enter') {
        e.preventDefault();
        addBeastPart();
      }
    });

    return {
      getFields: () => {
        const out = {};
        root.querySelectorAll('input[data-dossier-field], textarea[data-dossier-field], select[data-dossier-field]').forEach((inp) => {
          const k = inp.dataset.dossierField;
          const v = (inp.value || '').trim();
          if (v) out[k] = v;
        });
        root.querySelectorAll('.rarity-picker[data-dossier-field]').forEach((el) => {
          const v = (el.dataset.value || '').trim();
          if (v) out[el.dataset.dossierField] = v;
        });
        root.querySelectorAll('.list-builder[data-dossier-field]').forEach((el) => {
          const items = readListItems(el).map((s) => String(s).trim()).filter(Boolean);
          if (items.length) out[el.dataset.dossierField] = items;
        });
        if (root.id === 'beastDossier') {
          const attrs = {};
          root.querySelectorAll('[data-beast-attr]').forEach((inp) => {
            const key = inp.dataset.beastAttr;
            const value = parseInt(inp.value, 10);
            attrs[key] = Number.isFinite(value) ? value : CHAR_ATTR_BASE;
          });
          if (Object.keys(attrs).length) out['Atributos'] = attrs;

          const hpParts = readBeastPartRows();
          if (hpParts.length) out['PartesHP'] = hpParts;

          const drops = readBeastDropRows();
          if (drops.length) out['Drops'] = drops;

          const abilities = readBeastAbilityRows();
          if (abilities.length) out['Habilidades'] = abilities;
        } else if (root.id === 'raceDossier') {
          const attrs = {};
          root.querySelectorAll('[data-race-attr]').forEach((input) => {
            attrs[input.dataset.raceAttr] = Math.max(-2, Math.min(2, parseInt(input.value, 10) || 0));
          });
          out.Atributos = attrs;
          const modifier = raceModifierText(attrs);
          if (modifier) out.Modificador = modifier;

          const anatomy = readBeastPartRows();
          if (anatomy.length) out.Anatomia = anatomy;

          const abilities = readBeastAbilityRows();
          if (abilities.length) out.Aptidoes = abilities;

          const relations = {};
          root.querySelectorAll('[data-race-relation]').forEach((group) => {
            const ids = [...group.querySelectorAll('[data-race-relation-id].is-selected')]
              .map((button) => button.dataset.raceRelationId || '')
              .filter(Boolean);
            if (ids.length) relations[group.dataset.raceRelation] = ids;
          });
          if (Object.keys(relations).length) out.Relacoes = relations;
          out.SchemaRaca = 2;
        }
        return out;
      }
    };
  }

  /* ── ENTRY LINK PICKER (modal) ────────────────── */
  function openEntryLinkPicker({ suggestedQuery = '', onSelect }) {
    const existing = document.getElementById('entryLinkPicker');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'entryLinkPicker';
    overlay.className = 'link-picker';
    overlay.innerHTML = `
      <div class="link-picker__backdrop" data-link-close></div>
      <div class="link-picker__panel" role="dialog" aria-modal="true" aria-label="Escolher história para linkar">
        <header class="link-picker__head">
          <span class="section__eyebrow">LINKAR PARA</span>
          <button type="button" class="link-picker__close" data-link-close aria-label="Fechar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </header>
        <div class="link-picker__searchwrap">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input type="search" class="link-picker__search" id="linkPickerSearch" placeholder="Buscar por título, categoria ou tag…" autocomplete="off">
        </div>
        <div class="link-picker__results" id="linkPickerResults" role="listbox" aria-label="Resultados"></div>
        <footer class="link-picker__foot">
          <span>Enter ou clique para inserir o link</span>
        </footer>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add('is-modal-open');

    const search = overlay.querySelector('#linkPickerSearch');
    const results = overlay.querySelector('#linkPickerResults');
    const allEntries = ARCHIVE.entries.slice();
    let activeIdx = 0;
    let filtered = [];

    function renderResults(query) {
      const q = normalize(query || '').trim();
      filtered = !q
        ? allEntries.slice(0, 80)
        : allEntries
            .map((e) => {
              const hayTitle = normalize(e.title);
              const hayTab = normalize(tabById(e.tab)?.title || e.tab);
              const haySummary = normalize(e.summary || '');
              const hayTags = sanitizeTags(e.tags).map((t) => normalize(t.label)).join(' ');
              let score = 0;
              if (hayTitle.startsWith(q)) score += 100;
              else if (hayTitle.includes(q)) score += 60;
              if (hayTab.includes(q)) score += 12;
              if (hayTags.includes(q)) score += 18;
              if (haySummary.includes(q)) score += 6;
              return { e, score };
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 80)
            .map((x) => x.e);
      activeIdx = 0;
      if (!filtered.length) {
        results.innerHTML = '<div class="link-picker__empty">Nenhuma história encontrada.</div>';
        return;
      }
      results.innerHTML = filtered.map((e, i) => {
        const tabTitle = tabById(e.tab)?.title || e.tab;
        const theme = themeOf(e.tab);
        return `
          <button type="button" class="link-picker__item ${i === 0 ? 'is-active' : ''}" data-pick-index="${i}" style="--hue:${theme.hue}" role="option">
            <span class="link-picker__icon">${iconOf(e.tab)}</span>
            <span class="link-picker__body">
              <span class="link-picker__title">${escapeHtml(e.title)}</span>
              <span class="link-picker__meta">${escapeHtml(tabTitle)}${e.summary ? ' · ' + escapeHtml(e.summary.slice(0, 80)) : ''}</span>
            </span>
          </button>
        `;
      }).join('');
    }

    function highlight(idx) {
      const items = results.querySelectorAll('.link-picker__item');
      items.forEach((it, i) => it.classList.toggle('is-active', i === idx));
      const target = items[idx];
      if (target) target.scrollIntoView({ block: 'nearest' });
    }

    function commitSelection(idx) {
      const entry = filtered[idx];
      if (!entry) return;
      close();
      onSelect(entry);
    }

    function close() {
      document.body.classList.remove('is-modal-open');
      overlay.remove();
      document.removeEventListener('keydown', onKeydown, true);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(filtered.length - 1, activeIdx + 1);
        highlight(activeIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(0, activeIdx - 1);
        highlight(activeIdx);
      } else if (e.key === 'Enter' && document.activeElement === search) {
        e.preventDefault();
        commitSelection(activeIdx);
      }
    }

    overlay.addEventListener('click', (e) => {
      if (e.target.closest('[data-link-close]')) { close(); return; }
      const item = e.target.closest('[data-pick-index]');
      if (item) commitSelection(Number(item.dataset.pickIndex));
    });

    search.addEventListener('input', (e) => {
      renderResults(e.target.value);
    });

    document.addEventListener('keydown', onKeydown, true);
    renderResults(suggestedQuery);
    setTimeout(() => {
      search.value = suggestedQuery;
      search.focus();
      search.select();
    }, 0);
  }

  function bindEditor() {
    const editor = document.getElementById('rtEditor');
    const toolbar = document.getElementById('editorToolbar');
    const colorInput = document.getElementById('rtColor');
    const colorSwatch = document.getElementById('rtColorSwatch');
    const savedList = document.getElementById('rtSavedColors');
    const saveBtn = document.getElementById('rtSaveColor');
    const imageInput = document.getElementById('rtImageInput');
    if (!editor || !toolbar) return null;
    ensureEditorFonts();

    /* Configurar editor: <p> ao pressionar Enter */
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}

    let lastRange = null;
    function captureSelection() {
      const sel = window.getSelection();
      if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
        lastRange = sel.getRangeAt(0).cloneRange();
      }
    }
    function restoreSelection() {
      if (!lastRange) return false;
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(lastRange);
      return true;
    }
    editor.addEventListener('keyup', captureSelection);
    editor.addEventListener('mouseup', captureSelection);
    editor.addEventListener('blur', captureSelection);

    function insertInlineImage(file) {
      if (!file || !/^image\/(?:png|jpe?g|webp)$/i.test(file.type)) {
        toast('Escolha uma imagem PNG, JPG ou WebP.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast('A imagem deve ter no máximo 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const figure = document.createElement('figure');
        figure.className = 'rt-figure rt-figure--wide';
        figure.contentEditable = 'false';
        const image = document.createElement('img');
        image.className = 'rt-inline-image';
        image.src = String(reader.result || '');
        image.alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        const caption = document.createElement('figcaption');
        caption.className = 'rt-figure__caption';
        caption.contentEditable = 'true';
        caption.textContent = 'Escreva uma legenda para esta imagem.';
        figure.append(image, caption);
        editor.focus();
        if (restoreSelection()) {
          const selection = window.getSelection();
          const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
          if (range) {
            range.collapse(false);
            range.insertNode(figure);
            range.setStartAfter(figure);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        } else editor.appendChild(figure);
        const paragraph = document.createElement('p');
        paragraph.innerHTML = '<br>';
        figure.after(paragraph);
        imageInput.value = '';
      };
      reader.readAsDataURL(file);
    }
    imageInput?.addEventListener('change', () => insertInlineImage(imageInput.files?.[0]));

    function applyColor(color) {
      restoreSelection();
      editor.focus();
      restoreSelection();
      document.execCommand('foreColor', false, color);
      colorInput.value = color;
      colorSwatch.style.background = color;
      captureSelection();
    }

    function renderSavedPalette() {
      if (!savedList) return;
      const colors = masterPalette.colors;
      if (!colors.length) {
        savedList.innerHTML = `<span class="rt-saved__empty">${escapeHtml(savedList.dataset.emptyLabel || '')}</span>`;
        return;
      }
      savedList.innerHTML = colors.map((c) => `
        <span class="rt-saved__chip" data-saved-color="${c}">
          <button type="button" class="rt-swatch rt-swatch--saved" data-color="${c}" style="background:${c}" title="${c}" aria-label="Aplicar cor salva ${c}"></button>
          <button type="button" class="rt-saved__remove" data-remove-color="${c}" aria-label="Remover cor salva ${c}" title="Remover">
            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </span>
      `).join('');
    }

    function toggleInlineWrap(tagName) {
      // Quebra envolvendo a seleção atual em <tagName>...</tagName>.
      // Se a seleção já está dentro de um <tagName>, remove (toggle).
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
      if (!ancestor || !editor.contains(ancestor)) return;

      const existing = ancestor.closest(tagName.toLowerCase());
      if (existing && editor.contains(existing) && range.toString() === existing.textContent) {
        // toggle off
        const parent = existing.parentNode;
        while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
        parent.removeChild(existing);
        return;
      }
      if (range.collapsed) return;
      const wrapper = document.createElement(tagName);
      try {
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        sel.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        sel.addRange(newRange);
      } catch { /* noop */ }
    }

    function insertHorizontalRule(color) {
      editor.focus();
      restoreSelection();
      document.execCommand('insertHorizontalRule');
      if (!color) return;
      // O execCommand insere o <hr> recente; localizo via seleção atual
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const node = sel.getRangeAt(0).startContainer;
      const scope = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
      // Acha o <hr> mais recente dentro do editor (último filho HR antes do cursor)
      const hrs = editor.querySelectorAll('hr');
      const last = hrs[hrs.length - 1];
      if (last) {
        last.setAttribute('style', `background: linear-gradient(90deg, transparent, ${color}, transparent)`);
      }
    }

    function applyFontFamily(value) {
      editor.focus();
      restoreSelection();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      if (!value) {
        // 'Padrão' = remove font-family de spans selecionados (best effort).
        document.execCommand('removeFormat');
        return;
      }
      const def = RT_FONT_FAMILIES.find((f) => f.id === value);
      if (!def) return;
      wrapSelectionStyle('font-family', def.css);
    }

    function applyFontSize(value) {
      editor.focus();
      restoreSelection();
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      if (!value) {
        document.execCommand('removeFormat');
        return;
      }
      wrapSelectionStyle('font-size', value);
    }

    function wrapSelectionStyle(prop, val) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (range.collapsed) return;
      try {
        const fragment = range.extractContents();
        // Remove qualquer inline style igual em spans descendentes para não aninhar.
        Array.from(fragment.querySelectorAll('span[style]')).forEach((s) => {
          s.style.removeProperty(prop);
          const remaining = (s.getAttribute('style') || '').trim();
          if (!remaining) {
            const parent = s.parentNode;
            while (s.firstChild) parent.insertBefore(s.firstChild, s);
            parent.removeChild(s);
          }
        });
        const span = document.createElement('span');
        span.style.setProperty(prop, val);
        span.appendChild(fragment);
        range.insertNode(span);
        sel.removeAllRanges();
        const r = document.createRange();
        r.selectNodeContents(span);
        sel.addRange(r);
        captureSelection();
      } catch { /* noop */ }
    }

    function openLinkPicker() {
      const sel = window.getSelection();
      const text = sel && sel.rangeCount ? sel.toString() : '';
      if (!text || !text.trim()) {
        toast('Selecione o texto que vai virar o link.');
        editor.focus();
        return;
      }
      captureSelection();
      openEntryLinkPicker({
        suggestedQuery: text.trim(),
        onSelect: (entry) => {
          editor.focus();
          if (!restoreSelection()) return;
          const href = `#/${entry.tab}/${entry.id}`;
          // execCommand('createLink') aceita URL direta e mantem a seleção textual.
          document.execCommand('createLink', false, href);
          // Aplica classe e data-attrs no <a> recem-criado.
          const sel2 = window.getSelection();
          if (sel2 && sel2.rangeCount) {
            const node = sel2.getRangeAt(0).commonAncestorContainer;
            const a = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)?.closest('a');
            if (a) {
              a.setAttribute('class', 'rt-internal-link');
              a.setAttribute('data-arcano-link', '');
              a.setAttribute('data-link-tab', entry.tab);
              a.setAttribute('data-link-entry', entry.id);
              a.removeAttribute('target');
              a.removeAttribute('rel');
            }
          }
          captureSelection();
        }
      });
    }

    /* Popover de cor da linha divisória */
    const hrPopover = document.getElementById('rtHrPopover');
    const hrCustom = document.getElementById('rtHrCustom');
    const hrCustomSwatch = document.getElementById('rtHrCustomSwatch');
    function closeHrPopover() { if (hrPopover) hrPopover.hidden = true; }
    function toggleHrPopover() {
      if (!hrPopover) return;
      hrPopover.hidden = !hrPopover.hidden;
    }
    document.addEventListener('click', (e) => {
      if (!hrPopover || hrPopover.hidden) return;
      if (e.target.closest('#rtHrWrap')) return;
      closeHrPopover();
    });
    if (hrCustom) {
      hrCustom.addEventListener('input', (e) => {
        if (hrCustomSwatch) hrCustomSwatch.style.background = e.target.value;
      });
      hrCustom.addEventListener('change', (e) => {
        insertHorizontalRule(e.target.value);
        closeHrPopover();
      });
    }

    toolbar.addEventListener('mousedown', (e) => {
      if (e.target.closest('input[type="color"]')) return;
      if (e.target.closest('select')) return;
      // mantem a seleção do editor ao clicar na toolbar
      captureSelection();
      e.preventDefault();
    });
    toolbar.addEventListener('click', (e) => {
      const hrSwatch = e.target.closest('[data-hr-color]');
      if (hrSwatch) {
        const color = hrSwatch.dataset.hrColor || '';
        insertHorizontalRule(color);
        closeHrPopover();
        return;
      }
      const removeBtn = e.target.closest('[data-remove-color]');
      if (removeBtn) {
        const color = removeBtn.dataset.removeColor;
        const next = masterPalette.colors.filter((c) => c !== color);
        const previous = masterPalette.colors.slice();
        masterPalette.colors = next;
        renderSavedPalette();
        saveMasterPalette(next).catch((err) => {
          console.error(err);
          toast('Erro ao remover cor: ' + (err.message || err));
          masterPalette.colors = previous;
          renderSavedPalette();
        });
        return;
      }
      const swatch = e.target.closest('.rt-swatch');
      if (swatch) {
        applyColor(swatch.dataset.color);
        return;
      }
      const saveColorBtn = e.target.closest('#rtSaveColor');
      if (saveColorBtn) {
        const color = safeTagColor(colorInput.value);
        if (masterPalette.colors.includes(color)) return;
        if (masterPalette.colors.length >= MAX_PALETTE) {
          toast(`Máximo de ${MAX_PALETTE} cores salvas. Remova alguma antes de adicionar uma nova.`);
          return;
        }
        const next = [...masterPalette.colors, color];
        const previous = masterPalette.colors.slice();
        masterPalette.colors = next;
        renderSavedPalette();
        saveMasterPalette(next).catch((err) => {
          console.error(err);
          toast('Erro ao salvar cor: ' + (err.message || err));
          masterPalette.colors = previous;
          renderSavedPalette();
        });
        return;
      }
      const actionBtn = e.target.closest('[data-rt-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.rtAction;
        if (action === 'link') openLinkPicker();
        else if (action === 'image') { captureSelection(); imageInput?.click(); }
        else if (action === 'hr') { captureSelection(); toggleHrPopover(); }
        else if (action === 'code') { editor.focus(); restoreSelection(); toggleInlineWrap('CODE'); captureSelection(); }
        return;
      }
      const btn = e.target.closest('.rt-btn');
      if (btn && btn.dataset.cmd) {
        const cmd = btn.dataset.cmd;
        const arg = btn.dataset.arg || null;
        editor.focus();
        restoreSelection();
        document.execCommand(cmd, false, arg);
        captureSelection();
      }
    });
    colorInput.addEventListener('input', (e) => {
      const color = e.target.value;
      colorSwatch.style.background = color;
      applyColor(color);
    });

    /* Selects de família e tamanho de fonte.
       O dropdown mantém a opção escolhida visível; pra reverter, escolha 'Padrão' / '16'. */
    const fontFamilySelect = document.getElementById('rtFontFamily');
    const fontSizeSelect = document.getElementById('rtFontSize');
    if (fontFamilySelect) {
      fontFamilySelect.addEventListener('change', (e) => {
        applyFontFamily(e.target.value);
        captureSelection();
      });
    }
    if (fontSizeSelect) {
      fontSizeSelect.addEventListener('change', (e) => {
        applyFontSize(e.target.value);
        captureSelection();
      });
    }

    /* Navegação ao clicar em link interno dentro do editor (Ctrl/Cmd+click). */
    editor.addEventListener('click', (e) => {
      const link = e.target.closest('a.rt-internal-link');
      if (!link) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) location.hash = href;
      }
    });

    // Render inicial da paleta + load assíncrono se ainda não carregou
    renderSavedPalette();
    if (!masterPalette.loaded && sb && auth.user) {
      loadMasterPalette().then(renderSavedPalette);
    }

    return editor;
  }

  function bindRaceCreator(form) {
    if (!form || form.dataset.tab !== 'Racas') return null;
    const labels = ['Identidade', 'Fisiologia', 'Corpo e regras', 'Heranças', 'Presença no mundo', 'Relato'];
    const pageCount = labels.length;
    const pages = [...form.querySelectorAll('[data-race-wizard-page]')];
    const navButtons = [...form.querySelectorAll('[data-race-wizard-go]')];
    const previous = form.querySelector('[data-race-wizard-prev]');
    const next = form.querySelector('[data-race-wizard-next]');
    const progress = form.querySelector('[data-race-wizard-progress]');
    const mobileLabel = form.querySelector('[data-race-wizard-label]');
    const mobileCount = form.querySelector('[data-race-wizard-count]');
    const currentLabel = form.querySelector('[data-race-wizard-current]');
    const titleInput = form.querySelector('#titleInput');
    const summaryInput = form.querySelector('#summaryInput');
    let current = 0;

    const review = () => {
      const name = form.querySelector('[data-race-review-name]');
      const summary = form.querySelector('[data-race-review-summary]');
      const parts = form.querySelector('[data-race-review-parts]');
      const abilities = form.querySelector('[data-race-review-abilities]');
      const relations = form.querySelector('[data-race-review-relations]');
      const partCount = form.querySelectorAll('[data-beast-part-row]').length;
      const abilityCount = form.querySelectorAll('[data-beast-ability-row]').length;
      const relationCount = form.querySelectorAll('[data-race-relation-id].is-selected').length;
      if (name) name.textContent = titleInput?.value.trim() || 'Raça sem nome';
      if (summary) summary.textContent = summaryInput?.value.trim() || 'Adicione uma frase de identidade.';
      if (parts) parts.textContent = partCount ? String(partCount) : '—';
      if (abilities) abilities.textContent = abilityCount ? String(abilityCount) : '—';
      if (relations) relations.textContent = relationCount ? String(relationCount) : '—';
    };

    const validateIdentity = () => {
      if (titleInput?.value.trim()) {
        titleInput.classList.remove('is-invalid');
        return true;
      }
      titleInput?.classList.add('is-invalid');
      titleInput?.focus();
      return false;
    };

    const go = (requested, options = {}) => {
      const target = Math.max(0, Math.min(pageCount - 1, Number(requested) || 0));
      if (target > current && current === 0 && !validateIdentity()) return false;
      current = target;
      pages.forEach((page) => { page.hidden = Number(page.dataset.raceWizardPage) !== current; });
      navButtons.forEach((button, index) => {
        const active = index === current;
        button.classList.toggle('is-active', active);
        button.classList.toggle('is-complete', index < current);
        if (active) button.setAttribute('aria-current', 'step');
        else button.removeAttribute('aria-current');
      });
      if (progress) progress.style.width = `${((current + 1) / pageCount) * 100}%`;
      if (mobileLabel) mobileLabel.textContent = `${String(current + 1).padStart(2, '0')} · ${labels[current]}`;
      if (mobileCount) mobileCount.textContent = `${current + 1} de ${pageCount}`;
      if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, '0');
      if (previous) previous.hidden = current === 0;
      if (next) next.hidden = current === pageCount - 1;
      review();
      if (options.scroll !== false) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const top = Math.max(0, form.getBoundingClientRect().top + window.scrollY - 82);
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      return true;
    };

    navButtons.forEach((button) => button.addEventListener('click', () => go(button.dataset.raceWizardGo)));
    previous?.addEventListener('click', () => go(current - 1));
    next?.addEventListener('click', () => go(current + 1));
    form.addEventListener('input', review);
    form.addEventListener('change', review);
    form.addEventListener('click', () => window.requestAnimationFrame(review));
    titleInput?.addEventListener('input', () => titleInput.classList.remove('is-invalid'));
    go(0, { scroll: false });
    return { isFinal: () => current === pageCount - 1, next: () => go(current + 1), go, review };
  }

  /* ── CREATE / EDIT FORM ───────────────────────── */
  function attachCreateForm() {
    const form = document.getElementById('createForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    const tabId = form.dataset.tab;
    const editId = form.dataset.editId || '';
    const editing = !!editId;
    const npcMesaId = form.dataset.npcMesa || '';
    const existing = editing ? (npcMesaId ? npcFormCtx?.npc : entryById(editId)) : null;

    const titleInput = document.getElementById('titleInput');
    const summaryInput = document.getElementById('summaryInput');
    const submitBtn = form.querySelector('[type="submit"]');
    const banner = bindBannerDrop({ initialUrl: existing?.image || '' });
    const tagBuilder = bindTagBuilder({
      tabId,
      initialTags: existing?.tags || [],
      excludeEntryId: editId
    });
    const editor = bindEditor();
    let dossier;
    if (tabId === 'Historias') {
      const position = document.getElementById('narrativePosition');
      const positionLabel = form.querySelector('[data-narrative-position-label]');
      const syncPosition = () => { if (positionLabel && position) positionLabel.textContent = `${position.value}%`; };
      position?.addEventListener('input', syncPosition);
      syncPosition();
      dossier = {
        getSubtype: () => null,
        getFields: () => ({
          Era: document.getElementById('narrativeEra')?.value || '',
          'Data no mundo': document.getElementById('narrativeDate')?.value.trim() || '',
          'Posição temporal': Number(document.getElementById('narrativePosition')?.value || 50),
          Realidade: document.getElementById('narrativeReality')?.value || 'Cânone',
          Importância: document.getElementById('narrativeImportance')?.value || 'Vestígio',
          'Ponto de divergência': document.getElementById('narrativeDivergence')?.value || ''
        })
      };
    } else if (tabId === 'Eras') {
      dossier = {
        getSubtype: () => null,
        getFields: () => ({
          Ordem: Number(document.getElementById('eraOrder')?.value || 1),
          Início: document.getElementById('eraStart')?.value.trim() || '',
          Fim: document.getElementById('eraEnd')?.value.trim() || '',
          Cor: document.getElementById('eraColor')?.value || '#a78bfa'
        })
      };
    } else if (tabId === 'Itens') {
      dossier = bindDossierFields({
        subtype: existing?.subtype || '',
        fields: existing?.fields || {}
      });
    } else if (isSectionedTab(tabId)) {
      const r = bindRaceDossier(dossierConfigFor(tabId).rootId);
      dossier = { getFields: r.getFields, getSubtype: () => null };
    } else {
      dossier = { getFields: () => ({}), getSubtype: () => null };
    }
    const raceCreator = bindRaceCreator(form);

    form.querySelector('[data-story-preview]')?.addEventListener('click', () => {
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.classList.add('is-invalid');
        titleInput.focus();
        return;
      }
      const overlay = document.createElement('div');
      overlay.className = 'story-preview-modal';
      overlay.innerHTML = `<button type="button" class="story-preview-modal__close" aria-label="Fechar prévia">×</button><div class="story-preview-modal__scroll">${storyReaderView({
        id: 'draft-preview', tab: 'Historias', title,
        summary: summaryInput.value.trim(), image: banner.getDataUrl(),
        bodyHtml: editor.innerHTML, tags: tagBuilder.getTags(), fields: dossier.getFields(),
        isUserCreated: false
      }, { draft: true })}</div>`;
      document.body.appendChild(overlay);
      document.body.classList.add('is-modal-open');
      const close = () => {
        overlay.remove();
        document.body.classList.remove('is-modal-open');
        document.removeEventListener('keydown', onKey);
      };
      const onKey = (event) => { if (event.key === 'Escape') close(); };
      overlay.querySelector('.story-preview-modal__close').addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      attachStoryReader(overlay);
      overlay.querySelector('.story-preview-modal__close').focus();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (raceCreator && !raceCreator.isFinal()) {
        raceCreator.next();
        return;
      }
      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add('is-invalid');
        return;
      }
      titleInput.classList.remove('is-invalid');

      const summary = summaryInput.value.trim();
      const tags = tagBuilder.getTags();
      const bodyHtml = sanitizeHtml(editor.innerHTML).trim();
      const subtype = dossier.getSubtype();
      const fields = dossier.getFields();

      const combatBad = dossier.getCombatErrors ? dossier.getCombatErrors() : [];
      if (combatBad.length) {
        combatBad[0].focus();
        toast('Escreva os dados de dano no formato 3d6.');
        return;
      }

      if (tabId === 'Historias' && !fields.Era) {
        const eraSelect = document.getElementById('narrativeEra');
        eraSelect?.classList.add('is-invalid');
        eraSelect?.focus();
        return;
      }

      if (tabId === 'Bestiario' && !fields['DA Base']) {
        const daSelect = form.querySelector('[data-dossier-field="DA Base"]');
        const section = daSelect && daSelect.closest('details');
        if (section) section.open = true;
        if (daSelect) {
          daSelect.classList.add('is-invalid');
          daSelect.focus();
        }
        return;
      }

      if (!sb) {
        toast('Supabase não configurado. Edite assets/js/config.js com sua URL e anon key.');
        return;
      }

      submitBtn.disabled = true;
      const originalLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Salvando…</span>';

      if (npcMesaId) {
        await handleNpcSubmit({ title, summary, tags, bodyHtml, fields });
      } else if (editing) {
        await handleEditSubmit({ existing, title, summary, tags, bodyHtml, subtype, fields });
      } else {
        await handleCreateSubmit({ title, summary, tags, bodyHtml, subtype, fields });
      }

      async function handleNpcSubmit(payload) {
        let uploadedPath = '';
        let inlinePaths = [];
        try {
          const inline = await prepareInlineImages(editor, `${npcMesaId}/npcs`, 'mesas');
          payload.bodyHtml = inline.html;
          inlinePaths = inline.uploadedPaths;
          let image = existing?.image || '';
          let imagePath = existing?.imagePath || '';
          const oldPaths = [];
          const file = banner.getFile();
          if (file) {
            const up = await uploadBanner(file, `mesas/${npcMesaId}/npcs/retrato`);
            uploadedPath = up.path;
            if (imagePath) oldPaths.push(imagePath);
            image = up.url;
            imagePath = up.path;
          } else if (editing && !banner.getDataUrl() && image) {
            if (imagePath) oldPaths.push(imagePath);
            image = '';
            imagePath = '';
          }
          const saved = await saveMesaNpc(npcMesaId, existing, { ...payload, image, imagePath });
          for (const path of oldPaths) await removeBanner(path);
          location.hash = `#/Mesas/${encodeURIComponent(npcMesaId)}/npcs/${encodeURIComponent(saved.id)}`;
        } catch (err) {
          console.error(err);
          toast('Erro ao salvar NPC: ' + (err.message || err));
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
          if (uploadedPath) await removeBanner(uploadedPath);
          for (const path of inlinePaths) await removeBanner(path);
        }
      }

      async function handleCreateSubmit(payload) {
        let imageUrl = '';
        let imagePath = '';
        let inlinePaths = [];
        const id = uniqueId(slugify(payload.title));
        try {
          const inline = await prepareInlineImages(editor, id);
          payload.bodyHtml = inline.html;
          inlinePaths = inline.uploadedPaths;
          const file = banner.getFile();
          if (file) {
            const up = await uploadBanner(file, `stories/${id}`);
            imageUrl = up.url;
            imagePath = up.path;
          }
          const newEntry = {
            id, tab: tabId,
            title: payload.title, summary: payload.summary,
            image: imageUrl, imagePath,
            bodyHtml: payload.bodyHtml, tags: payload.tags,
            subtype: payload.subtype, fields: payload.fields,
            createdAt: Date.now(), isUserCreated: true
          };
          await persistUserEntry(newEntry);
          ARCHIVE.entries.push(newEntry);
          location.hash = `#/${tabId}/${id}`;
        } catch (err) {
          console.error(err);
          toast('Erro ao salvar: ' + (err.message || err));
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
          if (imagePath) await removeBanner(imagePath);
          for (const path of inlinePaths) await removeBanner(path);
        }
      }

      async function handleEditSubmit(payload) {
        const file = banner.getFile();
        const currentDataUrl = banner.getDataUrl();
        let nextImage = payload.existing.image || '';
        let nextImagePath = payload.existing.imagePath || '';
        let uploadedPath = '';
        let inlinePaths = [];
        const oldPathToRemove = [];

        try {
          const inline = await prepareInlineImages(editor, payload.existing.id);
          payload.bodyHtml = inline.html;
          inlinePaths = inline.uploadedPaths;
          if (file) {
            // nova imagem foi carregada — substitui
            const up = await uploadBanner(file, `stories/${payload.existing.id}`);
            uploadedPath = up.path;
            if (payload.existing.imagePath) oldPathToRemove.push(payload.existing.imagePath);
            nextImage = up.url;
            nextImagePath = up.path;
          } else if (!currentDataUrl && payload.existing.image) {
            // usuário removeu a imagem (preview limpo)
            if (payload.existing.imagePath) oldPathToRemove.push(payload.existing.imagePath);
            nextImage = '';
            nextImagePath = '';
          }

          const updated = {
            ...payload.existing,
            tab: tabId,
            title: payload.title,
            summary: payload.summary,
            image: nextImage,
            imagePath: nextImagePath,
            bodyHtml: payload.bodyHtml,
            tags: payload.tags,
            subtype: payload.subtype || payload.existing.subtype || '',
            fields: payload.fields
          };
          await updateUserEntry(updated);

          // commit em memória (mantém referência)
          Object.assign(payload.existing, updated);

          // remove imagens antigas só após persistir com sucesso
          for (const p of oldPathToRemove) await removeBanner(p);
          location.hash = `#/${tabId}/${payload.existing.id}`;
          render(true);
        } catch (err) {
          console.error(err);
          toast('Erro ao salvar alterações: ' + (err.message || err));
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
          if (uploadedPath) await removeBanner(uploadedPath);
          for (const path of inlinePaths) await removeBanner(path);
        }
      }
    });
  }

  /* ── LIST-BUILDER genérico (perícias) ─────────── */
  function bindSimpleListBuilder(rootId) {
    const builder = document.getElementById(rootId);
    if (!builder) return { getItems: () => [] };
    const input = builder.querySelector('.list-builder__input');
    const addBtn = builder.querySelector('.list-builder__add');

    const read = () => { try { return JSON.parse(builder.dataset.items || '[]') || []; } catch { return []; } };
    const refresh = (items) => {
      builder.dataset.items = JSON.stringify(items);
      builder.querySelector('.list-builder__items').innerHTML = items.map((it, i) => listBuilderItemHTML(it, i)).join('');
    };
    const add = () => {
      const v = (input.value || '').trim();
      if (!v) { input.focus(); return; }
      const items = read();
      if (items.some((x) => x.toLowerCase() === v.toLowerCase())) { input.value = ''; input.focus(); return; }
      items.push(v);
      refresh(items);
      input.value = '';
      input.focus();
    };
    addBtn.addEventListener('click', add);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    builder.addEventListener('click', (e) => {
      const rm = e.target.closest('[data-remove-list]');
      if (!rm) return;
      const items = read();
      items.splice(Number(rm.dataset.removeList), 1);
      refresh(items);
    });
    return { getItems: read };
  }

  /* ── POINT-BUY de atributos ───────────────────── */
  function bindAttributePointBuy() {
    const root = document.getElementById('attrBuy');
    const stub = { getAllocated: () => ({}), getRemaining: () => 0, refreshRaceMod() {}, setResCap() {}, setBonusAttr() {} };
    if (!root) return stub;
    const base = Number(root.dataset.base) || 10;
    const pool = root.dataset.pool === 'livre' ? Infinity : (Number(root.dataset.pool) || 6);
    const max = Number(root.dataset.max) || 16;
    const min = Number(root.dataset.min) || base;
    const poolEl = document.getElementById('attrPool');
    let bonusAttr = '';

    const rows = () => [...root.querySelectorAll('.attr-row')];
    const valueOf = (row) => Number(row.querySelector('[data-attr-value]').textContent) || base;
    const allocated = () => { const o = {}; rows().forEach((r) => { o[r.dataset.attr] = valueOf(r); }); return o; };
    const spent = () => rows().reduce((s, r) => s + (valueOf(r) - base), 0);
    const remaining = () => pool - spent();
    const capOf = (row) => {
      let cap = max;
      if (bonusAttr && row.dataset.attr === bonusAttr) cap = Math.max(base, cap - 1);
      return cap;
    };

    function syncRow(row) {
      const v = valueOf(row);
      const raceMod = Number(row.dataset.racemod) || 0;
      const bonus = (bonusAttr && bonusAttr === row.dataset.attr) ? 1 : 0;
      const finalScore = v + bonus;
      const dice = attrDiceForScore(finalScore, raceMod);
      row.querySelector('[data-attr-mod]').textContent = fmtDice(dice);
      const tag = row.querySelector('[data-attr-tag]');
      let tagClass = 'attr-row__tag';
      if (bonus) { tag.textContent = '+1 despertar'; tagClass += ' attr-row__tag--bonus'; }
      else if (raceMod) { tag.textContent = `${raceMod > 0 ? '+' : ''}${raceMod}d6 raca`; }
      else { tag.textContent = ''; }
      tag.className = tagClass;
      if (row.dataset.attr === 'Destreza') {
        const mv = document.getElementById('charMovement');
        const race = document.getElementById('charRace');
        if (mv) mv.placeholder = `${computedMovementFor(race ? race.value : '', dice)}m`;
      }
    }
    function syncAll() {
      const rem = remaining();
      if (poolEl) poolEl.textContent = rem;
      rows().forEach((row) => {
        const v = valueOf(row);
        row.querySelector('[data-step="-1"]').disabled = v <= min;
        row.querySelector('[data-step="1"]').disabled = v >= capOf(row) || rem <= 0;
        syncRow(row);
      });
    }

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('.attr-step');
      if (!btn) return;
      const row = btn.closest('.attr-row');
      const valEl = row.querySelector('[data-attr-value]');
      let v = Number(valEl.textContent) || base;
      const dir = Number(btn.dataset.step);
      if (dir > 0 && v < capOf(row) && remaining() > 0) v += 1;
      else if (dir < 0 && v > min) v -= 1;
      valEl.textContent = v;
      syncAll();
    });

    syncAll();

    return {
      getAllocated: allocated,
      getRemaining: () => (Number.isFinite(remaining()) ? remaining() : 0),
      refreshRaceMod(mod) {
        rows().forEach((r) => { r.dataset.racemod = Number((mod && mod[r.dataset.attr]) || 0); });
        syncAll();
      },
      setResCap() {
        syncAll();
      },
      setBonusAttr(attr) {
        bonusAttr = attr || '';
        rows().forEach((r) => {
          const el = r.querySelector('[data-attr-value]');
          if (el && Number(el.textContent) > capOf(r)) el.textContent = capOf(r);
        });
        syncAll();
      }
    };
  }

  /* ── O DESPERTAR (ritual com animação) ────────── */
  const AWK_RINGS = '<span class="awk__ring" aria-hidden="true"></span><span class="awk__ring awk__ring--2" aria-hidden="true"></span><span class="awk__glow" aria-hidden="true"></span>';

  function awkIsAcceptedMage(a) { return a.resolved && a.mageRoll >= AWAKEN_MAGE_MIN && a.accepted; }
  function awkIsNonMage(a) { return a.resolved && !(a.mageRoll >= AWAKEN_MAGE_MIN && a.accepted); }

  /* Um dado d100 estilizado. numId injeta um id no número (para a animação). */
  function awkDieHTML({ value = '?', cls = '', numId = '', mark = 'd100', small = false } = {}) {
    return `
      <div class="awk__diewrap ${small ? 'awk__diewrap--sm' : ''}">
        ${AWK_RINGS}
        <div class="awk__die ${cls}">
          <span class="awk__die-num" ${numId ? `id="${numId}"` : ''}>${value}</span>
          <span class="awk__die-mark" aria-hidden="true">${escapeHtml(mark)}</span>
        </div>
      </div>
    `;
  }

  function awakeningRollingHTML(label) {
    return `
      <div class="awk awk--rolling">
        ${awkDieHTML({ value: '00', cls: 'is-rolling', numId: 'awkDie' })}
        <p class="awk__caption">${escapeHtml(label)}</p>
      </div>
    `;
  }

  function awakeningPanelHTML(a) {
    const hasRolled = a.mageRoll > 0;
    const rolledMage = a.mageRoll >= AWAKEN_MAGE_MIN;
    const attemptsLeft = AWAKEN_MAX_ATTEMPTS - a.attempts;

    if (!hasRolled) {
      return `
        <div class="awk awk--idle">
          ${awkDieHTML({ value: '?', cls: 'awk__die--idle' })}
          <p class="awk__intro">O destino ainda não falou. Role <strong>1d100</strong> para saber se a Mana corre em você.</p>
          <button type="button" class="btn btn-primary awk__roll" data-awk="roll">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.3" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.3" fill="currentColor" stroke="none"/></svg>
            <span>Rolar o Despertar</span>
          </button>
          <span class="awk__attempts">${AWAKEN_MAX_ATTEMPTS} tentativas disponíveis</span>
        </div>
      `;
    }

    const dieBlock = awkDieHTML({ value: a.mageRoll, cls: 'awk__die--final ' + (rolledMage ? 'is-mage' : 'is-mundane') });
    const rerollBtn = attemptsLeft > 0 && !(rolledMage && a.accepted)
      ? `<button type="button" class="btn btn-ghost awk__reroll" data-awk="roll"><span>Rolar de novo</span> <small>(${attemptsLeft} ${attemptsLeft === 1 ? 'restante' : 'restantes'})</small></button>`
      : '';

    // Mago indeciso: precisa aceitar ou renunciar
    if (rolledMage && !a.accepted && !a.renounced) {
      return `
        <div class="awk awk--result is-mage" style="--awk-hue:190">
          ${dieBlock}
          <div class="awk__verdict">
            <span class="awk__verdict-eyebrow">71–100 · A MANA DESPERTOU</span>
            <h3 class="awk__verdict-title">Você nasceu Mago</h3>
            <p class="awk__verdict-lore">A Mana viva pulsa sob sua pele. Aceitá-la é poder e condenação; recusá-la, voltar ao mundo dos que ferem cristais.</p>
          </div>
          <div class="awk__choice">
            <button type="button" class="btn btn-primary" data-awk="accept"><span>Aceitar a Mana</span></button>
            <button type="button" class="btn btn-ghost" data-awk="renounce"><span>Renunciar</span></button>
          </div>
          ${rerollBtn}
        </div>
      `;
    }

    // Mago que aceitou: mostra a escola
    if (rolledMage && a.accepted) {
      const sc = schoolById(a.school) || MAGIC_SCHOOLS[0];
      return `
        <div class="awk awk--result is-mage awk--school" style="--awk-hue:${sc.hue}">
          <div class="awk__rolls">
            ${awkDieHTML({ value: a.mageRoll, cls: 'awk__die--final is-mage', mark: 'mana', small: true })}
            ${awkDieHTML({ value: a.schoolRoll, cls: 'awk__die--final awk__die--school', mark: 'escola' })}
          </div>
          <div class="awk__verdict">
            <span class="awk__verdict-eyebrow">ESCOLA DA MANA</span>
            <h3 class="awk__verdict-title">${escapeHtml(sc.name)}</h3>
            <p class="awk__verdict-lore">${escapeHtml(sc.lore)}</p>
            <p class="awk__note">Fragilidade Arcana: -1d6 em testes de Resistencia para exaustao prolongada, doenca, sangramento ou recuperacao fisica.</p>
          </div>
        </div>
      `;
    }

    // Não-mago (rolou baixo) ou renunciou
    const bonusName = a.bonusAttr ? a.bonusAttr : '';
    const reason = a.renounced ? 'Você renunciou à Mana' : 'A Mana não respondeu';
    const eyebrow = a.renounced ? 'RENÚNCIA' : '1–70 · MUNDANO';
    return `
      <div class="awk awk--result is-mundane" style="--awk-hue:38">
        ${dieBlock}
        <div class="awk__verdict">
          <span class="awk__verdict-eyebrow">${eyebrow}</span>
          <h3 class="awk__verdict-title">${escapeHtml(reason)}</h3>
          <p class="awk__verdict-lore">Sem a febre arcana, seu corpo é mais firme. Você endurece onde o mago se parte.</p>
          <ul class="awk__bonuses">
            <li><strong>+1 Nível de HP</strong> — some-o manualmente nas partes do corpo abaixo.</li>
            <li><strong>+1 ${escapeHtml(bonusName || 'Atributo')}</strong> — ponto extra rolado no Despertar.</li>
          </ul>
        </div>
        ${rerollBtn}
      </div>
    `;
  }

  /* ── Natureza arcana definida pelo Mestre (sem ritual) ── */
  function awakeningMasterHTML(a) {
    const isMage = awkIsAcceptedMage(a);
    const isMundane = awkIsNonMage(a);
    return `
      <div class="awk-master">
        <span class="awk-master__title">Definir pelo Mestre</span>
        <select data-awk-master-kind aria-label="Natureza arcana">
          <option value="">—</option>
          <option value="mago" ${isMage ? 'selected' : ''}>Mago</option>
          <option value="mundano" ${isMundane ? 'selected' : ''}>Não-mago</option>
        </select>
        <select data-awk-master-school aria-label="Escola">
          ${MAGIC_SCHOOLS.map((sc) => `<option value="${escapeHtml(sc.id)}" ${a.school === sc.id ? 'selected' : ''}>${escapeHtml(sc.name)}</option>`).join('')}
        </select>
        <select data-awk-master-bonus aria-label="Atributo bônus do não-mago">
          <option value="">Sem bônus</option>
          ${CHAR_ATTRIBUTES.map((attr) => `<option value="${escapeHtml(attr)}" ${a.bonusAttr === attr ? 'selected' : ''}>+1 ${escapeHtml(attr)}</option>`).join('')}
        </select>
        <button type="button" class="btn btn-ghost" data-awk="master-apply">Aplicar</button>
      </div>`;
  }

  /* ════════════════════════════════════════════════
     NÍVEIS — o Mestre concede; o dono sobe com testes
     HP: teste de Resistência por parte (ganha a soma dos d6).
     Mana: teste de Inteligência (mesma regra). Pontos: o Mestre define.
     ════════════════════════════════════════════════ */
  const levelAlloc = {};

  function characterDiceFor(c, attr) {
    const { mod } = raceDataFor(c.raceId);
    const awk = normalizeAwakening(c.magic);
    const A = attrModsView(c, mod, awkIsNonMage(awk) ? awk.bonusAttr : '');
    return Math.max(1, (A[attr] && A[attr].dice) || 1);
  }

  function levelGrantOf(c) {
    const g = c && c.levelGrant;
    return g && g.at ? { points: Math.max(0, Number(g.points) || 0), at: g.at } : null;
  }

  function rollLevelTest(dice) {
    const d6s = Array.from({ length: dice }, () => randomInt(6));
    const destiny = randomInt(12);
    return { dice, d6s, destiny, gain: d6s.reduce((a, b) => a + b, 0), reading: destinyReading(destiny).title };
  }

  function levelDieChips(t) {
    return `${t.d6s.map((v) => `<span class="chat-die${v === 6 ? ' is-max' : (v === 1 ? ' is-min' : '')}">${v}</span>`).join('')}<span class="chat-roll__plus">+</span><span class="chat-die chat-die--destiny" title="Destino">${t.destiny}</span>`;
  }

  function levelFlowHTML(c, draft) {
    const grant = levelGrantOf(c);
    const alloc = levelAlloc[c.id] || {};
    const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
    const left = (grant ? grant.points : 0) - spent;
    return `
      <ul class="level-rolls">
        ${draft.parts.map((t) => `<li><span>${escapeHtml(t.part)}</span><span class="level-rolls__dice">${levelDieChips(t)}</span><b>+${t.gain}</b></li>`).join('')}
        ${draft.mana ? `<li class="is-mana"><span>Mana</span><span class="level-rolls__dice">${levelDieChips(draft.mana)}</span><b>+${draft.mana.gain}</b></li>` : ''}
      </ul>
      ${grant && grant.points ? `
        <p class="level-panel__sub">Pontos de atributo <b data-level-left>${left}</b></p>
        <div class="level-attrs">
          ${CHAR_ATTRIBUTES.map((attr) => {
            const base = Number(c.attributes?.[attr] ?? CHAR_ATTR_BASE);
            const add = alloc[attr] || 0;
            return `<div class="level-attr" data-level-attr="${escapeHtml(attr)}">
              <span>${escapeHtml(attr)}</span>
              <button type="button" data-level-step="-1" ${add ? '' : 'disabled'} aria-label="Tirar ponto de ${escapeHtml(attr)}">−</button>
              <b>${base + add}${add ? `<small>+${add}</small>` : ''}</b>
              <button type="button" data-level-step="1" ${left > 0 ? '' : 'disabled'} aria-label="Pôr ponto em ${escapeHtml(attr)}">+</button>
            </div>`;
          }).join('')}
        </div>` : ''}
      <button type="button" class="btn btn-primary" data-level-finish ${left > 0 ? 'disabled' : ''}>${left > 0 ? `Distribua ${left} ${left === 1 ? 'ponto' : 'pontos'}` : 'Concluir nível'}</button>`;
  }

  function levelPanelHTML(c) {
    if (!c || !auth.user) return '';
    const master = isCharacterMaster(c);
    const owner = c.userId === auth.user.id;
    const grant = levelGrantOf(c);
    const level = Number(c.identity?.level) || 1;
    if (!master && !(grant && owner)) return '';
    const draft = c.identity?.levelUpDraft;
    return `
      <section class="level-panel ${grant ? 'is-ready' : ''}" data-level-panel="${escapeHtml(c.id)}">
        <div class="level-panel__head">
          <span class="level-panel__lvl">Nível ${level}</span>
          ${grant ? `<span class="level-panel__grant-info">Nível ${level + 1} liberado${grant.points ? ` · ${grant.points} ${grant.points === 1 ? 'ponto' : 'pontos'} de atributo` : ''}</span>` : ''}
          ${master && c.isNpc ? `<button type="button" class="chat-link" data-level-npc-visible>${c.npcVisible ? 'visível aos jogadores' : 'oculto dos jogadores'}</button>` : ''}
          ${master && grant ? '<button type="button" class="chat-link" data-level-cancel>cancelar</button>' : ''}
        </div>
        ${grant && (owner || master) ? `<div class="level-panel__flow" data-level-flow>${draft ? levelFlowHTML(c, draft) : '<button type="button" class="btn btn-primary" data-level-start>Passar de nível</button>'}</div>` : ''}
        ${master && !grant ? `
          <div class="level-panel__grant">
            <label>Conceder nível ${level + 1} com <input type="number" min="0" max="99" value="3" data-level-points aria-label="Pontos de atributo"> pontos</label>
            <button type="button" class="btn btn-ghost" data-level-grant>Conceder</button>
          </div>` : ''}
      </section>`;
  }

  function chatLevelUpHTML(mesaId, msg, s, lv) {
    const parts = (lv.parts || []).map((t) => `${escapeHtml(t.part)} +${t.gain}`).join(' · ');
    const pts = Object.entries(lv.points || {}).filter(([, n]) => n).map(([a, n]) => `${escapeHtml(a)} +${n}`).join(' · ');
    return `
      <li class="chat-msg chat-msg--roll chat-msg--level" data-mesa-msg="${escapeHtml(msg.id)}" style="--who:${safeChatColor(s.color, s.id || s.name)}">
        <p class="chat-roll"><span class="chat-who">${escapeHtml(s.name)}</span> <span class="chat-roll__label">chegou ao</span> <span class="chat-roll__total chat-level__n">nível ${Number(lv.level) || ''}</span></p>
        <p class="chat-level__detail">
          ${parts ? `<span>HP: ${parts}</span>` : ''}
          ${lv.mana ? `<span>Mana +${lv.mana.gain}</span>` : ''}
          ${pts ? `<span>${pts}</span>` : ''}
        </p>
        <span class="chat-time">${escapeHtml(chatTime(msg))}</span>
        ${chatToolsHTML(mesaId, msg)}
      </li>`;
  }

  function attachLevelPanel() {
    const panel = document.querySelector('[data-level-panel]');
    if (!panel || panel.dataset.bound) return;
    panel.dataset.bound = '1';
    const c = characterById(panel.dataset.levelPanel);
    if (!c) return;

    const redraw = () => {
      const flow = panel.querySelector('[data-level-flow]');
      if (flow && c.identity?.levelUpDraft) flow.innerHTML = levelFlowHTML(c, c.identity.levelUpDraft);
    };

    panel.addEventListener('click', async (event) => {
      const target = event.target;
      const button = target.closest('button');
      if (!button) return;
      try {
        if (button.matches('[data-level-grant]')) {
          const points = Math.max(0, Math.min(99, parseInt(panel.querySelector('[data-level-points]').value, 10) || 0));
          const grant = { points, by: auth.user.id, at: new Date().toISOString() };
          button.disabled = true;
          const { error } = await sb.from('characters').update({ level_grant: grant }).eq('id', c.id);
          if (error) throw error;
          c.levelGrant = grant;
          render(true);
          return;
        }
        if (button.matches('[data-level-cancel]')) {
          const { error } = await sb.from('characters').update({ level_grant: {} }).eq('id', c.id);
          if (error) throw error;
          c.levelGrant = {};
          if (c.identity?.levelUpDraft) {
            const identity = { ...c.identity };
            delete identity.levelUpDraft;
            c.identity = identity;
            await persistCharacterState(c);
          }
          delete levelAlloc[c.id];
          render(true);
          return;
        }
        if (button.matches('[data-level-npc-visible]')) {
          const { error } = await sb.from('characters').update({ npc_visible: !c.npcVisible }).eq('id', c.id);
          if (error) throw error;
          c.npcVisible = !c.npcVisible;
          button.textContent = c.npcVisible ? 'visível aos jogadores' : 'oculto dos jogadores';
          return;
        }
        if (button.matches('[data-level-start]')) {
          // Os testes ficam gravados na ficha: recarregar a página não rola de novo.
          ensureVitals(c);
          const resDice = characterDiceFor(c, 'Resistência');
          const parts = Object.keys(c.vitals.hp || {}).map((part) => ({ part, ...rollLevelTest(resDice) }));
          const awk = normalizeAwakening(c.magic);
          const mana = awkIsAcceptedMage(awk) && c.vitals.mana ? rollLevelTest(characterDiceFor(c, 'Inteligência')) : null;
          c.identity = { ...(c.identity || {}), levelUpDraft: { parts, mana, at: new Date().toISOString() } };
          levelAlloc[c.id] = {};
          button.disabled = true;
          await persistCharacterState(c);
          redraw();
          return;
        }
        const step = target.closest('[data-level-step]');
        if (step) {
          const attr = step.closest('[data-level-attr]').dataset.levelAttr;
          const alloc = levelAlloc[c.id] || (levelAlloc[c.id] = {});
          alloc[attr] = Math.max(0, (alloc[attr] || 0) + Number(step.dataset.levelStep));
          redraw();
          return;
        }
        if (button.matches('[data-level-finish]')) {
          const draft = c.identity?.levelUpDraft;
          const grant = levelGrantOf(c);
          if (!draft || !grant) return;
          const alloc = levelAlloc[c.id] || {};
          button.disabled = true;
          ensureVitals(c);
          c.hp = { ...(c.hp || {}) };
          draft.parts.forEach((t) => {
            const slot = c.vitals.hp[t.part];
            if (!slot) return;
            slot.max += t.gain;
            slot.cur += t.gain;
            c.hp[t.part] = String(slot.max);
          });
          if (draft.mana && c.vitals.mana) {
            c.vitals.mana.max += draft.mana.gain;
            c.vitals.mana.cur += draft.mana.gain;
            c.mana = `${c.vitals.mana.cur}/${c.vitals.mana.max}`;
          }
          c.attributes = { ...(c.attributes || {}) };
          Object.entries(alloc).forEach(([attr, n]) => {
            c.attributes[attr] = Number(c.attributes[attr] ?? CHAR_ATTR_BASE) + n;
          });
          const newLevel = (Number(c.identity?.level) || 1) + 1;
          const identity = { ...(c.identity || {}), level: newLevel };
          delete identity.levelUpDraft;
          c.identity = identity;
          const saved = await updateCharacter(c);
          const { error } = await sb.from('characters').update({ level_grant: {} }).eq('id', c.id);
          if (error) throw error;
          Object.assign(c, saved, { levelGrant: {} });
          delete levelAlloc[c.id];
          if (c.mesaId) {
            await sendChatMessage(c.mesaId, {
              kind: 'rolagem',
              speaker: { type: 'character', id: c.id, name: c.name, image: c.image || '', color: safeChatColor(c.identity?.chatColor, c.id) },
              data: { levelUp: { level: newLevel, parts: draft.parts, mana: draft.mana, points: alloc } }
            });
          }
          toast(`${c.name} chegou ao nível ${newLevel}.`);
          render(true);
        }
      } catch (err) {
        console.error(err);
        toast('Não deu certo: ' + (err.message || err));
        button.disabled = false;
      }
    });
  }

  /* ── FORM DA FICHA DE PERSONAGEM ──────────────── */
  function attachCharacterForm() {
    const form = document.getElementById('characterForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    const editId = form.dataset.charId || '';
    const editing = !!editId;
    const existing = editing ? characterById(editId) : null;
    const masterMode = form.dataset.master === '1';
    const isNpcForm = form.dataset.npc === '1';
    const ownerSelect = document.getElementById('charOwner');

    const nameInput = document.getElementById('charName');
    const levelInput = document.getElementById('charLevel');
    const movementInput = document.getElementById('charMovement');
    const daAttrInput = document.getElementById('charDaAttr');
    const dfBaseInput = document.getElementById('charDfBase');
    const dmBaseInput = document.getElementById('charDmBase');
    const raceSelect = document.getElementById('charRace');
    const manaInput = document.getElementById('charMana');
    const hpForm = document.getElementById('charHpForm');
    const awakeningEl = document.getElementById('awakening');
    const submitBtn = form.querySelector('[type="submit"]');

    const banner = bindBannerDrop({ initialUrl: existing?.image || '' });
    const editor = bindEditor();
    const skills = bindSimpleListBuilder('charSkills');
    form.querySelector('.char-color')?.addEventListener('click', (event) => {
      const swatch = event.target.closest('[data-char-color]');
      if (swatch) document.getElementById('charColor').value = swatch.dataset.charColor;
    });
    const points = bindAttributePointBuy();

    form.querySelectorAll('[data-char-form-section]').forEach((button) => {
      button.addEventListener('click', () => {
        const section = document.getElementById(button.dataset.charFormSection || '');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Estado do Despertar (carrega de uma ficha existente ou começa do zero).
    const awakening = normalizeAwakening(existing ? existing.magic : null);

    points.refreshRaceMod(raceDataFor(raceSelect.value).mod);

    // Escolhe um atributo aleatório para o +1 de não-mago, respeitando o teto.
    function pickBonusAttr() {
      const alloc = points.getAllocated();
      const eligible = CHAR_ATTRIBUTES.filter((a) => (alloc[a] || CHAR_ATTR_BASE) < attrCapFor(a, false));
      const pool = eligible.length ? eligible : CHAR_ATTRIBUTES;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function applyAwakeningToAttributes() {
      points.setResCap(awkIsAcceptedMage(awakening));
      points.setBonusAttr(awkIsNonMage(awakening) ? awakening.bonusAttr : '');
      syncManaAvailability();
    }

    function syncManaAvailability() {
      const isMageNow = awkIsAcceptedMage(awakening);
      const manaLabel = manaInput && manaInput.closest('.dossier-field');
      if (!manaInput) return;
      manaInput.disabled = !isMageNow;
      manaInput.placeholder = isMageNow ? '15/15' : 'Sem Mana natural';
      if (!isMageNow) manaInput.value = '';
      if (manaLabel) manaLabel.classList.toggle('is-disabled', !isMageNow);
    }

    function renderAwakening() {
      awakeningEl.innerHTML = awakeningPanelHTML(awakening) + (masterMode ? awakeningMasterHTML(awakening) : '');
    }

    function animateRoll(el, finalValue, done) {
      if (!el) { done(); return; }
      const total = 1200;
      const start = performance.now();
      (function tick(now) {
        const elapsed = now - start;
        if (elapsed >= total) {
          el.textContent = finalValue;
          el.classList.add('is-settled');
          done();
          return;
        }
        el.textContent = rollD100();
        const delay = 35 + (elapsed / total) * 150;
        setTimeout(() => requestAnimationFrame(tick), delay);
      })(start);
    }

    // Delegação de cliques do ritual.
    awakeningEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-awk]');
      if (!btn) return;
      const action = btn.dataset.awk;

      if (action === 'roll') {
        if (awakening.attempts >= AWAKEN_MAX_ATTEMPTS) return;
        awakeningEl.innerHTML = awakeningRollingHTML('A Mana se agita…');
        const value = rollD100();
        animateRoll(document.getElementById('awkDie'), value, () => {
          awakening.mageRoll = value;
          awakening.attempts += 1;
          awakening.accepted = false;
          awakening.renounced = false;
          awakening.school = '';
          awakening.schoolRoll = 0;
          if (value >= AWAKEN_MAGE_MIN) {
            awakening.resolved = false;
            awakening.bonusAttr = '';
          } else {
            awakening.resolved = true;
            awakening.bonusAttr = pickBonusAttr();
          }
          applyAwakeningToAttributes();
          renderAwakening();
        });
        return;
      }

      if (action === 'accept') {
        awakeningEl.innerHTML = awakeningRollingHTML('A Mana escolhe sua forma…');
        const value = rollD100();
        const sc = schoolForRoll(value);
        animateRoll(document.getElementById('awkDie'), value, () => {
          awakening.accepted = true;
          awakening.renounced = false;
          awakening.school = sc.id;
          awakening.schoolRoll = value;
          awakening.bonusAttr = '';
          awakening.resolved = true;
          applyAwakeningToAttributes();
          renderAwakening();
        });
        return;
      }

      if (action === 'master-apply') {
        const kind = awakeningEl.querySelector('[data-awk-master-kind]').value;
        if (kind === 'mago') {
          awakening.mageRoll = Math.max(awakening.mageRoll, AWAKEN_MAGE_MIN);
          awakening.accepted = true;
          awakening.renounced = false;
          awakening.school = awakeningEl.querySelector('[data-awk-master-school]').value || MAGIC_SCHOOLS[0].id;
          awakening.bonusAttr = '';
        } else if (kind === 'mundano') {
          awakening.mageRoll = awakening.mageRoll && awakening.mageRoll < AWAKEN_MAGE_MIN ? awakening.mageRoll : 1;
          awakening.accepted = false;
          awakening.renounced = false;
          awakening.school = '';
          awakening.schoolRoll = 0;
          awakening.bonusAttr = awakeningEl.querySelector('[data-awk-master-bonus]').value || '';
        } else {
          return;
        }
        awakening.resolved = true;
        awakening.byMaster = true;
        applyAwakeningToAttributes();
        renderAwakening();
        return;
      }

      if (action === 'renounce') {
        awakening.accepted = false;
        awakening.renounced = true;
        awakening.school = '';
        awakening.schoolRoll = 0;
        awakening.resolved = true;
        awakening.bonusAttr = pickBonusAttr();
        applyAwakeningToAttributes();
        renderAwakening();
        return;
      }
    });

    applyAwakeningToAttributes();
    renderAwakening();

    // troca de raça: atualiza modificadores e repõe HP/Mana a partir do dossiê
    raceSelect.addEventListener('change', () => {
      const { mod, hp, mana } = raceDataFor(raceSelect.value);
      points.refreshRaceMod(mod);
      hpForm.innerHTML = characterHpFormHTML(hp);
      manaInput.value = awkIsAcceptedMage(awakening) ? (mana || '') : '';
    });

    function readHp() {
      const out = {};
      hpForm.querySelectorAll('[data-hp-part]').forEach((inp) => {
        const v = (inp.value || '').trim();
        if (v) out[inp.dataset.hpPart] = v;
      });
      return out;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!sb) { toast('Supabase não configurado.'); return; }

      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        nameInput.classList.add('is-invalid');
        return;
      }
      nameInput.classList.remove('is-invalid');

      if (!awakening.resolved && masterMode) {
        // O Mestre pode salvar sem o ritual: vira não-mago sem bônus até ele decidir.
        awakening.resolved = true;
        awakening.byMaster = true;
      }
      if (!awakening.resolved) {
        toast('Conclua o Despertar antes de salvar: role o destino e, se for mago, aceite ou renuncie à Mana.');
        awakeningEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const race = raceSelect.value ? entryById(raceSelect.value) : null;
      const isMageNow = awkIsAcceptedMage(awakening);
      const manaValue = isMageNow ? manaInput.value.trim() : '';
      const hpValue = readHp();
      const mergedVitals = mergeVitals(existing && existing.vitals, hpValue, manaValue);
      mergedVitals.df = clampDefLevel(dfBaseInput && dfBaseInput.value);
      mergedVitals.dm = clampDefLevel(dmBaseInput && dmBaseInput.value);

      const data = {
        name,
        raceId: raceSelect.value || '',
        raceName: race ? race.title : '',
        isMage: isMageNow,
        attributes: points.getAllocated(),
        pointPool: points.getRemaining(),
        skills: skills.getItems(),
        magic: { ...awakening },
        hp: hpValue,
        mana: manaValue,
        ...(ownerSelect ? { userId: ownerSelect.value } : {}),
        ...(isNpcForm ? { isNpc: true, npcVisible: !!existing?.npcVisible } : {}),
        identity: {
          ...(existing?.identity || {}),
          level: Math.max(1, parseInt(levelInput && levelInput.value, 10) || 1),
          chatColor: (document.getElementById('charColor')?.value || existing?.identity?.chatColor || ''),
          movement: (movementInput && movementInput.value.trim()) || '',
          daAttr: CHAR_ATTRIBUTES.includes(daAttrInput && daAttrInput.value) ? daAttrInput.value : 'Destreza',
          papel: document.getElementById('charPapel').value.trim(),
          desejo: document.getElementById('charDesejo').value.trim(),
          ferida: document.getElementById('charFerida').value.trim(),
          bodyHtml: editor ? sanitizeHtml(editor.innerHTML).trim() : '',
          ownerLabel: (existing?.identity?.ownerLabel) ||
            (auth.user ? (auth.user.user_metadata?.display_name || auth.user.email || '') : '')
        },
        // Estado vivo: recalcula maxes do HP/Mana (preservando o atual) e mantém o resto.
        vitals: mergedVitals,
        statuses: (existing && Array.isArray(existing.statuses)) ? existing.statuses : [],
        inventory: (existing && Array.isArray(existing.inventory)) ? existing.inventory : [],
        spells: (existing && Array.isArray(existing.spells)) ? existing.spells : []
      };

      submitBtn.disabled = true;
      const originalLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Salvando…</span>';

      let uploadedPath = '';
      const oldPathsToRemove = [];
      try {
        const file = banner.getFile();
        const currentDataUrl = banner.getDataUrl();
        let image = existing?.image || '';
        let imagePath = existing?.imagePath || '';

        if (file) {
          const up = await uploadBanner(file, `characters/${auth.user.id}/portrait`);
          uploadedPath = up.path;
          if (existing?.imagePath) oldPathsToRemove.push(existing.imagePath);
          image = up.url;
          imagePath = up.path;
        } else if (editing && !currentDataUrl && existing?.image) {
          if (existing.imagePath) oldPathsToRemove.push(existing.imagePath);
          image = '';
          imagePath = '';
        }

        let saved;
        if (editing) {
          saved = await updateCharacter({ ...existing, ...data, image, imagePath });
          const i = CHARACTERS.findIndex((x) => x.id === editId);
          if (i >= 0) CHARACTERS[i] = saved; else CHARACTERS.unshift(saved);
        } else {
          saved = await persistCharacter({ ...data, image, imagePath, mesaId: characterFormMesaId || '' });
          CHARACTERS.unshift(saved);
        }

        for (const p of oldPathsToRemove) await removeBanner(p);
        location.hash = `${characterBase(saved)}/${encodeURIComponent(saved.id)}`;
        render(true);
      } catch (err) {
        console.error(err);
        toast('Erro ao salvar ficha: ' + (err.message || err));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
        if (uploadedPath) await removeBanner(uploadedPath);
      }
    });
  }

  function attachCharacterDeleteHandlers() {
    document.querySelectorAll('[data-delete-character]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const c = characterById(btn.dataset.deleteCharacter);
        if (!c) return;
        if (!(await askConfirm(`Apagar a ficha "${c.name}"? Esta ação não pode ser desfeita.`, { confirmLabel: 'Apagar', danger: true }))) return;
        if (!sb) { toast('Supabase não configurado.'); return; }
        btn.disabled = true;
        try {
          await deleteCharacter(c);
          const i = CHARACTERS.indexOf(c);
          if (i >= 0) CHARACTERS.splice(i, 1);
          location.hash = characterBase(c);
        } catch (err) {
          console.error(err);
          toast('Erro ao apagar ficha: ' + (err.message || err));
          btn.disabled = false;
        }
      });
    });
  }

  /* ── FICHA VIVA: handlers (HP, status, inventário, magias) ── */
  function attachCharacterSheet() {
    const root = document.getElementById('charSheet');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';
    const c = characterById(root.dataset.charId);
    if (!c) return;

    // Abas (sempre ativas, mesmo para quem só visualiza)
    const tabBar = root.querySelector('.char-tabs');
    if (tabBar) {
      tabBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-tab]');
        if (!btn) return;
        const id = btn.dataset.tab;
        tabBar.querySelectorAll('[data-tab]').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        root.querySelectorAll('.char-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.panel === id));
      });
    }

    // Filtro de busca (inventário / magias) — disponível para todos.
    root.addEventListener('input', (e) => {
      const f = e.target.closest('[data-filter]');
      if (!f) return;
      const scope = f.closest('[data-filter-scope]');
      if (!scope) return;
      const q = normalize(f.value);
      scope.querySelectorAll('[data-filter-item]').forEach((it) => {
        it.style.display = (!q || normalize(it.textContent).includes(q)) ? '' : 'none';
      });
    });

    // Rolagem de teste de resistência — 1d12 + Nd6 (N = dados do atributo). Read-only.
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-save-roll]');
      if (!btn) return;
      const card = btn.closest('[data-roll-scope]');
      const out = card && card.querySelector('[data-save-result]');
      if (!out) return;
      const attr = btn.dataset.saveRoll;
      const nD6 = Math.max(1, parseInt(btn.dataset.saveDice, 10) || 1);
      const roll = rollDicePool(nD6);
      card.querySelectorAll('[data-save-roll]').forEach((r) => r.classList.toggle('is-active', r === btn));
      out.hidden = false;
      out.innerHTML = rollResultHTML(attr, roll, 'Teste');
      out.classList.remove('is-rolling'); void out.offsetWidth; out.classList.add('is-rolling');
    });

    const canEdit = root.dataset.canEdit === '1';
    if (!canEdit) return;
    ensureVitals(c);

    const $ = (id) => document.getElementById(id);
    let saveTimer; let saveErr = false;
    const save = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try { await persistCharacterState(c); }
        catch (err) { console.error(err); if (!saveErr) { saveErr = true; toast('Não foi possível salvar a ficha: ' + (err.message || err)); } }
      }, 400);
    };

    const renderEffects = () => {
      const box = $('charEffects');
      if (box) box.innerHTML = characterEffectsInner(c, true);
    };
    const openEffectEditor = (index) => {
      const box = $('charEffects');
      const list = box && box.querySelector('[data-char-effect-list]');
      if (!list || list.querySelector('[data-char-effect-editor]')) return;
      const effects = characterEffects(c);
      if (index < 0) {
        list.querySelector('.arc-effects__empty')?.remove();
        list.insertAdjacentHTML('beforeend', characterEffectEditorHTML({}, -1));
      } else {
        const card = list.querySelector(`[data-char-effect="${index}"]`);
        if (card) card.outerHTML = characterEffectEditorHTML(effects[index], index);
      }
      list.querySelector('[data-char-effect-editor] [data-char-effect-title]')?.focus();
    };
    const saveEffectEditor = (editor) => {
      const index = Number(editor.dataset.charEffectIndex);
      const title = editor.querySelector('[data-char-effect-title]')?.value.trim() || '';
      const description = editor.querySelector('[data-char-effect-description]')?.value.trim() || '';
      if (!title) {
        editor.querySelector('[data-char-effect-title]')?.focus();
        return;
      }
      const effects = characterEffects(c);
      const effect = {
        symbol: editor.querySelector('[data-char-effect-symbol-value]')?.value || SPELL_EFFECT_SYMBOLS[effects.length % SPELL_EFFECT_SYMBOLS.length],
        title,
        description
      };
      if (index >= 0 && effects[index]) effects[index] = effect;
      else effects.push(effect);
      setCharacterEffects(c, effects);
      renderEffects();
      save();
    };

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-da-roll]');
      if (!btn) return;
      const attr = btn.dataset.daAttr || daAttrOf(c);
      const dice = Math.max(1, parseInt(btn.dataset.daDice, 10) || 1);
      const roll = rollDicePool(dice);
      ensureVitals(c).da = {
        value: roll.total,
        attr,
        dice,
        d6s: roll.d6s,
        destiny: roll.destiny,
        rolledAt: new Date().toISOString()
      };
      root.querySelectorAll('[data-da-total]').forEach((el) => { el.textContent = roll.total; });
      const out = root.querySelector('[data-da-result]');
      if (out) {
        out.hidden = false;
        out.innerHTML = rollResultHTML(attr, roll, 'DA');
        out.classList.remove('is-rolling'); void out.offsetWidth; out.classList.add('is-rolling');
      }
      const label = btn.querySelector('[data-da-roll-label]');
      if (label) label.textContent = 'Rerrolar DA';
      else btn.textContent = 'Rerrolar DA';
      save();
    });

    const readAmt = (row) => {
      const el = row.querySelector('.vrow__amt');
      return Math.max(0, parseInt(el && el.value, 10) || 0);
    };
    const updateVrow = (row, slot, mana) => {
      row.querySelector('[data-cur]').textContent = slot.cur;
      const fill = row.querySelector('[data-fill]');
      fill.style.width = vbarPct(slot.cur, slot.max) + '%';
      if (!mana) {
        row.classList.remove('is-ok', 'is-warn', 'is-low');
        row.classList.add(hpRatioClass(slot.cur, slot.max));
      }
    };

    const addStatus = () => {
      const el = $('charStatus').querySelector('[data-status-input]');
      const v = (el.value || '').trim();
      if (!v) { el.focus(); return; }
      c.statuses.push({ name: v });
      $('charStatus').innerHTML = charStatusInner(c, true);
      $('charStatus').querySelector('[data-status-input]').focus();
      save();
    };
    const renderInv = () => { $('charInventory').innerHTML = charInventoryInner(c, true); refreshDefense(c); };
    const invIdx = (el) => { const row = el.closest('.inv-row'); return row ? Number(row.dataset.idx) : -1; };

    const addCodex = (kind) => {
      const isInv = kind === 'inv';
      const box = isInv ? $('charInventory') : $('charSpells');
      const sel = box.querySelector(isInv ? '[data-inv-select]' : '[data-spell-select]');
      const custom = box.querySelector(isInv ? '[data-inv-custom]' : '[data-spell-custom]');
      let item = null;
      if (sel.value) {
        const e = entryById(sel.value);
        if (e) {
          const fields = e.fields || {};
          item = {
            refId: e.id,
            name: e.title,
            summary: e.summary || '',
            df: isInv ? parseDefense(itemFieldValue(fields, 'DF') || itemFieldValue(fields, 'Defesa Fisica') || itemFieldValue(fields, 'Defesa Física') || itemFieldValue(fields, 'Defesa')) : 0,
            dm: isInv ? parseDefense(itemFieldValue(fields, 'DM') || itemFieldValue(fields, 'Defesa Magica') || itemFieldValue(fields, 'Defesa Mágica')) : 0,
            interference: isInv ? parseDefense(itemFieldValue(fields, 'Interferencia') || itemFieldValue(fields, 'Interferência')) : 0
          };
        }
      } else if ((custom.value || '').trim()) {
        item = { refId: '', name: custom.value.trim(), summary: '', df: 0, dm: 0, interference: 0 };
      }
      if (!item) { custom.focus(); return; }
      if (isInv) {
        const qtyEl = box.querySelector('[data-inv-qty-input]');
        item.qty = Math.max(1, parseInt(qtyEl && qtyEl.value, 10) || 1);
        item.equipped = false;
        c.inventory.push(item);
        renderInv();
      } else {
        delete item.defense;
        delete item.df;
        delete item.dm;
        delete item.interference;
        c.spells.push(item);
        box.innerHTML = charCodexListInner(c, true, 'spell');
      }
      save();
    };

    const focusAdder = (boxId, selKey) => {
      const box = $(boxId); if (!box) return;
      const adder = box.querySelector(`[data-${selKey}-adder]`);
      const field = box.querySelector(`[data-${selKey}-select], [data-${selKey}-custom]`);
      if (adder) adder.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (field) setTimeout(() => field.focus(), 200);
    };

    root.addEventListener('click', async (e) => {
      if (e.target.closest('[data-char-effect-add]')) { openEffectEditor(-1); return; }
      const effectEdit = e.target.closest('[data-char-effect-edit]');
      if (effectEdit) { openEffectEditor(Number(effectEdit.dataset.charEffectEdit)); return; }
      const effectRemove = e.target.closest('[data-char-effect-remove]');
      if (effectRemove) {
        const effects = characterEffects(c);
        effects.splice(Number(effectRemove.dataset.charEffectRemove), 1);
        setCharacterEffects(c, effects);
        renderEffects();
        save();
        return;
      }
      const effectSymbol = e.target.closest('[data-char-effect-symbol]');
      if (effectSymbol) {
        const editor = effectSymbol.closest('[data-char-effect-editor]');
        const symbol = effectSymbol.dataset.charEffectSymbol || '';
        if (!editor || !SPELL_EFFECT_SYMBOLS.includes(symbol)) return;
        editor.querySelectorAll('[data-char-effect-symbol]').forEach((button) => {
          const active = button === effectSymbol;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        const input = editor.querySelector('[data-char-effect-symbol-value]');
        if (input) input.value = symbol;
        return;
      }
      const effectSave = e.target.closest('[data-char-effect-save]');
      if (effectSave) { saveEffectEditor(effectSave.closest('[data-char-effect-editor]')); return; }
      const effectCancel = e.target.closest('[data-char-effect-cancel]');
      if (effectCancel) { renderEffects(); return; }

      if (e.target.closest('[data-inv-focus]')) { focusAdder('charInventory', 'inv'); return; }
      if (e.target.closest('[data-spell-focus]')) { focusAdder('charSpells', 'spell'); return; }
      const hpBtn = e.target.closest('[data-hp]');
      if (hpBtn) {
        const row = hpBtn.closest('[data-part]');
        const amt = readAmt(row); if (!amt) return;
        const slot = c.vitals.hp[row.dataset.part]; if (!slot) return;
        slot.cur = hpBtn.dataset.hp === 'dmg' ? Math.max(0, slot.cur - amt) : Math.min(slot.max, slot.cur + amt);
        updateVrow(row, slot, false); refreshCharacterVitals(c); save(); return;
      }
      const manaBtn = e.target.closest('[data-mana-act]');
      if (manaBtn) {
        const row = manaBtn.closest('[data-mana]');
        const amt = readAmt(row); if (!amt) return;
        const m = c.vitals.mana; if (!m) return;
        m.cur = manaBtn.dataset.manaAct === 'spend' ? Math.max(0, m.cur - amt) : Math.min(m.max, m.cur + amt);
        updateVrow(row, m, true);
        refreshCharacterVitals(c);
        if (syncArcaneCollapse(c) && $('charStatus')) $('charStatus').innerHTML = charStatusInner(c, true);
        save(); return;
      }
      const sRemove = e.target.closest('[data-status-remove]');
      if (sRemove) { c.statuses.splice(Number(sRemove.dataset.statusRemove), 1); $('charStatus').innerHTML = charStatusInner(c, true); save(); return; }
      if (e.target.closest('[data-status-add]')) { addStatus(); return; }

      // Inventário (mochila / equipado)
      const invQty = e.target.closest('[data-inv-qty]');
      if (invQty) { const it = c.inventory[invIdx(invQty)]; if (it) { it.qty = Math.max(1, (it.qty || 1) + Number(invQty.dataset.invQty)); renderInv(); save(); } return; }
      if (e.target.closest('[data-inv-equip]')) {
        const it = c.inventory[invIdx(e.target)];
        if (it) {
          it.equipped = true; renderInv(); save();
        }
        return;
      }
      if (e.target.closest('[data-inv-unequip]')) { const it = c.inventory[invIdx(e.target)]; if (it) { it.equipped = false; renderInv(); save(); } return; }
      const invRemove = e.target.closest('[data-inv-remove]');
      if (invRemove) { const i = invIdx(invRemove); if (i >= 0) { c.inventory.splice(i, 1); renderInv(); save(); } return; }
      if (e.target.closest('[data-inv-add]')) { addCodex('inv'); return; }

      const spellCast = e.target.closest('[data-spell-cast]');
      if (spellCast) {
        const cost = Math.max(0, parseInt(spellCast.dataset.spellCost, 10) || 0);
        const mana = ensureVitals(c).mana;
        if (!mana || !cost) return;
        if (mana.cur < cost && !(await askConfirm(`Mana insuficiente (${mana.cur}/${mana.max}). Gastar mesmo assim e cair a 0?`, { confirmLabel: 'Gastar mesmo assim', danger: true }))) return;
        mana.cur = Math.max(0, mana.cur - cost);
        if ($('charMana')) $('charMana').innerHTML = charManaInner(c, true);
        if (syncArcaneCollapse(c) && $('charStatus')) $('charStatus').innerHTML = charStatusInner(c, true);
        $('charSpells').innerHTML = charCodexListInner(c, true, 'spell');
        refreshCharacterVitals(c);
        save(); return;
      }
      const spellRemove = e.target.closest('[data-spell-remove]');
      if (spellRemove) { c.spells.splice(Number(spellRemove.dataset.spellRemove), 1); $('charSpells').innerHTML = charCodexListInner(c, true, 'spell'); save(); return; }
      if (e.target.closest('[data-spell-add]')) { addCodex('spell'); return; }
    });

    // Defesa base e defesa por item (inputs numéricos).
    root.addEventListener('input', (e) => {
      if (e.target.matches('[data-df-base]')) {
        ensureVitals(c).df = clampDefLevel(e.target.value);
        refreshDefense(c); save();
      } else if (e.target.matches('[data-dm-base]')) {
        ensureVitals(c).dm = clampDefLevel(e.target.value);
        refreshDefense(c); save();
      } else if (e.target.matches('[data-inv-df]')) {
        const it = c.inventory[invIdx(e.target)];
        if (it) { it.df = clampDefLevel(e.target.value); delete it.defense; refreshDefense(c); save(); }
      } else if (e.target.matches('[data-inv-dm]')) {
        const it = c.inventory[invIdx(e.target)];
        if (it) { it.dm = clampDefLevel(e.target.value); refreshDefense(c); save(); }
      }
    });

    root.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      if (e.target.matches('[data-status-input]')) { e.preventDefault(); addStatus(); }
      else if (e.target.matches('[data-inv-custom]')) { e.preventDefault(); addCodex('inv'); }
      else if (e.target.matches('[data-spell-custom]')) { e.preventDefault(); addCodex('spell'); }
    });
  }

  /* ── EDIT INDEX FORM ──────────────────────────── */
  function attachEditIndexForm() {
    const form = document.getElementById('editIndexForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    const titleInput = document.getElementById('titleInput');
    const summaryInput = document.getElementById('summaryInput');
    const submitBtn = form.querySelector('[type="submit"]');
    const editor = bindEditor();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!sb) {
        toast('Supabase não configurado. Edite assets/js/config.js com sua URL e anon key.');
        return;
      }

      const title = titleInput.value.trim();
      if (!title) {
        titleInput.focus();
        titleInput.classList.add('is-invalid');
        return;
      }
      titleInput.classList.remove('is-invalid');

      const subtitle = summaryInput.value.trim();
      const manifestoHtml = sanitizeHtml(editor.innerHTML).trim();

      submitBtn.disabled = true;
      const originalLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Salvando…</span>';

      try {
        const patch = { title, subtitle, manifestoHtml };
        await persistIndexCustom(patch);
        Object.assign(ARCHIVE.index, patch, { paragraphs: [] });

        if (location.hash === '#/' || location.hash === '') {
          render(true);
        } else {
          location.hash = '#/Arcano';
        }
      } catch (err) {
        console.error(err);
        toast('Erro ao salvar apresentação: ' + (err.message || err));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
      }
    });
  }

  function attachIndexEditButton() {
    document.querySelectorAll('[data-edit-index]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        location.hash = '#/Index/editar';
      });
    });
  }

  function attachHomeParallax() {
    if (sb && !auth.canRead) return;
    const hero = document.querySelector('[data-home-parallax]');
    if (hero) window.ArcanoAuthExperience?.mount(hero);
  }

  /* ── NAVEGAÇÃO DO GRIMÓRIO ───────────────────── */
  function attachSpellPageTurns() {
    document.querySelectorAll('[data-spell-page-turn]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const targetHash = btn.dataset.targetHash;
        const dir = btn.dataset.spellPageTurn === 'prev' ? 'prev' : 'next';
        const book = btn.closest('.spell-book-open');
        if (!targetHash || !book) return;
        if (book.classList.contains('is-page-turning')) return;
        book.classList.add('is-page-turning', `is-page-turning--${dir}`);
        try { sessionStorage.setItem('arcanoSpellPageTurn', dir); } catch {}
        setTimeout(() => { location.hash = targetHash; }, 520);
      });
    });

    if (document.body.dataset.spellPageKeysBound) return;
    document.body.dataset.spellPageKeysBound = '1';
    document.addEventListener('keydown', (event) => {
      const tag = String(event.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.target?.isContentEditable) return;
      const book = document.querySelector('.spell-book-open');
      if (!book || book.classList.contains('is-page-turning')) return;
      const selector = event.key === 'ArrowRight'
        ? '[data-spell-page-turn="next"]'
        : (event.key === 'ArrowLeft' ? '[data-spell-page-turn="prev"]' : '');
      if (!selector) return;
      const btn = book.querySelector(selector);
      if (!btn) return;
      event.preventDefault();
      btn.click();
    });
  }

  function attachDeleteHandlers() {
    document.querySelectorAll('[data-delete-entry]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        const id = btn.dataset.deleteEntry;
        const e = entryById(id);
        if (!e) return;
        if (!(await askConfirm(`Apagar "${e.title}"? Esta ação não pode ser desfeita.`, { confirmLabel: 'Apagar', danger: true }))) return;
        if (!sb) {
          toast('Supabase não configurado.');
          return;
        }
        btn.disabled = true;
        try {
          await deleteUserEntry(e);
          const i = ARCHIVE.entries.indexOf(e);
          if (i >= 0) ARCHIVE.entries.splice(i, 1);
          location.hash = `#/${e.tab}`;
        } catch (err) {
          console.error(err);
          toast('Erro ao apagar: ' + (err.message || err));
          btn.disabled = false;
        }
      });
    });
  }

  /* ── GLOBAL SEARCH ────────────────────────────── */
  let globalSearchRequest = 0;

  async function performGlobalSearch(q) {
    const request = ++globalSearchRequest;
    const query = normalize(q);
    if (!query || query.length < 2) {
      searchResults.hidden = true;
      return;
    }
    if (auth.canRead && sb) await loadSearchCorpus();
    if (request !== globalSearchRequest) return;
    const matches = ARCHIVE.entries.filter((e) => {
      const tagText = sanitizeTags(e.tags).map((tag) => tag.label).join(' ');
      const hay = [e.title, e.summary, tagText, ...(e.body || []), e.bodyHtml || '', ...fieldSearchValues(e.fields || {})].join(' ');
      return normalize(hay).includes(query);
    }).slice(0, 8);

    if (matches.length === 0) {
      searchResults.innerHTML = `<div class="search-results__inner"><div class="search-empty">Nada encontrado para "<strong>${escapeHtml(q)}</strong>"</div></div>`;
      searchResults.hidden = false;
      return;
    }

    searchResults.innerHTML = `
      <div class="search-results__inner">
        <div class="search-results__head">
          <span>${matches.length} resultado(s)</span>
          <kbd>esc</kbd>
        </div>
        <ul>
          ${matches.map((e) => {
            const theme = themeOf(e.tab);
            return `
              <li>
                <a href="#/${e.tab}/${e.id}" data-search-result style="--hue:${theme.hue}">
                  <span class="search-result__icon">${iconOf(e.tab)}</span>
                  <span class="search-result__body">
                    <strong>${escapeHtml(e.title)}</strong>
                    <span>${escapeHtml(e.summary || '')}</span>
                  </span>
                  <span class="search-result__cat">${escapeHtml(theme.label)}</span>
                </a>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
    searchResults.hidden = false;
  }

  /* ── EVENT BINDINGS ───────────────────────────── */
  let sidebarAutoCloseTimer = null;

  function clearSidebarAutoClose() {
    if (sidebarAutoCloseTimer) clearTimeout(sidebarAutoCloseTimer);
    sidebarAutoCloseTimer = null;
  }

  function closeSidebar() {
    clearSidebarAutoClose();
    appShell.classList.remove('is-menu-open');
    document.body.classList.remove('is-overlay-open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }

  function scheduleSidebarAutoClose(delay = 7200) {
    clearSidebarAutoClose();
    if (!appShell.classList.contains('is-menu-open')) return;
    sidebarAutoCloseTimer = setTimeout(closeSidebar, delay);
  }

  function openSidebar() {
    appShell.classList.add('is-menu-open');
    document.body.classList.add('is-overlay-open');
    menuBtn?.setAttribute('aria-expanded', 'true');
    scheduleSidebarAutoClose();
  }

  function toggleSidebar() {
    if (appShell.classList.contains('is-menu-open')) closeSidebar();
    else openSidebar();
  }

  function bindEvents() {
    window.addEventListener('hashchange', () => {
      closeSidebar();
      render();
    });

    menuBtn.addEventListener('click', toggleSidebar);

    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', closeSidebar);
    }

    const sidenav = document.getElementById('sidenav');
    if (sidenav) {
      sidenav.addEventListener('click', (e) => {
        const groupToggle = e.target.closest('.sidenav__group-toggle');
        if (groupToggle) {
          const group = groupToggle.closest('.sidenav__group');
          const opening = !group.classList.contains('is-open');
          sidenav.querySelectorAll('.sidenav__group').forEach((item) => {
            const active = item === group && opening;
            item.classList.toggle('is-open', active);
            item.querySelector('.sidenav__group-toggle')?.setAttribute('aria-expanded', String(active));
            const subnav = item.querySelector('.sidenav__subnav');
            if (subnav) subnav.hidden = !active;
          });
          scheduleSidebarAutoClose();
          return;
        }

        if (e.target.closest('.sidenav__item')) {
          closeSidebar();
        }
      });
      sidenav.addEventListener('pointerenter', () => scheduleSidebarAutoClose(11000));
      sidenav.addEventListener('pointerleave', () => scheduleSidebarAutoClose(4200));
      sidenav.addEventListener('focusin', () => scheduleSidebarAutoClose(10000));
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && appShell.classList.contains('is-menu-open')) closeSidebar();
    });

    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearch = document.getElementById('mobileSearch');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchClose = document.getElementById('mobileSearchClose');

    if (mobileSearchBtn && mobileSearch) {
      mobileSearchBtn.addEventListener('click', () => {
        const opening = !mobileSearch.classList.contains('is-open');
        mobileSearch.classList.toggle('is-open');
        mobileSearch.setAttribute('aria-hidden', String(!opening));
        if (opening && mobileSearchInput) {
          setTimeout(() => mobileSearchInput.focus(), 60);
        }
      });
    }

    if (mobileSearchClose && mobileSearch) {
      mobileSearchClose.addEventListener('click', () => {
        mobileSearch.classList.remove('is-open');
        mobileSearch.setAttribute('aria-hidden', 'true');
        if (mobileSearchInput) {
          mobileSearchInput.value = '';
          const sr = document.getElementById('searchResults');
          if (sr) sr.hidden = true;
        }
      });
    }

    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => {
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
          globalSearch.value = e.target.value;
          globalSearch.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      mobileSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          mobileSearch.classList.remove('is-open');
          mobileSearch.setAttribute('aria-hidden', 'true');
          mobileSearchInput.value = '';
        }
      });
    }

    let st;
    globalSearch.addEventListener('input', (e) => {
      clearTimeout(st);
      st = setTimeout(() => performGlobalSearch(e.target.value), 110);
    });
    globalSearch.addEventListener('focus', () => {
      if (globalSearch.value.length >= 2) performGlobalSearch(globalSearch.value);
    });
    globalSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        globalSearch.value = '';
        searchResults.hidden = true;
        globalSearch.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchResults.contains(e.target) && e.target !== globalSearch) {
        searchResults.hidden = true;
      }
      if (e.target.closest('[data-search-result]')) {
        searchResults.hidden = true;
        globalSearch.value = '';
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== globalSearch && !e.metaKey && !e.ctrlKey) {
        const tag = document.activeElement && document.activeElement.tagName;
        const editable = document.activeElement && document.activeElement.isContentEditable;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !editable) {
          e.preventDefault();
          globalSearch.focus();
        }
      }
    });
  }

  /* ── BACKUP DO CODEX (somente Mestre) ─────────── */
  async function fetchAllRows(table, orderBy) {
    const rows = [];
    const size = 500;
    for (let from = 0; ; from += size) {
      const { data, error } = await sb.from(table).select('*').order(orderBy, { ascending: true }).range(from, from + size - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < size) break;
    }
    return rows;
  }

  function markdownFromHtml(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    const walk = (node) => {
      if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ');
      if (node.nodeType !== 1) return '';
      const inner = () => [...node.childNodes].map(walk).join('');
      switch (node.tagName.toLowerCase()) {
        case 'h1': case 'h2': return `\n\n#### ${inner().trim()}\n\n`;
        case 'h3': case 'h4': return `\n\n##### ${inner().trim()}\n\n`;
        case 'p': case 'div': return `\n\n${inner().trim()}\n\n`;
        case 'br': return '\n';
        case 'strong': case 'b': return `**${inner().trim()}**`;
        case 'em': case 'i': return `*${inner().trim()}*`;
        case 's': case 'strike': case 'del': return `~~${inner().trim()}~~`;
        case 'code': return `\`${inner()}\``;
        case 'hr': return '\n\n---\n\n';
        case 'blockquote': return `\n\n${inner().trim().split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
        case 'ul': return `\n\n${[...node.children].map((li) => `- ${walk(li).trim()}`).join('\n')}\n\n`;
        case 'ol': return `\n\n${[...node.children].map((li, i) => `${i + 1}. ${walk(li).trim()}`).join('\n')}\n\n`;
        case 'a': return `[${inner().trim()}](${node.getAttribute('href') || ''})`;
        case 'img': return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
        case 'script': case 'style': return '';
        default: return inner();
      }
    };
    return walk(doc.body).replace(/\n{3,}/g, '\n\n').trim();
  }

  function downloadText(filename, text, mime) {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function exportBackup(kind) {
    if (!sb || !auth.isAdmin) return;
    toast('Preparando o backup…', 'info');
    try {
      const [stories, index, characters] = await Promise.all([
        fetchAllRows('stories', 'created_at'),
        fetchAllRows('index_config', 'id'),
        fetchAllRows('characters', 'created_at')
      ]);
      const stamp = new Date().toISOString().slice(0, 10);
      if (kind === 'markdown') {
        const byTab = new Map();
        stories.forEach((row) => {
          if (!byTab.has(row.tab)) byTab.set(row.tab, []);
          byTab.get(row.tab).push(row);
        });
        const parts = [`# O Arcano — Codex\n\nExportado em ${new Date().toLocaleString('pt-BR')} · ${stories.length} entradas · ${characters.length} fichas`];
        [...byTab.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).forEach(([tab, rows]) => {
          parts.push(`\n\n---\n\n## ${tab}`);
          rows.forEach((row) => {
            const tags = Array.isArray(row.tags) ? row.tags.map((t) => (typeof t === 'string' ? t : t?.label)).filter(Boolean) : [];
            const fields = row.fields && typeof row.fields === 'object' ? Object.entries(row.fields).filter(([, v]) => v !== '' && v != null && typeof v !== 'object') : [];
            parts.push(`\n\n### ${row.title || row.id}`);
            if (tags.length) parts.push(`\n*Tags: ${tags.join(', ')}*`);
            if (row.summary) parts.push(`\n\n> ${String(row.summary).replace(/\n/g, ' ')}`);
            if (fields.length) parts.push('\n\n' + fields.map(([k, v]) => `- **${k}:** ${String(v).replace(/\n/g, ' ')}`).join('\n'));
            const body = markdownFromHtml(row.body_html);
            if (body) parts.push(`\n\n${body}`);
          });
        });
        downloadText(`arcano-codex-${stamp}.md`, parts.join('\n') + '\n', 'text/markdown');
      } else {
        const payload = { app: 'o-arcano', version: 1, exportedAt: new Date().toISOString(), counts: { stories: stories.length, characters: characters.length }, stories, index_config: index, characters };
        downloadText(`arcano-backup-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json');
      }
      toast(`Backup salvo: ${stories.length} entradas e ${characters.length} fichas.`, 'info');
    } catch (err) {
      console.error(err);
      toast('Erro ao gerar o backup: ' + (err.message || err));
    }
  }

  function attachBackupButtons() {
    document.querySelectorAll('[data-backup]').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await exportBackup(btn.dataset.backup);
        btn.disabled = false;
      });
    });
  }

  /* ── ERROS INESPERADOS ────────────────────────── */
  let lastCrashToast = 0;
  function reportUnexpected(error) {
    console.error('[O Arcano] erro inesperado:', error);
    const now = Date.now();
    if (now - lastCrashToast < 60000) return;
    lastCrashToast = now;
    toast('Algo deu errado nesta tela. Se continuar, recarregue a página.', 'error');
  }
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) return; // falha de imagem/script: já tratada nos próprios elementos
    reportUnexpected(event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => reportUnexpected(event.reason));

  /* ── INIT ─────────────────────────────────────── */
  async function init() {
    bindEvents();
    bindCombatForms();

    const topbar = document.querySelector('.topbar');
    window.addEventListener('scroll', () => {
      topbar.classList.toggle('is-scrolled', window.scrollY > 12);
    }, { passive: true });

    if (intro && !document.documentElement.classList.contains('skip-intro')) {
      try { sessionStorage.setItem('arcano-intro-seen', '1'); } catch (_) { /* sem storage */ }
      setTimeout(() => intro.classList.add('is-gone'), 2200);
    } else if (intro) {
      intro.style.display = 'none';
    }

    if (!sb) {
      // Sem Supabase: roda offline com defaults
      render();
      return;
    }

    // Verificar sessão existente
    const { data: { session } } = await sb.auth.getSession();
    setAuthState(session);

    if (!auth.user) {
      ensureAuthGate();
      render();  // renderiza atrás do gate
      return;
    }

    await loadAccessProfile();
    if (!auth.canRead) {
      ensureAuthGate();
      render();
      return;
    }

    // Logado: carrega dados e renderiza
    try {
      await Promise.all([loadIndexCustom(), loadUserEntries()]);
    } catch (err) {
      console.error('Erro ao sincronizar com Supabase:', err);
    }
    renderRoleBadge();
    render(true);

    // Reagir a logout em outras abas
    sb.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT' && auth.user) {
        location.reload();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
