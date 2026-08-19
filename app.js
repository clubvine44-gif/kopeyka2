/* Kopeyka 2 bootloader */
(async function(){
  try {
    const n = 13;
    const files = Array.from({length:n},(_,i)=>"c"+i+".b64");
    const parts = await Promise.all(files.map(f => fetch(f+"?v=3",{cache:"no-store"}).then(r=>{
      if(!r.ok) throw new Error("load "+f);
      return r.text();
    })));
    const b64 = parts.join("").replace(/\s+/g,"");
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const ds = new DecompressionStream("gzip");
    const stream = new Blob([bin]).stream().pipeThrough(ds);
    const code = await new Response(stream).text();
    (0, eval)(code);
  } catch (e) {
    console.error(e);
    document.body.innerHTML = '<p style="padding:24px;font-family:system-ui">Не удалось загрузить. Обновите страницу.</p>';
  }
})();
