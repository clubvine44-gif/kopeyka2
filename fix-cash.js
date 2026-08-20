/* fix-cash.js — касса без вычета погашенных долгов + закрытие блока кассы */
(function(){
'use strict';
function N(v){return Number(v)||0}
function patch(){
  if(typeof window.computeSummary!=='function') return false;
  const orig=window.computeSummary;
  if(orig.__cashFixed) return true;
  window.computeSummary=function(start,end){
    const s=orig(start,end);
    try{
      const STATE=window.STATE;
      if(!STATE) return s;
      const today=(typeof todayStr==='function')?todayStr():new Date().toISOString().slice(0,10);
      const uptoDate=end<today?end:today;
      const asOf=(STATE.settings&&STATE.settings.balanceAsOfDate)||'1970-01-01';
      const ops=Array.isArray(STATE.reserveOps)?STATE.reserveOps:[];
      let atManual=0,atReg=0,atObl=0,atDep=0,atWd=0;
      if(uptoDate>=asOf){
        (STATE.income||[]).forEach(i=>{if(i.status==='actual'&&i.date>=asOf&&i.date<=uptoDate)atManual+=N(i.amount)});
        (STATE.expenses||[]).forEach(e=>{if(e.date>=asOf&&e.date<=uptoDate){if(e.mandatory)atObl+=N(e.amount);else atReg+=N(e.amount)}});
        ops.forEach(o=>{if(o&&o.date>=asOf&&o.date<=uptoDate){if(o.type==='deposit')atDep+=N(o.amount);else if(o.type==='withdraw')atWd+=N(o.amount)}});
      }
      const base=N(STATE.settings&&STATE.settings.currentBalance);
      const cash=base+atManual-atReg-atObl-atDep+atWd;
      const planned=(s.plannedRegular||0)+(s.plannedObligatory||0);
      const strictAvailable=Math.max(0,cash-planned-(s.debtsDue||0)-(s.reservesNeeded||0));
      let rem=s.remainingDays||0;
      const daily=rem>0?Math.floor(strictAvailable/rem):null;
      return Object.assign({},s,{cash,strictAvailable,daily});
    }catch(e){console.warn('cash fix',e);return s}
  };
  window.computeSummary.__cashFixed=true;
  if(typeof window.render==='function') try{window.render()}catch(_){}
  return true;
}
function boot(){
  if(patch()) return;
  let n=0;
  const t=setInterval(()=>{ if(patch()||++n>40) clearInterval(t); },100);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
