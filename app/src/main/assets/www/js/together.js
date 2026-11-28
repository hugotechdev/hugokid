

const RTC_CFG = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
const CALL_LIMIT_MIN = 20;

HK.screens.friends = (el, p) => {
  const c = Store.child(p.id);
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Marafiki wa ${esc(c.name)}</h1></div><div class="scroll" id="b"><div class="empty">Inapakia...</div></div>`;
  $('#bk', el).onclick = () => HK.back();
  const b = $('#b', el);
  if (!(Net.online() && c.serverId)) { b.innerHTML = '<div class="empty">Fungua akaunti ya mzazi kwanza (Eneo la Mzazi, kisha Shule).</div>'; return; }
  const draw = async () => {
    try {
      const [friends, calls, kids] = await Promise.all([Net.get(`/api/children/${c.serverId}/friends`), Net.get(`/api/children/${c.serverId}/calls`), Net.get('/api/children')]);
      const me = kids.find(k => k.id === c.serverId) || {};
      b.innerHTML = `
        <div class="card"><h3>Ruhusa</h3>
          <div class="row" style="justify-content:space-between;margin-top:8px"><span>Voice calls</span><div class="chips"><button class="chip ${me.allow_audio ? 'on' : ''}" data-perm="allow_audio" data-v="1">Ruhusu</button><button class="chip ${me.allow_audio ? '' : 'on'}" data-perm="allow_audio" data-v="0">Zuia</button></div></div>
          <div class="row" style="justify-content:space-between;margin-top:8px"><span>Video calls</span><div class="chips"><button class="chip ${me.allow_video ? 'on' : ''}" data-perm="allow_video" data-v="1">Ruhusu</button><button class="chip ${me.allow_video ? '' : 'on'}" data-perm="allow_video" data-v="0">Zuia</button></div></div>
          <p class="muted" style="font-size:12px;margin-top:8px">Simu inafanya kazi tu kama wazazi wa pande zote mbili wameruhusu. Kila simu ina kikomo cha dakika ${CALL_LIMIT_MIN}.</p></div>
        <div class="card"><h3>Ongeza rafiki</h3><p>A friend is added by code between two parents. Give the other parent this code, or enter the code they gave you.</p>
          <div class="btn-row" style="margin-top:10px"><button class="btn small blue" id="inv">${icon('key', 16)} Tengeneza msimbo</button></div>
          <div class="form-row" style="margin-top:10px"><input class="field" id="code" placeholder="Msimbo wa mzazi mwingine" style="text-transform:uppercase"><button class="btn small" id="add">Ongeza</button></div></div>
        <div class="section-title">Marafiki (${friends.length})</div>
        ${friends.map(f => `<div class="item" style="cursor:default">${avatarSVG(f.color || '#1EA7F0', 44)}<div class="grow"><div class="i-title">${esc(f.name)}</div><div class="i-sub">${f.online ? 'Yuko mtandaoni' : 'Hayupo'}</div></div><button class="icon-btn" data-rm="${f.id}">${icon('trash', 18)}</button></div>`).join('') || '<p class="muted">Bado hakuna marafiki.</p>'}
        ${calls.length ? `<div class="section-title">Call history</div><div class="card">${calls.slice(0, 15).map(k => `<p>${esc(k.with)} · ${k.media === 'video' ? 'Video' : 'Sauti'} · ${new Date(k.started).toLocaleString('sw-TZ')}${k.ended ? ' · dk ' + Math.max(1, Math.round((k.ended - k.started) / 60000)) : ''}</p>`).join('')}</div>` : ''}`;
      $$('[data-perm]', b).forEach(x => x.onclick = async () => { await Net.put(`/api/children/${c.serverId}`, { [x.dataset.perm]: x.dataset.v === '1' }); draw(); });
      $('#inv', b).onclick = async () => { const r = await Net.post(`/api/children/${c.serverId}/invite`); modal(el, { iconName: 'key', title: r.code, text: "Give your friend's parent this code. It works for 48 hours.", buttons: [{ label: 'Sawa' }] }); };
      $('#add', b).onclick = async () => { try { const r = await Net.post(`/api/children/${c.serverId}/friends`, { code: $('#code', b).value }); toast(r.friend.name + ' ameongezwa'); draw(); } catch (e) { toast(e.message); } };
      $$('[data-rm]', b).forEach(x => x.onclick = () => confirmBox(el, "Remove friend?", '', "Remove", async () => { await Net.del('/api/friends/' + x.dataset.rm); draw(); }));
    } catch (e) { b.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  };
  draw();
};

HK.screens.together = (el) => {
  const c = Store.active();
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Pamoja</h1></div><div class="scroll" id="b"><div class="empty">Inapakia...</div></div>`;
  $('#bk', el).onclick = () => HK.back();
  const b = $('#b', el);
  if (!(Net.online() && c.serverId)) { b.innerHTML = `<div class="empty">${mascot('nuru', 80)}<br>Ask your parent to open an account and add friends for you.</div>`; return; }
  Net.connect(c.serverId);
  const draw = async () => {
    try {
      const friends = await Net.get(`/api/children/${c.serverId}/friends`);
      b.innerHTML = friends.length ? friends.map(f => `<div class="card"><div class="row">${avatarSVG(f.color || '#1EA7F0', 56)}<div class="grow"><h3 style="margin:0">${esc(f.name)}</h3><p><span class="dot-on ${f.online ? 'on' : ''}"></span>${f.online ? 'Yuko mtandaoni' : 'Hayupo sasa'}</p></div></div>
        <div class="btn-row" style="margin-top:12px">
          ${f.allow_audio ? `<button class="btn small blue" data-call="${f.child_id}" data-m="audio" data-n="${esc(f.name)}" ${f.online ? '' : 'disabled'}>${icon('mic', 18)} Sauti</button>` : ''}
          ${f.allow_video ? `<button class="btn small coral" data-call="${f.child_id}" data-m="video" data-n="${esc(f.name)}" ${f.online ? '' : 'disabled'}>${icon('camera', 18)} Video</button>` : ''}
          <button class="btn small" data-play="${f.child_id}" data-n="${esc(f.name)}" ${f.online ? '' : 'disabled'}>${icon('game', 18)} Cheza</button></div></div>`).join('')
        : `<div class="empty">${mascot('nuru', 80)}<br>You don't have friends yet. Ask your parent to add some.</div>`;
      $$('[data-call]', b).forEach(x => x.onclick = () => HK.go('call', { to: +x.dataset.call, name: x.dataset.n, media: x.dataset.m, caller: true }));
      $$('[data-play]', b).forEach(x => x.onclick = () => HK.go('battle', { to: +x.dataset.play, name: x.dataset.n, host: true }));
    } catch (e) { b.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  };
  draw();
  return Net.on(m => { if (m.t === 'presence') draw(); });
};

Net.on(m => {
  if (m.t === 'ring') {
    speak(m.name + ' anakupigia');
    modal(null, { title: m.name + ' anakupigia', html: `<div style="display:flex;justify-content:center;margin-bottom:10px">${avatarSVG(m.color || '#1EA7F0', 90)}</div><p>${m.media === 'video' ? 'Simu ya video' : 'Simu ya sauti'}</p>`, buttons: [
      { label: 'Pokea', icon: 'check', onClick: () => HK.go('call', { to: m.from, name: m.name, media: m.media, caller: false }) },
      { label: 'Kataa', cls: 'coral', onClick: () => Net.send({ t: 'decline', to: m.from }) }] });
  }
  if (m.t === 'game' && m.data && m.data.type === 'invite') {
    modal(null, { iconName: 'game', title: m.name + ' anakualika kucheza', buttons: [
      { label: 'Cheza', onClick: () => HK.go('battle', { to: m.from, name: m.name, host: false, seed: m.data.seed, group: m.data.group }) },
      { label: 'Baadaye', cls: 'ghost', onClick: () => Net.send({ t: 'game', to: m.from, data: { type: 'decline' } }) }] });
  }
});

/* ---------- Simu (WebRTC) ---------- */
HK.screens.call = (el, p) => {
  let pc = null, stream = null, t0 = null, timer = null, navigation = null, ended = false, starting = false;
  const candidates = [];
  let processing = Promise.resolve();
  el.classList.add('call-screen');
  el.innerHTML = `
    <video id="rv" autoplay playsinline class="${p.media === 'video' ? '' : 'hidden'}"></video>
    <video id="lv" autoplay playsinline muted class="${p.media === 'video' ? '' : 'hidden'}"></video>
    <audio id="ra" autoplay></audio>
    <div class="call-info"><div id="cav">${avatarSVG('#1EA7F0', 110)}</div><h2>${esc(p.name)}</h2><p id="cst">${p.caller ? 'Inapiga...' : 'Inaunganisha...'}</p></div>
    <div class="call-bar"><button class="icon-btn" id="mute">${icon('mic', 26)}</button><button class="icon-btn end" id="end">${icon('x', 30)}</button></div>`;
  const status = t => { const s = $('#cst', el); if (s) s.textContent = t; };
  const finish = (msg) => {
    if (ended) return; ended = true;
    clearInterval(timer);
    try { pc && pc.close(); } catch (e) {}
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (msg) toast(msg);
    navigation = setTimeout(() => { if (el.isConnected) HK.leave(); }, 300);
  };
  const start = async () => {
    if (ended || starting) return false;
    starting = true;
    let media;
    try { media = await navigator.mediaDevices.getUserMedia({ audio: true, video: p.media === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false }); }
    catch (e) { finish("Microphone/camera permission was denied"); Net.send({ t: 'hangup', to: p.to }); return false; }
    if (ended || !el.isConnected) { media.getTracks().forEach(track => track.stop()); return false; }
    stream = media;
    $('#lv', el).srcObject = stream;
    pc = new RTCPeerConnection(RTC_CFG);
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    pc.onicecandidate = e => { if (e.candidate) Net.send({ t: 'signal', to: p.to, data: { ice: e.candidate } }); };
    pc.ontrack = e => { $(p.media === 'video' ? '#rv' : '#ra', el).srcObject = e.streams[0]; };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected' && !t0) {
        t0 = Date.now();
        if (p.media === 'video') $('.call-info', el).classList.add('small');
        timer = setInterval(() => {
          const s = Math.floor((Date.now() - t0) / 1000);
          status(Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'));
          if (s >= CALL_LIMIT_MIN * 60) { Net.send({ t: 'hangup', to: p.to }); finish("Call time is over"); }
        }, 1000);
      }
      if (pc.connectionState === 'failed') { Net.send({ t: 'hangup', to: p.to }); finish('The call was disconnected.'); }
    };
    return true;
  };
  const off = Net.on(m => {
    if (m.t === 'denied') return finish(m.reason);
    if (m.from !== p.to || ended) return;
    if (m.t === 'declined') return finish('The call was declined.');
    if (m.t === 'hangup') return finish('The call ended.');
    processing = processing.then(async () => {
      if (ended) return;
      if (m.t === 'accepted' && p.caller) {
        if (!(await start())) return;
        await pc.setLocalDescription(await pc.createOffer());
        Net.send({ t: 'signal', to: p.to, data: { sdp: pc.localDescription } });
        status('Connecting…');
      }
      if (m.t !== 'signal' || !m.data) return;
      const { sdp, ice } = m.data;
      if (ice) {
        if (pc?.remoteDescription) await pc.addIceCandidate(ice);
        else if (candidates.length < 128) candidates.push(ice);
      }
      if (sdp && pc) {
        await pc.setRemoteDescription(sdp);
        for (const candidate of candidates.splice(0)) await pc.addIceCandidate(candidate);
        if (sdp.type === 'offer') {
          await pc.setLocalDescription(await pc.createAnswer());
          Net.send({ t: 'signal', to: p.to, data: { sdp: pc.localDescription } });
        }
      }
    }).catch(() => {
      if (!ended) { Net.send({ t: 'hangup', to: p.to }); finish('Could not connect this call.'); }
    });
  });
  (async () => {
    if (p.caller) Net.send({ t: 'call', to: p.to, media: p.media });
    else { if (await start()) Net.send({ t: 'accept', to: p.to, media: p.media }); }
  })();
  $('#end', el).onclick = () => { Net.send({ t: 'hangup', to: p.to }); finish(); };
  $('#mute', el).onclick = e => { if (!stream) return; const tr = stream.getAudioTracks()[0]; if (!tr) return; tr.enabled = !tr.enabled; e.currentTarget.classList.toggle('off', !tr.enabled); };
  HK.setBack(() => { Net.send({ t: 'hangup', to: p.to }); finish(); return true; });
  return () => { off(); clearTimeout(navigation); if (!ended) { Net.send({ t: 'hangup', to: p.to }); ended = true; clearInterval(timer); try { pc && pc.close(); } catch (e) {} if (stream) stream.getTracks().forEach(t => t.stop()); } };
};

