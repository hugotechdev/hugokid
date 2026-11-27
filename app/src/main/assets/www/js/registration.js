HK.screens.registration = el => {
  const user = Net.user();
  const parent = user.role === 'parent';
  const tutor = user.school?.type === 'tutor';
  const body = dash(el, 'Complete registration', '', '<p role="status">Loading your registration…</p>', false);
  const token = Net.token();
  const needsPin = parent && !Store.parent()?.pinHash;

  Net.get('/api/registration').then(({ draft, levels, grades, ages = Array.from({ length: 11 }, (_, index) => index + 3) }) => {
    if (!el.isConnected) return;
    const emptyChild = () => ({ name: '', age: '', grade: '', avatar: '', religion: 'values', faithOn: true, needs: [] });
    let children = draft.children?.length ? draft.children : [emptyChild()];
    const escape = value => esc(value || '');
    const ageLabel = age => age === ages[ages.length - 1] ? age + '+' : String(age);

    function childFields(child, i) {
      return `<fieldset class="card registration-child">
        <legend>Child ${i + 1}</legend>
        <label class="label" for="child-name-${i}">Full name</label>
        <input class="field" id="child-name-${i}" data-field="name" maxlength="100" value="${escape(child.name)}" required>
        <label class="label" for="child-age-${i}">Age (years)</label>
        <select class="field" id="child-age-${i}" data-field="age" required><option value="">Choose age</option>
          ${ages.map(age => `<option value="${age}" ${age === Number(child.age) ? 'selected' : ''}>${ageLabel(age)}</option>`).join('')}
        </select>
        <label class="label" for="child-grade-${i}">Grade</label>
        <select class="field" id="child-grade-${i}" data-field="grade" required><option value="">Choose grade</option>
          ${grades.map((grade, j) => `<option value="${esc(grade)}" ${grade === child.grade ? 'selected' : ''}>${esc(j ? T(grade) : 'Not in school yet')}</option>`).join('')}
        </select>
        <fieldset class="registration-levels">
          <legend>Child avatar</legend>
          <div class="avatar-pick chips">${KID_AVATARS.map((id, index) => {
            const selected = id === (child.avatar || KID_AVATARS[i % KID_AVATARS.length]);
            return `<label><input type="radio" name="avatar-${i}" data-field="avatar" value="${id}" ${selected ? 'checked' : ''} aria-label="Avatar ${index + 1}">${kidAvatar({ avatar: id, color: AVATAR_COLORS[index] }, 44)}</label>`;
          }).join('')}</div>
        </fieldset>
        <fieldset class="registration-levels">
          <legend>Faith and values</legend>
          <label><input type="checkbox" data-faith ${child.faithOn !== false ? 'checked' : ''}> Include the faith and values section</label>
          <label class="label" for="child-faith-${i}">Faith or values preference</label>
          <select class="field" id="child-faith-${i}" data-field="religion">
            ${Object.entries(RELIGIONS).map(([id, choice]) => `<option value="${id}" ${id === (child.religion || 'values') ? 'selected' : ''}>${esc(T(choice.name))}</option>`).join('')}
          </select>
        </fieldset>
        <fieldset class="registration-levels">
          <legend>Learning support (optional)</legend>
          ${Object.entries(NEEDS).map(([id, label]) => `<label><input type="checkbox" data-need value="${id}" ${child.needs?.includes(id) ? 'checked' : ''}> ${esc(T(label))}</label>`).join('')}
        </fieldset>
        ${children.length > 1 ? `<button type="button" class="btn ghost small" data-remove="${i}">Remove child</button>` : ''}
      </fieldset>`;
    }

    body.innerHTML = `<form class="card registration-form">
      <h2>${esc(user.name)}</h2><p>${[user.phone, user.email].filter(Boolean).map(esc).join(' · ')}</p>
      ${parent ? `<h3>Children</h3><div id="registration-children"></div><button type="button" class="btn ghost small" id="add-child">Add another child</button>` : `
        <label class="label" for="registration-name">${tutor ? 'Tutor or tuition centre name' : 'School name'}</label>
        <input class="field" id="registration-name" maxlength="100" value="${escape(draft.name ?? user.school?.name)}" required>
        <label class="label" for="registration-region">Region</label><input class="field" id="registration-region" maxlength="80" value="${escape(draft.region ?? user.school?.region)}" required>
        <label class="label" for="registration-district">District</label><input class="field" id="registration-district" maxlength="80" value="${escape(draft.district ?? user.school?.district)}" required>
        <fieldset class="registration-levels"><legend>Classes taught</legend>${levels.map(level => `<label><input type="checkbox" name="level" value="${esc(level)}" ${(draft.levels ?? user.school?.levels ?? []).includes(level) ? 'checked' : ''}> ${esc(T(level))}</label>`).join('')}</fieldset>
        <label class="label" for="registration-count">Number of students</label><input class="field" id="registration-count" type="number" min="1" max="10000" value="${escape(draft.studentCount)}" required>
      `}
      ${needsPin ? `<fieldset class="card registration-levels">
        <legend>Parent PIN</legend>
        <p>Use this PIN to open the parent area on this device and approve extra time.</p>
        <label class="label" for="registration-pin">Create a 4-digit PIN</label>
        <input class="field" id="registration-pin" type="password" inputmode="numeric" autocomplete="new-password" minlength="4" maxlength="4" pattern="[0-9]{4}" required>
        <label class="label" for="registration-pin-confirm">Confirm PIN</label>
        <input class="field" id="registration-pin-confirm" type="password" inputmode="numeric" autocomplete="new-password" minlength="4" maxlength="4" pattern="[0-9]{4}" required>
      </fieldset>` : ''}
      <p id="registration-message" role="status"></p>
      <div class="chips registration-actions">
        <button class="btn" type="submit">Complete registration</button>
        <button class="btn ghost" type="button" id="registration-signout">Sign out</button>
      </div></form>`;

    const form = $('form', body);
    const message = $('#registration-message', form);
    const readChildren = () => $$('.registration-child', form).map(card => ({
      ...Object.fromEntries($$('[data-field]:not([type=radio]), [data-field][type=radio]:checked', card).map(input => [input.dataset.field, input.value.trim()])),
      faithOn: $('[data-faith]', card).checked,
      needs: $$('[data-need]:checked', card).map(input => input.value),
    }));
    const drawChildren = () => {
      $('#registration-children', form).innerHTML = children.map(childFields).join('');
      $('#add-child', form).disabled = children.length >= 25;
      $$('[data-remove]', form).forEach(button => button.onclick = () => {
        children = readChildren();
        children.splice(+button.dataset.remove, 1);
        drawChildren();
      });
    };
    if (parent) {
      drawChildren();
      $('#add-child', form).onclick = () => {
        children = [...readChildren(), emptyChild()];
        drawChildren();
        $('.registration-child:last-child input', form).focus();
      };
    }
    const collect = () => parent ? { children: readChildren() } : {
      name: $('#registration-name', form).value.trim(), region: $('#registration-region', form).value.trim(),
      district: $('#registration-district', form).value.trim(), studentCount: $('#registration-count', form).value,
      levels: $$('input[name=level]:checked', form).map(input => input.value),
    };

    async function completeRegistration(button, data, pin) {
      if (button.disabled) return;
      button.disabled = true;
      message.textContent = '';
      try {
        const pinHash = pin ? await hashPin(pin) : null;
        if (!el.isConnected || Net.token() !== token) return;
        const result = await Net.put('/api/registration', { ...data, complete: true });
        if (Net.token() !== token) return;
        if (pinHash) Store.saveParent({
          created: Date.now(), settings: {}, terms: { v: TERMS_VERSION, at: Date.now() },
          ...Store.parent(), pinHash,
        });
        if (!el.isConnected) return;
        Net.acceptSession(token, result.user);
        routeByRole();
      } catch (error) {
        message.textContent = error.message;
        toast(error.message);
      } finally { button.disabled = false; }
    }

    $('#registration-signout', form).onclick = () => { Net.logout(); routeByRole(); };
    form.onsubmit = event => {
      event.preventDefault();
      const data = collect();
      if (!parent && !data.levels.length) {
        message.textContent = 'Choose at least one class.';
        return;
      }
      const pin = needsPin ? $('#registration-pin', form).value : '';
      if (needsPin && (!/^[0-9]{4}$/.test(pin) || pin !== $('#registration-pin-confirm', form).value)) {
        message.textContent = 'Enter the same 4-digit PIN in both fields.';
        return;
      }
      completeRegistration($('button[type=submit]', form), data, pin);
    };
  }).catch(error => { if (el.isConnected) body.innerHTML = errBox(error); });
};
