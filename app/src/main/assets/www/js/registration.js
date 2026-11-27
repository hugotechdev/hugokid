HK.screens.registration = el => {
  const user = Net.user();
  const parent = user.role === 'parent';
  const tutor = user.school?.type === 'tutor';
  const body = dash(el, 'Complete registration', '', '<p role="status">Loading your registration…</p>', false);
  const token = Net.token();

  Net.get('/api/registration').then(({ draft, levels, grades }) => {
    if (!el.isConnected) return;
    const emptyChild = () => ({ name: '', birth: '', grade: '' });
    let children = draft.children?.length ? draft.children : [emptyChild()];
    const escape = value => esc(value || '');
    const date = new Date();
    const latestBirth = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    function childFields(child, i) {
      return `<fieldset class="card registration-child">
        <legend>Child ${i + 1}</legend>
        <label class="label" for="child-name-${i}">Full name</label>
        <input class="field" id="child-name-${i}" data-field="name" maxlength="100" value="${escape(child.name)}" required>
        <label class="label" for="child-birth-${i}">Date of birth</label>
        <input class="field" id="child-birth-${i}" data-field="birth" type="date" max="${latestBirth}" value="${escape(child.birth)}" required>
        <label class="label" for="child-grade-${i}">Grade</label>
        <select class="field" id="child-grade-${i}" data-field="grade" required><option value="">Choose grade</option>
          ${grades.map((grade, j) => `<option value="${esc(grade)}" ${grade === child.grade ? 'selected' : ''}>${esc(j ? T(grade) : 'Not in school yet')}</option>`).join('')}
        </select>
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
      <p id="registration-message" role="status"></p>
      <div class="chips registration-actions">
        <button class="btn" type="submit">Review registration</button>
        <button class="btn ghost" type="button" id="save-registration">Save and continue later</button>
        <button class="btn ghost" type="button" id="registration-signout">Sign out</button>
      </div></form>`;

    const form = $('form', body);
    const message = $('#registration-message', form);
    const readChildren = () => $$('.registration-child', form).map(card =>
      Object.fromEntries($$('[data-field]', card).map(input => [input.dataset.field, input.value.trim()])));
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

    async function save(button, data, complete) {
      if (button.disabled) return;
      button.disabled = true;
      message.textContent = '';
      try {
        const result = await Net.put('/api/registration', { ...data, complete });
        if (!el.isConnected || Net.token() !== token) return;
        if (result.user) {
          Net.acceptSession(token, result.user);
          routeByRole();
        } else {
          message.textContent = 'Draft saved. You can sign out and resume later.';
        }
      } catch (error) {
        message.textContent = error.message;
        toast(error.message);
      } finally { button.disabled = false; }
    }

    $('#save-registration', form).onclick = event => save(event.currentTarget, collect(), false);
    $('#registration-signout', form).onclick = () => { Net.logout(); routeByRole(); };
    form.onsubmit = event => {
      event.preventDefault();
      const data = collect();
      if (!parent && !data.levels.length) {
        message.textContent = 'Choose at least one class.';
        return;
      }
      const lines = parent ? data.children.map(c => [c.name, c.birth, c.grade === grades[0] ? 'Not in school yet' : T(c.grade)].join(' · ')) :
        [data.name, [data.district, data.region].join(', '), data.levels.map(T).join(', '), data.studentCount + ' students'];
      modal(el, {
        title: 'Review registration',
        html: `<p>${esc(user.name)}</p>${lines.map(line => `<p>${esc(line)}</p>`).join('')}`,
        buttons: [
          { label: 'Complete registration', keepOpen: true, onClick: dialog => save($('.btn-row .btn', dialog), data, true) },
          { label: 'Edit details', cls: 'ghost' },
        ],
      });
    };
  }).catch(error => { if (el.isConnected) body.innerHTML = errBox(error); });
};
