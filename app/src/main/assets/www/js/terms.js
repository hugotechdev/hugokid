/* HUGO KID - terms.js : Masharti ya matumizi na Sera ya faragha (mzazi anakubali wakati wa kujisajili) */

const TERMS_VERSION = '1.0';
const TERMS_DATE = 'Novemba 2026';

const TERMS_SECTIONS = [
  ['1. Kuhusu HUGO KID', 'HUGO KID ni programu ya elimu kwa watoto wa miaka 3 hadi 12, inayotolewa na HUGO TECH (Tanzania). Inatoa masomo, homework ya kidijitali, michezo ya kujifunza, msaidizi wa AI (Nuru) na udhibiti wa muda kwa mzazi.'],
  ['2. Mzazi au mlezi ndiye mwenye akaunti', 'Akaunti inafunguliwa na mzazi au mlezi mwenye umri wa miaka 18 au zaidi. Kwa kukubali masharti haya, unathibitisha kuwa wewe ni mzazi au mlezi halali wa watoto unaowasajili, na unatoa ridhaa ya taarifa zao kuchakatwa kama ilivyoelezwa hapa. Mtoto hawezi kufungua akaunti mwenyewe.'],
  ['3. Taarifa tunazokusanya', 'Jina la mtoto, tarehe ya kuzaliwa, rangi ya mhusika, chaguo la maudhui ya imani, maendeleo (nyota, ngazi, muda wa kujifunza na kucheza), homework na kazi za mtoto, na mazungumzo yake na Nuru. Kwa sasa taarifa hizi zinahifadhiwa kwenye simu hii tu. Akaunti za mtandaoni (shule, walimu, marafiki) zikiwashwa, taarifa zinazohitajika zitahifadhiwa kwenye server ya HUGO TECH kwa usalama.'],
  ['4. Tunavyotumia taarifa', 'Kumpangia mtoto masomo ya umri wake, kumwonyesha mzazi maendeleo, kuwezesha homework kati ya mzazi, mwalimu na mtoto, na kuboresha huduma. Hatuuzi taarifa za mtoto, hatuweki matangazo, na hatutumii picha au jina la mtoto kwenye matangazo bila ridhaa ya maandishi ya mzazi.'],
  ['5. Shule na walimu', 'Ukiunganisha mtoto na shule kwa msimbo wa shule, mwalimu wa darasa na mkuu wa shule wataona homework, majibu, alama, mahudhurio na ujumbe wako nao kuhusu mtoto huyo. Shule haioni michezo, mazungumzo na Nuru wala muda wa matumizi ya simu.'],
  ['6. AI (Nuru)', 'Nuru inatumia huduma ya AI unayoichagua (Google Gemini, Anthropic Claude au OpenAI ChatGPT) kupitia API key yako. Maswali ya mtoto na picha za homework zinatumwa kwa mtoa huduma huyo, ambaye anaweza kuwa nje ya Tanzania, kwa ajili ya kujibu tu. Nuru imewekewa mipaka ya maudhui ya watoto na haimpi mtoto majibu ya homework moja kwa moja, lakini AI inaweza kukosea. Mzazi anashauriwa kufuatilia na anaweza kuona mazungumzo yote au kuzima Nuru wakati wowote. Gharama za API key ni za mzazi.'],
  ['7. Learning Mode na ruhusa za simu', 'Learning Mode inaomba ruhusa ya kujua programu inayotumika, kuonekana juu ya programu nyingine, kuwa Home ya simu na kuzuia kufutwa. Ruhusa hizi zinatumika kudhibiti muda wa mtoto tu, na hazitumiki kusoma ujumbe, picha au taarifa za programu nyingine. Kamera na kipaza sauti vinatumika pale tu mtoto au mzazi anapovibonyeza (picha ya homework, kuongea lugha).'],
  ['8. Usalama wa mtoto', 'Mtoto hawezi kutafuta wala kuwasiliana na mtu asiyemjua. Simu za sauti au video na michezo ya pamoja zinawezekana tu kati ya marafiki walioongezwa kwa msimbo kati ya wazazi wawili, na tu kama wazazi wote wameruhusu. Kila simu ina kikomo cha muda, simu hazirekodiwi, na mzazi anaona historia ya simu. Ripoti jambo lolote lisilofaa kupitia mawasiliano yaliyo hapa chini.'],
  ['9. Maudhui ya imani', 'Sehemu ya imani ni hiari. Mzazi anaamua iwepo au isiwepo, na anachagua Uislamu, Ukristo au Maadili ya jumla. Mtoto anaona maudhui ya chaguo la mzazi tu.'],
  ['10. Haki zako', 'Una haki ya kuona, kurekebisha au kufuta taarifa za mtoto wako, na kuondoa ridhaa yako wakati wowote. Kufuta wasifu wa mtoto au kuondoa programu kunafuta taarifa zilizo kwenye simu. Kwa taarifa zilizo kwenye server, wasiliana nasi na tutazifuta. Haki hizi zinalindwa na Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania (Personal Data Protection Act, 2022).'],
  ['11. Malipo', 'Baadhi ya huduma zinaweza kuhitaji usajili wa kulipia. Bei na masharti ya malipo yataonyeshwa wazi kabla ya kulipa.'],
  ['12. Matumizi sahihi', 'Programu itumike kwa elimu ya mtoto tu. Ni marufuku kupakia maudhui yasiyofaa watoto au kujaribu kuvuruga mfumo. HUGO TECH inaweza kusimamisha akaunti inayokiuka masharti haya.'],
  ['13. Mabadiliko', 'Masharti haya yakibadilika, tutakuonyesha toleo jipya ndani ya programu na kukuomba ulikubali kabla ya kuendelea.'],
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
      <h1>Masharti na Faragha</h1></div>
    <div class="scroll" id="tb">${p.update ? '<div class="card" style="background:#FFF4D2"><p>Masharti yamebadilika. Tafadhali yasome na uyakubali ili kuendelea.</p></div>' : ''}${termsHTML()}
      ${accept ? `<label class="card row" style="cursor:pointer;gap:12px;align-items:flex-start">
          <input type="checkbox" id="ok" style="width:24px;height:24px;flex:none;margin-top:2px;accent-color:var(--teal)">
          <span style="font-weight:600;font-size:14px">Mimi ni mzazi au mlezi wa watoto nitakaowasajili. Nimesoma na ninakubali Masharti ya Matumizi na Sera ya Faragha.</span></label>
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
