(function () {
  'use strict';

  /* ── DOM refs ──────────────────────────────────────────── */
  const form        = document.getElementById('loginForm');
  const nikEmailEl  = document.getElementById('nikEmail');
  const passwordEl  = document.getElementById('password');
  const hubEl       = document.getElementById('hubSelect');
  const rememberEl  = document.getElementById('rememberMe');
  const toggleBtn   = document.getElementById('togglePassword');
  const loginBtn    = document.getElementById('loginBtn');
  const loginError  = document.getElementById('loginError');
  const loginErrMsg = document.getElementById('loginErrorMsg');
  const eyeShow     = toggleBtn.querySelector('.icon-eye-show');
  const eyeHide     = toggleBtn.querySelector('.icon-eye-hide');
  const spinner     = loginBtn.querySelector('.btn-login__spinner');
  const arrow       = loginBtn.querySelector('.btn-login__arrow');
  const btnLabel    = loginBtn.querySelector('.btn-login__label');

  /* ── Restore remember-me ───────────────────────────────── */
  const savedNik = localStorage.getItem('anteraja_remembered_nik');
  const savedHub = localStorage.getItem('anteraja_remembered_hub');
  if (savedNik) {
    nikEmailEl.value  = savedNik;
    rememberEl.checked = true;
  }
  if (savedHub) {
    hubEl.value = savedHub;
  }

  /* ── Password visibility toggle ───────────────────────── */
  toggleBtn.addEventListener('click', function () {
    const isPassword = passwordEl.type === 'password';
    passwordEl.type = isPassword ? 'text' : 'password';
    eyeShow.style.display = isPassword ? 'none'  : '';
    eyeHide.style.display = isPassword ? ''      : 'none';
    this.setAttribute('aria-label',   isPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    this.setAttribute('aria-pressed', String(isPassword));
  });

  /* ── Inline validation helpers ─────────────────────────── */
  function setFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('is-invalid');
    inputEl.setAttribute('aria-invalid', 'true');
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(inputEl, errorEl) {
    inputEl.classList.remove('is-invalid');
    inputEl.removeAttribute('aria-invalid');
    if (errorEl) errorEl.textContent = '';
  }

  function validateForm() {
    let valid = true;
    const nikErrorEl  = document.getElementById('nikEmail-error');
    const passErrorEl = document.getElementById('password-error');

    // NIK / Email
    if (!nikEmailEl.value.trim()) {
      setFieldError(nikEmailEl, nikErrorEl, 'NIK atau Email Dinas wajib diisi.');
      valid = false;
    } else {
      clearFieldError(nikEmailEl, nikErrorEl);
    }

    // Password
    if (!passwordEl.value) {
      setFieldError(passwordEl, passErrorEl, 'Kata Sandi wajib diisi.');
      valid = false;
    } else if (passwordEl.value.length < 6) {
      setFieldError(passwordEl, passErrorEl, 'Kata Sandi minimal 6 karakter.');
      valid = false;
    } else {
      clearFieldError(passwordEl, passErrorEl);
    }

    return valid;
  }

  /* Clear field errors on input */
  nikEmailEl.addEventListener('input', function () {
    clearFieldError(this, document.getElementById('nikEmail-error'));
  });
  passwordEl.addEventListener('input', function () {
    clearFieldError(this, document.getElementById('password-error'));
  });

  /* ── Loading state helpers ──────────────────────────────── */
  function setLoading(loading) {
    loginBtn.disabled = loading;
    spinner.hidden    = !loading;
    arrow.style.display   = loading ? 'none' : '';
    btnLabel.textContent  = loading ? 'Memverifikasi…' : 'Masuk ke Panel Dispatch';
  }

  /* ── Show / hide global error ───────────────────────────── */
  function showLoginError(message) {
    loginErrMsg.textContent = message;
    loginError.hidden = false;
    loginError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideLoginError() {
    loginError.hidden = true;
  }

  /* ── Form submit ────────────────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideLoginError();

    if (!validateForm()) return;

    const hub      = hubEl.value;
    const nikEmail = nikEmailEl.value.trim();
    const password = passwordEl.value;
    const remember = rememberEl.checked;

    setLoading(true);

    // Persist remember-me preference
    if (remember) {
      localStorage.setItem('anteraja_remembered_nik', nikEmail);
      localStorage.setItem('anteraja_remembered_hub', hub);
    } else {
      localStorage.removeItem('anteraja_remembered_nik');
      localStorage.removeItem('anteraja_remembered_hub');
    }

    // Redirect langsung ke panel utama
    window.location.href = 'html/live-monitoring-map.html';
  });

  /* ── Forgot password ────────────────────────────────────── */
  document.getElementById('forgotPasswordBtn').addEventListener('click', function () {
    alert('Silakan hubungi IT Support Anteraja untuk mereset kata sandi Anda.');
  });

})();
