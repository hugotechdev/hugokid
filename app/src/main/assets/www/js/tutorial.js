

const TUT = {
  racing: { rules: 'Gusa kushoto au kulia kuhamisha gari. Epuka magari na mawe. Okota sarafu. Swali likitokea, pita kwenye lango lenye jibu sahihi.', steps: () => [
    { t: 'Gusa upande wa kushoto au kulia wa skrini kuhamisha gari lako.', g: 'lr', ic: 'car' },
    { t: 'Epuka magari mengine na mawe. Okota sarafu za njano.', g: 'tap', ic: 'coin' },
    { t: 'Swali likitokea juu, hamia kwenye lango lenye jibu sahihi.', g: 'lr', ic: 'flag' },
  ] },
  runner: { rules: 'Gusa skrini kuruka. Ruka juu ya mawe na magogo. Okota sarafu. Fika kwenye bendera.', steps: g => [
    { t: 'Gusa skrini popote ili kuruka.', g: 'tap', ic: 'run' },
    { t: 'Ruka juu ya mawe na magogo.' + (g === 2 ? ' Ndege wakija, usiruke!' : ''), g: 'tap', ic: 'heart' },
    { t: 'Okota sarafu na ufike kwenye bendera.', g: 'none', ic: 'flag' },
  ] },
  pilot: { rules: 'Shikilia skrini ndege ipande, achia ishuke. Pita katikati ya pete za njano.', steps: g => [
    { t: 'Shikilia kidole kwenye skrini, ndege inapanda.', g: 'hold', ic: 'plane' },
    { t: 'Achia kidole, ndege inashuka taratibu.', g: 'tap', ic: 'plane' },
    { t: 'Pita katikati ya pete za njano.' + (g ? ' Epuka ndege wa angani.' : ''), g: 'none', ic: 'coin' },
  ] },
  penalty: { rules: 'Gusa sehemu ya goli unayotaka kupiga mpira. Ukiwa kipa, gusa upande mpira unaoelekea.', steps: g => [
    { t: 'Gusa sehemu yoyote ya goli. Mpira utaenda pale.', g: 'tap', ic: 'ball' },
    { t: 'Chagua upande ambao kipa hayupo ili ufunge goli.', g: 'lr', ic: 'ball' },
    ...(g ? [{ t: 'Zamu yako ya kuwa kipa: angalia mpira, kisha gusa upande unaoelekea.', g: 'tap', ic: 'user' }] : []),
  ] },
  bubbles: { rules: 'Gusa mapovu mawili au zaidi ya rangi moja yaliyogusana. Kundi kubwa linaleta alama nyingi.', steps: () => [
    { t: 'Tafuta mapovu ya rangi moja yaliyogusana.', g: 'none', ic: 'bubbles' },
    { t: 'Gusa moja wapo. Kundi lote linapasuka.', g: 'tap', ic: 'bubbles' },
    { t: 'Kundi kubwa linaleta alama nyingi. Fikia alama za lengo.', g: 'none', ic: 'star' },
  ] },
  village: { rules: 'Chagua jengo chini, kisha gusa kiwanja. Jenga vitu vyote kwenye orodha ya kazi bila kuzidi pesa.', steps: g => [
    { t: 'Chagua jengo kwenye orodha ya chini.', g: 'tap', ic: 'build' },
    { t: 'Gusa kiwanja ulipotaka kujenga.', g: 'drag', ic: 'home' },
    { t: 'Jenga vitu vyote vya kazi. Usimalize pesa zote: akiba inaleta nyota.' + (g ? ' Kila nyumba iwe karibu na kisima au mti.' : ''), g: 'none', ic: 'coin' },
  ] },
  kitchen: { rules: 'Soma mapishi. Gusa kila kiungo mara ngapi kinahitajika. Bonyeza Pika.', steps: g => [
    { t: 'Soma mapishi juu. Gusa spika kusikiliza.', g: 'tap', ic: 'volume' },
    { t: g ? 'Gusa kila kiungo idadi ya mara inayotakiwa.' : 'Gusa kila kiungo kinachohitajika mara moja.', g: 'tap', ic: 'pot' },
    { t: 'Bonyeza Pika. Ukikosea, bonyeza Mwaga uanze upya.', g: 'tap', ic: 'check' },
  ] },
  balloons: { rules: 'Soma au sikiliza swali juu. Gusa puto lenye jibu sahihi kabla halijapaa.', steps: g => [
    { t: g === 0 ? 'Hesabu nyota zilizo juu.' : 'Soma swali la hesabu juu.', g: 'none', ic: 'star' },
    { t: 'Gusa puto lenye jibu sahihi.', g: 'tap', ic: 'balloon' },
  ] },
  letters: { rules: 'Soma au sikiliza neno au maelezo. Chagua herufi au neno sahihi.', steps: g => [
    { t: 'Gusa spika kusikiliza neno.', g: 'tap', ic: 'volume' },
    { t: ['Chagua herufi ambayo neno linaanza nayo.', 'Chagua herufi iliyopotea kwenye neno.', 'Chagua neno lililoandikwa sawasawa.'][g], g: 'tap', ic: 'letters' },
  ] },
  memory: { rules: 'Gusa kadi mbili. Zikifanana zinabaki wazi. Tafuta jozi zote kwa hatua chache.', steps: g => [
    { t: 'Gusa kadi moja, kisha nyingine.', g: 'tap', ic: 'cards' },
    { t: g ? 'Neno na maana yake zikikutana, zinabaki wazi.' : 'Picha zikifanana, zinabaki wazi.', g: 'none', ic: 'check' },
    { t: 'Kumbuka kadi ulizoona ili umalize haraka.', g: 'none', ic: 'star' },
  ] },
  robot: { rules: 'Mpeleke roboti kwenye zawadi kwa kutumia mishale. Epuka kuta za kijivu.', steps: g => g === 0 ? [
    { t: 'Gusa mishale kumsogeza roboti hatua moja moja.', g: 'tap', ic: 'robot' },
    { t: 'Mfikishe kwenye zawadi. Kuta za kijivu haziruhusu kupita.', g: 'none', ic: 'gift' },
  ] : [
    { t: 'Panga mishale yote kwanza, kama maagizo kwa roboti.', g: 'tap', ic: 'robot' },
    { t: 'Bonyeza Endesha. Roboti atafuata mishale yako.', g: 'tap', ic: 'play' },
    { t: 'Akigonga ukuta, rekebisha mishale ujaribu tena.', g: 'none', ic: 'undo' },
  ] },
  market: { rules: 'Wewe ni muuzaji sokoni. Msikilize mteja na umpe anachotaka au chenji sahihi.', steps: g => [
    [{ t: 'Sikiliza mteja anataka matunda mangapi.', g: 'none', ic: 'volume' }, { t: 'Gusa matunda kuweka kwenye kikapu, kisha Mpe mteja.', g: 'tap', ic: 'shop' }],
    [{ t: 'Soma bei ya kila tunda.', g: 'none', ic: 'shop' }, { t: 'Jumlisha bei, kisha chagua jibu sahihi.', g: 'tap', ic: 'coin' }],
    [{ t: 'Chenji = pesa aliyolipa toa bei.', g: 'none', ic: 'shop' }, { t: 'Gusa noti na sarafu kufikia chenji, kisha Mpe chenji.', g: 'tap', ic: 'coin' }],
  ][g] },
  shapes: { rules: 'Chagua umbo chini, kisha gusa mahali pake juu.', steps: g => g === 2 ? [
    { t: 'Soma swali kuhusu umbo.', g: 'none', ic: 'shapes' },
    { t: 'Hesabu pande za kila umbo, kisha chagua jibu.', g: 'tap', ic: 'check' },
  ] : [
    { t: 'Gusa umbo moja chini kulichagua.', g: 'tap', ic: 'shapes' },
    { t: 'Gusa nafasi juu yenye umbo kama hilo.', g: 'drag', ic: 'check' },
  ] },
  speak: { rules: 'Sikiliza neno, kisha lisema kwa sauti ili mlango ufunguke.', steps: () => [
    { t: 'Chagua lugha juu.', g: 'tap', ic: 'letters' },
    { t: 'Gusa Sikiliza ili kusikia neno.', g: 'tap', ic: 'volume' },
    { t: 'Gusa Sema neno, kisha lisema kwa sauti. Mlango utafunguka!', g: 'hold', ic: 'mic' },
  ] },
  faith: { rules: 'Soma au sikiliza swali, kisha chagua jibu sahihi.', steps: () => [
    { t: 'Gusa spika kusikiliza swali.', g: 'tap', ic: 'volume' },
    { t: 'Chagua jibu sahihi.', g: 'tap', ic: 'check' },
  ] },
  homework: { rules: 'Andika na chora juu ya karatasi kwa kidole. Ukimaliza bonyeza Wasilisha.', steps: () => [
    { t: 'Andika au chora juu ya karatasi kwa kidole chako.', g: 'drag', ic: 'pencil' },
    { t: 'Chagua rangi, unene wa kalamu, au kifutio chini.', g: 'tap', ic: 'eraser' },
    { t: 'Ukikwama, bonyeza Msaada. Nuru atakupa kidokezo.', g: 'tap', ic: 'help' },
    { t: 'Ukimaliza kurasa zote, bonyeza Wasilisha.', g: 'tap', ic: 'send' },
  ] },
};

