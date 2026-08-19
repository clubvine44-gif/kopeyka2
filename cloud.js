/* cloud.js — Supabase sync for Kopeyka 2 (same account as kopeyka1) */
(function(){
'use strict';
const URL='https://cqslrfphsjllhltsvvuq.supabase.co';
const KEY='sb_publishable_cM_XCycYRFLIc6qEqlH83Q_5XY6kPzG';
const LOCAL_KEY='kopeyka2_state_v2';
const LEGACY_KEY='kopeyka_state_v1';

let sb=null, ready=false, saving=false, lastSent='', currentUser=null;

function loadSDK(){
  return new Promise((ok,bad)=>{
    if(window.supabase)return ok();
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=ok; s.onerror=bad;
    document.head.appendChild(s);
  });
}
function client(){
  if(!sb && window.supabase){
    sb=window.supabase.createClient(URL,KEY,{
      auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}
    });
  }
  return sb;
}

function toast(msg){
  if(typeof window.toast==='function') window.toast(msg);
  else console.log('[cloud]', msg);
}

/* Короткое уведомление о синхронизации показываем в шапке, а не внизу экрана */
function topNotice(msg){
  if(typeof window.topNotice==='function') window.topNotice(msg);
  else toast(msg);
}

function normalize(raw){
  if(!raw || typeof raw!=='object') raw={};
  const base = typeof window.defaultState==='function' ? window.defaultState() : {
    version:2, settings:{}, income:[], expenses:[], reserves:[], debts:[],
    recurring:[], reserveOps:[], shiftsOverride:{}, notes:[]
  };
  const out = Object.assign({}, base, raw);
  out.settings = Object.assign({}, base.settings||{}, raw.settings||{});
  if(out.settings.shiftTypes){
    out.settings.shiftTypes = Object.assign(
      {}, (base.settings&&base.settings.shiftTypes)||{}, out.settings.shiftTypes
    );
  }
  if(!out.settings.anchorDate && out.settings.cycleAnchor) out.settings.anchorDate = out.settings.cycleAnchor;
  if(out.settings.anchorIndex==null && out.settings.anchorDate) out.settings.anchorIndex = 1;
  if(!out.settings.cyclePattern || !out.settings.cyclePattern.length){
    out.settings.cyclePattern = ['day','day','night','night','off','off'];
  }
  ['income','expenses','reserves','debts','recurring','reserveOps','notes'].forEach(k=>{
    if(!Array.isArray(out[k])) out[k]=[];
  });
  if(!out.shiftsOverride || typeof out.shiftsOverride!=='object') out.shiftsOverride={};
  return out;
}

function applyState(raw, source){
  const n = normalize(raw);
  if(typeof window.setAppState==='function'){
    window.setAppState(n);
  } else {
    window.STATE = n;
    try{ localStorage.setItem(LOCAL_KEY, JSON.stringify(n)); }catch(_){}
    if(typeof window.render==='function') window.render();
  }
  lastSent = JSON.stringify(n);
  topNotice(source==='cloud' ? '\u0414\u0430\u043d\u043d\u044b\u0435 \u0438\u0437 \u043e\u0431\u043b\u0430\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b' : '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u043f\u043e\u0434\u0442\u044f\u043d\u0443\u0442\u044b');
}

function localLegacy(){
  /* \u0410\u0432\u0442\u043e-\u0438\u043c\u043f\u043e\u0440\u0442 \u0438\u0437 LEGACY_KEY \u0443\u0431\u0440\u0430\u043d \u043d\u0430\u0432\u0441\u0435\u0433\u0434\u0430: \u041a\u043e\u043f\u0435\u0439\u043a\u0430-1 \u0438 \u041a\u043e\u043f\u0435\u0439\u043a\u0430-2 \u0436\u0438\u0432\u0443\u0442 \u043d\u0430 \u043e\u0434\u043d\u043e\u043c \u0434\u043e\u043c\u0435\u043d\u0435
     (\u043e\u0431\u0449\u0438\u0439 localStorage), \u0438 LEGACY_KEY='kopeyka_state_v1' \u2014 \u044d\u0442\u043e \u0441\u043e\u0431\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0439 \u043a\u043b\u044e\u0447 \u041a\u043e\u043f\u0435\u0439\u043a\u0438-1.
     \u0427\u0442\u0435\u043d\u0438\u0435 \u0435\u0433\u043e \u0437\u0434\u0435\u0441\u044c \u043f\u0440\u0438\u0432\u043e\u0434\u0438\u043b\u043e \u043a \u0442\u043e\u043c\u0443, \u0447\u0442\u043e \u0436\u0438\u0432\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u041a\u043e\u043f\u0435\u0439\u043a\u0438-1 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438
     \u0437\u0430\u043b\u0438\u0432\u0430\u043b\u0438\u0441\u044c \u0432 \u043e\u0431\u043b\u0430\u043a\u043e \u041a\u043e\u043f\u0435\u0439\u043a\u0438-2. \u0421\u0432\u043e\u0439 \u0441\u043e\u0431\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0439 \u043a\u044d\u0448 (LOCAL_KEY) \u043e\u0441\u0442\u0430\u0432\u043b\u044f\u0435\u043c. */
  try{
    const b = localStorage.getItem(LOCAL_KEY);
    if(b) return JSON.parse(b);
  }catch(_){}
  return null;
}

async function loadFromCloud(){
  const c=client();
  if(!c || !currentUser) return false;
  try{
    let q = await c.rpc('load_user_finance_state');
    if(q.error){
      const t = await c.from('user_finance_state').select('state').eq('user_id', currentUser.id).maybeSingle();
      if(t.error) throw t.error;
      q = { data: t.data ? [{state:t.data.state}] : [] };
    }
    const row = Array.isArray(q.data) ? q.data[0] : q.data;
    if(row && row.state && typeof row.state==='object'){
      applyState(row.state, 'cloud');
      ready=true;
      return true;
    }
    const legacy = localLegacy();
    if(legacy){
      applyState(legacy, 'local');
      ready=true;
      await saveToCloud(true);
      toast('\u0421\u0442\u0430\u0440\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u043f\u0435\u0440\u0435\u043d\u0435\u0441\u0435\u043d\u044b \u0432 \u043e\u0431\u043b\u0430\u043a\u043e');
      return true;
    }
    ready=true;
    toast('\u041e\u0431\u043b\u0430\u043a\u043e \u043f\u0443\u0441\u0442\u043e\u0435');
    return false;
  }catch(e){
    console.error(e);
    toast('\u041e\u0448\u0438\u0431\u043a\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438 \u043e\u0431\u043b\u0430\u043a\u0430');
    return false;
  }
}

async function saveToCloud(force){
  if(!currentUser || !ready) return false;
  if(saving) return false;
  const st = window.STATE;
  if(!st) return false;
  saving=true;
  try{
    const clean = JSON.parse(JSON.stringify(normalize(st)));
    const json = JSON.stringify(clean);
    if(!force && json===lastSent){ saving=false; return true; }
    const c=client();
    let r = await c.rpc('save_user_finance_state', {p_state:clean, p_version:9});
    if(r.error){
      r = await c.from('user_finance_state').upsert({
        user_id: currentUser.id,
        state: clean,
        version: 9,
        updated_at: new Date().toISOString()
      }, {onConflict:'user_id'});
      if(r.error) throw new Error(r.error.message||'DB error');
    }
    lastSent=json;
    try{ localStorage.setItem(LOCAL_KEY, json); }catch(_){}
    setStatus(true, '\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u043d\u043e');
    return true;
  }catch(e){
    console.error(e);
    setStatus(false, '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0438\u043d\u043a\u0430');
    toast('\u041e\u0431\u043b\u0430\u043a\u043e: \u043e\u0448\u0438\u0431\u043a\u0430');
    return false;
  }finally{
    saving=false;
  }
}

let saveTimer=null;
function scheduleSave(){
  if(!ready || !currentUser) return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>saveToCloud(false), 900);
}

