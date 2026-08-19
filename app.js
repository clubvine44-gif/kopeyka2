(async function(){
  try{
    const n=6;
    const parts=await Promise.all(
      Array.from({length:n},(_,i)=>fetch('p'+i+'.js?v=92',{cache:'no-store'}).then(r=>{
        if(!r.ok) throw new Error('p'+i+' '+r.status);
        return r.text();
      }))
    );
    (0,eval)(parts.join(''));
  }catch(e){
    console.error(e);
    document.body.innerHTML='<p style="padding:24px;font-family:system-ui;color:#F2F1EC;background:#14151B">Не удалось загрузить. Обновите страницу.<br><small>'+String(e)+'</small></p>';
  }
})();
