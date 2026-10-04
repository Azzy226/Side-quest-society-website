/* Builds the page from the files in /content. Trey never needs to edit this file. */
(function () {
  const $ = (id) => document.getElementById(id);
  const CATS = {
    gaming: { label: 'Gaming News', icon: '🎮' },
    tech: { label: 'Tech News', icon: '💻' },
    motivation: { label: 'Feel Good', icon: '✨' }
  };

  function el(tag, attrs, children) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => c && n.appendChild(c));
    return n;
  }
  function link(url, attrs, children) {
    const a = el('a', Object.assign({ href: url || '#' }, attrs), children);
    if (/^https?:/i.test(url || '')) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  const has = (s) => typeof s === 'string' && s.trim() !== '';
  const list = (d) => (d && Array.isArray(d.items) ? d.items : []);

  async function load(name) {
    try {
      const r = await fetch('content/' + name + '.json', { cache: 'no-cache' });
      return r.ok ? await r.json() : {};
    } catch (e) { return {}; }
  }

  function fmtDate(d) {
    if (!has(d)) return '';
    const dt = new Date(d);
    return isNaN(dt) ? d : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }

  // Fill a section header (title + optional subtitle) and reveal the section.
  function show(id, title, sub) {
    if (has(title)) $(id + 'Title').textContent = title;
    if (has(sub)) { $(id + 'Sub').textContent = sub; $(id + 'Sub').hidden = false; }
    $(id).hidden = false;
  }

  function wireForm(form, noteEl, action, okMsg) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      noteEl.textContent = 'Sending...';
      try {
        const r = await fetch(action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form)
        });
        if (!r.ok) throw new Error();
        form.reset();
        noteEl.textContent = okMsg || '✓ Thanks!';
      } catch (err) {
        noteEl.textContent = 'Something went wrong. Please try again later.';
      }
    });
  }

  async function init() {
    const [site, eps, hosts, blog, comics, motiv, facts] = await Promise.all([
      load('site'), load('episodes'), load('hosts'), load('blog'),
      load('comics'), load('motivation'), load('facts')
    ]);

    const name = has(site.site_name) ? site.site_name : 'Side Quest Society';
    document.title = has(site.tab_title) ? site.tab_title : name;
    if (has(site.description)) document.querySelector('meta[name="description"]').content = site.description;
    $('logoText').textContent = name.toUpperCase();
    $('footerLogo').textContent = name.toUpperCase();

    /* ----- Hero ----- */
    if (has(site.hero_kicker)) { $('heroKicker').textContent = site.hero_kicker; $('heroKicker').hidden = false; }
    const h1 = $('heroTitle');
    if (has(site.hero_line1)) { h1.appendChild(document.createTextNode(site.hero_line1)); h1.appendChild(el('br')); }
    h1.appendChild(el('span', { text: has(site.hero_title) ? site.hero_title : name.toUpperCase() }));
    if (has(site.tagline)) { $('heroTagline').textContent = site.tagline; $('heroTagline').hidden = false; }
    const ha = $('heroActions');
    if (has(site.hero_button1_text)) ha.appendChild(link(site.hero_button1_link, { class: 'btn btn-primary', text: site.hero_button1_text }));
    if (has(site.hero_button2_text)) ha.appendChild(link(site.hero_button2_link, { class: 'btn btn-outline', text: site.hero_button2_text }));
    if (!ha.children.length) ha.style.display = 'none';
    const stats = (site.stats || []).filter((s) => has(s.number));
    stats.forEach((s) => $('heroStats').appendChild(el('div', { text: s.number }, [el('span', { text: s.label || '' })])));
    if (!stats.length) $('heroStats').style.display = 'none';

    /* ----- Episodes ----- */
    const episodes = list(eps).filter((e) => has(e.title))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    if (episodes.length) {
      show('episodes', site.episodes_title, site.episodes_subtitle);
      episodes.forEach((e) => {
        const cat = CATS[e.category] || CATS.gaming;
        const catKey = CATS[e.category] ? e.category : 'gaming';
        const meta = [fmtDate(e.date), e.duration].filter(has).join(' · ');
        const body = el('div', { class: 'ep-body' }, [
          el('span', { class: 'ep-tag tag-' + catKey, text: cat.label }),
          el('h3', { text: e.title }),
          meta ? el('div', { class: 'ep-meta', text: meta }) : null,
          has(e.link) ? link(e.link, { class: 'ep-play', text: '▶ PLAY EPISODE' }) : null
        ]);
        $('episodesGrid').appendChild(el('div', { class: 'ep-card' }, [
          el('div', { class: 'ep-thumb ' + catKey, text: has(e.emoji) ? e.emoji : cat.icon }),
          body
        ]));
      });
      if (has(site.archive_link)) {
        $('episodesAll').appendChild(link(site.archive_link, { class: 'btn btn-yellow', text: 'VIEW FULL EPISODE ARCHIVE' }));
        $('episodesAll').hidden = false;
      }
    }

    /* ----- Segments ----- */
    const segs = (site.segments || []).filter((s) => has(s.title));
    if (segs.length) {
      show('segments', site.segments_title, site.segments_subtitle);
      segs.forEach((s) => {
        const key = CATS[s.category] ? s.category : 'gaming';
        const color = { gaming: 'red', tech: 'cyan', motivation: 'green' }[key];
        $('segmentsGrid').appendChild(el('div', { class: 'segment-card ' + key }, [
          el('div', { class: 'icon', text: has(s.emoji) ? s.emoji : CATS[key].icon }),
          el('h3', { text: s.title.toUpperCase() }),
          has(s.description) ? el('p', { text: s.description }) : null,
          episodes.length ? link('#episodes', { class: 'ep-play', style: 'color:var(--' + color + ');', text: 'BROWSE EPISODES →' }) : null
        ]));
      });
    }

    /* ----- Hosts ----- */
    const hs = list(hosts).filter((h) => has(h.name));
    if (hs.length) {
      show('hosts', site.hosts_title || (hs.length > 1 ? 'Meet the Party' : 'Meet the Host'), site.hosts_subtitle);
      hs.forEach((h) => {
        const avatar = has(h.photo)
          ? el('img', { class: 'host-avatar', src: h.photo, alt: h.name, style: 'object-fit:cover;' })
          : el('div', { class: 'host-avatar' });
        const social = el('div', { class: 'host-social' });
        (h.socials || []).filter((s) => has(s.url)).forEach((s) => social.appendChild(link(s.url, { text: s.label || 'LINK' })));
        $('hostsGrid').appendChild(el('div', { class: 'host-card' }, [
          avatar,
          el('h3', { text: h.name }),
          has(h.role) ? el('span', { class: 'host-role', text: h.role.toUpperCase() }) : null,
          has(h.bio) ? el('p', { text: h.bio }) : null,
          social.children.length ? social : null
        ]));
      });
    }

    /* ----- Blog ----- */
    const posts = list(blog).filter((p) => has(p.title))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    if (posts.length) {
      show('blog', site.blog_title, site.blog_subtitle);
      posts.forEach((p) => {
        $('blogGrid').appendChild(el('div', { class: 'blog-card' }, [
          has(p.date) ? el('span', { class: 'blog-date', text: fmtDate(p.date).toUpperCase() }) : null,
          el('h3', { text: p.title }),
          has(p.summary) ? el('p', { text: p.summary }) : null,
          has(p.link) ? link(p.link, { class: 'read-more', text: 'READ MORE →' }) : null
        ]));
      });
    }

    /* ----- Listen / subscribe ----- */
    const plats = (site.platforms || []).filter((p) => has(p.url));
    if (plats.length) {
      show('subscribe', site.subscribe_title, site.subscribe_subtitle);
      plats.forEach((p) => $('subscribeGrid').appendChild(
        link(p.url, { class: 'subscribe-btn' }, [el('span', { class: 'ico', text: has(p.emoji) ? p.emoji : '🎧' }), document.createTextNode(p.name || '')])
      ));
      $('navSubscribe').hidden = false;
    }

    /* ----- Support ----- */
    const sup = (site.support_buttons || []).filter((b) => has(b.url) && has(b.text));
    if (sup.length) {
      show('support', site.support_title);
      if (has(site.support_text)) { $('supportText').textContent = site.support_text; $('supportText').hidden = false; }
      sup.forEach((b, i) => $('supportActions').appendChild(link(b.url, { class: 'btn ' + (i % 2 ? 'btn-outline' : 'btn-primary'), text: b.text })));
    }

    /* ----- Newsletter (needs a form address in site.json) ----- */
    if (has(site.newsletter_form_url)) {
      show('newsletter', site.newsletter_title);
      if (has(site.newsletter_text)) { $('newsletterText').textContent = site.newsletter_text; $('newsletterText').hidden = false; }
      $('newsletterNote').textContent = 'No spam. Unsubscribe anytime.';
      wireForm($('newsletterForm'), $('newsletterNote'), site.newsletter_form_url, "✓ You're in! Check your inbox to confirm.");
    }

    /* ----- Community / contact ----- */
    const comm = (site.community_links || []).filter((c) => has(c.url) && has(c.text));
    const contactOn = has(site.contact_form_url);
    if (comm.length || contactOn) {
      show('community', site.community_title, site.community_subtitle);
      comm.forEach((c) => $('communityLinks').appendChild(link(c.url, { text: (has(c.emoji) ? c.emoji + ' ' : '') + c.text })));
      if (!comm.length) $('communityLinks').style.display = 'none';
      if (contactOn) {
        $('contactForm').hidden = false;
        wireForm($('contactForm'), $('contactNote'), site.contact_form_url, '✓ Thanks for reaching out! We\'ll get back to you soon.');
      }
    }

    /* ----- Tabs: Comic Reels, Motivation, Facts of the Day ----- */
    const byDate = (a, b) => String(b.date || '').localeCompare(String(a.date || ''));
    const tabLabel = (v, d) => (has(site[v + '_tab']) ? site[v + '_tab'] : d);

    function videoEmbed(url) {
      const m = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
      if (m) return { src: 'https://www.youtube.com/embed/' + m[1], vertical: /shorts\//.test(url) };
      const t = (url || '').match(/tiktok\.com\/.*\/(?:video|photo)\/(\d+)/);
      if (t) return { src: 'https://www.tiktok.com/embed/v2/' + t[1], vertical: true };
      const i = (url || '').match(/instagram\.com\/(reel|p)\/([\w-]+)/);
      if (i) return { src: 'https://www.instagram.com/' + i[1] + '/' + i[2] + '/embed', vertical: true };
      return null;
    }

    $('comicsTitle').textContent = tabLabel('comics', 'Press Start');
    if (has(site.comics_subtitle)) { $('comicsSub').textContent = site.comics_subtitle; $('comicsSub').hidden = false; }
    const reels = list(comics).filter((r) => has(r.title) || has(r.link)).sort(byDate);
    reels.forEach((r) => {
      const emb = videoEmbed(r.link);
      let media;
      if (emb) media = el('div', { class: 'reel-media' + (emb.vertical ? ' vertical' : '') }, [el('iframe', { src: emb.src, loading: 'lazy', allowfullscreen: '', title: r.title || 'Video' })]);
      else if (has(r.thumbnail)) media = el('div', { class: 'reel-media' }, [el('img', { src: r.thumbnail, alt: r.title })]);
      else media = el('div', { class: 'reel-media', text: '🎬', style: 'font-size:48px;' });
      $('comicsGrid').appendChild(el('div', { class: 'reel-card' }, [
        media,
        el('div', { class: 'reel-body' }, [
          has(r.title) ? el('h3', { text: r.title }) : null,
          has(r.caption) ? el('p', { text: r.caption }) : null,
          (!emb && has(r.link)) ? link(r.link, { class: 'ep-play', text: '▶ WATCH' }) : null
        ])
      ]));
    });
    $('comicsEmpty').hidden = reels.length > 0;

    $('motivationTitle').textContent = tabLabel('motivation', 'Motivation');
    if (has(site.motivation_subtitle)) { $('motivationSub').textContent = site.motivation_subtitle; $('motivationSub').hidden = false; }
    const quotes = list(motiv).filter((q) => has(q.quote)).sort(byDate);
    quotes.forEach((q) => $('motivationGrid').appendChild(el('div', { class: 'quote-card' }, [
      el('blockquote', { text: '“' + q.quote + '”' }),
      has(q.author) ? el('cite', { text: '— ' + q.author.toUpperCase() }) : null
    ])));
    $('motivationEmpty').hidden = quotes.length > 0;

    $('factsTitle').textContent = tabLabel('facts', 'Facts of the Day');
    if (has(site.facts_subtitle)) { $('factsSub').textContent = site.facts_subtitle; $('factsSub').hidden = false; }
    const allFacts = list(facts).filter((f) => has(f.fact)).sort(byDate);
    // Today's fact = newest one dated today or earlier, so Trey can schedule facts ahead of time.
    const today = new Date().toISOString().slice(0, 10);
    const released = allFacts.filter((f) => !has(f.date) || f.date <= today);
    const current = released[0] || null;
    if (current) {
      $('factToday').appendChild(el('div', { class: 'fact-today' }, [
        has(current.date) ? el('span', { class: 'fact-date', text: fmtDate(current.date).toUpperCase() }) : null,
        el('p', { text: current.fact }),
        has(current.source) ? el('span', { class: 'fact-src', text: 'Source: ' + current.source }) : null
      ]));
      const past = released.slice(1);
      past.forEach((f) => $('factsGrid').appendChild(el('div', { class: 'fact-item' }, [
        has(f.date) ? el('span', { class: 'fact-date', text: fmtDate(f.date).toUpperCase() }) : null,
        el('p', { text: f.fact })
      ])));
      $('factsPastTitle').hidden = !past.length;
    }
    $('factsEmpty').hidden = !!current;

    /* ----- Navigation (tabs) + footer ----- */
    const TAB_VIEWS = ['comics', 'motivation', 'facts'];
    const tabs = [['home', 'Home'], ['episodes', 'Episodes'], ['comics', tabLabel('comics', 'Press Start')],
      ['motivation', tabLabel('motivation', 'Motivation')], ['facts', tabLabel('facts', 'Facts of the Day')],
      ['blog', 'Blog'], ['community', 'Community']]
      .filter(([id]) => id === 'home' || TAB_VIEWS.includes(id) || !$(id).hidden);
    tabs.forEach(([id, label]) => {
      $('navLinks').appendChild(el('li', {}, [el('a', { href: id === 'home' ? '#top' : '#' + id, 'data-tab': id, text: label })]));
      if (id !== 'home') $('footLinks').appendChild(el('a', { href: '#' + id, text: label }));
    });
    const soc = (site.footer_links || []).filter((l) => has(l.url) && has(l.label));
    soc.forEach((l) => $('footSocial').appendChild(link(l.url, { class: 'soc-btn' }, [
      el('span', { class: 'soc-ico', text: has(l.emoji) ? l.emoji : '🔗' }), document.createTextNode(l.label)])));
    $('footSocial').hidden = !soc.length;
    if (has(site.privacy_link)) $('footLinks').appendChild(link(site.privacy_link, { text: 'Privacy' }));
    if (!$('footLinks').children.length) $('footLinks').style.display = 'none';
    const owner = has(site.owner_name) ? site.owner_name : name;
    $('footerCopy').textContent = '© ' + new Date().getFullYear() + ' ' + owner + '. ' + (has(site.footer_text) ? site.footer_text : 'All rights reserved.');

    // Simple routing: #comics / #motivation / #facts show that tab; anything else shows Home.
    function route() {
      const id = location.hash.replace('#', '');
      const isTab = TAB_VIEWS.includes(id);
      $('view-home').hidden = isTab;
      TAB_VIEWS.forEach((v) => { $('view-' + v).hidden = v !== id; });
      document.querySelectorAll('#navLinks a').forEach((a) => {
        const t = a.dataset.tab;
        a.classList.toggle('active', isTab ? t === id : (t === 'home' ? (!id || id === 'top') : t === id));
      });
      if (isTab || !id || id === 'top') window.scrollTo(0, 0);
      else { const t = document.getElementById(id); if (t) t.scrollIntoView(); }
    }
    window.addEventListener('hashchange', route);
    route();

    const toggle = $('menuToggle'), nav = $('navLinks');
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') nav.classList.remove('open'); });
  }

  init();
})();
