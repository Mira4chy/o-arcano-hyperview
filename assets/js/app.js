/* ════════════════════════════════════════════════════
   O Arcano — Codex App
   Hash router + animated views + global search + criação
   ════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const ARCHIVE = window.ARCANO_ARCHIVE;
  if (!ARCHIVE) return;

  /* Categorias em que o usuário pode criar histórias */
  const CREATABLE_TABS = ['Cenarios', 'Eras', 'Sistemas', 'Mapa', 'Deuses', 'Grupos', 'Itens', 'Racas'];
  const isCreatable = (id) => CREATABLE_TABS.includes(id);

  /* Categorias com layout alternativo (imagem ao lado do dossiê).
     O aspect-ratio do banner muda por categoria. */
  const PORTRAIT_TABS = new Set(['Itens', 'Racas']);
  const isPortrait = (id) => PORTRAIT_TABS.has(id);

  const BANNER_ASPECT = {
    Itens: '4 / 3',
    Racas: '2 / 3'
  };
  function bannerAspectFor(tabId) {
    return BANNER_ASPECT[tabId] || '16 / 9';
  }
  function bannerLabelFor(tabId) {
    if (tabId === 'Itens') return { label: 'Banner (4:3)', hint: 'Proporção 4:3 (paisagem) — JPG, PNG ou WebP' };
    if (tabId === 'Racas') return { label: 'Banner (2:3)', hint: 'Proporção 2:3 (retrato) — JPG, PNG ou WebP' };
    return { label: 'Banner (16:9)', hint: 'Proporção 16:9 — JPG, PNG ou WebP' };
  }
  function bannerStyleFor(tabId) {
    if (tabId === 'Itens') return 'aspect-ratio: 4 / 3; max-width: 480px;';
    if (tabId === 'Racas') return 'aspect-ratio: 2 / 3; max-width: 360px;';
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
      fields: ['Raridade', 'Valor', 'Efeito', 'Slot']
    },
    consumivel: {
      label: 'Consumível',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>',
      fields: ['Raridade', 'Valor', 'Efeito']
    }
  };
  const ITEM_SUBTYPE_KEYS = Object.keys(ITEM_SUBTYPES);
  function subtypeFieldsFor(subtype) {
    return (ITEM_SUBTYPES[subtype] || ITEM_SUBTYPES.item).fields;
  }
  function subtypeLabel(subtype) {
    return (ITEM_SUBTYPES[subtype] || ITEM_SUBTYPES.item).label;
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
        { key: 'Raridade', type: 'rarity' },
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
        await Promise.all([loadIndexCustom(), loadUserEntries()]);
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
    Grupos:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-3.5 4.5-3.5S22 18 22 20"/></svg>',
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
    Grupos:    { hue: 250, label: 'FACÇÕES' },
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

  const tabById = (id) => ARCHIVE.tabs.find((t) => t.id === id);
  const entriesIn = (tabId) => ARCHIVE.entries.filter((e) => e.tab === tabId);
  const entryById = (id) => ARCHIVE.entries.find((e) => e.id === id);

  const themeOf = (id) => THEMES[id] || { hue: 268, label: 'CODEX' };
  const iconOf = (id) => ICONS[id] || ICONS.Index;
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
  function rowToEntry(row) {
    return {
      id: row.id,
      tab: row.tab,
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

  async function deleteUserEntry(entry) {
    if (!sb) throw new Error('Supabase não configurado');
    const { error } = await sb.from('stories').delete().eq('id', entry.id);
    if (error) throw error;
    if (entry.imagePath) await removeBanner(entry.imagePath);
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
  const ALLOWED_TAGS = new Set(['B','STRONG','I','EM','U','S','STRIKE','BR','P','DIV','SPAN','UL','OL','LI','H1','H2','H3','H4','BLOCKQUOTE']);
  const ALLOWED_ATTRS = new Set(['style']);
  const STYLE_RE = /^(color|background-color|font-weight|font-style|text-decoration|text-align)\s*:\s*[^;]+$/i;
  const COLOR_VALUE_RE = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;
  const ALIGN_VALUE_RE = /^(left|right|center|justify)$/i;

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
          // limpar atributos
          for (const attr of Array.from(child.attributes)) {
            if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
              child.removeAttribute(attr.name);
            } else if (attr.name.toLowerCase() === 'style') {
              const cleaned = attr.value.split(';')
                .map((s) => s.trim())
                .filter((s) => s && STYLE_RE.test(s))
                .join('; ');
              if (cleaned) child.setAttribute('style', cleaned);
              else child.removeAttribute('style');
            }
          }
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
    if (!raw) return { tab: 'Index', entry: null };
    const [t, ...rest] = raw.split('/').filter(Boolean);
    if (!t) return { tab: 'Index', entry: null };
    return { tab: decodeURIComponent(t), entry: rest.length ? decodeURIComponent(rest.join('/')) : null };
  }

  /* ── SIDEBAR NAV ──────────────────────────────── */
  function renderSidenav(active) {
    sidebarCount.textContent = ARCHIVE.tabs.length;
    sidenav.innerHTML = ARCHIVE.tabs.map((t) => {
      const count = t.id === 'Index' ? '' : `<span class="sidenav__count">${entriesIn(t.id).length}</span>`;
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
            const count = entriesIn(t.id).length;
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
  function viewCategory(tabId, query, selectedTag) {
    const tab = tabById(tabId);
    if (!tab) return viewNotFound(tabId);
    const theme = themeOf(tabId);
    const all = entriesIn(tabId);
    const q = normalize(query || '');
    const tag = tagKey(selectedTag || '');
    const tagStats = categoryTagStats(all);
    const list = all.filter((e) => {
      const entryTags = sanitizeTags(e.tags);
      const matchesTag = !tag || entryTags.some((t) => tagKey(t.label) === tag);
      if (!matchesTag) return false;
      if (!q) return true;
      const tagText = entryTags.map((t) => t.label).join(' ');
      const hay = [e.title, e.summary, tagText, ...(e.body || []), e.bodyHtml || '', ...Object.values(e.fields || {})].join(' ');
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
            <span class="badge"><strong>${all.length}</strong> ${all.length === 1 ? 'história' : 'histórias'}</span>
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
    return `
      <a href="#/${tabId}/criar" class="entry-card create-card" style="--hue:${theme.hue};--delay:0ms" aria-label="Criar nova história em ${escapeHtml(tabById(tabId)?.title || tabId)}">
        <div class="create-card__inner">
          <div class="create-card__plus">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </div>
          <span class="create-card__label">Criar</span>
          <span class="create-card__hint">Nova história em ${escapeHtml(tabById(tabId)?.title || tabId)}</span>
        </div>
      </a>
    `;
  }

  function entryCardHTML(e, i) {
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
          <button type="button" class="rt-btn" data-cmd="formatBlock" data-arg="H2" title="Título">H</button>
          <button type="button" class="rt-btn" data-cmd="formatBlock" data-arg="P" title="Parágrafo">¶</button>
          <span class="rt-sep"></span>
          <button type="button" class="rt-btn" data-cmd="insertUnorderedList" title="Lista">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="6" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="18" r="1" fill="currentColor"/><path d="M10 6h11M10 12h11M10 18h11"/></svg>
          </button>
          <button type="button" class="rt-btn" data-cmd="justifyLeft" title="Alinhar à esquerda">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h12M3 18h18"/></svg>
          </button>
          <button type="button" class="rt-btn" data-cmd="justifyCenter" title="Centralizar">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M6 12h12M3 18h18"/></svg>
          </button>
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
          <span class="rt-sep"></span>
          <button type="button" class="rt-btn" data-cmd="removeFormat" title="Limpar formatação">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l14 14M5 19l8-8M11 5h8l-3 8"/></svg>
          </button>
        </div>
        <div class="rt-editor" id="rtEditor" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Conte sua história...">${initialHtml ? sanitizeHtml(initialHtml) : ''}</div>
      </div>
    `;
  }

  /* ── CREATE VIEW ──────────────────────────────── */
  function viewCreate(tabId) {
    if (!auth.isAdmin) return viewForbidden();
    const tab = tabById(tabId);
    if (!tab || !isCreatable(tabId)) return viewNotFound(tabId);
    const theme = themeOf(tabId);
    const portrait = isPortrait(tabId);
    const isItens = tabId === 'Itens';
    const isRacas = tabId === 'Racas';

    const banner = bannerLabelFor(tabId);
    const bannerStyle = bannerStyleFor(tabId);
    const titleLabel = (isItens || isRacas) ? 'Nome' : 'Título';
    const titlePlaceholder = isItens ? 'Nome do item' : (isRacas ? 'Nome da raça' : 'Dê um nome à sua história');
    const summaryPlaceholder = `Uma frase curta que descreve ${isItens ? 'o item' : (isRacas ? 'a raça' : 'a história')}`;
    const descLabel = (isItens || isRacas) ? 'Descrição' : 'Texto';
    const saveLabel = isItens ? 'Salvar item' : (isRacas ? 'Salvar raça' : 'Salvar história');
    const heroSubtitle = isItens
      ? 'Escolha o tipo, anexe uma imagem 4:3 e preencha o dossiê.'
      : isRacas
        ? 'Anexe uma imagem 2:3, preencha as três seções do dossiê e descreva a raça.'
        : 'Preencha o banner, o título e o relato. Use a barra de ferramentas para formatar e colorir o texto.';
    const heroH1 = isItens ? 'Novo item em ' : (isRacas ? 'Nova raça em ' : 'Nova história em ');

    return `
      <section class="cat-hero" style="--hue:${theme.hue}">
        <div class="cat-hero__icon">${iconOf(tabId)}</div>
        <div class="cat-hero__body">
          <span class="cat-hero__eyebrow">CRIAR · ${escapeHtml(theme.label)}</span>
          <h1 class="cat-hero__title">${heroH1}${escapeHtml(tab.title)}</h1>
          <p class="cat-hero__tone">${escapeHtml(heroSubtitle)}</p>
        </div>
      </section>

      <form class="create-form ${portrait ? 'create-form--portrait' : ''}" id="createForm" data-tab="${escapeHtml(tabId)}" style="--hue:${theme.hue}" novalidate>
        ${isItens ? `
        <div class="create-form__field">
          <label class="create-form__label">Tipo</label>
          <div class="subtype-tabs" id="subtypeTabs" role="tablist">
            ${ITEM_SUBTYPE_KEYS.map((key, i) => `
              <button type="button" class="subtype-tab ${i === 0 ? 'is-active' : ''}" data-subtype="${key}" role="tab">
                <span class="subtype-tab__icon">${ITEM_SUBTYPES[key].icon}</span>
                <span class="subtype-tab__label">${escapeHtml(ITEM_SUBTYPES[key].label)}</span>
              </button>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="create-form__field">
          <label class="create-form__label">${escapeHtml(banner.label)}</label>
          <div class="banner-drop ${portrait ? 'banner-drop--portrait' : ''}" id="bannerDrop"
               style="${bannerStyle}"
               tabindex="0" role="button" aria-label="Selecionar imagem do banner">
            <input type="file" accept="image/*" id="bannerInput" hidden>
            <div class="banner-drop__preview" id="bannerPreview" hidden></div>
            <div class="banner-drop__placeholder" id="bannerPlaceholder">
              <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="M21 17l-5-5-9 9"/></svg>
              <strong>Clique ou arraste uma imagem</strong>
              <span>${escapeHtml(banner.hint)}</span>
            </div>
            <button type="button" class="banner-drop__clear" id="bannerClear" hidden aria-label="Remover imagem">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="titleInput">${escapeHtml(titleLabel)}</label>
          <input type="text" id="titleInput" class="create-form__input" placeholder="${escapeHtml(titlePlaceholder)}" maxlength="120" required>
        </div>

        <div class="create-form__field">
          <label class="create-form__label" for="summaryInput">Resumo (opcional)</label>
          <input type="text" id="summaryInput" class="create-form__input" placeholder="${escapeHtml(summaryPlaceholder)}" maxlength="200">
        </div>

        ${isItens ? `
        <div class="create-form__field">
          <label class="create-form__label">Dossiê</label>
          <div class="dossier-fields" id="dossierFields"></div>
        </div>
        ` : ''}

        ${isRacas ? `
        <div class="create-form__field">
          <label class="create-form__label">Dossiê</label>
          ${raceDossierFormHTML({})}
        </div>
        ` : ''}

        <div class="create-form__field">
          <label class="create-form__label">Tags</label>
          <div class="tag-builder" id="tagBuilder">
            <div class="tag-builder__row">
              <input type="text" id="tagNameInput" class="create-form__input tag-builder__name" placeholder="Ex.: Tempo, Fome, Reino" maxlength="32">
              <label class="tag-builder__color" title="Cor da tag">
                <span id="tagColorPreview" style="background:${DEFAULT_TAG_COLOR}"></span>
                <input type="color" id="tagColorInput" value="${DEFAULT_TAG_COLOR}" aria-label="Cor da tag">
              </label>
              <button type="button" class="btn btn-ghost tag-builder__add" id="tagAddBtn">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span>Adicionar</span>
              </button>
            </div>
            <div class="tag-builder__list" id="tagList" aria-live="polite"></div>
          </div>
        </div>

        <div class="create-form__field">
          <label class="create-form__label">${escapeHtml(descLabel)}</label>
          ${editorToolbarHTML()}
        </div>

        <div class="create-form__actions">
          <a href="#/${tabId}" class="btn btn-ghost">Cancelar</a>
          <button type="submit" class="btn btn-primary" id="createSave">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            <span>${escapeHtml(saveLabel)}</span>
          </button>
        </div>
      </form>
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

    function dossierValueHTML(key, value) {
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
      if (!fields.length) return '';
      return `
        <aside class="entry__dossier-side">
          <header class="entry__dossier-head">
            ${subtypeIcon ? `<span class="entry__dossier-icon" aria-hidden="true">${subtypeIcon}</span>` : ''}
            <div>
              <span class="section__eyebrow">DOSSIÊ</span>
              ${subtypeName ? `<span class="entry__dossier-subtype">${escapeHtml(subtypeName)}</span>` : ''}
            </div>
          </header>
          <dl class="meta-list">
            ${fields.map(([k, v]) => `
              <div class="meta-row">
                <dt>${escapeHtml(k)}</dt>
                <dd>${dossierValueHTML(k, v)}</dd>
              </div>
            `).join('')}
          </dl>
        </aside>
      `;
    }

    function renderRaceDossierView(rawFields) {
      const data = rawFields || {};
      return `
        <div class="race-dossier-view">
          ${RACE_SECTIONS.map((section) => {
            if (section.id === 'hpmp') {
              const hasAny = RACE_HP_PARTS.some((p) => data[p]) || data['Mana'];
              if (!hasAny) return '';
              return `
                <aside class="entry__dossier-side dossier-card--hpmp">
                  <header class="entry__dossier-head">
                    <span class="section__eyebrow">${escapeHtml(section.title.toUpperCase())}</span>
                  </header>
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
                      <span class="mana-callout__label">MANA</span>
                      <strong class="mana-callout__value">${escapeHtml(data['Mana'])}</strong>
                    </div>
                  ` : ''}
                </aside>
              `;
            }
            const visible = section.fields.filter((f) => {
              const v = data[f.key];
              if (f.type === 'list') return Array.isArray(v) && v.length > 0;
              return v != null && v !== '';
            });
            if (!visible.length) return '';
            return `
              <aside class="entry__dossier-side">
                <header class="entry__dossier-head">
                  <span class="section__eyebrow">${escapeHtml(section.title.toUpperCase())}</span>
                </header>
                <dl class="meta-list">
                  ${visible.map((f) => {
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
                </dl>
              </aside>
            `;
          }).join('')}
        </div>
      `;
    }

    const dossierMarkup = isRacas
      ? renderRaceDossierView(e.fields)
      : renderItensDossier();

    const heroPortrait = `
      <div class="entry__portrait-card ${isRacas ? 'entry__portrait-card--tall' : ''}" style="--hue:${theme.hue}">
        ${subtypeIcon ? `<div class="entry__subtype-emblem" aria-hidden="true">${subtypeIcon}</div>` : ''}
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
            ${tags.length
              ? tags.map((tag) => tagChipHTML(tag, 'story-tag story-tag--hero')).join('')
              : (subtypeName ? '' : `<span class="entry__cat">${escapeHtml(theme.label)}</span>`)}
          </div>
          <h1 class="entry__title entry__title--portrait" data-text-reveal>${escapeHtml(e.title)}</h1>
          ${e.summary ? `<p class="entry__summary">${escapeHtml(e.summary)}</p>` : ''}
        </header>
        <div class="entry__portrait-grid">
          <div class="entry__portrait" style="aspect-ratio: ${bannerAspectFor(tabId)};">
            ${e.image ? `<img class="entry__portrait-img" src="${e.image}" alt="" onerror="this.parentElement.classList.add('is-fallback')">` : ''}
            <div class="entry__portrait-fallback">${iconOf(tabId)}</div>
            <div class="entry__portrait-shine" aria-hidden="true"></div>
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

    const deleteButton = (e.isUserCreated && auth.isAdmin) ? `
      <button type="button" class="back-link back-link--danger" data-delete-entry="${escapeHtml(e.id)}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        Apagar ${tabId === 'Itens' ? 'item' : 'história'}
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
            ${deleteButton}
            ${backLink}
          </aside>
        </div>
      </article>
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
  function render(force) {
    const { tab, entry } = parseHash();
    const routeKey = `${tab}|${entry || ''}`;
    if (!force && routeKey === lastRoute) return;
    lastRoute = routeKey;

    renderSidenav(tab);

    let html;
    if (tab === 'Index' && !entry) html = viewHome();
    else if (tab === 'Index' && entry === 'editar') html = viewEditIndex();
    else if (entry === 'criar') html = viewCreate(tab);
    else if (entry) html = viewEntry(tab, entry);
    else {
      const state = categoryState[tab] || {};
      html = viewCategory(tab, state.query || '', state.tag || '');
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
        attachEditIndexForm();
        attachIndexEditButton();
        attachDeleteHandlers();
      });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 180);
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
    if (!input && !tagButtons.length) return;

    const refreshCategory = ({ keepFocus = false, cursor = null } = {}) => {
      const { tab } = parseHash();
      const state = categoryState[tab] || {};
      view.innerHTML = viewCategory(tab, state.query || '', state.tag || '');
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

  function bindTagBuilder() {
    const root = document.getElementById('tagBuilder');
    if (!root) return { getTags: () => [] };

    const nameInput = document.getElementById('tagNameInput');
    const colorInput = document.getElementById('tagColorInput');
    const colorPreview = document.getElementById('tagColorPreview');
    const addBtn = document.getElementById('tagAddBtn');
    const list = document.getElementById('tagList');
    let tags = [];

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

    function addTag() {
      const label = cleanTagLabel(nameInput.value);
      if (!label) {
        nameInput.focus();
        return;
      }
      const key = tagKey(label);
      const existing = tags.find((tag) => tagKey(tag.label) === key);
      if (existing) existing.color = safeTagColor(colorInput.value);
      else if (tags.length < 8) tags.push({ label, color: safeTagColor(colorInput.value) });
      else {
        alert('Use no máximo 8 tags por história.');
        return;
      }
      nameInput.value = '';
      renderTags();
      nameInput.focus();
    }

    colorInput.addEventListener('input', () => {
      colorPreview.style.background = safeTagColor(colorInput.value);
    });
    addBtn.addEventListener('click', addTag);
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    });
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove-tag]');
      if (!btn) return;
      tags.splice(Number(btn.dataset.removeTag), 1);
      renderTags();
    });

    renderTags();
    return { getTags: () => sanitizeTags(tags) };
  }

  /* Dossier dinâmico para a categoria Itens (subtype + campos). */
  function bindDossierFields() {
    const tabs = document.getElementById('subtypeTabs');
    const wrap = document.getElementById('dossierFields');
    if (!tabs || !wrap) return { getFields: () => ({}), getSubtype: () => null };

    let current = ITEM_SUBTYPE_KEYS[0];
    const cache = {};
    Object.keys(ITEM_SUBTYPES).forEach((k) => {
      cache[k] = {};
      ITEM_SUBTYPES[k].fields.forEach((f) => { cache[k][f] = ''; });
    });

    function placeholderFor(field) {
      switch (field) {
        case 'Valor': return 'Ex.: 30 moedas, Inestimável';
        case 'Efeito': return 'O que ele faz quando usado';
        case 'Slot': return 'Cabeça, Mão, Peito, Anel…';
        default: return field;
      }
    }

    function readValue(el) {
      if (!el) return '';
      if (el.classList && el.classList.contains('rarity-picker')) return el.dataset.value || '';
      return (el.value || '').toString();
    }

    function persistCurrent() {
      wrap.querySelectorAll('[data-dossier-field]').forEach((el) => {
        const k = el.dataset.dossierField;
        if (cache[current]) cache[current][k] = readValue(el);
      });
    }

    function fieldHTML(field) {
      const value = cache[current][field] || '';
      if (field === 'Raridade') {
        return `
          <div class="dossier-field">
            <span>${escapeHtml(field)}</span>
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
          <span>${escapeHtml(field)}</span>
          <input type="text" class="create-form__input" data-dossier-field="${escapeHtml(field)}"
                 placeholder="${escapeHtml(placeholderFor(field))}"
                 value="${escapeHtml(value)}" maxlength="160">
        </label>
      `;
    }

    function render() {
      persistCurrent();
      const fields = subtypeFieldsFor(current);
      wrap.innerHTML = fields.map(fieldHTML).join('');
    }

    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.subtype-tab');
      if (!btn) return;
      tabs.querySelectorAll('.subtype-tab').forEach((b) => b.classList.toggle('is-active', b === btn));
      current = btn.dataset.subtype;
      render();
    });

    // Delegacao: clique nos chips de raridade.
    wrap.addEventListener('click', (e) => {
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

    render();

    return {
      getSubtype: () => current,
      getFields: () => {
        const out = {};
        wrap.querySelectorAll('[data-dossier-field]').forEach((el) => {
          const v = readValue(el).trim();
          if (v) out[el.dataset.dossierField] = v;
        });
        return out;
      }
    };
  }

  /* Dossier sectioned (Racas): 3 secoes com diferentes tipos de campo. */
  function raceDossierFormHTML(values) {
    const v = values || {};
    return `
      <div class="race-dossier" id="raceDossier">
        ${RACE_SECTIONS.map((section) => `
          <div class="dossier-section">
            <header class="dossier-section__head">
              <span class="section__eyebrow">${escapeHtml(section.title.toUpperCase())}</span>
            </header>
            ${section.id === 'hpmp'
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
    if (field.type === 'rarity') {
      return `
        <div class="dossier-field">
          <span>${escapeHtml(field.key)}</span>
          <div class="rarity-picker" data-dossier-field="${escapeHtml(field.key)}" data-value="${escapeHtml(v)}" role="radiogroup" aria-label="${escapeHtml(field.key)}">
            ${RARITY_OPTIONS.map((opt) => `
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

  function bindRaceDossier() {
    const root = document.getElementById('raceDossier');
    if (!root) return { getFields: () => ({}) };

    function readListItems(builder) {
      try { return JSON.parse(builder.dataset.items || '[]') || []; } catch { return []; }
    }

    function refreshListItems(builder, items) {
      builder.dataset.items = JSON.stringify(items);
      const list = builder.querySelector('.list-builder__items');
      list.innerHTML = items.map((item, i) => listBuilderItemHTML(item, i)).join('');
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
      }
    });

    root.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('list-builder__input') && e.key === 'Enter') {
        e.preventDefault();
        addItemFrom(e.target);
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
        return out;
      }
    };
  }

  function bindEditor() {
    const editor = document.getElementById('rtEditor');
    const toolbar = document.getElementById('editorToolbar');
    const colorInput = document.getElementById('rtColor');
    const colorSwatch = document.getElementById('rtColorSwatch');
    if (!editor || !toolbar) return null;

    /* Configurar editor: <p> ao pressionar Enter */
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}

    toolbar.addEventListener('mousedown', (e) => {
      if (e.target.closest('input[type="color"]')) return;
      e.preventDefault();
    });
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.rt-btn');
      if (btn) {
        const cmd = btn.dataset.cmd;
        const arg = btn.dataset.arg || null;
        editor.focus();
        document.execCommand(cmd, false, arg);
        return;
      }
      const swatch = e.target.closest('.rt-swatch');
      if (swatch) {
        const color = swatch.dataset.color;
        editor.focus();
        document.execCommand('foreColor', false, color);
        colorInput.value = color;
        colorSwatch.style.background = color;
      }
    });
    colorInput.addEventListener('input', (e) => {
      colorSwatch.style.background = e.target.value;
      editor.focus();
      document.execCommand('foreColor', false, e.target.value);
    });

    return editor;
  }

  /* ── CREATE FORM ──────────────────────────────── */
  function attachCreateForm() {
    const form = document.getElementById('createForm');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';

    const tabId = form.dataset.tab;
    const titleInput = document.getElementById('titleInput');
    const summaryInput = document.getElementById('summaryInput');
    const submitBtn = form.querySelector('[type="submit"]');
    const banner = bindBannerDrop();
    const tagBuilder = bindTagBuilder();
    const editor = bindEditor();
    let dossier;
    if (tabId === 'Itens') {
      dossier = bindDossierFields();
    } else if (tabId === 'Racas') {
      const r = bindRaceDossier();
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
      const baseId = slugify(title);
      const id = uniqueId(baseId);

      submitBtn.disabled = true;
      const originalLabel = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Salvando…</span>';

      let imageUrl = '';
      let imagePath = '';
      try {
        const file = banner.getFile();
        if (file) {
          const up = await uploadBanner(file, `stories/${id}`);
          imageUrl = up.url;
          imagePath = up.path;
        }
        const subtype = dossier.getSubtype();
        const fields = dossier.getFields();
        const newEntry = {
          id, tab: tabId, title, summary,
          image: imageUrl, imagePath, bodyHtml, tags,
          subtype, fields,
          createdAt: Date.now(), isUserCreated: true
        };
        await persistUserEntry(newEntry);
        ARCHIVE.entries.push(newEntry);
        location.hash = `#/${tabId}/${id}`;
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar a história: ' + (err.message || err));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalLabel;
        if (imagePath) await removeBanner(imagePath);
      }
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
      const hay = [e.title, e.summary, tagText, ...(e.body || []), e.bodyHtml || '', ...Object.values(e.fields || {})].join(' ');
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
  function bindEvents() {
    window.addEventListener('hashchange', () => render());

    menuBtn.addEventListener('click', () => {
      appShell.classList.toggle('is-collapsed');
    });

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
