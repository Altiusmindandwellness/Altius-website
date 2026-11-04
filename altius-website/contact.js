// ===== Contact form: emails the message to you through Web3Forms (key in script.js) =====
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const error = document.getElementById('contact-error');
  const send = document.getElementById('contact-send');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    for (const k of ['first_name', 'last_name', 'email', 'message']) data[k] = (data[k] || '').trim();

    // check everything is filled in
    const missing = [['first_name', 'your first name'], ['last_name', 'your last name'], ['email', 'your email'], ['message', 'a message']]
      .find(([k]) => !data[k]);
    if (missing) { error.textContent = `Please enter ${missing[1]}.`; form.elements[missing[0]].focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { error.textContent = 'Please enter a valid email address.'; form.elements.email.focus(); return; }
    error.textContent = '';

    send.disabled = true;
    send.textContent = 'Sending…';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `New message from ${data.first_name} ${data.last_name} (website contact form)`,
          from_name: 'Altius website contact form',
          botcheck: data.botcheck,
          'First name': data.first_name,
          'Last name': data.last_name,
          'Email': data.email,
          'Message': data.message,
          replyto: data.email,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success) throw new Error(result.message || res.status);
      form.hidden = true;
      document.getElementById('contact-done').hidden = false;
    } catch (err) {
      error.innerHTML = 'Sorry, something went wrong sending your message. Please try again, or email us at <a href="mailto:Shayhealthadvisor@gmail.com">Shayhealthadvisor@gmail.com</a>.';
      send.disabled = false;
      send.textContent = 'Send';
    }
  });
})();
