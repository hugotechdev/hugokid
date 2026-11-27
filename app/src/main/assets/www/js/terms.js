

const TERMS_VERSION = '1.0';
const TERMS_DATE = 'Novemba 2026';

const TERMS_SECTIONS = [
  ['1. Kuhusu HUGO KID', "HUGO KID is an edutainment app (play and learning) for children aged 3 to 12, provided by HUGO TECH (Tanzania). Children play games, build skills (languages, math, creativity, AI and more), learn and do homework, while the parent controls screen time. The goal is to help children use the phone for something useful, instead of spending hours watching videos and playing games that don't help them grow."],
  ["2. The parent or guardian owns the account", "An account is opened by a parent or guardian aged 18 or over. By accepting these terms, you confirm that you are the lawful parent or guardian of the children you register, and you consent to their information being processed as described here. A child cannot open an account on their own."],
  ["3. Information we collect", "The child's name, date of birth, character color, faith content choice, progress (stars, levels, learning and play time), the child's homework and work, and conversations with Nuru. Some information is saved on this device for offline use. When the account syncs online, the HUGO TECH server stores the information needed for the account, progress backup and connected services."],
  ["4. How we use information", "To give the child lessons suited to their age, show the parent progress, enable homework between parent, teacher and child, and improve the service. We do not sell children's information, we do not show ads, and we do not use a child's photo or name in advertising without the parent's written consent."],
  ['5. Shule na walimu', "If you link the child to a school with the school code, the class teacher and head teacher will see homework, answers, scores, attendance and your messages with them about that child. The school does not see games, conversations with Nuru or phone usage time."],
  ['6. AI (Nuru)', "Nuru uses the AI service you choose (Google Gemini, Anthropic Claude or OpenAI ChatGPT) through your API key. The child's questions and homework photos are sent to that provider, which may be outside Tanzania, only to get an answer. Nuru has child-safe content limits and does not give the child homework answers directly, but AI can make mistakes. Parents are advised to monitor and can see all conversations or turn Nuru off at any time. API key costs are paid by the parent."],
  ["7. Learning Mode and phone permissions", "Learning Mode asks for permission to know which app is in use, to display over other apps, to be the phone's Home and to prevent uninstalling. These permissions are used only to control the child's time, and are not used to read messages, photos or information from other apps. The camera and microphone are used only when the child or parent taps them (homework photo, speaking practice)."],
  ['8. Usalama wa mtoto', "A child cannot search for or contact strangers. Audio or video calls and playing together are possible only between friends added by code between two parents, and only if both parents allowed it. Every call has a time limit, calls are not recorded, and the parent can see the call history. Report anything inappropriate using the contacts below."],
  ['9. Maudhui ya imani', "The faith section is optional. The parent decides whether it is on or off, and chooses Islam, Christianity or General values. The child sees only the content the parent chose."],
  ['10. Haki zako', "You have the right to see, correct or delete your child's information, and to withdraw your consent at any time. Deleting a child's profile or removing the app deletes the information on the phone. For information on the server, contact us and we will delete it. These rights are protected by Tanzania's Personal Data Protection Act, 2022."],
  ['11. Malipo', "Some services may require a paid subscription. Prices and payment terms will be shown clearly before you pay."],
  ['12. Matumizi sahihi', "The app must be used for the child's learning and growth only. Uploading content unsuitable for children or trying to disrupt the system is prohibited. HUGO TECH may suspend an account that breaks these terms."],
  ['13. Mabadiliko', "If these terms change, we will show you the new version inside the app and ask you to accept it before continuing."],
  ['14. Mawasiliano', 'HUGO TECH · info@hugotech.co.tz · WhatsApp +255 785 799 530 · hugotech.co.tz'],
];

function termsHTML() {
  return `<p class="muted" style="font-size:12px;font-weight:600;margin:0 2px 10px">Toleo ${TERMS_VERSION} · ${TERMS_DATE}</p>` +
    TERMS_SECTIONS.map(([t, x]) => `<div class="card"><h3>${esc(t)}</h3><p>${esc(x)}</p></div>`).join('');
}
function termsAccepted() { const p = Store.parent(); return !!(p && p.terms && p.terms.v === TERMS_VERSION); }

HK.screens.terms = (el, p) => {
  const accept = p.mode === 'accept';
  el.innerHTML = `
    <div class="topbar">${accept && !p.update ? `<button class="icon-btn" id="bk">${icon('back')}</button>` : accept ? '' : `<button class="icon-btn" id="bk">${icon('back')}</button>`}
      <h1>Terms and Privacy</h1></div>
    <div class="scroll" id="tb">${p.update ? '<div class="card" style="background:#FFF4D2"><p>Masharti yamebadilika. Tafadhali yasome na uyakubali ili kuendelea.</p></div>' : ''}${termsHTML()}
      ${accept ? `<label class="card row" style="cursor:pointer;gap:12px;align-items:flex-start">
          <input type="checkbox" id="ok" style="width:24px;height:24px;flex:none;margin-top:2px;accent-color:var(--teal)">
          <span style="font-weight:600;font-size:14px">I am the parent or guardian of the children I will register. I have read and accept the Terms of Use and Privacy Policy.</span></label>
        <button class="btn block" id="go" disabled>${icon('check', 20)} Nakubali, endelea</button>` : ''}
    </div>`;
  const bk = $('#bk', el); if (bk) bk.onclick = () => HK.back();
  if (!accept) return;
  $('#ok', el).onchange = e => { $('#go', el).disabled = !e.target.checked; };
  $('#go', el).onclick = () => {
    const par = Store.parent() || { created: Date.now(), settings: {} };
    par.terms = { v: TERMS_VERSION, at: Date.now() };
    Store.saveParent(par);
    Sfx.good();
    if (p.update) HK.boot();
    else HK.go('pin', { mode: 'create' }, { replace: true });
  };
};
