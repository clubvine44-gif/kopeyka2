(async function(){
  try{
    const n=4;
    const parts=await Promise.all(
      Array.from({length:n},(_,i)=>fetch('b'+i+'.b64?v=40',{cache:'no-store'}).then(r=>{
        if(!r.ok) throw new Error('b'+i+' '+r.status);
        return r.text();
      }))
    );
    const b64=parts.join('').replace(/\s+/g,'');
    const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    const code=new TextDecoder().decode(bin);
    (0,eval)(code);
  }catch(e){
    console.error(e);
    document.body.innerHTML='<p style="padding:24px;font-family:system-ui;color:#F2F1EC;background:#14151B">Не удалось загрузить. Обновите страницу.<br><small>'+String(e)+'</small></p>';
  }
})();
