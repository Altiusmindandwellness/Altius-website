// ===== 2027 Marketplace (ACA) price calculator =====
// Estimates the monthly premium tax credit and the price of the benchmark silver plan after it.
// Every number below comes from an official or published source. Update them each fall for the next year.

// IRS Rev. Proc. 2026-26 §3.01: 2027 applicable percentage table (share of income a household is expected to pay
// for the benchmark plan). Within each band the percentage rises in a straight line from start to end.
const APPLICABLE_PERCENTAGES_2027 = [
  { from: 0,   to: 133, start: 2.15,  end: 2.15 },
  { from: 133, to: 150, start: 3.23,  end: 4.30 },
  { from: 150, to: 200, start: 4.30,  end: 6.78 },
  { from: 200, to: 250, start: 6.78,  end: 8.66 },
  { from: 250, to: 300, start: 8.66,  end: 10.22 },
  { from: 300, to: 400, start: 10.22, end: 10.22 },
];

// HHS 2026 poverty guidelines (Federal Register, Jan. 15, 2026). 2027 coverage uses the 2026 guidelines.
const POVERTY_GUIDELINES_2026 = {
  standard: { first: 15960, each: 5680 },   // 48 states and DC
  AK:       { first: 19950, each: 7100 },
  HI:       { first: 18360, each: 6530 },
};

// KFF: 2027 average monthly benchmark premium (second-lowest-cost silver plan) for a 40-year-old, by state.
const BENCHMARK_40_2027 = {
  AL: ['Alabama', 712], AK: ['Alaska', 1284], AZ: ['Arizona', 609], AR: ['Arkansas', 757], CA: ['California', 655],
  CO: ['Colorado', 615], CT: ['Connecticut', 1005], DE: ['Delaware', 876], DC: ['District of Columbia', 678],
  FL: ['Florida', 738], GA: ['Georgia', 733], HI: ['Hawaii', 592], ID: ['Idaho', 553], IL: ['Illinois', 707],
  IN: ['Indiana', 537], IA: ['Iowa', 528], KS: ['Kansas', 748], KY: ['Kentucky', 667], LA: ['Louisiana', 730],
  ME: ['Maine', 804], MD: ['Maryland', 491], MA: ['Massachusetts', 551], MI: ['Michigan', 595], MN: ['Minnesota', 525],
  MS: ['Mississippi', 814], MO: ['Missouri', 675], MT: ['Montana', 889], NE: ['Nebraska', 780], NV: ['Nevada', 565],
  NH: ['New Hampshire', 486], NJ: ['New Jersey', 665], NM: ['New Mexico', 725], NY: ['New York', 1041],
  NC: ['North Carolina', 660], ND: ['North Dakota', 610], OH: ['Ohio', 603], OK: ['Oklahoma', 686], OR: ['Oregon', 519],
  PA: ['Pennsylvania', 648], RI: ['Rhode Island', 629], SC: ['South Carolina', 702], SD: ['South Dakota', 704],
  TN: ['Tennessee', 796], TX: ['Texas', 737], UT: ['Utah', 716], VT: ['Vermont', 1313], VA: ['Virginia', 549],
  WA: ['Washington', 768], WV: ['West Virginia', 1185], WI: ['Wisconsin', 720], WY: ['Wyoming', 1190],
};

// KFF (Jan. 2026): highest Medicaid/CHIP income limit for pregnant women, as % of the poverty line
// (includes the 5% income disregard). The unborn baby counts as an extra household member for this test.
const PREGNANCY_LIMIT = {
  AL: 317, AK: 230, AZ: 161, AR: 214, CA: 322, CO: 265, CT: 263, DE: 217, DC: 324, FL: 196, GA: 225, HI: 196,
  ID: 138, IL: 213, IN: 213, IA: 220, KS: 171, KY: 218, LA: 214, ME: 214, MD: 264, MA: 205, MI: 200, MN: 283,
  MS: 199, MO: 305, MT: 162, NE: 202, NV: 205, NH: 201, NJ: 205, NM: 255, NY: 223, NC: 201, ND: 175, OH: 205,
  OK: 210, OR: 190, PA: 220, RI: 258, SC: 199, SD: 138, TN: 255, TX: 207, UT: 144, VT: 213, VA: 205, WA: 215,
  WV: 305, WI: 306, WY: 159,
};

