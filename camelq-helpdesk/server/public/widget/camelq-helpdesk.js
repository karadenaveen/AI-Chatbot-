(function(){
  const apiBase = (document.currentScript && document.currentScript.dataset.apiBase) || '';

  function el(tag, cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }
  function scrollToBottom(node){ node.scrollTop = node.scrollHeight; }

  const btn = el('button','camelq-button'); btn.textContent='Chat with CamelQ'; document.body.appendChild(btn);

  const win = el('div','camelq-window'); win.style.display='none';
  const header = el('div','camelq-header'); header.textContent='CamelQ Helpdesk';
  const close = el('button','camelq-close'); close.textContent='×'; header.appendChild(close);
  const messages = el('div','camelq-messages');
  const input = el('div','camelq-input');
  const textarea = el('textarea'); textarea.placeholder='Type your question...';
  const send = el('button'); send.textContent='Send';
  input.appendChild(textarea); input.appendChild(send);
  win.appendChild(header); win.appendChild(messages); win.appendChild(input);
  document.body.appendChild(win);

  let sessionId = null; let sending = false;

  function addMessage(role, text){
    const m = el('div', 'camelq-msg ' + (role==='user'?'camelq-msg-user':'camelq-msg-assistant'));
    m.textContent = text; messages.appendChild(m); scrollToBottom(messages);
  }

  async function sendMessage(){
    if (sending) return;
    const text = textarea.value.trim(); if(!text) return;
    textarea.value=''; addMessage('user', text); sending=true;
    try{
      const res = await fetch(apiBase + '/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ sessionId, message: text })
      });
      const data = await res.json();
      if(data.sessionId) sessionId = data.sessionId;
      addMessage('assistant', data.reply || 'Sorry, I had trouble responding.');
    }catch(e){ addMessage('assistant','Network error.'); }
    finally{ sending=false; }
  }

  btn.addEventListener('click', ()=>{ win.style.display= win.style.display==='none'?'flex':'none'; });
  close.addEventListener('click', ()=>{ win.style.display='none'; });
  send.addEventListener('click', sendMessage);
  textarea.addEventListener('keydown', (e)=>{ if(e.key==='Enter'&& !e.shiftKey){ e.preventDefault(); sendMessage(); }});
})();