function setStatus(ok, text){
  const el=document.getElementById('cloudStatus');
  if(el){
    el.textContent=text||'';
    el.className='cloud-status'+(ok?' ok':'');
  }
  const dot=document.getElementById('cloudDot');
  if(dot) dot.className='cloud-dot'+(ok?' on':'');
}

function ensureAccountBtn(){
  if(document.getElementById('cloudAccount')) return;
  const top=document.querySelector('.topbar .top-actions') || document.querySelector('.topbar');
  if(!top) return;
  const wrap=document.createElement('div');
  wrap.id='cloudAccount';
  wrap.className='cloud-account';
  wrap.innerHTML=
    '<button type="button" class="cloud-btn" id="cloudBtn" title="\u0410\u043a\u043a\u0430\u0443\u043d\u0442">'+
    '<span id="cloudAvatar">?</span><span id="cloudDot" class="cloud-dot"></span></button>'+
    '<div class="cloud-menu" id="cloudMenu" hidden>'+
    '<div class="cloud-email" id="cloudEmail">\u041d\u0435 \u0432\u043e\u0448\u043b\u0438</div>'+
    '<div class="cloud-status" id="cloudStatus">\u2014</div>'+
    '<button type="button" class="btn btn-secondary" id="cloudSync">\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button>'+
    '<button type="button" class="btn btn-secondary" id="cloudLogin">\u0412\u043e\u0439\u0442\u0438 / \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f</button>'+
    '<button type="button" class="btn btn-ghost" id="cloudLogout">\u0412\u044b\u0439\u0442\u0438</button>'+
    '</div>';
  top.appendChild(wrap);
  document.getElementById('cloudBtn').onclick=(e)=>{
    e.stopPropagation();
    const m=document.getElementById('cloudMenu');
    m.hidden=!m.hidden;
  };
  document.addEventListener('click',()=>{
    const m=document.getElementById('cloudMenu');
    if(m) m.hidden=true;
  });
  document.getElementById('cloudMenu').onclick=e=>e.stopPropagation();
  document.getElementById('cloudSync').onclick=()=>saveToCloud(true).then(()=>toast('\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0430\u0446\u0438\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430'));
  document.getElementById('cloudLogin').onclick=()=>showAuth();
  document.getElementById('cloudLogout').onclick=async()=>{
    try{ await client().auth.signOut(); }catch(_){}
    currentUser=null; ready=false; lastSent='';
    updateAccountUI();
    setStatus(false,'\u0412\u044b\u0448\u043b\u0438');
  };
}

