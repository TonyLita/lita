(() => {
  const root = document.getElementById('project-detail');
  if (!root) return;

  const el = (tag, props = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(children)) if (c) node.append(c);
    return node;
  };

  const bulletList = (items, cls = 'bullets') => el('ul', { class: cls }, items.map((t) => el('li', { text: t })));

  const section = (title, id, body) =>
    el('section', { class: 'detail-section', id }, [el('h2', { text: title }), body]);

  const breadcrumb = (title) =>
    el('nav', { class: 'breadcrumb', 'aria-label': "Fil d'Ariane" }, [
      el('a', { href: 'projects.html', text: '← Projets' }),
      el('span', { 'aria-hidden': 'true', text: '/' }),
      el('span', { 'aria-current': 'page', text: title }),
    ]);

  const notFound = () => {
    root.replaceChildren(
      el('section', { class: 'detail-empty' }, [
        el('h2', { text: 'Projet introuvable' }),
        el('p', { class: 'muted', text: "Ce projet n'existe pas ou a été retiré." }),
        el('a', { class: 'cv-cta', href: 'projects.html', text: 'Retour aux projets' }),
      ])
    );
  };

  const renderHead = (p, d) =>
    el('div', { class: 'project-head' }, [
      el('figure', { class: 'project-shot' }, [el('img', { src: p.image, alt: `Capture de l'application ${p.title}` })]),
      el('div', { class: 'project-intro' }, [
        el('h1', { class: 'project-title', text: p.title }),
        el('p', { class: 'project-tagline', text: d.tagline }),
        d.intro && el('p', { text: d.intro }),
        d.features && bulletList(d.features),
        d.closing && el('p', { class: 'project-closing', text: d.closing }),
        d.docs?.length && el('a', { class: 'cv-cta', href: '#docs', text: 'Voir la documentation ↓' }),
      ]),
    ]);

  const renderProblem = (pb) =>
    section('Problème résolu', 'probleme', el('div', { class: 'split' }, [
      el('div', {}, [el('h3', { class: 'split-label', text: 'Avant' }), bulletList(pb.before, 'bullets bullets--muted')]),
      el('div', {}, [el('h3', { class: 'split-label split-label--accent', text: 'Après' }), bulletList(pb.after)]),
    ]));

  const renderAudience = (a) =>
    el('section', { class: 'detail-section audience' }, [
      el('h2', { text: a.title }),
      el('ol', { class: 'steps' }, a.actions.map((s) =>
        el('li', {}, [
          el('strong', { text: s.title }),
          s.text && el('p', { text: s.text }),
          s.items && bulletList(s.items, 'bullets bullets--sub'),
        ])
      )),
      a.benefits && el('div', { class: 'benefits' }, [el('h3', { class: 'split-label split-label--accent', text: 'Bénéfices' }), bulletList(a.benefits)]),
    ]);

  const renderDocs = (docs) => {
    const url = (f) => encodeURI(f);
    const frame = el('iframe', { class: 'doc-frame', title: docs[0].label, src: `${url(docs[0].file)}#view=FitH`, loading: 'lazy' });
    const openLink = el('a', { class: 'doc-link', href: url(docs[0].file), target: '_blank', rel: 'noopener', text: 'Ouvrir dans un nouvel onglet ↗' });
    const dlLink = el('a', { class: 'doc-link', href: url(docs[0].file), download: true, text: 'Télécharger' });

    const tabs = docs.map((d, i) =>
      el('button', { class: 'doc-tab', type: 'button', role: 'tab', id: `doc-tab-${i}`, 'aria-selected': i === 0 ? 'true' : 'false', 'aria-controls': 'doc-panel', tabindex: i === 0 ? '0' : '-1', text: d.label })
    );

    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.tabIndex = j === i ? 0 : -1;
      });
      const d = docs[i];
      frame.src = `${url(d.file)}#view=FitH`;
      frame.title = d.label;
      openLink.href = dlLink.href = url(d.file);
      panel.setAttribute('aria-labelledby', tabs[i].id);
      if (focus) tabs[i].focus();
    };

    const tablist = el('div', { class: 'doc-tabs', role: 'tablist', 'aria-label': 'Documents du projet' }, tabs);
    tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    tablist.addEventListener('keydown', (e) => {
      const cur = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      const next = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + tabs.length) % tabs.length, true);
    });

    const panel = el('div', { class: 'doc-viewer', role: 'tabpanel', id: 'doc-panel', 'aria-labelledby': tabs[0].id }, [
      frame,
      el('div', { class: 'doc-actions' }, [openLink, dlLink]),
    ]);

    // mobile : les PDF s'affichent mal en iframe → liste de liens
    const list = el('ul', { class: 'doc-list' }, docs.map((d) =>
      el('li', {}, [
        el('span', { class: 'doc-list-label', text: d.label }),
        el('span', { class: 'doc-list-actions' }, [
          el('a', { class: 'doc-link', href: url(d.file), target: '_blank', rel: 'noopener', text: 'Ouvrir ↗' }),
          el('a', { class: 'doc-link', href: url(d.file), download: true, text: 'Télécharger' }),
        ]),
      ])
    ));

    return section('Documentation', 'docs', el('div', {}, [tablist, panel, list]));
  };

  const id = new URLSearchParams(location.search).get('project');

  fetch('data/projects.json', { cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((projects) => {
      const p = Array.isArray(projects) && projects.find((x) => x.id === id);
      if (!p || !p.detail) return notFound();
      const d = p.detail;
      document.title = `${p.title} — Portfolio`;
      root.replaceChildren(...[
        breadcrumb(p.title),
        renderHead(p, d),
        d.problem && renderProblem(d.problem),
        d.audiences?.length && el('div', { class: 'audiences' }, d.audiences.map(renderAudience)),
        d.docs?.length && renderDocs(d.docs),
      ].filter(Boolean));
    })
    .catch((err) => {
      console.error(err);
      root.replaceChildren(el('p', { class: 'muted', text: 'Impossible de charger le projet.' }));
    });
})();
