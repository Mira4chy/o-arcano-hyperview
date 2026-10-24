(() => {
  'use strict';

  const events = [
    {
      id: 'first-name', left: 8, eraIndex: 0, title: 'Antes do Primeiro Nome', short: 'Antes do Primeiro Nome',
      date: 'Antes do calendário', era: 'Azul do Velho Mundo', type: 'Origem', reality: 'CÂNONE',
      summary: 'Quando o mundo ainda não possuía nomes, uma escolha transformou a memória em matéria e abriu o primeiro caminho para a magia.',
      image: 'assets/images/hero-arcano.webp'
    },
    {
      id: 'blue-pact', left: 17, eraIndex: 0, title: 'O Pacto Azul', short: 'O Pacto Azul',
      date: 'Ano I da Memória', era: 'Azul do Velho Mundo', type: 'Pacto', reality: 'CÂNONE',
      summary: 'As primeiras vozes juraram que nenhum nome seria apagado novamente. O juramento se tornou a primeira lei do mundo.',
      image: 'assets/images/login-cosmos-base.webp'
    },
    {
      id: 'ashen-crown', left: 29, eraIndex: 1, title: 'A Coroa das Cinzas', short: 'A Coroa das Cinzas',
      date: 'Terceiro século', era: 'Terra Média', type: 'Ascensão', reality: 'CÂNONE',
      summary: 'Sete casas queimaram seus brasões para erguer um único reino. Nas cinzas, encontraram algo que não deveria ter sobrevivido.',
      image: 'assets/images/race-anatomy-abstract.webp'
    },
    {
      id: 'refractory', left: 38, eraIndex: 1, title: 'Refratário', short: 'Refratário',
      date: 'Ano 412', era: 'Terra Média', type: 'Guerra', reality: 'CÂNONE',
      summary: 'Um exército marchou esperando uma guerra fácil, mas encontrou apenas um Draconato — e isso foi suficiente para condená-los.',
      image: 'assets/images/race-anatomy-abstract.webp'
    },
    {
      id: 'under-ice', left: 48, eraIndex: 2, title: 'Sob o Gelo', short: 'Sob o Gelo',
      date: 'Ano 638', era: 'Tempos Modernos', type: 'Descoberta', reality: 'CÂNONE',
      summary: 'Uma expedição é assombrada por desaparecimentos sob o gelo e descobre um povo oculto nas águas profundas.',
      image: 'assets/images/login-cosmos-nebula.webp'
    },
    {
      id: 'great-blue', left: 58, eraIndex: 2, title: 'O Grande Azul', short: 'O Grande Azul',
      date: 'Ano 701', era: 'Tempos Modernos', type: 'Expedição', reality: 'CÂNONE',
      summary: 'Uma cidade afogada ressurge por uma noite. O que ainda vive sob ela reconhece os visitantes como antigos inimigos.',
      image: 'assets/images/hero-arcano.webp'
    },
    {
      id: 'no-light', left: 69, eraIndex: 3, title: 'Onde a Luz Não Alcança', short: 'Onde a Luz Não Alcança',
      date: 'Décimo inverno sem sol', era: 'Pós-Modernismo', type: 'Catástrofe', reality: 'CÂNONE',
      summary: 'Numa cidade sem amanhecer, os sobreviventes descobrem que a escuridão não é ausência, mas algo que aprendeu a observá-los.',
      image: 'assets/images/hero-arcano.webp'
    },
    {
      id: 'last-dawn', left: 80, eraIndex: 3, title: 'O Último Amanhecer', short: 'O Último Amanhecer',
      date: 'Ano zero', era: 'Pós-Modernismo', type: 'Ruptura de era', reality: 'CÂNONE',
      summary: 'A última luz natural tocou o mundo por sete minutos. Depois dela, até as sombras passaram a ter fome.',
      image: 'assets/images/login-cosmos-foreground.webp'
    },
    {
      id: 'silence', left: 91, eraIndex: 4, title: 'O Silêncio Depois dos Deuses', short: 'O Silêncio dos Deuses',
      date: 'Depois da contagem', era: 'Apocalipse', type: 'Fim', reality: 'CÂNONE',
      summary: 'Quando o último altar se partiu, ninguém ouviu um grito. O silêncio foi a única confirmação de que os deuses haviam partido.',
      image: 'assets/images/login-cosmos-base.webp'
    },
    {
      id: 'ritual-worked', left: 44, eraIndex: 2, lane: 1, title: 'O Ritual Funcionou', short: 'O Ritual Funcionou',
      date: 'Divergência · Ano 412', era: 'Tempos Modernos', type: 'Realidade alternativa', reality: 'E SE O RITUAL TIVESSE FUNCIONADO?',
      summary: 'Nesta realidade, a muralha arcana jamais caiu. O reino sobreviveu — e o preço foi transformar cada habitante em parte do encantamento.',
      image: 'assets/images/login-cosmos-nebula.webp'
    },
    {
      id: 'nameless-world', left: 72, eraIndex: 3, lane: 2, title: 'O Mundo sem Primeiro Nome', short: 'O Mundo sem Nome',
      date: 'Divergência · Décimo inverno', era: 'Pós-Modernismo', type: 'Realidade alternativa', reality: 'O MUNDO SEM PRIMEIRO NOME',
      summary: 'A memória deixou de reconhecer pessoas e lugares. Sem nomes, o próprio mundo começou a dissolver suas fronteiras.',
      image: 'assets/images/race-anatomy-abstract.webp'
    }
  ];

  const eraMeta = [
    ['Azul do Velho Mundo', 'O princípio sem nome'],
    ['Terra Média', 'Reinos sob cinzas'],
    ['Tempos Modernos', 'A fome das máquinas'],
    ['Pós-Modernismo', 'O mundo fragmentado'],
    ['Apocalipse', 'Depois da última luz']
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selectedIndex = 0;
  let toastTimer = 0;

  function showToast(message) {
    const toast = $('#labToast');
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2800);
  }

  function switchView(name, options = {}) {
    $$('[data-view-panel]').forEach((panel) => {
      const active = panel.dataset.viewPanel === name;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    $$('[data-view]').forEach((tab) => {
      const active = tab.dataset.view === name;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    if (name !== 'reader') {
      document.body.classList.remove('is-focus-reading');
      $('#focusReader')?.setAttribute('aria-pressed', 'false');
    }
    if (options.scroll !== false) scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => $(`[data-view-panel="${name}"] h1`)?.focus?.({ preventScroll: true }), 20);
  }

  $$('[data-view]').forEach((tab) => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const tabs = $$('[data-view]');
      const current = tabs.indexOf(tab);
      const next = event.key === 'ArrowRight' ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    });
  });
  $$('[data-switch-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.switchView)));

  function eventButton(event, index) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `event-node${event.lane ? ' is-branch' : ''}${event.lane === 2 ? ' branch-level-two' : ''}`;
    button.style.setProperty('--left', `${event.left}%`);
    button.dataset.short = event.short;
    button.dataset.eventIndex = String(index);
    button.setAttribute('aria-label', `${event.title}. ${event.date}. ${event.reality === 'CÂNONE' ? 'Acontecimento canônico' : event.reality}`);
    button.addEventListener('pointerenter', () => selectEvent(index, { focus: false }));
    button.addEventListener('focus', () => selectEvent(index, { focus: false }));
    button.addEventListener('click', () => selectEvent(index, { focus: false }));
    button.addEventListener('keydown', (keyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(keyboardEvent.key)) return;
      keyboardEvent.preventDefault();
      const direction = ['ArrowRight', 'ArrowDown'].includes(keyboardEvent.key) ? 1 : -1;
      moveEvent(direction, true);
    });
    return button;
  }

  function renderTimeline() {
    const root = $('#timelineNodes');
    events.forEach((event, index) => root.appendChild(eventButton(event, index)));

    const mobile = $('#mobileChronicle');
    eraMeta.forEach(([name, tone], eraIndex) => {
      const section = document.createElement('section');
      section.className = 'mobile-era';
      const heading = document.createElement('header');
      heading.innerHTML = `<b>${String(eraIndex + 1).padStart(2, '0')}</b><div><strong>${name}</strong><small>${tone}</small></div>`;
      const list = document.createElement('div');
      list.className = 'mobile-events';
      events.filter((event) => event.eraIndex === eraIndex).forEach((event) => {
        const index = events.indexOf(event);
        const article = document.createElement('article');
        article.className = `mobile-event${event.lane ? ' is-branch' : ''}`;
        article.dataset.mobileEvent = String(index);

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'mobile-event__trigger';
        trigger.setAttribute('aria-expanded', 'false');
        trigger.innerHTML = `<span>${event.date}</span><span><strong>${event.title}</strong><small>${event.reality}</small></span>`;

        const details = document.createElement('div');
        details.className = 'mobile-event__details';
        details.hidden = true;
        details.innerHTML = `<em>${event.summary}</em><button class="mobile-event__read" type="button">Ler acontecimento <span aria-hidden="true">→</span></button>`;

        trigger.addEventListener('click', () => {
          const expanded = trigger.getAttribute('aria-expanded') === 'true';
          $$('.mobile-event').forEach((item) => {
            item.classList.remove('is-expanded');
            $('.mobile-event__trigger', item).setAttribute('aria-expanded', 'false');
            $('.mobile-event__details', item).hidden = true;
          });
          article.classList.toggle('is-expanded', !expanded);
          trigger.setAttribute('aria-expanded', String(!expanded));
          details.hidden = expanded;
          selectEvent(index, { focus: false });
        });
        $('.mobile-event__read', details).addEventListener('click', () => {
          selectEvent(index, { focus: false });
          openSelectedStory();
        });
        article.append(trigger, details);
        list.appendChild(article);
      });
      section.append(heading, list);
      mobile.appendChild(section);
    });
  }

  function selectEvent(index, options = {}) {
    selectedIndex = (index + events.length) % events.length;
    const event = events[selectedIndex];
    $$('.event-node').forEach((node) => node.classList.toggle('is-active', Number(node.dataset.eventIndex) === selectedIndex));
    $('#previewDate').textContent = event.date;
    $('#previewTitle').textContent = event.title;
    $('#previewSummary').textContent = event.summary;
    $('#previewEra').textContent = event.era;
    $('#previewType').textContent = event.type;
    $('#previewReality').textContent = event.reality;
    const previewImage = $('.event-preview__art img');
    previewImage.style.opacity = '.35';
    previewImage.src = event.image;
    previewImage.onload = () => { previewImage.style.opacity = '1'; };
    $$('.era-jump button').forEach((button, eraIndex) => button.classList.toggle('is-active', eraIndex === event.eraIndex));
    if (options.focus) $(`.event-node[data-event-index="${selectedIndex}"]`)?.focus();
  }

  function moveEvent(direction, focus = false) {
    const branchesVisible = $('#branchToggle').getAttribute('aria-pressed') === 'true';
    const visible = events.map((event, index) => ({ event, index })).filter(({ event }) => branchesVisible || !event.lane);
    const currentVisibleIndex = visible.findIndex((item) => item.index === selectedIndex);
    const next = visible[(currentVisibleIndex + direction + visible.length) % visible.length];
    selectEvent(next.index, { focus });
    const viewport = $('#timelineViewport');
    const node = $(`.event-node[data-event-index="${next.index}"]`);
    if (node && viewport) viewport.scrollTo({ left: Math.max(0, node.offsetLeft - viewport.clientWidth / 2), behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  $('#timelineBack').addEventListener('click', () => moveEvent(-1, true));
  $('#timelineNext').addEventListener('click', () => moveEvent(1, true));
  $('#branchToggle').addEventListener('click', (event) => {
    const button = event.currentTarget;
    const visible = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(visible));
    $('#timelinePlot').classList.toggle('branches-hidden', !visible);
    $$('.event-node.is-branch').forEach((item) => {
      item.hidden = !visible;
      item.tabIndex = visible ? 0 : -1;
    });
    $$('.mobile-event.is-branch').forEach((item) => { item.hidden = !visible; });
    if (!visible && events[selectedIndex].lane) selectEvent(0);
    showToast(visible ? 'Realidades alternativas reveladas.' : 'Exibindo somente a linha canônica.');
  });

  $$('.era-jump button').forEach((button) => {
    button.addEventListener('click', () => {
      const eraIndex = Number(button.dataset.eraJump);
      const first = events.findIndex((event) => event.eraIndex === eraIndex && !event.lane);
      selectEvent(first, { focus: true });
      const viewport = $('#timelineViewport');
      const event = events[first];
      viewport.scrollTo({ left: Math.max(0, ($('#timelinePlot').scrollWidth * event.left / 100) - viewport.clientWidth / 2), behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  function updateReaderForEvent(event) {
    $('#readerCover').src = event.image;
    $('#readerCover').alt = `Imagem de abertura de ${event.title}`;
    $('#readerEra').textContent = event.era.toUpperCase();
    $('#readerDate').textContent = event.date;
    $('#readerTitle').textContent = event.title;
    $('#readerSummary').textContent = event.summary;
    $('#readerContextEra').textContent = event.era;
    $('#readerContextDate').textContent = event.date;
  }

  function openSelectedStory() {
    updateReaderForEvent(events[selectedIndex]);
    switchView('reader');
  }
  $('#openStory').addEventListener('click', openSelectedStory);

  /* Studio */
  const stepNames = ['Identidade', 'Contexto', 'Relato', 'Revisão'];
  const stepSections = $$('#storyStudio [data-step-section]');
  function setStudioStep(index, shouldScroll = true) {
    const safeIndex = Math.max(0, Math.min(stepNames.length - 1, index));
    $$('.studio-steps [data-studio-step]').forEach((button, buttonIndex) => {
      const active = safeIndex === buttonIndex;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#studioProgress').style.width = `${(safeIndex + 1) * 25}%`;
    $('#studioStepLabel').textContent = `Etapa ${safeIndex + 1} de 4 · ${stepNames[safeIndex]}`;
    if (shouldScroll) stepSections[safeIndex].scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
  $$('.studio-steps [data-studio-step]').forEach((button) => button.addEventListener('click', () => setStudioStep(Number(button.dataset.studioStep))));

  const studioObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setStudioStep(Number(visible.target.dataset.stepSection), false);
  }, { rootMargin: '-25% 0px -55% 0px', threshold: [0, .2, .5] });
  stepSections.forEach((section) => studioObserver.observe(section));

  let saveTimer = 0;
  function indicateChange() {
    const indicator = $('#draftIndicator');
    indicator.classList.add('is-saving');
    $('strong', indicator).textContent = 'Salvando rascunho…';
    $('small', indicator).textContent = 'Somente neste protótipo';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      indicator.classList.remove('is-saving');
      $('strong', indicator).textContent = 'Rascunho local salvo';
      $('small', indicator).textContent = 'Nada foi enviado ao site';
    }, 700);
  }
  $('#storyStudio').addEventListener('input', indicateChange);
  $('#storyStudio').addEventListener('change', indicateChange);

  $('#storySummary').addEventListener('input', (event) => {
    $('#summaryCount').textContent = `${event.target.value.length} de 240 caracteres`;
  });
  $('#storyTitle').addEventListener('input', (event) => {
    event.target.classList.remove('is-invalid');
    $('#studioError').hidden = true;
  });
  $('#storyEra').addEventListener('change', (event) => {
    $('#reviewTimeline').textContent = event.target.value;
  });

  function previewFile(input, image) {
    const file = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    image.src = url;
    image.onload = () => URL.revokeObjectURL(url);
  }
  $('#coverInput').addEventListener('change', (event) => previewFile(event.target, $('#coverPreview img')));

  function makeHandle(label = 'Opções do bloco') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'block-handle';
    button.setAttribute('aria-label', label);
    button.innerHTML = '<span></span><span></span><span></span>';
    return button;
  }

  function appendTextBlock(type) {
    let block;
    if (type === 'heading') {
      block = document.createElement('div');
      block.className = 'story-block story-block--heading';
      const heading = document.createElement('h2');
      heading.contentEditable = 'true';
      heading.textContent = 'Novo capítulo';
      block.append(makeHandle(), heading);
    } else if (type === 'quote') {
      block = document.createElement('blockquote');
      block.className = 'story-block story-block--quote';
      block.contentEditable = 'true';
      block.textContent = 'Escreva aqui uma voz que merece permanecer.';
    } else if (type === 'divider') {
      block = document.createElement('div');
      block.className = 'story-block story-block--divider';
      block.setAttribute('aria-label', 'Divisor de seção');
      block.textContent = '◇';
    } else {
      block = document.createElement('div');
      block.className = 'story-block story-block--text';
      const paragraph = document.createElement('p');
      paragraph.contentEditable = 'true';
      paragraph.textContent = 'Continue a história…';
      block.append(makeHandle(), paragraph);
    }
    $('#blockEditor').appendChild(block);
    block.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    block.querySelector('[contenteditable="true"]')?.focus();
    indicateChange();
  }

  function appendImageBlock(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const figure = document.createElement('figure');
    figure.className = 'story-block story-block--image';
    const image = document.createElement('img');
    image.src = url;
    image.alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    image.onload = () => URL.revokeObjectURL(url);
    const caption = document.createElement('figcaption');
    caption.contentEditable = 'true';
    caption.textContent = 'Adicione uma legenda para esta imagem.';
    const layouts = document.createElement('div');
    layouts.className = 'image-layout';
    layouts.setAttribute('aria-label', 'Largura da imagem');
    layouts.innerHTML = '<button type="button" data-image-layout="contained" aria-pressed="false">Contida</button><button type="button" data-image-layout="wide" aria-pressed="true">Ampla</button><button type="button" data-image-layout="full" aria-pressed="false">Total</button>';
    figure.append(makeHandle('Opções do bloco de imagem'), image, caption, layouts);
    $('#blockEditor').appendChild(figure);
    figure.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    $('#reviewMedia').textContent = `${$$('.story-block--image', $('#blockEditor')).length} imagens`;
    indicateChange();
  }

  $('#inlineImageInput').addEventListener('change', (event) => {
    appendImageBlock(event.target.files?.[0]);
    event.target.value = '';
  });
  $$('.editor-toolbar [data-block]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.block === 'image') $('#inlineImageInput').click();
    else appendTextBlock(button.dataset.block);
  }));
  $$('.editor-toolbar [data-format]').forEach((button) => button.addEventListener('click', () => {
    document.execCommand(button.dataset.format, false);
    indicateChange();
  }));
  $('#addParagraph').addEventListener('click', () => appendTextBlock('paragraph'));
  $('#blockEditor').addEventListener('click', (event) => {
    const layout = event.target.closest('[data-image-layout]');
    if (!layout) return;
    const figure = layout.closest('.story-block--image');
    $$('.image-layout button', figure).forEach((button) => button.setAttribute('aria-pressed', String(button === layout)));
    figure.classList.toggle('is-contained', layout.dataset.imageLayout === 'contained');
    figure.classList.toggle('is-full', layout.dataset.imageLayout === 'full');
    indicateChange();
  });

  $('#addRelation').addEventListener('click', () => showToast('No produto final, esta ação abrirá a busca do Codex.'));
  $('#saveDraft').addEventListener('click', () => {
    indicateChange();
    showToast('Rascunho simulado. Nenhum dado saiu deste navegador.');
  });

  function buildReaderFromDraft() {
    const title = $('#storyTitle').value.trim() || 'História sem título';
    const summary = $('#storySummary').value.trim();
    const era = $('#storyEra').value;
    const date = $('#storyDate').value.trim();
    $('#readerTitle').textContent = title;
    $('#readerSummary').textContent = summary;
    $('#readerEra').textContent = era.toUpperCase();
    $('#readerDate').textContent = date;
    $('#readerContextEra').textContent = era;
    $('#readerContextDate').textContent = date;
    $('#readerCover').src = $('#coverPreview img').src;
    $('#readerCover').alt = `Imagem de abertura de ${title}`;

    const prose = $('#readerProse');
    const fragment = document.createDocumentFragment();
    const intro = document.createElement('section');
    intro.id = 'chapterOne';
    const mark = document.createElement('span');
    mark.className = 'chapter-mark';
    mark.textContent = 'CRÔNICA EM REVISÃO';
    const heading = document.createElement('h2');
    heading.textContent = title;
    intro.append(mark, heading);
    fragment.appendChild(intro);
    let firstTextBlock = true;

    $$('.story-block', $('#blockEditor')).forEach((block) => {
      if (block.classList.contains('story-block--image')) {
        const figure = document.createElement('figure');
        figure.className = 'reader-figure reader-figure--wide';
        const sourceImage = $('img', block);
        const image = document.createElement('img');
        image.src = sourceImage.src;
        image.alt = sourceImage.alt || 'Imagem da história';
        image.loading = 'lazy';
        image.decoding = 'async';
        const caption = document.createElement('figcaption');
        caption.textContent = $('figcaption', block)?.textContent || '';
        figure.append(image, caption);
        fragment.appendChild(figure);
        return;
      }
      if (block.classList.contains('story-block--quote')) {
        const quote = document.createElement('blockquote');
        const paragraph = document.createElement('p');
        paragraph.textContent = block.textContent.trim();
        quote.appendChild(paragraph);
        fragment.appendChild(quote);
        return;
      }
      if (block.classList.contains('story-block--divider')) {
        const divider = document.createElement('div');
        divider.className = 'reader-divider';
        divider.setAttribute('aria-hidden', 'true');
        divider.innerHTML = '<i></i><b>◇</b><i></i>';
        fragment.appendChild(divider);
        return;
      }
      if (block.classList.contains('story-block--heading')) {
        const nextHeading = document.createElement('h2');
        nextHeading.textContent = block.textContent.trim();
        fragment.appendChild(nextHeading);
        return;
      }
      const paragraph = document.createElement('p');
      paragraph.textContent = block.textContent.trim();
      if (firstTextBlock) paragraph.className = 'drop-cap';
      firstTextBlock = false;
      fragment.appendChild(paragraph);
    });
    const end = document.createElement('footer');
    end.className = 'story-end';
    end.innerHTML = '<span>PRÉVIA DO RASCUNHO</span><h2>A história termina aqui — por enquanto.</h2>';
    fragment.appendChild(end);
    prose.replaceChildren(fragment);
  }

  $('#previewDraft').addEventListener('click', () => {
    buildReaderFromDraft();
    switchView('reader');
    showToast('Prévia gerada a partir do rascunho local.');
  });

  $('#storyStudio').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = $('#storyTitle');
    if (!title.value.trim()) {
      title.classList.add('is-invalid');
      $('#studioError').hidden = false;
      $('#studioError').focus();
      return;
    }
    $('#reviewStatus').textContent = 'Pronto para publicar';
    setStudioStep(3);
    showToast('Publicação simulada. Em produção, esta versão ficaria visível aos jogadores.');
  });

  /* Reader */
  $('#focusReader').addEventListener('click', (event) => {
    const active = !document.body.classList.contains('is-focus-reading');
    document.body.classList.toggle('is-focus-reading', active);
    event.currentTarget.setAttribute('aria-pressed', String(active));
    showToast(active ? 'Modo focado ativado.' : 'Modo focado desativado.');
  });

  function updateReadingProgress() {
    if ($('#readerView').hidden) return;
    const article = $('#readerArticle');
    const start = article.offsetTop;
    const total = Math.max(1, article.offsetHeight - innerHeight);
    const progress = Math.max(0, Math.min(1, (scrollY - start) / total));
    $('#readingProgress').style.width = `${progress * 100}%`;
  }
  addEventListener('scroll', updateReadingProgress, { passive: true });
  $$('[data-related-title]').forEach((button) => button.addEventListener('click', () => showToast(`Abriria “${button.dataset.relatedTitle}” no Codex.`)));

  renderTimeline();
  selectEvent(0);
  setStudioStep(0, false);
})();
