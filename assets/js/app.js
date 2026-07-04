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
  const CREATABLE_TABS = ['Cenarios', 'Eras', 'Sistemas', 'Mapa', 'Deuses', 'Historias', 'Itens', 'Racas', 'Bestiario', 'Magias'];
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

  const TIER_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const DURATION_OPTIONS = ['1 turno', '2 turnos', '3 turnos', '4 turnos', '5 turnos', '6 turnos', '7 turnos', '8 turnos', '9 turnos', '10 turnos', 'instantâneo', 'concentração'];
  const ACTIVATION_OPTIONS = ['Sempre ativa', 'Ao receber dano', 'Ao iniciar combate', 'Quando HP < X%', 'Manual (custo MP)'];

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
  const COST_UNITS = ['MP', 'HP', 'Vigor'];

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
    const unit = f['CustoUnidade'] || 'MP';
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
        <div class="spell-effect-card__sigil" aria-hidden="true">${escapeHtml(draft.symbol)}</div>
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

  const EMPTY_SPELL_FILTERS = { type: '', affinity: '', tier: '' };
  function normalizeSpellFilters(filters) {
    const src = filters || {};
    const type = isSpellType(src.type) ? src.type : '';
    const affinity = SPELL_AFFINITY_KEYS.includes(src.affinity) ? src.affinity : '';
    const tier = TIER_OPTIONS.includes(src.tier) ? src.tier : '';
    return { type, affinity, tier };
  }
  function hasSpellFilters(filters) {
    const f = normalizeSpellFilters(filters);
    return !!(f.type || f.affinity || f.tier);
  }
  function spellFilterStats(entries) {
    const types = SPELL_TYPE_KEYS.map((key) => ({ key, label: SPELL_TYPES[key].label, count: 0 }));
    const affinities = SPELL_AFFINITY_KEYS.map((key) => ({ key, label: SPELL_AFFINITIES[key].label, count: 0, meta: SPELL_AFFINITIES[key] }));
    const tiers = TIER_OPTIONS.map((key) => ({ key, label: key, count: 0 }));
    const byType = Object.fromEntries(types.map((row) => [row.key, row]));
    const byAffinity = Object.fromEntries(affinities.map((row) => [row.key, row]));
    const byTier = Object.fromEntries(tiers.map((row) => [row.key, row]));

    entries.forEach((entry) => {
      const fields = entry.fields || {};
      const type = isSpellType(entry.subtype) ? entry.subtype : 'ativa';
      if (byType[type]) byType[type].count += 1;
      if (byAffinity[fields['Afinidade']]) byAffinity[fields['Afinidade']].count += 1;
      if (byTier[fields['Tier']]) byTier[fields['Tier']].count += 1;
    });

    return {
      types: types.filter((row) => row.count > 0),
      affinities: affinities.filter((row) => row.count > 0),
      tiers: tiers.filter((row) => row.count > 0)
    };
  }
  function spellCategoryFiltersHTML(entries, filters) {
    const active = normalizeSpellFilters(filters);
    const stats = spellFilterStats(entries);
    if (!stats.types.length && !stats.affinities.length && !stats.tiers.length) return '';

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
      <section class="spell-filter-panel" aria-label="Filtros de magia">
        <div class="spell-filter-panel__head">
          <span>Refinar grimório</span>
          ${hasSpellFilters(active) ? '<button type="button" class="spell-filter-reset" data-spell-filter-reset>Limpar filtros</button>' : ''}
        </div>
        ${group('Tipo', 'type', stats.types, (row) => `<span>${escapeHtml(SPELL_TYPES[row.key].badge)}</span>`)}
        ${group('Afinidade', 'affinity', stats.affinities, (row) => `<span class="spell-filter-chip__icon">${row.meta.icon}</span><span>${escapeHtml(row.label)}</span>`)}
        ${group('Tier', 'tier', stats.tiers, (row) => `<span class="tier-roman">${escapeHtml(row.label)}</span>`)}
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

  /* Estrutura do dossie de Racas (3 secoes). */
  const RACE_HP_PARTS = ['Cabeça', 'Peito', 'Abdômen', 'Braço Direito', 'Braço Esquerdo', 'Perna Direita', 'Perna Esquerda'];
  const RACE_SECTIONS = [
    {
      id: 'surgimento',
      title: 'Surgimento',
      fields: [
        { key: 'Raridade', type: 'rarity', promoted: true },
        { key: 'Modificador', type: 'text', placeholder: 'Ex.: +1 Força, -1 Destreza' },
        { key: 'Origem', type: 'text', placeholder: 'Ex.: Continente Norte' },
        { key: 'Ponto forte', type: 'text', placeholder: 'Resistência ao frio…' },
        { key: 'Ponto fraco', type: 'text', placeholder: 'Vulnerável ao fogo…' }
      ]
    },
    {
      id: 'biologia',
      title: 'Biologia',
      fields: [
        { key: 'Talento racial', type: 'text', placeholder: 'Talento que define a raça' },
        { key: 'Passivas', type: 'list', placeholder: 'Digite uma passiva e Enter…' },
        { key: 'Penalidade', type: 'text', placeholder: 'Limitação inata' }
      ]
    },
    {
      id: 'hpmp',
      title: 'HP / MP Base',
      fields: [
        ...RACE_HP_PARTS.map((p) => ({ key: p, type: 'hp', default: defaultHpFor(p) })),
        { key: 'Mana', type: 'mana', default: '15/15' }
      ]
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

  const BEAST_VITALS = ['Defesa'];
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
      title: 'Vitalidade',
      view: 'vitals',
      fields: [
        { key: 'PartesHP', type: 'hpParts' },
        { key: 'Defesa', type: 'text', default: '12' },
        { key: 'Mana', type: 'mana', default: '', placeholder: 'Opcional — ex.: 30/30' }
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
  const BEAST_ABILITY_KINDS = ['Ativa', 'Passiva'];

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

  function beastAttrMod(score) {
    return Math.floor((Number(score || CHAR_ATTR_BASE) - CHAR_ATTR_BASE) / 2);
  }

  function defaultBeastHpParts() {
    return RACE_HP_PARTS.map((name) => ({ name, hp: defaultHpFor(name) }));
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
    return key === 'passiva' ? 'Passiva' : 'Ativa';
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
          summary: String((fromMagic && fromMagic.summary) || ability.summary || '').trim()
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
  function attrDiceForScore(score, raceMod = 0) {
    const baseDice = Math.floor((Number(score || CHAR_ATTR_BASE) - CHAR_ATTR_BASE) / 2) + 1;
    return Math.max(1, baseDice + Number(raceMod || 0));
  }
  const fmtDice = (n) => `${Math.max(1, Number(n) || 1)}d6`;
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
  const ADMIN_EMAIL = cfg.adminEmail || 'admin@arcano.local';
  const PLAYER_EMAIL = cfg.playerEmail || 'jogador@arcano.local';

  /* ── AUTH STATE ───────────────────────────────── */
  const auth = {
    user: null,
    role: null,
    profile: null,
    status: null,
    requestedRole: null,
    approvedRole: null,
    canRead: false,
    isAdmin: false,
    isPlayer: false
  };

  function setAuthState(session) {
    if (session && session.user) {
      auth.user = session.user;
      auth.role = null;
      auth.profile = null;
      auth.status = null;
      auth.requestedRole = session.user.user_metadata?.requested_role || null;
      auth.approvedRole = null;
      auth.canRead = false;
      auth.isAdmin = false;
      auth.isPlayer = false;
    } else {
      auth.user = null;
      auth.role = null;
      auth.profile = null;
      auth.status = null;
      auth.requestedRole = null;
      auth.approvedRole = null;
      auth.canRead = false;
      auth.isAdmin = false;
      auth.isPlayer = false;
    }
    document.body.classList.toggle('is-locked', !auth.canRead);
    document.body.classList.toggle('is-admin', auth.isAdmin);
    document.body.classList.toggle('is-player', auth.isPlayer);
  }

  function roleLabel(role) {
    return role === 'admin' ? 'Mestre' : 'Jogador';
  }

  function applyAccessProfile(profile) {
    auth.profile = profile || null;

    const requestedRole = profile?.requested_role || auth.user?.user_metadata?.requested_role || 'player';
    const status = profile?.status || 'pending';
    const approvedRole = status === 'approved' ? profile?.approved_role : null;

    auth.status = status;
    auth.requestedRole = requestedRole;
    auth.approvedRole = approvedRole;
    auth.role = approvedRole || status;
    auth.isAdmin = approvedRole === 'admin';
    auth.isPlayer = approvedRole === 'player';
    auth.canRead = auth.isAdmin || auth.isPlayer;

    document.body.classList.toggle('is-locked', !auth.canRead);
    document.body.classList.toggle('is-admin', auth.isAdmin);
    document.body.classList.toggle('is-player', auth.isPlayer);
  }

  async function loadAccessProfile() {
    if (!sb || !auth.user) return null;
    const { data, error } = await sb
      .from('access_requests')
      .select('user_id,email,display_name,requested_role,approved_role,status')
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

  /* ── AUTH GATE (tela de login) ────────────────── */
  function ensureLegacyAuthGate() {
    let gate = document.getElementById('authGate');
    if (gate) return gate;
    gate = document.createElement('div');
    gate.id = 'authGate';
    gate.className = 'auth-gate';
    gate.innerHTML = `
      <div class="auth-gate__bg" aria-hidden="true"></div>
      <div class="auth-gate__card">
        <div class="auth-gate__brand">
          <img src="assets/images/Logo.png" alt="">
          <h1>O Arcano</h1>
          <p>Codex de campanha · acesso restrito</p>
        </div>

        <div class="auth-gate__roles" role="tablist">
          <button type="button" class="auth-role is-active" data-role="player" role="tab">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
            <span>Jogador</span>
          </button>
          <button type="button" class="auth-role" data-role="admin" role="tab">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/><path d="M9 12l2 2 4-4"/></svg>
            <span>Mestre</span>
          </button>
        </div>

        <form class="auth-gate__form" id="authForm" novalidate>
          <label class="auth-gate__label">
            <span>Senha</span>
            <input type="password" id="authPassword" placeholder="Digite a senha" autocomplete="current-password" required>
          </label>
          <button type="submit" class="btn btn-primary auth-gate__submit" id="authSubmit">
            <span>Entrar</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <p class="auth-gate__error" id="authError" role="alert"></p>
        </form>
      </div>
    `;
    document.body.appendChild(gate);

    const roles = gate.querySelectorAll('.auth-role');
    roles.forEach((b) => {
      b.addEventListener('click', () => {
        roles.forEach((x) => x.classList.toggle('is-active', x === b));
      });
    });

    const form = gate.querySelector('#authForm');
    const passInput = gate.querySelector('#authPassword');
    const errEl = gate.querySelector('#authError');
    const submitBtn = gate.querySelector('#authSubmit');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errEl.textContent = '';
      const role = gate.querySelector('.auth-role.is-active').dataset.role;
      const email = role === 'admin' ? ADMIN_EMAIL : PLAYER_EMAIL;
      const password = passInput.value;
      if (!password) {
        errEl.textContent = 'Informe a senha.';
        return;
      }
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Entrando…';
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthState(data.session);
        gate.classList.add('is-gone');
        setTimeout(() => gate.remove(), 500);
        await Promise.all([loadIndexCustom(), loadUserEntries(), loadMasterPalette(), loadCharacters()]);
        renderRoleBadge();
        render(true);
      } catch (err) {
        console.error(err);
        errEl.textContent = 'Senha incorreta ou sessão indisponível.';
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Entrar';
      }
    });

    return gate;
  }

  /* ── LOGOUT + ROLE BADGE ──────────────────────── */
  function ensureAuthGate() {
    let gate = document.getElementById('authGate');
    if (gate) return gate;

    gate = document.createElement('div');
    gate.id = 'authGate';
    gate.className = 'auth-gate';
    gate.innerHTML = `
      <div class="auth-gate__bg" aria-hidden="true"></div>
      <div class="auth-gate__card">
        <div class="auth-gate__brand">
          <img src="assets/images/Logo.png" alt="">
          <h1>O Arcano</h1>
          <p>Codex de campanha &middot; acesso restrito</p>
        </div>

        <div class="auth-gate__modes" role="tablist">
          <button type="button" class="auth-mode is-active" data-auth-mode="login" role="tab">Entrar</button>
          <button type="button" class="auth-mode" data-auth-mode="request" role="tab">Solicitar acesso</button>
        </div>

        <form class="auth-gate__form" id="authLoginForm" data-auth-panel="login" novalidate>
          <label class="auth-gate__label">
            <span>E-mail</span>
            <input type="email" id="authEmail" placeholder="seu@email.com" autocomplete="email" required>
          </label>
          <label class="auth-gate__label">
            <span>Senha</span>
            <input type="password" id="authPassword" placeholder="Digite sua senha" autocomplete="current-password" required>
          </label>
          <button type="submit" class="btn btn-primary auth-gate__submit" id="authSubmit">
            <span>Entrar</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <p class="auth-gate__error" data-auth-error role="alert"></p>
        </form>

        <form class="auth-gate__form" id="authRequestForm" data-auth-panel="request" novalidate hidden>
          <label class="auth-gate__label">
            <span>Nome</span>
            <input type="text" id="requestName" placeholder="Como voce quer aparecer" autocomplete="name" maxlength="80" required>
          </label>
          <label class="auth-gate__label">
            <span>E-mail</span>
            <input type="email" id="requestEmail" placeholder="seu@email.com" autocomplete="email" required>
          </label>
          <label class="auth-gate__label">
            <span>Senha</span>
            <input type="password" id="requestPassword" placeholder="Crie uma senha" autocomplete="new-password" minlength="6" required>
          </label>
          <div class="auth-gate__label">
            <span>Acesso desejado</span>
            <div class="auth-gate__roles" role="tablist">
              <button type="button" class="auth-role is-active" data-role="player" role="tab">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
                <span>Jogador</span>
              </button>
              <button type="button" class="auth-role" data-role="admin" role="tab">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/><path d="M9 12l2 2 4-4"/></svg>
                <span>Mestre</span>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary auth-gate__submit" id="requestSubmit">
            <span>Enviar solicitacao</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </button>
          <p class="auth-gate__error" data-auth-error role="alert"></p>
          <p class="auth-gate__message" data-auth-message></p>
        </form>
      </div>
    `;
    document.body.appendChild(gate);

    const modes = gate.querySelectorAll('.auth-mode');
    const panels = gate.querySelectorAll('[data-auth-panel]');
    modes.forEach((b) => {
      b.addEventListener('click', () => {
        const mode = b.dataset.authMode;
        modes.forEach((x) => x.classList.toggle('is-active', x === b));
        panels.forEach((p) => { p.hidden = p.dataset.authPanel !== mode; });
      });
    });

    const roles = gate.querySelectorAll('.auth-role');
    roles.forEach((b) => {
      b.addEventListener('click', () => {
        roles.forEach((x) => x.classList.toggle('is-active', x === b));
      });
    });

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
      setTimeout(() => gate.remove(), 500);
      await Promise.all([loadIndexCustom(), loadUserEntries(), loadMasterPalette(), loadCharacters()]);
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
      submitBtn.querySelector('span').textContent = 'Entrando...';
      try {
        const { data, error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await finishLogin(data.session);
      } catch (err) {
        console.error(err);
        loginErr.textContent = 'E-mail ou senha incorretos.';
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Entrar';
      }
    });

    const requestForm = gate.querySelector('#authRequestForm');
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
      const requestedRole = gate.querySelector('.auth-role.is-active').dataset.role;

      if (!displayName || !email || password.length < 6) {
        requestErr.textContent = 'Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.';
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
              display_name: displayName,
              requested_role: requestedRole
            }
          }
        });
        if (error) throw error;

        requestMsg.textContent = `Solicitacao enviada como ${roleLabel(requestedRole)}. Aguarde aprovacao no Supabase.`;
        requestForm.reset();
        roles.forEach((x) => x.classList.toggle('is-active', x.dataset.role === 'player'));

        if (data.session) await finishLogin(data.session);
      } catch (err) {
        console.error(err);
        requestErr.textContent = err.message?.includes('already registered')
          ? 'Esse e-mail ja existe. Use Entrar ou peca para redefinir a senha.'
          : 'Nao foi possivel enviar a solicitacao agora.';
      } finally {
        requestBtn.disabled = false;
        requestBtn.querySelector('span').textContent = 'Enviar solicitacao';
      }
    });

    if (auth.user && !auth.canRead) renderPendingGate(gate);
    return gate;
  }

  function renderPendingGate(gate) {
    const card = gate.querySelector('.auth-gate__card');
    const status = auth.status || 'pending';
    const requested = roleLabel(auth.requestedRole || 'player');
    const title = status === 'rejected' ? 'Acesso recusado' : 'Aguardando aprovacao';
    const text = status === 'rejected'
      ? 'Sua solicitacao foi recusada. Fale com o administrador da campanha.'
      : `Sua conta esta registrada, mas ainda precisa ser aprovada como ${requested}.`;

    card.innerHTML = `
      <div class="auth-gate__brand">
        <img src="assets/images/Logo.png" alt="">
        <h1>O Arcano</h1>
        <p>Codex de campanha &middot; acesso restrito</p>
      </div>
      <div class="auth-pending">
        <span class="auth-pending__status">${escapeHtml(status)}</span>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        <button type="button" class="btn btn-ghost auth-gate__submit" data-pending-logout>Sair</button>
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
    pill.dataset.role = auth.role;
    pill.innerHTML = auth.isAdmin
      ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/></svg><strong>MESTRE</strong>'
      : '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg><strong>JOGADOR</strong>';

    if (!logout) {
      logout = document.createElement('button');
      logout.type = 'button';
      logout.className = 'btn-icon';
      logout.dataset.logout = '1';
      logout.title = 'Sair';
      logout.setAttribute('aria-label', 'Sair');
      logout.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/></svg>';
      logout.addEventListener('click', async () => {
        if (!confirm('Sair da sessão?')) return;
        if (sb) await sb.auth.signOut();
        location.reload();
      });
      right.appendChild(logout);
    }
  }

  /* ── ICONS (inline SVG, lucide-style) ─────────── */
  const ICONS = {
    Index:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-8 9 8M5 10v10h4v-6h6v6h4V10"/></svg>',
    Itens:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6-9 9-3 1 1-3 9-9zM5 20l3-1"/></svg>',
    Magias:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.8 5.6L20 9.4l-4.8 3.6L17 19l-5-3.5L7 19l1.8-6L4 9.4l6.2-1.8L12 2z"/></svg>',
    Bestiario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11c0-3 2-5 5-5s5 2 5 5v3l3 3v3h-4l-2-2-2 2H5l-2-2v-3l2-3z"/><circle cx="9" cy="11" r=".7" fill="currentColor"/><circle cx="13" cy="11" r=".7" fill="currentColor"/></svg>',
    Paises:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4l7-1 7 2v11l-7-2-7 1z"/><line x1="5" y1="21" x2="5" y2="3"/></svg>',
    Cenarios:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l4-3 4 3v3h6l4 3v6"/><path d="M3 21h18M9 21v-6h2v6M15 21v-3h2v3"/></svg>',
    Eras:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    Sistemas:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    Persona:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>',
    Mesa:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/></svg>',
    Historias: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3.5 4.5-3.5S22 18 22 20"/></svg>',
    Racas:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><circle cx="12" cy="17" r="3"/><path d="M7 10v3M17 10v3M9 15l1.5-1M15 15l-1.5-1"/></svg>',
    Mapa:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/><line x1="9" y1="4" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="20"/></svg>',
    Deuses:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.6L21 9.5l-5 4.3 1.4 6.7L12 17l-5.4 3.5L8 13.8l-5-4.3 6.6-.9L12 2z"/></svg>',
  };

  /* ── CATEGORY THEMES ─────────────────────────── */
  const THEMES = {
    Index:     { hue: 268, label: 'INÍCIO' },
    Itens:     { hue: 38,  label: 'ARTEFATOS' },
    Magias:    { hue: 285, label: 'PODER' },
    Bestiario: { hue: 0,   label: 'AMEAÇAS' },
    Paises:    { hue: 220, label: 'TERRITÓRIO' },
    Cenarios:  { hue: 200, label: 'LUGARES' },
    Eras:      { hue: 45,  label: 'TEMPO' },
    Sistemas:  { hue: 160, label: 'REGRAS' },
    Persona:   { hue: 320, label: 'PESSOAS' },
    Mesa:      { hue: 185, label: 'MESA' },
    Historias: { hue: 250, label: 'HISTÓRIAS' },
    Racas:     { hue: 130, label: 'POVOS' },
    Mapa:      { hue: 195, label: 'MUNDO' },
    Deuses:    { hue: 50,  label: 'DIVINO' },
  };

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
  /* Persona conta fichas; Mesa conta tokens; demais abas contam entries. */
  const tabCount = (id) => {
    const tabId = canonicalTabId(id);
    if (tabId === 'Persona') {
      return auth.user ? CHARACTERS.filter((c) => auth.isAdmin || c.userId === auth.user.id).length : 0;
    }
    if (tabId === 'Mesa') return MESA_STATE.tokens.length;
    return entriesIn(id).length;
  };

  const themeOf = (id) => THEMES[canonicalTabId(id)] || { hue: 268, label: 'CODEX' };
  const iconOf = (id) => ICONS[canonicalTabId(id)] || ICONS.Index;
  const TAG_COLOR_RE = /^#[0-9a-f]{6}$/i;
  const DEFAULT_TAG_COLOR = '#f59e0b';
  const categoryState = {};
  const MESA_STORAGE_KEY = 'arcano.mesa.active.v1';
  const MESA_GRID_LIMITS = {
    minW: 6,
    maxW: 36,
    minH: 6,
    maxH: 28,
    minCell: 28,
    maxCell: 64
  };
  const MESA_DEFAULT_COLOR = '#22d3ee';
  const MESA_ACTIVE_ID = 'active';
  let MESA_STATE = normalizeMesaState();
  let mesaSelectedTokenId = '';
  let mesaSyncWarning = '';

  function slugify(str) {
    return normalize(str).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'historia';
  }

  function clampNumber(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function mesaTokenId(prefix = 'tok') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function normalizeMesaToken(token, index = 0, grid = {}) {
    const width = grid.width || 18;
    const height = grid.height || 12;
    const size = clampNumber(token?.size, 1, 4, 1);
    return {
      id: String(token?.id || mesaTokenId()),
      name: String(token?.name || `Token ${index + 1}`).trim().slice(0, 80) || `Token ${index + 1}`,
      refType: String(token?.refType || 'custom'),
      refId: String(token?.refId || ''),
      ownerId: String(token?.ownerId || ''),
      ownerLabel: String(token?.ownerLabel || ''),
      image: String(token?.image || ''),
      color: TAG_COLOR_RE.test(String(token?.color || '')) ? token.color : MESA_DEFAULT_COLOR,
      x: clampNumber(token?.x, 0, Math.max(0, width - size), index % width),
      y: clampNumber(token?.y, 0, Math.max(0, height - size), Math.floor(index / width)),
      size,
      hp: String(token?.hp || '').slice(0, 30),
      note: String(token?.note || '').slice(0, 160),
      hidden: !!token?.hidden,
      locked: !!token?.locked
    };
  }

  function normalizeMesaState(raw = {}) {
    const width = clampNumber(raw.width, MESA_GRID_LIMITS.minW, MESA_GRID_LIMITS.maxW, 18);
    const height = clampNumber(raw.height, MESA_GRID_LIMITS.minH, MESA_GRID_LIMITS.maxH, 12);
    const cellSize = clampNumber(raw.cellSize, MESA_GRID_LIMITS.minCell, MESA_GRID_LIMITS.maxCell, 42);
    const grid = { width, height };
    return {
      id: String(raw.id || MESA_ACTIVE_ID),
      title: String(raw.title || 'Cena ativa').trim().slice(0, 90) || 'Cena ativa',
      width,
      height,
      cellSize,
      background: String(raw.background || '#101421').trim().slice(0, 80) || '#101421',
      showGrid: raw.showGrid !== false,
      allowPlayerMove: raw.allowPlayerMove !== false,
      tokens: Array.isArray(raw.tokens)
        ? raw.tokens.slice(0, 80).map((token, i) => normalizeMesaToken(token, i, grid))
        : [],
      updatedAt: raw.updatedAt || Date.now()
    };
  }

  function loadMesaLocal() {
    try {
      const raw = localStorage.getItem(MESA_STORAGE_KEY);
      return raw ? normalizeMesaState(JSON.parse(raw)) : normalizeMesaState();
    } catch {
      return normalizeMesaState();
    }
  }

  function saveMesaLocal() {
    MESA_STATE.updatedAt = Date.now();
    try {
      localStorage.setItem(MESA_STORAGE_KEY, JSON.stringify(MESA_STATE));
    } catch (err) {
      console.warn('Falha ao salvar Mesa local:', err);
    }
  }

  async function loadMesaState() {
    MESA_STATE = loadMesaLocal();
    mesaSyncWarning = '';
    if (!sb || !auth.canRead) return;
    try {
      const { data, error } = await sb
        .from('battle_grids')
        .select('id,title,state,updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data && data.state) {
        MESA_STATE = normalizeMesaState({ ...data.state, id: data.id || data.state.id, title: data.title || data.state.title });
        saveMesaLocal();
      }
    } catch (err) {
      mesaSyncWarning = 'Mesa em modo local. Rode supabase-battle-grid.sql para sincronizar entre jogadores.';
      console.warn('Mesa sem sincronização Supabase:', err);
    }
  }

  async function saveMesaState() {
    MESA_STATE = normalizeMesaState(MESA_STATE);
    saveMesaLocal();
    if (!sb || !auth.canRead) return;
    try {
      const payload = {
        id: MESA_STATE.id || MESA_ACTIVE_ID,
        title: MESA_STATE.title,
        state: MESA_STATE,
        is_active: true,
        updated_at: new Date().toISOString()
      };
      const { error } = await sb.from('battle_grids').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      mesaSyncWarning = '';
    } catch (err) {
      mesaSyncWarning = 'Mesa salva neste navegador, mas ainda sem sincronização Supabase.';
      console.warn('Falha ao sincronizar Mesa:', err);
    }
  }

  function mesaCanUse() {
    return !sb || auth.canRead;
  }

  function mesaIsMaster() {
    return !sb || auth.isAdmin;
  }

  function mesaCanMove(token) {
    if (!token) return false;
    if (mesaIsMaster()) return true;
    if (token.locked) return false;
    return !!(MESA_STATE.allowPlayerMove && auth.user && token.ownerId === auth.user.id);
  }

  function mesaVisibleTokens() {
    return MESA_STATE.tokens.filter((token) => mesaIsMaster() || !token.hidden || (auth.user && token.ownerId === auth.user.id));
  }

  function mesaTokenById(id) {
    return MESA_STATE.tokens.find((token) => token.id === id) || null;
  }

  function mesaTokenInitials(name) {
    const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] || '?').slice(0, 2)).toUpperCase();
  }

  function mesaPlaceToken(token, x, y) {
    if (!token || !mesaCanMove(token)) return false;
    token.x = clampNumber(x, 0, Math.max(0, MESA_STATE.width - token.size), token.x);
    token.y = clampNumber(y, 0, Math.max(0, MESA_STATE.height - token.size), token.y);
    return true;
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
  function rowToEntry(row) {
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
      isUserCreated: true
    };
  }

  async function loadUserEntries() {
    if (!sb) return;
    const { data, error } = await sb
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao carregar histórias:', error);
      return;
    }
    (data || []).forEach((row) => {
      if (!entryById(row.id)) ARCHIVE.entries.push(rowToEntry(row));
    });
  }

  async function uploadBanner(file, prefix) {
    if (!sb || !file) return { url: '', path: '' };
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${prefix}-${Date.now()}.${ext || 'png'}`;
    const { error } = await sb.storage.from(BANNERS_BUCKET).upload(path, file, {
      contentType: file.type || 'image/png'
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
      identity: safeObj(row.identity),
      // Estado vivo da ficha (supabase-characters-sheet.sql)
      vitals: safeObj(row.vitals),
      statuses: safeArr(row.statuses),
      inventory: safeArr(row.inventory),
      spells: safeArr(row.spells),
      image: row.image || '',
      imagePath: row.image_path || '',
      createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
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
      identity: c.identity || {},
      vitals: c.vitals || {},
      statuses: Array.isArray(c.statuses) ? c.statuses : [],
      inventory: Array.isArray(c.inventory) ? c.inventory : [],
      spells: Array.isArray(c.spells) ? c.spells : [],
      image: c.image || '',
      image_path: c.imagePath || ''
    };
  }

  /* Colunas da ficha interativa — podem nao existir se o SQL nao foi rodado. */
  const SHEET_COLS = ['vitals', 'statuses', 'inventory', 'spells'];
  const SHEET_HINT = 'As colunas da ficha interativa ainda não existem. Rode o arquivo supabase-characters-sheet.sql no SQL Editor do Supabase.';
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
    if (!sb || !auth.user) return;
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
  }

  async function persistCharacter(c) {
    if (!sb) throw new Error('Supabase não configurado');
    const row = characterToRow(c);
    let { data, error } = await sb.from('characters').insert(row).select().single();
    if (error && isMissingSheetCol(error)) {
      // Migração da ficha interativa ainda não rodou: salva sem essas colunas.
      SHEET_COLS.forEach((k) => delete row[k]);
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
      updated_at: new Date().toISOString()
    };
    const { error } = await sb.from('characters').update(payload).eq('id', c.id);
    if (error) {
      if (isMissingSheetCol(error)) throw new Error(SHEET_HINT);
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
  /* Garante c.vitals.hp/mana a partir do HP/Mana da criação (sem persistir). */
  function ensureVitals(c) {
    c.vitals = (c.vitals && typeof c.vitals === 'object' && !Array.isArray(c.vitals)) ? c.vitals : {};
    if (!c.vitals.hp || typeof c.vitals.hp !== 'object') {
      c.vitals.hp = {};
      RACE_HP_PARTS.forEach((p) => {
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
    const out = { hp: {}, mana: null };
    const prevHp = (prev && prev.hp) || {};
    RACE_HP_PARTS.forEach((p) => {
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

  async function loadMasterPalette() {
    if (!sb || !auth.user) return;
    try {
      const { data, error } = await sb
        .from('master_palette')
        .select('colors')
        .eq('user_id', auth.user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows; ignora; outros loga
        if (!/master_palette.*does not exist|relation .*master_palette/i.test(error.message || '')) {
          console.warn('[O Arcano] Falha ao carregar paleta:', error);
        }
        masterPalette.loaded = true;
        return;
      }
      const raw = Array.isArray(data?.colors) ? data.colors : [];
      masterPalette.colors = raw.map((c) => safeTagColor(c)).filter((c, i, arr) => arr.indexOf(c) === i).slice(0, MAX_PALETTE);
      masterPalette.loaded = true;
    } catch (err) {
      console.warn('[O Arcano] Erro paleta:', err);
      masterPalette.loaded = true;
    }
  }

  async function saveMasterPalette(colors) {
    if (!sb || !auth.user) throw new Error('Sessão indisponível');
    const clean = (colors || []).map((c) => safeTagColor(c)).filter((c, i, arr) => arr.indexOf(c) === i).slice(0, MAX_PALETTE);
    const { error } = await sb
      .from('master_palette')
      .upsert({ user_id: auth.user.id, colors: clean, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      if (/master_palette.*does not exist|relation .*master_palette/i.test(error.message || '')) {
        throw new Error('A tabela master_palette ainda não foi criada. Rode o arquivo supabase-master-palette.sql no SQL Editor.');
      }
      throw error;
    }
    masterPalette.colors = clean;
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
  const ALLOWED_TAGS = new Set(['B','STRONG','I','EM','U','S','STRIKE','BR','HR','P','DIV','SPAN','UL','OL','LI','H1','H2','H3','H4','BLOCKQUOTE','CODE','PRE','A']);
  const ALLOWED_ATTRS_BY_TAG = {
    A: new Set(['href','data-arcano-link','data-link-tab','data-link-entry','class']),
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
            } else if (name === 'class') {
              // Permite somente a classe usada por links internos
              const allowed = attr.value.split(/\s+/).filter((c) => c === 'rt-internal-link').join(' ');
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
    sidebarCount.textContent = ARCHIVE.tabs.length;
    sidenav.innerHTML = ARCHIVE.tabs.map((t) => {
      const count = t.id === 'Index' ? '' : `<span class="sidenav__count">${tabCount(t.id)}</span>`;
      const theme = themeOf(t.id);
      return `
        <a href="#/${t.id}" class="sidenav__item ${t.id === active ? 'is-active' : ''}" data-tab="${t.id}" style="--hue:${theme.hue}">
          <span class="sidenav__icon">${iconOf(t.id)}</span>
          <span class="sidenav__label">${escapeHtml(t.title)}</span>
          ${count}
        </a>
      `;
    }).join('');
  }

  /* ── HOME VIEW ────────────────────────────────── */
  function viewHome() {
    const idx = ARCHIVE.index;
    const totalEntries = ARCHIVE.entries.length;
    const totalCategories = ARCHIVE.tabs.length - 1;
    const totalPillars = (idx.pillars || []).length;

    const featured = pickFeatured(4);
    const manifestoMarkup = idx.manifestoHtml
      ? `<div class="rt-content">${sanitizeHtml(idx.manifestoHtml)}</div>`
      : (idx.paragraphs || []).map((p) => `<p>${escapeHtml(p)}</p>`).join('');

    return `
      <section class="hero">
        <div class="hero__bg" style="background-image:url('${idx.image}')"></div>
        <div class="hero__overlay"></div>
        ${auth.isAdmin ? `
          <button type="button" class="hero__edit" data-edit-index aria-label="Editar apresentação">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            <span>Editar apresentação</span>
          </button>
        ` : ''}
        <div class="hero__inner">
          <div class="hero__eyebrow">
            <span class="hero__dot"></span>
            <span>CODEX DE CAMPANHA · DARK FANTASY</span>
          </div>
          <h1 class="hero__title" data-text-reveal>${escapeHtml(idx.title)}</h1>
          <p class="hero__subtitle">${escapeHtml(idx.subtitle)}</p>
          <div class="hero__actions">
            <a href="#/Itens" class="btn btn-primary">
              <span>Explorar arquivos</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <a href="#/Mapa" class="btn btn-ghost">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"/></svg>
              <span>Mapa do mundo</span>
            </a>
          </div>
        </div>
        <div class="hero__scroll" aria-hidden="true">
          <span>scroll</span>
          <div class="hero__scrollLine"></div>
        </div>
      </section>

      <section class="stats">
        ${[
          { v: totalEntries,    label: 'Entradas no codex',  hue: 268, icon: ICONS.Index },
          { v: totalCategories, label: 'Categorias ativas',  hue: 38,  icon: ICONS.Magias },
          { v: totalPillars,    label: 'Pilares narrativos', hue: 195, icon: ICONS.Eras },
          { v: '∞',             label: 'Histórias possíveis', hue: 320, icon: ICONS.Persona, raw: true },
        ].map((s, i) => `
          <div class="stat" style="--hue:${s.hue};--delay:${i * 80}ms">
            <div class="stat__icon">${s.icon}</div>
            <div class="stat__value" ${s.raw ? '' : 'data-counter'}>${s.v}</div>
            <div class="stat__label">${s.label}</div>
          </div>
        `).join('')}
      </section>

      ${featured.length ? `
        <section class="section">
          <header class="section__head">
            <div>
              <span class="section__eyebrow">EM DESTAQUE</span>
              <h2 class="section__title">Entradas selecionadas</h2>
            </div>
            <a href="#/Itens" class="section__link">
              ver todas <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
          </header>
          <div class="featured">
            ${featured.map((e, i) => featuredCardHTML(e, i)).join('')}
          </div>
        </section>
      ` : ''}

      ${(idx.pillars || []).length ? `
        <section class="section">
          <header class="section__head">
            <div>
              <span class="section__eyebrow">FUNDAMENTOS</span>
              <h2 class="section__title">Pilares do mundo</h2>
            </div>
          </header>
          <div class="pillars">
            ${idx.pillars.map((p, i) => `
              <article class="pillar" style="--delay:${i * 80}ms">
                <div class="pillar__num">0${i + 1}</div>
                <h3 class="pillar__title">${escapeHtml(p.title)}</h3>
                <p class="pillar__text">${escapeHtml(p.text)}</p>
                <div class="pillar__glow"></div>
              </article>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <section class="section">
        <header class="section__head">
          <div>
            <span class="section__eyebrow">NAVEGAÇÃO</span>
            <h2 class="section__title">Explore por categoria</h2>
          </div>
        </header>
        <div class="cat-grid">
          ${ARCHIVE.tabs.filter((t) => t.id !== 'Index').map((t, i) => {
            const tt = themeOf(t.id);
            const count = tabCount(t.id);
            return `
              <a href="#/${t.id}" class="cat-card" style="--hue:${tt.hue};--delay:${i * 50}ms">
                <div class="cat-card__icon">${iconOf(t.id)}</div>
                <div class="cat-card__body">
                  <h3 class="cat-card__title">${escapeHtml(t.title)}</h3>
                  <p class="cat-card__tone">${escapeHtml(t.tone || '')}</p>
                  <div class="cat-card__meta">
                    <span class="badge badge-soft">${count} ${count === 1 ? 'entrada' : 'entradas'}</span>
                    <span class="cat-card__arrow">→</span>
                  </div>
                </div>
              </a>
            `;
          }).join('')}
        </div>
      </section>

      ${manifestoMarkup ? `
        <section class="section">
          <div class="manifesto">
            <span class="section__eyebrow">MANIFESTO</span>
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
          ${e.image ? `<img loading="lazy" src="${e.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
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

  /* ── CATEGORY VIEW ────────────────────────────── */
  function viewCategory(tabId, query, selectedTag, spellFilters) {
    const tab = tabById(tabId);
    if (!tab) return viewNotFound(tabId);
    const theme = themeOf(tabId);
    const all = entriesIn(tabId);
    const q = normalize(query || '');
    const tag = tagKey(selectedTag || '');
    const spellFilter = normalizeSpellFilters(spellFilters);
    const tagStats = categoryTagStats(all);
    const list = all.filter((e) => {
      const entryTags = sanitizeTags(e.tags);
      const matchesTag = !tag || entryTags.some((t) => tagKey(t.label) === tag);
      if (!matchesTag) return false;
      if (isMagiasTab(tabId)) {
        const fields = e.fields || {};
        const type = isSpellType(e.subtype) ? e.subtype : 'ativa';
        if (spellFilter.type && type !== spellFilter.type) return false;
        if (spellFilter.affinity && fields['Afinidade'] !== spellFilter.affinity) return false;
        if (spellFilter.tier && fields['Tier'] !== spellFilter.tier) return false;
      }
      if (!q) return true;
      const tagText = entryTags.map((t) => t.label).join(' ');
      const hay = [e.title, e.summary, tagText, ...(e.body || []), e.bodyHtml || '', ...fieldSearchValues(e.fields || {})].join(' ');
      return normalize(hay).includes(q);
    });

    const showCreate = isCreatable(tabId) && auth.isAdmin;
    const totalCards = list.length + (showCreate ? 1 : 0);
    const activeTagLabel = tagStats.find((t) => t.key === tag)?.label || '';

    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf(tabId)}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title" data-text-reveal>${escapeHtml(tab.title)}</h1>
          <p class="cat-hero__tone">${escapeHtml(tab.tone || '')}</p>
          <div class="cat-hero__meta">
            <span class="badge"><strong>${all.length}</strong> ${isMagiasTab(tabId) ? (all.length === 1 ? 'magia' : 'magias') : (all.length === 1 ? 'história' : 'histórias')}</span>
            ${showCreate ? '<span class="badge badge-soft">Criação aberta</span>' : ''}
          </div>
        </div>
      </section>

      <section class="filter-bar">
        <label class="filter-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input id="catSearch" type="search" placeholder="Filtrar em ${escapeHtml(tab.title)}..." value="${escapeHtml(query || '')}" autocomplete="off">
        </label>
        <span class="filter-count">${totalCards} ${totalCards === 1 ? 'item' : 'itens'}</span>
      </section>

      ${isMagiasTab(tabId) ? spellCategoryFiltersHTML(all, spellFilter) : ''}

      ${tagStats.length ? `
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

      ${(list.length === 0 && !showCreate) ? emptyStateHTML(tab) : `
        <section class="entry-grid">
          ${showCreate ? createCardHTML(tabId) : ''}
          ${list.map((e, i) => entryCardHTML(e, i + (showCreate ? 1 : 0))).join('')}
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

  function entryCardHTML(e, i) {
    if (isMagiasTab(e.tab)) return spellCardHTML(e, i);
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
          ${e.image ? `<img loading="lazy" src="${e.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
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
        <div class="rt-editor" id="rtEditor" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Conte sua história...">${initialHtml ? sanitizeHtml(initialHtml) : ''}</div>
      </div>
    `;
  }

  /* ── CREATE / EDIT VIEW ───────────────────────── */
  function viewCreate(tabId, entryId) {
    if (!auth.isAdmin) return viewForbidden();
    const tab = tabById(tabId);
    if (!tab || !isCreatable(tabId)) return viewNotFound(tabId);

    const editing = !!entryId;
    const existingEntry = editing ? entryById(entryId) : null;
    if (editing && (!existingEntry || canonicalTabId(existingEntry.tab) !== canonicalTabId(tabId))) {
      return viewNotFound(entryId);
    }

    if (isMagiasTab(tabId)) return spellCreateView(tabId, entryId, editing, existingEntry);

    const theme = themeOf(tabId);
    const portrait = isPortrait(tabId);
    const isItens = tabId === 'Itens';
    const isRacas = tabId === 'Racas';
    const isBestiario = tabId === 'Bestiario';
    const isSectioned = isSectionedTab(tabId);

    const banner = bannerLabelFor(tabId);
    const bannerStyle = bannerStyleFor(tabId);
    const titleLabel = (isItens || isSectioned) ? 'Nome' : 'Título';
    const titlePlaceholder = isItens ? 'Nome do item' : (isRacas ? 'Nome da raça' : (isBestiario ? 'Nome da criatura' : 'Dê um nome à sua história'));
    const summaryPlaceholder = `Uma frase curta que descreve ${isItens ? 'o item' : (isRacas ? 'a raça' : (isBestiario ? 'a criatura' : 'a história'))}`;
    const descLabel = (isItens || isSectioned) ? 'Descrição' : 'Texto';

    const saveLabel = editing
      ? 'Salvar alterações'
      : (isItens ? 'Salvar item' : (isRacas ? 'Salvar raça' : (isBestiario ? 'Salvar criatura' : 'Salvar história')));
    const heroSubtitle = editing
      ? 'Atualize os campos e salve para sobrescrever esta entrada.'
      : (isItens
          ? 'Escolha o tipo, anexe uma imagem 4:3 e preencha o dossiê.'
          : isRacas
            ? 'Anexe uma imagem 2:3, preencha as três seções do dossiê e descreva a raça.'
            : isBestiario
              ? 'Anexe uma imagem 3:4, preencha a ficha (natureza, habilidades e vitalidade) e descreva a criatura.'
              : 'Preencha o banner, o título e o relato. Use a barra de ferramentas para formatar e colorir o texto.');
    const heroH1 = editing
      ? `Editar ${isItens ? 'item' : (isRacas ? 'raça' : (isBestiario ? 'criatura' : 'história'))} · `
      : (isItens ? 'Novo item em ' : (isRacas ? 'Nova raça em ' : (isBestiario ? 'Nova criatura em ' : 'Nova história em ')));
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

      <form class="create-form ${portrait ? 'create-form--portrait' : ''}" id="createForm"
            data-tab="${escapeHtml(tabId)}"
            ${editing ? `data-edit-id="${escapeHtml(entryId)}"` : ''}
            style="--hue:${theme.hue}" novalidate>
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

        ${isItens ? `
        <div class="create-form__field">
          <label class="create-form__label">${hintedLabel('Dossiê', 'Preencha só o que afeta regra, economia ou narrativa; campos vazios não aparecem na ficha do item.')}</label>
          <div class="dossier-fields" id="dossierFields"></div>
        </div>
        ` : ''}

        ${isSectioned ? `
        <div class="create-form__field">
          <label class="create-form__label">${isBestiario ? 'Ficha' : 'Dossiê'}</label>
          ${raceDossierFormHTML(tabId, editing ? initial.fields : {})}
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

        <div class="create-form__actions">
          <a href="${cancelHref}" class="btn btn-ghost">Cancelar</a>
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

    const heroEyebrow = editing ? `EDITAR · ${theme.label}` : `CRIAR · ${theme.label}`;
    const heroH1 = editing ? `Editar magia · ${existingEntry.title}` : 'Nova magia em Magias';
    const heroTone = 'Escolha o tipo, defina a afinidade e preencha a ficha. Os detalhes arcanos mudam conforme a afinidade.';

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

        <div class="create-form__row">
          <div class="create-form__field">
            <label class="create-form__label" for="spellTier">Tier</label>
            ${spellSelectHTML('spellTier', TIER_OPTIONS, f['Tier'] || '', '—')}
          </div>
          <div class="create-form__field">
            <label class="create-form__label" for="spCusto">Custo <span class="spell-opt" id="spCustoHint" ${type === 'passiva' ? '' : 'hidden'}>(opcional)</span></label>
            <div class="cost-input">
              <input type="number" id="spCusto" class="create-form__input" min="0" placeholder="Valor" value="${v(f['Custo'])}">
              <div class="spell-select cost-input__unit">
                <select id="spCustoUnidade" class="create-form__input">
                  ${COST_UNITS.map((u) => `<option value="${u}" ${(f['CustoUnidade'] || 'MP') === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
              </div>
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
        alert('Supabase não configurado. Edite assets/js/config.js com sua URL e anon key.');
        return;
      }

      const val = (id) => ($f(id) ? $f(id).value.trim() : '');
      const name = val('spellName');
      const affinity = affHidden.value;
      const tier = val('spellTier');
      const custo = val('spCusto');
      const custoUnidade = $f('spCustoUnidade') ? $f('spCustoUnidade').value : 'MP';
      const scopeEntries = getScopeEntries();
      const spellEffects = readSpellEffects();
      const legacyEffectText = spellEffects.map((effect) => effect.text).filter(Boolean).join('\n');

      const missing = [];
      const clearInvalid = () => form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
      const mark = (id) => { const el = $f(id); if (el) el.classList.add('is-invalid'); };
      clearInvalid();

      if (!name) { missing.push('Nome'); mark('spellName'); }
      if (!affinity) { missing.push('Afinidade'); form.querySelector('#affinityPicker').classList.add('is-invalid'); }
      if (!tier) { missing.push('Tier'); mark('spellTier'); }
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
          Custo: custo, CustoUnidade: custoUnidade, Tier: tier, Alcance: alcance,
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
          Custo: custo, CustoUnidade: custoUnidade, Tier: tier,
          'Condição de Ativação': ativacao, Afinidade: affinity,
          Escopos: scopeEntries, 'Efeito Contínuo': efeito,
          'Manutenção': val('spManutencao')
        };
        fields['Efeitos Adicionais'] = spellEffects;
        fields['Efeito Adicional'] = legacyEffectText;
        summary = efeito;
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
        alert('Erro ao salvar: ' + (err.message || err));
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
    const tierRoman = f['Tier'] || '—';
    const unit = f['CustoUnidade'] || 'MP';

    const area = (f['AreaLargura'] && f['AreaAltura'])
      ? `${escapeHtml(f['AreaLargura'])} × ${escapeHtml(f['AreaAltura'])} <i>q</i>` : '—';
    const tierVal = `<span class="tier-roman">${escapeHtml(tierRoman)}</span>`;

    const stone = (label, value, cls) => `
      <div class="runestone ${cls || ''}">
        <span class="runestone__v">${value}</span>
        <span class="runestone__l">${escapeHtml(label)}</span>
      </div>`;

    const stones = type === 'ativa' ? [
      stone('Custo', formatCusto(f), 'is-cost'),
      stone('Tier', tierVal, 'is-tier'),
      stone('Alcance', f['Alcance'] ? `${escapeHtml(f['Alcance'])} <i>q</i>` : '—'),
      stone('Área', area),
      stone('Duração', escapeHtml(f['Duração'] || '—'), 'is-duration')
    ].join('') : [
      stone('Custo', formatCusto(f), 'is-cost'),
      stone('Tier', tierVal, 'is-tier'),
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
      bookStat('Tier', tierVal, 'is-tier'),
      bookStat('Alcance', f['Alcance'] ? `${escapeHtml(f['Alcance'])} <i>q</i>` : '—'),
      bookStat('Área', area),
      bookStat('Duração', escapeHtml(readSpellField('Duração') || '—'), 'is-duration')
    ].join('') : [
      bookStat('Custo', escapeHtml(formatCusto(f)), 'is-cost'),
      bookStat('Tier', tierVal, 'is-tier'),
      bookStat('Ativação', escapeHtml(bookActivation)),
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
    let arrivingTurn = '';
    try {
      arrivingTurn = sessionStorage.getItem('arcanoSpellPageTurn') || '';
      sessionStorage.removeItem('arcanoSpellPageTurn');
    } catch {}
    const arrivingClass = ['next', 'prev'].includes(arrivingTurn) ? ` is-page-arriving is-page-arriving--${arrivingTurn}` : '';
    const pageTurnButton = (target, dir, label) => target ? `
      <button type="button" class="spell-page-button spell-page-button--${dir}" data-spell-page-turn="${dir}" data-target-hash="#/${tabId}/${encodeURIComponent(target.id)}" aria-label="${escapeHtml(label)}: ${escapeHtml(target.title)}">
        <span class="spell-page-button__k">${dir === 'prev' ? 'Anterior' : 'Proxima'}</span>
        <strong>${escapeHtml(target.title)}</strong>
      </button>` : '';
    const pageTurnEdge = (target, dir) => target ? `
      <button type="button" class="spell-page-edge spell-page-edge--${dir}" data-spell-page-turn="${dir}" data-target-hash="#/${tabId}/${encodeURIComponent(target.id)}" title="${escapeHtml(dir === 'prev' ? 'Magia anterior' : 'Proxima magia')}: ${escapeHtml(target.title)}" aria-label="${escapeHtml(dir === 'prev' ? 'Magia anterior' : 'Proxima magia')}: ${escapeHtml(target.title)}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'}"/></svg>
      </button>` : '';
    const pageTurnControls = hasPageTurns ? `
      <div class="spell-page-controls" aria-label="Virar paginas do grimorio">
        ${pageTurnButton(prevSpell, 'prev', 'Magia anterior')}
        <span class="spell-page-counter">${bookIndex + 1}<i>/</i>${spellBookEntries.length}</span>
        ${pageTurnButton(nextSpell, 'next', 'Proxima magia')}
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

        <div class="spell-book">
          ${hasPageTurns ? `${pageTurnEdge(prevSpell, 'prev')}${pageTurnEdge(nextSpell, 'next')}` : ''}
          <section class="spell-book__page spell-book__page--identity">
            <div class="spell-book__watermark" aria-hidden="true">${aff.icon}</div>
            <div class="spell-book__media ${e.image ? 'has-img' : ''}" aria-hidden="true">
              <span class="spell-book__media-ring"></span>
              ${e.image ? `<img src="${e.image}" alt="" onerror="this.closest('.spell-book__media').classList.add('is-fallback')">` : ''}
              <span class="spell-book__media-rune">${runeSvg}</span>
            </div>
            <div class="spell-book__badges">
              <span class="spell-type-badge spell-type-badge--${type}">${escapeHtml(typeMeta.badge)}</span>
              <span class="spell-affinity-badge"><span class="spell-affinity-badge__ic">${aff.icon}</span>${escapeHtml(aff.label)}</span>
            </div>
            <h1 class="spell-book__title">${escapeHtml(e.title)}</h1>
            ${bookSummary ? `
              <div class="spell-book__summary">
                <span>Resumo</span>
                <p>${escapeHtml(bookSummary)}</p>
              </div>` : ''}
            ${scopeEntries.length ? `<div class="spell-book__pills">${spellScopePills(scopeEntries.map((s) => s.tipo))}</div>` : ''}
            <div class="spell-book-rules">${bookStats}</div>
          </section>

          <section class="spell-book__page spell-book__page--notes">
            <section class="spell-book-section spell-book-section--lead">
              <h2>${type === 'ativa' ? 'Descrição' : 'Efeito contínuo'}</h2>
              ${bookDescription ? `<p>${escapeHtml(bookDescription)}</p>` : '<p class="spell-empty-text">Sem descrição.</p>'}
            </section>
            <section class="spell-book-section">
              <h2>Efeito mecânico</h2>
              ${bookScopeNotes}
            </section>
            ${bookHowWorks}
            <section class="spell-book-section">
              <div class="spell-book-section__head">
                <h2>Notas de efeito</h2>
                <span>${effectEntries.length}</span>
              </div>
              ${bookEffects}
            </section>
          </section>
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
    const names = spellScopeNames(f);
    const hasCusto = String(f['Custo'] ?? '').trim() !== '';
    const runeSvg = aff.rune
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="${aff.rune}"/></svg>`
      : aff.icon;
    return `
      <a href="#/${e.tab}/${e.id}" class="tome-card grimoire--${type}" style="--accent:${aff.accent};--glow:${aff.glow};--hue:${aff.hue};--delay:${i * 45}ms">
        <span class="tome-card__bg-rune" aria-hidden="true">${aff.icon}</span>
        <span class="spell-type-badge spell-type-badge--${type} tome-card__type">${escapeHtml(SPELL_TYPES[type].badge)}</span>
        ${hasCusto ? `<span class="tome-card__orb"><b>${escapeHtml(String(f['Custo']))}</b><small>${escapeHtml(f['CustoUnidade'] || 'MP')}</small></span>` : ''}
        <div class="tome-card__medal ${e.image ? 'has-img' : ''}" aria-hidden="true">
          <span class="tome-card__medal-ring"></span>
          ${e.image ? `<img class="tome-card__img" loading="lazy" src="${e.image}" alt="" onerror="this.closest('.tome-card__medal').classList.add('is-fallback')">` : ''}
          <span class="tome-card__medal-rune">${runeSvg}</span>
        </div>
        <h3 class="tome-card__name">${escapeHtml(e.title)}</h3>
        <div class="tome-card__meta">
          <span class="tome-card__aff"><span>${aff.icon}</span>${escapeHtml(aff.label)}</span>
          <span class="tome-card__sep">·</span>
          <span class="tome-card__tier">Tier ${escapeHtml(f['Tier'] || '—')}</span>
        </div>
        ${names.length ? `<div class="tome-card__runes">${names.slice(0, 5).map((s) => `<span class="rune-chip" style="--pill:${scopeColor(s)}" title="${escapeHtml(s)}">${scopeIcon(s)}</span>`).join('')}</div>` : ''}
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
          <p class="cat-hero__tone">Personalize o banner, o título, a frase de abertura e o manifesto da página inicial.</p>
        </div>
      </section>

      <form class="create-form" id="editIndexForm" style="--hue:${theme.hue}" novalidate>
        <div class="create-form__field">
          <label class="create-form__label">Banner (16:9)</label>
          <div class="banner-drop" id="bannerDrop" tabindex="0" role="button" aria-label="Selecionar imagem do banner">
            <input type="file" accept="image/*" id="bannerInput" hidden>
            <div class="banner-drop__preview" id="bannerPreview" ${idx.image ? '' : 'hidden'} style="${idx.image ? `background-image:url('${idx.image}')` : ''}"></div>
            <div class="banner-drop__placeholder" id="bannerPlaceholder" ${idx.image ? 'hidden' : ''}>
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 17l-5-5-9 9"/></svg>
              <strong>Clique ou arraste uma imagem</strong>
              <span>Proporção 16:9 — JPG, PNG ou WebP</span>
            </div>
            <button type="button" class="banner-drop__clear" id="bannerClear" ${idx.image ? '' : 'hidden'} aria-label="Remover imagem">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

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
  function viewEntry(tabId, entryId) {
    const e = entryById(entryId);
    if (!e || e.tab !== tabId) return viewNotFound(entryId);
    if (isMagiasTab(tabId)) return spellEntryView(tabId, e);
    const theme = themeOf(tabId);
    const tab = tabById(tabId);
    const fields = Object.entries(e.fields || {});
    const related = ARCHIVE.entries.filter((x) => x.tab === tabId && x.id !== e.id).slice(0, 3);
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
      if (!baseFields.length && !extraFields.length) return '';
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
        </aside>
      `;
    }

    function renderVitalsCard(section, data, sectionHead) {
      // Bestiário: HP anatômico + Defesa como mini-stats, Mana como callout.
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
                  <span class="hp-part__value">${escapeHtml(String(data[k]))}</span>
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
                  <strong class="beast-attr__score">${escapeHtml(String(score))}</strong>
                  <em class="beast-attr__mod">${fmtMod(beastAttrMod(score))}</em>
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
     FICHAS DE PERSONAGEM — views (aba Persona)
     ════════════════════════════════════════════════ */

  /* Lê o dossiê de uma raça (entry de Racas) e devolve { mod, hp, mana }. */
  function raceDataFor(raceId) {
    const race = raceId ? entryById(raceId) : null;
    const fields = (race && race.fields) || {};
    const hp = {};
    RACE_HP_PARTS.forEach((p) => { if (fields[p] != null && fields[p] !== '') hp[p] = String(fields[p]); });
    return {
      race,
      mod: parseRaceModifier(fields['Modificador'] || ''),
      hp,
      mana: fields['Mana'] || ''
    };
  }


  /* ── ROSTER (#/Persona) ───────────────────────── */
  function viewPersonaRoster() {
    const tab = tabById('Persona');
    const theme = themeOf('Persona');
    const mine = auth.user ? CHARACTERS.filter((c) => c.userId === auth.user.id) : [];
    const others = auth.isAdmin && auth.user
      ? CHARACTERS.filter((c) => c.userId !== auth.user.id)
      : [];

    const heroMine = `
      <section class="entry-grid">
        ${characterCreateCardHTML()}
        ${mine.map((c, i) => characterCardHTML(c, i + 1)).join('')}
      </section>
    `;

    const othersBlock = (auth.isAdmin && others.length) ? `
      <section class="section">
        <header class="section__head">
          <div>
            <span class="section__eyebrow">VISÃO DO MESTRE</span>
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
            ${auth.isAdmin && others.length ? `<span class="badge badge-soft">${others.length} de outros</span>` : ''}
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
      <a href="#/Persona/${encodeURIComponent(c.id)}" class="entry-card char-card" style="--hue:${theme.hue};--delay:${i * 40}ms">
        <div class="entry-card__media">
          ${c.image ? `<img loading="lazy" src="${c.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
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
            ${owner ? `<span class="chip">${escapeHtml(owner)}</span>` : ''}
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
  function equippedCount(c) {
    return (Array.isArray(c.inventory) ? c.inventory : []).filter((it) => it.equipped).length;
  }
  const MAX_EQUIPPED = 6;
  /* Atualiza o escudo no DOM sem re-renderizar o bloco inteiro. */
  function refreshDefense(c) {
    document.querySelectorAll('[data-df-total], [data-def-total]').forEach((el) => { el.textContent = totalDf(c); });
    document.querySelectorAll('[data-df-items], [data-def-items]').forEach((el) => { el.textContent = dfFromItems(c); });
    document.querySelectorAll('[data-df-pct]').forEach((el) => { el.textContent = defPct(totalDf(c)) + '%'; });
    document.querySelectorAll('[data-dm-total]').forEach((el) => { el.textContent = totalDm(c); });
    document.querySelectorAll('[data-dm-items]').forEach((el) => { el.textContent = dmFromItems(c); });
    document.querySelectorAll('[data-dm-pct]').forEach((el) => { el.textContent = defPct(totalDm(c)) + '%'; });
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
    const parts = RACE_HP_PARTS.filter((p) => v.hp && v.hp[p]);
    const head = `<h3 class="fcard__h"><span class="fcard__ico">${FICON.heart}</span>Vitais</h3>`;
    const shield = defenseShieldHTML(c, canEdit);
    if (!parts.length && !v.mana) {
      return head + shield + '<p class="char-empty">Sem HP/Mana definidos. Edite a ficha para preencher.</p>';
    }
    const hpRows = parts.map((p) => vitalRowHTML(p, p, v.hp[p], canEdit)).join('');
    const manaRow = v.mana ? vitalRowHTML('mana', 'Mana', v.mana, canEdit, { mana: true }) : '';
    return head + shield + `<div class="vrows">${hpRows}${manaRow}</div>`;
  }

  function charStatusInner(c, canEdit) {
    const list = Array.isArray(c.statuses) ? c.statuses : [];
    const head = `<h3 class="fcard__h"><span class="fcard__ico">${FICON.status}</span>Condições</h3>`;
    const body = list.length
      ? `<div class="status-chips">${list.map((s, i) => `
          <span class="status-chip">${escapeHtml(s.name || '')}${canEdit ? `<button type="button" class="status-chip__x" data-status-remove="${i}" aria-label="Remover ${escapeHtml(s.name || '')}">×</button>` : ''}</span>
        `).join('')}</div>`
      : '<p class="char-empty">Nenhum status ativo.</p>';
    const adder = canEdit ? `
      <div class="char-add">
        <input type="text" class="create-form__input" data-status-input placeholder="Adicionar status (ex.: Sangramento)…" maxlength="60">
        <button type="button" class="btn btn-ghost" data-status-add>Adicionar</button>
      </div>` : '';
    return head + body + adder;
  }

  /* Livro de magias — grade de cards (estado vivo). */
  function spellRuntimeInfo(it) {
    const entry = it && it.refId ? entryById(it.refId) : null;
    const f = (entry && entry.fields) || {};
    const costValue = parseInt((f['Custo'] ?? it.costValue ?? ''), 10);
    const costUnit = String(f['CustoUnidade'] || it.costUnit || 'MP').trim() || 'MP';
    const costText = Number.isFinite(costValue) && costValue > 0 ? `${costValue} ${costUnit}` : '';
    return {
      costValue: Number.isFinite(costValue) && costValue > 0 ? costValue : 0,
      costUnit,
      costText,
      tier: f['Tier'] || it.tier || '',
      affinity: f['Afinidade'] || it.affinity || '',
      duration: f['Duração'] || it.duration || ''
    };
  }

  function spellRuntimeMetaHTML(it, canEdit, index, vitals) {
    const info = spellRuntimeInfo(it);
    const chips = [
      info.costText ? `Custo ${info.costText}` : '',
      info.tier ? `Tier ${info.tier}` : '',
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
    const manaTxt = v.mana ? `${v.mana.cur} / ${v.mana.max}` : '—';

    const bar = `
      <div class="spell-bar">
        <span class="spell-bar__mana">${FICON.mana}<span>Mana ${manaTxt}</span></span>
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

    const slots = [];
    for (let s = 0; s < MAX_EQUIPPED; s++) {
      slots.push(eq[s]
        ? invSlotHTML(eq[s][0], eq[s][1], canEdit)
        : `<div class="eq-slot is-empty"><span class="eq-slot__ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 7v10M7 12h10"/></svg></span></div>`);
    }
    const equipCol = `
      <div class="fcard inv-equip">
        <h3 class="fcard__h"><span class="fcard__ico">${FICON.shield}</span>Equipamentos<span class="fcard__count ${eqCount >= MAX_EQUIPPED ? 'is-full' : ''}">${eqCount}/${MAX_EQUIPPED}</span></h3>
        <div class="eq-grid">${slots.join('')}</div>
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
  function viewCharacterSheet(id) {
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
    const hpParts = RACE_HP_PARTS.filter((p) => v.hp && v.hp[p]);
    const hpCur = hpParts.reduce((s, p) => s + (Number(v.hp[p].cur) || 0), 0);
    const hpMax = hpParts.reduce((s, p) => s + (Number(v.hp[p].max) || 0), 0);
    const initDice = A['Destreza'] ? A['Destreza'].dice : 1;
    const level = Math.max(1, Number(idn.level || c.level) || 1);
    const movement = String(idn.movement || idn.movimento || '9m').trim() || '9m';
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

  /* ── FORMULÁRIO DA FICHA (#/Persona/criar|editar) ─ */
  function viewCharacterForm(id) {
    if (!auth.canRead) return viewForbidden();
    const editing = !!id;
    const existing = editing ? characterById(id) : null;
    if (editing && !existing) return viewNotFound(id);
    if (editing && !(auth.isAdmin || (auth.user && existing.userId === auth.user.id))) return viewForbidden();

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

    const heroEyebrow = editing ? `EDITAR · ${theme.label}` : `CRIAR · ${theme.label}`;
    const heroTitle = editing ? `Editar ${c.name || 'ficha'}` : 'Nova persona';
    const saveLabel = editing ? 'Salvar alterações' : 'Salvar ficha';
    const cancelHref = editing ? `#/Persona/${encodeURIComponent(id)}` : '#/Persona';

    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf('Persona')}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(heroEyebrow)}</span>
          <h1 class="cat-hero__title">${escapeHtml(heroTitle)}</h1>
          <p class="cat-hero__tone">Escolha a raça, distribua atributos, defina se é mago e descreva sua persona.</p>
        </div>
      </section>

      <form class="create-form create-form--portrait" id="characterForm"
            data-char-id="${editing ? escapeHtml(id) : ''}"
            style="--hue:${theme.hue}" novalidate>

        <div class="create-form__field">
          <label class="create-form__label">Retrato (2:3)</label>
          <div class="banner-drop banner-drop--portrait" id="bannerDrop" style="aspect-ratio: 2 / 3; max-width: 360px;"
               tabindex="0" role="button" aria-label="Selecionar retrato">
            <input type="file" accept="image/*" id="bannerInput" hidden>
            <div class="banner-drop__preview" id="bannerPreview" ${c.image ? '' : 'hidden'} style="${c.image ? `background-image:url('${c.image}')` : ''}"></div>
            <div class="banner-drop__placeholder" id="bannerPlaceholder" ${c.image ? 'hidden' : ''}>
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 17l-5-5-9 9"/></svg>
              <strong>Clique ou arraste uma imagem</strong>
              <span>Proporção 2:3 (retrato) — JPG, PNG ou WebP</span>
            </div>
            <button type="button" class="banner-drop__clear" id="bannerClear" ${c.image ? '' : 'hidden'} aria-label="Remover imagem">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="charName">Nome</label>
          <input type="text" id="charName" class="create-form__input" placeholder="Nome do personagem" maxlength="120" required value="${escapeHtml(c.name || '')}">
        </div>

        <div class="create-form__row">
          <div class="create-form__field">
            <label class="create-form__label" for="charLevel">Nivel</label>
            <input type="number" id="charLevel" class="create-form__input" min="1" max="99" value="${escapeHtml(String(idn.level || 1))}">
          </div>
          <div class="create-form__field">
            <label class="create-form__label" for="charMovement">Movimento</label>
            <input type="text" id="charMovement" class="create-form__input" maxlength="20" value="${escapeHtml(idn.movement || idn.movimento || '9m')}" placeholder="9m">
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="charRace">Raça</label>
          <select id="charRace" class="create-form__input char-select">
            <option value="">— Sem raça —</option>
            ${races.map((r) => `<option value="${escapeHtml(r.id)}" ${r.id === selectedRaceId ? 'selected' : ''}>${escapeHtml(r.title)}</option>`).join('')}
          </select>
          ${races.length ? '' : '<p class="char-hint">Nenhuma raça cadastrada ainda — o Mestre pode criar raças na aba Raças.</p>'}
        </div>

        <div class="create-form__field">
          <label class="create-form__label">O Despertar</label>
          <p class="char-hint">A Mana decide quem você é. Role o destino antes de fechar a ficha.</p>
          <div class="awakening" id="awakening"></div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label">Atributos</label>
          <div class="attr-buy" id="attrBuy"
               data-base="${CHAR_ATTR_BASE}" data-pool="${CHAR_POINT_POOL}" data-max="${CHAR_ATTR_MAX}">
            <div class="attr-buy__head">
              <span>Todos comecam em ${CHAR_ATTR_BASE}. Distribua ${CHAR_POINT_POOL} pontos; a cada 2 pontos acima da base, +1d6 nos testes. A raca soma nos dados.</span>
              <span class="attr-buy__pool">Pontos restantes: <strong id="attrPool">${CHAR_POINT_POOL}</strong></span>
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
          <label class="dossier-field char-da-field">
            <span>Atributo base de DA</span>
            <select id="charDaAttr" class="create-form__input char-select">
              ${CHAR_ATTRIBUTES.map((a) => `<option value="${escapeHtml(a)}" ${a === (idn.daAttr || 'Destreza') ? 'selected' : ''}>${escapeHtml(a)}</option>`).join('')}
            </select>
          </label>
        </div>

        <div class="create-form__field">
          <label class="create-form__label">HP por parte do corpo / Mana</label>
          <p class="char-hint">Preenchidos a partir da raça escolhida — ajuste se precisar.</p>
          <div class="hp-form" id="charHpForm">
            ${RACE_HP_PARTS.map((p) => `
              <label class="hp-form__row">
                <span class="hp-form__name">${escapeHtml(p)}</span>
                <input type="text" inputmode="numeric" class="create-form__input hp-form__input" data-hp-part="${escapeHtml(p)}"
                       value="${escapeHtml(hpValues[p] != null ? hpValues[p] : '')}" maxlength="9">
              </label>
            `).join('')}
          </div>
          <label class="dossier-field dossier-field--mana">
            <span>Mana</span>
            <input type="text" id="charMana" class="create-form__input" value="${escapeHtml(manaValue || '')}" placeholder="15/15" maxlength="20">
          </label>
        </div>

        <div class="create-form__field">
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

        <div class="create-form__field">
          <label class="create-form__label">Identidade narrativa</label>
          <div class="char-identity-grid">
            <label class="dossier-field"><span>Papel</span>
              <input type="text" id="charPapel" class="create-form__input" maxlength="160" value="${escapeHtml(idn.papel || '')}" placeholder="Ex.: Mercenária errante"></label>
            <label class="dossier-field"><span>Desejo</span>
              <input type="text" id="charDesejo" class="create-form__input" maxlength="160" value="${escapeHtml(idn.desejo || '')}" placeholder="O que persegue"></label>
            <label class="dossier-field"><span>Ferida</span>
              <input type="text" id="charFerida" class="create-form__input" maxlength="160" value="${escapeHtml(idn.ferida || '')}" placeholder="O que carrega"></label>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label">História</label>
          ${editorToolbarHTML(idn.bodyHtml || '')}
        </div>

        <div class="create-form__actions">
          <a href="${cancelHref}" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" id="charSave">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span>${escapeHtml(saveLabel)}</span>
          </button>
        </div>
      </form>
    `;
  }

  /* ── NOT FOUND ────────────────────────────────── */
  /* MESA / GRID TATICO */
  function viewMesa() {
    if (!mesaCanUse()) return viewForbidden();
    MESA_STATE = normalizeMesaState(MESA_STATE);
    const theme = themeOf('Mesa');
    const isMaster = mesaIsMaster();
    const visibleTokens = mesaVisibleTokens();
    const selected = mesaTokenById(mesaSelectedTokenId);
    const playerChars = CHARACTERS.filter((c) => isMaster || (auth.user && c.userId === auth.user.id));
    const beasts = entriesIn('Bestiario');
    const cells = [];
    for (let y = 0; y < MESA_STATE.height; y++) {
      for (let x = 0; x < MESA_STATE.width; x++) {
        cells.push(`<button type="button" class="mesa-cell" data-mesa-cell data-x="${x}" data-y="${y}" aria-label="Casa ${x + 1}, ${y + 1}"></button>`);
      }
    }

    const charOptions = playerChars.length
      ? playerChars.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name || 'Persona')}</option>`).join('')
      : '<option value="">Nenhuma Persona disponivel</option>';
    const beastOptions = beasts.length
      ? beasts.map((b) => `<option value="${escapeHtml(b.id)}">${escapeHtml(b.title)}</option>`).join('')
      : '<option value="">Nenhuma criatura cadastrada</option>';

    const selectedPanel = selected ? `
      <section class="mesa-panel mesa-selected">
        <div class="mesa-panel__head">
          <span>Token selecionado</span>
          <strong>${escapeHtml(selected.name)}</strong>
        </div>
        <div class="mesa-token-meta">
          <span>X ${selected.x + 1}</span>
          <span>Y ${selected.y + 1}</span>
          <span>${selected.size}x${selected.size}</span>
          ${selected.hp ? `<span>${escapeHtml(selected.hp)}</span>` : ''}
        </div>
        <div class="mesa-token-actions">
          ${isMaster ? `
            <button type="button" class="mesa-mini-btn" data-mesa-token-toggle-hidden="${escapeHtml(selected.id)}">${selected.hidden ? 'Revelar' : 'Ocultar'}</button>
            <button type="button" class="mesa-mini-btn" data-mesa-token-toggle-lock="${escapeHtml(selected.id)}">${selected.locked ? 'Destravar' : 'Travar'}</button>
          ` : ''}
          ${(isMaster || (auth.user && selected.ownerId === auth.user.id)) ? `
            <button type="button" class="mesa-mini-btn mesa-mini-btn--danger" data-mesa-token-remove="${escapeHtml(selected.id)}">Remover</button>
          ` : ''}
        </div>
      </section>
    ` : `
      <section class="mesa-panel mesa-selected">
        <div class="mesa-panel__head">
          <span>Token selecionado</span>
          <strong>Nenhum</strong>
        </div>
        <p class="mesa-help">Clique em um token para ver ações. Clique em uma casa vazia para mover o token selecionado.</p>
      </section>
    `;

    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf('Mesa')}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title" data-text-reveal>Mesa</h1>
          <p class="cat-hero__tone">Grid tatico para cenas ativas, movimentacao de tokens e entrada das Personas dos jogadores.</p>
        </div>
      </section>

      <section class="mesa-app" style="--hue:${theme.hue};--mesa-cols:${MESA_STATE.width};--mesa-rows:${MESA_STATE.height};--mesa-cell:${MESA_STATE.cellSize}px;--mesa-bg:${escapeHtml(MESA_STATE.background)}">
        <aside class="mesa-side">
          <section class="mesa-panel">
            <div class="mesa-panel__head">
              <span>Cena ativa</span>
              <strong>${escapeHtml(MESA_STATE.title)}</strong>
            </div>
            <div class="mesa-stats">
              <span>${MESA_STATE.width} x ${MESA_STATE.height}</span>
              <span>${MESA_STATE.cellSize}px</span>
              <span>${MESA_STATE.tokens.length} tokens</span>
            </div>
            ${mesaSyncWarning ? `<p class="mesa-sync">${escapeHtml(mesaSyncWarning)}</p>` : ''}
          </section>

          ${isMaster ? `
            <form class="mesa-panel mesa-form" data-mesa-config>
              <div class="mesa-panel__head">
                <span>Configurar grid</span>
                <strong>Mestre</strong>
              </div>
              <label>Nome da cena
                <input class="create-form__input" name="title" maxlength="90" value="${escapeHtml(MESA_STATE.title)}">
              </label>
              <div class="mesa-form__grid">
                <label>Largura
                  <input class="create-form__input" name="width" type="number" min="${MESA_GRID_LIMITS.minW}" max="${MESA_GRID_LIMITS.maxW}" value="${MESA_STATE.width}">
                </label>
                <label>Altura
                  <input class="create-form__input" name="height" type="number" min="${MESA_GRID_LIMITS.minH}" max="${MESA_GRID_LIMITS.maxH}" value="${MESA_STATE.height}">
                </label>
                <label>Célula
                  <input class="create-form__input" name="cellSize" type="number" min="${MESA_GRID_LIMITS.minCell}" max="${MESA_GRID_LIMITS.maxCell}" value="${MESA_STATE.cellSize}">
                </label>
              </div>
              <label>Fundo
                <input class="create-form__input" name="background" maxlength="80" value="${escapeHtml(MESA_STATE.background)}" placeholder="#101421">
              </label>
              <div class="mesa-checks">
                <label><input type="checkbox" name="showGrid" ${MESA_STATE.showGrid ? 'checked' : ''}> Grade visível</label>
                <label><input type="checkbox" name="allowPlayerMove" ${MESA_STATE.allowPlayerMove ? 'checked' : ''}> Jogadores movem seus tokens</label>
              </div>
              <button type="submit" class="btn btn-primary">Aplicar cena</button>
            </form>
          ` : ''}

          <form class="mesa-panel mesa-form" data-mesa-join>
            <div class="mesa-panel__head">
              <span>Entrar na cena</span>
              <strong>Persona</strong>
            </div>
            <label>Ficha
              <select class="create-form__input char-select" name="characterId" ${playerChars.length ? '' : 'disabled'}>
                ${charOptions}
              </select>
            </label>
            <button type="submit" class="btn btn-ghost" ${playerChars.length ? '' : 'disabled'}>Adicionar Persona</button>
          </form>

          ${isMaster ? `
            <form class="mesa-panel mesa-form" data-mesa-custom>
              <div class="mesa-panel__head">
                <span>Adicionar token</span>
                <strong>Avulso</strong>
              </div>
              <label>Nome
                <input class="create-form__input" name="name" maxlength="80" placeholder="Guarda, altar, criatura...">
              </label>
              <div class="mesa-form__grid">
                <label>Cor
                  <input class="create-form__input" name="color" type="color" value="${MESA_DEFAULT_COLOR}">
                </label>
                <label>Tamanho
                  <input class="create-form__input" name="size" type="number" min="1" max="4" value="1">
                </label>
              </div>
              <button type="submit" class="btn btn-ghost">Adicionar avulso</button>
            </form>

            <form class="mesa-panel mesa-form" data-mesa-beast>
              <div class="mesa-panel__head">
                <span>Adicionar criatura</span>
                <strong>Bestiário</strong>
              </div>
              <label>Criatura
                <select class="create-form__input char-select" name="beastId" ${beasts.length ? '' : 'disabled'}>
                  ${beastOptions}
                </select>
              </label>
              <button type="submit" class="btn btn-ghost" ${beasts.length ? '' : 'disabled'}>Adicionar criatura</button>
            </form>
          ` : ''}

          ${selectedPanel}
        </aside>

        <main class="mesa-stage">
          <div class="mesa-stage__bar">
            <div>
              <span class="section__eyebrow">CENA</span>
              <strong>${escapeHtml(MESA_STATE.title)}</strong>
            </div>
            <div class="mesa-stage__actions">
              <button type="button" class="mesa-mini-btn" data-mesa-center>Centralizar</button>
              ${isMaster ? `<button type="button" class="mesa-mini-btn mesa-mini-btn--danger" data-mesa-clear>Limpar tokens</button>` : ''}
            </div>
          </div>
          <div class="mesa-board-wrap">
            <div class="mesa-board ${MESA_STATE.showGrid ? '' : 'is-grid-hidden'}" data-mesa-board>
              ${cells.join('')}
              ${visibleTokens.map((token) => {
                const canMove = mesaCanMove(token);
                const selectedClass = token.id === mesaSelectedTokenId ? ' is-selected' : '';
                const hiddenClass = token.hidden ? ' is-hidden' : '';
                const lockedClass = token.locked ? ' is-locked' : '';
                const image = token.image ? `<img src="${escapeHtml(token.image)}" alt="">` : '';
                return `
                  <button type="button"
                          class="mesa-token${selectedClass}${hiddenClass}${lockedClass}"
                          data-mesa-token="${escapeHtml(token.id)}"
                          draggable="${canMove ? 'true' : 'false'}"
                          style="--token:${escapeHtml(token.color)};grid-column:${token.x + 1} / span ${token.size};grid-row:${token.y + 1} / span ${token.size};"
                          aria-label="${escapeHtml(token.name)}">
                    ${image || `<span>${escapeHtml(mesaTokenInitials(token.name))}</span>`}
                    <b>${escapeHtml(token.name)}</b>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
          <p class="mesa-help">Arraste tokens para mover. Também é possível selecionar um token e clicar em uma casa do grid.</p>
        </main>
      </section>
    `;
  }

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
  function render(force) {
    const { tab, entry, action } = parseHash();
    const routeKey = `${tab}|${entry || ''}|${action || ''}`;
    if (!force && routeKey === lastRoute) return;
    lastRoute = routeKey;

    renderSidenav(tab);

    let html;
    if (tab === 'Index' && !entry && !action) html = viewHome();
    else if (tab === 'Index' && action === 'editar') html = viewEditIndex();
    else if (tab === 'Persona') {
      // Persona = fichas de personagem dos jogadores (não usa o fluxo de stories).
      if (action === 'criar' && !entry) html = viewCharacterForm(null);
      else if (action === 'editar' && entry) html = viewCharacterForm(entry);
      else if (entry) html = viewCharacterSheet(entry);
      else html = viewPersonaRoster();
    }
    else if (tab === 'Mesa') html = viewMesa();
    else if (action === 'criar' && !entry) html = viewCreate(tab);
    else if (action === 'editar' && entry) html = viewCreate(tab, entry);
    else if (entry) html = viewEntry(tab, entry);
    else {
      const state = categoryState[tab] || {};
      html = viewCategory(tab, state.query || '', state.tag || '', state.spell || EMPTY_SPELL_FILTERS);
    }

    view.classList.add('is-leaving');
    setTimeout(() => {
      view.innerHTML = html;
      view.classList.remove('is-leaving');
      view.classList.add('is-entering');
      requestAnimationFrame(() => {
        view.classList.remove('is-entering');
        animateView();
        attachCategoryFilter();
        attachCreateForm();
        attachSpellForm();
        attachCharacterForm();
        attachEditIndexForm();
        attachIndexEditButton();
        attachSpellPageTurns();
        attachDeleteHandlers();
        attachCharacterDeleteHandlers();
        attachCharacterSheet();
        attachMesaGrid();
        attachBeastAbilityCards();
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
    if (!rows.length) return '';
    return `
      <dl class="ability-modal__meta">
        ${rows.map(([label, value]) => `
          <div>
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(value)}</dd>
          </div>
        `).join('')}
      </dl>
    `;
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
    const entry = entryById(root.dataset.beastEntryId);
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
  function attachCategoryFilter() {
    const input = document.getElementById('catSearch');
    const tagButtons = document.querySelectorAll('[data-tag-filter]');
    const spellFilterButtons = document.querySelectorAll('[data-spell-filter]');
    const spellReset = document.querySelector('[data-spell-filter-reset]');
    if (!input && !tagButtons.length && !spellFilterButtons.length && !spellReset) return;

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
          spell: {
            ...current,
            [key]: btn.dataset.spellFilterValue || ''
          }
        };
        refreshCategory();
      });
    });

    if (spellReset && !spellReset.dataset.bound) {
      spellReset.dataset.bound = '1';
      spellReset.addEventListener('click', () => {
        const { tab } = parseHash();
        categoryState[tab] = {
          ...(categoryState[tab] || {}),
          spell: { ...EMPTY_SPELL_FILTERS }
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

    function loadBanner(file) {
      if (!file.type.startsWith('image/')) {
        alert('Selecione um arquivo de imagem.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        if (!confirm('A imagem é grande (' + Math.round(file.size / 1024) + ' KB). Continuar?')) return;
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
        alert('Use no máximo 8 tags por história.');
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
        return out;
      }
    };
  }

  /* Dossier sectioned (Racas / Bestiario): seções com tipos de campo variados. */
  function raceDossierFormHTML(tabId, values) {
    const v = values || {};
    const cfg = dossierConfigFor(tabId);
    return `
      <div class="race-dossier" id="${cfg.rootId}">
        ${cfg.sections.map((section) => `
          <div class="dossier-section">
            <header class="dossier-section__head">
              <span class="section__eyebrow">${escapeHtml(section.title.toUpperCase())}</span>
            </header>
            ${tabId === 'Bestiario' && section.view === 'attributes'
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
                 </div>`}
          </div>
        `).join('')}
      </div>
    `;
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
    return `
      <div class="beast-attr-form">
        ${CHAR_ATTRIBUTES.map((attr) => `
          <label class="beast-attr-field">
            <span>${escapeHtml(attr)}</span>
            <input type="number" class="create-form__input" data-beast-attr="${escapeHtml(attr)}"
                   min="0" max="30" value="${escapeHtml(String(attrs[attr] ?? CHAR_ATTR_BASE))}">
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
    return `
      <div class="beast-part-builder" data-beast-parts>
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
            <span>Adicionar parte</span>
          </button>
        </div>
      </div>
      <div class="create-form__row beast-vitals-row">
        <label class="dossier-field">
          <span>Defesa</span>
          <input type="text" class="create-form__input" data-dossier-field="Defesa"
                 value="${escapeHtml(values['Defesa'] != null ? values['Defesa'] : '12')}"
                 placeholder="12" maxlength="20">
        </label>
        <label class="dossier-field dossier-field--mana">
          <span>Mana</span>
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
        alert('Crie ao menos um item na aba Itens antes de vincular drops.');
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
            summary: (linked && linked.summary) || row.dataset.abilitySummary || ''
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
        alert('Máximo de 12 itens por lista.');
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
      if (e.target.matches('[data-beast-ability-source]')) {
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
        root.querySelectorAll('input[data-dossier-field]').forEach((inp) => {
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
    if (!editor || !toolbar) return null;

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
        alert('Selecione o texto que vai virar o link.');
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
          alert('Erro ao remover cor: ' + (err.message || err));
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
          alert(`Máximo de ${MAX_PALETTE} cores salvas. Remova alguma antes de adicionar uma nova.`);
          return;
        }
        const next = [...masterPalette.colors, color];
        const previous = masterPalette.colors.slice();
        masterPalette.colors = next;
        renderSavedPalette();
        saveMasterPalette(next).catch((err) => {
          console.error(err);
          alert('Erro ao salvar cor: ' + (err.message || err));
          masterPalette.colors = previous;
          renderSavedPalette();
        });
        return;
      }
      const actionBtn = e.target.closest('[data-rt-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.rtAction;
        if (action === 'link') openLinkPicker();
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

  /* ── CREATE / EDIT FORM ───────────────────────── */
  function attachCreateForm() {
    const form = document.getElementById('createForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    const tabId = form.dataset.tab;
    const editId = form.dataset.editId || '';
    const editing = !!editId;
    const existing = editing ? entryById(editId) : null;

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
    if (tabId === 'Itens') {
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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!sb) {
        alert('Supabase não configurado. Edite assets/js/config.js com sua URL e anon key.');
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

      submitBtn.disabled = true;
      const originalLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Salvando…</span>';

      if (editing) {
        await handleEditSubmit({ existing, title, summary, tags, bodyHtml, subtype, fields });
      } else {
        await handleCreateSubmit({ title, summary, tags, bodyHtml, subtype, fields });
      }

      async function handleCreateSubmit(payload) {
        let imageUrl = '';
        let imagePath = '';
        const id = uniqueId(slugify(payload.title));
        try {
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
          alert('Erro ao salvar: ' + (err.message || err));
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
          if (imagePath) await removeBanner(imagePath);
        }
      }

      async function handleEditSubmit(payload) {
        const file = banner.getFile();
        const currentDataUrl = banner.getDataUrl();
        let nextImage = payload.existing.image || '';
        let nextImagePath = payload.existing.imagePath || '';
        let uploadedPath = '';
        const oldPathToRemove = [];

        try {
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
          alert('Erro ao salvar alterações: ' + (err.message || err));
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalLabel;
          if (uploadedPath) await removeBanner(uploadedPath);
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
    const pool = Number(root.dataset.pool) || 6;
    const max = Number(root.dataset.max) || 16;
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
    }
    function syncAll() {
      const rem = remaining();
      if (poolEl) poolEl.textContent = rem;
      rows().forEach((row) => {
        const v = valueOf(row);
        row.querySelector('[data-step="-1"]').disabled = v <= base;
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
      else if (dir < 0 && v > base) v -= 1;
      valEl.textContent = v;
      syncAll();
    });

    syncAll();

    return {
      getAllocated: allocated,
      getRemaining: remaining,
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

  /* ── FORM DA FICHA DE PERSONAGEM ──────────────── */
  function attachCharacterForm() {
    const form = document.getElementById('characterForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    const editId = form.dataset.charId || '';
    const editing = !!editId;
    const existing = editing ? characterById(editId) : null;

    const nameInput = document.getElementById('charName');
    const levelInput = document.getElementById('charLevel');
    const movementInput = document.getElementById('charMovement');
    const daAttrInput = document.getElementById('charDaAttr');
    const raceSelect = document.getElementById('charRace');
    const manaInput = document.getElementById('charMana');
    const hpForm = document.getElementById('charHpForm');
    const awakeningEl = document.getElementById('awakening');
    const submitBtn = form.querySelector('[type="submit"]');

    const banner = bindBannerDrop({ initialUrl: existing?.image || '' });
    const editor = bindEditor();
    const skills = bindSimpleListBuilder('charSkills');
    const points = bindAttributePointBuy();

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
      awakeningEl.innerHTML = awakeningPanelHTML(awakening);
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
      hpForm.querySelectorAll('[data-hp-part]').forEach((inp) => {
        inp.value = hp[inp.dataset.hpPart] != null ? hp[inp.dataset.hpPart] : '';
      });
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
      if (!sb) { alert('Supabase não configurado.'); return; }

      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        nameInput.classList.add('is-invalid');
        return;
      }
      nameInput.classList.remove('is-invalid');

      if (!awakening.resolved) {
        alert('Conclua o Despertar antes de salvar: role o destino e, se for mago, aceite ou renuncie à Mana.');
        awakeningEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const race = raceSelect.value ? entryById(raceSelect.value) : null;
      const isMageNow = awkIsAcceptedMage(awakening);
      const manaValue = isMageNow ? manaInput.value.trim() : '';

      const data = {
        name,
        raceId: raceSelect.value || '',
        raceName: race ? race.title : '',
        isMage: isMageNow,
        attributes: points.getAllocated(),
        pointPool: points.getRemaining(),
        skills: skills.getItems(),
        magic: { ...awakening },
        hp: readHp(),
        mana: manaValue,
        identity: {
          level: Math.max(1, parseInt(levelInput && levelInput.value, 10) || 1),
          movement: (movementInput && movementInput.value.trim()) || '9m',
          daAttr: CHAR_ATTRIBUTES.includes(daAttrInput && daAttrInput.value) ? daAttrInput.value : 'Destreza',
          papel: document.getElementById('charPapel').value.trim(),
          desejo: document.getElementById('charDesejo').value.trim(),
          ferida: document.getElementById('charFerida').value.trim(),
          bodyHtml: editor ? sanitizeHtml(editor.innerHTML).trim() : '',
          ownerLabel: (existing?.identity?.ownerLabel) ||
            (auth.user ? (auth.user.user_metadata?.display_name || auth.user.email || '') : '')
        },
        // Estado vivo: recalcula maxes do HP/Mana (preservando o atual) e mantém o resto.
        vitals: mergeVitals(existing && existing.vitals, readHp(), manaValue),
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
          const up = await uploadBanner(file, `characters/${auth.user.id}`);
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
          saved = await persistCharacter({ ...data, image, imagePath });
          CHARACTERS.unshift(saved);
        }

        for (const p of oldPathsToRemove) await removeBanner(p);
        location.hash = `#/Persona/${encodeURIComponent(saved.id)}`;
        render(true);
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar ficha: ' + (err.message || err));
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
        if (!confirm(`Apagar a ficha "${c.name}"? Esta ação não pode ser desfeita.`)) return;
        if (!sb) { alert('Supabase não configurado.'); return; }
        btn.disabled = true;
        try {
          await deleteCharacter(c);
          const i = CHARACTERS.indexOf(c);
          if (i >= 0) CHARACTERS.splice(i, 1);
          location.hash = '#/Persona';
        } catch (err) {
          console.error(err);
          alert('Erro ao apagar ficha: ' + (err.message || err));
          btn.disabled = false;
        }
      });
    });
  }

  /* ── FICHA VIVA: handlers (HP, status, inventário, magias) ── */
  function attachMesaGrid() {
    const root = document.querySelector('.mesa-app');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';

    const rerender = async () => {
      await saveMesaState();
      render(true);
    };

    root.querySelector('[data-mesa-config]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!mesaIsMaster()) return;
      const form = e.currentTarget;
      const width = clampNumber(form.width.value, MESA_GRID_LIMITS.minW, MESA_GRID_LIMITS.maxW, MESA_STATE.width);
      const height = clampNumber(form.height.value, MESA_GRID_LIMITS.minH, MESA_GRID_LIMITS.maxH, MESA_STATE.height);
      MESA_STATE.title = form.title.value.trim() || 'Cena ativa';
      MESA_STATE.width = width;
      MESA_STATE.height = height;
      MESA_STATE.cellSize = clampNumber(form.cellSize.value, MESA_GRID_LIMITS.minCell, MESA_GRID_LIMITS.maxCell, MESA_STATE.cellSize);
      MESA_STATE.background = form.background.value.trim() || '#101421';
      MESA_STATE.showGrid = !!form.showGrid.checked;
      MESA_STATE.allowPlayerMove = !!form.allowPlayerMove.checked;
      MESA_STATE.tokens = MESA_STATE.tokens.map((token, i) => normalizeMesaToken(token, i, MESA_STATE));
      await rerender();
    });

    root.querySelector('[data-mesa-join]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = e.currentTarget.characterId.value;
      const c = CHARACTERS.find((row) => row.id === id);
      if (!c) return;
      const existing = MESA_STATE.tokens.find((token) => token.refType === 'character' && token.refId === c.id);
      if (existing) {
        mesaSelectedTokenId = existing.id;
        render(true);
        return;
      }
      const ownerLabel = c.identity?.ownerLabel || c.name || 'Jogador';
      const token = normalizeMesaToken({
        id: mesaTokenId('char'),
        name: c.name || 'Persona',
        refType: 'character',
        refId: c.id,
        ownerId: c.userId || (auth.user && auth.user.id) || '',
        ownerLabel,
        image: c.image || '',
        color: '#ec4899',
        x: Math.min(MESA_STATE.tokens.length % MESA_STATE.width, MESA_STATE.width - 1),
        y: Math.min(Math.floor(MESA_STATE.tokens.length / MESA_STATE.width), MESA_STATE.height - 1),
        size: 1
      }, MESA_STATE.tokens.length, MESA_STATE);
      MESA_STATE.tokens.push(token);
      mesaSelectedTokenId = token.id;
      await rerender();
    });

    root.querySelector('[data-mesa-custom]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!mesaIsMaster()) return;
      const form = e.currentTarget;
      const name = form.name.value.trim();
      if (!name) {
        form.name.focus();
        return;
      }
      const token = normalizeMesaToken({
        id: mesaTokenId('custom'),
        name,
        refType: 'custom',
        color: form.color.value || MESA_DEFAULT_COLOR,
        size: form.size.value,
        x: Math.min(MESA_STATE.tokens.length % MESA_STATE.width, MESA_STATE.width - 1),
        y: Math.min(Math.floor(MESA_STATE.tokens.length / MESA_STATE.width), MESA_STATE.height - 1)
      }, MESA_STATE.tokens.length, MESA_STATE);
      MESA_STATE.tokens.push(token);
      mesaSelectedTokenId = token.id;
      await rerender();
    });

    root.querySelector('[data-mesa-beast]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!mesaIsMaster()) return;
      const id = e.currentTarget.beastId.value;
      const beast = entryById(id);
      if (!beast) return;
      const token = normalizeMesaToken({
        id: mesaTokenId('beast'),
        name: beast.title || 'Criatura',
        refType: 'beast',
        refId: beast.id,
        image: beast.image || '',
        color: '#f43f5e',
        size: 1,
        hp: itemFieldValue(beast.fields, 'HP') || '',
        x: Math.min(MESA_STATE.tokens.length % MESA_STATE.width, MESA_STATE.width - 1),
        y: Math.min(Math.floor(MESA_STATE.tokens.length / MESA_STATE.width), MESA_STATE.height - 1)
      }, MESA_STATE.tokens.length, MESA_STATE);
      MESA_STATE.tokens.push(token);
      mesaSelectedTokenId = token.id;
      await rerender();
    });

    root.addEventListener('click', async (e) => {
      const tokenBtn = e.target.closest('[data-mesa-token]');
      if (tokenBtn) {
        mesaSelectedTokenId = tokenBtn.dataset.mesaToken;
        render(true);
        return;
      }

      const cell = e.target.closest('[data-mesa-cell]');
      if (cell && mesaSelectedTokenId) {
        const token = mesaTokenById(mesaSelectedTokenId);
        if (mesaPlaceToken(token, Number(cell.dataset.x), Number(cell.dataset.y))) await rerender();
        return;
      }

      const hiddenBtn = e.target.closest('[data-mesa-token-toggle-hidden]');
      if (hiddenBtn && mesaIsMaster()) {
        const token = mesaTokenById(hiddenBtn.dataset.mesaTokenToggleHidden);
        if (token) token.hidden = !token.hidden;
        await rerender();
        return;
      }

      const lockBtn = e.target.closest('[data-mesa-token-toggle-lock]');
      if (lockBtn && mesaIsMaster()) {
        const token = mesaTokenById(lockBtn.dataset.mesaTokenToggleLock);
        if (token) token.locked = !token.locked;
        await rerender();
        return;
      }

      const removeBtn = e.target.closest('[data-mesa-token-remove]');
      if (removeBtn) {
        const token = mesaTokenById(removeBtn.dataset.mesaTokenRemove);
        if (!token) return;
        if (!(mesaIsMaster() || (auth.user && token.ownerId === auth.user.id))) return;
        MESA_STATE.tokens = MESA_STATE.tokens.filter((row) => row.id !== token.id);
        if (mesaSelectedTokenId === token.id) mesaSelectedTokenId = '';
        await rerender();
        return;
      }

      if (e.target.closest('[data-mesa-clear]') && mesaIsMaster()) {
        if (!confirm('Remover todos os tokens da cena?')) return;
        MESA_STATE.tokens = [];
        mesaSelectedTokenId = '';
        await rerender();
        return;
      }

      if (e.target.closest('[data-mesa-center]')) {
        root.querySelector('.mesa-board-wrap')?.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
      }
    });

    root.addEventListener('dragstart', (e) => {
      const tokenBtn = e.target.closest('[data-mesa-token]');
      const token = tokenBtn ? mesaTokenById(tokenBtn.dataset.mesaToken) : null;
      if (!token || !mesaCanMove(token)) {
        e.preventDefault();
        return;
      }
      mesaSelectedTokenId = token.id;
      e.dataTransfer.setData('text/plain', token.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    root.addEventListener('dragover', (e) => {
      if (e.target.closest('[data-mesa-cell]')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }
    });

    root.addEventListener('drop', async (e) => {
      const cell = e.target.closest('[data-mesa-cell]');
      if (!cell) return;
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const token = mesaTokenById(id);
      if (mesaPlaceToken(token, Number(cell.dataset.x), Number(cell.dataset.y))) {
        mesaSelectedTokenId = token.id;
        await rerender();
      }
    });
  }

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
        tabBar.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('is-active', b === btn));
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
      const card = btn.closest('.fcard');
      const out = card && card.querySelector('[data-save-result]');
      if (!out) return;
      const attr = btn.dataset.saveRoll;
      const nD6 = Math.max(1, parseInt(btn.dataset.saveDice, 10) || 1);
      const roll = rollDicePool(nD6);
      card.querySelectorAll('.res-row--roll').forEach((r) => r.classList.toggle('is-active', r === btn));
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
        catch (err) { console.error(err); if (!saveErr) { saveErr = true; alert('Não foi possível salvar a ficha: ' + (err.message || err)); } }
      }, 400);
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
      btn.textContent = 'Rerrolar DA';
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

    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-inv-focus]')) { focusAdder('charInventory', 'inv'); return; }
      if (e.target.closest('[data-spell-focus]')) { focusAdder('charSpells', 'spell'); return; }
      const hpBtn = e.target.closest('[data-hp]');
      if (hpBtn) {
        const row = hpBtn.closest('[data-part]');
        const amt = readAmt(row); if (!amt) return;
        const slot = c.vitals.hp[row.dataset.part]; if (!slot) return;
        slot.cur = hpBtn.dataset.hp === 'dmg' ? Math.max(0, slot.cur - amt) : Math.min(slot.max, slot.cur + amt);
        updateVrow(row, slot, false); save(); return;
      }
      const manaBtn = e.target.closest('[data-mana-act]');
      if (manaBtn) {
        const row = manaBtn.closest('[data-mana]');
        const amt = readAmt(row); if (!amt) return;
        const m = c.vitals.mana; if (!m) return;
        m.cur = manaBtn.dataset.manaAct === 'spend' ? Math.max(0, m.cur - amt) : Math.min(m.max, m.cur + amt);
        updateVrow(row, m, true);
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
          if (equippedCount(c) >= MAX_EQUIPPED) { alert(`Máximo de ${MAX_EQUIPPED} itens equipados.`); return; }
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
        if (mana.cur < cost && !confirm(`Mana insuficiente (${mana.cur}/${mana.max}). Gastar mesmo assim e cair a 0?`)) return;
        mana.cur = Math.max(0, mana.cur - cost);
        if ($('charVitals')) $('charVitals').innerHTML = charVitalsInner(c, true);
        if (syncArcaneCollapse(c) && $('charStatus')) $('charStatus').innerHTML = charStatusInner(c, true);
        $('charSpells').innerHTML = charCodexListInner(c, true, 'spell');
        root.querySelectorAll('.hvital--mana .hvital__v').forEach((el) => { el.innerHTML = `${mana.cur}<small>/${mana.max}</small>`; });
        root.querySelectorAll('.hvital--mana .hvbar span').forEach((el) => { el.style.width = vbarPct(mana.cur, mana.max) + '%'; });
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
    const banner = bindBannerDrop({ initialUrl: ARCHIVE.index.image || '' });
    const editor = bindEditor();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!sb) {
        alert('Supabase não configurado. Edite assets/js/config.js com sua URL e anon key.');
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
        const file = banner.getFile();
        if (file) {
          // remove imagem anterior do bucket (se houver) e sobe a nova
          if (ARCHIVE.index.imagePath) await removeBanner(ARCHIVE.index.imagePath);
          const up = await uploadBanner(file, 'index/banner');
          patch.image = up.url;
          patch.imagePath = up.path;
        }
        await persistIndexCustom(patch);
        Object.assign(ARCHIVE.index, patch, { paragraphs: [] });

        if (location.hash === '#/' || location.hash === '') {
          render(true);
        } else {
          location.hash = '#/';
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar apresentação: ' + (err.message || err));
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

  /* ── DELETE HANDLER (entradas do usuário) ────── */
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
        if (!confirm(`Apagar "${e.title}"? Esta ação não pode ser desfeita.`)) return;
        if (!sb) {
          alert('Supabase não configurado.');
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
          alert('Erro ao apagar: ' + (err.message || err));
          btn.disabled = false;
        }
      });
    });
  }

  /* ── GLOBAL SEARCH ────────────────────────────── */
  function performGlobalSearch(q) {
    const query = normalize(q);
    if (!query || query.length < 2) {
      searchResults.hidden = true;
      return;
    }
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
  function closeMobileSidebar() {
    appShell.classList.remove('is-menu-open');
    document.body.classList.remove('is-overlay-open');
  }

  function isMobileViewport() {
    return window.innerWidth <= 900;
  }

  function bindEvents() {
    window.addEventListener('hashchange', () => {
      if (isMobileViewport()) closeMobileSidebar();
      render();
    });

    menuBtn.addEventListener('click', () => {
      if (isMobileViewport()) {
        const opening = !appShell.classList.contains('is-menu-open');
        appShell.classList.toggle('is-menu-open');
        document.body.classList.toggle('is-overlay-open', opening);
      } else {
        appShell.classList.toggle('is-collapsed');
      }
    });

    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    const sidenav = document.getElementById('sidenav');
    if (sidenav) {
      sidenav.addEventListener('click', (e) => {
        if (e.target.closest('.sidenav__item') && isMobileViewport()) {
          closeMobileSidebar();
        }
      });
    }

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

  /* ── INIT ─────────────────────────────────────── */
  async function init() {
    bindEvents();

    const topbar = document.querySelector('.topbar');
    window.addEventListener('scroll', () => {
      topbar.classList.toggle('is-scrolled', window.scrollY > 12);
    }, { passive: true });

    if (intro && !document.documentElement.classList.contains('skip-intro')) {
      setTimeout(() => intro.classList.add('is-gone'), 2200);
    } else if (intro) {
      intro.style.display = 'none';
    }

    if (!sb) {
      // Sem Supabase: roda offline com defaults
      await loadMesaState();
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
      await Promise.all([loadIndexCustom(), loadUserEntries(), loadMasterPalette(), loadCharacters(), loadMesaState()]);
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