// Tobacco surcharge: the most an insurer may add for a tobacco user (federal cap 50%). Some states ban it
// (0) or cap it lower. Premium tax credits never cover the surcharge. Many insurers charge less than the cap.
const TOBACCO_MAX = { CA: 0, MA: 0, NJ: 0, NY: 0, RI: 0, VT: 0, DC: 0, CT: 0, ME: 0, AR: 20, CO: 15, KY: 40 };
const tobaccoMax = state => TOBACCO_MAX[state] ?? 50;

// States that have not expanded Medicaid for adults (KFF). Below 100% of the poverty line there is no
// Marketplace help in these states. Wisconsin covers adults up to 100% through its own program.
const NON_EXPANSION = ['AL', 'FL', 'GA', 'KS', 'MS', 'SC', 'TN', 'TX', 'WI', 'WY'];

// States that don't price by age (everyone pays the same adult rate), so the age curve is skipped.
const NO_AGE_RATING = ['NY', 'VT'];

// Federal default age curve (CMS): price of each age relative to a 21-year-old.
const AGE_FACTORS = [
  0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, 0.765, // 0–14
  0.833, 0.859, 0.885, 0.913, 0.941, 0.970,                                                                  // 15–20
  1.000, 1.000, 1.000, 1.000, 1.004, 1.024, 1.048, 1.087, 1.119,                                             // 21–29
  1.135, 1.159, 1.183, 1.198, 1.214, 1.222, 1.230, 1.238, 1.246, 1.262,                                      // 30–39
  1.278, 1.302, 1.325, 1.357, 1.397, 1.444, 1.500, 1.563, 1.635, 1.706,                                      // 40–49
  1.786, 1.865, 1.952, 2.040, 2.135, 2.230, 2.333, 2.437, 2.548, 2.603,                                      // 50–59
  2.714, 2.810, 2.873, 2.952, 3.000,                                                                         // 60–64
];
const ageFactor = age => AGE_FACTORS[Math.min(Math.max(age, 0), 64)];

function povertyLine(state, size) {
  const g = POVERTY_GUIDELINES_2026[state] || POVERTY_GUIDELINES_2026.standard;
  return g.first + g.each * (size - 1);
}

function applicablePercentage(fpl) {
  const band = APPLICABLE_PERCENTAGES_2027.find(b => fpl < b.to) || APPLICABLE_PERCENTAGES_2027.at(-1);
  const share = (Math.min(Math.max(fpl, band.from), band.to) - band.from) / (band.to - band.from);
  return band.start + (band.end - band.start) * share;
}

// Benchmark premium for everyone applying. Only the 3 oldest children under 21 are charged.
function householdBenchmark(state, ages, benchmark40) {
  if (NO_AGE_RATING.includes(state)) {
    const adults = ages.filter(a => a >= 21).length;
    const kids = Math.min(ages.filter(a => a < 21).length, 3);
    return benchmark40 * (adults + kids * 0.6);   // rough child rate where pricing isn't by age
  }
  const kids = ages.filter(a => a < 21).sort((a, b) => b - a).slice(0, 3);
  const adults = ages.filter(a => a >= 21);
  const total = [...adults, ...kids].reduce((sum, a) => sum + ageFactor(a), 0);
  return benchmark40 * total / ageFactor(40);
}

function estimate({ state, size, income, ages, benchmarkOverride }) {
  const fplAmount = povertyLine(state, size);
  const fpl = income / fplAmount * 100;
  const benchmark = benchmarkOverride || householdBenchmark(state, ages, BENCHMARK_40_2027[state][1]);
  const result = { fpl, fplAmount, benchmark, credit: 0, net: benchmark, pct: null, status: 'eligible' };

  const expansion = !NON_EXPANSION.includes(state);
  if (expansion && fpl < 138) result.status = 'medicaid';
  else if (!expansion && fpl < 100) result.status = state === 'WI' ? 'medicaid' : 'gap';
  else if (fpl > 400) result.status = 'over400';
  if (result.status !== 'eligible') return result;

  result.pct = applicablePercentage(fpl);
  const expected = income * result.pct / 100 / 12;
  result.credit = Math.max(0, benchmark - expected);
  result.net = benchmark - result.credit;
  if (fpl <= 150) result.csr = 94;
  else if (fpl <= 200) result.csr = 87;
  else if (fpl <= 250) result.csr = 73;
  return result;
}

