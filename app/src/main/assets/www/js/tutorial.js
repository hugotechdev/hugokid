

const TUT = {
  racing: { rules: "Tap left or right to move the car. Avoid cars and rocks. Collect coins. When a question appears, drive through the gate with the correct answer.", steps: () => [
    { t: "Tap the left or right side of the screen to move your car.", g: 'lr', ic: 'car' },
    { t: "Avoid other cars and rocks. Collect yellow coins.", g: 'tap', ic: 'coin' },
    { t: "When a question appears above, move to the gate with the correct answer.", g: 'lr', ic: 'flag' },
  ] },
  runner: { rules: "Tap the screen to jump. Jump over rocks and logs. Collect coins. Reach the flag.", steps: g => [
    { t: "Tap anywhere on the screen to jump.", g: 'tap', ic: 'run' },
    { t: "Jump over rocks and logs." + (g === 2 ? ' Stay low when birds fly past.' : ''), g: 'tap', ic: 'heart' },
    { t: "Collect coins and reach the flag.", g: 'none', ic: 'flag' },
  ] },
  pilot: { rules: "Hold the screen so the plane goes up, release so it goes down. Fly through the yellow rings.", steps: g => [
    { t: "Hold your finger on the screen and the plane goes up.", g: 'hold', ic: 'plane' },
    { t: 'Achia kidole, ndege inashuka taratibu.', g: 'tap', ic: 'plane' },
    { t: "Fly through the yellow rings." + (g ? " Avoid birds in the sky." : ''), g: 'none', ic: 'coin' },
  ] },
  penalty: { rules: "Tap the part of the goal where you want to kick the ball. As goalkeeper, tap the side the ball is going.", steps: g => [
    { t: "Tap any part of the goal. The ball will go there.", g: 'tap', ic: 'ball' },
    { t: "Choose the side where the goalkeeper isn't, to score a goal.", g: 'lr', ic: 'ball' },
    ...(g ? [{ t: "Your turn to be goalkeeper: watch the ball, then tap the side it is going.", g: 'tap', ic: 'user' }] : []),
  ] },
  bubbles: { rules: "Tap two or more touching bubbles of the same color. A bigger group earns more points.", steps: () => [
    { t: "Find touching bubbles of the same color.", g: 'none', ic: 'bubbles' },
    { t: "Tap any one. The whole group pops.", g: 'tap', ic: 'bubbles' },
    { t: "A bigger group earns more points. Reach the target score.", g: 'none', ic: 'star' },
  ] },
  village: { rules: "Choose a building below, then tap a plot. Build everything on the task list without going over budget.", steps: g => [
    { t: "Choose a building from the list below.", g: 'tap', ic: 'build' },
    { t: "Tap the plot where you want to build.", g: 'drag', ic: 'home' },
    { t: "Build everything on the task list. Don't spend all the money: savings earn stars." + (g ? " Every house should be near a well or a tree." : ''), g: 'none', ic: 'coin' },
  ] },
  kitchen: { rules: "Read the recipe. Tap each ingredient as many times as needed. Tap Cook.", steps: g => [
    { t: "Read the recipe above. Tap the speaker to listen.", g: 'tap', ic: 'volume' },
    { t: g ? "Tap each ingredient the required number of times." : "Tap each needed ingredient once.", g: 'tap', ic: 'pot' },
    { t: "Tap Cook. If you make a mistake, tap Empty to start again.", g: 'tap', ic: 'check' },
  ] },
  balloons: { rules: "Read or listen to the question above. Tap the balloon with the correct answer before it floats away.", steps: g => [
    { t: g === 0 ? "Count the stars above." : "Read the math question above.", g: 'none', ic: 'star' },
    { t: "Tap the balloon with the correct answer.", g: 'tap', ic: 'balloon' },
  ] },
  letters: { rules: "Read or listen to the word or description. Choose the correct letter or word.", steps: g => [
    { t: "Tap the speaker to hear the word.", g: 'tap', ic: 'volume' },
    { t: ["Choose the letter the word starts with.", "Choose the missing letter in the word.", "Choose the correctly spelled word."][g], g: 'tap', ic: 'letters' },
  ] },
  memory: { rules: "Tap two cards. If they match, they stay open. Find all the pairs in as few moves as possible.", steps: g => [
    { t: "Tap one card, then another.", g: 'tap', ic: 'cards' },
    { t: g ? "When a word meets its meaning, they stay open." : "When pictures match, they stay open.", g: 'none', ic: 'check' },
    { t: 'Kumbuka kadi ulizoona ili umalize haraka.', g: 'none', ic: 'star' },
  ] },
  robot: { rules: "Take the robot to the prize using the arrows. Avoid the grey walls.", steps: g => g === 0 ? [
    { t: "Tap the arrows to move the robot one step at a time.", g: 'tap', ic: 'robot' },
    { t: "Get it to the prize. Grey walls can't be crossed.", g: 'none', ic: 'gift' },
  ] : [
    { t: "Arrange all the arrows first, like instructions for the robot.", g: 'tap', ic: 'robot' },
    { t: "Tap Run. The robot will follow your arrows.", g: 'tap', ic: 'play' },
    { t: 'If the robot hits a wall, adjust the arrows and try again.', g: 'none', ic: 'undo' },
  ] },
  market: { rules: "You are a market seller. Listen to the customer and give them what they want or the correct change.", steps: g => [
    [{ t: "Listen to how many fruits the customer wants.", g: 'none', ic: 'volume' }, { t: "Tap fruits to put them in the basket, then Give to customer.", g: 'tap', ic: 'shop' }],
    [{ t: "Read the price of each fruit.", g: 'none', ic: 'shop' }, { t: "Add up the prices, then choose the correct answer.", g: 'tap', ic: 'coin' }],
    [{ t: 'Subtract the price from the amount paid to find the change.', g: 'none', ic: 'shop' }, { t: "Tap notes and coins to make the change, then Give change.", g: 'tap', ic: 'coin' }],
  ][g] },
  shapes: { rules: "Choose a shape below, then tap its place above.", steps: g => g === 2 ? [
    { t: "Read the question about the shape.", g: 'none', ic: 'shapes' },
    { t: "Count the sides of each shape, then choose the answer.", g: 'tap', ic: 'check' },
  ] : [
    { t: "Tap one shape below to choose it.", g: 'tap', ic: 'shapes' },
    { t: "Tap the space above with the same shape.", g: 'drag', ic: 'check' },
  ] },
  speak: { rules: "Listen to the word, then say it out loud to open the door.", steps: () => [
    { t: "Choose a language at the top.", g: 'tap', ic: 'letters' },
    { t: "Tap Listen to hear the word.", g: 'tap', ic: 'volume' },
    { t: "Tap Say the word, then say it out loud. The door will open!", g: 'hold', ic: 'mic' },
  ] },
  faith: { rules: "Read or listen to the question, then choose the correct answer.", steps: () => [
    { t: "Tap the speaker to hear the question.", g: 'tap', ic: 'volume' },
    { t: "Choose the correct answer.", g: 'tap', ic: 'check' },
  ] },
  homework: { rules: "Write and draw on the paper with your finger. When you finish, tap Submit.", steps: () => [
    { t: "Write or draw on the paper with your finger.", g: 'drag', ic: 'pencil' },
    { t: "Choose a color, pen size, or the eraser below.", g: 'tap', ic: 'eraser' },
    { t: "If you get stuck, tap Help. Nuru will give you a hint.", g: 'tap', ic: 'help' },
    { t: "When you finish all the pages, tap Submit.", g: 'tap', ic: 'send' },
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
    const close = () => {
      ov.remove();
      GT.mark(id);
      if (typeof Voice !== 'undefined') Voice.stop();
      window.speechSynthesis?.cancel();
      window.HugoNative?.stopSpeaking?.();
      onClose?.();
    };
    ov.onGameBack = close;
    const draw = () => {
      const s = steps[i];
      ov.innerHTML = `<div class="modal tut">
        <div class="tut-stage" style="background:${gm.color}">
          <div class="tut-ic">${icon(s.ic || gm.icon, 64, 2)}</div>
          ${s.g !== 'none' ? `<div class="tut-hand g-${s.g}">${icon('hand', 54, 2)}</div>` : ''}
        </div>
        <div class="tut-step">Step ${i + 1} of ${steps.length}</div>
        <p style="font-size:18px;color:var(--navy)">${esc(s.t)}</p>
        <div class="btn-row" style="margin-bottom:12px">
          <button class="btn ghost small" id="t-say">${icon('volume', 18)} Listen</button>
          <button class="btn ghost small" id="t-ai">${icon('help', 18)} Ask Nuru</button>
        </div>
        <button class="btn block ${i === steps.length - 1 ? 'coral' : ''}" id="t-next">${i === steps.length - 1 ? 'Start playing' : 'Continue'} ${icon('chevR', 20)}</button>
        ${i < steps.length - 1 ? '<button class="btn block ghost small" id="t-skip" style="margin-top:10px">Skip tutorial</button>' : ''}
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
      const t = "These are the rules: " + T.rules;
      speak(t);
      modal(root, { iconName: 'nuru', title: 'Nuru says', text: t, buttons: [{ label: 'OK' }] });
    };
    if (!AI.ready()) return fallback();
    const wait = modal(root, { iconName: 'nuru', title: 'Nuru is thinking…', text: 'One moment', buttons: [] });
    try {
      const a = await AI.ask({
        text: `Help a child aged ${ageYears(c.birth)} play ${gm.name}. Rules: ${T.rules}
${current ? "Current question: " + current + ". Give a hint without revealing the answer." : "Explain how to play."} Reply in two or three short English sentences.`,
        maxTokens: 250,
      });
      wait.remove(); speak(a);
      AI.log(c.id, '[Help: ' + gm.name + ']', a);
      modal(root, { iconName: 'nuru', title: 'Nuru says', text: a, buttons: [{ label: "Listen again", icon: 'volume', keepOpen: true, onClick: () => speak(a) }, { label: 'Thank you, Nuru' }] });
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
