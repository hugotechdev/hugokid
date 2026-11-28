const assert = require('node:assert/strict');
const debugging = process.env.HK_BROWSER_DEBUG_URL || 'http://127.0.0.1:8761';
const site = process.env.HK_BROWSER_APP_URL || 'http://127.0.0.1:8760/';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  for (const url of [site, debugging]) {
    assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname), 'Use the browser test only on a local disposable fixture.');
  }
  let tab;
  for (let attempt = 0; !tab && attempt < 90; attempt++) {
    try {
      const pages = await (await fetch(debugging + '/json/list')).json();
      tab = pages.find(page => page.url === site);
    } catch {}
    if (!tab) await delay(100);
  }
  assert.ok(tab, 'Open a Chromium tab to the local fixture app before running the browser test.');
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0;
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    function receive(event) {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      socket.removeEventListener('message', receive);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
    socket.addEventListener('message', receive);
    socket.send(JSON.stringify({ id, method, params }));
  });
  async function evaluate(fn, ...args) {
    const expression = '(' + fn.toString() + ')(...' + JSON.stringify(args) + ')';
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.ok(!result.exceptionDetails, result.exceptionDetails?.exception?.description);
    return result.result.value;
  }

  try {
    await send('Runtime.enable');
    await delay(900);
    await evaluate(async () => {
      const expect = (condition, label) => { if (!condition) throw new Error(label); };
      const click = selector => {
        const el = document.querySelector(selector);
        expect(el, 'Missing control ' + selector);
        el.click();
      };
      expect(document.querySelector('[data-screen="welcome"]'), 'Welcome boot');
      click('#login');
      click('#forgot-password');
      expect(document.querySelector('[data-screen="forgotPassword"]'), 'Recovery navigation');
      HK.back();
      click('#link-device');
      expect(document.querySelector('[data-screen="deviceLink"]'), 'Child sign-in navigation');
      HK.back();
      HK.back();
      click('#parent');
      click('#tlink');
      expect(document.querySelector('[data-screen="terms"]'), 'Terms navigation');
      HK.back();
      HK.back();
    });
    console.log('Browser passed welcome, sign-in navigation, password recovery, device link, parent signup and terms.');

    for (const [width, height] of [[360, 740], [820, 1060], [1280, 900]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      const measurements = await evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const welcome = document.querySelector('.welcome');
        const action = document.querySelector('#parent').getBoundingClientRect();
        return { viewport: innerWidth, width: welcome.clientWidth, accessible: action.left >= 0 && action.right <= innerWidth && action.width > 0 && action.bottom <= innerHeight };
      });
      assert.equal(measurements.viewport, width);
      assert.ok(measurements.accessible, 'Welcome controls fit viewport ' + width);
      console.log('Browser layout passed at ' + width + ' × ' + height + '.');
    }

    if (process.env.HK_BROWSER_ADMIN_PASSWORD) {
      const accounts = await evaluate(async (login, password) => {
        const stamp = Date.now();
        const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        async function control(selector) {
          for (let i = 0; i < 90; i++) {
            const node = document.querySelector(selector);
            if (node) return node;
            await wait(30);
          }
          throw new Error('Missing account control ' + selector);
        }
        const use = async (selector, value) => { (await control(selector)).value = value; };
        const click = async selector => (await control(selector)).click();
        await click('#parent');
        await use('#name', 'Browser QA Parent');
        await use('#email', 'browser-' + stamp + '@example.test');
        await use('#pass', 'Browser-QA-fixture-password');
        (await control('#ok')).checked = true;
        await click('#go');
        await use('#child-name-0', 'Test Child');
        await use('#child-age-0', '8');
        const grade = await control('#child-grade-0');
        grade.selectedIndex = 2;
        const pin = document.querySelector('#registration-pin');
        if (pin) {
          pin.value = '5218';
          await use('#registration-pin-confirm', '5218');
        }
        await click('.registration-form button[type=submit]');
        await control('[data-screen="accountAccess"]');
        if (!Net.user() || Net.user().registration_pending) throw new Error('Parent registration did not finish');
        await click('#access-signout');
        await use('#login', login);
        await use('#pass', password);
        await click('#go');
        await control('[data-screen="changePass"]');
        await use('#old', password);
        await use('#new', password + '-changed');
        await use('#new2', password + '-changed');
        await click('#go');
        await control('[data-screen="superHome"] .dash-body .stat-grid');
        await click('#out');
        await control('[data-screen="welcome"]');
        return true;
      }, process.env.HK_BROWSER_ADMIN_EMAIL || 'audit@example.test', process.env.HK_BROWSER_ADMIN_PASSWORD);
      assert.ok(accounts);
      console.log('Browser passed actual parent registration and admin sign-in, password change, dashboard and sign-out.');
    }

    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 820, deviceScaleFactor: 1, mobile: false });
    const results = await evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
      const assert = (value, label) => { if (!value) throw new Error(label); };
      const root = document.querySelector('#app');
      let current, dispose;
      function open(name, parameters = {}) {
        if (typeof dispose === 'function') dispose();
        root.replaceChildren ? root.replaceChildren() : root.innerHTML = '';
        root.classList.remove('is-welcome');
        document.body.classList.remove('is-dash', 'is-adult');
        current = document.createElement('div');
        current.className = 'screen';
        current.style.cssText = 'position:absolute;top:0;bottom:0;right:0;left:0';
        current.dataset.screen = name;
        root.append(current);
        dispose = HK.screens[name](current, parameters);
        return current;
      }
      function close() {
        if (typeof dispose === 'function') dispose();
        dispose = null;
        current.remove();
      }
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      const user = { id: 90000, role: 'parent', name: 'Fixture Parent', access_status: 'active' };
      Net.acceptSession('fixture-session', user);
      const worksheetId = Date.now();
      Net.connect = () => {};
      Net.api = async (method, path) => {
        if (path === '/api/me') return { user };
        if (path.endsWith('/homework')) return [{ id: worksheetId, title: 'Shared worksheet', created: 1, kind: 'quiz', questions: [] }];
        return [];
      };
      const child = { id: 'audit-child-first-' + worksheetId, name: 'Test Child', birth: '2017-09-01', modeOverride: 'explorer', stars: 100, coins: 500, grade: 'Darasa la 1', color: '#1EA7F0', religion: 'values' };
      const sibling = { ...child, id: 'audit-child-second-' + worksheetId, serverId: 902, name: 'Sibling' };
      Store.saveChild(child);
      Store.saveChild(sibling);
      Store.setActive(child.id);
      Store.saveSettings({ bedtime: 'off', gameLimitMin: 120, bonusMin: 5 });
      Store.saveChild({ ...child, serverId: 901 });
      await HWDB.put({ id: 's' + worksheetId, childId: child.id, status: 'doing', created: 1, pages: [], answers: ['draft'] });
      await SchoolSync.pull(Store.child(child.id));
      await SchoolSync.pull(sibling);
      const [one] = await HWDB.byChild(child.id);
      const [two] = await HWDB.byChild(sibling.id);
      assert(one.id !== two.id && one.answers[0] === 'draft' && !two.answers && !await HWDB.get('s' + worksheetId), 'Sibling homework and legacy draft migration');
      const mockStream = { getTracks: () => [{ stop: () => { mediaStops++; } }] };
      let mediaStops = 0;
      const mediaDevices = navigator.mediaDevices;
      const oldGetMedia = mediaDevices.getUserMedia;
      const OldRecorder = window.MediaRecorder;
      mediaDevices.getUserMedia = async () => mockStream;
      window.MediaRecorder = class {
        constructor() { this.state = 'inactive'; }
        start() { this.state = 'recording'; }
        stop() { this.state = 'inactive'; }
      };
      const audioDialogRoot = document.createElement('div');
      root.append(audioDialogRoot);
      recordAudio(audioDialogRoot, one);
      await audioDialogRoot.querySelector('.btn').onclick();
      audioDialogRoot.querySelector('.overlay').onGameBack();
      assert(mediaStops === 1 && !audioDialogRoot.querySelector('.overlay'), 'Recorder cancels and stops the microphone on Back');
      audioDialogRoot.remove();
      mediaDevices.getUserMedia = oldGetMedia;
      window.MediaRecorder = OldRecorder;
      GT.seen = () => true;
      Sfx.tone = () => {};
      speak = () => {};
      const curriculumChecks = [];
      HK.go('lessons',{}, {reset:true});
      root.querySelector('[data-go="curriculum"]').click();
      assert(GAMES.length === 20 && GAMES.every(game => Curriculum.games[game.id]),'All game campaigns map to the curriculum');
      for (const game of GAMES) {
        const count=game.id==='racing'?RACE_EPISODES:GAME_EPISODES;
        const episodes=Array.from({length:count},(_,index)=>Curriculum.episode(game.id,index+1));
        assert(new Set(episodes.map(episode=>episode.title)).size===count,'Episode objectives differ for '+game.id);
      }
      assert(root.querySelectorAll('[data-skill]').length===24,'All learning objectives displayed');
      assert(root.querySelector('[data-skill="math.add"]').disabled,'Prerequisite starts locked');
      const originalChoose = Curriculum.choose;
      let selectedQuestions;
      const seen = new Set();
      Curriculum.choose = (...args) => {
        selectedQuestions = originalChoose(...args);
        for (const q of selectedQuestions) {
          assert(!seen.has(q.id),'No recent repeats: ' + q.id);
          seen.add(q.id);
        }
        return selectedQuestions;
      };
      const answerRound = (hint=false) => {
        root.querySelector('#practice-start').click();
        if (hint) root.querySelector('#practice-hint').click();
        for (const q of selectedQuestions) {
          const button = [...root.querySelectorAll('[data-choice]')].find(el=>el.textContent.trim()===q.answer);
          assert(button,'Correct answer displayed');
          button.click();
        }
      };
      root.querySelector('[data-skill="math.number"]').click();
      answerRound(true);
      assert(root.textContent.includes('4 of 5 answered independently'),'Hints excluded from independent answers');
      assert(!Curriculum.mastered(Store.active(),'math.number'),'First round cannot master skill');
      root.querySelector('#practice-retry').click();
      answerRound();
      assert(Curriculum.mastered(Store.active(),'math.number'),'Two fresh passing rounds master the skill');
      root.querySelector('#practice-done').click();
      assert(!root.querySelector('[data-skill="math.add"]').disabled,'Next objective unlocks');
      assert(Curriculum.available(Store.active(),Curriculum.skills['math.add']),'Unlock saved to child profile');
      Store.setActive(sibling.id);
      assert(!Curriculum.available(Store.active(),Curriculum.skills['math.add']),'Sibling has independent state');
      Store.setActive(child.id);
      HK.go('gameEpisodes',{id:'jungle'},{reset:true});
      root.querySelector('[data-episode="1"]').click();
      assert(root.querySelector('[data-screen="skillPractice"]'),'Episode routes through objective checkpoint');
      answerRound();
      root.querySelector('#play-episode').click();
      assert(root.querySelector('[data-screen="g_jungle"]'),'Passing opens actual game');
      assert(Curriculum.state(Store.active()).episodes['jungle:1'],'Episode checkpoint persisted');
      HK.go('g_jungle',{level:1},{reset:true});
      assert(root.querySelector('[data-screen="g_jungle"]'),'Completed checkpoint does not block replay');
      const currentChild=Store.active();
      GK.prog(currentChild,'jungle').level=7;
      Store.saveChild(currentChild);
      HK.go('g_jungle',{level:7},{reset:true});
      assert(root.querySelector('[data-screen="skillPractice"]'),'Chapter gate redirects to learning');
      assert(root.textContent.includes('before continuing to Read events in order'),'Chapter requires prerequisite skill');
      Curriculum.choose = originalChoose;
      const resetChild=Store.active();
      GK.prog(resetChild,'jungle').level=1;
      Store.saveChild(resetChild);
      HK.go('home',{}, {reset:true});
      curriculumChecks.push('24 objectives, two-round mastery, hints, fresh questions, sibling isolation, game entry, checkpoint replay, chapter gate');
      console.log('Curriculum workflow passed',curriculumChecks[0]);
      const testedScreens = [];
      const screenRuns = [
        ['home'], ['games'], ['rewards'], ['kidProfile'], ['lessons'], ['langCats'],
        ['langLesson', { cat: Object.keys(VOCAB)[0] }], ['cardLesson', { key: Object.keys(LESSONS)[0] }],
        ['mathLesson'], ['swahiliLesson'], ['animalGuide'], ['abc'], ['tapGame', {kind: 'animals'}],
        ['tapGame', {kind: 'numbers'}], ['tapGame', {kind: 'colors'}], ['tapGame', {kind: 'shapes'}],
        ['safari'], ['safariSeries'], ['safariPassport'], ['myReport'], ['hwList'],
        ['gameEpisodes', {id:'jungle'}], ['raceMenu'], ['together'],
      ];
      for (const [name, parms] of screenRuns) {
        const screen = open(name, parms);
        assert(screen.childElementCount > 0, 'Empty screen ' + name);
        testedScreens.push(name);
        await wait(12);
      }
      close();
      let games = 0;
      const gameModes = ['toddler', 'explorer', 'advanced'];
      for (const mode of gameModes) {
        Store.saveChild({ ...Store.active(), modeOverride: mode });
        for (const game of GAMES) {
          const screen = open(game.id === 'racing' ? 'racePlay' : 'g_' + game.id, { level: 1 });
          await wait(game.id === 'balloons' ? 120 : 16);
          assert(screen.childElementCount > 0, 'Empty game ' + game.id);
          for (const canvas of screen.querySelectorAll('canvas')) assert(canvas.width > 0 && canvas.height > 0, 'Canvas size ' + game.id);
          games++;
        }
      }
      close();

      const quiz = open('mathLesson');
      const exitQuiz = () => {
        const text = quiz.querySelector('.g-q').textContent;
        const fraction = /(\d+)\/(\d+) of (\d+)/.exec(text);
        const match = /(\d+)\s*([+−×÷-])\s*(\d+)/.exec(text);
        assert(match || fraction, 'Math question text matches supported operations: ' + text);
        const [, left, op, right] = match || [];
        const a = +left, b = +right;
        const answer = fraction ? +fraction[1] / +fraction[2] * +fraction[3]
          : op === '+' ? a + b : op === '×' ? a * b : op === '÷' ? a / b : a - b;
        const button = Array.from(quiz.querySelectorAll('.g-opt')).find(x => +x.textContent === answer);
        assert(button, 'A correct answer exists');
        button.click();
      };
      const questions = quiz.querySelectorAll('.g-progress i').length;
      for (let i = 0; i < questions; i++) { exitQuiz(); await wait(680); }
      assert(quiz.textContent.includes('Lesson complete!'), 'Math quiz completes');
      assert(Store.get('lessons_' + child.id, {}).math === 3, 'Math reward and lesson progress persist');
      close();
      let advance, state;
      const originalDraw = drawJungle, originalLoop = loopRun;
      drawJungle = (context, w, h, currentState) => { state = currentState; };
      loopRun = frame => { advance = frame; return () => { advance = null; }; };
      const step = () => advance(.05);
      const helperGame = open('g_jungle', {level:1});
      const bar = helperGame.querySelector('.jungle-status progress');
      helperGame.querySelector('#gk-help').click();
      Array.from(helperGame.querySelectorAll('.overlay button')).find(button => button.textContent.includes('Ask Nuru')).click();
      const stopped = bar.value;
      for (let i = 0; i < 8; i++) step();
      assert(bar.value === stopped, 'Help dialog pauses gameplay');
      helperGame.querySelector('.overlay .btn-row button').click();
      for (let i = 0; i < 8; i++) step();
      assert(bar.value > stopped, 'Closing help resumes gameplay');
      close();

      function reachFork() {
        for (let j = 0; j < 410; j++) {
          step();
          if (state.phase === 'question') return;
        }
        throw new Error('Episode did not reach a fork');
      }
      Store.saveChild({ ...Store.active(), modeOverride: 'advanced' });
      let completed = 0;
      for (let episode = 1; episode <= 24; episode++) {
        const world = open('g_jungle', {level:episode});
        for (let leg = 0; leg < 4; leg++) {
          reachFork();
          const q = state.question;
          const correct = q.values.indexOf(q.answer);
          const buttons = world.querySelectorAll('[data-path]');
          if (episode === 1 && leg === 0) {
            [...buttons].filter((button, i) => i !== correct).forEach(button => button.click());
            assert(state.phase === 'caught', 'Guardian catches the runner after two wrong choices');
            world.querySelector('#jungle-retry').click();
            reachFork();
            assert(state.question === q, 'Retry keeps the same question');
          }
          if(q.format==='writing') {
            const draft=world.querySelector('[data-episode-draft]');
            assert(draft,'Advanced trail contains a writing activity');
            draft.querySelector('textarea').value='Asha followed the footprints home.';
            draft.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
          } else world.querySelectorAll('[data-path]')[correct].click();
          for (let tick = 0; tick < 23; tick++) step();
        }
        const progress = Store.active().gp.jungle;
        assert(progress.level === Math.min(24, episode + 1) && progress.best[episode] >= 2, 'Episode progress ' + episode);
        close();
        assert(advance === null, 'Runner animation disposed');
        completed++;
      }
      drawJungle = originalDraw;
      loopRun = originalLoop;
      const learningStopChecks=[];
      const practiceScreen=document.createElement('div');
      practiceScreen.className='screen';
      root.append(practiceScreen);
      const fixtureKit=GK.frame(practiceScreen,'runner',{level:1});
      await fixtureKit.curriculumProgress(.1);
      assert(!practiceScreen.querySelector('.episode-stop'),'Arcade learning happens after play has started');
      const next=fixtureKit.curriculumProgress(.4);
      assert(fixtureKit.paused && practiceScreen.querySelector('.episode-stop'),'Mid-run station pauses controls');
      const solveStop=(item)=>{
        const overlay=practiceScreen.querySelector('.episode-stop');
        assert(overlay && overlay.textContent.includes(item.text),'Actual in-game station uses the episode item');
        const wrong=[...overlay.querySelectorAll('[data-episode-choice]')].find(button=>button.textContent!==item.answer);
        wrong.click();
        assert(wrong.disabled,'Wrong choice leaves station open');
        [...overlay.querySelectorAll('[data-episode-choice]')].find(button=>button.textContent===item.answer).click();
      };
      solveStop(fixtureKit.episode.items[0]);
      await next;
      assert(!fixtureKit.paused,'Right choice resumes play');
      fixtureKit.finish();
      assert(!Store.active().gp?.runner?.best?.[1],'Rewards wait for completion of the station tasks');
      solveStop(fixtureKit.episode.items[1]);
      solveStop(fixtureKit.episode.items[2]);
      assert(Store.active().gp.runner.best[1]===3,'Completed gameplay and tasks record rewards');
      fixtureKit.cleanup(); practiceScreen.remove();
      learningStopChecks.push('Arcade pause, wrong choice, resume, compulsory end-of-episode tasks and rewards');

      // Advance the actual racing animation with a controlled frame clock.
      const savedRaf=window.requestAnimationFrame;
      const savedCancel=window.cancelAnimationFrame;
      const savedTimeout=window.setTimeout;
      const savedShuffle=shuffle;
      const savedGameLeft=HK.gameLeft;
      const vehicleChild=Store.active();
      Store.saveChild({...vehicleChild,modeOverride:'toddler'});
      HK.gameLeft=()=>3600;
      try {
        for (const level of [1,18]) {
          const episode=EpisodeContent.game('racing',level);
          const active=new Map();
          const countdown=[];
          window.setTimeout=(fn,ms,...args)=>fn.name==='countdown' ? countdown.push(fn) : savedTimeout(fn,ms,...args);
          let handle=0, choices, nextItem=0, lane=1;
          window.requestAnimationFrame=callback=>{active.set(++handle,callback);return handle;};
          window.cancelAnimationFrame=id=>active.delete(id);
          shuffle=items=>{
            const result=savedShuffle(items);
            if (episode.items[nextItem] && items.length===3 && episode.items[nextItem].choices.every(value=>items.includes(value))) choices=result;
            return result;
          };
          const race=open('racePlay',{level});
          for (let second=0;second<4;second++) countdown.shift()();
          assert(active.size>0,'Race animation frame is scheduled');
          let stamp=performance.now();
          for (let frame=0;frame<3200 && !race.querySelector('.overlay');frame++) {
            const pending=[...active.values()]; active.clear();
            pending.forEach(fn=>fn(stamp+=50));
            if (!choices) continue;
            const item=episode.items[nextItem++];
            assert(race.querySelector('#q').textContent.includes(item.text),'Racing uses the authored episode gate');
            const correct=choices.indexOf(item.answer);
            assert(correct>=0,'Correct road lane exists');
            while(lane!==correct){
              const move=lane<correct?1:-1;
              window.dispatchEvent(new KeyboardEvent('keydown',{key:move>0?'ArrowRight':'ArrowLeft'}));
              lane+=move;
            }
            choices=null;
          }
          assert(nextItem===5,'Racing '+level+' presented '+nextItem+' gates; '+race.querySelector('#q').textContent+'; '+race.querySelector('.overlay')?.textContent);
          assert(race.querySelector('.overlay')?.textContent.includes('Correct answers 5/5'),'Correct lane selections reach the race result');
          close();
        }
      } finally {
        window.requestAnimationFrame=savedRaf; window.cancelAnimationFrame=savedCancel; window.setTimeout=savedTimeout;
        shuffle=savedShuffle; HK.gameLeft=savedGameLeft;
        Store.saveChild({...Store.active(),modeOverride:vehicleChild.modeOverride});
      }
      learningStopChecks.push('First and final race complete five different native lane challenges each');

      const safariChild=Store.active();
      safariChild.saladStory={...safariChild.saladStory,earned:true};
      safariChild.safariSeries={1:{step:3,done:true}};
      Store.saveChild(safariChild);
      assert(!safariUnlocked(Store.active(),2),'Old passport data cannot bypass the new field missions');
      for(let index=1;index<EpisodeContent.safariCount;index++) {
        const adventure=open('safariEpisode',{index});
        for (const item of EpisodeContent.story(index+1).items) {
          assert(adventure.textContent.includes(item.text),'Safari objective is part of actual play');
          const correct=[...adventure.querySelectorAll('[data-answer]')].find(button=>button.textContent.trim()===item.answer);
          assert(correct,'Safari correct option visible');
          correct.click();
        }
        assert(Store.active().safariField[index].done,'Safari unlocks next mission only on completion');
        close();
      }
      const passport=open('safariPassport');
      assert(passport.textContent.includes('Earlier passport stamps') && passport.textContent.includes('Follow the Footprints'),'Older passport stamps preserved');
      close();
      learningStopChecks.push('Six linked Safari field missions and legacy passport preservation');
      return { learningStopChecks, curriculumChecks, games, testedScreens, mathQuestions: questions, jungleEpisodes: completed, registeredScreens: Object.keys(HK.screens).length };
    });
    assert.equal(results.games, 60);
    assert.equal(results.mathQuestions, 8);
    assert.equal(results.jungleEpisodes, 24);
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    console.log(JSON.stringify(results, null, 2));
  } finally { socket.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