// First 3 digits of a ZIP code -> state (USPS ranges). Used to fill in the state automatically.
const ZIP3_RANGES = [
  [5, 5, 'NY'], [10, 27, 'MA'], [28, 29, 'RI'], [30, 38, 'NH'], [39, 49, 'ME'], [50, 54, 'VT'], [55, 55, 'MA'],
  [56, 59, 'VT'], [60, 69, 'CT'], [70, 89, 'NJ'], [100, 149, 'NY'], [150, 196, 'PA'], [197, 199, 'DE'],
  [200, 200, 'DC'], [201, 201, 'VA'], [202, 205, 'DC'], [206, 219, 'MD'], [220, 246, 'VA'], [247, 268, 'WV'],
  [270, 289, 'NC'], [290, 299, 'SC'], [300, 319, 'GA'], [320, 349, 'FL'], [350, 369, 'AL'], [370, 385, 'TN'],
  [386, 397, 'MS'], [398, 399, 'GA'], [400, 427, 'KY'], [430, 459, 'OH'], [460, 479, 'IN'], [480, 499, 'MI'],
  [500, 528, 'IA'], [530, 549, 'WI'], [550, 567, 'MN'], [569, 569, 'DC'], [570, 577, 'SD'], [580, 588, 'ND'],
  [590, 599, 'MT'], [600, 629, 'IL'], [630, 658, 'MO'], [660, 679, 'KS'], [680, 693, 'NE'], [700, 714, 'LA'],
  [716, 729, 'AR'], [730, 732, 'OK'], [733, 733, 'TX'], [734, 749, 'OK'], [750, 799, 'TX'], [800, 816, 'CO'],
  [820, 831, 'WY'], [832, 838, 'ID'], [840, 847, 'UT'], [850, 865, 'AZ'], [870, 884, 'NM'], [885, 885, 'TX'],
  [889, 898, 'NV'], [900, 961, 'CA'], [967, 968, 'HI'], [970, 979, 'OR'], [980, 994, 'WA'], [995, 999, 'AK'],
];
function stateFromZip(zip) {
  if (!/^\d{5}$/.test(zip)) return null;
  const n = parseInt(zip.slice(0, 3), 10);
  const hit = ZIP3_RANGES.find(([a, b]) => n >= a && n <= b);
  return hit ? hit[2] : null;
}

// Age on January 1, 2027 (the start of the plan year) from a date of birth
function ageOn2027(dob) {
  const d = new Date(dob + 'T00:00:00');
  if (isNaN(d)) return NaN;
  let age = 2027 - d.getFullYear();
  if (d.getMonth() > 0 || d.getDate() > 1) age -= 1;
  return age;
}