function updateAccountUI(){
  const email=currentUser&&currentUser.email;
  const av=document.getElementById('cloudAvatar');
  const em=document.getElementById('cloudEmail');
  if(av) av.textContent=email?email[0].toUpperCase():'?';
  if(em) em.textContent=email||'\u041d\u0435 \u0432\u043e\u0448\u043b\u0438';
  const login=document.getElementById('cloudLogin');
  const logout=document.getElementById('cloudLogout');
  if(login) login.style.display=email?'none':'block';
  if(logout) logout.style.display=email?'block':'none';
  setStatus(!!email, email?'\u0412 \u0441\u0435\u0442\u0438':'\u041e\u0444\u043b\u0430\u0439\u043d');
}

function showAuth(){
  if(document.getElementById('cloudAuth')) return;
  const root=document.createElement('div');
  root.id='cloudAuth';
  root.className='cloud-auth';
  root.innerHTML=
    '<div class="cloud-auth-card">'+
    '<h2>\u041e\u0431\u043b\u0430\u043a\u043e \u041a\u043e\u043f\u0435\u0439\u043a\u0438</h2>'+
    '<p class="faint">\u0422\u043e\u0442 \u0436\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442, \u0447\u0442\u043e \u0438 \u0432 \u041a\u043e\u043f\u0435\u0439\u043a\u0435-1. \u041f\u043e\u0441\u043b\u0435 \u0432\u0445\u043e\u0434\u0430 \u043f\u043e\u0434\u0442\u044f\u043d\u0443\u0442\u0441\u044f \u0434\u0430\u043d\u043d\u044b\u0435.</p>'+
    '<div class="field modern"><label>Email</label><input id="cEmail" type="email" autocomplete="email"></div>'+
    '<div class="field modern"><label>\u041f\u0430\u0440\u043e\u043b\u044c</label><input id="cPass" type="password" autocomplete="current-password"></div>'+
    '<div class="cloud-auth-msg" id="cMsg"></div>'+
    '<button class="btn btn-primary" id="cIn">\u0412\u043e\u0439\u0442\u0438</button>'+
    '<button class="btn btn-secondary" style="margin-top:8px" id="cUp">\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f</button>'+
    '<button class="btn btn-ghost" style="margin-top:8px" id="cX">\u0417\u0430\u043a\u0440\u044b\u0442\u044c</button>'+
    '</div>';
  document.body.appendChild(root);
  const msg=t=>{ document.getElementById('cMsg').textContent=t||''; };
  document.getElementById('cX').onclick=()=>root.remove();
  async function doAuth(signup){
    const email=document.getElementById('cEmail').value.trim();
    const password=document.getElementById('cPass').value;
    if(!email||password.length<6){ msg('Email \u0438 \u043f\u0430\u0440\u043e\u043b\u044c (\u043e\u0442 6 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432)'); return; }
    msg(signup?'\u0421\u043e\u0437\u0434\u0430\u044e\u2026':'\u0412\u0445\u043e\u0436\u0443\u2026');
    try{
      const c=client();
      const r=signup
        ? await c.auth.signUp({email,password})
        : await c.auth.signInWithPassword({email,password});
      if(r.error) throw r.error;
      if(signup && !r.data.session){ msg('\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438 email, \u043f\u043e\u0442\u043e\u043c \u0432\u043e\u0439\u0434\u0438'); return; }
      await onSession(r.data.session);
      root.remove();
    }catch(e){ msg(e.message||'\u041e\u0448\u0438\u0431\u043a\u0430'); }
  }
  document.getElementById('cIn').onclick=()=>doAuth(false);
  document.getElementById('cUp').onclick=()=>doAuth(true);
}

async function onSession(session){
  if(!session || !session.user){
    currentUser=null; ready=false; updateAccountUI(); return;
  }
  currentUser=session.user;
  updateAccountUI();
  setStatus(true,'\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430\u2026');
  await loadFromCloud();
  updateAccountUI();
}

function hookStateSaves(){
  const orig=window.saveState;
  if(typeof orig==='function' && !orig.__cloud){
    window.saveState=function(){
      const r=orig.apply(this, arguments);
      scheduleSave();
      return r;
    };
    window.saveState.__cloud=true;
  }
}

async function bootCloud(){
  try{
    await loadSDK();
    ensureAccountBtn();
    updateAccountUI();
    hookStateSaves();
    const c=client();
    const {data}=await c.auth.getSession();
    if(data && data.session) await onSession(data.session);
    c.auth.onAuthStateChange((_e, session)=>onSession(session));
  }catch(e){
    console.error('cloud boot', e);
    toast('\u041e\u0431\u043b\u0430\u043a\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e');
  }
}

window.kopeykaCloud={
  save:()=>saveToCloud(true),
  user:()=>currentUser,
  scheduleSave
};

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bootCloud);
else bootCloud();
})();
