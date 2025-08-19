(async function(){
	const $ = (s) => document.querySelector(s);
	const tokenInput = $('#token');
	const docsUl = $('#docs');
	const titleInput = $('#title');
	const urlInput = $('#url');
	const textArea = $('#text');
	let currentId = null;

	async function api(path, opts={}){
		const headers = Object.assign({'Content-Type':'application/json','x-admin-token': tokenInput.value||''}, opts.headers||{});
		const res = await fetch('/api/admin'+path, Object.assign({}, opts, { headers }));
		if(!res.ok){ throw new Error('Request failed'); }
		return res.json();
	}

	async function loadList(){
		docsUl.innerHTML = '';
		const data = await api('/docs');
		for(const item of data.items){
			const li = document.createElement('li');
			li.textContent = (item.title||item.url||item.id);
			li.addEventListener('click', ()=>selectDoc(item.id));
			docsUl.appendChild(li);
		}
	}

	async function selectDoc(id){
		const item = await api('/docs/'+id);
		currentId = id;
		titleInput.value = item.title||'';
		urlInput.value = item.url||'';
		textArea.value = item.text||'';
	}

	async function save(){
		if(!currentId) return;
		await api('/docs/'+currentId, { method:'PUT', body: JSON.stringify({
			title: titleInput.value, url: urlInput.value, text: textArea.value
		})});
		alert('Saved');
	}

	async function rebuild(){
		await api('/rebuild', { method:'POST' });
		alert('Rebuild started');
	}

	$('#load').addEventListener('click', loadList);
	$('#save').addEventListener('click', save);
	$('#rebuild').addEventListener('click', rebuild);
})();