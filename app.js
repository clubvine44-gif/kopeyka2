/* Kopeyka 2 loader */
(async function(){
  try {
    const n = 8;
    const parts = await Promise.all(
      Array.from({length:n},(_,i)=>fetch('a'+i+'.b64?v=21',{cache:'no-store'}).then(r=>{
        if(!r.ok) throw new Error('a'+i);
        return r.text();
      }))
    );
    const b64 = parts.join('').replace(/\s+/g,'');
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([bin]).stream().pipeThrough(ds);
    const code = await new Response(stream).text();
    (0, eval)(code);
  } catch (e) {
    console.error(e);
    document.body.innerHTML = '<p style="padding:24px;font-family:system-ui;color:#F2F1EC;background:#14151B">Не удалось загрузить. Обновите страницу.<br><small>'+e+'</small></p>';
  }
})();