// ===== Page wiring: everything updates as you type =====
(function () {
  const root = document.getElementById('calc');
  if (!root) return;
  const $ = sel => root.querySelector(sel);
  const zipIn = $('#calc-zip'), stateSel = $('#calc-state'), sizeIn = $('#calc-size'), incomeIn = $('#calc-income');
  const list = $('#calc-applicants'), out = $('#calc-out');
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const icon = {
    person: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><circle cx="12" cy="7.5" r="4"/><path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  Object.entries(BENCHMARK_40_2027).sort((a, b) => a[1][0].localeCompare(b[1][0])).forEach(([code, [name]]) => {
    stateSel.add(new Option(name, code, code === 'FL', code === 'FL'));
  });

  // ----- applicants -----
  let uid = 0;
  function addApplicant(role, age = '') {
    const id = ++uid;
    const card = document.createElement('div');
    card.className = 'calc-applicant';
    card.dataset.role = role;
    card.innerHTML = `
      <div class="calc-applicant-top">
        <span class="calc-role"></span>
        <button type="button" class="calc-x" aria-label="Remove this person">${icon.close}</button>
      </div>
      <div class="calc-agebox">
        <div class="calc-radio" role="radiogroup" aria-label="Enter age or date of birth">
          <label><input type="radio" name="mode${id}" value="age" checked> Age</label>
          <label><input type="radio" name="mode${id}" value="dob"> Date of birth</label>
        </div>
        <input class="calc-field calc-age" type="number" inputmode="numeric" min="0" max="120" placeholder="Age" value="${age}" aria-label="Age">
        <input class="calc-field calc-dob" type="date" aria-label="Date of birth" hidden>
      </div>
      <div class="calc-checks">
        <label class="calc-check calc-check-tob"><input type="checkbox" class="calc-tob"> Tobacco use in the last 6 months</label>
        <label class="calc-check calc-check-preg"><input type="checkbox" class="calc-preg"> Pregnant</label>
      </div>`;
    card.querySelector('.calc-x').addEventListener('click', () => { card.remove(); refresh(); });
    card.querySelectorAll('input[type=radio]').forEach(r => r.addEventListener('change', () => {
      const dob = r.value === 'dob' && r.checked;
      card.querySelector('.calc-age').hidden = dob;
      card.querySelector('.calc-dob').hidden = !dob;
      update();
    }));
    card.querySelectorAll('.calc-field, .calc-preg, .calc-tob').forEach(i => i.addEventListener(i.type === 'checkbox' ? 'change' : 'input', update));
    list.append(card);
    refresh();
    card.querySelector('.calc-age').focus();
  }
  function ageOf(card) {
    const dobMode = card.querySelector('input[value=dob]').checked;
    return dobMode ? ageOn2027(card.querySelector('.calc-dob').value) : parseInt(card.querySelector('.calc-age').value, 10);
  }
  function refresh() {
    const cards = [...list.children];
    let dep = 0;
    cards.forEach((c, i) => {
      const role = i === 0 ? 'You' : c.dataset.role === 'spouse' ? 'Spouse' : `Dependent ${++dep}`;
      c.querySelector('.calc-role').innerHTML = icon.person + ' ' + role;
      c.querySelector('.calc-x').hidden = cards.length === 1;
    });
    $('#calc-add-spouse').hidden = cards.some((c, i) => i > 0 && c.dataset.role === 'spouse');
    if (+sizeIn.value < cards.length) sizeIn.value = cards.length;   // household includes everyone applying
    update();
  }
  $('#calc-add-spouse').addEventListener('click', () => addApplicant('spouse'));
  $('#calc-add-dependent').addEventListener('click', () => addApplicant('dependent'));

  // ----- household -----
  zipIn.addEventListener('input', () => {
    zipIn.value = zipIn.value.replace(/\D/g, '').slice(0, 5);
    const st = stateFromZip(zipIn.value.length >= 3 ? zipIn.value.slice(0, 3).padEnd(5, '0') : '');
    const hint = $('#calc-state-hint');
    if (st && BENCHMARK_40_2027[st]) {
      if (stateSel.value !== st) {
        stateSel.value = st;
        stateSel.classList.remove('calc-flash'); void stateSel.offsetWidth; stateSel.classList.add('calc-flash');
      }
      hint.textContent = `Filled in from your ZIP code.`;
    } else {
      hint.textContent = zipIn.value.length === 5 ? 'We couldn’t match that ZIP code. Please choose your state.' : '';
    }
    update();
  });
  stateSel.addEventListener('change', update);
  const fmtIncome = n => n ? Number(n).toLocaleString('en-US') : '';
  incomeIn.addEventListener('input', () => { incomeIn.value = fmtIncome(incomeIn.value.replace(/\D/g, '').slice(0, 8)); update(); });
  sizeIn.addEventListener('input', update);
  root.querySelectorAll('[data-step]').forEach(btn => btn.addEventListener('click', () => {
    const target = $(btn.dataset.target), step = +btn.dataset.step;
    if (target === incomeIn) {
      const v = Math.max(0, Number(incomeIn.value.replace(/\D/g, '')) + step);
      incomeIn.value = fmtIncome(v);
    } else {
      sizeIn.value = Math.max(list.children.length, Math.min(20, (+sizeIn.value || 1) + step));
    }
    update();
  }));

  // ----- eligibility + price, recalculated on every change -----
  function update() {
    const state = stateSel.value, stateName = BENCHMARK_40_2027[state][0];
    const income = Number(incomeIn.value.replace(/\D/g, ''));
    const size = Math.max(+sizeIn.value || 1, list.children.length);
    const ages = [...list.children].map(ageOf);
    const people = [...list.children].map((c, i) => ({ role: c.querySelector('.calc-role').textContent.trim(), age: ages[i], pregnant: c.querySelector('.calc-preg').checked && ages[i] >= 10 }));
    [...list.children].forEach((c, i) => { c.querySelector('.calc-check-preg').hidden = ages[i] < 10; c.querySelector('.calc-check-tob').hidden = ages[i] < 18; });
    people.forEach((p, i) => { p.tobacco = list.children[i].querySelector('.calc-tob').checked && ages[i] >= 18; });

    if (!income || ages.some(a => !(a >= 0 && a <= 120))) {
      out.innerHTML = `<div class="calc-alert calc-alert-info">Enter your household income and the age of each person applying to see your estimate.</div>
        <a class="button calc-cta" href="quote.html?type=${size > 1 ? 'family' : 'individual'}">Get my exact quote</a>`;
      return;
    }
    const override = Number(($('#calc-benchmark').value || '').replace(/[^\d.]/g, '')) || 0;

    const personList = (title, list) => `<p class="calc-elig-title">${title}</p><ul class="calc-people">${list.map(p => `<li>${icon.person} ${p.role}, ${p.age}${p.pregnant ? ' (pregnant)' : ''}</li>`).join('')}</ul>`;
    // Pregnancy: the baby counts as one more household member, and Medicaid limits are higher.
    const babies = people.filter(p => p.pregnant).length;
    const pregFpl = income / povertyLine(state, size + babies) * 100;
    const pregMedicaid = people.filter(p => p.pregnant && pregFpl <= PREGNANCY_LIMIT[state]);
    const marketplacePeople = people.filter(p => !pregMedicaid.includes(p));
    const r = estimate({ state, size, income, ages: marketplacePeople.map(p => p.age), benchmarkOverride: override });
    if (!marketplacePeople.length) r.status = 'medicaid';

    // Tobacco surcharge for Marketplace applicants who use tobacco (paid in full, savings don't cover it)
    const smokers = marketplacePeople.filter(p => p.tobacco);
    const maxPct = tobaccoMax(state);
    const fullBenchmark40 = BENCHMARK_40_2027[state][1];
    const personPrice = age => householdBenchmark(state, [age], fullBenchmark40);
    const scale = override ? override / householdBenchmark(state, marketplacePeople.map(p => p.age), fullBenchmark40) : 1;
    const tobaccoExtra = smokers.reduce((sum, p) => sum + personPrice(p.age) * scale * maxPct / 100, 0);
    const tobaccoNote = !smokers.length || r.status === 'medicaid' ? '' : maxPct === 0
      ? `<p class="calc-small">${stateName} doesn’t allow insurers to charge more for tobacco use.</p>`
      : `<p class="calc-badge">Tobacco use: insurers in ${stateName} can charge up to ${maxPct}% more for tobacco users, about <strong>${money(tobaccoExtra)}/mo</strong> extra on this plan. Your savings don’t cover this amount. Many insurers charge less, and some offer quit-smoking programs to remove it.</p>`;
    const pregNote = pregMedicaid.length && marketplacePeople.length && r.status !== 'medicaid'
      ? personList(`Likely eligible for ${stateName} Medicaid because of pregnancy (not included in the price above):`, pregMedicaid) : '';
    const fplLine = `<p class="calc-fpl">Household income is <strong>${Math.round(r.fpl)}%</strong> of the federal poverty line (${money(r.fplAmount)} for ${size} ${size === 1 ? 'person' : 'people'}).</p>`;
    const kidsNote = marketplacePeople.filter(p => p.age < 19);

    // Children's Medicaid/CHIP limits are at least about 200% of the poverty line in nearly every state,
    // so when only children are applying at that income, they usually qualify there instead.
    if (r.status === 'eligible' && marketplacePeople.every(p => p.age < 19) && r.fpl < 200) r.status = 'medicaid';

    let html;
    if (r.status === 'medicaid') {
      html = `<div class="calc-alert calc-alert-warn">Your applicants are likely not eligible for savings on Marketplace plans.</div>
        <div class="calc-panel">${personList(`May be eligible for ${stateName} Medicaid or CHIP:`, people)}${fplLine}</div>`;
    } else if (r.status === 'gap') {
      html = `<div class="calc-alert calc-alert-warn">At this income, adults in ${stateName} don’t qualify for Marketplace savings.</div>
        <div class="calc-panel"><p>${stateName} hasn’t expanded Medicaid, and Marketplace savings start at 100% of the poverty line.</p>
        ${kidsNote.length ? personList('Children may be eligible for Medicaid or CHIP:', kidsNote) : ''}${pregNote}${fplLine}</div>`;
    } else if (r.status === 'over400') {
      html = `<div class="calc-alert calc-alert-warn">Your household is likely not eligible for savings in 2027.</div>
        <div class="calc-panel"><p class="calc-label">Benchmark silver, full price</p><p class="calc-big">${money(r.benchmark)}<span>/mo</span></p>
        <p>For 2027, Marketplace savings stop above 400% of the poverty line. A bronze plan or a plan outside the Marketplace may cost less.</p>${tobaccoNote}${pregNote}${fplLine}</div>`;
    } else {
      const chip = kidsNote.length && r.fpl < 200;
      html = `<div class="calc-alert calc-alert-ok">Your household is likely eligible for savings on Marketplace plans.</div>
        <div class="calc-panel">
          <div class="calc-nums">
            <div><p class="calc-label">Estimated savings</p><p class="calc-big">${money(r.credit)}<span>/mo</span></p></div>
            <div><p class="calc-label">Benchmark silver after savings</p><p class="calc-big">${money(r.net)}<span>/mo</span></p></div>
          </div>
          <p class="calc-small">Full price before savings: about ${money(r.benchmark)}/mo. You’d pay about ${r.pct.toFixed(2)}% of your income for this plan. Your savings work on any metal level, so bronze can cost less, sometimes $0.</p>
          ${r.csr ? `<p class="calc-badge">Extra savings on silver: lower deductibles and copays (${r.csr}% plan value instead of 70%).</p>` : ''}
          ${chip ? personList('May be eligible for Medicaid or CHIP instead:', kidsNote) : ''}
          ${tobaccoNote}
          ${pregNote}
          ${fplLine}
        </div>`;
    }
    out.innerHTML = html + `
      <p class="calc-fine">Estimate based on ${override ? 'the benchmark price you entered' : `${stateName}’s average 2027 benchmark price`}. Actual prices vary by county, plan, and tobacco use. Savings are settled on your taxes, so if your 2027 income ends up higher you may have to pay some back.</p>
      <a class="button calc-cta" href="${quoteLink(size, income, ages)}">Get my exact quote</a>`;
  }

  // The quote form skips questions the visitor already answered here
  function quoteLink(size, income, ages) {
    const answers = { size, ages: ages.join(', ') };
    if (/^\d{5}$/.test(zipIn.value)) answers.zip = zipIn.value;
    if (ages[0] >= 1) answers.age = ages[0];
    if (income) answers.income = income;
    // Kept in this browser tab only, so income and ages never appear in the web address
    try { sessionStorage.setItem('altius-calc', JSON.stringify(answers)); } catch (e) { /* the form just asks again */ }
    return `quote.html?type=${size > 1 ? 'family' : 'individual'}&from=calculator`;
  }

  addApplicant('self');
})();
