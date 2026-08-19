/* Kopeyka 2 bootloader */
(async function(){
  try {
    const files = ["c0.b64","c1.b64","c2.b64","c3.b64","c4.b64","c5.b64","c6.b64","c7.b64","c8.b64","c9.b64","c10.b64","c11.b64","c12.b64"];
    const parts = await Promise.all(files.map(f => fetch(f+"?v=2",{cache:"no-store"}).then(r=>{
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
    document.body.innerHTML = '<p style="padding:24px;font-family:system-ui">Не удалось загрузить приложение.</p>';
  }
})();
