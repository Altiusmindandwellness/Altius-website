// ===== Web3Forms access key (sends the quote and contact forms to shayhealthadvisor@gmail.com) =====
// Comes from app.web3forms.com. It can only send form emails to you, so it's safe in the site's code.
const WEB3FORMS_ACCESS_KEY = '76a67b17-a4df-49c3-b923-3b0995c7033c';

// ===== Blog posts shown in the home page carousel =====
// To add a post: copy one line, change the title, photo and link.
const blogPosts = [
  { title: 'Let’s Talk Deductibles',                         image: 'images/blog/deductibles.jpg',       link: 'post-lets-talk-deductibles.html' },
  { title: 'Will Your Max Out Of Pocket Max Out Your Pocket?', image: 'images/blog/max-out-of-pocket.jpg', link: 'post-max-out-of-pocket.html' },
  { title: 'Is Your Premium, Premium?',                        image: 'images/blog/premium.jpg',           link: 'post-is-your-premium-premium.html' },
  { title: 'Healthcare Data Unification',                      image: 'images/blog/data-unification.jpg',  link: 'post-healthcare-data-unification.html' },
];

// ===== Google reviews shown in the home page carousel =====
// Paste REAL reviews only, copied word-for-word from your Google Business Profile,
// with the reviewer's name as it appears on Google. Delete "placeholder: true" once a line is real.
// Reviews that did NOT come from Google get source: 'Client review' (otherwise the card says "Google review").
const reviews = [
  { name: 'Donnovan', stars: 5, source: 'Client review', text: 'I was looking for coverage for myself and my family. We were overpaying by a lot with my employer plan. When I reached out, Shay found us a great plan and saved me hundreds.' },
  { name: 'Jasmine', stars: 5, source: 'Client review', text: 'Working with AM Solutions was awesome. I was overwhelmed trying to find coverage for my business, but they made the process seamless and easy. Highly recommend.' },
  { name: 'João', stars: 4.5, source: 'Client review', text: 'It took me a while to get an appointment with Shay, but once I did I saw why. She is the best in the business to work with.' },
  { name: 'Silvia', stars: 5, source: 'Client review', text: 'Shay was amazing to work with! She took the time to understand my needs, explained my options, and helped me navigate the health insurance process. It\u2019s refreshing to find someone who genuinely cares about helping people instead of just making a sale. Highly recommend!' },
];

// ===== Insurance carriers shown on the Services page =====
// List only carriers you are appointed with. A carrier without a logo file shows its name instead;
// once you have the official logo (from the carrier's agent/broker portal), save it in images/carriers/ and add it here.
const carriers = [
  { name: 'Florida Blue',           logo: 'images/carriers/florida-blue.png' },
  { name: 'Blue Cross Blue Shield', logo: 'images/carriers/blue-cross-blue-shield.svg' },
  { name: 'UnitedHealthcare',       logo: 'images/carriers/unitedhealthcare.svg' },
  { name: 'Aetna',                  logo: 'images/carriers/aetna.svg' },
  { name: 'Humana',                 logo: 'images/carriers/humana.svg' },
  { name: 'Oscar',                  logo: 'images/carriers/oscar.svg' },
  { name: 'Ambetter',               logo: 'images/carriers/ambetter.png' },
  { name: 'Molina Healthcare',      logo: 'images/carriers/molina.svg' },
];

const PAUSE_SECONDS = 7;   // how long each set stays still
const ITEMS_PER_MOVE = 2;  // how many posts/reviews it slides each time