function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
HK.screens.battle = (el, p) => {
  const c = Store.active();
  const seed = Number.isInteger(p.seed) ? p.seed : Math.floor(Math.random() * 1e9);
  const R = seeded(seed);
  const mode = kidMode(c);
  const g = !p.host && [0, 1, 2].includes(p.group) ? p.group : mode === 'advanced' ? 2 : mode === 'explorer' ? 1 : 0;
  const qs = Array.from({ length: 8 }, () => {
    const a = 2 + Math.floor(R() * (g ? 9 : 5)), b = 1 + Math.floor(R() * (g ? 9 : 5));
    const op = g === 2 && R() < 0.5 ? 'x' : '+'; const ans = op === 'x' ? a * b : a + b;
    const opts = [ans, ans + 1 + Math.floor(R() * 3), Math.max(0, ans - 1 - Math.floor(R() * 3))];
    for (let i = 2; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return { t: `${a} ${op === 'x' ? '×' : '+'} ${b}`, ans, opts };
  });
  let i = 0, mine = 0, theirs = 0, theirsDone = false, started = !p.host, finished = false;
  let locked = false, next;
  const draw = () => {
    if (!started) {
      el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Cheza na ${esc(p.name)}</h1></div><div class="center-col">${mascot('nuru', 90)}<p style="margin-top:12px">Tunamsubiri ${esc(p.name)} akubali...</p></div>`;
      $('#bk', el).onclick = () => HK.back(); return;
    }
    if (i >= qs.length) {
      el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Matokeo</h1></div><div class="center-col">
        <div class="vs"><div>${kidAvatar(c, 70)}<b>${mine}</b><span>Wewe</span></div><span class="muted">dhidi ya</span><div>${avatarSVG('#F65B4F', 70)}<b>${theirs}</b><span>${esc(p.name)}</span></div></div>
        <h2 style="margin-top:16px">${!theirsDone ? 'Tunamsubiri ' + esc(p.name) + '...' : mine > theirs ? 'Umeshinda!' : mine === theirs ? 'Sare!' : esc(p.name) + ' ameshinda. Jaribu tena!'}</h2></div>`;
      $('#bk', el).onclick = () => HK.back();
      if (theirsDone && !finished) { finished = true; if (mine >= theirs) { Sfx.win(); confetti(el); } const cc = Store.active(); cc.coins = (cc.coins || 0) + mine; Store.saveChild(cc); markMission('game'); }
      return;
    }
    const q = qs[i];
    locked = false;
    el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><div class="grow"></div>
      <span class="chip-tag blue">Wewe ${mine}</span><span class="chip-tag coral">${esc(p.name)} ${theirs}</span></div>
      <div class="g-progress">${qs.map((_, k) => `<i class="${k < i ? 'done' : ''}"></i>`).join('')}</div>
      <div class="g-q" style="font-size:40px">${q.t} = ?</div>
      <div class="g-opts" style="grid-template-columns:1fr 1fr 1fr">${q.opts.map(o => `<button class="g-opt" data-v="${o}">${o}</button>`).join('')}</div>`;
    $('#bk', el).onclick = () => HK.back();
    $$('.g-opt', el).forEach(b => b.onclick = () => {
      if (locked) return;
      locked = true;
      const ok = +b.dataset.v === q.ans;
      b.classList.add(ok ? 'ok' : 'no');
      if (ok) { mine++; Sfx.good(); } else Sfx.bad();
      i++;
      Net.send({ t: 'game', to: p.to, data: { type: 'score', score: mine, done: i >= qs.length } });
      next = setTimeout(draw, 350);
    });
  };
  const off = Net.on(m => {
    if (m.t !== 'game' || m.from !== p.to) return;
    const d = m.data || {};
    if (d.type === 'accept' && p.host && !started) { started = true; draw(); }
    if (d.type === 'decline') { toast(p.name + ' amekataa'); HK.back(); }
    if (d.type === 'score' && Number.isInteger(d.score) && d.score >= 0 && d.score <= qs.length) { theirs = d.score; if (d.done) theirsDone = true; if (i >= qs.length) draw(); else { const t = $$('.chip-tag.coral', el)[0]; if (t) t.textContent = p.name + ' ' + theirs; } }
  });
  if (p.host) Net.send({ t: 'game', to: p.to, data: { type: 'invite', seed, group: g } });
  else Net.send({ t: 'game', to: p.to, data: { type: 'accept' } });
  draw();
  return () => { clearTimeout(next); off(); };
};
