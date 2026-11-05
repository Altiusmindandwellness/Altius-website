// ===== Step-by-step quote form =====
// Sends through Web3Forms using the WEB3FORMS_ACCESS_KEY set at the top of script.js.

(function () {
  const form = document.getElementById('quote-form');
  if (!form) return;

  let steps = [...form.querySelectorAll('.quote-step')];
  const nextBtn = document.getElementById('quote-next');
  const backBtn = document.getElementById('quote-back');
  const consent = form.querySelector('.quote-consent');
  const bar = document.querySelector('.quote-progress-bar');
  const stepNow = document.getElementById('step-now');
  let current = 0;

  // Quote type comes from the link: quote.html?type=individual | family | business
  const types = { individual: 'Individual', family: 'Family', business: 'Business' };
  const type = types[new URLSearchParams(location.search).get('type')] || 'Individual';
  document.getElementById('quote-type').value = type;

  // Some steps only apply to some quote types: data-only="business" (employees), data-not="business" (household income)
  steps = steps.filter(s => {
    const only = s.dataset.only, not = s.dataset.not, t = type.toLowerCase();
    if ((only && only !== t) || (not && not === t)) { s.remove(); return false; }
    return true;
  });
  // Coming from the price calculator: fill in what we already know and skip those questions
  const params = new URLSearchParams(location.search);
  const fromCalc = params.get('from') === 'calculator';
  const known = { zip: /^\d{5}$/, age: /^\d{1,3}$/, income: /^\d{1,9}$/ };
  Object.entries(known).forEach(([name, pattern]) => {
    const v = params.get(name), input = form.elements[name];
    if (!v || !input || !pattern.test(v)) return;
    input.value = name === 'income' ? Number(v).toLocaleString('en-US') : v;
    const step = input.closest('.quote-step');
    step.hidden = true;                       // keep the answer, skip the question
    steps = steps.filter(s => s !== step);
  });

  // "Back" returns to whichever page sent them here
  const backLink = document.getElementById('quote-back-link');
  if (backLink && document.referrer.startsWith(location.origin)) backLink.href = document.referrer;

  document.getElementById('step-total').textContent = steps.length;
  document.getElementById('quote-title').textContent = `Get Your Free ${type} Quote`;
  document.title = `Get a Free ${type} Quote | Altius Mind & Wellness Solutions`;

  // Light formatting as people type
  const phone = form.elements.phone, zip = form.elements.zip, income = form.elements.income;
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 10);
    phone.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
                : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d;
  });
  zip.addEventListener('input', () => { zip.value = zip.value.replace(/\D/g, '').slice(0, 5); });
  if (income) income.addEventListener('input', () => {   // income question isn't on every form
    const d = income.value.replace(/\D/g, '').slice(0, 9);
    income.value = d ? Number(d).toLocaleString('en-US') : '';
  });

  // Check the answer on the current step
  function problem(input) {
    const v = input.value.trim();
    if (!v) return 'Please fill this in to continue.';
    switch (input.name) {
      case 'phone': return v.replace(/\D/g, '').length === 10 ? '' : 'Please enter a 10-digit phone number.';
      case 'age': return (+v >= 1 && +v <= 120) ? '' : 'Please enter an age between 1 and 120.';
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.';
      case 'zip': return /^\d{5}$/.test(v) ? '' : 'Please enter a 5-digit ZIP code.';
      case 'employees': return (Number.isInteger(+v) && +v >= 1 && +v <= 100000) ? '' : 'Please enter the number of employees (1 or more).';
    }
    return '';
  }

  function show(i) {
    steps.forEach((s, n) => { s.hidden = n !== i; });
    current = i;
    const last = i === steps.length - 1;
    backBtn.hidden = i === 0;
    consent.hidden = !last;
    nextBtn.textContent = last ? 'Get my quote' : 'Next';
    stepNow.textContent = i + 1;
    bar.style.width = `${((i + 1) / steps.length) * 100}%`;
    steps[i].querySelector('input').focus();
  }

  backBtn.addEventListener('click', () => show(current - 1));

  // "Next" button and the Enter key both submit the form; we move one step at a time
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const inputs = [...steps[current].querySelectorAll('input')];
    const error = steps[current].querySelector('.quote-error');
    const bad = inputs.find(i => problem(i));
    error.textContent = bad ? problem(bad) : '';
    if (bad) { bad.focus(); return; }
    if (current < steps.length - 1) { show(current + 1); return; }

    // Last step: send everything
    nextBtn.disabled = true;
    nextBtn.textContent = 'Sending…';
    const data = Object.fromEntries(new FormData(form));
    if (data.income) data.income = '$' + data.income;
    const payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: `New ${type} quote request from ${data.first_name} ${data.last_name}`,
      from_name: 'Altius website quote form',
      botcheck: data._honey,
      'Quote type': type,
      'First name': data.first_name,
      'Last name': data.last_name,
      'Phone': data.phone,
      'Age': data.age,
      'Email': data.email,
      'ZIP code': data.zip,
      ...(data.employees ? { 'Number of employees': data.employees } : {}),
      ...(data.income ? { 'Estimated annual income': data.income } : {}),
      ...(params.get('size') ? { 'Household size': params.get('size') } : {}),
      ...(params.get('ages') ? { 'Ages applying': params.get('ages') } : {}),
      ...(fromCalc ? { 'Came from': '2027 price calculator' } : {}),
      replyto: data.email,
    };
    try {
      if (WEB3FORMS_ACCESS_KEY.startsWith('PASTE')) throw new Error('Web3Forms access key not added yet');
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result.message || res.status);
      form.hidden = true;
      document.querySelector('.quote-progress').hidden = true;
      document.querySelector('.quote-step-count').hidden = true;
      document.getElementById('quote-done').hidden = false;
    } catch (err) {
      error.innerHTML = 'Sorry, something went wrong sending your information. Please try again, or email us at <a href="mailto:Shayhealthadvisor@gmail.com">Shayhealthadvisor@gmail.com</a>.';
      nextBtn.disabled = false;
      nextBtn.textContent = 'Get my quote';
    }
  });

  show(0);
})();