// Phone menu: open/close the full-screen navigation
// Two-line menu button: opens the same dropdown panel on every screen size
const toggle = document.querySelector('.menu-toggle');
function setMenu(open) {
  document.body.classList.toggle('extra-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
}
toggle.addEventListener('click', () => {
  setMenu(!document.body.classList.contains('extra-open'));
});
// close the small menu when clicking elsewhere or pressing Escape
document.addEventListener('click', e => {
  if (document.body.classList.contains('extra-open') && !e.target.closest('.header-right')) setMenu(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
// close the menus after picking a link (e.g. jumping to a coverage type on the same page)
document.querySelectorAll('.extra-menu a, .site-nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

// ===== How each card is built =====
function blogCard(post) {
  const card = document.createElement('a');
  card.className = 'post-card';
  card.href = post.link;
  const title = document.createElement('h3');
  title.textContent = post.title;
  const img = document.createElement('img');
  img.src = post.image;
  img.alt = '';
  img.loading = 'lazy';
  card.append(title, img);
  return card;
}

function reviewCard(review) {
  const card = document.createElement('figure');
  card.className = 'review-card' + (review.placeholder ? ' placeholder' : '');
  card.innerHTML = `
    <div class="review-stars" role="img" aria-label="${review.stars} out of 5 stars">
      ${[0, 1, 2, 3, 4].map(i => `<span class="star"><span class="star-fill" style="width:${Math.max(0, Math.min(1, review.stars - i)) * 100}%">★</span>★</span>`).join('')}
    </div>
    <blockquote class="review-text"></blockquote>
    <figcaption><p class="review-name"></p><p class="review-source"></p></figcaption>`;
  card.querySelector('.review-text').textContent = '“' + review.text + '”';
  card.querySelector('.review-name').textContent = review.name;
  card.querySelector('.review-source').textContent = review.source || 'Google review';
  return card;
}

// ===== Carousel: loops forever, pauses on hover, arrows move it by hand =====
function setupCarousel(carousel, items, makeCard, continuous = false) {
  if (!carousel || !items.length) return;
  const track = carousel.querySelector('.carousel-track');
  const count = items.length;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Three copies of the items so it can loop seamlessly in both directions
  for (let copy = 0; copy < 3; copy++) {
    items.forEach(item => {
      const card = makeCard(item);
      if (copy !== 1) { card.setAttribute('aria-hidden', 'true'); if (card.tagName === 'A') card.tabIndex = -1; }
      track.append(card);
    });
  }

  if (continuous) return scrollNonstop(carousel, track, count, reduceMotion);

  let index = count; // start at the middle copy

  const perView = () => parseInt(getComputedStyle(carousel).getPropertyValue('--per-view'), 10) || 1;
  const step = () => Math.min(ITEMS_PER_MOVE, perView());
  const cardStride = () => track.children[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);

  function place(animate) {
    track.style.transition = animate ? '' : 'none';
    track.style.transform = `translateX(${-index * cardStride()}px)`;
    if (!animate) track.offsetHeight; // apply the jump before re-enabling animation
  }

  // Quietly jump back to the middle copy if we drifted out of it (looks identical)
  function recenter() {
    if (index >= count * 2) { index -= count; place(false); }
    if (index < count) { index += count; place(false); }
  }

  function move(direction) {
    recenter();
    index += direction * step();
    place(true);
  }

  track.addEventListener('transitionend', recenter);

  // Automatic sliding
  let timer = null;
  const stop = () => clearInterval(timer);
  const start = () => { if (!reduceMotion) { stop(); timer = setInterval(() => move(1), PAUSE_SECONDS * 1000); } };

  carousel.querySelector('.next').addEventListener('click', () => { move(1); start(); });
  carousel.querySelector('.prev').addEventListener('click', () => { move(-1); start(); });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', start);
  window.addEventListener('resize', () => place(false));

  place(false);
  start();
}

// Nonstop version (carrier logos): the row glides left at a steady speed and loops forever.
// It pauses while the mouse is over it; the arrows nudge it one logo either way.
const NONSTOP_SPEED = 40; // pixels per second
function scrollNonstop(carousel, track, count, reduceMotion) {
  track.style.transition = 'none';
  const cardStride = () => track.children[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  let pos = count;      // position measured in logos, starting at the middle copy
  let nudge = 0;        // logos still to glide through after an arrow click
  let paused = false, last = null;

  function frame(now) {
    const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.1);
    last = now;
    const stride = cardStride();
    if (!paused && !reduceMotion && stride) pos += NONSTOP_SPEED * dt / stride;
    const n = nudge * Math.min(1, dt * 8); pos += n; nudge -= n;
    if (pos >= count * 2) pos -= count;   // loop back invisibly (the copies look identical)
    if (pos < count) pos += count;
    track.style.transform = `translateX(${-pos * stride}px)`;
    requestAnimationFrame(frame);
  }

  carousel.querySelector('.next').addEventListener('click', () => { nudge += 1; });
  carousel.querySelector('.prev').addEventListener('click', () => { nudge -= 1; });
  carousel.addEventListener('mouseenter', () => { paused = true; });
  carousel.addEventListener('mouseleave', () => { paused = false; });
  carousel.addEventListener('focusin', () => { paused = true; });
  carousel.addEventListener('focusout', () => { paused = false; });
  requestAnimationFrame(frame);
}

function carrierCard(carrier) {
  const card = document.createElement('div');
  card.className = 'carrier';
  if (carrier.logo) {
    const img = document.createElement('img');
    img.src = carrier.logo;
    img.alt = carrier.name;
    card.append(img);
  } else {
    const name = document.createElement('span');
    name.className = 'carrier-name';
    name.textContent = carrier.name;
    card.append(name);
  }
  return card;
}

setupCarousel(document.querySelector('[data-carousel="blog"]'), blogPosts, blogCard);
setupCarousel(document.querySelector('[data-carousel="reviews"]'), reviews, reviewCard);
setupCarousel(document.querySelector('[data-carousel="carriers"]'), carriers, carrierCard, true);

// ===== FAQ page: accordion. Click a question to open its answer; opening one closes the others =====
document.querySelectorAll('.faq-item').forEach((item, n) => {
  const q = item.querySelector('h3'), answer = item.querySelector('p');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'faq-question';
  btn.id = `faq-q${n}`;
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', `faq-a${n}`);
  btn.innerHTML = `<span>${q.innerHTML}</span><span class="faq-icon" aria-hidden="true"></span>`;
  q.replaceChildren(btn);
  const panel = document.createElement('div');
  panel.className = 'faq-answer';
  panel.id = `faq-a${n}`;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', btn.id);
  const inner = document.createElement('div');
  answer.replaceWith(panel);
  inner.append(answer);
  panel.append(inner);
  btn.addEventListener('click', () => {
    const open = !item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });
    item.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });
});

// ===== Floating buttons (bottom-right on every page): Book a consultation + Get a quote =====
(function () {
  const BOOKING_LINK = 'https://calendly.com/shayhealthadvisor/30min';
  const onQuotePage = location.pathname.endsWith('quote.html');
  const wrap = document.createElement('div');
  wrap.className = 'float-cta';
  wrap.innerHTML = `
    <div class="float-quote-menu" id="float-quote-menu" hidden>
      <p>Get a free quote for:</p>
      <a href="quote.html?type=individual">Individual</a>
      <a href="quote.html?type=family">Family</a>
      <a href="quote.html?type=business">Business</a>
    </div>
    ${onQuotePage ? '' : '<button type="button" class="float-btn float-quote" aria-expanded="false" aria-controls="float-quote-menu">Get a quote</button>'}
    <a class="float-btn float-book" href="${BOOKING_LINK}" target="_blank" rel="noopener"><span class="float-long">Book a consultation</span><span class="float-short">Book a consult</span></a>`;
  document.body.append(wrap);
  document.body.classList.add('has-float-cta');

  // hide the buttons while scrolling; bring them back shortly after scrolling stops
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    const menuOpen = wrap.querySelector('.float-quote-menu') && !wrap.querySelector('.float-quote-menu').hidden;
    if (menuOpen) return;                           // keep them put while the quote menu is open
    wrap.classList.add('float-hidden');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => wrap.classList.remove('float-hidden'), 400);
  }, { passive: true });

  const btn = wrap.querySelector('.float-quote');
  const menu = wrap.querySelector('.float-quote-menu');
  if (!btn) return;
  const setOpen = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); };
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(menu.hidden); });
  document.addEventListener('click', e => { if (!e.target.closest('.float-cta')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();

// ===== Header buttons (top right, beside the logo): Get a quote + Book a consult =====
// Shown on laptops and larger; phones and tablets keep the floating buttons instead.
(function () {
  const right = document.querySelector('.header-right');
  const toggle = right && right.querySelector('.menu-toggle');
  if (!toggle) return;
  const onQuotePage = location.pathname.endsWith('quote.html');
  const box = document.createElement('div');
  box.className = 'header-cta';
  box.innerHTML = `
    ${onQuotePage ? '' : `<div class="header-quote">
      <button type="button" class="header-btn header-btn-quote" aria-expanded="false" aria-controls="header-quote-menu">Get a quote</button>
      <div class="header-quote-menu" id="header-quote-menu" hidden>
        <a href="quote.html?type=individual">Individual</a>
        <a href="quote.html?type=family">Family</a>
        <a href="quote.html?type=business">Business</a>
      </div>
    </div>`}
    <a class="header-btn header-btn-book" href="https://calendly.com/shayhealthadvisor/30min" target="_blank" rel="noopener">Book a consult</a>`;
  right.insertBefore(box, toggle);
  document.body.classList.add('has-header-cta');

  const btn = box.querySelector('.header-btn-quote'), menu = box.querySelector('.header-quote-menu');
  if (!btn) return;
  const setOpen = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); };
  btn.addEventListener('click', e => { e.stopPropagation(); setOpen(menu.hidden); });
  document.addEventListener('click', e => { if (!e.target.closest('.header-quote')) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();

// ===== "Chat with us" box (bottom right, stays put while scrolling) =====
// Phones: "Text us" opens the visitor's texting app with our number filled in, so the text goes straight to our cell.
// Everywhere: a quick message form, emailed through Web3Forms like the other forms.
(function () {
  const PHONE = '+19544087710', PHONE_SHOWN = '954-408-7710';
  const greeting = 'Hi Altius Mind and Wellness! I have a question: ';
  const smsLink = `sms:${PHONE}?&body=${encodeURIComponent(greeting)}`;
  const box = document.createElement('div');
  box.className = 'chat';
  box.innerHTML = `
    <div class="chat-panel" id="chat-panel" role="dialog" aria-label="Chat with us" hidden>
      <div class="chat-head">
        <p class="chat-title">Chat with us</p>
        <button type="button" class="chat-close" aria-label="Close chat">&times;</button>
      </div>
      <div class="chat-body">
        <div class="chat-fallback">
        <p class="chat-bubble-msg">Hi there! 👋 How can we help? Text us, or leave a quick message and we’ll get right back to you.</p>
        <a class="chat-text-btn" href="${smsLink}"><span class="chat-touch">Text us at</span><span class="chat-desk">Text or call</span> ${PHONE_SHOWN}</a>
        <p class="chat-or"><span>or send a message</span></p>
        <form class="chat-form" novalidate>
          <input type="text" name="botcheck" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
          <label class="sr-only" for="chat-name">Your name</label>
          <input id="chat-name" name="name" type="text" autocomplete="name" placeholder="Your name">
          <label class="sr-only" for="chat-reach">Phone or email</label>
          <input id="chat-reach" name="reach" type="text" autocomplete="tel" placeholder="Phone or email">
          <label class="sr-only" for="chat-msg">Message</label>
          <textarea id="chat-msg" name="message" rows="3" placeholder="How can we help?"></textarea>
          <p class="chat-error" role="alert"></p>
          <button type="submit" class="chat-send">Send</button>
          <p class="chat-note">Please don’t include health or financial details. Replies Mon–Fri 8am–8pm, Sat–Sun 9am–2pm ET.</p>
        </form>
        <div class="chat-done" hidden>
          <p><strong>Thanks! Your message is on its way.</strong></p>
          <p>We’ll reply by text or email as soon as we can.</p>
        </div>
        </div>
        <form class="chat-form chat-start" hidden novalidate>
          <p class="chat-bubble-msg">Hi there! 👋 What’s your name? We’ll connect you with our team right away.</p>
          <label class="sr-only" for="chat-start-name">Your name</label>
          <input id="chat-start-name" name="name" type="text" autocomplete="name" placeholder="Your name">
          <label class="sr-only" for="chat-start-reach">Phone or email (optional)</label>
          <input id="chat-start-reach" name="reach" type="text" autocomplete="email" placeholder="Phone or email (optional)">
          <p class="chat-error" role="alert"></p>
          <button type="submit" class="chat-send">Start chat</button>
          <p class="chat-note">Prefer to text? <a href="${smsLink}">${PHONE_SHOWN}</a>. Please don’t include health or financial details.</p>
        </form>
      </div>
    </div>
    <button type="button" class="chat-launch" aria-expanded="false" aria-controls="chat-panel">
      <span class="chat-typing" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="chat-launch-label">Chat with us</span>
      <span class="chat-unread" hidden></span>
    </button>`;
  document.body.append(box);

  const panel = box.querySelector('.chat-panel'), launch = box.querySelector('.chat-launch');
  let tawkReady = false;
  const setOpen = open => {
    panel.hidden = !open;
    launch.setAttribute('aria-expanded', open);
    box.classList.toggle('chat-open', open);
    if (open) (tawkReady ? box.querySelector('#chat-start-name') : box.querySelector('.chat-done').hidden ? box.querySelector('#chat-name') : launch).focus();
  };
  // Live chat through tawk.to: our button opens their chat window (replies come from the tawk.to phone app).
  // If tawk.to can't load (ad blocker, outage), the button opens the text/message box above instead.
  window.Tawk_API = window.Tawk_API || {}; window.Tawk_LoadStart = new Date();
  // tawk.to's own chime is off, so its automatic greeting is silent.
  // Instead we play a soft chime only when the owner replies after the visitor has written.
  Tawk_API.disableSound = true;
  let visitorTalked = false, audio;
  try { visitorTalked = !!sessionStorage.getItem('altius-chat-talked'); } catch (e) {}
  const chime = () => {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      [[880, 0], [1320, 0.16]].forEach(([freq, delay]) => {
        const t = audio.currentTime + delay, osc = audio.createOscillator(), vol = audio.createGain();
        osc.type = 'sine'; osc.frequency.value = freq;
        vol.gain.setValueAtTime(0.0001, t);
        vol.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        vol.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(vol).connect(audio.destination); osc.start(t); osc.stop(t + 0.32);
      });
    } catch (e) {}
  };
  Tawk_API.onChatMessageVisitor = () => {
    visitorTalked = true;
    try { sessionStorage.setItem('altius-chat-talked', '1'); } catch (e) {}
  };
  Tawk_API.onChatMessageAgent = () => { if (visitorTalked) chime(); };
  const fallback = box.querySelector('.chat-fallback'), start = box.querySelector('.chat-start');
  const closeLive = () => { Tawk_API.hideWidget(); box.classList.remove('chat-live'); };
  const openLive = () => { setOpen(false); box.classList.add('chat-live'); box.querySelector('.chat-unread').hidden = true; Tawk_API.showWidget(); Tawk_API.maximize(); };
  Tawk_API.onLoad = () => {
    tawkReady = true; fallback.hidden = true; start.hidden = false;
    // A chat left open on the last page reopens by itself: keep it open, with our button out of the way.
    if (Tawk_API.isChatMaximized()) { setOpen(false); box.classList.add('chat-live'); } else Tawk_API.hideWidget();
  };
  Tawk_API.onChatMinimized = closeLive;
  const chatOngoing = () => tawkReady && Tawk_API.isChatOngoing && Tawk_API.isChatOngoing();
  // tawk.to's automatic greeting flashes "1 new message" in the browser tab before anyone has chatted.
  // Keep the page's own title until a real conversation has started.
  const pageTitle = document.title;
  new MutationObserver(() => { if (document.title !== pageTitle && !chatOngoing()) document.title = pageTitle; })
    .observe(document.head, { childList: true, subtree: true, characterData: true });
  // If we reply while the chat window is closed, show the count on the Chat with us button.
  const unread = box.querySelector('.chat-unread');
  Tawk_API.onUnreadCountChanged = n => {
    const show = n > 0 && chatOngoing() && !box.classList.contains('chat-live');
    unread.hidden = !show; unread.textContent = show ? n : '';
    launch.setAttribute('aria-label', show ? `Chat with us, ${n} new message${n > 1 ? 's' : ''}` : 'Chat with us');
  };
  // Tell Google a lead came in when a visitor starts a live chat. Never the visitor's details.
  Tawk_API.onChatStarted = () => { if (window.gtag) gtag('event', 'generate_lead', { form_name: 'live_chat' }); };
  const tawk = document.createElement('script');
  tawk.async = true; tawk.charset = 'UTF-8'; tawk.setAttribute('crossorigin', '*');
  tawk.src = 'https://embed.tawk.to/6af267a0fbf32a3c40a330f3/1k71e9iuu';
  document.head.append(tawk);

  // Before the live chat opens, ask for a name so it shows in the tawk.to dashboard (asked once per visit).
  let named = false;
  try { named = !!sessionStorage.getItem('altius-chat-name'); } catch (e) {}
  launch.addEventListener('click', () => { if (tawkReady && named) openLive(); else setOpen(panel.hidden); });
  start.addEventListener('submit', e => {
    e.preventDefault();
    const err = start.querySelector('.chat-error');
    const name = start.elements.name.value.trim(), reach = start.elements.reach.value.trim();
    const digits = reach.replace(/\D/g, '');
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reach);
    const isPhone = digits.length === 10 || (digits.length === 11 && digits[0] === '1');
    err.textContent = !name ? 'Please enter your name.' : reach && !isEmail && !isPhone ? 'Please check your phone or email, or leave it blank.' : '';
    if (err.textContent) return;
    // Name first on its own, so a contact detail tawk.to rejects can't stop the name from showing.
    Tawk_API.setAttributes({ name }, () => {
      if (isEmail) Tawk_API.setAttributes({ email: reach }, () => {});
      else if (isPhone) Tawk_API.setAttributes({ phone: reach }, () => {});
    });
    named = true;
    try { sessionStorage.setItem('altius-chat-name', '1'); } catch (e) {}
    openLive();
  });
  box.querySelector('.chat-close').addEventListener('click', () => { setOpen(false); launch.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); launch.focus(); } });

  const form = box.querySelector('.chat-fallback .chat-form'), error = box.querySelector('.chat-error'), send = box.querySelector('.chat-send');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    for (const k of ['name', 'reach', 'message']) d[k] = (d[k] || '').trim();
    const digits = d.reach.replace(/\D/g, '');
    const okReach = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.reach) || digits.length === 10 || (digits.length === 11 && digits[0] === '1');
    error.textContent = !d.name ? 'Please enter your name.' : !okReach ? 'Please enter a phone number or email so we can reply.' : !d.message ? 'Please type a message.' : '';
    if (error.textContent) return;
    send.disabled = true; send.textContent = 'Sending…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New chat message from ${d.name}`,
          from_name: 'Altius website chat',
          botcheck: d.botcheck,
          'Name': d.name,
          'Reply to (phone or email)': d.reach,
          'Message': d.message,
          'Sent from page': location.pathname,
          ...(d.reach.includes('@') ? { replyto: d.reach } : {}),
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result.message || res.status);
      // Tell Google a lead came in. Only the form name: never the visitor's details.
      if (window.gtag) gtag('event', 'generate_lead', { form_name: 'chat' });
      form.hidden = true;
      box.querySelector('.chat-done').hidden = false;
    } catch (err) {
      error.textContent = `Sorry, that didn’t send. Please text or call us at ${PHONE_SHOWN}.`;
      send.disabled = false; send.textContent = 'Send';
    }
  });
})();
