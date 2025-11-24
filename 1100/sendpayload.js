
// sendpayload.js
// Generic sender: fetch payload (from local cache if offline) then POST to PS4 GoldHEN BinServer.
// This script assumes payload files are cacheable (via cache.manifest) and therefore available offline.

async function send(path) {
  // basic UI feedback
  try { document.getElementById('progress').textContent = 'Fetching ' + path + ' ...'; } catch(e){}

  const ip = (localStorage.getItem('ps4ip') || '').trim();
  if(!ip) {
    const ask = prompt('Enter PS4 IP (e.g. 192.168.1.10):');
    if(!ask) return;
    localStorage.setItem('ps4ip', ask.trim());
  }

  const ps4ip = localStorage.getItem('ps4ip').trim();
  const binUrl = 'http://' + ps4ip + ':9021/sendpayload';

  try {
    // fetch payload (will be served from cache if offline available)
    const r = await fetch(path, { cache: "no-store" });
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const buf = await r.arrayBuffer();

    // send to GoldHEN BinServer
    try {
      document.getElementById('progress').textContent = 'Sending to ' + ps4ip + ' ...';
    } catch(e){}

    const sendResp = await fetch(binUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buf
    });

    if(sendResp.ok) {
      alert('Payload DIKIRIM: ' + path + '\nSize: ' + buf.byteLength + ' bytes\nCheck PS4 console.');
      try { document.getElementById('done').textContent = 'Pass = 0'; } catch(e){}
    } else {
      const text = await sendResp.text().catch(()=>sendResp.status);
      alert('Failed to send payload. Response: ' + text);
      try { document.getElementById('fail').textContent = 'Fail = 1'; } catch(e){}
    }
  } catch (err) {
    alert('Error loading/sending payload:\n' + err);
    try { document.getElementById('fail').textContent = 'Fail = 1'; } catch(e){}
  } finally {
    try{ document.getElementById('progress').textContent = 'Idle'; } catch(e){}
  }
}
