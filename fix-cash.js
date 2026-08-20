/* fix-cash.js v2 — патчит DOM и формулу кассы */
(function(){
'use strict';
function N(v){return Number(v)||0}
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function fmt(kop){return Math.round(N(kop)/100).toLocaleString('ru-RU')+' \u20bd'}

function fixedCash(start,end){
  const STATE=window.STATE; if(!STATE) return null;
  const today=todayStr();
  const uptoDate=end<today?end:today;
  const asOf=(STATE.settings&&STATE.settings.balanceAsOfDate)||'1970-01-01';
  const ops=Array.isArray(STATE.reserveOps)?STATE.reserveOps:[];
  let atManual=0,atReg=0,atObl=0,atDep=0,atWd=0;
  if(uptoDate>=asOf){
    (STATE.income||[]).forEach(i=>{if(i.status==='actual'&&i.date>=asOf&&i.date<=uptoDate)atManual+=N(i.amount)});
    (STATE.expenses||[]).forEach(e=>{if(e.date>=asOf&&e.date<=uptoDate){if(e.mandatory)atObl+=N(e.amount);else atReg+=N(e.amount)}});
    ops.forEach(o=>{if(o&&o.date>=asOf&&o.date<=uptoDate){if(o.type==='deposit')atDep+=N(o.amount);else if(o.type==='withdraw')atWd+=N(o.amount)}});
  }
  let plannedReg=0,plannedObl=0,debtsDue=0,reservesNeeded=0;
  (STATE.expenses||[]).filter(e=>e.date>=start&&e.date<=end).forEach(e=>{
    if(e.date>today){ if(e.mandatory)plannedObl+=N(e.amount); else plannedReg+=N(e.amount); }
  });
  (STATE.debts||[]).forEach(d=>{debtsDue+=Math.max(0,N(d.amount)-N(d.paid))});
  const totalIncome=(STATE.income||[]).filter(i=>i.date>=start&&i.date<=end).reduce((a,i)=>a+N(i.amount),0);
  (STATE.reserves||[]).filter(r=>r.active!==false).forEach(r=>{
    let need=0;
    if(r.method==='fixed')need=N(r.fixedAmount);
    else if(r.method==='percent')need=totalIncome*N(r.percent)/100;
    reservesNeeded+=Math.max(0,Math.round(need));
  });
  const base=N(STATE.settings&&STATE.settings.currentBalance);
  const cash=base+atManual-atReg-atObl-atDep+atWd;
  const strictAvailable=Math.max(0,cash-(plannedReg+plannedObl)-debtsDue-reservesNeeded);
  let rem=0; if(today<=end){ const d0=today<start?start:today; let d=d0; while(d<=end){rem++; const x=new Date(d+'T12:00:00'); x.setDate(x.getDate()+1); d=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0'); if(rem>40)break;} }
  const daily=rem>0?Math.floor(strictAvailable/rem):null;
  return {cash,strictAvailable,daily,remainingDays:rem,plannedReg,plannedObl,debtsDue,reservesNeeded};
}

function period(){
  if(typeof window.currentPeriod==='function') return window.currentPeriod();
  const y=new Date().getFullYear(), m=new Date().getMonth()+1;
  const start=y+'-'+String(m).padStart(2,'0')+'-01';
  const end=y+'-'+String(m).padStart(2,'0')+'-'+String(new Date(y,m,0).getDate()).padStart(2,'0');
  return {start,end};
}

function applyDomFix(){
  try{
    const {start,end}=period();
    const s=fixedCash(start,end);
    if(!s) return;
    const main=document.getElementById('main');
    if(!main) return;
    const big=main.querySelector('.card.hero .big');
    if(big && s.daily!=null){
      big.textContent=fmt(s.daily);
      big.className='big '+(s.daily<0?'neg':'pos');
    }
    const mids=main.querySelectorAll('.grid2 .card .mid');
    if(mids[0]){
      mids[0].textContent=fmt(s.strictAvailable);
      mids[0].className='mid '+(s.strictAvailable<0?'neg':'pos');
    }
    const cashMid=main.querySelector('.cash-card .cash-col .mid');
    if(cashMid) cashMid.textContent=fmt(s.cash);
  }catch(e){console.warn('dom cash fix',e)}
}

function fixLayout(){
  try{
    const main=document.getElementById('main');
    if(!main) return;
    const cash=main.querySelector('.cash-card');
    const an=main.querySelector('.analytics-card');
    if(cash && an && cash.contains(an)){
      cash.parentNode.insertBefore(an, cash.nextSibling);
    }
    if(cash){
      cash.style.overflow='hidden';
      cash.style.position='relative';
    }
    if(an){
      an.style.marginTop='12px';
      an.style.position='relative';
      an.style.zIndex='1';
      an.style.clear='both';
    }
  }catch(e){console.warn('layout fix',e)}
}

function run(){
  applyDomFix();
  fixLayout();
}

function hook(){
  const orig=window.render;
  if(typeof orig==='function' && !orig.__cashDomFix){
    window.render=function(){
      const r=orig.apply(this,arguments);
      setTimeout(run,0);
      return r;
    };
    window.render.__cashDomFix=true;
  }
  const main=document.getElementById('main');
  if(main && !main.__cashObs){
    const mo=new MutationObserver(()=>setTimeout(run,0));
    mo.observe(main,{childList:true,subtree:true});
    main.__cashObs=true;
  }
  run();
}

function boot(){
  hook();
  let n=0;
  const t=setInterval(()=>{hook(); if(++n>30)clearInterval(t)},200);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
else boot();
})();
