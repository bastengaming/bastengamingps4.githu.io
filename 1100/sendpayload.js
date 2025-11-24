
// sendpayload.js
// Sender + hidden auto-detect helper for PS4 GoldHEN BinServer (port 9021).
// - tryDetectPS4() returns first responsive IP or null
// - send(path) fetches payload (from cache if offline) and POSTs to PS4

// small helper: fetch with timeout
function fetchWithTimeout(url, opts = {}, ms = 800) {
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), ms);
  const finalOpts = Object.assign({}, opts, { signal: controller.signal });
  return fetch(url, finalOpts).finally(()=>clearTimeout(id));
}

// Try a limited set of common IP patterns to avoid heavy scanning.
// Returns first IP that responds to http://IP:9021/ping or null.
async function tryDetectPS4() {
  const candidates = [];

  // common local subnets & ranges (small window)
  ['192.168.1.', '192.168.0.', '10.0.0.'].forEach(prefix=>{
    // try .10 .. .20 (covers most PS4 default DHCP assignments)
    for(let i=10;i<=20;i++) candidates.push(prefix + i);
  });

  // Also try some common single-host guesses
  candidates.push('192.168.1.100','192.168.1.11','192.168.0.100');

  for(const ip of candidates) {
    try {
      // try minimal fetch to /ping (no-cors may not throw, so we rely on timeout)
      // use http protocol; goldhen's BinServer normally answers without CORS on PS4.
      await fetchWithTimeout('http://' + ip + ':9021/ping', { mode: 'no-cors' }, 700);
      // If fetch does not throw (or was not aborted) we assume reachable
      return ip;
    } catch(e){
      // ignore and continue
    }
  }
  return null;
}

// Exposed send function used by index.html buttons
async function send(path) {
  try { document.getElementById('progress-visible').textContent = 'Fetching ' + path + ' ...'; } catch(e){}
  let ip = (localStorage.getItem('ps4ip') || '').trim();

  // if no saved IP, try auto-detect now (blocking fallback)
  if(!ip) {
    try { document.getElementById('progress-visible').textContent = 'Auto-detecting PS4...'; } catch(e){}
    ip = await tryDetectPS4();
    if(ip) {
      localStorage.setItem('ps4ip', ip);
      try { document.getElementById('progress-visible').textContent = 'PS4 detected: ' + ip; } catch(e){}
    } else {
      // fallback prompt
      const ask = prompt('Masukkan IP PS4 (misal 192.168.1.10):');
      if(!ask) {
        alert('Tidak ada IP. Batal.');
        try { document.getElementById('progress-visible').textContent = 'Idle'; } catch(e){}
        return;
      }
      ip = ask.trim();
      localStorage.setItem('ps4ip', ip);
    }
  }

  const binUrl = 'http://' + ip + ':9021/sendpayload';

  try {
    // fetch payload (from cache if offline)
    const r = await fetch(path, { cache: "no-store" });
    if(!r.ok) throw new Error('HTTP ' + r.status);
    const buf = await r.arrayBuffer();

    try { document.getElementById('progress-visible').textContent = 'Sending to ' + ip + ' ...'; } catch(e){}

    // send to GoldHEN BinServer
    const sendResp = await fetch(binUrl, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buf
    });

    if(sendResp.ok) {
      alert('Payload DIKIRIM: ' + path + '\nSize: ' + buf.byteLength + ' bytes\nPeriksa PS4.');
      try { document.getElementById('done').textContent = 'Pass = 0'; } catch(e){}
    } else {
      const text = await sendResp.text().catch(()=>sendResp.status);
      alert('Gagal kirim payload. Response: ' + text);
      try { document.getElementById('fail').textContent = 'Fail = 1'; } catch(e){}
    }
  } catch (err) {
    alert('Error saat load/kirim payload:\n' + err);
    try { document.getElementById('fail').textContent = 'Fail = 1'; } catch(e){}
  } finally {
    try{ document.getElementById('progress-visible').textContent = 'Idle'; } catch(e){}
  }
}

