/* Shared by the offline browser and the curriculum progress endpoint. */
const CurriculumState = (() => {
  const recentLimit = 30;
  const skillPattern = /^[a-z]+\.[a-z]+$/;
  const questionPattern = /^[a-z]+\.[a-z]+:[1-9]\d{0,2}$/;
  const episodePattern = /^[a-z]+:[1-9]\d?$/;
  const timestamp = n => Number.isSafeInteger(n) && n > 0;
  const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const entries = (value, test) => Object.entries(object(value)).filter(([key,n]) => test.test(key) && timestamp(n));
  function merge(local, remote) {
    local = object(local);
    remote = object(remote);
    const skills = {};
    const keys = new Set([...Object.keys(object(local.skills)),...Object.keys(object(remote.skills))].filter(key => skillPattern.test(key)));
    for (const key of [...keys].slice(0,36)) {
      const a = object(object(local.skills)[key]);
      const b = object(object(remote.skills)[key]);
      const evidence = {};
      for (const [id,time] of [...entries(a.evidence,questionPattern),...entries(b.evidence,questionPattern)]) {
        if (id.startsWith(key + ':')) evidence[id] = Math.max(time,evidence[id] || 0);
      }
      const wins = {};
      for (const [id,time] of [...entries(a.wins,questionPattern),...entries(b.wins,questionPattern)]) {
        if (id.startsWith(key + ':') && evidence[id]) wins[id] = Math.max(time,wins[id] || 0);
      }
      const seen = {};
      for (const [id,time] of [...entries(a.seen,questionPattern),...entries(b.seen,questionPattern)]) {
        if (id.startsWith(key + ':')) seen[id] = Math.max(time,seen[id] || 0);
      }
      skills[key] = {
        evidence: Object.fromEntries(Object.entries(evidence).sort((x,y)=>x[0].localeCompare(y[0])).slice(0,80)),
        wins: Object.fromEntries(Object.entries(wins).sort((x,y)=>x[0].localeCompare(y[0])).slice(0,12)),
        seen: Object.fromEntries(Object.entries(seen).sort((x,y)=>y[1]-x[1] || x[0].localeCompare(y[0])).slice(0,recentLimit)),
        practised: Math.max(timestamp(a.practised) ? a.practised : 0,timestamp(b.practised) ? b.practised : 0),
      };
    }
    const episodes = {};
    for (const [id,time] of [...entries(local.episodes,episodePattern),...entries(remote.episodes,episodePattern)]) episodes[id] = Math.max(time,episodes[id] || 0);
    return {skills,episodes:Object.fromEntries(Object.entries(episodes).sort((x,y)=>x[0].localeCompare(y[0])).slice(0,480))};
  }
  function mastered(skill) {
    return Object.keys(skill?.evidence || {}).length >= 8 && Object.keys(skill?.wins || {}).length >= 2;
  }
  return { merge, mastered, recentLimit };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = CurriculumState;
