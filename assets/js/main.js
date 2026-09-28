document.addEventListener('DOMContentLoaded', function () { const grid = document.getElementById('projects-grid'); if (grid) { fetch('data/projects.json', { cache: 'no-store' }).then(res => { if (!res.ok) throw new Error('Échec du chargement des projets'); return res.json() }).then(projects => { if (!Array.isArray(projects) || projects.length === 0) { grid.innerHTML = '<p class="muted">Aucun projet trouvé.</p>'; return } grid.innerHTML = ''; projects.forEach(p => { const card = document.createElement('article'); card.className = 'card'; card.classList.add('animate'); const hasVideo = Boolean(p.video); const demoHref = hasVideo ? `video.html?project=${encodeURIComponent(p.id)}` : (p.url || '#'); card.innerHTML = `<div class="thumb"><img loading="lazy" alt="${escapeHtml(p.title)}" src="${p.image || 'assets/img/placeholder.svg'}"></div><div class="body"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description)}</p><div class="actions"><a href="${escapeAttr(demoHref)}" ${hasVideo ? '' : 'target="_blank" rel="noopener"'}>Voir</a></div></div>`; const idx = grid.children.length; card.style.setProperty('--i', idx); grid.appendChild(card); requestAnimationFrame(() => setTimeout(() => card.classList.add('in'), 40 + idx * 80)) }); const modal = document.getElementById('video-modal'); const videoEl = document.getElementById('project-video'); if (modal && videoEl) { grid.addEventListener('click', function (ev) { const a = ev.target.closest('a[data-video]'); if (!a) return; ev.preventDefault(); modal.removeAttribute('hidden'); modal.setAttribute('aria-hidden', 'false'); try { videoEl.currentTime = 0 } catch (e) { } videoEl.play().catch(() => { }) }); modal.addEventListener('click', function (ev) { if (ev.target.matches('[data-close]') || ev.target.classList.contains('video-modal__backdrop')) closeModal() }); function closeModal() { modal.setAttribute('aria-hidden', 'true'); try { videoEl.pause(); videoEl.currentTime = 0 } catch (e) { } modal.setAttribute('hidden', '') } document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal() }) } }).catch(err => { console.error(err); grid.innerHTML = '<p class="muted">Impossible de charger les projets.</p>' }) } const dashRoot = document.getElementById('dashboard'); if (dashRoot) { const dashValues = { years: document.querySelector('#dashboard .dash-card:nth-child(1) .dash-value'), projects: document.querySelector('#dashboard .dash-card:nth-child(2) .dash-value'), collaboration: document.querySelector('#dashboard .dash-card:nth-child(3) .dash-value') }; function renderDashboard(data) { if (!data) return; if (dashValues.years) dashValues.years.textContent = data.years ?? '—'; if (dashValues.projects) dashValues.projects.textContent = data.projects ?? '—'; if (dashValues.collaboration) dashValues.collaboration.textContent = data.collaboration ?? '—' } fetch('data/dashboard.json', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject('No dashboard JSON')).then(data => { try { localStorage.setItem('dashboard:data', JSON.stringify(data)) } catch (e) { } renderDashboard(data) }).catch(err => { try { const stored = localStorage.getItem('dashboard:data'); if (stored) renderDashboard(JSON.parse(stored)) } catch (e) { } console.debug('Dashboard JSON not loaded:', err) }) } function escapeHtml(str = '') { return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s])) } function escapeAttr(s = '') { return escapeHtml(s).replace(/"/g, '&quot;') } const cv = document.querySelector('.cv-cta'); if (cv) { cv.classList.add('pulse'); setTimeout(() => cv.classList.remove('pulse'), 2800); setTimeout(() => cv.classList.add('float'), 3200) } const heroH2 = document.querySelector('#hero h2'); if (heroH2) { setTimeout(() => heroH2.classList.add('hero-lightplay'), 300); const retrigger = () => { heroH2.classList.remove('hero-lightplay'); void heroH2.offsetWidth; heroH2.classList.add('hero-lightplay') }; heroH2.addEventListener('mouseenter', retrigger); heroH2.addEventListener('focus', retrigger) } });
(() => {
  const marquee = document.querySelector('.tech-marquee');
  if (!marquee) return;
  marquee.classList.add('is-scrollable');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SPEED = 30; // px/s
  const IDLE_RESUME = 1500; // reprise auto après interaction (ms)
  let hovering = false;
  marquee.addEventListener('mouseenter', () => { hovering = true; });
  marquee.addEventListener('mouseleave', () => { hovering = false; });

  const rows = [...marquee.querySelectorAll('.marquee-row')].map((el) => {
    const group = el.querySelector('.marquee-group');
    const row = { el, group, dir: el.classList.contains('marquee-row--reverse') ? -1 : 1, pos: 0, lastUser: 0, dragging: false };
    const touch = () => { row.lastUser = performance.now(); };

    el.addEventListener('wheel', touch, { passive: true });
    el.addEventListener('touchstart', touch, { passive: true });
    el.addEventListener('touchmove', touch, { passive: true });
    el.addEventListener('scroll', () => { if (row.dragging || performance.now() - row.lastUser < IDLE_RESUME) row.pos = el.scrollLeft; }, { passive: true });

    // glisser à la souris
    let startX = 0, startScroll = 0;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      row.dragging = true; startX = e.clientX; startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId); el.classList.add('is-dragging'); touch();
    });
    el.addEventListener('pointermove', (e) => {
      if (!row.dragging) return;
      el.scrollLeft = startScroll - (e.clientX - startX); touch();
    });
    const end = (e) => {
      if (!row.dragging) return;
      row.dragging = false; el.classList.remove('is-dragging'); touch();
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    return row;
  });

  // boucle infinie : les groupes sont identiques, on replie la position sur la largeur d'un groupe
  const wrap = (row) => {
    const w = row.group.offsetWidth;
    if (!w) return;
    if (row.pos >= w) row.pos -= w;
    else if (row.pos < 0) row.pos += w;
    if (Math.abs(row.el.scrollLeft - row.pos) >= 1) row.el.scrollLeft = row.pos;
  };

  rows.forEach((row) => { row.pos = row.dir < 0 ? row.group.offsetWidth : 0; row.el.scrollLeft = row.pos; });

  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    rows.forEach((row) => {
      const userActive = row.dragging || now - row.lastUser < IDLE_RESUME;
      if (userActive) {
        row.pos = row.el.scrollLeft;
        if (!row.dragging) wrap(row);
        return;
      }
      if (!hovering) row.pos += row.dir * SPEED * dt;
      wrap(row);
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