const GT = {
  seen(child, id) { return !!(child && child.tut && child.tut[id]); },
  mark(id) {
    const c = Store.active(); if (!c) return;
    c.tut = c.tut || {}; c.tut[id] = true; Store.saveChild(c);
  },

  show(root, id, group, onClose) {
    const T = TUT[id]; if (!T) { onClose && onClose(); return; }
    const steps = T.steps(group || 0);
    const gm = (typeof GAMES !== 'undefined' && GAMES.find(g => g.id === id)) || { color: 'var(--blue)', icon: 'pencil' };
    let i = 0;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    root.appendChild(ov);
    const close = () => { ov.remove(); GT.mark(id); if (window.speechSynthesis) speechSynthesis.cancel(); onClose && onClose(); };
    const draw = () => {
      const s = steps[i];
      ov.innerHTML = `<div class="modal tut">
        <div class="tut-stage" style="background:${gm.color}">
          <div class="tut-ic">${icon(s.ic || gm.icon, 64, 2)}</div>
          ${s.g !== 'none' ? `<div class="tut-hand g-${s.g}">${icon('hand', 54, 2)}</div>` : ''}
        </div>
        <div class="tut-step">Hatua ${i + 1} kati ya ${steps.length}</div>
        <p style="font-size:18px;color:var(--navy)">${esc(s.t)}</p>
        <div class="btn-row" style="margin-bottom:12px">
          <button class="btn ghost small" id="t-say">${icon('volume', 18)} Sikiliza</button>
          <button class="btn ghost small" id="t-ai">${icon('help', 18)} Muulize Nuru</button>
        </div>
        <button class="btn block ${i === steps.length - 1 ? 'coral' : ''}" id="t-next">${i === steps.length - 1 ? 'Nimeelewa, tuanze!' : 'Endelea'} ${icon('chevR', 20)}</button>
        ${i < steps.length - 1 ? '<button class="btn block ghost small" id="t-skip" style="margin-top:10px">Ruka mafunzo</button>' : ''}
      </div>`;
      speak(s.t);
      $('#t-say', ov).onclick = () => speak(s.t);
      $('#t-ai', ov).onclick = () => GT.askHugo(root, id, '');
      $('#t-next', ov).onclick = () => { Sfx.tap(); if (i < steps.length - 1) { i++; draw(); } else close(); };
      const sk = $('#t-skip', ov); if (sk) sk.onclick = close;
    };
    draw();
  },

  async askHugo(root, id, current) {
    const T = TUT[id] || { rules: '' };
    const c = Store.active();
    const gm = (typeof GAMES !== 'undefined' && GAMES.find(g => g.id === id)) || { name: id === 'homework' ? 'Homework' : id };
    const fallback = () => {
      const t = 'Sheria ni hizi: ' + T.rules;
      speak(t);
      modal(root, { iconName: 'nuru', title: 'Nuru anasema', text: t, buttons: [{ label: 'Sawa' }] });
    };
    if (!AI.ready()) return fallback();
    const wait = modal(root, { iconName: 'nuru', title: 'Nuru anafikiri...', text: 'Subiri kidogo', buttons: [] });
    try {
      const a = await AI.ask({
        text: `Mtoto ${c.name} (miaka ${ageYears(c.birth)}) anacheza mchezo "${gm.name}" na ameomba msaada.
Sheria za mchezo: ${T.rules}
${current ? 'Swali la sasa: ' + current + '\n' : ''}Mweleze kwa sentensi 2-3 rahisi jinsi ya kucheza${current ? ' na umpe kidokezo kimoja cha swali hili BILA kumpa jibu' : ''}.`,
        maxTokens: 250,
      });
      wait.remove(); speak(a);
      AI.log(c.id, '[Msaada: ' + gm.name + ']', a);
      modal(root, { iconName: 'nuru', title: 'Nuru anasema', text: a, buttons: [{ label: 'Sikiliza tena', icon: 'volume', keepOpen: true, onClick: () => speak(a) }, { label: 'Asante Nuru' }] });
    } catch (e) { wait.remove(); fallback(); }
  },

  pointAt(target, root) {
    const r = target.getBoundingClientRect(), rr2 = root.getBoundingClientRect();
    const h = document.createElement('div');
    h.className = 'tut-pointer';
    h.innerHTML = icon('hand', 56, 2);
    h.style.left = (r.left - rr2.left + r.width * 0.66) + 'px';
    h.style.top = (r.top - rr2.top + r.height * 0.42) + 'px';
    root.appendChild(h);
    return () => h.remove();
  },
};
