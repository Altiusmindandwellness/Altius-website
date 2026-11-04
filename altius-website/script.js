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
