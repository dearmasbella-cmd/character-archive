const KEY = 'character-archive-v1';
const form = document.querySelector('#character-form');
const universe = document.querySelector('#universe');
const customWrap = document.querySelector('#custom-universe-wrap');
const fandomFields = document.querySelector('#fandom-fields');
const portraitInput = document.querySelector('#portrait');
const status = document.querySelector('#status');
let portraitData = '';
let editingId = null;
let characters = [];
try { const saved = JSON.parse(localStorage.getItem(KEY) || '[]'); characters = Array.isArray(saved) ? saved : []; } catch { status.textContent = 'Could not read saved characters.'; }
const extras = {
  'Wizarding World': [['house','Hogwarts house','e.g. Slytherin'],['wand','Wand','e.g. black walnut'],['patronus','Patronus','e.g. black swan']],
  'Percy Jackson': [['godlyParent','Godly parent','e.g. Athena'],['camp','Camp / cabin','e.g. Camp Half-Blood']],
  'Marvel': [['abilities','Powers / abilities','e.g. telekinesis'],['affiliation','Team / affiliation','e.g. Avengers']],
  'The Vampire Diaries': [['supernaturalType','Supernatural type','e.g. witch'],['allegiance','Allegiance','e.g. Mystic Falls']],
  'Original Universe': [['world','World name','e.g. The Hollow Kingdom'],['abilities','Powers / skills','e.g. shadow magic']],
  'Custom Fandom': [['role','Role / faction','e.g. rebel leader'],['abilities','Powers / skills','e.g. shapeshifting']]
};
const $ = id => document.getElementById(id);
function renderFields(values = {}) {
  customWrap.hidden = universe.value !== 'Custom Fandom';
  fandomFields.replaceChildren();
  for (const [key,label,placeholder] of extras[universe.value] || []) {
    const lab = document.createElement('label'); lab.htmlFor = 'extra-'+key; lab.textContent = label;
    const input = document.createElement('input'); input.id = 'extra-'+key; input.dataset.extra = key; input.maxLength = 180; input.placeholder = placeholder; input.value = values[key] || '';
    fandomFields.append(lab,input);
  }
  updatePreview();
}
function getData() {
  const extra = {};
  document.querySelectorAll('[data-extra]').forEach(el => extra[el.dataset.extra] = el.value.trim());
  return {id:editingId || crypto.randomUUID(), universe:universe.value, customUniverse:$('custom-universe').value.trim(),name:$('name').value.trim(),age:$('age').value.trim(),pronouns:$('pronouns').value.trim(),species:$('species').value.trim(),personality:$('personality').value.trim(),appearance:$('appearance').value.trim(),backstory:$('backstory').value.trim(),portrait:portraitData,extra};
}
function updatePreview() {
  const c = getData();
  $('preview-universe').textContent = (c.universe === 'Custom Fandom' ? c.customUniverse || 'Custom Fandom' : c.universe).toUpperCase();
  $('preview-name').textContent = c.name || 'Your character';
  $('preview-meta').textContent = [c.age && `Age ${c.age}`,c.pronouns,c.species].filter(Boolean).join(' · ') || 'Their story begins here.';
  $('preview-extra').textContent = Object.values(c.extra).filter(Boolean).join(' · ');
  $('preview-personality').textContent = c.personality || c.backstory || '';
  const box = $('portrait-preview'); box.replaceChildren();
  if (c.portrait) { const img = document.createElement('img'); img.src = c.portrait; img.alt = 'Character portrait'; box.append(img); }
  else box.textContent = '✧';
}
function persist() { localStorage.setItem(KEY,JSON.stringify(characters)); }
function renderLibrary() {
  const list = $('library'); list.replaceChildren(); $('count').textContent = String(characters.length);
  if (!characters.length) { const p=document.createElement('p');p.className='hint';p.textContent='No saved characters yet.';list.append(p);return; }
  characters.forEach(c => {
    const item=document.createElement('div');item.className='library-item';
    const name=document.createElement('span');name.textContent=c.name || 'Unnamed';
    const edit=document.createElement('button');edit.className='secondary';edit.textContent='Edit';edit.addEventListener('click',()=>loadCharacter(c.id));
    const del=document.createElement('button');del.className='secondary';del.textContent='Delete';del.addEventListener('click',()=>{if(confirm(`Delete ${c.name}?`)){characters=characters.filter(x=>x.id!==c.id);try{persist();renderLibrary();if(editingId===c.id)resetForm();}catch{status.textContent='Unable to update browser storage.';}}});
    item.append(name,edit,del);list.append(item);
  });
}
function resetForm(){form.reset();editingId=null;portraitData='';renderFields();status.textContent='Ready for a new character.';}
function loadCharacter(id){const c=characters.find(x=>x.id===id);if(!c)return;editingId=c.id;universe.value=c.universe;$('custom-universe').value=c.customUniverse||'';for(const key of ['name','age','pronouns','species','personality','appearance','backstory']) $(key).value=c[key]||'';portraitData=c.portrait||'';portraitInput.value='';renderFields(c.extra||{});status.textContent=`Editing ${c.name}`;window.scrollTo({top:0,behavior:'smooth'});}
universe.addEventListener('change',()=>renderFields());
form.addEventListener('input',updatePreview);
portraitInput.addEventListener('change',()=>{const file=portraitInput.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1024*1024){status.textContent='Choose a PNG, JPEG, or WebP image under 1 MB.';portraitInput.value='';return;}const reader=new FileReader();reader.onload=()=>{portraitData=String(reader.result);updatePreview();};reader.readAsDataURL(file);});
form.addEventListener('submit',e=>{e.preventDefault();const c=getData();if(!c.name){status.textContent='Please enter a character name.';return;}if(c.universe==='Custom Fandom'&&!c.customUniverse){status.textContent='Please enter a fandom or universe name.';return;}const index=characters.findIndex(x=>x.id===c.id);if(index>=0)characters[index]=c;else characters.unshift(c);try{persist();editingId=c.id;renderLibrary();status.textContent=`Saved ${c.name}!`;}catch{status.textContent='Browser storage is full or unavailable. Try a smaller portrait or download your profile.';}});
$('new-character').addEventListener('click',resetForm);
$('export-character').addEventListener('click',()=>{const c=getData();if(!c.name){status.textContent='Enter a name before downloading.';return;}const blob=new Blob([JSON.stringify(c,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(c.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'character')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Profile downloaded.';});
renderFields();renderLibrary();
