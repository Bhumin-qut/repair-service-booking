(function () {
  function todayIso() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return now.getFullYear() + '-' + month + '-' + day;
  }

  document.querySelectorAll('input[type="date"][data-min-today]').forEach(function (input) {
    input.min = todayIso();
  });

  document.querySelectorAll('form.needs-validation').forEach(function (form) {
    const password = form.querySelector('[data-match-password]');
    const confirm = form.querySelector('[data-match-confirm]');
    const photo = form.querySelector('input[name="photo"]');
    const photoError = form.querySelector('#photoError');

    function syncPasswords() {
      if (!password || !confirm) return;
      if (!password.required && !password.value && !confirm.value) {
        confirm.setCustomValidity('');
        return;
      }
      confirm.setCustomValidity(password.value === confirm.value ? '' : 'Passwords do not match.');
    }

    function syncPhoto() {
      if (!photo) return;
      const file = photo.files && photo.files[0];
      let message = '';
      if (file && !file.type.startsWith('image/')) {
        message = 'Only image files are allowed.';
      } else if (file && file.size > 2 * 1024 * 1024) {
        message = 'Photo must be 2MB or smaller.';
      }
      photo.setCustomValidity(message);
      if (photoError) photoError.textContent = message;
    }

    if (password && confirm) {
      password.addEventListener('input', syncPasswords);
      confirm.addEventListener('input', syncPasswords);
    }

    if (photo) {
      photo.addEventListener('change', syncPhoto);
    }

    form.addEventListener('submit', function (event) {
      syncPasswords();
      syncPhoto();
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });
})();
