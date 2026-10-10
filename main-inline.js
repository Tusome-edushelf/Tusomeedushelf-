
// v103 API burst protection + universal API response guard: never let an HTML error page surface as
// the misleading browser error `Unexpected token '<' ... is not valid JSON`.
async function parseApiResponse(response){
  const raw=await response.text();
  const text=String(raw||'').trim();
  const status=Number(response?.status||0);
  if(status===429){
    const retryAfter=response?.headers?.get?.('Retry-After');
    const wait=retryAfter?` Please wait ${retryAfter} seconds and try again.`:' Please wait a moment and try again.';
    throw new Error(`The server is temporarily rate-limiting requests (429).${wait}`);
  }
  if(!text)return {};
  try{return JSON.parse(text)}catch(err){
    const isHtml=/^<!doctype\b|^<html[\s>]/i.test(text);
    if(isHtml)throw new Error(`The server returned an HTML page${status?` (${status})`:''} instead of a JSON API response. Please redeploy index.html and server.mjs together, then refresh the page.`);
    throw new Error(`The server returned an invalid API response${status?` (${status})`:''}. Please refresh the page or redeploy the matching application files.`);
  }
}
function escapeHtml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function showToast(message,type='info',duration=4200){const region=document.getElementById('tusomeToastRegion');if(!region)return;const msg=String(message||'');const now=Date.now();if(window.__lastToast && window.__lastToast.message===msg && window.__lastToast.type===type && now-window.__lastToast.at<3500)return;window.__lastToast={message:msg,type,at:now};const item=document.createElement('div');item.className='tusome-toast '+type;item.setAttribute('role',type==='error'?'alert':'status');const close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Dismiss message');close.textContent='×';const text=document.createElement('span');text.textContent=msg;item.append(close,text);region.appendChild(item);const timer=setTimeout(()=>item.remove(),duration);close.addEventListener('click',()=>{clearTimeout(timer);item.remove()})}
function friendlyError(error,fallback='Something went wrong. Please try again.'){const msg=String(error?.message||error||'').trim();return msg||fallback}

const key='edushelfMaterials';
const curriculumSubjects=['Mathematics','English','Kiswahili','Integrated Science','Biology','Chemistry','Physics','Agriculture','Social Studies','Pre-Technical Studies','Creative Arts & Sports','Business Studies','Geography','History & Citizenship','Computer Studies','ICT','Home Science'];
let materials=JSON.parse(localStorage.getItem(key)||'null')||[
 {id:1,title:'Linear Functions Notes',subject:'Mathematics',grade:'Grade 8',topic:'Linear Functions',file:'linear-functions.pdf',approvalStatus:'approved',price:0},
 {id:2,title:'Magnification Revision',subject:'Biology',grade:'Grade 8',topic:'Magnification',file:'magnification.pdf',approvalStatus:'approved',price:0},
 {id:3,title:'Grammar Revision Notes',subject:'English',grade:'Grade 8',topic:'Grammar',file:'grammar.pdf',approvalStatus:'approved',price:0}
];
function save(){localStorage.setItem(key,JSON.stringify(materials))}
function logActivity(action){let logs=JSON.parse(localStorage.getItem('edushelfActivity')||'[]');logs.unshift({action,time:new Date().toLocaleString()});localStorage.setItem('edushelfActivity',JSON.stringify(logs.slice(0,50)))}
function logNotification(message){let n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]');n.unshift({message,time:new Date().toLocaleString(),read:false});localStorage.setItem('edushelfNotifications',JSON.stringify(n.slice(0,30)));renderNotifications()}
async function renderNotifications(){const box=document.getElementById('notificationList');if(!box)return;try{const res=await fetch('/api/notifications?limit=50',{credentials:'include'});if(!res.ok)throw new Error('server notifications unavailable');const data=await parseApiResponse(res);const n=data.notifications||[];const badge=document.getElementById('notificationUnreadBadge');if(badge){badge.textContent=`${data.unread||0} unread`;badge.style.display=data.unread?'inline-block':'none'}box.innerHTML=n.length?n.map(x=>`<div class="material" style="border-left:4px solid ${x.type==='success'?'#2e7d32':x.type==='warning'?'#f59e0b':x.type==='review'?'#2563eb':'#64748b'}"><div><b>${x.readAt?'':'🔵 '}${escapeHtml(x.title)}</b><p style="margin:5px 0">${escapeHtml(x.message)}</p><small>${new Date(x.createdAt).toLocaleString()}</small>${x.readAt?'':' <button class="btn" style="margin-left:8px" onclick="markNotificationRead('+x.id+')">Mark read</button>'}</div></div>`).join(''):'<p>No notifications yet.</p>'}catch(e){const n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]');box.innerHTML=n.length?n.map(x=>`<div class="material"><div><b>${x.read?'':'🔵 '}${escapeHtml(x.message)}</b><br><small>${escapeHtml(x.time)}</small></div></div>`).join(''):'<p>No notifications yet.</p>'}}
async function markNotificationRead(id){try{await fetch('/api/notifications/'+id+'/read',{method:'PATCH',credentials:'include'});}catch{}renderNotifications()}
async function markNotificationsRead(){try{await fetch('/api/notifications/read-all',{method:'PATCH',credentials:'include'});}catch{}let n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]').map(x=>({...x,read:true}));localStorage.setItem('edushelfNotifications',JSON.stringify(n));renderNotifications()}
async function refreshNotificationBadge(){try{const res=await fetch('/api/notifications?limit=1',{credentials:'include'});if(res.ok){const d=await parseApiResponse(res);const count=Number(d.unread||0);const badge=document.getElementById('notificationUnreadBadge');if(badge){badge.textContent=`${count} unread`;badge.style.display=count?'inline-block':'none'}const nav=document.getElementById('notificationNavCount');if(nav){nav.textContent=count>99?'99+':String(count);nav.style.display=count?'inline-block':'none';nav.setAttribute('aria-label',`${count} unread notifications`)}}}catch{}}
const DB_NAME='edushelfFilesDB';const DB_STORE='files';
function openFileDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function saveUploadedFile(id,file){const db=await openFileDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put({blob:file,type:file.type,name:file.name},id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function getUploadedFile(id){const db=await openFileDB();return new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readonly');const req=tx.objectStore(DB_STORE).get(id);req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)}})}
async function deleteUploadedFile(id){if(!id)return;try{const db=await openFileDB();await new Promise((resolve,reject)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close()}catch(e){console.warn('Could not delete stored file',e)}}
function materialKey(){return 'file_'+Date.now()+'_'+Math.random().toString(36).slice(2)}
async function upload(e){
  e.preventDefault();
  const form=e.target, button=form.querySelector('button[type="submit"]');
  const fileEl=document.getElementById('file');
  const file=fileEl?.files?.[0];
  if(!file){alert('Please select a PDF or supported document.');return}
  if(file.size>12*1024*1024){alert('Please keep each learning material below 12 MB.');return}
  const allowed=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'];
  if(file.type && !allowed.includes(file.type)){alert('Please upload a PDF, DOC, DOCX, PPT, or PPTX file.');return}
  const toDataUrl=()=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the selected file.'));reader.readAsDataURL(file)});
  button.disabled=true;button.textContent='Uploading...';
  try{
    const data=await toDataUrl();
    const payload={title:document.getElementById('title').value.trim(),subject:document.getElementById('subject').value,grade:document.getElementById('grade').value,strand:document.getElementById('strand').value.trim(),competency:document.getElementById('competency').value,topic:document.getElementById('topic').value.trim(),price:Number(document.getElementById('price').value||0),description:document.getElementById('desc').value.trim(),file:{name:file.name,data,mimeType:file.type||'application/octet-stream'}};
    const r=await fetch('/api/materials',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)});
    const raw=await r.text(); let d={}; try{d=JSON.parse(raw)}catch{}
    if(!r.ok)throw new Error(d.error||'The material could not be uploaded.');
    await loadServerMaterials(); renderTeacher();
    logActivity('Uploaded learning material: '+payload.title); logNotification('Material uploaded and sent for admin review: '+payload.title);
    form.reset(); show('teacher'); alert('Material uploaded successfully and sent for admin review.');
  }catch(err){alert(err.message||'Upload failed. Please try again.')}
  finally{button.disabled=false;button.textContent='Upload Material'}
}

let serverPurchases=[];
function getPurchases(){return serverPurchases.length?serverPurchases:JSON.parse(localStorage.getItem('tusomePurchases')||'[]')}
function savePurchases(p){serverPurchases=p;localStorage.setItem('tusomePurchases',JSON.stringify(p))}
function isPurchased(id){return serverPurchases.some(x=>String(x.materialId)===String(id)) || getPurchases().some(x=>String(x.materialId)===String(id)&&x.status==='paid')}
async function loadServerPurchases(){try{const r=await fetch('/api/payments/my',{credentials:'include'});if(!r.ok)return false;const d=await parseApiResponse(r);serverPurchases=Array.isArray(d.purchases)?d.purchases:[];localStorage.setItem('tusomePurchases',JSON.stringify(serverPurchases.map(x=>({id:x.transactionId,materialId:x.materialId,amount:Number(x.amount||0),status:'paid',mpesaReceipt:x.mpesaReceipt||'',time:x.createdAt||''}))));return true}catch(e){console.warn('Could not load purchases',e);return false}}
function materialPrice(m){return Number(m.price||0)}
function populateMaterialFilters(){
  const gradeValues=[...new Set(materials.map(m=>m.grade).filter(Boolean))].sort((a,b)=>{const na=parseInt(String(a).match(/\d+/)?.[0]||0),nb=parseInt(String(b).match(/\d+/)?.[0]||0);return na-nb||String(a).localeCompare(String(b))});
  const sets={subjectFilter:[...new Set(materials.map(m=>m.subject).filter(Boolean))].sort(),gradeFilter:gradeValues,topicFilter:[...new Set(materials.map(m=>m.topic).filter(Boolean))].sort(),strandFilter:[...new Set(materials.map(m=>m.strand).filter(Boolean))].sort(),fileTypeFilter:[...new Set(materials.map(m=>m.fileType||m.file).filter(Boolean).map(x=>{const v=String(x);return v.includes('/')?v.split('/').pop().toUpperCase():v.split('.').pop().toUpperCase()}))].sort()};
  const labels={subjectFilter:'All subjects',gradeFilter:'All grades',topicFilter:'All topics',strandFilter:'All strands',fileTypeFilter:'All file types'};
  Object.entries(sets).forEach(([id,values])=>{const el=document.getElementById(id);if(!el)return;const current=el.value;el.innerHTML='<option value="">'+labels[id]+'</option>'+values.map(v=>`<option value="${String(v).replace(/"/g,'&quot;')}">${escHtml(v)}</option>`).join('');if(values.includes(current))el.value=current});
}

let learnerActivity={};
async function loadLearnerActivity(){if(getSessionRole()!=='learner')return;try{const r=await fetch('/api/learner/activity',{credentials:'include'});if(!r.ok)return;const d=await parseApiResponse(r);learnerActivity={};(d.activity||[]).forEach(x=>learnerActivity[String(x.materialId)]=x);renderLearnerSaved()}catch(e){console.warn('Could not load learner activity',e)}}
async function toggleBookmark(materialId){const current=!!learnerActivity[String(materialId)]?.bookmarked;try{const r=await fetch('/api/learner/materials/'+encodeURIComponent(materialId)+'/bookmark',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({bookmarked:!current})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save material.');learnerActivity[String(materialId)]={...(learnerActivity[String(materialId)]||{}),bookmarked:d.bookmarked};renderMaterials();renderLearnerSaved();logNotification(d.bookmarked?'Material saved to your bookmarks.':'Material removed from your bookmarks.');showToast(d.bookmarked?'Material saved to your bookmarks.':'Material removed from your bookmarks.','success')}catch(e){alert(e.message)}}
async function recordMaterialView(materialId){try{await fetch('/api/learner/materials/'+encodeURIComponent(materialId)+'/view',{method:'POST',credentials:'include'})}catch(e){console.warn('Could not record material progress',e)}learnerActivity[String(materialId)]={...(learnerActivity[String(materialId)]||{}),viewCount:Number(learnerActivity[String(materialId)]?.viewCount||0)+1,lastViewedAt:new Date().toISOString()};renderLearnerSaved()}
function renderLearnerSaved(){const saved=document.getElementById('bookmarkedMaterials'),cont=document.getElementById('continueLearning');if(!saved||!cont)return;const entries=Object.entries(learnerActivity).filter(([,x])=>x.bookmarked).map(([id])=>materials.find(m=>String(m.id)===id)).filter(Boolean);saved.innerHTML=entries.length?entries.slice(0,6).map(m=>`<div style="display:flex;justify-content:space-between;gap:8px;margin:8px 0"><span>${escHtml(m.title)}</span><button class="btn" onclick="handleMaterialButton('${String(m.id).replace(/'/g,"\\'")}')">Open</button></div>`).join(''):'<p>No saved materials yet. Use 🔖 Save on a material.</p>';const recent=Object.entries(learnerActivity).filter(([,x])=>x.lastViewedAt).sort((a,b)=>new Date(b[1].lastViewedAt)-new Date(a[1].lastViewedAt))[0];const m=recent?materials.find(x=>String(x.id)===recent[0]):null;cont.innerHTML=m?`<div><b>${escHtml(m.title)}</b><p><small>${escHtml(m.subject||'General')} • ${escHtml(m.grade||'')}</small></p><button class="btn primary" onclick="handleMaterialButton('${String(m.id).replace(/'/g,"\\'")}')">Continue</button></div>`:'<p>Open a material to start building your learning history.</p>'}

function renderMaterials(list=materials.filter(m=>(m.approvalStatus||'approved')==='approved')){const box=document.getElementById('materials');if(!box)return;const count=document.getElementById('materialResultCount');if(count)count.textContent=`Showing ${list.length} of ${materials.length} material${materials.length===1?'':'s'}`;box.innerHTML=list.length?list.map(m=>{const paid=isPurchased(m.id),price=materialPrice(m),saved=!!learnerActivity[String(m.id)]?.bookmarked,id=String(m.id).replace(/'/g,"\\'");return `<div class="material"><div style="min-width:0"><b>${escHtml(m.title||'Untitled material')}</b><br><span class="tag">${escHtml(m.subject||'General')}</span> <span class="tag">${escHtml(m.grade||'All grades')}</span> <span class="tag">${price>0?'KES '+price:'FREE'}</span> <small>${escHtml(m.topic||'')}</small><br><small>📎 ${escHtml(m.file||'Uploaded material')}</small></div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end"><button class="btn" type="button" onclick="toggleBookmark('${id}')" aria-label="${saved?'Remove bookmark':'Save material'}">${saved?'🔖 Saved':'🔖 Save'}</button><button class="btn primary" type="button" onclick="handleMaterialButton('${id}')">${price===0||paid?'Open':'Buy'}</button></div></div>`}).join(''):'<div class="notice">No materials match your search. Try a different keyword or reset the filters.</div>';renderLearnerSaved()}

function handleMaterialButton(materialId){const m=materials.find(x=>String(x.id)===String(materialId));if(!m){alert('Material not found. Please refresh the learner dashboard.');return}if(materialPrice(m)>0&&!isPurchased(m.id)){showPaymentForMaterial(m);return}openMaterial(materials.indexOf(m))}
function filterMaterials(){
  const q=(document.getElementById('search')?.value||'').trim().toLowerCase(),subject=document.getElementById('subjectFilter')?.value||'',grade=document.getElementById('gradeFilter')?.value||'',topic=document.getElementById('topicFilter')?.value||'',strand=document.getElementById('strandFilter')?.value||'',fileType=document.getElementById('fileTypeFilter')?.value||'',priceFilter=document.getElementById('priceFilter')?.value||'',savedFilter=document.getElementById('savedFilter')?.value||'',sort=document.getElementById('materialSort')?.value||'newest';
  let list=materials.filter(m=>(m.approvalStatus||'approved')==='approved').filter(m=>{
    const text=[m.title,m.subject,m.grade,m.topic,m.strand,m.competency,m.description,m.file].filter(Boolean).join(' ').toLowerCase();
    const type=String(m.fileType||m.file||'').includes('/')?String(m.fileType||m.file).split('/').pop().toUpperCase():String(m.fileType||m.file||'').split('.').pop().toUpperCase();
    const saved=!!learnerActivity[String(m.id)]?.bookmarked, opened=!!learnerActivity[String(m.id)]?.lastViewedAt, price=materialPrice(m);
    return (!q||text.includes(q))&&(!subject||m.subject===subject)&&(!grade||m.grade===grade)&&(!topic||m.topic===topic)&&(!strand||m.strand===strand)&&(!fileType||type===fileType)&&(!priceFilter||(priceFilter==='free'?price===0:price>0))&&(!savedFilter||(savedFilter==='saved'?saved:!opened));
  });
  if(sort==='az')list.sort((a,b)=>(a.title||'').localeCompare(b.title||''));else if(sort==='priceLow')list.sort((a,b)=>materialPrice(a)-materialPrice(b));else if(sort==='priceHigh')list.sort((a,b)=>materialPrice(b)-materialPrice(a));else list.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)||(Number(b.id)||0)-(Number(a.id)||0));
  renderMaterials(list);
}

function resetMaterialFilters(){['search','subjectFilter','gradeFilter','topicFilter','strandFilter','fileTypeFilter','priceFilter','savedFilter'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});const sort=document.getElementById('materialSort');if(sort)sort.value='newest';filterMaterials()}
async function openMaterial(i){const m=materials[i];if(!m)return;const price=materialPrice(m);if(price>0&&!isPurchased(m.id)){showPaymentForMaterial(m);return}localStorage.setItem('tusomeViews',String(Number(localStorage.getItem('tusomeViews')||0)+1));await recordMaterialView(m.id);logActivity('Viewed material: '+m.title);logNotification('Opened learning material: '+m.title);refreshProgress();openMaterialReader(m)}
let activeReaderMaterialId=null;
function openMaterialReader(m){if(!m)return;activeReaderMaterialId=String(m.id);const url='/api/materials/'+encodeURIComponent(m.id)+'/file';const title=document.getElementById('readerTitle'),meta=document.getElementById('readerMeta'),frame=document.getElementById('readerFrame'),loading=document.getElementById('readerLoading'),download=document.getElementById('readerDownload'),save=document.getElementById('readerBookmarkBtn');if(title)title.textContent=m.title||'Learning material';if(meta)meta.textContent=[m.subject||'General',m.grade||'All grades',m.topic||''].filter(Boolean).join(' • ');if(download){download.href=url;download.setAttribute('download',m.file||'learning-material');download.setAttribute('aria-label','Download '+(m.title||'learning material'))}if(save){const saved=!!learnerActivity[String(m.id)]?.bookmarked;save.textContent=saved?'🔖 Saved':'🔖 Save';save.setAttribute('aria-label',saved?'Remove bookmark':'Save material')}if(frame){frame.style.display='none';frame.src='';frame.onload=()=>{if(loading)loading.style.display='none';frame.style.display='block'};frame.onerror=()=>{if(loading)loading.innerHTML='<div class="reader-error"><b>This file could not be displayed here.</b><p>Use the Download button above to open the material.</p></div>';frame.style.display='none'};frame.src=url}if(loading)loading.innerHTML='Loading your material…';loadReaderAnnotations();loadMaterialReviews(m.id);const note=document.getElementById('readerNoteText');if(note)note.value='';setReaderNoteStatus('');show('reader')}
async function readerBookmark(){if(!activeReaderMaterialId)return;await toggleBookmark(activeReaderMaterialId);const save=document.getElementById('readerBookmarkBtn');if(save){const saved=!!learnerActivity[String(activeReaderMaterialId)]?.bookmarked;save.textContent=saved?'🔖 Saved':'🔖 Save'}}
function readerNotesKey(){return 'tusomeReaderNotes:'+String(activeReaderMaterialId||'')}
function readerHighlightsKey(){return 'tusomeReaderHighlights:'+String(activeReaderMaterialId||'')}
function loadReaderAnnotations(){const notes=JSON.parse(localStorage.getItem(readerNotesKey())||'[]');const highlights=JSON.parse(localStorage.getItem(readerHighlightsKey())||'[]');const nl=document.getElementById('readerNotesList');const hl=document.getElementById('readerHighlightList');if(nl){nl.innerHTML=notes.length?notes.map((n,i)=>`<div class="note-item"><div class="note-item-head"><b>Note ${i+1}</b><span class="note-time">${new Date(n.createdAt).toLocaleString()}</span></div><div style="white-space:pre-wrap;margin-top:7px">${escapeHtml(n.text)}</div><div class="note-actions"><button class="btn" type="button" onclick="deleteReaderNote(${i})">Delete</button></div></div>`).join(''):'<div class="notes-empty">No notes yet. Add your first study note.</div>'}if(hl){hl.innerHTML=highlights.length?highlights.map((h,i)=>`<div class="highlight-item"><div style="white-space:pre-wrap">${escapeHtml(h.text)}</div><div class="note-actions"><button class="btn" type="button" onclick="deleteReaderHighlight(${i})">Delete</button></div></div>`).join(''):'<div class="notes-empty">No highlights yet.</div>'}}
function saveReaderNote(){if(!activeReaderMaterialId)return;const el=document.getElementById('readerNoteText');const text=(el?.value||'').trim();if(!text){setReaderNoteStatus('Write a note first.');return}const notes=JSON.parse(localStorage.getItem(readerNotesKey())||'[]');notes.unshift({text,createdAt:new Date().toISOString()});localStorage.setItem(readerNotesKey(),JSON.stringify(notes.slice(0,50)));if(el)el.value='';loadReaderAnnotations();setReaderNoteStatus('Note saved.')}
function clearReaderNote(){const el=document.getElementById('readerNoteText');if(el)el.value='';setReaderNoteStatus('')}
function setReaderNoteStatus(msg){const el=document.getElementById('readerNoteStatus');if(el)el.textContent=msg}
function deleteReaderNote(i){const notes=JSON.parse(localStorage.getItem(readerNotesKey())||'[]');notes.splice(i,1);localStorage.setItem(readerNotesKey(),JSON.stringify(notes));loadReaderAnnotations();setReaderNoteStatus('Note deleted.')}
function saveReaderHighlight(){if(!activeReaderMaterialId)return;const el=document.getElementById('readerNoteText');const text=(el?.value||'').trim();if(!text){setReaderNoteStatus('Write the point to highlight in the note box first.');return}const highlights=JSON.parse(localStorage.getItem(readerHighlightsKey())||'[]');highlights.unshift({text,createdAt:new Date().toISOString()});localStorage.setItem(readerHighlightsKey(),JSON.stringify(highlights.slice(0,30)));if(el)el.value='';loadReaderAnnotations();setReaderNoteStatus('Highlight saved.')}
function deleteReaderHighlight(i){const highlights=JSON.parse(localStorage.getItem(readerHighlightsKey())||'[]');highlights.splice(i,1);localStorage.setItem(readerHighlightsKey(),JSON.stringify(highlights));loadReaderAnnotations();setReaderNoteStatus('Highlight deleted.')}
function showPaymentForMaterial(m){
  const box=document.getElementById('paymentMaterial');
  if(!box){alert('Payment section is unavailable. Please refresh the page.');return;}
  const price=materialPrice(m);
  box.innerHTML=`<h3>Purchase: ${escHtml(m.title||'Learning material')}</h3>
    <p>Price: <b>KES ${price}</b></p>
    <p>Enter the learner's M-PESA number to start the Daraja sandbox STK Push.</p>
    <label for="payPhone">M-PESA phone number</label>
    <input id="payPhone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="07XXXXXXXX" maxlength="13">
    <button class="btn primary" type="button" onclick="startDarajaPayment('${String(m.id).replace(/'/g,"\\'")}')">📲 Pay with M-PESA</button>
    <button class="btn" type="button" onclick="navigateBack('learner')">← Back</button>`;
  show('payments');
  setTimeout(()=>document.getElementById('payPhone')?.focus(),50);
}
async function startDarajaPayment(materialId){
  const m=materials.find(x=>String(x.id)===String(materialId));
  if(!m){alert('Material not found. Please refresh the learner dashboard.');return;}
  const phone=(document.getElementById('payPhone')?.value||'').trim();
  if(!/^(\+?254|0)7\d{8}$/.test(phone)){
    alert('Enter a valid Kenyan mobile number, for example 07XXXXXXXX.');
    return;
  }
  const button=document.querySelector('#paymentMaterial button.primary');
  if(button){button.disabled=true;button.textContent='⏳ Starting M-PESA...';}
  try{
    const r=await fetch('/api/payments/stkpush',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({materialId:m.id,phone})
    });
    const raw=await r.text();
    let data={};try{data=JSON.parse(raw)}catch{}
    if(!r.ok)throw new Error(data.error||'Unable to start the M-PESA payment.');
    alert(data.message||'STK Push sent. Check the phone for the M-PESA prompt.');
    if(data.checkoutRequestId)pollPayment(data.checkoutRequestId,m);
  }catch(err){
    alert(err.message||'Unable to start the M-PESA payment.');
  }finally{
    if(button){button.disabled=false;button.textContent='📲 Pay with M-PESA';}
  }
}
async function pollPayment(checkoutRequestId,m){
  let attempts=0;
  const timer=setInterval(async()=>{
    attempts++;
    try{
      const r=await fetch('/api/payments/status/'+encodeURIComponent(checkoutRequestId));
      const data=await parseApiResponse(r);
      if(data.status==='paid'){
        clearInterval(timer);
        await loadServerPurchases();
        const platformRate=Number(localStorage.getItem('tusomePlatformRate')||10);
        const price=Number(m.price||0);
        const teacherShare=Math.round(price*(100-platformRate))/100;
        const p={id:data.transactionId||('TX'+Date.now()),materialId:m.id,title:m.title,amount:price,phone:data.phone||'',status:'paid',teacherShare,platformShare:Math.round(price*platformRate)/100,time:new Date().toLocaleString(),mpesaReceipt:data.mpesaReceipt||''};
        const purchases=getPurchases();
        if(!purchases.some(x=>String(x.id)===String(p.id))){
          purchases.unshift(p);savePurchases(purchases);
          localStorage.setItem('tusomeRevenue',String(Number(localStorage.getItem('tusomeRevenue')||0)+p.platformShare));
          localStorage.setItem('tusomeTeacherEarnings',String(Number(localStorage.getItem('tusomeTeacherEarnings')||0)+p.teacherShare));
        }
        logActivity('M-PESA payment confirmed: '+m.title+' • KES '+price);
        logNotification('Payment confirmed. You can now open: '+m.title);
        renderMaterials();renderPayments();show('learner');
        showToast?.('Payment confirmed. The material is now unlocked. Opening it now.','success');
        setTimeout(()=>openMaterial(materials.findIndex(x=>String(x.id)===String(m.id))),120);
      }else if(data.status==='failed'){
        clearInterval(timer);
        alert(data.resultDescription||'The M-PESA payment was not completed.');
      }
    }catch(e){}
    if(attempts>=30)clearInterval(timer);
  },4000);
}
function renderPayments(){const ps=getPurchases(),box=document.getElementById('purchaseList');if(box)box.innerHTML=ps.length?ps.map(p=>`<div class="material"><div><b>${p.title}</b><br><small>${p.time} • ${p.status.toUpperCase()} • KES ${p.amount}</small></div><span class="tag">Teacher KES ${p.teacherShare}</span></div>`).join(''):'<p>No purchases yet.</p>';const e=document.getElementById('teacherEarnings');if(e)e.textContent='KES '+Number(localStorage.getItem('tusomeTeacherEarnings')||0).toFixed(2);const r=document.getElementById('platformRevenue');if(r)r.textContent='KES '+Number(localStorage.getItem('tusomeRevenue')||0).toFixed(2)}
function renderTeacher(){const c=document.getElementById('count');if(c)c.textContent=materials.length;renderTeacherMaterialCentre();renderTeacherDrafts()}
function teacherMaterialStatus(m){return String(m.approvalStatus||m.status||'pending').toLowerCase()}
function renderTeacherMaterialCentre(){const box=document.getElementById('teacherMaterials');if(!box)return;const search=(document.getElementById('tmSearch')?.value||'').trim().toLowerCase();const status=document.getElementById('tmStatus')?.value||'all';const sort=document.getElementById('tmSort')?.value||'newest';let list=(Array.isArray(materials)?materials:[]).filter(m=>{const hay=[m.title,m.subject,m.grade,m.topic,m.description].join(' ').toLowerCase();return(!search||hay.includes(search))&&(status==='all'||teacherMaterialStatus(m)===status)});if(sort==='az')list.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));else if(sort==='status')list.sort((a,b)=>teacherMaterialStatus(a).localeCompare(teacherMaterialStatus(b)));else list.sort((a,b)=>String(b.createdAt||b.updatedAt||'').localeCompare(String(a.createdAt||a.updatedAt||'')));const all=Array.isArray(materials)?materials:[];const countStatus=k=>all.filter(m=>teacherMaterialStatus(m)===k).length;['tmTotal','tmApproved','tmPending','tmRejected'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=id==='tmTotal'?all.length:id==='tmApproved'?countStatus('approved'):id==='tmPending'?countStatus('pending'):countStatus('rejected')});if(!list.length){box.innerHTML='<div class="teacher-empty">No materials match your current filters.</div>';return}box.innerHTML=list.map(m=>{const st=teacherMaterialStatus(m);const id=m.id==null?'':String(m.id);const meta=[m.subject,m.grade,m.topic].filter(Boolean).map(escHtml).join(' • ');return `<article class="teacher-material-row"><div><h4>${escHtml(m.title||'Untitled material')}</h4><div class="teacher-material-meta">${meta||'No subject or grade information'}</div><span class="teacher-status ${st}">${escHtml(st.toUpperCase())}</span></div><div class="teacher-material-actions"><button class="btn light" type="button" onclick="openMaterialById(${JSON.stringify(id)})">Open</button>${st==='rejected'?'<button class="btn" type="button" onclick="show(&quot;upload&quot;)">Revise & Upload</button>':''}${st==='approved'?'<button class="btn" type="button" onclick="openMaterialById('+JSON.stringify(id)+')">View</button>':''}</div></article>`}).join('')}
function resetTeacherMaterialFilters(){['tmSearch','tmStatus','tmSort'].forEach((id,i)=>{const el=document.getElementById(id);if(el)el.value=i===0?'':i===1?'all':'newest'});renderTeacherMaterialCentre()}
function getTeacherDrafts(){try{return JSON.parse(localStorage.getItem('tusomeTeacherDrafts')||'[]')||[]}catch{return[]}}
function saveTeacherDraft(){const title=(document.getElementById('teacherDraftTitle')?.value||'').trim();const subject=(document.getElementById('teacherDraftSubject')?.value||'').trim();const grade=(document.getElementById('teacherDraftGrade')?.value||'').trim();if(!title){showToast?.('Enter a draft title first.','error');document.getElementById('teacherDraftTitle')?.focus();return}const drafts=getTeacherDrafts();drafts.unshift({id:Date.now(),title,subject,grade,createdAt:new Date().toISOString()});localStorage.setItem('tusomeTeacherDrafts',JSON.stringify(drafts.slice(0,30)));['teacherDraftTitle','teacherDraftSubject','teacherDraftGrade'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});renderTeacherDrafts();showToast?.('Draft saved on this device.','success')}
function renderTeacherDrafts(){const box=document.getElementById('teacherDrafts');if(!box)return;const drafts=getTeacherDrafts();box.innerHTML=drafts.length?'<h4 style="margin:0 0 8px">📝 Saved Drafts</h4>'+drafts.map(d=>`<div class="teacher-material-row"><div><h4>${escHtml(d.title)}</h4><div class="teacher-material-meta">${escHtml(d.subject||'')} ${d.grade?'• '+escHtml(d.grade):''}</div><span class="teacher-status draft">DRAFT</span></div><div class="teacher-material-actions"><button class="btn light" type="button" onclick="deleteTeacherDraft(${Number(d.id)})">Delete</button></div></div>`).join(''):'<p class="small">No saved drafts yet.</p>'}
function deleteTeacherDraft(id){const drafts=getTeacherDrafts().filter(d=>Number(d.id)!==Number(id));localStorage.setItem('tusomeTeacherDrafts',JSON.stringify(drafts));renderTeacherDrafts();showToast?.('Draft deleted.','info')}

function saveAdminState(st){localStorage.setItem('tusomeTeachers',JSON.stringify(st.teachers));localStorage.setItem('tusomeUsers',JSON.stringify(st.users));localStorage.setItem('tusomeSystemNotes',JSON.stringify(st.notes))}

let feedbackType='Complaint';
function feedbackStore(){return JSON.parse(localStorage.getItem('tusomeFeedback')||'[]')}
function saveFeedbackStore(x){localStorage.setItem('tusomeFeedback',JSON.stringify(x))}
function setFeedbackType(type){feedbackType=type;document.getElementById('feedbackComplaintBtn')?.classList.toggle('active',type==='Complaint');document.getElementById('feedbackSuggestionBtn')?.classList.toggle('active',type==='Suggestion')}
function submitFeedback(){
 const subject=(document.getElementById('feedbackSubject')?.value||'').trim(),message=(document.getElementById('feedbackMessage')?.value||'').trim(),notice=document.getElementById('feedbackNotice');
 if(!subject||!message){if(notice)notice.textContent='Please enter both a subject and message.';return}
 const user=localStorage.getItem('tusomeCurrentUser')||'Learner',items=feedbackStore();
 items.unshift({id:Date.now(),type:feedbackType,subject,message,user,status:'New',reply:'',createdAt:new Date().toISOString()});
 saveFeedbackStore(items); if(typeof logNotification==='function')logNotification('New '+feedbackType.toLowerCase()+': '+subject);
 if(notice)notice.textContent='Your message has been submitted successfully.';
 document.getElementById('feedbackSubject').value='';document.getElementById('feedbackMessage').value='';renderMyFeedback();renderAdminFeedback();
}
function renderMyFeedback(){
 const box=document.getElementById('myFeedbackList');if(!box)return;const user=localStorage.getItem('tusomeCurrentUser')||'Learner';
 const items=feedbackStore().filter(x=>x.user===user);
 box.innerHTML=items.length?items.map(x=>`<div class="complaint-item"><div class="complaint-head"><b>${escHtml(x.subject)}</b><span class="feedback-status ${x.status.toLowerCase()}">${escHtml(x.status)}</span></div><small>${escHtml(x.type)} • ${new Date(x.createdAt).toLocaleString()}</small><p>${escHtml(x.message)}</p>${x.reply?`<div class="reply-box"><b>EduShelf response:</b><br>${escHtml(x.reply)}</div>`:''}</div>`).join(''):'<p class="small">You have not sent any messages yet.</p>';
}
function renderAdminFeedback(){
 const box=document.getElementById('adminFeedbackList');if(!box)return;const items=feedbackStore();
 box.innerHTML=items.length?items.map(x=>`<div class="complaint-item"><div class="complaint-head"><b>${escHtml(x.subject)}</b><span class="feedback-status ${x.status.toLowerCase()}">${escHtml(x.status)}</span></div><small>${escHtml(x.type)} • From: ${escHtml(x.user)} • ${new Date(x.createdAt).toLocaleString()}</small><p>${escHtml(x.message)}</p><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn" onclick="updateFeedbackStatus(${x.id},'Reviewing')">Reviewing</button><button class="btn" onclick="updateFeedbackStatus(${x.id},'Resolved')">Resolved</button></div><textarea id="reply_${x.id}" rows="3" placeholder="Reply to this user...">${escHtml(x.reply||'')}</textarea><button class="btn primary" onclick="replyToFeedback(${x.id})">Send Response</button></div>`).join(''):'<p>No complaints or suggestions have been submitted.</p>';
}
function updateFeedbackStatus(id,status){const a=feedbackStore(),x=a.find(v=>v.id===id);if(!x)return;x.status=status;saveFeedbackStore(a);renderAdminFeedback();renderMyFeedback()}
function replyToFeedback(id){const a=feedbackStore(),x=a.find(v=>v.id===id);if(!x)return;const r=(document.getElementById('reply_'+id)?.value||'').trim();if(!r)return;x.reply=r;x.status='Resolved';saveFeedbackStore(a);renderAdminFeedback();renderMyFeedback()}
async function getCommunicationSchoolId(){
  if(selectedSchoolId)return selectedSchoolId;
  const role=getSessionRole();
  if(role==='parent'){
    try{const r=await fetch('/api/parent/children',{credentials:'include'}),d=await parseApiResponse(r);if(r.ok&&d.children?.length){selectedSchoolId=d.children[0].schoolId;return selectedSchoolId;}}catch(e){}
  }
  if(!schoolWorkspaces?.length){try{const r=await fetch('/api/schools/mine',{credentials:'include'}),d=await parseApiResponse(r);if(r.ok&&d.schools?.length){schoolWorkspaces=d.schools;selectedSchoolId=d.schools[0].schoolId;}}catch(e){}}
  return selectedSchoolId;
}
async function loadCommunicationSchoolOptions(){
  const sel=document.getElementById('communicationSchoolSelect');if(!sel)return;
  const role=getSessionRole();let schools=[];
  try{
    if(role==='parent'){const r=await fetch('/api/parent/children',{credentials:'include'}),d=await parseApiResponse(r);schools=[...(d.children||[])].filter((x,i,a)=>a.findIndex(y=>y.schoolId===x.schoolId)===i).map(x=>({schoolId:x.schoolId,schoolName:x.schoolName}));}
    else {const r=await fetch('/api/schools/mine',{credentials:'include'}),d=await parseApiResponse(r);schools=d.schools||[];schoolWorkspaces=schools;}
  }catch(e){schools=[]}
  sel.innerHTML=schools.length?schools.map(x=>`<option value="${escapeHtml(x.schoolId)}">${escapeHtml(x.schoolName)}</option>`).join(''):'<option value="">No school workspace</option>';
  if(selectedSchoolId&&schools.some(x=>x.schoolId===selectedSchoolId))sel.value=selectedSchoolId;else if(schools[0]){selectedSchoolId=schools[0].schoolId;sel.value=selectedSchoolId;}
  const roleNow=getSessionRole();const canPublish=['teacher','admin'].includes(roleNow);document.getElementById('announcementComposerCard').style.display=canPublish?'block':'none';
}
async function loadCommunicationHub(){await loadCommunicationSchoolOptions();await Promise.all([loadSchoolAnnouncements(),loadSchoolMessages()]);updateCommunicationAudience();}
async function loadSchoolAnnouncements(){const box=document.getElementById('schoolAnnouncements');if(!box)return;const sid=await getCommunicationSchoolId();if(!sid){box.innerHTML='<div class="comm-empty">No school workspace is available.</div>';return}try{const r=await fetch('/api/schools/communication/announcements?schoolId='+encodeURIComponent(sid),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load announcements.');box.innerHTML=d.announcements?.length?d.announcements.map(x=>`<article class="comm-item ${x.pinned?'pinned':''}"><span class="comm-badge">${x.pinned?'📌 Pinned':'📢 Announcement'}</span><h4>${escapeHtml(x.title)}</h4><p>${escapeHtml(x.message).replace(/\n/g,'<br>')}</p><div class="comm-meta">${new Date(x.createdAt).toLocaleString()} · ${escapeHtml(x.audienceType)} · ${escapeHtml(x.createdBy)}</div></article>`).join(''):'<div class="comm-empty">No announcements yet.</div>'}catch(e){box.innerHTML='<div class="comm-empty">'+escapeHtml(e.message)+'</div>'}}
async function updateCommunicationAudience(){const type=document.getElementById('commAnnouncementAudience')?.value,sel=document.getElementById('commAnnouncementAudienceValue');if(!sel)return;sel.style.display=type==='school'?'none':'block';if(type==='role'){sel.innerHTML='<option value="learner">Learners</option><option value="teacher">Teachers</option><option value="parent">Parents/Guardians</option>';return}if(type==='class'){const sid=await getCommunicationSchoolId();if(!sid){sel.innerHTML='<option value="">No school selected</option>';return}try{const r=await fetch('/api/schools/dashboard?schoolId='+encodeURIComponent(sid),{credentials:'include'}),d=await parseApiResponse(r);const classes=d.classes||[];sel.innerHTML=classes.length?classes.map(x=>`<option value="${escapeHtml(x.classId)}">${escapeHtml(x.className)}</option>`).join(''):'<option value="">No classes found</option>'}catch(e){sel.innerHTML='<option value="">Unable to load classes</option>'}}}
async function publishSchoolAnnouncement(){const sid=await getCommunicationSchoolId();if(!sid)return showToast?.('Choose a school first.','error');const type=document.getElementById('commAnnouncementAudience')?.value||'school',value=type==='school'?'':document.getElementById('commAnnouncementAudienceValue')?.value||'';const body={schoolId:sid,title:document.getElementById('commAnnouncementTitle')?.value.trim(),message:document.getElementById('commAnnouncementMessage')?.value.trim(),audienceType:type,audienceValue:value,pinned:document.getElementById('commAnnouncementPinned')?.checked};try{const r=await fetch('/api/schools/communication/announcements',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not publish announcement.');showToast?.('Announcement published.','success');document.getElementById('commAnnouncementTitle').value='';document.getElementById('commAnnouncementMessage').value='';loadSchoolAnnouncements();renderNotifications()}catch(e){showToast?.(e.message,'error')}}
async function loadSchoolMessages(){const box=document.getElementById('schoolMessageList');if(!box)return;const sid=await getCommunicationSchoolId();if(!sid){box.innerHTML='<div class="comm-empty">No school workspace is available.</div>';return}try{const r=await fetch('/api/schools/communication/messages?schoolId='+encodeURIComponent(sid),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load messages.');box.innerHTML=d.messages?.length?d.messages.map(x=>`<article class="comm-message ${!x.readAt&&x.recipientEmail===getCurrentUserEmail()?'unread':''}"><b>${escapeHtml(x.subject)}</b><p>${escapeHtml(x.body).replace(/\n/g,'<br>')}</p><div class="comm-meta">${x.senderEmail===getCurrentUserEmail()?'To':'From'} ${escapeHtml(x.senderEmail===getCurrentUserEmail()?x.recipientEmail:x.senderEmail)} · ${new Date(x.createdAt).toLocaleString()}</div>${!x.readAt&&x.recipientEmail===getCurrentUserEmail()?`<button class="btn" onclick="markSchoolMessageRead('${escapeHtml(x.messageId)}')">Mark read</button>`:''}</article>`).join(''):'<div class="comm-empty">No messages yet.</div>'}catch(e){box.innerHTML='<div class="comm-empty">'+escapeHtml(e.message)+'</div>'}}
function getCurrentUserEmail(){return String(localStorage.getItem('tusomeCurrentUser')||sessionStorage.getItem('tusomeCurrentUser')||'').toLowerCase()}
async function sendSchoolMessage(){const sid=await getCommunicationSchoolId();if(!sid)return showToast?.('Choose a school first.','error');const body={schoolId:sid,recipientEmail:document.getElementById('commRecipient')?.value.trim(),subject:document.getElementById('commSubject')?.value.trim(),body:document.getElementById('commBody')?.value.trim()};try{const r=await fetch('/api/schools/communication/messages',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not send message.');showToast?.('Message sent.','success');['commRecipient','commSubject','commBody'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});loadSchoolMessages();renderNotifications()}catch(e){showToast?.(e.message,'error')}}
async function markSchoolMessageRead(id){const sid=await getCommunicationSchoolId();try{const r=await fetch('/api/schools/communication/messages/'+encodeURIComponent(id)+'/read?schoolId='+encodeURIComponent(sid),{method:'PATCH',credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not update message.');loadSchoolMessages();refreshNotificationBadge()}catch(e){showToast?.(e.message,'error')}}
function openCommunicationCentre(){show('communication')}
function adminTab(tab){
  document.querySelectorAll('.admin-panel').forEach(x=>x.style.display='none');
  if(tab==='command'){adminRefreshAll();window.scrollTo({top:0,behavior:'smooth'});return;}
  const map={approvals:'adminApprovals',payments:'adminPayments',revenue:'adminRevenue',backups:'adminBackups',analytics:'adminAnalytics',marketplace:'adminMarketplace',memberships:'adminMemberships'};
  const el=document.getElementById(map[tab]||'adminApprovals');if(el)el.style.display='block';
  adminRefreshAll();
  if(tab==='payments'||tab==='revenue')loadAdminPayments();
  if(tab==='backups')loadAdminBackups();
  if(tab==='analytics')loadAdminAnalytics();
  if(tab==='marketplace')loadAdminMarketplace();
  if(tab==='memberships')loadAdminMemberships();
}

async function loadMarketplace(){
  const box=document.getElementById('marketplaceFeatured'); if(!box)return;
  try{
    const r=await fetch('/api/marketplace/featured',{credentials:'include'}); const d=await parseApiResponse(r); if(!r.ok)throw new Error(d.error||'Could not load marketplace.');
    const list=d.materials||[]; const free=list.filter(x=>Number(x.price||0)===0).length; const paid=list.filter(x=>Number(x.price||0)>0).length; const rated=list.filter(x=>Number(x.reviewCount||0)>0).length;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v}; set('marketFreeCount',free);set('marketPaidCount',paid);set('marketRatedCount',rated);
    box.innerHTML=list.length?list.map(m=>{const rating=Number(m.averageRating||0);const stars='★'.repeat(Math.round(rating))+'☆'.repeat(5-Math.round(rating));const price=Number(m.price||0);return `<article class="marketplace-card"><div><span class="market-badge">${price>0?'PREMIUM':'FREE'}</span><span class="market-badge">${escHtml(m.grade||'All grades')}</span></div><h3>${escHtml(m.title||'Untitled')}</h3><p class="small">${escHtml(m.subject||'General')}${m.topic?' • '+escHtml(m.topic):''}</p><p class="market-price">${price>0?'KES '+price.toFixed(2):'Free'}</p><p class="small"><span class="rating-stars" aria-label="${rating.toFixed(1)} out of 5">${stars}</span> ${rating.toFixed(1)} • ${Number(m.reviewCount||0)} review(s) • ${Number(m.purchaseCount||0)} purchase(s)</p><button class="btn primary" type="button" onclick="openMaterialById(${JSON.stringify(String(m.id))})">${price>0&&!isPurchased(m.id)?'View & Buy':'Open Resource'}</button></article>`}).join(''):'<div class="notice">No approved marketplace resources are available yet.</div>';
  }catch(e){box.innerHTML='<div class="notice">'+escHtml(e.message||'Marketplace could not be loaded.')+'</div>'}
}

async function loadMaterialReviews(materialId){
  const box=document.getElementById('readerReviews');if(!box)return;
  try{const r=await fetch('/api/materials/'+encodeURIComponent(materialId)+'/reviews',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load reviews.');const avg=Number(d.averageRating||0);box.innerHTML=`<h3>⭐ Learner Reviews</h3><p><b>${avg.toFixed(1)}/5</b> • ${Number(d.reviewCount||0)} review(s)</p>${(d.reviews||[]).map(x=>`<div class="material" style="margin-top:8px"><div><b>${'★'.repeat(Number(x.rating||0))}${'☆'.repeat(5-Number(x.rating||0))}</b><br><small>${new Date(x.createdAt).toLocaleString()}</small>${x.review?`<p>${escHtml(x.review)}</p>`:''}</div></div>`).join('')||'<p class="small">No reviews yet.</p>'}<div class="review-form"><label>Rate this resource<select id="readerRating"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Useful</option><option value="2">2 — Needs improvement</option><option value="1">1 — Poor</option></select></label><textarea id="readerReviewText" maxlength="1000" rows="3" placeholder="Optional: tell other learners what was useful."></textarea><button class="btn primary" type="button" onclick="submitMaterialReview()">Submit Review</button><div id="readerReviewStatus" class="small" aria-live="polite"></div></div>`}catch(e){box.innerHTML='<p class="small">'+escHtml(e.message||'Could not load reviews.')+'</p>'}
}
async function submitMaterialReview(){if(!activeReaderMaterialId)return;const rating=Number(document.getElementById('readerRating')?.value||5);const review=(document.getElementById('readerReviewText')?.value||'').trim();const status=document.getElementById('readerReviewStatus');if(status)status.textContent='Saving…';try{const r=await fetch('/api/materials/'+encodeURIComponent(activeReaderMaterialId)+'/reviews',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({rating,review})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save review.');if(status)status.textContent='Review saved.';await loadMaterialReviews(activeReaderMaterialId);await loadMarketplace()}catch(e){if(status)status.textContent=e.message||'Could not save review.'}}

async function loadAdminMarketplace(){
  try{const r=await fetch('/api/admin/marketplace',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load marketplace analytics.');const s=d.summary||{},x=d.sales||{};const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};set('marketAdminApproved',Number(s.approved||0));set('marketAdminPaid',Number(s.paid||0));set('marketAdminPurchases',Number(x.purchases||0));set('marketAdminGross','KES '+Number(x.gross||0).toFixed(2));set('marketAdminPlatform','KES '+Number(x.platform||0).toFixed(2));set('marketAdminTeacher','KES '+Number(x.teacher||0).toFixed(2));const body=document.getElementById('adminMarketplaceTable');body.innerHTML=(d.top||[]).length?(d.top||[]).map(m=>`<tr><td>${escHtml(m.title||'')}</td><td>${escHtml(m.teacherEmail||'')}</td><td>${Number(m.price||0)>0?'KES '+Number(m.price).toFixed(2):'Free'}</td><td>${Number(m.purchases||0)}</td><td>${Number(m.averageRating||0).toFixed(1)}</td><td>${Number(m.reviewCount||0)}</td><td>KES ${Number(m.platformRevenue||0).toFixed(2)}</td></tr>`).join(''):'<tr><td colspan="7">No marketplace activity yet.</td></tr>'}catch(e){console.warn(e)}
}

async function loadServerMaterials(){try{const r=await fetch('/api/materials',{credentials:'include'});if(!r.ok)return false;const d=await parseApiResponse(r);materials=Array.isArray(d.materials)?d.materials:[];return true}catch(e){console.warn('Could not load server materials',e);return false}}
async function loadAdminPayments(){
  try{
    const r=await fetch('/api/admin/payments',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load payment records.');
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    set('teacherRevenuePercent',d.settings.teacherPercentage);set('platformRevenuePercent','Platform: '+d.settings.platformPercentage+'%');
    const tx=(d.transactions||[]).filter(x=>x.status==='paid');
    const total=tx.reduce((a,x)=>a+Number(x.amount||0),0), teacher=tx.reduce((a,x)=>a+Number(x.teacherAmount||0),0), platform=tx.reduce((a,x)=>a+Number(x.platformAmount||0),0);
    set('adminPaymentSummary',`Confirmed purchases: ${tx.length} • Sales: KES ${total.toFixed(2)} • Teacher earnings: KES ${teacher.toFixed(2)} • Platform revenue: KES ${platform.toFixed(2)}`);
    const body=document.getElementById('adminPaymentsTable');if(body)body.innerHTML=tx.length?tx.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString()}</td><td>${escHtml(x.title||'')}</td><td>${escHtml(x.learnerEmail||'')}</td><td>${escHtml(x.teacherEmail||'')}</td><td>KES ${Number(x.amount||0).toFixed(2)}</td><td>KES ${Number(x.teacherAmount||0).toFixed(2)} (${Number(x.teacherPercentage||0)}%)</td><td>KES ${Number(x.platformAmount||0).toFixed(2)} (${Number(x.platformPercentage||0)}%)</td><td>${escHtml(x.status||'')}</td></tr>`).join(''):'<tr><td colspan="8">No confirmed purchases yet.</td></tr>';
    const payouts=d.payouts||[], pb=document.getElementById('adminPayoutsList');
    if(pb)pb.innerHTML=payouts.length?payouts.map(x=>`<div class="material"><div><b>${escHtml(x.teacherEmail)}</b><br><small>${new Date(x.createdAt).toLocaleString()} • KES ${Number(x.amount||0).toFixed(2)} • ${escHtml(x.status)}</small>${x.notes?`<br><small>${escHtml(x.notes)}</small>`:''}</div>${x.status!=='paid'?`<button class="btn" onclick="markTeacherPayoutPaid('${escHtml(x.payoutId)}')">Mark Paid</button>`:''}</div>`).join(''):'<p>No teacher payouts recorded.</p>';
  }catch(e){console.warn(e);}
}
async function saveRevenueSettings(){
  const teacher=Number(document.getElementById('teacherRevenuePercent')?.value);if(!Number.isFinite(teacher)||teacher<0||teacher>100){alert('Enter a teacher percentage from 0 to 100.');return}
  try{const r=await fetch('/api/admin/revenue-settings',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({teacherPercentage:teacher})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save revenue split.');document.getElementById('platformRevenuePercent').textContent='Platform: '+d.settings.platformPercentage+'%';alert('Revenue split saved. New purchases will use '+d.settings.teacherPercentage+'% for teachers and '+d.settings.platformPercentage+'% for the platform.');}catch(e){alert(e.message)}
}
async function createTeacherPayout(){
  const teacherEmail=(document.getElementById('payoutTeacherEmail')?.value||'').trim(),amount=Number(document.getElementById('payoutAmount')?.value||0),notes=(document.getElementById('payoutNotes')?.value||'').trim();if(!teacherEmail||!amount||amount<=0){alert('Enter the teacher email and payout amount.');return}
  try{const r=await fetch('/api/admin/teacher-payouts',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({teacherEmail,amount,notes})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not create payout.');document.getElementById('payoutAmount').value='';document.getElementById('payoutNotes').value='';loadAdminPayments();alert('Teacher payout record created. You can mark it Paid after the actual transfer is completed.');}catch(e){alert(e.message)}
}
async function markTeacherPayoutPaid(id){if(!confirm('Mark this teacher payout as paid?'))return;try{const r=await fetch('/api/admin/teacher-payouts/'+encodeURIComponent(id)+'/paid',{method:'PATCH',credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not update payout.');loadAdminPayments()}catch(e){alert(e.message)}}
async function loadAdminBackups(){
  const status=document.getElementById('backupStatus'); if(status)status.textContent='Loading backup and recovery data...';
  try{
    const r=await fetch('/api/admin/backups',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load backups.');
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.innerHTML=v};
    const st=document.getElementById('backupSettingsText');if(st)st.innerHTML=`Automatic backup every <b>${d.settings.intervalHours} hours</b> • retention <b>${d.settings.retentionDays} days</b>. Includes database records, learning files, payment records, audit logs and curriculum data.`;
    const rows=d.backups||[];set('backupTable',rows.length?rows.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString()}</td><td>${escHtml(x.trigger)}</td><td>${(Number(x.sizeBytes||0)/1024/1024).toFixed(2)} MB</td><td>SHA-256 ✓</td><td>${x.restoreTestedAt?escHtml(x.restoreTestStatus||'tested'):'Not tested'}</td><td><a class="btn" href="/api/admin/backups/${encodeURIComponent(x.backupId)}/download">Download</a> <button class="btn" onclick="testAdminRestore('${x.backupId}')">Test Restore</button> <button class="btn" onclick="restoreAdminBackup('${x.backupId}')">Restore</button></td></tr>`).join(''):'<tr><td colspan="6">No backups yet.</td></tr>');
    const deleted=d.deletedMaterials||[];set('deletedMaterialsList',deleted.length?deleted.map(x=>`<div class="material"><div><b>${escHtml(x.title)}</b><br><small>${escHtml(x.teacherEmail||'')} • deleted ${new Date(x.deletedAt).toLocaleString()}</small></div><button class="btn primary" onclick="restoreDeletedMaterial('${x.id}')">Recover Material</button></div>`).join(''):'<p>No deleted materials in the recovery bin.</p>');
    const versions=d.versions||[];set('materialVersionsTable',versions.length?versions.map(x=>`<tr><td>${escHtml(x.title||x.materialId)}</td><td>v${x.versionNumber}</td><td>${escHtml(x.fileName)}</td><td>${escHtml(x.createdBy||'')}</td><td>${new Date(x.createdAt).toLocaleString()}</td></tr>`).join(''):'<tr><td colspan="5">No file versions recorded yet.</td></tr>');
    const logs=d.auditLogs||[];set('auditLogsTable',logs.length?logs.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString()}</td><td>${escHtml(x.actorEmail||'System')}</td><td>${escHtml(x.action)}</td><td>${escHtml((x.entityType||'')+' '+(x.entityId||''))}</td><td>${escHtml(JSON.stringify(x.details||{}))}</td></tr>`).join(''):'<tr><td colspan="5">No audit events recorded yet.</td></tr>');
    if(status)status.textContent=`Loaded ${rows.length} backup(s), ${deleted.length} deleted material(s), ${versions.length} version record(s), and ${logs.length} recent audit event(s).`;
  }catch(e){if(status)status.textContent=e.message;}
}
async function runAdminBackup(){
  const status=document.getElementById('backupStatus');if(status)status.textContent='Creating backup...';
  try{const r=await fetch('/api/admin/backups/run',{method:'POST',credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Backup failed.');alert('Backup created: '+d.backup.fileName);loadAdminBackups();}catch(e){alert(e.message)}
}
async function testAdminRestore(id){
  try{const r=await fetch('/api/admin/backups/'+encodeURIComponent(id)+'/test-restore',{method:'POST',credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Restore test failed.');alert('Restore test passed. The backup contains all required datasets and valid file data.');loadAdminBackups();}catch(e){alert(e.message)}
}
async function restoreAdminBackup(id){
  const typed=prompt('This will REPLACE the current database with this backup. Type exactly: RESTORE TUSOME EDUSHELF');
  if(typed!=='RESTORE TUSOME EDUSHELF')return;
  try{const r=await fetch('/api/admin/backups/'+encodeURIComponent(id)+'/restore',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({confirmation:typed})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Restore failed.');alert(d.message||'Backup restored.');location.reload();}catch(e){alert(e.message)}
}
async function adminDeleteMaterial(i){
  const m=materials[i];if(!m)return;const typed=prompt(`Move “${m.title}” to the recovery bin? Type exactly: DELETE MATERIAL`);if(typed!=='DELETE MATERIAL')return;
  try{const r=await fetch('/api/admin/materials/'+encodeURIComponent(m.id),{method:'DELETE',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({confirmation:typed,reason:'Moved to recovery bin by administrator'})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not delete material.');alert('Material moved to the recovery bin.');adminRefreshAll();renderMaterials();}catch(e){alert(e.message)}
}
async function restoreDeletedMaterial(id){
  const typed=prompt('Recover this material and return it to pending review? Type exactly: RESTORE MATERIAL');if(typed!=='RESTORE MATERIAL')return;
  try{const r=await fetch('/api/admin/materials/'+encodeURIComponent(id)+'/restore',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({confirmation:typed})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not recover material.');alert('Material recovered and returned to pending review.');loadAdminBackups();adminRefreshAll();renderMaterials();}catch(e){alert(e.message)}
}

async function loadTeacherAnalytics(){
  try{
    const r=await fetch('/api/teacher/analytics',{credentials:'include'}); const d=await parseApiResponse(r);
    if(!r.ok)throw new Error(d.error||'Could not load analytics.');
    const box=document.getElementById('teacherAnalyticsPanel'); if(!box)return;
    const s=d.summary||{};
    const rows=(d.activity||[]).map(x=>`<tr><td>${escHtml(x.title||'')}</td><td>${escHtml(x.subject||'')}</td><td>${escHtml(x.grade||'')}</td><td>${Number(x.views||0)}</td><td>${Number(x.uniqueLearners||0)}</td><td>${Number(x.bookmarks||0)}</td></tr>`).join('');
    const sales=(d.sales||[]).map(x=>`<tr><td>${escHtml(x.title||'')}</td><td>${Number(x.purchases||0)}</td><td>KES ${Number(x.earnings||0).toFixed(2)}</td></tr>`).join('');
    box.innerHTML=`<div class="cards" style="margin:0 0 16px"><div class="card"><h4>Materials</h4><b>${Number(s.materialCount||0)}</b></div><div class="card"><h4>Approved</h4><b>${Number(s.approvedCount||0)}</b></div><div class="card"><h4>Pending</h4><b>${Number(s.pendingCount||0)}</b></div><div class="card"><h4>Rejected</h4><b>${Number(s.rejectedCount||0)}</b></div></div><h4>Engagement by material</h4><div class="table-like"><table><thead><tr><th>Material</th><th>Subject</th><th>Grade</th><th>Views</th><th>Unique learners</th><th>Bookmarks</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No material activity yet.</td></tr>'}</tbody></table></div><h4 style="margin-top:18px">Purchases & earnings</h4><div class="table-like"><table><thead><tr><th>Material</th><th>Purchases</th><th>Teacher earnings</th></tr></thead><tbody>${sales||'<tr><td colspan="3">No purchases yet.</td></tr>'}</tbody></table></div>`;
  }catch(e){console.warn(e)}
}

async function loadTeacherEarnings(){
  try{
    const r=await fetch('/api/teacher/earnings',{credentials:'include'});
    const d=await parseApiResponse(r);
    if(!r.ok)throw new Error(d.error||'Could not load earnings.');
    const b=document.getElementById('teacherBalance');if(b)b.textContent='KES '+Number(d.balance||0).toFixed(2);
    const rate=document.getElementById('teacherRevenueRate');if(rate)rate.textContent='Teacher share: '+d.settings.teacherPercentage+'%';
    const box=document.getElementById('teacherEarningsPanel');
    if(box){
      const sales=d.sales||[];
      const rows=sales.length?sales.map(x=>`<tr><td>${escHtml(x.title||'')}</td><td>KES ${Number(x.amount||0).toFixed(2)}</td><td>KES ${Number(x.teacherAmount||0).toFixed(2)}</td><td>${new Date(x.createdAt).toLocaleString()}</td></tr>`).join(''):'<tr><td colspan="4">No sales yet.</td></tr>';
      box.innerHTML=`<p><b>Total earned:</b> KES ${Number(d.earned||0).toFixed(2)} &nbsp; <b>Paid out:</b> KES ${Number(d.paidOut||0).toFixed(2)} &nbsp; <b>Balance:</b> KES ${Number(d.balance||0).toFixed(2)}</p><div class="table-like"><table><thead><tr><th>Material</th><th>Sale</th><th>Your share</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  }catch(e){console.warn(e)}
}

async function loadAdminAnalytics(){
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  try{
    const r=await fetch('/api/admin/analytics',{credentials:'include'}); const d=await parseApiResponse(r); if(!r.ok) throw new Error(d.error||'Could not load analytics.');
    set('analyticsLearners',d.users?.learner||0); set('analyticsTeachers',d.users?.teacher||0); set('analyticsAdmins',d.users?.admin||0);
    const total=(d.materials?.pending||0)+(d.materials?.approved||0)+(d.materials?.rejected||0)+(d.materials?.draft||0); set('analyticsMaterials',total); set('analyticsPending',d.materials?.pending||0); set('analyticsApproved',d.materials?.approved||0);
    set('analyticsPaid',d.payments?.paid?.count||0); set('analyticsPaidAmount','KES '+Number(d.payments?.paid?.amount||0).toFixed(2)); set('analyticsFiles',d.storage?.files||0); set('analyticsStorage',(Number(d.storage?.bytes||0)/1048576).toFixed(2)+' MB');
    const att=document.getElementById('analyticsAttention'); att.innerHTML=d.attention?.length?d.attention.map(x=>`<div class="notice">⚠️ ${escHtml(x)}</div>`).join(''):'<div class="success">✓ No immediate attention items reported.</div>';
    const a=d.activity||{}; document.getElementById('analyticsActivity').innerHTML=`<p><b>Material views:</b> ${Number(a.views||0).toLocaleString()} &nbsp; <b>Unique learners:</b> ${Number(a.learners||0).toLocaleString()} &nbsp; <b>Bookmarks:</b> ${Number(a.bookmarks||0).toLocaleString()}</p>`;
    const b=d.backups||{}; document.getElementById('analyticsBackups').innerHTML=`<p><b>Total backups:</b> ${b.total||0} &nbsp; <b>Completed:</b> ${b.completed||0} &nbsp; <b>Restore tests passed:</b> ${b.tested_passed||0}<br><b>Latest:</b> ${b.latest?new Date(b.latest).toLocaleString():'None recorded'}</p>`;
    document.getElementById('analyticsAudit').innerHTML=(d.auditSummary||[]).length?(d.auditSummary.map(x=>`<tr><td>${escHtml(x.role||'Unknown')}</td><td>${Number(x.count||0).toLocaleString()}</td><td>${x.latest?new Date(x.latest).toLocaleString():'—'}</td></tr>`).join('')):'<tr><td colspan="3">No audit activity recorded.</td></tr>';
  }catch(e){const box=document.getElementById('analyticsAttention');if(box)box.innerHTML='<div class="notice">Could not load platform analytics.</div>';console.warn(e)}
}

async function adminRefreshAll(){
  await loadServerMaterials();
  renderAdminFeedback();
  const pendingM=materials.filter(m=>(m.approvalStatus||'pending')!=='approved').length;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  void (async()=>{try{const r=await fetch('/api/admin/analytics',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)return;set('commandUsers',(Number(d.users?.learner||0)+Number(d.users?.teacher||0)+Number(d.users?.admin||0)));set('commandPaid',d.payments?.paid?.count||0);}catch(e){console.warn('Command centre summary unavailable',e)}})();
  set('adminCount',materials.length);
  set('adminPendingMaterials',pendingM);
  set('commandMaterials',materials.length);
  set('commandPending',pendingM);
  const commandAttention=document.getElementById('commandAttention');
  if(commandAttention){
    const items=[];
    if(pendingM) items.push(`<div class=\"command-status\"><span class=\"command-dot warn\"></span>${pendingM} material${pendingM===1?'':'s'} waiting for review.</div>`);
    if(!pendingM) items.push(`<div class=\"command-status\"><span class=\"command-dot\"></span>No materials waiting for review.</div>`);
    items.push(`<div class=\"small\" style=\"margin-top:8px\">Use Platform Analytics for payments, activity, storage and backup health.</div>`);
    commandAttention.innerHTML=items.join('<br>');
  }
  const ma=document.getElementById('materialApprovalList');
  if(ma)ma.innerHTML=materials.length?materials.map((m,i)=>{
    const status=m.approvalStatus||'pending';
    const price=Number(m.price||0);
    return `<div class="material">
      <div style="min-width:0">
        <b>${escHtml(m.title||'Untitled material')}</b><br>
        <small>${escHtml(m.subject||'General')} • ${escHtml(m.grade||'All grades')} • ${escHtml(m.file||'Uploaded material')}</small><br>
        <span class="${status==='approved'?'status-approved':status==='rejected'?'status-rejected':'status-pending'}">${status.toUpperCase()}</span>
        <span class="tag">Current price: KES ${price.toFixed(2)}</span>
      </div>
      <div class="admin-action-row">
        <label style="display:flex;align-items:center;gap:6px">KES <input type="number" min="0" step="1" value="${price}" style="width:110px" onchange="adminSetMaterialPrice(${i},this.value)" aria-label="Material price"></label>
        <button class="btn" onclick="adminPreviewMaterial(${i})">Review / Open</button>
        ${status!=='approved'?`<button class="btn" onclick="adminMaterialApproval(${i},'approved')">Approve</button>`:''}
        ${status!=='rejected'?`<button class="btn" onclick="adminMaterialApproval(${i},'rejected')">Reject</button>`:''}
        <button class="btn" onclick="adminDeleteMaterial(${i})">Move to Recovery Bin</button>
      </div>
    </div>`;
  }).join(''):'<p>No learning materials have been uploaded yet.</p>';
}
async function adminSetMaterialPrice(i,value){if(!materials[i])return;const price=Math.max(0,Number(value)||0);try{const r=await fetch('/api/materials/'+encodeURIComponent(materials[i].id)+'/review',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({approvalStatus:materials[i].approvalStatus||'pending',price})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not update price.');materials[i].price=price;logActivity(`Set material price: ${materials[i].title} = KES ${price.toFixed(2)}`);adminRefreshAll();renderMaterials()}catch(e){alert(e.message)}}
async function adminPreviewMaterial(i){const m=materials[i];if(!m)return;const url='/api/materials/'+encodeURIComponent(m.id)+'/file';const opened=window.open(url,'_blank');if(!opened){alert('Your browser blocked the document tab. Please allow pop-ups for EduShelf and click Review / Open again.')}else{logActivity('Admin reviewed material: '+m.title)}}
async function adminMaterialApproval(i,status){if(!materials[i])return;try{const r=await fetch('/api/materials/'+encodeURIComponent(materials[i].id)+'/review',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({approvalStatus:status,price:Number(materials[i].price||0)})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not update material.');materials[i].approvalStatus=status;materials[i].approvedAt=d.material?.approvedAt||null;logActivity(`${status==='approved'?'Approved':'Rejected'} material: ${materials[i].title}`);logNotification(`Material ${materials[i].title}: ${status}`);adminRefreshAll();renderMaterials()}catch(e){alert(e.message)}}
function setSessionRole(role,email,username=''){
  sessionStorage.setItem('tusomeLoggedIn','true');
  if(role!=='school') sessionStorage.removeItem('tusomeSchoolAccess');
  sessionStorage.setItem('tusomeRole',role);
  sessionStorage.setItem('tusomeCurrentUser',email||username||role);
  if(username){sessionStorage.setItem('tusomeUsername',username);localStorage.setItem('tusomeUsername',username)}else{sessionStorage.removeItem('tusomeUsername');localStorage.removeItem('tusomeUsername')}
  localStorage.setItem('tusomeCurrentUser',email||username||role);
}
function getSessionRole(){return sessionStorage.getItem('tusomeLoggedIn')==='true'?sessionStorage.getItem('tusomeRole'):null}
async function registerUser(e){
  e.preventDefault();
  const form=e.target, button=form.querySelector('button[type="submit"]');
  const email=form.querySelector('input[type="email"]').value.trim();
  const password=form.querySelector('input[type="password"]').value;
  const role=document.getElementById('signupRole').value;
  button.disabled=true;button.textContent='Creating account...';
  try{
    const res=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({email,password,role})});
    const raw=await res.text(); let data={};
    try{data=JSON.parse(raw)}catch{throw new Error('The EduShelf server returned an unexpected response. Please try again.');}
    if(!res.ok)throw new Error(data.error||'Could not create the account.');
    setSessionRole(data.user.role,data.user.email,data.user.username||'');
    form.reset();
    alert('Account created successfully. Welcome to Tusome EduShelf!');
    appPageHistory=[];
    show(data.user.role==='teacher'?'teacher':data.user.role==='parent'?'parent':'learner',true);
  }catch(err){alert(err.message)}
  finally{button.disabled=false;button.textContent='Sign Up'}
}
async function login(e){
  e.preventDefault();
  const form=e.target, button=form.querySelector('button[type="submit"]');
  const role=document.getElementById('role').value;
  const identifier=form.querySelector('input[type="text"],input[type="email"]').value.trim();
  const password=form.querySelector('input[type="password"]').value;
  button.disabled=true;button.textContent='Logging in...';
  try{
    const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({identifier,username:identifier,email:identifier,password,role})});
    const raw=await res.text();
    let data={};
    try{data=JSON.parse(raw)}catch{throw new Error('The EduShelf server returned an unexpected response. Please redeploy the latest EduShelf files on Render and try again.')} 
    if(!res.ok)throw new Error(data.error||'Login failed.');
    setSessionRole(data.user.role,data.user.email,data.user.username||'');
    appPageHistory=[];
    show(data.user.role==='school'?'schoolDashboard':data.user.role==='admin'?'admin':data.user.role==='teacher'?'teacher':data.user.role==='parent'?'parent':'learner',true);
    form.reset();
  }catch(err){alert(err.message)}
  finally{button.disabled=false;button.textContent='Sign In'}
}
function updatePublicUi(){const b=document.getElementById('communicationLaunch');if(!b)return; b.style.display=getSessionRole()?'block':'none';}
function clearSchoolDashboardState(){
  // Remove the visible school workspace immediately on logout. Any request
  // already in flight may still finish, so also invalidate its generation.
  window.__schoolDashboardGeneration=(window.__schoolDashboardGeneration||0)+1;
  __schoolManagementPromise=null;
  schoolWorkspaces=[];
  selectedSchoolId='';
  window.schoolData=null;
  window.schoolLoginMemberRole='';
  ['schoolControlCentre','schoolManagementCentre','schoolPlanCard','schoolWorkspaceCard','schoolGlanceCard','schoolWorkspace','schoolExecutiveOverview','schoolGeneralEssentialCards','schoolRoleWorkspacePanel','schoolNameGate'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.style.display='none';
  });
  showSchoolAuthGate();
}
async function logoutUser(){
  // Clear the UI before awaiting the server logout so protected school data
  // cannot remain visible during the network round-trip.
  clearSchoolDashboardState();
  try{await fetch('/api/auth/logout',{method:'POST',credentials:'include'})}catch{}
  sessionStorage.removeItem('tusomeLoggedIn');
  sessionStorage.removeItem('tusomeRole');
  sessionStorage.removeItem('tusomeCurrentUser');
  sessionStorage.removeItem('tusomeUsername');
  sessionStorage.removeItem('tusomeSchoolAccess');
  sessionStorage.removeItem('tusomeSchoolMemberRole');
  localStorage.removeItem('tusomeCurrentUser');
  localStorage.removeItem('tusomeUsername');
  appPageHistory=[];
  show('home',true);
}

function escapeHomeAIText(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderHomeAIAnswer(text){
  const raw=String(text||'').trim();
  const safe=escapeHomeAIText(raw);
  return safe.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/^### (.*)$/gm,'<h4>$1</h4>').replace(/^## (.*)$/gm,'<h3>$1</h3>').replace(/\n/g,'<br>');
}
function appendHomeAIMessage(kind,text){
  const box=document.getElementById('homeAIChat');
  const el=document.createElement('div');
  el.className='home-ai-msg '+kind;
  el.innerHTML=kind==='bot'?'<b>Tusome EduShelf AI:</b> '+renderHomeAIAnswer(text):'<b>You:</b> '+escapeHomeAIText(text).replace(/\n/g,'<br>');
  box.appendChild(el);
  box.scrollTop=box.scrollHeight;
  return el;
}
async function askHomeAIQuick(question){
  const input=document.getElementById('homeAIPrompt');
  input.value=question;
  await askHomeAI();
}
async function askHomeAI(e){
  if(e&&e.preventDefault)e.preventDefault();
  const input=document.getElementById('homeAIPrompt');
  const button=document.getElementById('homeAISend');
  const prompt=input.value.trim();
  if(!prompt){input.focus();return;}
  if(prompt.length>800){alert('Please keep your question below 800 characters.');return;}
  appendHomeAIMessage('user',prompt);
  input.value=''; button.disabled=true; button.textContent='⏳ Thinking...';
  const pending=appendHomeAIMessage('bot','Let me check how Tusome EduShelf can help...');
  try{
    const res=await fetch('/api/home-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
    const data=await parseApiResponse(res);
    if(!res.ok)throw new Error(data.error||'The AI assistant could not respond.');
    pending.innerHTML='<b>Tusome EduShelf AI:</b> '+renderHomeAIAnswer(data.answer);
  }catch(err){
    pending.innerHTML='<b>Tusome EduShelf AI:</b> Sorry, I could not respond right now. '+escapeHomeAIText(err.message);
  }finally{button.disabled=false;button.textContent='✨ Ask';}
}


function toggleHelpFaq(button){const item=button.closest('.help-faq');if(!item)return;const open=!item.classList.contains('open');item.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}
function filterHelp(){const q=(document.getElementById('helpSearch')?.value||'').trim().toLowerCase();const items=[...document.querySelectorAll('#helpFaqs .help-faq')];let visible=0;items.forEach(item=>{const match=!q||item.dataset.help.includes(q)||item.textContent.toLowerCase().includes(q);item.style.display=match?'block':'none';if(match)visible++});const no=document.getElementById('helpNoResults');if(no)no.style.display=visible?'none':'block'}


function openSchoolExamCreator(){
  const role=getSessionRole();
  const memberRole=window.schoolData?.school?.memberRole || sessionStorage.getItem('tusomeSchoolMemberRole') || '';
  if(!(role==='admin'||memberRole==='admin')){showToast?.('School administrator access is required to create an exam.','error');return;}
  show('exams');
  setTimeout(()=>{
    const panel=document.getElementById('examAdminPanel');
    if(panel)panel.style.display='block';
    panel?.scrollIntoView({behavior:'smooth',block:'start'});
    loadExamSetupV44();
  },80);
}


function escPdf(v){return pdfEscapeText(String(v??''));}
function buildSimpleReportPdf(title,meta,columns,rows,options={}){
  const W=842,H=595,m=24,head=54,rowH=22,tableTop=H-m-head,usable=W-2*m;
  const widths=options.widths||columns.map(()=>usable/columns.length); const pages=[];
  const per=Math.max(1,Math.floor((tableTop-m-18)/rowH)); for(let i=0;i<rows.length;i+=per)pages.push(rows.slice(i,i+per)); if(!pages.length)pages.push([]);
  const objs=[],add=o=>(objs.push(o),objs.length),cat=add(''),po=add(''),font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),refs=[];
  for(const chunk of pages){let c=['BT','/F1 14 Tf',`${m} ${H-m-14} Td`,'('+escPdf(title)+') Tj','ET','BT','/F1 8 Tf',`${m} ${H-m-29} Td`,'('+escPdf(meta)+') Tj','ET','0 G','0.8 w'];let y=tableTop;
    // header background + full grid
    c.push('0.90 g',`${m} ${y-rowH} ${usable} ${rowH} re f`,'0 G');
    let x=m; for(let j=0;j<=columns.length;j++){c.push(`${x} ${y} m ${x} ${y-(chunk.length+1)*rowH} l S`); if(j<columns.length)x+=widths[j];}
    c.push(`${m} ${y} m ${m+usable} ${y} l S`); for(let r=0;r<=chunk.length+1;r++){const yy=y-r*rowH;c.push(`${m} ${yy} m ${m+usable} ${yy} l S`)}
    c.push('BT','/F1 7 Tf');x=m;columns.forEach((h,j)=>{c.push(`1 0 0 1 ${x+3} ${y-15} Tm`,'('+escPdf(h).slice(0,80)+') Tj');x+=widths[j]});c.push('ET');
    chunk.forEach((row,ri)=>{const yy=y-(ri+2)*rowH;c.push('BT','/F1 7 Tf');let xx=m;row.forEach((v,j)=>{let val=String(v??'').replace(/[\r\n]+/g,' '),mc=Math.max(5,Math.floor(widths[j]/4.2));if(val.length>mc)val=val.slice(0,mc-3)+'...';c.push(`1 0 0 1 ${xx+3} ${yy+7} Tm`,'('+escPdf(val)+') Tj');xx+=widths[j]});c.push('ET')});
    const stream=c.join('\n'),cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`),pr=add(`<< /Type /Page /Parent ${po} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${cr} 0 R >>`);refs.push(pr);
  }
  objs[cat-1]=`<< /Type /Catalog /Pages ${po} 0 R >>`;objs[po-1]=`<< /Type /Pages /Kids [${refs.map(x=>x+' 0 R').join(' ')}] /Count ${refs.length} >>`;
  let pdf='%PDF-1.4\n% TusomeEduShelf\n',off=[0];for(let i=0;i<objs.length;i++){off[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`}const xr=pdf.length;pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objs.length;i++)pdf+=String(off[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objs.length+1} /Root ${cat} 0 R >>\nstartxref\n${xr}\n%%EOF\n`;return new Blob([pdf],{type:'application/pdf'});
}
async function fetchPublishedExamBundle(schoolId, classId){
  const r=await fetch('/api/schools/exams?schoolId='+encodeURIComponent(schoolId),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load examinations.');
  const exams=(d.exams||[]).filter(x=>String(x.classId||x.class_id)===String(classId)&&String(x.status||'').toLowerCase()==='published'&&String(x.approvalStatus||x.approval_status||'').toLowerCase()==='approved');
  const bundles=[];for(const ex of exams){const mr=await fetch('/api/schools/exams/'+encodeURIComponent(ex.examId)+'/marks?schoolId='+encodeURIComponent(schoolId),{credentials:'include'}),md=await parseApiResponse(mr);if(mr.ok)bundles.push({exam:md.exam||ex,rows:md.rows||[]});}return bundles;
}
function groupBundleByLearner(bundles){const map=new Map();for(const b of bundles){for(const x of b.rows){const key=String(x.learnerEmail||'');if(!key)continue;if(!map.has(key))map.set(key,{email:key,name:x.fullName||x.learnerName||key,admission:x.admissionNumber||'—',marks:[]});const z=map.get(key);z.name=x.fullName||x.learnerName||z.name;z.admission=x.admissionNumber||z.admission;const e=b.exam;z.marks.push({subject:e.subjectName||'Subject',markStatus:x.markStatus||'present',marks:x.marks,max:e.maxMarks,grade:x.grade||'—',comment:x.comment||''});}}return [...map.values()];}
function reportCardRows(learner){return learner.marks.map(x=>[x.subject,x.markStatus==='absent'?'X':x.markStatus==='irregular'?'Y':`${x.marks??'—'} / ${x.max}`,x.grade,x.comment]);}
function buildBulkReportCardsPdf(title,meta,learners){
  const W=842,H=595,m=30,cols=['Subject','Marks','Grade','Teacher feedback'],widths=[180,110,90,402],objects=[],add=o=>(objects.push(o),objects.length),cat=add(''),po=add(''),font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),refs=[];
  for(const l of learners){let c=['BT','/F1 14 Tf',`${m} ${H-m-14} Td`,'('+escPdf(title)+') Tj','ET','BT','/F1 9 Tf',`${m} ${H-m-30} Td`,'('+escPdf(`${l.name} · Admission No. ${l.admission} · ${meta}`)+') Tj','ET'];let y=H-m-52,rowH=22,tw=widths.reduce((a,b)=>a+b,0);c.push('0.90 g',`${m} ${y-rowH} ${tw} ${rowH} re f`,'0 G','0.8 w');let x=m;for(let j=0;j<=cols.length;j++){c.push(`${x} ${y} m ${x} ${y-(l.marks.length+2)*rowH} l S`);if(j<cols.length)x+=widths[j]}for(let r=0;r<=l.marks.length+1;r++){const yy=y-r*rowH;c.push(`${m} ${yy} m ${m+tw} ${yy} l S`)}c.push('BT','/F1 7 Tf');x=m;cols.forEach((h,j)=>{c.push(`1 0 0 1 ${x+3} ${y-15} Tm`,'('+escPdf(h)+') Tj');x+=widths[j]});c.push('ET');l.marks.forEach((z,i)=>{const yy=y-(i+2)*rowH;c.push('BT','/F1 7 Tf');const vals=[z.subject,z.markStatus==='absent'?'X':z.markStatus==='irregular'?'Y':`${z.marks??'—'} / ${z.max}`,z.grade||'—',z.comment||''];let xx=m;vals.forEach((v,j)=>{let val=String(v).replace(/[\r\n]+/g,' '),mc=Math.max(5,Math.floor(widths[j]/4.2));if(val.length>mc)val=val.slice(0,mc-3)+'...';c.push(`1 0 0 1 ${xx+3} ${yy+7} Tm`,'('+escPdf(val)+') Tj');xx+=widths[j]});c.push('ET')});const mean=learnerMean(l);c.push('BT','/F1 9 Tf',`${m} ${y-(l.marks.length+2)*rowH-18} Td`,'('+escPdf(`Overall mean: ${mean}%`)+') Tj','ET');const stream=c.join('\n'),cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`),pr=add(`<< /Type /Page /Parent ${po} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${cr} 0 R >>`);refs.push(pr)}
  objects[cat-1]=`<< /Type /Catalog /Pages ${po} 0 R >>`;objects[po-1]=`<< /Type /Pages /Kids [${refs.map(x=>x+' 0 R').join(' ')}] /Count ${refs.length} >>`;let pdf='%PDF-1.4\n% TusomeEduShelf\n',off=[0];for(let i=0;i<objects.length;i++){off[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xr=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objects.length;i++)pdf+=String(off[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${cat} 0 R >>\nstartxref\n${xr}\n%%EOF\n`;return new Blob([pdf],{type:'application/pdf'});
}

function pdfText(c,x,y,size,text){c.push('BT',`/F1 ${size} Tf`,`1 0 0 1 ${x} ${y} Tm`,'('+escPdf(String(text??''))+') Tj','ET')}
function pdfLine(c,x1,y1,x2,y2){c.push(`${x1} ${y1} m ${x2} ${y2} l S`)}
function pdfRect(c,x,y,w,h,fill=false){if(fill)c.push('0.93 g');c.push(`${x} ${y} ${w} ${h} re`,fill?'f':'S');if(fill)c.push('0 g','0 G')}
function pdfWrapped(c,x,y,w,size,text,leading=10,maxLines=3){const raw=String(text??'').replace(/\s+/g,' ').trim();if(!raw)return y;const max=Math.max(8,Math.floor(w/(size*0.52)));let words=raw.split(' '),line='',lines=[];for(const word of words){const test=line?line+' '+word:word;if(test.length>max){lines.push(line);line=word}else line=test}if(line)lines.push(line);lines=lines.slice(0,maxLines);lines.forEach((ln,i)=>pdfText(c,x,y-i*leading,size,ln));return y-lines.length*leading}
function cbeGrade(p){
  if(p==null||!Number.isFinite(Number(p)))return '—';
  p=Number(p);
  if(p>=90)return 'EE1';
  if(p>=75)return 'EE2';
  if(p>=58)return 'ME1';
  if(p>=41)return 'ME2';
  if(p>=31)return 'AE1';
  if(p>=21)return 'AE2';
  if(p>=11)return 'BE1';
  return 'BE2';
}
function reportGrade(p){return cbeGrade(p)}
function reportPct(x){return x?.markStatus==='present'&&Number.isFinite(Number(x.marks))&&Number(x.maxMarks)>0?Number(x.marks)/Number(x.maxMarks)*100:null}
function reportCardPages(learner,schoolName='Tusome EduShelf',meta={}){
  const W=842,H=595,m=28,objects=[],add=o=>(objects.push(o),objects.length),cat=add(''),po=add(''),font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),refs=[];
  const subjects=learner.subjects||learner.marks||[], mean=learner.mean!=null?Number(learner.mean):(()=>{const v=subjects.map(reportPct).filter(x=>x!==null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null})();
  const total=learner.totalMarks!=null?learner.totalMarks:subjects.filter(x=>x.markStatus==='present').reduce((a,x)=>a+Number(x.marks||0),0), totalMax=learner.totalMax!=null?learner.totalMax:subjects.filter(x=>x.markStatus==='present').reduce((a,x)=>a+Number(x.maxMarks||0),0);
  const currentTitle=learner.title||meta.title||'Published Examination', examDate=learner.examDate||meta.examDate||'';
  const pages=[];
  // Page 1: identity, performance banner, subject table, subject-vs-class chart.
  {let c=['0 G','0.8 w'];pdfText(c,m,H-m-16,16,schoolName);pdfText(c,m,H-m-31,9,'OFFICIAL LEARNER REPORT CARD');
   pdfRect(c,m,H-m-108,W-2*m,56,true);pdfText(c,m+10,H-m-72,13,learner.fullName||learner.name||'Learner');pdfText(c,m+10,H-m-91,9,`Admission No.: ${learner.admissionNumber||learner.admission||'—'}   ·   ${learner.className||meta.className||'—'} ${learner.stream||meta.stream?'— '+(learner.stream||meta.stream):''}`);pdfText(c,m+420,H-m-72,9,`Baseline KCPE/KPSEA: ${learner.baseline??'Not set'}`);pdfText(c,m+420,H-m-91,9,`Exam: ${currentTitle}   ·   Session: ${examDate||'—'}`);
   const by=H-m-145;pdfRect(c,m,by,W-2*m,34,true);pdfText(c,m+10,by+21,9,`TOTAL ${total.toFixed?total.toFixed(2):total} / ${totalMax||'—'}`);pdfText(c,m+150,by+21,9,`MEAN ${mean==null?'—':mean.toFixed(2)+'%'}`);pdfText(c,m+270,by+21,9,`GRADE ${learner.meanGrade||reportGrade(mean)}`);pdfText(c,m+390,by+21,9,`STREAM RANK ${learner.streamRank?learner.streamRank+' / '+(learner.streamCount||'—'):'—'}`);pdfText(c,m+545,by+21,9,`OVERALL RANK ${learner.overallRank?learner.overallRank+' / '+(learner.overallCount||'—'):'—'}`);pdfText(c,m+10,by+7,8,`Deviation / trend: ${learner.targetDelta==null?'Not available':(learner.targetDelta>=0?'+':'')+Number(learner.targetDelta).toFixed(2)+' pts vs previous cycle'}`);
   const top=by-18, rowH=20, cols=[m,m+170,m+260,m+330,m+415,m+500,m+W-2*m];pdfRect(c,m,top-rowH,W-2*m,rowH,true);cols.forEach(x=>pdfLine(c,x,top,x,top-(subjects.length+1)*rowH));for(let r=0;r<=subjects.length+1;r++)pdfLine(c,m,top-r*rowH,m+W-2*m,top-r*rowH);['Subject','Mark','%','Grade','Class Mean','Target','Feedback'].forEach((h,i)=>pdfText(c,cols[i]+3,top-14,7,h));subjects.forEach((x,i)=>{const y=top-(i+2)*rowH,p=reportPct(x);pdfText(c,cols[0]+3,y+6,7,x.subjectName||x.subject||'Subject');pdfText(c,cols[1]+3,y+6,7,x.markStatus==='absent'?'X':x.markStatus==='irregular'?'Y':`${x.marks??'—'} / ${x.maxMarks??'—'}`);pdfText(c,cols[2]+3,y+6,7,p==null?'—':p.toFixed(1));pdfText(c,cols[3]+3,y+6,7,x.grade||'—');pdfText(c,cols[4]+3,y+6,7,meta.subjectMeans?.[x.subjectName]!=null?Number(meta.subjectMeans[x.subjectName]).toFixed(1):'—');pdfText(c,cols[5]+3,y+6,7,x.target??'Not set');pdfWrapped(c,cols[6]+3,y+10,cols[6+0]?m+W-2*m-cols[6]-6:90,6,x.comment||'—',7,2)});
   const chartY=Math.max(72,top-(subjects.length+2)*rowH-30), chartH=105, chartW=W-2*m;pdfText(c,m,chartY+chartH+8,9,'Subject Performance vs Class Mean');pdfLine(c,m,chartY,m,chartY+chartH);pdfLine(c,m,chartY,m+chartW,chartY);const n=Math.max(1,subjects.length),bw=Math.min(48,(chartW-30)/(n*2.3));subjects.forEach((x,i)=>{const p=reportPct(x),cm=meta.subjectMeans?.[x.subjectName]!=null?Number(meta.subjectMeans[x.subjectName]):null,base=m+18+i*(chartW-28)/n;const ph=p==null?0:chartH*Math.min(1,p/100),ch=cm==null?0:chartH*Math.min(1,cm/100);pdfRect(c,base,chartY,bw,ph,false);pdfRect(c,base+bw+4,chartY,bw,ch,false);pdfText(c,base,chartY-10,6,(x.subjectName||'').slice(0,8));});pdfText(c,m+chartW-130,chartY+chartH-5,6,'Student □   Class mean □');
   const stream=c.join('\n'),cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`),pr=add(`<< /Type /Page /Parent ${po} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${cr} 0 R >>`);refs.push(pr)}
  // Page 2: trend, targets, endorsements, next-term information.
  {let c=['0 G','0.8 w'];pdfText(c,m,H-m-16,15,schoolName);pdfText(c,m,H-m-31,9,'PERFORMANCE ANALYTICS & OFFICIAL ENDORSEMENTS');const y0=H-m-58;pdfRect(c,m,y0-190,W-2*m,170,false);pdfText(c,m+10,y0-15,10,'Longitudinal Performance Trend');const hist=learner.history||[];const gx=m+40,gy=y0-165,gw=W-2*m-70,gh=120;pdfLine(c,gx,gy,gx,gy+gh);pdfLine(c,gx,gy,gx+gw,gy);if(hist.length){hist.forEach((h,i)=>{const x=gx+(hist.length===1?gw/2:i*gw/(hist.length-1)),v=Math.max(0,Math.min(100,Number(h.mean)||0)),y=gy+gh*v/100;pdfRect(c,x-2,y-2,4,4,false);if(i)pdfLine(c,prevX,prevY,x,y);pdfText(c,x-20,gy-12,6,String(h.label||'').slice(0,12));prevX=x;prevY=y});}else pdfText(c,gx+10,gy+55,8,'No previous published examination cycle is available.');pdfText(c,gx+gw-45,gy+gh+5,6,'100%');pdfText(c,gx+gw-35,gy+5,6,'0%');
   const boxY=y0-214;pdfText(c,m,boxY,10,'Target Scores & Tracking');pdfRect(c,m,boxY-82,W-2*m,66,true);pdfText(c,m+10,boxY-35,8,`Target grade: ${learner.targetGrade||'Not set'}   ·   Target score: ${learner.targetScore??'Not set'}   ·   Actual: ${mean==null?'—':mean.toFixed(2)+'% / '+(learner.meanGrade||reportGrade(mean))}`);pdfText(c,m+10,boxY-55,8,`Baseline KCPE/KPSEA entry: ${learner.baseline??'Not set'}   ·   Deviation: ${learner.targetDelta==null?'Not available':(learner.targetDelta>=0?'+':'')+Number(learner.targetDelta).toFixed(2)+' points'}`);
   const ey=boxY-105;pdfText(c,m,ey,10,'Official Endorsements');pdfRect(c,m,ey-120,W-2*m,105,false);pdfText(c,m+10,ey-22,8,"Class Teacher's Remark");pdfWrapped(c,m+10,ey-37,W/2-25,8,learner.teacherRemark||'Not set',10,4);pdfText(c,m+W/2+5,ey-22,8,"Principal's Remark & Digital Stamp");pdfWrapped(c,m+W/2+5,ey-37,W/2-25,8,learner.principalRemark||'Not set',10,4);pdfRect(c,m+W/2+5,ey-108,120,34,false);pdfText(c,m+W/2+15,ey-95,7,'OFFICIAL SCHOOL STAMP /');pdfText(c,m+W/2+15,ey-106,7,'SIGNATURE');
   const fy=ey-142;pdfRect(c,m,fy-62,W-2*m,50,true);pdfText(c,m+10,fy-30,8,`Next term opening: ${learner.openingDate||'Not set'}   ·   Closing date: ${learner.closingDate||'Not set'}`);pdfText(c,m+10,fy-47,8,`Fee expectation: ${learner.feeExpectation||'Not set'}`);pdfText(c,m+W-180,fy-30,7,'Official result: PUBLISHED');pdfText(c,m+W-180,fy-47,7,`Generated: ${new Date().toLocaleDateString()}`);
   const stream=c.join('\n'),cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`),pr=add(`<< /Type /Page /Parent ${po} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${cr} 0 R >>`);refs.push(pr)}
  objects[cat-1]=`<< /Type /Catalog /Pages ${po} 0 R >>`;objects[po-1]=`<< /Type /Pages /Kids [${refs.map(x=>x+' 0 R').join(' ')}] /Count ${refs.length} >>`;let pdf='%PDF-1.4\n% TusomeEduShelf\n',off=[0];for(let i=0;i<objects.length;i++){off[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xr=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objects.length;i++)pdf+=String(off[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${cat} 0 R >>\nstartxref\n${xr}\n%%EOF\n`;return new Blob([pdf],{type:'application/pdf'});
}

function buildRichBulkPdf(learners,schoolName){
  // v126.33 - single, authoritative A4 portrait report-card renderer.
  // Every learner is exactly one page; the same builder is used by admin,
  // learner and parent report-card downloads.
  const W=595,H=842;
  const objects=[],add=o=>(objects.push(o),objects.length),cat=add(''),po=add('');
  const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const refs=[];
  for(const learner of (learners||[])){
    const streams=reportCardPagesForObjects(learner,schoolName);
    for(const stream of streams){
      const cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      refs.push(add(`<< /Type /Page /Parent ${po} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${cr} 0 R >>`));
    }
  }
  if(!refs.length){
    const stream='BT /F1 12 Tf 40 780 Td (No report-card data available.) Tj ET';
    const cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    refs.push(add(`<< /Type /Page /Parent ${po} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${cr} 0 R >>`));
  }
  objects[cat-1]=`<< /Type /Catalog /Pages ${po} 0 R >>`;
  objects[po-1]=`<< /Type /Pages /Kids [${refs.map(x=>x+' 0 R').join(' ')}] /Count ${refs.length} >>`;
  let pdf='%PDF-1.4\n% TusomeEduShelf v126.33\n',off=[0];
  for(let i=0;i<objects.length;i++){off[i+1]=pdf.length;pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
  const xr=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=objects.length;i++)pdf+=String(off[i]).padStart(10,'0')+' 00000 n \n';
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${cat} 0 R >>\nstartxref\n${xr}\n%%EOF\n`;
  return new Blob([pdf],{type:'application/pdf'});
}

function reportCardPagesForObjects(learner,schoolName){
  // v126.33 - reference-style A4 portrait, one complete learner per page.
  const W=595,H=842,m=30,innerW=W-2*m;
  const subjects=(learner.subjects||learner.marks||[]).map(x=>({...x,subjectName:x.subjectName||x.subject||'Subject',maxMarks:x.maxMarks??x.max}));
  const pct=x=>reportPct(x);
  const vals=subjects.map(pct).filter(v=>v!==null);
  const mean=learner.mean!=null&&Number.isFinite(Number(learner.mean))?Number(learner.mean):(vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null);
  const present=subjects.filter(x=>x.markStatus==='present'&&Number.isFinite(Number(x.marks)));
  const total=learner.totalMarks!=null?Number(learner.totalMarks):present.reduce((a,x)=>a+Number(x.marks||0),0);
  const totalMax=learner.totalMax!=null?Number(learner.totalMax):present.reduce((a,x)=>a+Number(x.maxMarks||0),0);
  const title=learner.title||'Published Examination';
  const date=learner.examDate?String(learner.examDate).slice(0,10):'-';
  const safe=v=>String(v??'-');
  const rankText=(r,c)=>r?`${r} / ${c||'-'}`:'-';
  const grade=mean==null?'-':cbeGrade(mean);
  const initials=(String(schoolName||'School').match(/[A-Za-z]/g)||['S']).slice(0,2).join('').toUpperCase();
  const objects=[],add=o=>(objects.push(o),objects.length),cat=add(''),po=add('');
  const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const bold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const refs=[];
  const setFill=(c,r,g,b)=>c.push(`${r} ${g} ${b} rg`), reset=c=>c.push('0 g');
  const setStroke=(c,r,g,b)=>c.push(`${r} ${g} ${b} RG`), resetStroke=c=>c.push('0 G');
  const rect=(c,x,y,w,h,fill=null,stroke=true)=>{if(fill){setFill(c,...fill);c.push(`${x} ${y} ${w} ${h} re f`);reset(c)}if(stroke)c.push(`${x} ${y} ${w} ${h} re S`)};
  const line=(c,x1,y1,x2,y2)=>c.push(`${x1} ${y1} m ${x2} ${y2} l S`);
  const txt=(c,x,y,size,text,b=false)=>c.push('BT',`/${b?'F2':'F1'} ${size} Tf`,`1 0 0 1 ${x} ${y} Tm`,'('+escPdf(String(text??''))+') Tj','ET');
  const wrap=(c,x,y,w,size,text,leading=8,maxLines=2,b=false)=>{
    const raw=String(text??'').replace(/\s+/g,' ').trim(); if(!raw)return 0;
    const max=Math.max(10,Math.floor(w/(size*.50))); let lineText='',lines=[];
    for(const word of raw.split(' ')){const test=lineText?lineText+' '+word:word;if(test.length>max){if(lineText)lines.push(lineText);lineText=word}else lineText=test;}
    if(lineText)lines.push(lineText); lines=lines.slice(0,maxLines);
    lines.forEach((z,i)=>txt(c,x,y-i*leading,size,z,b)); return lines.length*leading;
  };
  const c=['0 G','0 g','0.7 w'];
  const section=(y,label)=>{txt(c,m,y,7.5,label,true);line(c,m,y-5,W-m,y-5);};

  // HEADER - deliberately compact but prominent, matching the supplied reference.
  setFill(c,0.04,0.55,0.78);c.push(`${m} ${H-68} 48 48 re f`);reset(c);
  txt(c,m+13,H-49,15,initials,true);
  txt(c,m+60,H-33,16.5,safe(schoolName).slice(0,58),true);
  txt(c,m+60,H-47,6.5,'OFFICIAL STUDENT ACADEMIC REPORT',true);
  txt(c,W-m-152,H-29,6.2,'POWERED BY TUSOMEEDUSHELF',true);
  txt(c,m+60,H-61,8.2,`ACADEMIC PERFORMANCE REPORT - ${safe(title).slice(0,54)}`,true);
  txt(c,W-m-110,H-61,6.2,date,true);
  line(c,m,H-77,W-m,H-77);

  // LEARNER DETAILS.
  const idTop=H-88,idH=62,idY=idTop-idH;
  rect(c,m,idY,innerW,idH,[0.94,0.97,0.985],true);
  const x1=m+9,x2=m+190,x3=m+365;
  txt(c,x1,idTop-15,5.8,'LEARNER NAME',true);txt(c,x1,idTop-29,9.3,safe(learner.fullName||learner.name||'Learner').slice(0,28),true);
  txt(c,x2,idTop-15,5.8,'ADMISSION NO.',true);txt(c,x2,idTop-29,9.3,safe(learner.admissionNumber||learner.admission).slice(0,22),true);
  txt(c,x3,idTop-15,5.8,'CLASS & STREAM',true);txt(c,x3,idTop-29,8.8,`${safe(learner.className)}${learner.stream?' - '+safe(learner.stream):''}`.slice(0,24),true);
  txt(c,x1,idTop-47,5.8,'KCPE/KPSEA ENTRY SCORE',true);txt(c,x1,idTop-58,7.4,safe(learner.baseline||'Not set'),true);
  txt(c,x2,idTop-47,5.8,'EXAM SESSION',true);txt(c,x2,idTop-58,7.4,safe(title).slice(0,24),true);
  txt(c,x3,idTop-47,5.8,'GENDER / EXAM DATE',true);txt(c,x3,idTop-58,7.4,`${safe(learner.gender||'Not set')} | ${date}`.slice(0,25),true);

  // OVERALL PERFORMANCE.
  const perfTop=idY-11,perfH=50,perfY=perfTop-perfH;
  rect(c,m,perfY,innerW,perfH,[0.89,0.96,0.99],true);
  const metrics=[
    ['TOTAL MARKS',`${Number(total).toFixed(0)} / ${totalMax||'-'}`],
    ['MEAN SCORE',mean==null?'-':`${mean.toFixed(2)}%`],
    ['CBE LEVEL',grade],
    ['STREAM RANK',rankText(learner.streamRank,learner.streamCount)],
    ['OVERALL RANK',rankText(learner.overallRank,learner.overallCount)],
    ['DEVIATION',learner.targetDelta==null?'-':`${Number(learner.targetDelta)>=0?'+':''}${Number(learner.targetDelta).toFixed(2)}`]
  ];
  const mw=innerW/6;
  metrics.forEach((a,i)=>{const x=m+i*mw+6;txt(c,x,perfTop-16,5.3,a[0],true);txt(c,x,perfTop-33,8.8,a[1],true);});
  txt(c,m+6,perfTop-44,4.9,learner.targetDelta==null?'Performance movement: Not available':`Performance movement: ${Number(learner.targetDelta)>=0?'Improved by ':'Changed by '}${Math.abs(Number(learner.targetDelta)).toFixed(2)} points vs previous cycle`);

  // SUBJECT TABLE.
  const tableLabelY=perfY-12; section(tableLabelY,'SUBJECT RESULTS');
  const tableTop=tableLabelY-10;
  const n=Math.max(1,subjects.length);
  const rowH=n<=5?21:n<=7?18:n<=9?16:14;
  const headerH=rowH;
  const tableH=(n+1)*rowH;
  const tableBottom=tableTop-tableH;
  const cols=[m,m+103,m+160,m+204,m+268,m+326,m+377,W-m];
  rect(c,m,tableBottom,innerW,tableH,[1,1,1],true);
  rect(c,m,tableTop-headerH,innerW,headerH,[0.05,0.11,0.18],true);
  cols.forEach(x=>line(c,x,tableTop,x,tableBottom));
  for(let r=0;r<=n+1;r++)line(c,m,tableTop-r*rowH,W-m,tableTop-r*rowH);
  ['SUBJECT','MARKS','%','CBE','CLASS MEAN','TARGET','FEEDBACK'].forEach((h,i)=>{c.push('1 1 1 rg');txt(c,cols[i]+3,tableTop-rowH+Math.max(4,rowH-11),rowH>=18?5.5:4.6,h,true);reset(c)});
  subjects.forEach((x,i)=>{
    const rowTop=tableTop-(i+1)*rowH,rowY=rowTop-rowH;
    if(i%2===1)rect(c,m,rowY,innerW,rowH,[0.95,0.98,0.99],false);
    const p=pct(x),cm=learner.subjectMeans?.[x.subjectName];
    const baseY=rowY+Math.max(4,Math.floor(rowH/2)-2);
    txt(c,cols[0]+3,baseY,rowH>=18?5.7:4.7,safe(x.subjectName).slice(0,22),true);
    txt(c,cols[1]+3,baseY,rowH>=18?5.5:4.6,x.markStatus==='absent'?'X':x.markStatus==='irregular'?'Y':`${x.marks??'-'} / ${x.maxMarks??'-'}`);
    txt(c,cols[2]+3,baseY,rowH>=18?5.5:4.6,p==null?'-':p.toFixed(1));
    txt(c,cols[3]+3,baseY,rowH>=18?5.5:4.6,cbeGrade(p),true);
    txt(c,cols[4]+3,baseY,rowH>=18?5.5:4.6,cm==null?'-':Number(cm).toFixed(1));
    txt(c,cols[5]+3,baseY,rowH>=18?5.5:4.6,x.target??'-');
    wrap(c,cols[6]+3,baseY+2,W-m-cols[6]-5,rowH>=18?4.9:4.1,x.comment||'-',rowH>=18?5:4.4,1);
  });

  // ANALYTICS - two compact charts directly below the subject table.
  const chartTitleY=tableBottom-12,chartH=104,gap=10,chartW=(innerW-gap)/2;
  txt(c,m,chartTitleY,7.2,'SUBJECT MARK VS CLASS MEAN',true);
  txt(c,m+chartW+gap,chartTitleY,7.2,'LONGITUDINAL PERFORMANCE TREND',true);
  const chartTop=chartTitleY-8,chartBottom=chartTop-chartH;
  // Chart 1: paired bars.
  const gx=m+22,gy=chartBottom+18,gw=chartW-30,gh=chartH-28;
  line(c,gx,gy,gx,gy+gh);line(c,gx,gy,gx+gw,gy);
  [0,50,100].forEach(v=>{const yy=gy+gh*v/100;line(c,gx,yy,gx+gw,yy);txt(c,m+2,yy-2,4.1,String(v));});
  const step=gw/Math.max(1,n);
  subjects.forEach((x,i)=>{
    const p=pct(x),cm=learner.subjectMeans?.[x.subjectName],bx=gx+2+i*step,bw=Math.min(9,Math.max(3,step/4));
    const ph=p==null?0:gh*Math.min(1,p/100),ch=cm==null?0:gh*Math.min(1,Number(cm)/100);
    if(ch){setFill(c,0.72,0.78,0.84);c.push(`${bx+bw+2} ${gy} ${bw} ${ch} re f`);reset(c)}
    if(ph){setFill(c,0.05,0.55,0.78);c.push(`${bx} ${gy} ${bw} ${ph} re f`);reset(c)}
    txt(c,bx-1,gy-10,3.8,safe(x.subjectName).slice(0,7));
  });
  txt(c,m+8,chartBottom+4,4.0,'Student');txt(c,m+42,chartBottom+4,4.0,'Class mean');

  // Chart 2: trend line.
  const tx=m+chartW+gap+22,ty=gy,tW=chartW-30,tH=gh;
  line(c,tx,ty,tx,ty+tH);line(c,tx,ty,tx+tW,ty);
  [0,50,100].forEach(v=>{const yy=ty+tH*v/100;line(c,tx,yy,tx+tW,yy);txt(c,m+chartW+gap+2,yy-2,4.1,String(v));});
  const hist=Array.isArray(learner.history)?learner.history:[];let px=null,py=null;
  hist.forEach((h,i)=>{
    const xx=tx+(hist.length===1?tW/2:i*tW/(hist.length-1)),v=Math.max(0,Math.min(100,Number(h.mean)||0)),yy=ty+tH*v/100;
    if(px!==null)line(c,px,py,xx,yy);rect(c,xx-2,yy-2,4,4,[0.05,0.55,0.78],false);txt(c,xx-10,ty-10,3.7,String(h.label||'').slice(0,9));txt(c,xx-8,yy+6,3.8,v.toFixed(0));px=xx;py=yy;
  });
  if(!hist.length)txt(c,tx+10,ty+tH/2,5.2,'No previous published cycle available.');

  // COMMENTS.
  const commentTop=chartBottom-10,commentH=76,half=(innerW-10)/2;
  section(commentTop,'OFFICIAL ENDORSEMENTS');
  const boxTop=commentTop-10,boxY=boxTop-commentH;
  rect(c,m,boxY,half,commentH,[0.94,0.97,0.98],true);
  rect(c,m+half+10,boxY,half,commentH,[0.94,0.97,0.98],true);
  txt(c,m+8,boxTop-14,6.2,'CLASS TEACHER REMARK',true);
  wrap(c,m+8,boxTop-27,half-16,5.4,learner.teacherRemark||'Automatic comment not available.',7,5);
  txt(c,m+half+18,boxTop-14,6.2,"PRINCIPAL'S REMARK",true);
  wrap(c,m+half+18,boxTop-27,half-32,5.4,learner.principalRemark||'Automatic comment not available.',7,5);
  rect(c,m+half+18,boxY+8,100,18,[0.90,0.94,0.97],true);txt(c,m+half+25,boxY+15,4.4,'OFFICIAL STAMP / SIGNATURE',true);

  // TARGET TRACKING STRIP.
  const targetTop=boxY-10,targetH=38,targetY=targetTop-targetH;
  rect(c,m,targetY,innerW,targetH,[0.05,0.10,0.17],true);c.push('1 1 1 rg');
  txt(c,m+7,targetTop-13,5.2,'TARGET',true);
  txt(c,m+53,targetTop-13,4.9,`Target grade: ${safe(learner.targetGrade||'Not set')}`);
  txt(c,m+155,targetTop-13,4.9,`Target score: ${safe(learner.targetScore||'Not set')}`);
  txt(c,m+258,targetTop-13,4.9,`Actual: ${grade}`);
  txt(c,m+338,targetTop-13,4.9,`Class mean: ${learner.classMean==null?'-':Number(learner.classMean).toFixed(1)+'%'}`);
  txt(c,m+445,targetTop-13,4.9,`Deviation: ${learner.targetDelta==null?'-':(Number(learner.targetDelta)>=0?'+':'')+Number(learner.targetDelta).toFixed(2)}`);
  c.push('0 g');
  txt(c,m,targetY-10,4.6,`Next term opening: ${safe(learner.openingDate||'Not set')}   |   Closing: ${safe(learner.closingDate||'Not set')}   |   Fee expectation: ${safe(learner.feeExpectation||'Not set')}`);

  // FOOTER.
  const footerY=targetY-28;line(c,m,footerY,W-m,footerY);
  txt(c,m,footerY-11,4.1,'CBE LEVELS: EE1/EE2 - Exceeding | ME1/ME2 - Meeting | AE1/AE2 - Approaching | BE1/BE2 - Below.',false);
  txt(c,m,footerY-21,4.1,`School: ${safe(schoolName)}   |   Official result: PUBLISHED`,false);
  txt(c,W-m-48,footerY-21,4.1,'Page 1 of 1',false);

  const stream=c.join('\n');
  const cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const pr=add(`<< /Type /Page /Parent ${po} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${cr} 0 R >>`);
  refs.push(pr);
  objects[cat-1]=`<< /Type /Catalog /Pages ${po} 0 R >>`;
  objects[po-1]=`<< /Type /Pages /Kids [${refs.map(x=>x+' 0 R').join(' ')}] /Count ${refs.length} >>`;
  return [stream];
}

async function fetchRichReportContext(params={}){const q=new URLSearchParams();if(params.learnerEmail)q.set('learnerEmail',params.learnerEmail);if(params.classId)q.set('classId',params.classId);if(params.schoolId)q.set('schoolId',params.schoolId);const r=await fetch('/api/report-cards/context?'+q.toString(),{credentials:'include',cache:'no-store'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load report-card data.');return d}
function richLearnerFromContext(ctx){return {...ctx.learner,...ctx.current,baseline:ctx.baseline,targetGrade:ctx.targetGrade,targetScore:ctx.targetScore,teacherRemark:ctx.teacherRemark,principalRemark:ctx.principalRemark,openingDate:ctx.openingDate,closingDate:ctx.closingDate,feeExpectation:ctx.feeExpectation}}
function buildRichBulkReportPdf(ctx,schoolName){const learners=(ctx.classLearners||[]).map(x=>({...x,stream:ctx.learner?.stream,className:ctx.learner?.className,grade:ctx.learner?.grade,title:ctx.current?.title,examDate:ctx.current?.examDate,baseline:null,targetGrade:null,targetScore:null,teacherRemark:null,principalRemark:null,openingDate:null,closingDate:null,feeExpectation:null}));const objects=[];/* build each learner separately then merge PDFs is not possible client-side; use single rich builder below */return learners}

function learnerMean(l){const vals=l.marks.filter(x=>x.markStatus==='present'&&Number.isFinite(Number(x.marks))&&Number(x.max)>0).map(x=>Number(x.marks)/Number(x.max)*100);return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2):'—';}
async function downloadAdminStreamReportCardsPdf(){try{const cid=document.getElementById('reportClass')?.value||window.__selectedReportClassId||'';if(!cid)throw new Error('Select a class/stream first.');const cls=(window.__examClasses||[]).find(x=>String(x.classId||x.id)===String(cid));const ctx=await fetchRichReportContext({classId:cid,schoolId:selectedSchoolId});if(!ctx.classLearners?.length)throw new Error('No published results are available for this stream.');const pages=ctx.classLearners.map(x=>({...x,className:cls?.className||ctx.learner?.className,grade:cls?.grade||ctx.learner?.grade,stream:cls?.stream||ctx.learner?.stream,title:ctx.current?.title,examDate:ctx.current?.examDate,subjectMeans:ctx.current?.subjectMeans,classMean:ctx.current?.classMean,teacherRemark:x.teacherRemark,principalRemark:x.principalRemark,targetDelta:x.targetDelta}));const pdf=buildRichBulkPdf(pages,ctx.schoolName||'Tusome EduShelf');downloadTextFile(pdf,'Tusome_Report_Cards_'+(cls?.grade||'Class')+'_'+(cls?.stream||'Stream')+'.pdf','application/pdf');showToast?.(`Downloaded ${pages.length} enhanced stream report cards.`,'success')}catch(e){showToast?.(e.message||'Could not create stream report cards.','error')}}
async function downloadAdminGeneralResultsPdf(){
  try{
    const cid=document.getElementById('reportClass')?.value||window.__selectedReportClassId||'';
    if(!cid)throw new Error('Select a class/stream first.');
    if(!selectedSchoolId)throw new Error('No active school workspace is selected.');
    const r=await fetch('/api/schools/general-results?classId='+encodeURIComponent(cid),{credentials:'include',cache:'no-store'});
    const d=await parseApiResponse(r); if(!r.ok)throw new Error(d.error||'Could not load general results.');
    const cls=d.class||{}; const raw=d.rows||[];
    if(!raw.length)throw new Error('No published results are available for this stream. Approve & Publish the mark sheets first.');
    const subjects=[...new Set(raw.map(x=>x.subjectName||'Subject'))];
    const map=new Map();
    for(const x of raw){const key=String(x.learnerEmail||'');if(!key)continue;if(!map.has(key))map.set(key,{name:x.fullName||key,admission:x.admissionNumber||'—',marks:[]});const l=map.get(key);l.marks.push(x)}
    const learners=[...map.values()];
    const rows=learners.map(l=>[l.name,l.admission,...subjects.map(s=>{const x=l.marks.find(y=>y.subjectName===s);if(!x)return '—';if(x.markStatus==='absent')return 'X';if(x.markStatus==='irregular')return 'Y';return x.marks==null?'—':`${x.marks}/${x.maxMarks}`}),(()=>{const vals=l.marks.filter(x=>x.markStatus==='present'&&x.marks!=null&&Number(x.maxMarks)>0).map(x=>Number(x.marks)/Number(x.maxMarks)*100);return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2)+'%':'—'})()]);
    const subjectWidth=Math.max(28,Math.min(82,(794-145-70-55)/Math.max(subjects.length,1))); const widths=[145,70,...subjects.map(()=>subjectWidth),55];
    const pdf=buildSimpleReportPdf('Tusome EduShelf — General Results',`${cls.className||''} · ${cls.grade||''} · ${cls.stream||'General'} · ${learners.length} learners · Official published results`,['Learner','Adm. No.',...subjects,'Mean'],rows,{widths});
    downloadTextFile(pdf,'Tusome_General_Results_'+(cls.grade||'Class')+'_'+(cls.stream||'Stream')+'.pdf','application/pdf');
    showToast?.(`General Results downloaded for ${learners.length} learners.`,'success');
  }catch(e){showToast?.(e.message||'Could not create general results PDF.','error')}
}
async function getCurrentLearnerPublishedBundle(){const r=await fetch('/api/learner/exams',{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load published results.');return d.rows||[];}
async function downloadMyGeneralResultsPdf(){try{const rows=await getCurrentLearnerPublishedBundle();if(!rows.length)throw new Error('No published results are available yet.');const subjects=[...new Set(rows.map(x=>x.subjectName||'Subject'))];const data=subjects.map(s=>{const x=rows.find(y=>y.subjectName===s);return [s,x?.marks!=null?`${x.marks}/${x.maxMarks}`:x?.markStatus==='absent'?'X':x?.markStatus==='irregular'?'Y':'—',x?.grade||'—',x?.comment||'']});const pdf=buildSimpleReportPdf('Tusome EduShelf — My General Results','Published school results',['Subject','Marks','Grade','Feedback'],data,{widths:[180,100,90,380]});downloadTextFile(pdf,'Tusome_My_General_Results.pdf','application/pdf');showToast?.('General results PDF downloaded.','success')}catch(e){showToast?.(e.message||'Could not create results PDF.','error')}}
async function downloadMyReportCardPdf(){try{const ctx=await fetchRichReportContext();const l=richLearnerFromContext(ctx);l.subjects=ctx.current.subjects;l.history=ctx.current.history;l.subjectMeans=ctx.current.subjectMeans;l.targetDelta=ctx.current.targetDelta;const pdf=buildRichBulkPdf([l],ctx.schoolName||'Tusome EduShelf');downloadTextFile(pdf,'Tusome_My_Report_Card.pdf','application/pdf');showToast?.('Enhanced report card PDF downloaded.','success')}catch(e){showToast?.(e.message||'Could not create report card PDF.','error')}}
async function downloadParentReportCardPdf(){try{const learner=document.getElementById('parentChildSelect')?.value;if(!learner)throw new Error('Select a learner first.');const ctx=await fetchRichReportContext({learnerEmail:learner});const l=richLearnerFromContext(ctx);l.subjects=ctx.current.subjects;l.history=ctx.current.history;l.subjectMeans=ctx.current.subjectMeans;l.targetDelta=ctx.current.targetDelta;const pdf=buildRichBulkPdf([l],ctx.schoolName||'Tusome EduShelf');downloadTextFile(pdf,'Tusome_Learner_Report_Card.pdf','application/pdf');showToast?.('Enhanced learner report card PDF downloaded.','success')}catch(e){showToast?.(e.message||'Could not create report card PDF.','error')}}
async function downloadParentGeneralResultsPdf(){try{const learner=document.getElementById('parentChildSelect')?.value;if(!learner)throw new Error('Select a learner first.');const r=await fetch('/api/parent/exams?learnerEmail='+encodeURIComponent(learner),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load published results.');const rows=d.rows||[];if(!rows.length)throw new Error('No published results are available yet.');const data=rows.map(x=>[x.subjectName||'Subject',x.marks!=null?`${x.marks}/${x.maxMarks}`:x.markStatus==='absent'?'X':x.markStatus==='irregular'?'Y':'—',x.grade||'—',x.comment||'']);const pdf=buildSimpleReportPdf('Tusome EduShelf — Learner General Results','Published school results',['Subject','Marks','Grade','Feedback'],data,{widths:[180,100,90,380]});downloadTextFile(pdf,'Tusome_Learner_General_Results.pdf','application/pdf');showToast?.('General results PDF downloaded.','success')}catch(e){showToast?.(e.message||'Could not create results PDF.','error')}}
async function loadExamsPage(){
 const role=getSessionRole(); const memberRole=window.schoolData?.school?.memberRole || sessionStorage.getItem('tusomeSchoolMemberRole') || '';
 const isSchoolAdmin=role==='admin'||memberRole==='admin';
 const admin=document.getElementById('examAdminPanel'), teacher=document.getElementById('examTeacherPanel'), report=document.getElementById('reportAdminPanel'), learner=document.getElementById('learnerResultsPanel');
 [admin,teacher,report,learner].forEach(x=>{if(x)x.style.display='none'});
 if(!role)return;
 if(role==='learner'){learner.style.display='block';await loadLearnerResultsV44();return}
 if(isSchoolAdmin){admin.style.display='block';teacher.style.display='none';report.style.display='block';await loadExamSetupV44();await loadExamListV44();await loadTeacherExamResultsCentre();return}
 if(role==='teacher'){teacher.style.display='block';await loadTeacherExamResultsCentre();return}
}
async function loadExamSetupV44(){
 try{
  // Always establish the active school before loading class/stream selectors.
  // The report-card selector must not depend on a previously selected dashboard workspace.
  if(!selectedSchoolId){
    const ws=document.getElementById('schoolWorkspaceSelect');
    if(ws?.value) selectedSchoolId=ws.value;
  }
  if(!selectedSchoolId){
    const mr=await fetch('/api/schools/mine',{credentials:'include'}),md=await parseApiResponse(mr);
    const school=(md.schools||[]).find(x=>['admin','teacher'].includes(x.memberRole)) || (md.schools||[])[0];
    if(school) selectedSchoolId=school.schoolId;
  }
  if(!selectedSchoolId) throw new Error('No active school workspace is selected.');
  const r=await fetch('/api/schools/classes?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'}),d=await parseApiResponse(r);
  if(!r.ok)throw new Error(d.error||'Could not load classes.');
  const classes=d.classes||d.rows||[];
  window.__examClasses=classes;
  const classLabel=x=>{const base=[x.className||x.name,x.grade].filter(Boolean).join(' · ');return x.stream?`${base} — ${x.stream}`:base};
  const options=classes.map(x=>`<option value="${escHtml(x.classId||x.id)}">${escHtml(classLabel(x))}</option>`).join('');
  const examClass=document.getElementById('examClass');
  if(examClass){examClass.innerHTML=options||'<option value="">No classes</option>';examClass.disabled=!classes.length;}
  const reportClass=document.getElementById('reportClass');
  if(reportClass){
    const previous=reportClass.value;
    reportClass.innerHTML='<option value="">Select class / stream</option>'+options;
    if(classes.some(x=>String(x.classId||x.id)===String(previous))) reportClass.value=previous;
    reportClass.disabled=!classes.length;
    reportClass.onchange=()=>{window.__selectedReportClassId=reportClass.value;};
    if(!reportClass.value && classes.length===1) reportClass.value=String(classes[0].classId||classes[0].id);
    window.__selectedReportClassId=reportClass.value||'';
  }
  await updateExamSubjectsForSelectedClasses();
 }catch(e){showToast?.(e.message,'error')}
}
async function updateExamSubjectsForClass(){
 const classId=document.getElementById('examClass')?.value; const subject=document.getElementById('examSubject'); const status=document.getElementById('examCurriculumStatus'); if(!classId||!subject)return;
 try{
  const classes=window.__examClasses||[];
  const cls=classes.find(x=>String(x.classId||x.id)===String(classId)); const grade=cls?.grade||'';
  const r=await fetch('/api/schools/curriculum-subjects?schoolId='+encodeURIComponent(selectedSchoolId)+'&grade='+encodeURIComponent(grade),{credentials:'include'}),d=await parseApiResponse(r);
  if(!r.ok)throw new Error(d.error||'Could not load curriculum subjects.');
  if(d.subjects?.length){subject.innerHTML=d.subjects.map(x=>`<option value="${escHtml(x.subjectId)}">${escHtml(x.subjectName)}</option>`).join('');if(status)status.textContent=`KICD curriculum subjects loaded automatically for ${d.grade}.`;return;}
  const sr=await fetch('/api/schools/subjects?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'}),sd=await parseApiResponse(sr); const subs=sd.subjects||[]; subject.innerHTML=subs.map(x=>`<option value="${escHtml(x.subjectId)}">${escHtml(x.subjectName)}</option>`).join('')||'<option value="">No subjects</option>'; if(status)status.textContent=d.message||"Using the school's existing subject list.";
 }catch(e){subject.innerHTML='<option value="">Unable to load subjects</option>';if(status)status.textContent=e.message;showToast?.(e.message,'error')}
}
async function loadExamListV44(){
 const box=document.getElementById('examsRows');
 try{
  const r=await fetch('/api/schools/exams?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'}),d=await parseApiResponse(r);
  if(!r.ok)throw new Error(d.error||'Could not load exams.');
  const rows=d.exams||[];
  box.innerHTML=rows.length?rows.map(x=>`<tr><td><b>${escHtml(x.title)}</b></td><td>${escHtml(x.className||'—')}</td><td>${escHtml(x.subjectName||'—')}</td><td>${escHtml(x.examDate||'—')}</td><td>${escHtml(x.maxMarks)}</td><td>${escHtml(x.status)} · ${escHtml(x.approvalStatus||'draft')}</td></tr>`).join(''):'<tr><td colspan="6">No exams yet.</td></tr>';
  const sel=document.getElementById('marksExam');
  if(sel)sel.innerHTML=rows.map(x=>`<option value="${escHtml(x.examId)}">${escHtml(x.title)} — ${escHtml(x.className||'')}</option>`).join('')||'<option value="">No exams</option>';
  renderSchoolAdminMarkSheetPanel(rows);
  if(rows.length && getSessionRole()==='teacher')loadExamMarksV44();
 }catch(e){box.innerHTML=`<tr><td colspan="6">${escHtml(e.message)}</td></tr>`}
}
function renderSchoolAdminMarkSheetPanel(rows){
 const box=document.getElementById('schoolAdminMarkSheetRows');if(!box)return;
 const active=(rows||[]).filter(x=>String(x.status||'').toLowerCase()!=='published');
 if(!active.length){box.innerHTML='<div class="notice">No unpublished mark sheets are available.</div>';return}
 box.innerHTML='<table><thead><tr><th>Exam</th><th>Class</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+active.map(x=>`<tr><td><b>${escHtml(x.title||'Exam')}</b></td><td>${escHtml(x.className||'—')}${x.stream?` — ${escHtml(x.stream)}`:''}</td><td>${escHtml(x.subjectName||'—')}</td><td>${escHtml(x.status||'open')} · ${escHtml(x.approvalStatus||'draft')}</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn primary" type="button" onclick="adminEditExam('${escHtml(x.examId)}')">✏️ Edit Mark Sheet</button><button class="btn" type="button" onclick="downloadExamPrePublishPdf('${escHtml(x.examId)}')">📄 Pre-Publish PDF</button><button class="btn primary" type="button" onclick="adminApproveAndPublishExam('${escHtml(x.examId)}')">✅ Approve & Publish</button></div></td></tr>`).join('')+'</tbody></table>';
} 
async function updateExamSubjectsForSelectedClasses(){const classSel=document.getElementById('examClass'),subjectSel=document.getElementById('examSubject');if(!classSel||!subjectSel)return;const ids=[...classSel.selectedOptions].map(o=>o.value).filter(Boolean);if(!ids.length){subjectSel.innerHTML='<option value="">Select class/stream first</option>';return}try{const r=await fetch('/api/schools/curriculum-subjects?schoolId='+encodeURIComponent(selectedSchoolId)+'&classIds='+encodeURIComponent(ids.join(',')),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load subjects.');const rows=d.subjects||d.rows||[];subjectSel.innerHTML=rows.map(x=>`<option value="${escHtml(x.subjectId||x.subject_id||'')}">${escHtml(x.subjectName||x.subject_name||'')}</option>`).join('')||'<option value="">No subjects available</option>';}catch(e){subjectSel.innerHTML='<option value="">Could not load subjects</option>';showToast?.(e.message,'error')}}
async function createExamV44(){const title=document.getElementById('examTitle').value.trim(),classIds=[...document.getElementById('examClass').selectedOptions].map(o=>o.value).filter(Boolean),subjectIds=[...document.getElementById('examSubject').selectedOptions].map(o=>o.value).filter(Boolean),examDate=document.getElementById('examDate').value;if(!title||!classIds.length||!subjectIds.length){showToast?.('Title, at least one class/stream and at least one subject are required.','error');return}const payload={schoolId:selectedSchoolId,title,classIds,subjectIds,examDate};try{const r=await fetch('/api/schools/exams?schoolId='+encodeURIComponent(selectedSchoolId),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not create exams.');showToast?.(`${d.created||0} exam(s) created. Teachers will set maximum marks when uploading.`,`success`);loadExamListV44()}catch(e){showToast?.(e.message,'error')}}
async function loadExamMarksV44(){const id=document.getElementById('marksExam')?.value;if(!id)return;const box=document.getElementById('examMarksRows');try{const r=await fetch('/api/schools/exams/'+encodeURIComponent(id)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load marks.');window.v44Exam=d.exam;window.v44MarkRows=d.rows||[];box.innerHTML=window.v44MarkRows.map((x,i)=>`<tr data-i="${i}"><td>${escHtml(x.learnerEmail)}</td><td><input class="v44-mark" type="number" min="0" max="${escHtml(d.exam.max_marks)}" step="0.01" value="${escHtml(x.marks||'')}"></td><td>${escHtml(x.grade||'—')}</td></tr>`).join('')||'<tr><td colspan="3">No learners in this class.</td></tr>'}catch(e){box.innerHTML=`<tr><td colspan="3">${escHtml(e.message)}</td></tr>`}}
async function saveExamMarksV44(){const rows=[...document.querySelectorAll('#examMarksRows tr[data-i]')].map(r=>{const x=window.v44MarkRows[Number(r.dataset.i)];return {learnerEmail:x.learnerEmail,marks:r.querySelector('.v44-mark')?.value||''}});try{const id=document.getElementById('marksExam').value;const r=await fetch('/api/schools/exams/'+encodeURIComponent(id)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({rows})}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save marks.');showToast?.('Marks saved.','success');loadExamMarksV44()}catch(e){showToast?.(e.message,'error')}}
async function generateReportsV44(){try{const r=await fetch('/api/schools/report-cards/generate',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({classId:document.getElementById('reportClass').value})}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not generate reports.');document.getElementById('reportGenerateStatus').textContent=`Created ${d.count||0} draft report cards. Review and publish them before sharing with families.`;showToast?.('Draft report cards generated.','success')}catch(e){showToast?.(e.message,'error')}}
async function loadLearnerResultsV44(){
  try{
    const r=await fetch('/api/learner/exams',{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load results.');
    const rows=d.rows||[], dash=document.getElementById('learnerDashboardResultsRows');
    if(dash)dash.innerHTML=rows.map(x=>`<tr><td>${escHtml(x.title)}</td><td>${escHtml(x.subjectName||'—')}</td><td>${escHtml(x.className||'—')}</td><td>${escHtml(x.examDate||'—')}</td><td>${x.markStatus==='absent'?'X':x.markStatus==='irregular'?'Y':escHtml(x.marks??'—')} / ${escHtml(x.maxMarks)}</td><td>${escHtml(x.grade||'—')}</td><td>${escHtml(x.comment||'')}</td></tr>`).join('')||'<tr><td colspan="7">No exam results have been published for you yet.</td></tr>';
    const old=document.getElementById('learnerResultsRows');if(old)old.innerHTML=rows.map(x=>`<tr><td>${escHtml(x.title)}</td><td>${escHtml(x.subjectName||'—')}</td><td>${escHtml(x.examDate||'—')}</td><td>${x.markStatus==='absent'?'X':x.markStatus==='irregular'?'Y':escHtml(x.marks??'—')} / ${escHtml(x.maxMarks)}</td><td>${escHtml(x.grade||'—')}</td><td>${escHtml(x.comment||'')}</td></tr>`).join('')||'<tr><td colspan="6">No published results yet.</td></tr>';
    document.getElementById('learnerResultsCount')?.replaceChildren(document.createTextNode(String(rows.length)));document.getElementById('learnerLatestGrade')?.replaceChildren(document.createTextNode(rows[0]?.grade||'—'));
    const scored=rows.filter(x=>x.marks!=null&&Number(x.maxMarks)>0);const avg=scored.length?Math.round(scored.reduce((a,x)=>a+(Number(x.marks)/Number(x.maxMarks))*100,0)/scored.length)+'%':'—';document.getElementById('learnerAveragePercent')?.replaceChildren(document.createTextNode(avg));
    const rr=await fetch('/api/learner/report-cards',{credentials:'include'}),rd=await parseApiResponse(rr);const reports=(rd.rows||[]).map(x=>`<div class="card" style="margin-top:8px"><b>📄 Report Card</b><p>Overall average: ${escHtml(x.overallAverage??'—')}% · Published: ${escHtml(x.publishedAt||'—')}</p><p>${escHtml(x.teacherComment||'')}</p><button class="btn" onclick="window.print()">🖨️ Print</button></div>`).join('')||'<p class="small">No published report cards yet.</p>';
    document.getElementById('learnerReportsList')?.replaceChildren();if(document.getElementById('learnerReportsList'))document.getElementById('learnerReportsList').innerHTML=reports;if(document.getElementById('learnerDashboardReports'))document.getElementById('learnerDashboardReports').innerHTML='<h3>📄 Published Report Cards</h3>'+reports;
  }catch(e){const dash=document.getElementById('learnerDashboardResultsRows');if(dash)dash.innerHTML=`<tr><td colspan="7">${escHtml(e.message)}</td></tr>`;const old=document.getElementById('learnerResultsRows');if(old)old.innerHTML=`<tr><td colspan="6">${escHtml(e.message)}</td></tr>`}
}

let teacherUploadExamRows=[],teacherCsvRows=[];
async function getExamSchool(){
  if(selectedSchoolId)return selectedSchoolId;
  try{const r=await fetch('/api/schools/mine',{credentials:'include'}),d=await parseApiResponse(r);const s=(d.schools||[]).find(x=>['teacher','admin'].includes(x.memberRole));if(s){selectedSchoolId=s.schoolId;return selectedSchoolId}}catch(e){}
  return '';
}
function renderExamAdminReview(rows){renderSchoolAdminMarkSheetPanel(rows)}
async function adminEditExam(examId){
 try{
  if(!examId)throw new Error('Exam is required.');
  const r=await fetch('/api/schools/exams/'+encodeURIComponent(examId)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include',cache:'no-store'}),d=await parseApiResponse(r);
  if(!r.ok)throw new Error(d.error||'Could not load the mark sheet.');
  const ex=d.exam||{},rows=d.rows||[],editor=document.getElementById('schoolAdminMarkSheetEditor');
  if(!editor)throw new Error('Administrator mark-sheet editor is unavailable.');
  const max=Number(ex.max_marks||0);
  editor.style.display='block';
  editor.innerHTML=`<div class="topline"><div><h3 style="margin:0">✏️ Edit Mark Sheet</h3><p class="small">${escHtml(ex.title||'Exam')} · ${escHtml(ex.className||'')} ${ex.stream?'· '+escHtml(ex.stream):''} · ${escHtml(ex.subjectName||'')} · Maximum ${escHtml(max)}</p></div><button class="btn" type="button" onclick="closeAdminExamEditor()">Close</button></div><div class="table-like" style="overflow:auto;margin-top:12px"><table><thead><tr><th>#</th><th>Learner</th><th>Admission No.</th><th>Status</th><th>Marks / ${escHtml(max)}</th><th>Grade</th></tr></thead><tbody>${rows.map((x,i)=>{const st=x.markStatus||'present';const marks=st==='present'?(x.marks??''):'';return `<tr data-admin-mark-index="${i}"><td>${i+1}</td><td><b>${escHtml(x.fullName||x.learnerEmail||'Learner')}</b></td><td>${escHtml(x.admissionNumber||'—')}</td><td><select class="adm-mark-status" onchange="toggleAdminExamMarkRow(this)"><option value="present" ${st==='present'?'selected':''}>Present</option><option value="absent" ${st==='absent'?'selected':''}>X — Did not do exam</option><option value="irregular" ${st==='irregular'?'selected':''}>Y — Exam irregularity</option></select></td><td><input class="adm-mark" type="number" min="0" max="${escHtml(max)}" step="0.01" value="${escHtml(marks)}" ${st!=='present'?'disabled':''}></td><td class="adm-grade">${escHtml(x.grade||'—')}</td></tr>`}).join('')||'<tr><td colspan="6">No learners found.</td></tr>'}</tbody></table></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn primary" type="button" onclick="saveAdminExamMarks('${escHtml(examId)}')">💾 Save Changes</button><button class="btn" type="button" onclick="downloadExamPrePublishPdf('${escHtml(examId)}')">📄 Pre-Publish PDF</button><button class="btn primary" type="button" onclick="adminApproveAndPublishExam('${escHtml(examId)}')">✅ Approve & Publish</button></div><p id="adminExamEditorStatus" class="small" style="margin-top:8px"></p>`;
  editor.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){showToast?.(e.message||'Could not open the mark sheet.','error')}
}
function closeAdminExamEditor(){const e=document.getElementById('schoolAdminMarkSheetEditor');if(e){e.style.display='none';e.innerHTML='';}}
function toggleAdminExamMarkRow(select){const tr=select?.closest('tr');if(!tr)return;const mark=tr.querySelector('.adm-mark'),grade=tr.querySelector('.adm-grade'),present=select.value==='present';if(mark){mark.disabled=!present;if(!present)mark.value='';}if(grade)grade.textContent=present?'—':(select.value==='absent'?'X':'Y')}
async function saveAdminExamMarks(examId){
 try{
  const r0=await fetch('/api/schools/exams/'+encodeURIComponent(examId)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include',cache:'no-store'}),d0=await parseApiResponse(r0);if(!r0.ok)throw new Error(d0.error||'Could not load the mark sheet.');
  const rows=d0.rows||[],payload=[...document.querySelectorAll('#schoolAdminMarkSheetEditor tbody tr[data-admin-mark-index]')].map(tr=>{const x=rows[Number(tr.dataset.adminMarkIndex)]||{};const st=tr.querySelector('.adm-mark-status')?.value||'present';return {learnerEmail:x.learnerEmail,marks:st==='present'?(tr.querySelector('.adm-mark')?.value||''):null,markStatus:st};});
  const r=await fetch('/api/schools/exams/'+encodeURIComponent(examId)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({rows:payload,maxMarks:Number(d0.exam?.max_marks||0)})}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save mark-sheet changes.');showToast?.('Mark sheet changes saved.','success');const st=document.getElementById('adminExamEditorStatus');if(st)st.textContent='Saved. The updated marks are immediately available to the teacher.';await loadExamListV44();await adminEditExam(examId);
 }catch(e){showToast?.(e.message||'Could not save mark-sheet changes.','error')}
}

async function downloadGeneralPrePublishPdf(){
  try{
    const all=await fetch('/api/schools/exams?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include',cache:'no-store'});
    const data=await parseApiResponse(all);if(!all.ok)throw new Error(data.error||'Could not load examination subjects.');
    const active=(data.exams||[]).filter(x=>String(x.status||'').toLowerCase()!=='published');
    if(!active.length)throw new Error('No unpublished examinations are available for a general Pre-Publish PDF.');
    const groups=new Map();
    for(const x of active){
      const key=[x.classId||x.class_id||'',x.className||x.class_name||'',x.stream||'',x.title||''].map(v=>String(v).trim()).join('||');
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);
    }
    const choices=[...groups.entries()].map(([key,rows],i)=>({key,rows,label:`${rows[0].className||'Class'}${rows[0].stream?' — '+rows[0].stream:''} — ${rows[0].title||'Examination'} (${rows.length} subjects)`}));
    let selected=choices[0];
    if(choices.length>1){
      const menu=choices.map((x,i)=>`${i+1}. ${x.label}`).join('\n');
      const answer=prompt('Select the class/stream for the General Pre-Publish PDF:\n\n'+menu+'\n\nEnter the number:', '1');
      if(answer===null)return;
      const n=Number(answer);if(!Number.isInteger(n)||n<1||n>choices.length)throw new Error('Please enter a valid class/stream number.');
      selected=choices[n-1];
    }
    const anchor=selected.rows.find(x=>x.examId)||selected.rows[0];
    await downloadExamPrePublishPdf(anchor.examId);
  }catch(e){showToast?.(e.message||'Could not create the general Pre-Publish PDF.','error')}
}

async function downloadExamPrePublishPdf(examId){
  try{
    if(!examId)throw new Error('Exam is required.');
    const base=await fetch('/api/schools/exams/'+encodeURIComponent(examId)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include',cache:'no-store'});
    const first=await parseApiResponse(base);if(!base.ok)throw new Error(first.error||'Could not load the mark sheet.');
    const anchor=first.exam||{};
    const all=await fetch('/api/schools/exams?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include',cache:'no-store'});
    const allData=await parseApiResponse(all);if(!all.ok)throw new Error(allData.error||'Could not load the examination subjects.');
    const exams=(allData.exams||[]).filter(x=>String(x.classId)===String(anchor.class_id||anchor.classId));
    const sameAssessment=exams.filter(x=>String(x.title||'').trim()===String(anchor.title||'').trim());
    const selectedExams=(sameAssessment.length?sameAssessment:exams).filter(x=>String(x.status||'').toLowerCase()!=='published');
    const unique=[];const seen=new Set();
    for(const x of selectedExams){if(!seen.has(String(x.examId))){seen.add(String(x.examId));unique.push(x)}}
    if(!unique.length)throw new Error('No unpublished subjects were found for this class/stream.');
    const detailById=new Map();
    for(const ex of unique){
      const rr=await fetch('/api/schools/exams/'+encodeURIComponent(ex.examId)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include',cache:'no-store'});
      const dd=await parseApiResponse(rr);if(!rr.ok)throw new Error(dd.error||('Could not load '+(ex.subjectName||'subject')+' results.'));
      detailById.set(String(ex.examId),dd);
    }
    const learnerMap=new Map();
    const subjects=[];
    for(const ex of unique){
      const dd=detailById.get(String(ex.examId))||{};
      const subject={examId:ex.examId,name:ex.subjectName||dd.exam?.subjectName||'Subject',max:Number(ex.maxMarks??dd.exam?.max_marks??100)};
      subjects.push(subject);
      for(const row of (dd.rows||[])){
        const key=String(row.learnerEmail||row.admissionNumber||row.fullName||'').toLowerCase();if(!key)continue;
        if(!learnerMap.has(key))learnerMap.set(key,{fullName:row.fullName||'Learner',admissionNumber:row.admissionNumber||'',email:row.learnerEmail||'',marks:{}});
        learnerMap.get(key).marks[String(ex.examId)]={status:row.markStatus||'present',marks:row.marks,grade:row.grade||''};
      }
    }
    const learners=[...learnerMap.values()].sort((a,b)=>String(a.fullName).localeCompare(String(b.fullName),undefined,{sensitivity:'base'}));
    if(!learners.length)throw new Error('No learner results are available for this class/stream.');
    const abbreviationMap={
      'Mathematics':'MATH','English':'ENG','Kiswahili':'KISW','Integrated Science':'INT SCI','Social Studies':'SST','Agriculture':'AGR',
      'Pre-Technical Studies':'PRE-TECH','Creative Arts':'CART','Religious Education':'RE','Christian Religious Education':'CRE',
      'Islamic Religious Education':'IRE','Hindu Religious Education':'HRE','Computer Studies':'COMP','Business Studies':'BUS','French':'FRE','German':'GER','Arabic':'ARB','Mandarin':'MAN','Indigenous Language':'IND LANG'
    };
    const used=new Set();
    function subjectAbbrev(name){
      const raw=String(name||'Subject').trim();if(abbreviationMap[raw])return abbreviationMap[raw];
      const words=raw.replace(/[^A-Za-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);
      let a=words.length>1?words.slice(0,3).map(w=>w[0]).join('').toUpperCase():raw.replace(/[^A-Za-z0-9]/g,'').slice(0,6).toUpperCase();
      if(!a)a='SUB';let n=a,i=2;while(used.has(n))n=a+(i++);used.add(n);return n;
    }
    subjects.forEach(x=>x.abbr=subjectAbbrev(x.name));
    const subjectRows=subjects.map(sub=>{
      const vals=learners.map(l=>l.marks[String(sub.examId)]||{}).filter(v=>v.status==='present'&&v.marks!==null&&v.marks!=='');
      const nums=vals.map(v=>Number(v.marks)).filter(Number.isFinite);
      const mean=nums.length?nums.reduce((a,b)=>a+(b/sub.max*100),0)/nums.length:null;
      return {...sub,mean};
    });
    learners.forEach(l=>{
      const vals=subjects.map(sub=>l.marks[String(sub.examId)]||{}).filter(v=>v.status==='present'&&v.marks!==null&&v.marks!=='').map((v,i)=>Number(v.marks)/subjects[i].max*100).filter(Number.isFinite);
      l.mean=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
    });
    const allMeans=learners.map(l=>l.mean).filter(Number.isFinite);
    const classMean=allMeans.length?allMeans.reduce((a,b)=>a+b,0)/allMeans.length:null;
    const grade=anchor.grade||'';
    const className=anchor.className||'';
    const stream=anchor.stream||'';
    const title=anchor.title||'Examination';
    const date=anchor.examDate||'';
    const keyLines=subjects.map(s=>`${s.abbr}=${s.name}`).join(' | ');
    const esc=v=>String(v??'').replace(/[\x00-\x1F\x7F]/g,' ').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
    const fmt=v=>Number.isFinite(Number(v))?Number(v).toFixed(1):'—';
    const pageW=842,pageH=595,margin=22,headerH=78,footerH=24,rowH=18,usableW=pageW-margin*2;
    const cols=[{key:'no',label:'#',w:24},{key:'adm',label:'ADM',w:55},{key:'name',label:'LEARNER',w:155},...subjects.map(s=>({key:String(s.examId),label:s.abbr,w:Math.max(42,Math.min(62,s.abbr.length*8+18))})),{key:'mean',label:'MEAN',w:48}];
    const totalW=cols.reduce((a,c)=>a+c.w,0);const scale=Math.min(1,usableW/totalW);cols.forEach(c=>c.w*=scale);
    const linesPerPage=Math.max(1,Math.floor((pageH-margin-headerH-footerH)/rowH));
    const pages=[];
    for(let offset=0;offset<learners.length;offset+=linesPerPage)pages.push(learners.slice(offset,offset+linesPerPage));
    const objects=[];const addObj=x=>{objects.push(x);return objects.length};
    const pagesObj=[];const contentRefs=[];
    for(let pi=0;pi<pages.length;pi++){
      const pageRows=pages[pi];let c=[];
      const reportLine=`${grade} ${className}${stream?' - '+stream:''} | ${title} | Date: ${date}`;
      const statsLine=`Learners: ${learners.length} | Subjects: ${subjects.length} | Stream/Class Mean: ${fmt(classMean)}% | Page ${pi+1}/${pages.length}`;
      c.push('BT','/F1 14 Tf',`${margin} ${pageH-margin-14} Td`,`(${esc('TUSOME EDUSHELF - PRE-PUBLISH CONSOLIDATED RESULT')}) Tj`,'/F1 9 Tf','0 -16 Td',`(${esc(reportLine)}) Tj`,'0 -13 Td',`(${esc(statsLine)}) Tj`,'ET');
      let y=pageH-margin-headerH;
      // Main results table: header fill + complete table grid for easy physical checking.
      const tableTop=y+rowH, tableBottom=y-rowH*pageRows.length;
      c.push('0.92 g',`${margin} ${y} ${usableW} ${rowH} re f`,'0 g');
      let x=margin;c.push('BT','/F1 7 Tf');for(const col of cols){c.push(`1 0 0 1 ${x+2} ${y+6} Tm`,`(${esc(col.label)}) Tj`);x+=col.w}c.push('ET');
      y-=rowH;
      pageRows.forEach((l,idx)=>{
        x=margin;c.push('BT','/F1 7 Tf');
        const cells=[String(pi*linesPerPage+idx+1),l.admissionNumber||'',l.fullName||'Learner',...subjects.map(s=>{const v=l.marks[String(s.examId)]||{};return v.status==='absent'?'X':v.status==='irregular'?'Y':(v.marks??'')}),fmt(l.mean)];
        cols.forEach((col,j)=>{c.push(`1 0 0 1 ${x+2} ${y+6} Tm`,`(${esc(String(cells[j]??'').slice(0,30))}) Tj`);x+=col.w});c.push('ET');y-=rowH;
      });
      // Draw the outer border and every row/column separator so the PDF is a real table.
      c.push('0 G','1 w');
      // Draw every cell as an explicit rectangle. This produces a strong, unmistakable grid in PDF viewers and on printed copies.
      let gridY=tableTop;
      for(let r=0;r<=pageRows.length;r++){
        let gridX=margin;
        for(const col of cols){ c.push(`${gridX} ${gridY-rowH} ${col.w} ${rowH} re S`); gridX+=col.w; }
        gridY-=rowH;
      }
      c.push('0 G');
      c.push('BT','/F1 6 Tf',`${margin} ${margin+7} Td`,`(${esc('Subject Key: '+keyLines.slice(0,210))}) Tj`,'ET');
      if(keyLines.length>210){c.push('BT','/F1 6 Tf',`${margin} ${margin-1} Td`,`(${esc(keyLines.slice(210,420))}) Tj`,'ET')}
      c.push('BT','/F1 6 Tf',`${margin} ${margin+18} Td`,`(${esc('Overall Class/Stream Mean: '+fmt(classMean)+'%')}) Tj`,'ET');
      c.push('BT','/F1 5 Tf',`${margin} ${margin+8} Td`,`(${esc('Legend: X = did not sit exam   Y = examination irregularity   Mean = average percentage of valid present subjects')}) Tj`,'ET');
      const content=addObj(`<< /Length ${c.join('\n').length} >>\nstream\n${c.join('\n')}\nendstream`);contentRefs.push(content);
    }
    // Add a dedicated summary table page so subject means remain readable even when many learners are listed.
    {
      let c=[];
      const reportLine=`${grade} ${className}${stream?' - '+stream:''} | ${title} | Date: ${date}`;
      c.push('BT','/F1 14 Tf',`${margin} ${pageH-margin-14} Td`,`(${esc('TUSOME EDUSHELF - PRE-PUBLISH SUMMARY TABLE')}) Tj`,'/F1 9 Tf','0 -16 Td',`(${esc(reportLine)}) Tj`,'0 -16 Td',`(${esc('Learners: '+learners.length+' | Subjects: '+subjects.length+' | Overall Class/Stream Mean: '+fmt(classMean)+'%')}) Tj`,'ET');
      const tw=usableW, labelW=170, meanW=80, countW=80, headY=pageH-margin-headerH, row=18;
      c.push('0.92 g',`${margin} ${headY} ${tw} ${row} re f`,'0 g');
      const heads=['SUBJECT','MEAN %','PRESENT','STATUS']; const widths=[labelW,meanW,countW,tw-labelW-meanW-countW];
      let x=margin;c.push('BT','/F1 8 Tf');heads.forEach((h,i)=>{c.push(`1 0 0 1 ${x+3} ${headY+6} Tm`,`(${esc(h)}) Tj`);x+=widths[i]});c.push('ET');
      let yy=headY-row;
      subjectRows.forEach((sub,i)=>{
        const present=learners.reduce((n,l)=>{const v=l.marks[String(sub.examId)]||{};return n+(v.status==='present'&&v.marks!==null&&v.marks!==''&&Number.isFinite(Number(v.marks))?1:0)},0);
        const vals=[sub.name,fmt(sub.mean),String(present),present?'Ready':'No valid marks'];
        x=margin;c.push('BT','/F1 8 Tf');vals.forEach((v,j)=>{c.push(`1 0 0 1 ${x+3} ${yy+6} Tm`,`(${esc(v)}) Tj`);x+=widths[j]});c.push('ET');yy-=row;
      });
      const bottom=yy, top=headY+row;
      c.push('0 G','1 w');
      // Explicit cell rectangles for a strong printable summary table grid.
      let gridY=top;
      for(let r=0;r<=subjectRows.length;r++){
        let gridX=margin;
        for(const w of widths){ c.push(`${gridX} ${gridY-row} ${w} ${row} re S`); gridX+=w; }
        gridY-=row;
      }
      c.push('0 G');
      const content=addObj(`<< /Length ${c.join('\n').length} >>\nstream\n${c.join('\n')}\nendstream`);contentRefs.push(content);
      pages.push(null);
    }
    const font=addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    for(let i=0;i<contentRefs.length;i++){pagesObj.push(addObj(`<< /Type /Page /Parent __PAGES__ 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${contentRefs[i]} 0 R >>`))}
    const pagesRef=addObj(`<< /Type /Pages /Kids [${pagesObj.map(x=>x+' 0 R').join(' ')}] /Count ${pagesObj.length} >>`);
    const catalog=addObj(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);
    let pdf='%PDF-1.4\n% TusomeEduShelf\n',offsets=[0];
    for(let n=0;n<objects.length;n++){let obj=objects[n].replace(/__PAGES__/g,String(pagesRef));offsets[n+1]=pdf.length;pdf+=`${n+1} 0 obj\n${obj}\nendobj\n`}
    const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let n=1;n<=objects.length;n++)pdf+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const blob=new Blob([pdf],{type:'application/pdf'});
    const safe=String(`${grade}_${className}_${stream}_${title}`).replace(/[^A-Za-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    downloadTextFile(blob,'Tusome_Pre_Publish_Consolidated_'+safe+'_'+new Date().toISOString().slice(0,10)+'.pdf','application/pdf');
    showToast?.(`Consolidated Pre-Publish PDF downloaded: ${subjects.length} subjects, ${learners.length} learners. Class/stream mean ${fmt(classMean)}%.`,'success');
  }catch(e){showToast?.(e.message||'Could not create the consolidated pre-publication PDF.','error')}
}

async function adminApproveAndPublishExam(examId){
  if(!confirm('Approve and publish these results now? The results will become visible to learners/parents and the teacher will not need to publish them.'))return;
  try{const r=await fetch('/api/schools/exams/'+encodeURIComponent(examId)+'/approve-publish?schoolId='+encodeURIComponent(selectedSchoolId),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({comment:'Pre-publication physical check completed by school administrator.'})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not approve and publish results.');showToast?.('Results approved and published.','success');await loadTeacherExamResultsCentre();}catch(e){showToast?.(e.message||'Could not approve and publish results.','error')}}
async function adminReturnExamToTeacher(examId){
  const comment=prompt('Reason for returning these results for correction:', 'Please correct the marked items and resubmit.');if(comment===null)return;
  try{const r=await fetch('/api/schools/exams/'+encodeURIComponent(examId)+'/review?schoolId='+encodeURIComponent(selectedSchoolId),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'reject',comment})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not return results.');showToast?.('Results returned to the teacher for correction.','success');await loadTeacherExamResultsCentre();}catch(e){showToast?.(e.message||'Could not return results.','error')}}

async function loadTeacherExamResultsCentre(){
  const notice=document.getElementById('teacherExamAccessNotice'),controls=document.getElementById('teacherExamResultsControls'),box=document.getElementById('teacherDashboardExamRows'),review=document.getElementById('examAdminReviewPanel');if(!notice||!controls||!box)return;notice.style.display='none';controls.style.display='none';
  try{
    const schoolId=await getExamSchool();if(!schoolId){notice.textContent='Exam results require an active school workspace. Ask your school administrator to add your account.';notice.style.display='block';box.innerHTML='<tr><td colspan="6">No active school teaching workspace.</td></tr>';return}
    const mr=await fetch('/api/schools/mine',{credentials:'include'}),md=await parseApiResponse(mr);if(!mr.ok)throw new Error(md.error||'Could not load school membership.');const me=(md.schools||[]).find(x=>x.schoolId===schoolId);const isAdmin=me?.memberRole==='admin';
    let rows=[];
    if(isAdmin){const r=await fetch('/api/schools/exams?schoolId='+encodeURIComponent(schoolId),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load school exams.');rows=d.exams||[];}
    else{const r=await fetch('/api/teacher/exam-assignments?schoolId='+encodeURIComponent(schoolId),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load your teaching assignments.');rows=(d.assignments||[]).filter(x=>x.examId);}
    teacherUploadExamRows=rows;
    box.innerHTML=rows.map(x=>`<tr><td><b>${escHtml(x.title||'No exam created yet')}</b></td><td>${escHtml(x.className||'—')} ${x.grade?`· ${escHtml(x.grade)}`:''}${x.stream?` — ${escHtml(x.stream)}`:''}</td><td>${escHtml(x.subjectName||'—')}</td><td>${escHtml(x.examDate||'—')}</td><td>${escHtml(x.maxMarks??'—')}</td><td>${escHtml(x.status||'—')} · ${escHtml(x.approvalStatus||'draft')}</td></tr>`).join('')||`<tr><td colspan="6">${isAdmin?'No exams have been created yet.':'No exams are currently assigned to you. Your school administrator must create an exam for one of your assigned class/subject combinations.'}</td></tr>`;
    const sel=document.getElementById('teacherUploadExam');if(sel)sel.innerHTML=rows.map(x=>`<option value="${escHtml(x.examId)}">${escHtml(x.title)} — ${escHtml(x.className||'')}${x.stream?` — ${escHtml(x.stream)}`:''} — ${escHtml(x.subjectName||'')}</option>`).join('')||'<option value="">No assigned exams</option>';
    controls.style.display=rows.length?'block':'none';if(rows.length)await loadTeacherUploadExam();
    if(review){review.style.display=isAdmin?'block':'none';if(isAdmin)renderExamAdminReview(rows)}
  }catch(e){notice.textContent=e.message;notice.style.display='block';box.innerHTML=`<tr><td colspan="6">${escHtml(e.message)}</td></tr>`}
}
async function loadTeacherUploadExam(){const id=document.getElementById('teacherUploadExam')?.value;if(!id)return;try{const r=await fetch('/api/schools/exams/'+encodeURIComponent(id)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load exam learners.');window.teacherUploadExam=d.exam;window.teacherUploadRoster=d.rows||[];const maxInput=document.getElementById('teacherExamMaxMarks');if(maxInput)maxInput.value='';document.getElementById('teacherResultsUploadStatus').textContent=`${d.exam.title} · ${d.rows.length} learners · Set the maximum marks before entering marks.`;renderTeacherMarksGrid(d.rows,d.exam)}catch(e){document.getElementById('teacherResultsUploadStatus').textContent=e.message}}
function sortTeacherRoster(rows,mode){const a=[...(rows||[])];if(mode==='admission')return a.sort((x,y)=>String(x.admissionNumber||'').localeCompare(String(y.admissionNumber||''),undefined,{numeric:true,sensitivity:'base'})||String(x.fullName||'').localeCompare(String(y.fullName||''),undefined,{sensitivity:'base'}));return a.sort((x,y)=>String(x.fullName||x.learnerEmail||'').localeCompare(String(y.fullName||y.learnerEmail||''),undefined,{sensitivity:'base'})||String(x.admissionNumber||'').localeCompare(String(y.admissionNumber||''),undefined,{numeric:true,sensitivity:'base'}))}
function renderTeacherMarksGrid(rows,exam){const box=document.getElementById('teacherResultsCsvPreview');if(!box)return;const max=Number(document.getElementById('teacherExamMaxMarks')?.value||0);const mode=document.getElementById('teacherLearnerSort')?.value||'name';const displayRows=sortTeacherRoster(rows,mode);window.teacherUploadDisplayRoster=displayRows;box.innerHTML='<h4>Online Mark Sheet</h4><p class="small">Learners are shown by name. <b>X</b> means did not do/sit the exam. <b>Y</b> means exam irregularity. Select Present to enter a mark. Automatic feedback is generated after saving.</p><table><thead><tr><th>#</th><th>Learner Name</th><th>Admission No.</th><th>Status</th><th>Marks / '+(max>0?escHtml(max):'Max')+'</th><th>Grade</th></tr></thead><tbody>'+displayRows.map((x,i)=>{const status=x.markStatus||'present';const marks=status==='present'?(x.marks||''):'';return `<tr data-mark-index="${i}"><td>${i+1}</td><td><b>${escHtml(x.fullName||'Learner')}</b></td><td>${escHtml(x.admissionNumber||'—')}</td><td><select class="tm-status" onchange="toggleTeacherMarkRow(this)"><option value="present" ${status==='present'?'selected':''}>Present</option><option value="absent" ${status==='absent'?'selected':''}>X — Did not do exam</option><option value="irregular" ${status==='irregular'?'selected':''}>Y — Exam irregularity</option></select></td><td><input type="number" min="0" max="${max>0?escHtml(max):1000}" step="0.01" value="${escHtml(marks)}" class="tm-mark" ${status!=='present'?'disabled':''} aria-label="Marks for ${escHtml(x.fullName||x.learnerEmail||'learner')}"></td><td class="tm-grade">${escHtml(x.grade||'—')}</td></tr>`}).join('')+'</tbody></table>'}
function updateTeacherMaxMarksHint(){if(window.teacherUploadRoster&&window.teacherUploadExam)renderTeacherMarksGrid(window.teacherUploadRoster,window.teacherUploadExam);}
function toggleTeacherMarkRow(select){const tr=select?.closest('tr');if(!tr)return;const mark=tr.querySelector('.tm-mark'),grade=tr.querySelector('.tm-grade');const present=select.value==='present';if(mark){mark.disabled=!present;if(!present)mark.value='';}if(grade)grade.textContent=present?'—':(select.value==='absent'?'X':'Y');}
async function saveTeacherOnlineMarks(){const exam=window.teacherUploadExam;if(!exam)return;const max=Number(document.getElementById('teacherExamMaxMarks')?.value);if(!Number.isFinite(max)||max<=0||max>1000){showToast?.('Set a valid maximum mark first.','error');return}const displayRows=window.teacherUploadDisplayRoster||window.teacherUploadRoster||[];const rows=[...document.querySelectorAll('#teacherResultsCsvPreview tbody tr[data-mark-index]')].map((tr)=>{const i=Number(tr.dataset.markIndex),x=displayRows[i]||{},status=tr.querySelector('.tm-status')?.value||'present';return {learnerEmail:x.learnerEmail,marks:status==='present'?(tr.querySelector('.tm-mark')?.value||''):null,markStatus:status}});try{const r=await fetch('/api/schools/exams/'+encodeURIComponent(exam.exam_id||exam.examId)+'/marks?schoolId='+encodeURIComponent(selectedSchoolId),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({rows,maxMarks:max})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save marks.');showToast?.('Mark sheet saved.','success');await loadTeacherUploadExam();if(getCurrentSchoolMemberRole()==='admin'||getSessionRole()==='admin')await loadTeacherExamResultsCentre()}catch(e){showToast?.(e.message,'error')}}


let appPageHistory=[];
function navigateBack(fallback='home'){
  const previous=appPageHistory.pop();
  show(previous||fallback,true);
}
function show(id,skipHistory=false){
  if(id==='schoolDashboard'){
    openSchoolDashboard(skipHistory);
    return;
  }
  const active=document.querySelector('.page.active');
  const current=active?.id;
  if(!skipHistory && current && current!==id && current!=='login'){
    appPageHistory=appPageHistory.filter(x=>x!==id);
    appPageHistory.push(current);
    if(appPageHistory.length>12)appPageHistory.shift();
  }
  const protectedRoles={learner:'learner',teacher:'teacher',admin:'admin',communication:'user',account:'user',reader:'learner',practice:'learner',discussions:'learner',portfolio:'learner',community:'learner',membership:'user',schoolDashboard:'schoolAdmin',attendance:'user',exams:'user',fees:'user',timetable:'user',parent:'parent',digitalLibrary:'user'};
  if(protectedRoles[id]){
    const role=getSessionRole();
    if(!role){show('login');return}
    if(id==='learner'&&role!=='learner'){alert('This dashboard is for learners.');return}
    if(id==='personalized'&&role==='learner') setTimeout(loadPersonalizedLearning,0);
    if(id==='reader'&&role!=='learner'){alert('The material reader is for learners.');return}
    if(id==='practice'&&role!=='learner'){alert('Practice Mode is for learners.');return}
    if(id==='discussions'&&role!=='learner'){alert('Discussions are currently available to learners.');return}
    if(id==='portfolio'&&role!=='learner'){alert('The digital portfolio is for learners.');return}
    if(id==='community'&&role!=='learner'){alert('The Learning Community is for learners.');return}
    if(id==='teacher'&&role!=='teacher'){alert('This dashboard is for teachers.');return}
    if(id==='admin'&&role!=='admin'){alert('Administrator access is required.');return}
    if(id==='parent'&&role!=='parent'){alert('This dashboard is for authorised parents/guardians.');return}
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById(id);if(el)el.classList.add('active');
  if(id==='teacher'){loadServerMaterials().then(renderTeacher);loadTeacherEarnings();loadTeacherAnalytics();loadTeacherExamResultsCentre()}
  if(id==='membership'){loadMembership()} if(id==='digitalLibrary'){loadDigitalLibrary()}
  if(id==='schoolDashboard'){loadSchoolManagement()} if(id==='timetable'){loadTimetable()} if(id==='attendance'){loadAttendance()} if(id==='exams'){loadExamsPage()} if(id==='fees'){loadFeesPage()}
  if(id==='learner'){loadLearnerAssignments();loadLearnerGradebook();loadLearnerPortfolio();loadLearnerResultsV44()}
  if(id==='portfolio')loadLearnerPortfolio();
  if(id==='community')loadCommunity();
  if(id==='admin'){adminRefreshAll();loadAdminAnalytics()}
  if(id==='communication'){renderMyFeedback();renderAdminFeedback();loadCommunicationHub()}
  if(id==='notifications')renderNotifications(); else refreshNotificationBadge(); if(id==='account')loadAccountProfile();
  if(id==='progress')refreshProgress(); if(id==='parent')loadParentChildren();
  if(id==='payments')renderPayments();
  
  updatePublicUi();
  window.scrollTo(0,0);
}
let aiReturnDashboard='learner';
const AI_DASHBOARDS={
  learner:{title:'🤖 Learner AI Assistant',description:'Get explanations, revision help and study support based on your learning needs.',features:[['💬','Explain a Topic','Clear explanations and examples for school topics.'],['📝','Revision Notes','Create concise notes for revision.'],['❓','Practice Questions','Generate practice questions and self-check activities.'],['📖','Study Support','Get revision suggestions based on your progress.']]},
  teacher:{title:'🤖 Teacher AI Assistant',description:'Plan lessons, create assessments and design differentiated learning activities.',features:[['📘','Lesson Plans','Generate structured lesson plans with objectives, activities and assessment.'],['📚','Scheme of Work','Build a structured scheme-of-work outline from the selected subject and grade.'],['📝','Assessment & Rubrics','Create assessments, marking guidance and rubrics.'],['🎯','Differentiated Activities','Create activities for different learner needs.'],['🔄','Remedial & Enrichment','Create targeted remedial support and extension activities.'],['🔍','Material Quality Check','Review uploaded material before submission.']]},
  admin:{title:'🤖 Admin AI Assistant',description:'Summarize platform activity and assist with moderation, reporting and approval workflows.',features:[['📈','Activity Summary','Summarize platform activity without exposing unnecessary personal information.'],['🛡️','Moderation Assistance','Review materials for quality, clarity and possible issues.'],['♻️','Duplicate Detection','Identify likely duplicate or highly similar materials.'],['📊','Platform Reports','Summarize uploads, users and payment activity.'],['⏳','Approval Queue','Identify materials currently waiting for approval.']]},
  parent:{title:'🤖 Parent / Guardian AI',description:'Simple study-support information focused only on learner progress and revision.',features:[['📈','Progress Summary','Explain recent learner progress in simple language.'],['📖','Revision Activities','Suggest age-appropriate revision activities.'],['📊','Performance Report','Explain performance information without making high-stakes decisions.'],['💡','Study Support','Suggest practical ways to support study at home.']]}
};
function configureAIAssistant(dashboard){
  const cfg=AI_DASHBOARDS[dashboard]||AI_DASHBOARDS.learner;
  document.getElementById('aiTitle').textContent=cfg.title;
  document.getElementById('aiDescription').textContent=cfg.description;
  const box=document.getElementById('aiFeatureCards');
  box.innerHTML=cfg.features.map(x=>`<div class="card"><h3>${x[0]} ${x[1]}</h3><p>${x[2]}</p></div>`).join('');
  const notice=document.getElementById('aiRoleNotice');
  notice.style.display=dashboard==='teacher'||dashboard==='admin'?'block':'none';
  const mode=document.getElementById('aiMode');
  const modeSets={
    learner:[['answer','Answer / Explain a Question'],['notes','Develop Revision Notes'],['practice','Create Practice Questions'],['summary','Summarize a Topic'],['mark','Mark My Work — Check & Correct']],
    teacher:[['lesson','Lesson Plan Generation'],['scheme','Scheme-of-Work Support'],['assessment','Assessment Creation'],['rubric','Rubric Generation'],['differentiated','Differentiated Activities'],['remediation','Remedial Activities'],['enrichment','Enrichment Activities'],['material_quality','Material Quality Check'],['answer','Explain / Research a Topic']],
    admin:[['admin_summary','Platform Activity Summary'],['moderation','Material Moderation Assistance'],['duplicate','Duplicate-Material Detection'],['admin_reports','Uploads, Users & Payments Report'],['approval_queue','Materials Waiting for Approval'],['answer','Admin Question / Analysis']],
    parent:[['parent_progress','Learner Progress Summary'],['parent_revision','Suggested Revision Activities'],['parent_report','Explain Performance Report'],['parent_study','Study-Support Suggestions']]
  };
  const options=modeSets[dashboard]||modeSets.learner;
  mode.innerHTML=options.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('');
  const labels=document.querySelectorAll('#ai form label');
  if(labels[0])labels[0].textContent=dashboard==='admin'?'Subject / Area':'Subject';
  const prompt=document.getElementById('aiPrompt');
  prompt.placeholder=dashboard==='teacher'?'Example: Create a Grade 8 Mathematics lesson on linear equations...':dashboard==='admin'?'Example: Summarize materials awaiting approval and recent payment activity...':dashboard==='parent'?'Example: Explain this learner\'s recent progress and suggest revision support...':'Example: Explain linear functions and give me two examples.';
  document.getElementById('aiResult').style.display='none';
}
function openAIAssistant(dashboard){
  aiReturnDashboard=dashboard||getSessionRole()||'learner';
  sessionStorage.setItem('tusomeAIReturnDashboard',aiReturnDashboard);
  configureAIAssistant(aiReturnDashboard);
  show('ai');
}
function backFromAIAssistant(){
  const role=getSessionRole();
  const target=sessionStorage.getItem('tusomeAIReturnDashboard')||aiReturnDashboard||role||'learner';
  if(['learner','teacher','admin','parent'].includes(target)){show(target)}else{show(role==='admin'?'admin':role==='teacher'?'teacher':'learner')}
}

function escapeAIHtml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function inlineAI(value){let x=escapeAIHtml(value);x=x.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');return x}
function renderAIResponse(target,text){
  const raw=String(text??'').replace(/\r/g,'').trim();
  if(!target)return;
  if(!raw){target.innerHTML='';return}
  const lines=raw.split('\n'); let html='',i=0;
  // Preserve AI diagrams/ASCII figures as monospaced blocks. Convert dotted/dashed
  // connector lines to solid characters so generated learning diagrams remain clear.
  const cleanDiagramLine=line=>line.replace(/[·•⋯…]+/g,' ').replace(/-{2,}/g,'—').replace(/\.{2,}/g,' ').replace(/_{2,}/g,m=>'─'.repeat(Math.min(m.length,80)));
  const renderCodeBlock=arr=>'<pre class=\"ai-diagram\" aria-label=\"Learning diagram\">'+arr.map(cleanDiagramLine).join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;')+'</pre>';
  while(i<lines.length){
    const line=lines[i].trim();
    if(!line){i++;continue}
    if(/^\|.*\|$/.test(line) && i+1<lines.length && /^\|?\s*:?-{3,}/.test(lines[i+1].trim())){
      const rows=[]; while(i<lines.length && /^\|.*\|$/.test(lines[i].trim())){rows.push(lines[i].trim());i++;}
      const cells=r=>r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim()); const head=cells(rows[0]);
      html+='<table><thead><tr>'+head.map(c=>'<th>'+inlineAI(c)+'</th>').join('')+'</tr></thead><tbody>';
      for(let r=2;r<rows.length;r++){const cs=cells(rows[r]);html+='<tr>'+head.map((_,j)=>'<td>'+inlineAI(cs[j]||'')+'</td>').join('')+'</tr>';}
      html+='</tbody></table>'; continue;
    }
    if(/^```/.test(line)){const block=[];i++;while(i<lines.length&&!/^```/.test(lines[i].trim())){block.push(lines[i]);i++;}if(i<lines.length)i++;html+=renderCodeBlock(block);continue;}
    if(/^#{1,4}\s/.test(line)){const m=line.match(/^(#{1,4})\s+(.*)$/);html+=`<h${Math.min(4,m[1].length)}>${inlineAI(m[2])}</h${Math.min(4,m[1].length)}>`;i++;continue;}
    if(/^[-*]\s+/.test(line)){html+='<ul>';while(i<lines.length&&/^[-*]\s+/.test(lines[i].trim())){html+='<li>'+inlineAI(lines[i].trim().replace(/^[-*]\s+/,''))+'</li>';i++;}html+='</ul>';continue;}
    if(/^\d+[.)]\s+/.test(line)){html+='<ol>';while(i<lines.length&&/^\d+[.)]\s+/.test(lines[i].trim())){html+='<li>'+inlineAI(lines[i].trim().replace(/^\d+[.)]\s+/,''))+'</li>';i++;}html+='</ol>';continue;}
    if(/^⚠️|^VERIFICATION REMINDER:/i.test(line)){html+='<div class="ai-note">'+inlineAI(line)+'</div>';i++;continue;}
    const para=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^```/.test(lines[i].trim())&&!/^\|.*\|$/.test(lines[i].trim())&&!/^#{1,4}\s/.test(lines[i].trim())&&!/^[-*]\s+/.test(lines[i].trim())&&!/^\d+[.)]\s+/.test(lines[i].trim())){para.push(lines[i].trim());i++;}html+='<p>'+inlineAI(para.join(' '))+'</p>';
  }
  target.innerHTML=html;
}
function copyAI(){navigator.clipboard?.writeText(document.getElementById('aiAnswer').textContent);alert('Response copied.')}
async function checkAIStatus(){const el=document.getElementById('aiStatus');if(!el)return;try{const r=await fetch('/api/health');const d=await parseApiResponse(r);el.className=d.ai?.configured?'success':'notice';el.textContent=d.ai?.configured?'🟢 Gemini AI connected • '+d.ai.model:'🟠 AI service is not configured. Add GEMINI_API_KEY to Render Environment.'}catch(e){el.className='notice';el.textContent='🔴 EduShelf server is not running. Start it with: npm install && npm start'}}
async function buildAIContext(role,mode){
  if(role==='learner'){return JSON.stringify({activity:JSON.parse(localStorage.getItem('edushelfActivity')||'[]').slice(0,20),attempts:getMarkAttempts().slice(0,20)});}
  if(role==='parent'){const attempts=getMarkAttempts();return JSON.stringify({progress:document.getElementById('parentActivity')?.textContent||'',aiSessions:document.getElementById('parentAI')?.textContent||'',practice:document.getElementById('parentPractice')?.textContent||'',recentAttempts:attempts.slice(0,10)});}
  if(role==='admin'){
    try{const r=await fetch('/api/admin/ai-context',{credentials:'include'});const d=r.ok?await parseApiResponse(r):{error:'Could not load live admin context.'};return JSON.stringify(d).slice(0,30000)}catch(e){return JSON.stringify({error:'Could not load the live admin context. Use the visible dashboard information only.'});}
  }
  return '';
}
async function loadAccountProfile(){try{const r=await fetch('/api/account/profile',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load account.');const p=d.profile||{};document.getElementById('accountDisplayName').value=p.displayName||'';document.getElementById('accountAvatarUrl').value=p.avatarUrl||'';document.getElementById('accountEmail').textContent=p.email||'';document.getElementById('accountRole').textContent=p.role||'';document.getElementById('prefPlatform').checked=p.notificationPreferences?.platform!==false;document.getElementById('prefEmail').checked=p.notificationPreferences?.email!==false;const rows=d.activity||[];document.getElementById('accountActivity').innerHTML=rows.length?rows.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString()}</td><td>${escapeHtml(x.action||'')}</td><td>${escapeHtml((x.entityType||'')+' '+(x.entityId||''))}</td></tr>`).join(''):'<tr><td colspan="3">No recent account activity.</td></tr>'}catch(e){alert(e.message)}}
async function saveAccountProfile(){try{const body={displayName:document.getElementById('accountDisplayName').value,avatarUrl:document.getElementById('accountAvatarUrl').value,notificationPreferences:{platform:document.getElementById('prefPlatform').checked,email:document.getElementById('prefEmail').checked}};const r=await fetch('/api/account/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save profile.');alert('Account settings saved.');loadAccountProfile()}catch(e){alert(e.message)}}
async function changeAccountPassword(){const notice=document.getElementById('passwordNotice');try{const r=await fetch('/api/account/password',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({currentPassword:document.getElementById('currentPassword').value,newPassword:document.getElementById('newPassword').value})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not change password.');notice.textContent='Password changed successfully.';showToast('Password changed successfully.','success');document.getElementById('currentPassword').value='';document.getElementById('newPassword').value='';}catch(e){notice.textContent=friendlyError(e,'Could not change your password.');showToast(notice.textContent,'error')}}
async function askAI(e){e.preventDefault();const subject=document.getElementById('aiSubject').value,grade=document.getElementById('aiGrade').value,mode=document.getElementById('aiMode').value,focus=document.getElementById('cbeFocus').value,enteredPrompt=document.getElementById('aiPrompt').value.trim(),qFile=document.getElementById('aiQuestionFile')?.files?.[0],wFile=document.getElementById('aiWorkingFile')?.files?.[0],box=document.getElementById('aiResult'),answer=document.getElementById('aiAnswer'),button=e.target.querySelector('button[type="submit"]');const defaultPrompts={lesson:'Create a lesson plan for the selected subject and grade. Include objectives, learning activities, resources, differentiation and assessment.',scheme:'Create a structured scheme of work for the selected subject and grade, with sequence, topics, outcomes, activities, resources and assessment checkpoints.',assessment:'Create an assessment for the selected subject and grade with clear questions/tasks and marking guidance.',rubric:'Create a four-level rubric with observable criteria for the selected subject and grade.',differentiated:'Create differentiated activities for learners needing support, learners at expected level and learners ready for extension.',remediation:'Create remedial activities for likely learning gaps in the selected topic.',enrichment:'Create enrichment activities that deepen understanding of the selected topic.',admin_summary:'Summarize the current platform activity from the supplied dashboard data.',moderation:'Review the supplied material information for moderation concerns and items requiring human review.',duplicate:'Identify likely duplicate or highly similar materials from the supplied material list.',admin_reports:'Prepare a concise report on uploads, users and payments from the supplied dashboard data.',approval_queue:'Identify materials currently waiting for approval from the supplied dashboard data.',parent_progress:'Summarize the learner progress from the supplied progress data.',parent_revision:'Suggest revision activities based on the learner progress data.',parent_report:'Explain the learner performance information in simple language.',parent_study:'Suggest practical study-support ideas based on the learner progress data.'};const prompt=enteredPrompt||defaultPrompts[mode]||'';if(!prompt&&!qFile&&!wFile){alert('Enter a question or upload a question paper first.');return}if(mode==='mark'&&!qFile&&!wFile){alert('For Mark My Work, upload your question paper and/or your working.');return}button.disabled=true;button.textContent='⏳ Gemini is working...';answer.textContent='Gemini is preparing your response...';box.style.display='block';try{const readFile=async(file)=>{if(!file)return null;if(file.size>12*1024*1024)throw new Error('Please keep each uploaded file below 12 MB.');const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the selected file.'));reader.readAsDataURL(file)});return{name:file.name,mimeType:file.type,data:dataUrl}};const [questionFile,workingFile]=await Promise.all([readFile(qFile),readFile(wFile)]);const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject,grade,mode,focus,prompt,file:questionFile,questionFile,workingFile,role:aiReturnDashboard,context:await buildAIContext(aiReturnDashboard,mode)})});const data=await parseApiResponse(res);if(!res.ok)throw new Error(data.error||'The Gemini service could not respond.');renderAIResponse(answer,data.answer);if(mode==='mark')saveMarkAttempt(subject,grade,prompt,data.answer);logActivity('Used Gemini AI Study Assistant: '+mode+' / '+subject+' / '+grade);logNotification('Gemini response generated for '+subject+' ('+grade+').');refreshProgress();renderNotifications()}catch(err){answer.textContent='Sorry, Gemini could not respond.\n\n'+err.message;checkAIStatus()}finally{button.disabled=false;button.textContent='✨ Ask AI'}}
const CBC_NOTES_REGISTRY = {
  'Grade 7': {
    'Mathematics': {
      source:'https://kicd.ac.ke/wp-content/uploads/2024/06/Mathematics-Grade-7-Design-Formated-April-2024.pdf',
      strands:[
        {name:'1.0 Numbers',sub:['1.1 Whole Numbers','1.2 Factors','1.3 Fractions','1.4 Decimals','1.5 Squares and Square Roots']},
        {name:'2.0 Algebra',sub:['2.1 Algebraic Expressions','2.2 Linear Equations','2.3 Linear Inequalities']},
        {name:'3.0 Measurements',sub:['3.1 Pythagorean Relationship','3.2 Length','3.3 Area','3.4 Volume and Capacity','3.5 Time, Distance and Speed','3.6 Temperature','3.7 Money']},
        {name:'4.0 Geometry',sub:['4.1 Angles','4.2 Geometrical Constructions']},
        {name:'5.0 Data Handling and Probability',sub:['5.1 Data Handling']}
      ]
    },
    'Christian Religious Education (CRE)': {
      source:'https://kicd.ac.ke/wp-content/uploads/2024/06/CRE-Grade-7-Design-Formatted-April-2024.pdf',
      strands:[
        {name:'1.0 Overview of Christian Religious Education',sub:['1.1 Importance of Learning CRE']},
        {name:'2.0 Creation',sub:['2.1 Accounts of Creation','2.2 Responsibility over Animals, Fish and Birds','2.3 Responsibility over Plants','2.4 Use and Misuse of God’s Creation']},
        {name:'3.0 The Bible',sub:['3.1 Functions of the Bible','3.2 Divisions of the Bible','3.3 Bible Translation','3.4 Leadership in the Bible: Moses']},
        {name:'4.0 The Early Life of Jesus Christ',sub:['4.1 Background to the Birth of Jesus Christ']}
      ]
    }
  }
};
function initNotesGenerator(){updateNotesLearningAreas();}
function updateNotesLearningAreas(){const g=document.getElementById('notesGrade'),s=document.getElementById('notesSubject');if(!g||!s)return;const data=CBC_NOTES_REGISTRY[g.value]||{};s.innerHTML='<option value="">Select learning area</option>'+Object.keys(data).map(x=>`<option>${escapeHtml(x)}</option>`).join('');s.disabled=!Object.keys(data).length;updateNotesStrands();}
function updateNotesStrands(){const g=document.getElementById('notesGrade'),s=document.getElementById('notesSubject'),st=document.getElementById('notesStrand'),ss=document.getElementById('notesSubstrand');if(!st||!ss)return;const item=(CBC_NOTES_REGISTRY[g?.value]||{})[s?.value];st.innerHTML='<option value="">Select strand</option>'+(item?.strands||[]).map(x=>`<option value="${escapeHtml(x.name)}">${escapeHtml(x.name)}</option>`).join('');st.disabled=!item;ss.innerHTML='<option value="">Select sub-strand</option>';ss.disabled=true;}
function updateNotesSubstrands(){const g=document.getElementById('notesGrade'),s=document.getElementById('notesSubject'),st=document.getElementById('notesStrand'),ss=document.getElementById('notesSubstrand');const item=(CBC_NOTES_REGISTRY[g?.value]||{})[s?.value];const strand=item?.strands?.find(x=>x.name===st?.value);ss.innerHTML='<option value="">Select sub-strand</option>'+(strand?.sub||[]).map(x=>`<option>${escapeHtml(x)}</option>`).join('');ss.disabled=!strand;}
async function generateNotes(e){e.preventDefault();const g=document.getElementById('notesGrade')?.value,s=document.getElementById('notesSubject')?.value,st=document.getElementById('notesStrand')?.value,ss=document.getElementById('notesSubstrand')?.value,topic=document.getElementById('notesTopic')?.value.trim(),style=document.getElementById('notesStyle')?.value,extra=document.getElementById('notesExtra')?.value.trim();if(!g||!s||!st||!ss){alert('Select Grade, Learning Area, Strand and Sub-strand first.');return;}const item=CBC_NOTES_REGISTRY[g]?.[s];const result=document.getElementById('notesResult'),answer=document.getElementById('notesAnswer');result.style.display='block';answer.innerHTML='<p>Generating detailed CBC-aligned notes…</p>';const prompt=`Create substantially detailed ORIGINAL CBC-aligned study notes for ${g} — ${s}.\nVerified Strand: ${st}\nVerified Sub-strand: ${ss}\n${topic?'Topic/focus: '+topic:''}\nStyle: ${style}\nExtra instructions: ${extra||'None'}\n\nUse the selected strand and sub-strand as the curriculum anchor. Do not substitute the learning area name for the strand, and do not invent another strand/sub-strand. Structure the notes with: title, curriculum anchor, learning intentions (original wording), key vocabulary, detailed concept explanation, a clear labelled DIAGRAM whenever the topic is visual or diagrammable, step-by-step examples, real-life/application examples, learner activities, key inquiry questions, relevant core competencies/values/PCIs (label them as suggested, not official quotations), common misconceptions, differentiated practice, at least 8 assessment questions with answers/marking guidance, and a concise revision checklist. For diagrams, use continuous SOLID lines only; never use dotted or dashed connector lines. Prefer clean monospaced ASCII diagrams inside a fenced code block, with labels aligned clearly to the object being explained. Do not reproduce or closely paraphrase copyrighted KICD/KNEC/publisher text. End with Verification & Reference and identify the official KICD design URL as the source to check.`;try{const r=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject:s,grade:g,mode:'notes',focus:`${st} / ${ss}`,prompt,context:`Verified curriculum source: ${item.source}\nVerified strand: ${st}\nVerified sub-strand: ${ss}`})});const raw=await r.text();if(raw.trim().startsWith('<'))throw new Error('The server returned HTML instead of JSON. Deploy the updated index.html and server.mjs together.');const d=JSON.parse(raw);if(!r.ok)throw new Error(d.error||'Could not generate notes.');renderAIResponse(answer,d.answer||d.text||'No response returned.');}catch(err){answer.innerHTML=`<div class="notice">${escapeHtml(err.message)}</div>`}}
function copyGeneratedNotes(){const el=document.getElementById('notesAnswer');if(el)navigator.clipboard?.writeText(el.innerText||el.textContent||'');}

async function loadCurriculumCatalogue(){const box=document.getElementById('curriculumCatalogue');if(!box)return;box.textContent='Loading curriculum records...';try{const grade=document.getElementById('catGrade').value,subject=document.getElementById('catSubject').value;const r=await fetch('/api/curriculum?'+new URLSearchParams({grade,subject}));const data=await parseApiResponse(r);box.innerHTML=data.records.length?data.records.map(x=>`<div class="material"><div><b>${x.grade} • ${x.subject}</b><br><span class="tag">${x.strand}</span> <span class="tag">${x.substrand}</span><br><small>${(x.learningOutcomes||[]).join(' • ')||'Structure record — exact learning outcomes not yet imported for this entry.'}</small></div><span class="tag">${(x.learningOutcomes||[]).length} outcomes</span></div>`).join(''):'<p>No imported record matches this selection yet.</p>'}catch(e){box.textContent='Start the EduShelf server to load curriculum records.'}}
document.getElementById('aiMode')?.addEventListener('change',()=>{const mode=document.getElementById('aiMode').value;const hint=document.getElementById('aiFileHint');if(hint){hint.innerHTML=mode==='mark'?'Upload the <b>question paper</b> in the first slot and <b>your working</b> in the second slot. Gemini will compare them and mark each step.':'Use the <b>Question Paper</b> slot for a paper you want Gemini to solve. The <b>Your Working</b> slot is for Mark My Work.';}});

async function runGeneratedAI(subject,grade,mode,focus,prompt,resultBox,answerBox,extraContext=''){resultBox.style.display='block';answerBox.textContent='Generating...';try{const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject,grade,mode,focus,prompt,role:aiReturnDashboard,context:extraContext})});const data=await parseApiResponse(res);if(!res.ok)throw new Error(data.error||'AI request failed.');renderAIResponse(answerBox,data.answer);logActivity('Generated '+mode+' / '+subject+' / '+grade);logNotification('New AI '+mode+' generated for '+subject+' ('+grade+').');refreshProgress()}catch(err){answerBox.textContent='Sorry, the AI service is unavailable.\n\n'+err.message}}
function generateLesson(e){e.preventDefault();runGeneratedAI(document.getElementById('lessonSubject').value,document.getElementById('lessonGrade').value,'lesson','Learning Outcome / Strand / Sub-strand',`Create a ${document.getElementById('lessonDuration').value} lesson plan for ${document.getElementById('lessonStrand').value}. Topic/learning outcome: ${document.getElementById('lessonTopic').value}. Include objectives, key inquiry question, learning experiences, resources, competencies, values, PCIs, differentiation and assessment.`,document.getElementById('lessonResult'),document.getElementById('lessonAnswer'))}
function generateAssessment(e){e.preventDefault();runGeneratedAI(document.getElementById('assessmentSubject').value,document.getElementById('assessmentGrade').value,'assessment','Assessment / Rubric',`Create a ${document.getElementById('assessmentType').value} assessment for ${document.getElementById('assessmentStrand').value}. Topic/outcome: ${document.getElementById('assessmentTopic').value}. Include instructions, tasks/questions, marking guidance and a 4-level rubric with observable criteria.`,document.getElementById('assessmentResult'),document.getElementById('assessmentAnswer'))}
async function checkMaterialQuality(){
  const file=document.getElementById('file')?.files?.[0];
  const box=document.getElementById('materialQualityResult'),answer=document.getElementById('materialQualityAnswer');
  if(!file){alert('Select the material file first.');return}
  if(file.size>12*1024*1024){alert('Please keep the material below 12 MB.');return}
  const allowed=['application/pdf','image/png','image/jpeg','image/webp','image/heic','image/heif'];
  if(!allowed.includes(file.type)){answer.textContent='For the AI quality check, please use a PDF or supported image. You can still submit DOC/DOCX/PPT/PPTX for normal admin review.';box.style.display='block';return}
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the material.'));r.readAsDataURL(file)});
  box.style.display='block';answer.textContent='Checking material quality...';
  try{const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({role:'teacher',mode:'material_quality',subject:document.getElementById('subject').value,grade:document.getElementById('grade').value,focus:document.getElementById('strand').value,prompt:`Review this proposed learning material before submission. Title: ${document.getElementById('title').value}. Topic: ${document.getElementById('topic').value}. Competency: ${document.getElementById('competency').value}. Description: ${document.getElementById('desc').value}`,file:{name:file.name,mimeType:file.type,data}})});const d=await parseApiResponse(res);if(!res.ok)throw new Error(d.error||'Quality check failed.');renderAIResponse(answer,d.answer);logActivity('Used AI material quality checker: '+document.getElementById('title').value)}catch(e){answer.textContent='Quality check failed.\n\n'+e.message}}
function escHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function getMarkAttempts(){try{return JSON.parse(localStorage.getItem('tusomeMarkAttempts')||'[]')}catch{return[]}}
function saveMarkAttempt(subject,grade,prompt,answer){
  const text=String(answer||''); if(!text)return;
  const matches=[...text.matchAll(/(?:score|marks?|percentage|percent)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?\s*%?/ig)];
  let score=null;
  for(const m of matches){const a=Number(m[1]),b=m[2]?Number(m[2]):null;if(b&&b>0&&a<=b){score=Math.round(a/b*100);break}if(a>=0&&a<=100){score=Math.round(a);break}}
  const q=[...text.matchAll(/(?:question|q(?:uestion)?\.?)\s*(\d+)/ig)].map(m=>Number(m[1])).filter(n=>n>0);
  const attempts=getMarkAttempts();
  attempts.unshift({id:Date.now(),subject,grade,topic:(prompt||'General').slice(0,90),score,questions:[...new Set(q)].length||1,time:new Date().toISOString(),key:`${subject}|${prompt||'General'}`});
  localStorage.setItem('tusomeMarkAttempts',JSON.stringify(attempts.slice(0,100)));
}
function progressScoreClass(score){return score>=80?'score-good':score>=50?'score-mid':'score-low'}
function formatAgo(iso){const d=new Date(iso),mins=Math.floor(Math.max(0,Date.now()-d.getTime())/60000);if(mins<1)return'Just now';if(mins<60)return mins+' min ago';const h=Math.floor(mins/60);if(h<24)return h+' hr ago';const days=Math.floor(h/24);return days+' day'+(days===1?'':'s')+' ago'}
function refreshProgress(){
  const logs=JSON.parse(localStorage.getItem('edushelfActivity')||'[]'),attempts=getMarkAttempts();
  const ai=logs.filter(x=>x.action.toLowerCase().includes('ai')).length,practice=logs.filter(x=>x.action.toLowerCase().includes('practice')||x.action.toLowerCase().includes('assessment')).length,views=Number(localStorage.getItem('tusomeViews')||0);
  const scored=attempts.filter(x=>Number.isFinite(x.score)),avg=scored.length?Math.round(scored.reduce((a,x)=>a+x.score,0)/scored.length):null;
  const questions=attempts.reduce((a,x)=>a+Number(x.questions||1),0),groups={},topicGroups={};
  attempts.forEach(x=>{(groups[x.subject||'Other']??=[]).push(x);(topicGroups[x.key||`${x.subject||'Other'}|${x.topic||'General'}`]??=[]).push(x)});
  const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v};
  set('progressViews',views);set('progressAI',ai);set('progressPractice',practice);set('progressAttempts',attempts.length);set('progressAverage',avg===null?'—':avg+'%');set('progressQuestions',questions);set('progressTopics',Object.keys(topicGroups).length);
  const mastered=Object.values(topicGroups).filter(a=>{const ss=a.filter(x=>Number.isFinite(x.score));return ss.length&&ss.reduce((z,x)=>z+x.score,0)/ss.length>=80}).length;set('progressMastered',mastered);
  const dates=new Set(logs.map(x=>{const d=new Date(x.time);return isNaN(d)?null:d.toDateString()}).filter(Boolean));let streak=0,cursor=new Date();cursor.setHours(0,0,0,0);while(dates.has(cursor.toDateString())){streak++;cursor.setDate(cursor.getDate()-1)}set('progressStreak',streak+(streak===1?' day':' days'));
  const subjects=document.getElementById('progressSubjects');
  if(subjects)subjects.innerHTML=Object.keys(groups).length?Object.entries(groups).map(([sub,a])=>{const ss=a.filter(x=>Number.isFinite(x.score)),score=ss.length?Math.round(ss.reduce((z,x)=>z+x.score,0)/ss.length):null;return `<div class="progress-row"><div style="flex:1"><b>${escHtml(sub)}</b><br><small>${a.length} marked attempt${a.length===1?'':'s'}</small><div class="progress-bar"><div class="progress-fill" style="width:${score??0}%"></div></div></div><span class="${score===null?'':progressScoreClass(score)}">${score===null?'Pending':score+'%'}</span></div>`}).join(''):'<p>No AI-marked work yet. Complete a Mark My Work attempt to start building your progress.</p>';
  const entries=Object.entries(topicGroups).map(([k,a])=>{const ss=a.filter(x=>Number.isFinite(x.score));return{k,a,score:ss.length?Math.round(ss.reduce((z,x)=>z+x.score,0)/ss.length):null}}).sort((a,b)=>(a.score??-1)-(b.score??-1));
  const weak=entries.filter(x=>x.score!==null&&x.score<70).slice(0,5),strong=entries.filter(x=>x.score!==null&&x.score>=80).sort((a,b)=>b.score-a.score).slice(0,5);
  const wb=document.getElementById('progressWeak');if(wb)wb.innerHTML=weak.length?weak.map(x=>`<div class="progress-row"><div><b>${escHtml(x.a[0].topic||'General')}</b><br><small>${escHtml(x.a[0].subject||'Other')} • ${x.a.length} attempt${x.a.length===1?'':'s'}</small></div><span class="${progressScoreClass(x.score)}">${x.score}%</span></div>`).join(''):'<p>No weak areas detected yet. Keep completing marked work.</p>';
  const sb=document.getElementById('progressStrong');if(sb)sb.innerHTML=strong.length?strong.map(x=>`<div class="progress-row"><div><b>${escHtml(x.a[0].topic||'General')}</b><br><small>${escHtml(x.a[0].subject||'Other')}</small></div><span class="score-good">${x.score}%</span></div>`).join(''):'<p>Topics reaching 80% or more will appear here.</p>';
  const rec=document.getElementById('progressRecommendations');if(rec)rec.innerHTML=weak.length?weak.slice(0,3).map(x=>`<div class="progress-row"><div><b>Practise ${escHtml(x.a[0].topic||'this topic')}</b><br><small>Current average: ${x.score}% • Review the corrections and try another set.</small></div><button class="btn" onclick="show('ai');document.getElementById('aiMode').value='practice';document.getElementById('aiPrompt').value='Create practice questions on ${escHtml(x.a[0].topic||'this topic')} for ${escHtml(x.a[0].grade||'my grade')}.'">Practise</button></div>`).join(''):'<p>Your recommendations will appear after AI-marked attempts are recorded.</p>';
  const list=document.getElementById('progressAttemptsList');if(list)list.innerHTML=attempts.length?attempts.slice(0,8).map(x=>`<div class="progress-row"><div><b>${escHtml(x.subject||'Other')} • ${escHtml(x.grade||'')}</b><br><small>${escHtml(x.topic||'General')} • ${x.questions||1} question${(x.questions||1)===1?'':'s'} • ${formatAgo(x.time)}</small></div><span class="${x.score===null?'':progressScoreClass(x.score)}">${x.score===null?'Score not detected':x.score+'%'}</span></div>`).join(''):'<p>No Mark My Work attempts recorded yet.</p>';
  const p=document.getElementById('progressActivity');if(p)p.innerHTML=logs.length?logs.slice(0,10).map(x=>`<div class="material"><div>📝 ${escHtml(x.action)}</div><small>${escHtml(x.time)}</small></div>`).join(''):'<p>No learning activity yet.</p>';
  const pa=document.getElementById('parentActivity');if(pa)pa.textContent=views+' material view(s) recorded.';const pai=document.getElementById('parentAI');if(pai)pai.textContent=ai+' AI-assisted study session(s) recorded.';const pp=document.getElementById('parentPractice');if(pp)pp.textContent=practice+' practice/assessment action(s) recorded.';
}
async function openTusomeAI(){
  try{
    const r=await fetch('/api/auth/me',{credentials:'include'});
    if(!r.ok){show('login');showToast?.('Please sign in to use Tusome AI.','error');return;}
    window.location.href='/tusome-ai.html';
  }catch{show('login');showToast?.('Please sign in to use Tusome AI.','error')}
}
async function loadTusomeAIEntitlement(){
  const box=document.getElementById('tusomeAIEntitlementBox'); if(!box)return;
  try{const r=await fetch('/api/tusome-ai/entitlement',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load AI allowance.');const e=d.entitlement;box.innerHTML=e.unlimited?'<b>Administrator access:</b> Unlimited internal Tusome AI usage.':`<b>${escHtml(e.planName)}</b> • ${e.remaining} / ${e.monthlyLimit} AI units remaining this month${e.scopeType==='school'?` • Shared school pool for ${e.memberCount} active member${e.memberCount===1?'':'s'}.`:''}`;}catch(e){box.textContent=e.message||'Could not load AI allowance.'}
}
async function restoreServerSession(){
  try{
    const r=await fetch('/api/auth/me',{credentials:'include'});
    if(r.ok){const d=await parseApiResponse(r);setSessionRole(d.user.role,d.user.email);if(d.user.role==='learner')await loadServerPurchases()}
    else{sessionStorage.removeItem('tusomeLoggedIn');sessionStorage.removeItem('tusomeRole');sessionStorage.removeItem('tusomeCurrentUser')}
  }catch{}
  updatePublicUi();
}

function getTeacherPrefs(){try{return JSON.parse(localStorage.getItem('tusomeTeacherDashboardPrefs')||'null')||{analytics:true,earnings:true,uploads:true,goal:true}}catch{return {analytics:true,earnings:true,uploads:true,goal:true}}}
function saveTeacherPrefs(prefs){localStorage.setItem('tusomeTeacherDashboardPrefs',JSON.stringify(prefs))}
function applyTeacherPrefs(){const p=getTeacherPrefs();[['analytics','teacherAnalyticsSection'],['earnings','teacherEarningsSection'],['uploads','teacherUploadsSection'],['goal','teacherGoalSection']].forEach(([key,id])=>{const el=document.getElementById(id);if(el)el.classList.toggle('is-hidden',p[key]===false)});const goal=localStorage.getItem('tusomeTeacherGoal')||'';const q=document.getElementById('teacherGoalQuick'),t=document.getElementById('teacherGoalTitle');if(q)q.textContent=goal?goal.slice(0,52)+(goal.length>52?'…':''):'Set your focus for this period.';if(t)t.textContent=goal||'No teaching goal set yet.'}
function openTeacherCustomizer(){let p=getTeacherPrefs();const overlay=document.createElement('div');overlay.className='teacher-customizer';overlay.id='teacherCustomizer';overlay.innerHTML=`<div class="teacher-customizer-panel" role="dialog" aria-modal="true" aria-labelledby="teacherCustomizeTitle"><h3 id="teacherCustomizeTitle">⚙️ Customize Teacher Dashboard</h3><p class="small">Choose the sections you want visible. Your choices are saved on this device.</p>${[['analytics','📊 Material Analytics','Views, learner activity and material engagement.'],['earnings','💰 Sales & Earnings','Sales, revenue and teacher earnings.'],['uploads','📚 Recent Uploads','Your submitted learning materials and statuses.'],['goal','🎯 Teaching Goal','A short reminder of your current teaching focus.']].map(([k,title,desc])=>`<label class="teacher-custom-row"><span><b>${title}</b><br><small>${desc}</small></span><input type="checkbox" data-teacher-pref="${k}" ${p[k]!==false?'checked':''}></label>`).join('')}<div class="teacher-custom-actions"><button class="btn" type="button" onclick="closeTeacherCustomizer()">Cancel</button><button class="btn primary" type="button" onclick="saveTeacherCustomizer()">Save Preferences</button></div></div>`;document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)closeTeacherCustomizer()});overlay.querySelector('input')?.focus()}
function saveTeacherCustomizer(){const root=document.getElementById('teacherCustomizer');if(!root)return;const p=getTeacherPrefs();root.querySelectorAll('[data-teacher-pref]').forEach(el=>p[el.dataset.teacherPref]=el.checked);saveTeacherPrefs(p);applyTeacherPrefs();closeTeacherCustomizer();showToast?.('Teacher dashboard preferences saved.','success')}
function closeTeacherCustomizer(){document.getElementById('teacherCustomizer')?.remove()}
function setTeacherFocusGoal(){const current=localStorage.getItem('tusomeTeacherGoal')||'';const goal=prompt('What is your main teaching goal? Example: Prepare stronger formative assessments',current);if(goal===null)return;const clean=goal.trim().slice(0,180);if(clean){localStorage.setItem('tusomeTeacherGoal',clean);applyTeacherPrefs();showToast?.('Teaching goal saved.','success')}else{localStorage.removeItem('tusomeTeacherGoal');applyTeacherPrefs();showToast?.('Teaching goal cleared.','info')}}
function initTeacherPersonalization(){applyTeacherPrefs()}
initTeacherPersonalization();
initNotesGenerator();
restoreServerSession();

const practiceBank=[
 {grade:'Grade 4',subject:'Mathematics',topic:'Fractions',strand:'Numbers',substrand:'Fractions',competency:'Critical Thinking and Problem Solving',q:'Asha has 8 equal pieces of fruit and eats 3 pieces. What fraction of the fruit did she eat?',options:['3/8','5/8','3/5','8/3'],answer:0,why:'She ate 3 of the 8 equal pieces, so the fraction is 3/8.'},
 {grade:'Grade 4',subject:'English',topic:'Grammar',strand:'Grammar',substrand:'Parts of Speech',competency:'Communication and Collaboration',q:'Which word is an adjective in: “The tall tree gives shade.”?',options:['tree','gives','tall','shade'],answer:2,why:'“Tall” describes the tree, so it is an adjective.'},
 {grade:'Grade 5',subject:'Mathematics',topic:'Fractions',strand:'Numbers',substrand:'Fractions',competency:'Critical Thinking and Problem Solving',q:'Which fraction is equivalent to 1/2?',options:['2/3','2/4','3/5','4/6'],answer:1,why:'Multiplying the numerator and denominator of 1/2 by 2 gives 2/4.'},
 {grade:'Grade 5',subject:'English',topic:'Reading',strand:'Reading',substrand:'Comprehension',competency:'Communication and Collaboration',q:'What is the main purpose of a summary?',options:['To add unrelated details','To give the key ideas briefly','To copy every sentence','To change the author’s message'],answer:1,why:'A summary gives the main ideas briefly and accurately.'},
 {grade:'Grade 6',subject:'Mathematics',topic:'Percentages',strand:'Numbers',substrand:'Percentages',competency:'Critical Thinking and Problem Solving',q:'A book costs KSh 500. What is 10% of the price?',options:['KSh 5','KSh 10','KSh 50','KSh 100'],answer:2,why:'10% of 500 is 50.'},
 {grade:'Grade 6',subject:'English',topic:'Grammar',strand:'Grammar',substrand:'Word Classes',competency:'Communication and Collaboration',q:'Which sentence uses an adverb correctly?',options:['She sang beautiful.','She sang beautifully.','She beautiful sang.','Beautifully she singer.'],answer:1,why:'“Beautifully” is the adverb that describes how she sang.'},
 {grade:'Grade 7',subject:'Mathematics',topic:'Algebra',strand:'Numbers',substrand:'Algebraic Expressions',competency:'Critical Thinking and Problem Solving',q:'If y = 2x + 3, what is y when x = 4?',options:['7','8','11','12'],answer:2,why:'Substitute x = 4: y = 2(4) + 3 = 11.'},
 {grade:'Grade 7',subject:'Integrated Science',topic:'Energy',strand:'Matter and Energy',substrand:'Forms of Energy',competency:'Critical Thinking and Problem Solving',q:'Which is an example of kinetic energy?',options:['A book on a shelf','A stretched rubber band','A moving bicycle','Water stored behind a dam'],answer:2,why:'Kinetic energy is energy of motion.'},
 {grade:'Grade 8',subject:'Mathematics',topic:'Linear Relationships',strand:'Algebra',substrand:'Linear Equations',competency:'Critical Thinking and Problem Solving',q:'Solve 3x + 2 = 14.',options:['2','4','6','8'],answer:1,why:'Subtract 2 to get 3x = 12, then divide by 3 to get x = 4.'},
 {grade:'Grade 8',subject:'Integrated Science',topic:'Cells',strand:'Living Things',substrand:'Cell Structure and Functions',competency:'Critical Thinking and Problem Solving',q:'Which cell structure controls many activities of a cell?',options:['Nucleus','Cell wall','Vacuole','Cytoplasm'],answer:0,why:'The nucleus contains genetic material and helps control cell activities.'},
 {grade:'Grade 9',subject:'Mathematics',topic:'Linear Functions',strand:'Algebra',substrand:'Linear Functions',competency:'Critical Thinking and Problem Solving',q:'If y = 2x + 3, what is y when x = 4?',options:['7','8','11','12'],answer:2,why:'Substitute x = 4: y = 8 + 3 = 11.'},
 {grade:'Grade 9',subject:'Integrated Science',topic:'Photosynthesis',strand:'Living Things',substrand:'Nutrition in Plants',competency:'Critical Thinking and Problem Solving',q:'Plants use light energy during photosynthesis mainly to help make:',options:['Water','Glucose','Nitrogen','Protein'],answer:1,why:'Light energy helps plants make glucose from carbon dioxide and water.'}
];
let practiceState={questions:[],index:0,answers:[],score:0,started:false,grade:'',subject:'',topic:''};
function initPractice(){const g=document.getElementById('practiceGrade');if(g){g.value=localStorage.getItem('tusomePracticeGrade')||'';updatePracticeSubjects()} }
function updatePracticeSubjects(){const grade=document.getElementById('practiceGrade')?.value||'';localStorage.setItem('tusomePracticeGrade',grade);const sel=document.getElementById('practiceSubject');if(!sel)return;const subjects=[...new Set(practiceBank.filter(x=>!grade||x.grade===grade).map(x=>x.subject))];sel.innerHTML='<option value="">Choose learning area</option>'+subjects.map(x=>`<option value="${escHtml(x)}">${escHtml(x)}</option>`).join('');updatePracticeTopics();}
function updatePracticeTopics(){const grade=document.getElementById('practiceGrade')?.value||'',subject=document.getElementById('practiceSubject')?.value||'',t=document.getElementById('practiceTopic');if(!t)return;const topics=[...new Set(practiceBank.filter(x=>(!grade||x.grade===grade)&&(!subject||x.subject===subject)).map(x=>x.topic))];t.innerHTML='<option value="">All topics</option>'+topics.map(x=>`<option value="${escHtml(x)}">${escHtml(x)}</option>`).join('');}
function startPractice(){const grade=document.getElementById('practiceGrade')?.value||'',subject=document.getElementById('practiceSubject')?.value||'',topic=document.getElementById('practiceTopic')?.value||'',count=Number(document.getElementById('practiceCount')?.value||5);if(!grade||!subject){showToast?.('Choose the learner grade and learning area first.','error');return}let pool=practiceBank.filter(x=>x.grade===grade&&x.subject===subject&&(!topic||x.topic===topic));if(!pool.length){showToast?.('No practice questions are available for this selection yet.','error');return}pool=pool.sort(()=>Math.random()-.5).slice(0,Math.min(count,pool.length));practiceState={questions:pool,index:0,answers:[],score:0,started:true,grade,subject,topic};renderPracticeQuestion();}
function renderPracticeQuestion(){const area=document.getElementById('practiceArea');if(!area)return;const q=practiceState.questions[practiceState.index];if(!q){finishPractice();return}const n=practiceState.index+1,total=practiceState.questions.length;area.innerHTML=`<div class="practice-score"><div class="practice-stat"><b>${escHtml(q.grade)}</b><span>Level</span></div><div class="practice-stat"><b>${n}/${total}</b><span>Question</span></div><div class="practice-stat"><b>${practiceState.score}</b><span>Score</span></div></div><div class="practice-progress" aria-label="Practice progress"><div style="width:${Math.round((n-1)/total*100)}%"></div></div><div class="practice-card" style="box-shadow:none;margin-top:16px"><div class="small">${escHtml(q.subject)} • ${escHtml(q.topic)} • CBE focus: ${escHtml(q.competency)}</div><div class="small" style="margin-top:6px">Strand: ${escHtml(q.strand)} • Sub-strand: ${escHtml(q.substrand)}</div><div class="practice-question">${escHtml(q.q)}</div><fieldset style="border:0;padding:0;margin:0"><legend class="small">Choose one answer</legend>${q.options.map((o,i)=>`<label class="practice-option"><input type="radio" name="practiceAnswer" value="${i}"><span>${escHtml(o)}</span></label>`).join('')}</fieldset><div id="practiceFeedback" class="practice-result" style="display:none;margin-top:12px"></div><div class="answer-upload" aria-label="Upload learner answer for marking"><b>➕ Upload your answer for AI marking</b><p class="small">Take a clear photo or upload a PDF of your written answer. Gemini will compare it with this question and give feedback. Teacher verification is recommended for formal assessment.</p><label class="plus" for="practiceAnswerFile" title="Upload answer" aria-label="Upload learner answer">+</label><input id="practiceAnswerFile" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif" onchange="markUploadedPracticeAnswer(this.files[0])"><span id="practiceUploadName" class="small" style="margin-left:10px">No file selected</span><div id="practiceMarkResult" class="mark-result" style="display:none" aria-live="polite"></div></div><div class="practice-actions"><button class="btn primary" type="button" onclick="checkPracticeAnswer()">Check Answer</button><button class="btn" type="button" onclick="skipPracticeQuestion()">Skip</button></div></div>`;}
async function markUploadedPracticeAnswer(file){if(!file)return;const name=document.getElementById('practiceUploadName');const result=document.getElementById('practiceMarkResult');if(name)name.textContent=file.name;if(file.size>12*1024*1024){showToast?.('Please keep the answer file below 12 MB.','error');return}const allowed=['application/pdf','image/png','image/jpeg','image/webp','image/heic','image/heif'];if(!allowed.includes(file.type)){showToast?.('Upload a PDF or clear image (JPG, PNG, WEBP, HEIC).','error');return}const q=practiceState.questions[practiceState.index];if(!q)return;if(result){result.style.display='block';result.textContent='⏳ Marking your uploaded answer...'}try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the answer file.'));r.readAsDataURL(file)});const prompt=`Mark this learner response for ${q.grade}, ${q.subject}, topic ${q.topic}. Question: ${q.q}. Expected answer: ${q.options[q.answer]}. Explain whether the uploaded response answers the question, identify the evidence in the learner response, give a supportive correction, and suggest one next step. This is formative practice feedback, not an official grade.`;const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject:q.subject,grade:q.grade,mode:'mark',focus:`${q.strand} / ${q.substrand}`,prompt,workingFile:{name:file.name,mimeType:file.type,data},role:'learner'})});const d=await parseApiResponse(res);if(!res.ok)throw new Error(d.error||'AI marking failed.');renderAIResponse(result,d.answer);logActivity('Uploaded answer for AI marking: '+q.subject+' / '+q.grade);logNotification('Your uploaded practice answer has been marked.');refreshProgress();}catch(e){if(result)result.textContent='Could not mark this answer. '+e.message;showToast?.('Could not mark the uploaded answer.','error')}}
function nextPracticeQuestion(){practiceState.index++;renderPracticeQuestion()}
function skipPracticeQuestion(){practiceState.answers[practiceState.index]={selected:null,correct:false,skipped:true};practiceState.index++;renderPracticeQuestion()}
function finishPractice(){
 const total=practiceState.questions.length,pct=total?Math.round(practiceState.score/total*100):0;const subject=document.getElementById('practiceSubject')?.value||'All subjects';
 const key='tusomePracticeBestScores';let scores=JSON.parse(localStorage.getItem(key)||'{}');const old=Number(scores[subject]||0);if(pct>old)scores[subject]=pct;localStorage.setItem(key,JSON.stringify(scores));
 const area=document.getElementById('practiceArea');if(area)area.innerHTML=`<div class="practice-result"><h3>🎉 Practice complete</h3><div class="practice-score"><div class="practice-stat"><b>${practiceState.score}/${total}</b><span>Correct</span></div><div class="practice-stat"><b>${pct}%</b><span>Score</span></div><div class="practice-stat"><b>${Math.max(old,pct)}%</b><span>Best score</span></div></div><p>${pct>=80?'Great work. Keep practising to strengthen your understanding.':pct>=50?'Good effort. Review the explanations and try again.':'Keep going. Use the explanations, revisit your material, and try another set.'}</p><div class="practice-actions"><button class="btn primary" type="button" onclick="startPractice()">↻ Try Again</button><button class="btn" type="button" onclick="showPracticeHistory()">🏆 View Best Scores</button></div></div>`;
 showToast?.('Practice set completed.','success');
}
function resetPractice(){practiceState={questions:[],index:0,answers:[],score:0,started:false};const a=document.getElementById('practiceArea');if(a)a.innerHTML='<p><b>Ready?</b> Choose a subject and start a practice set.</p>';}
function showPracticeHistory(){const scores=JSON.parse(localStorage.getItem('tusomePracticeBestScores')||'{}');const rows=Object.entries(scores);alert('My Best Scores\n\n'+(rows.length?rows.map(([s,v])=>`${s}: ${v}%`).join('\n'):'No practice scores yet.'))}
initPractice();
function showLearningGoals(){
  const current=localStorage.getItem('tusomeLearningGoal')||'';
  const goal=prompt('What is your main learning goal? Example: Improve Mathematics revision',current);
  if(goal!==null){const clean=goal.trim().slice(0,180);if(clean){localStorage.setItem('tusomeLearningGoal',clean);showToast?.('Learning goal saved.','success');}else{localStorage.removeItem('tusomeLearningGoal');showToast?.('Learning goal cleared.','info');}}
}
function showRecentLearning(){
  const logs=JSON.parse(localStorage.getItem('edushelfActivity')||'[]').slice(0,8);
  const text=logs.length?logs.map((x,i)=>`${i+1}. ${x.action} — ${x.time}`).join('\n'):'No recent learning activity yet.';
  alert('Recent Activity\n\n'+text);
}
function showRecommendedMaterials(){
  const list=(materials||[]).filter(m=>(m.approvalStatus||'approved')==='approved').slice(0,6);
  if(!list.length){alert('No recommended materials are available yet.');return;}
  const text=list.map((m,i)=>`${i+1}. ${m.title||'Untitled'} — ${m.subject||'General'} / ${m.grade||'All grades'}`).join('\n');
  alert('Recommended Materials\n\n'+text+'\n\nUse Search Materials below to find and open one.');
  document.getElementById('search')?.scrollIntoView({behavior:'smooth',block:'center'});
}

function defaultStudyPlan(){return [
  {day:'Monday',task:'Review one topic',done:false},
  {day:'Tuesday',task:'Practise 5 questions',done:false},
  {day:'Wednesday',task:'Read a learning material',done:false},
  {day:'Thursday',task:'Review corrections',done:false},
  {day:'Friday',task:'Do a short self-check',done:false}
]}
function getStudyPlan(){try{const x=JSON.parse(localStorage.getItem('tusomeStudyPlan')||'null');return Array.isArray(x)&&x.length?x:defaultStudyPlan()}catch{return defaultStudyPlan()}}
function renderStudyPlan(){const rows=document.getElementById('studyPlanRows');if(!rows)return;const plan=getStudyPlan();rows.innerHTML=plan.map((x,i)=>`<tr><td>${escHtml(x.day||'Day')}</td><td><input aria-label="Task for ${escHtml(x.day||'day')}" value="${escHtml(x.task||'')}" oninput="updateStudyTask(${i},this.value)"></td><td><label class="study-check"><input type="checkbox" ${x.done?'checked':''} onchange="toggleStudyTask(${i},this.checked)"><span>${x.done?'Done':'Not done'}</span></label></td></tr>`).join('');const done=plan.filter(x=>x.done).length,total=plan.length,pct=total?Math.round(done/total*100):0;['plannerDone','plannerTotal','plannerPercent'].forEach((id,i)=>{const e=document.getElementById(id);if(e)e.textContent=i===0?done:i===1?total:pct+'%'});}
function saveStudyPlan(){localStorage.setItem('tusomeStudyPlan',JSON.stringify(getStudyPlan()));renderStudyPlan();showToast?.('Study plan saved.','success')}
function updateStudyTask(i,value){const p=getStudyPlan();if(p[i]){p[i].task=value.slice(0,140);localStorage.setItem('tusomeStudyPlan',JSON.stringify(p));}}
function toggleStudyTask(i,done){const p=getStudyPlan();if(p[i]){p[i].done=!!done;localStorage.setItem('tusomeStudyPlan',JSON.stringify(p));renderStudyPlan();}}
function addStudyTask(){const p=getStudyPlan();const days=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];p.push({day:days[p.length%days.length],task:'New study task',done:false});localStorage.setItem('tusomeStudyPlan',JSON.stringify(p));renderStudyPlan();}
function clearStudyPlan(){if(!confirm('Clear your study plan on this device?'))return;localStorage.removeItem('tusomeStudyPlan');renderStudyPlan();showToast?.('Study plan cleared.','info')}
function updateGoalProgress(value){const n=Math.max(0,Math.min(100,Number(value)||0));localStorage.setItem('tusomeGoalProgress',String(n));const bar=document.getElementById('plannerGoalBar'),label=document.getElementById('plannerGoalValue');if(bar)bar.style.width=n+'%';if(label)label.textContent=n+'%';}
function setPlannerGoal(){const current=localStorage.getItem('tusomeLearningGoal')||'';const goal=prompt('What is your main learning goal?',current);if(goal===null)return;const clean=goal.trim().slice(0,180);if(clean){localStorage.setItem('tusomeLearningGoal',clean);const t=document.getElementById('plannerGoalText');if(t)t.textContent=clean;showToast?.('Learning goal saved.','success')}else{localStorage.removeItem('tusomeLearningGoal');const t=document.getElementById('plannerGoalText');if(t)t.textContent='No learning goal set yet.';showToast?.('Learning goal cleared.','info')}}
function resetPlannerGoal(){updateGoalProgress(0);showToast?.('Goal progress reset.','info')}
function initStudyPlanner(){const goal=localStorage.getItem('tusomeLearningGoal');const pct=localStorage.getItem('tusomeGoalProgress')||'0';const t=document.getElementById('plannerGoalText');if(t)t.textContent=goal||'No learning goal set yet.';const slider=document.getElementById('plannerGoalPercent');if(slider)slider.value=pct;updateGoalProgress(pct);renderStudyPlan();}
initStudyPlanner();

async function loadDashboardPremiumTrial(role){
  const card=document.getElementById(role==='learner'?'learnerPremiumTrialCard':'teacherPremiumTrialCard');
  const text=document.getElementById(role==='learner'?'learnerTrialText':'teacherTrialText');
  const button=document.getElementById(role==='learner'?'learnerTrialButton':'teacherTrialButton');
  if(!card)return;
  try{
    const sRes=await fetch('/api/my/subscription',{credentials:'include'});
    const d=await parseApiResponse(sRes);
    if(!sRes.ok)throw new Error(d.error||'Could not load premium trial status.');
    const active=(d.subscriptions||[]).find(x=>x.audience===role && x.status==='trial' && x.trialEndsAt && new Date(x.trialEndsAt)>new Date());
    if(active){
      card.style.display='flex';
      text.textContent=`${active.name||'Premium'} is active until ${new Date(active.trialEndsAt).toLocaleString()}.`;
      text.className='trial-status';
      button.style.display='none';
      return;
    }
    if(d.trialAvailable){
      card.style.display='flex';
      text.textContent='Try premium features free for 2 days. No payment is required to start the trial.';
      text.className='';
      button.style.display='inline-flex';
      button.disabled=false;
      button.textContent='Start 2-Day Free Trial →';
      return;
    }
    card.style.display='none';
  }catch(e){
    card.style.display='flex';
    text.textContent=e.message||'Premium trial status could not be loaded.';
    text.className='';
    button.style.display='none';
  }
}

async function startDashboardPremiumTrial(role){
  const planKey=role==='learner'?'learner_plus':'teacher_plus';
  if(!confirm(`Start your 2-day ${role} premium trial? No payment is required.`))return;
  const button=document.getElementById(role==='learner'?'learnerTrialButton':'teacherTrialButton');
  if(button){button.disabled=true;button.textContent='Starting trial...';}
  try{
    const r=await fetch('/api/subscriptions/trial',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({planKey})});
    const d=await parseApiResponse(r); if(!r.ok)throw new Error(d.error||'Could not start the free trial.');
    showToast?.('2-day premium trial started.','success');
    await loadDashboardPremiumTrial(role);
    if(typeof loadMembership==='function')await loadMembership();
  }catch(e){
    showToast?.(e.message,'error');
    if(button){button.disabled=false;button.textContent='Start 2-Day Free Trial →';}
  }
}

async function loadMembership(){
  const plansBox=document.getElementById('membershipPlans'),statusBox=document.getElementById('membershipStatus'); if(!plansBox)return;
  try{
    const [pRes,sRes]=await Promise.all([fetch('/api/plans',{credentials:'include'}),fetch('/api/my/subscription',{credentials:'include'})]);
    const p=await parseApiResponse(pRes), d=await parseApiResponse(sRes);
    const subs=d.subscriptions||[], schools=d.schools||[];
    statusBox.innerHTML=subs.length?subs.slice(0,5).map(x=>`<div><b>${escapeHtml(x.name||x.planKey)}</b> — ${escapeHtml(x.status)} · ${escapeHtml(x.billingCycle||'')} · KES ${Number(x.amount||0).toFixed(2)}${x.endsAt?' · ends '+new Date(x.endsAt).toLocaleDateString():''}</div>`).join(''):'<b>No membership yet.</b> Choose a plan below.';
    if(schools.length) statusBox.innerHTML+=`<div style="margin-top:8px"><b>School:</b> ${schools.map(x=>escapeHtml(x.schoolName)+' ('+escapeHtml(x.status)+')').join(', ')}</div>`;
    const role=getSessionRole();
    const trialSub=subs.find(x=>x.audience===role&&x.status==='trial'&&x.trialEndsAt&&new Date(x.trialEndsAt)>new Date());
    if(['learner','teacher'].includes(role)){
      if(trialSub){ statusBox.innerHTML+=`<div class="premium-trial-card" style="margin-top:12px"><div><b>🎁 ${escapeHtml(trialSub.name||'Premium')} trial active</b><p class="trial-status">Active until ${new Date(trialSub.trialEndsAt).toLocaleString()}.</p></div></div>`; }
      else if(d.trialAvailable){ statusBox.innerHTML+=`<div class="premium-trial-card" style="margin-top:12px"><div><b>🎁 2-Day Free Premium Trial</b><p>Start premium access without payment.</p></div><button class="btn primary" type="button" onclick="startDashboardPremiumTrial('${role}')">Start Free Trial →</button></div>`; }
    }
    const schoolCard=document.querySelector('#membership .card:last-child'); if(schoolCard) schoolCard.style.display=['teacher','admin'].includes(getSessionRole())?'block':'none';
    plansBox.innerHTML=(p.plans||[]).filter(x=>x.audience!=='school').map(x=>`<div class="plan-card"><span class="market-badge">${x.audience==='learner'?'Learner':'Teacher'}</span><h3>${escapeHtml(x.name)}</h3><div class="plan-price">KES ${Number(x.priceMonthly||0).toFixed(0)} <small>/ month</small></div><div class="small">KES ${Number(x.priceYearly||0).toFixed(0)} / year</div><p>${escapeHtml(x.description||'')}</p><ul class="plan-features">${(x.features||[]).map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul><div class="admin-action-row"><button class="btn primary" onclick="payMembership('${escapeHtml(x.planKey)}','monthly')">Pay Monthly</button><button class="btn" onclick="payMembership('${escapeHtml(x.planKey)}','yearly')">Pay Yearly</button></div></div>`).join('')||'<div class="notice">No active plans are configured.</div>';
    if(document.getElementById('schoolRequestEmail') && !document.getElementById('schoolRequestEmail').value) document.getElementById('schoolRequestEmail').value=localStorage.getItem('tusomeCurrentUser')||'';
  }catch(e){statusBox.textContent='Could not load membership information.';showToast?.(e.message,'error')}
}
async function payMembership(planKey,billingCycle){
  const phone=document.getElementById('membershipPhone')?.value.trim();
  if(!phone){showToast?.('Enter the authorized M-PESA number first.','error');document.getElementById('membershipPhone')?.focus();return;}
  if(!confirm(`Start the ${billingCycle} membership payment? An M-PESA prompt will be sent to ${phone}. Only continue if you are authorized to use this payment number.`))return;
  try{
    const r=await fetch('/api/subscriptions/pay',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({planKey,billingCycle,phone})});
    const d=await parseApiResponse(r); if(!r.ok)throw new Error(d.error||'Could not start membership payment.');
    showToast?.('M-PESA prompt sent. Complete the payment on the authorized phone.','success');
    await pollMembershipPayment(d.checkoutRequestId);
  }catch(e){showToast?.(e.message,'error')}
}
async function pollMembershipPayment(checkoutRequestId){
  for(let i=0;i<20;i++){
    await new Promise(r=>setTimeout(r,3000));
    try{const r=await fetch('/api/subscriptions/payment-status/'+encodeURIComponent(checkoutRequestId),{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)continue;
      if(d.status==='paid' || d.subscriptionStatus==='active'){showToast?.('Membership payment confirmed and membership activated.','success');loadMembership();return;}
      if(d.status==='failed' || d.subscriptionStatus==='payment_failed'){showToast?.(d.resultDescription||'Membership payment was not completed.','error');loadMembership();return;}
    }catch{}
  }
  showToast?.('Payment is still being confirmed. Tap Refresh later to check membership status.','info');
}
async function requestMembership(planKey,billingCycle){return payMembership(planKey,billingCycle)}
async function requestSchoolPlan(){const schoolName=document.getElementById('schoolRequestName')?.value.trim(),contactEmail=document.getElementById('schoolRequestEmail')?.value.trim(),contactPhone=document.getElementById('schoolRequestPhone')?.value.trim(),planKey=document.getElementById('schoolRequestPlan')?.value||'school_starter';if(!schoolName){showToast?.('Enter the school name.','error');return}if(!confirm('Submit this school plan request? It does not charge the account.'))return;try{const r=await fetch('/api/schools/request',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolName,contactEmail,contactPhone,planKey})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Request failed.');showToast?.('School plan request submitted.','success');loadMembership()}catch(e){showToast?.(e.message,'error')}}
async function loadAdminMemberships(){try{const r=await fetch('/api/admin/subscriptions',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load memberships.');const subs=d.subscriptions||[], schools=d.schools||[];document.getElementById('adminSubRequests').textContent=subs.filter(x=>['requested','pending_payment'].includes(x.status)).length;document.getElementById('adminSubActive').textContent=subs.filter(x=>x.status==='active').length;document.getElementById('adminSchoolCount').textContent=schools.length;const tb=document.getElementById('adminSubscriptionsTable');tb.innerHTML=subs.length?subs.map(x=>`<tr><td>${new Date(x.requestedAt).toLocaleString()}</td><td>${escapeHtml(x.schoolName||x.userEmail||'—')}</td><td>${escapeHtml(x.name||x.planKey)}</td><td>KES ${Number(x.amount||0).toFixed(2)}</td><td>${escapeHtml(x.status)}</td><td>${['requested','pending_payment'].includes(x.status)?`<button class="btn" onclick="setSubscriptionStatus('${escapeHtml(x.subscriptionId)}','active')">Activate 30d</button> <button class="btn" onclick="setSubscriptionStatus('${escapeHtml(x.subscriptionId)}','rejected')">Reject</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="6">No membership requests.</td></tr>';const sb=document.getElementById('adminSchoolsTable');sb.innerHTML=schools.length?schools.map(x=>`<tr><td>${escapeHtml(x.schoolName)}</td><td>${escapeHtml(x.contactEmail||'—')}<br>${escapeHtml(x.contactPhone||'')}</td><td>${x.memberCount}</td><td>${escapeHtml(x.status)}</td><td>${x.status==='pending'?`<button class="btn" onclick="setSchoolStatus('${escapeHtml(x.schoolId)}','active')">Activate</button>`:x.status==='active'?`<button class="btn" onclick="setSchoolStatus('${escapeHtml(x.schoolId)}','suspended')">Suspend</button>`:`<button class="btn" onclick="setSchoolStatus('${escapeHtml(x.schoolId)}','active')">Reactivate</button>`}</td></tr>`).join(''):'<tr><td colspan="5">No school requests.</td></tr>'}catch(e){showToast?.(e.message,'error')}}
async function setSubscriptionStatus(id,status){if(!confirm(status==='active'?'Activate this membership for 30 days?':`Set membership to ${status}?`))return;try{const r=await fetch('/api/admin/subscriptions/'+encodeURIComponent(id)+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({status,days:30})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Update failed.');loadAdminMemberships()}catch(e){showToast?.(e.message,'error')}}
async function setSchoolStatus(id,status){if(!confirm(`Set school status to ${status}?`))return;try{const r=await fetch('/api/admin/schools/'+encodeURIComponent(id)+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({status})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Update failed.');loadAdminMemberships()}catch(e){showToast?.(e.message,'error')}}

configureAIAssistant(getSessionRole()||'learner');
let schoolWorkspaces=[]; let selectedSchoolId='';
async function openSchoolDashboard(skipHistory=false){
  const role=getSessionRole();
  const schoolAccess=sessionStorage.getItem('tusomeSchoolAccess')==='true';
  // School Plan has its own entry point. A teacher/learner/parent can have a
  // valid school membership while keeping their normal Tusome role.
  if(!role && !schoolAccess){
    showPageDirect('schoolDashboard',skipHistory);
    showSchoolAuthGate();
    return;
  }
  if(role!=='school' && role!=='admin' && !schoolAccess){
    showPageDirect('schoolDashboard',skipHistory);
    showSchoolAuthGate('Please use the School Plan login below to enter the authorised school workspace.');
    return;
  }
  showPageDirect('schoolDashboard',skipHistory);
  hideSchoolAuthGate();
  hideSchoolNameGate();
  showSchoolAdminDashboard();
}
function showSchoolAdminDashboard(){
  ['schoolAuthGate','schoolNameGate','schoolAccessPanel'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none'});
  ['schoolControlCentre','schoolManagementCentre','schoolPlanCard','schoolWorkspaceCard','schoolGlanceCard','schoolExecutiveOverview','schoolGeneralEssentialCards'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='block'});
  // The administrator dashboard does not need the automatic workspace explainer.
  // Keep the card available for non-admin school roles, but hide it from School Admin.
  const autoWorkspace=document.getElementById('schoolAutoWorkspaceCard');
  if(autoWorkspace)autoWorkspace.style.display='none';
  loadSchoolManagement();
}
function showSchoolNameGate(message=''){const msg=document.getElementById('schoolNameAccessMessage');if(msg)msg.textContent=message;}
async function verifySchoolAccess(e){return schoolSignIn(e)}
async function schoolMemberAccess(e){return schoolSignIn(e)}
function hideSchoolNameGate(){const gate=document.getElementById('schoolNameGate');if(gate)gate.style.display='none';}
function showSchoolAuthGate(message=''){
  // IMPORTANT: keep the login gate itself visible. The previous version
  // accidentally hid schoolAuthGate immediately after showing it, leaving
  // users stuck on a blank School Plan page.
  const gate=document.getElementById('schoolAuthGate');
  const accessPanel=document.getElementById('schoolAccessPanel');
  if(gate)gate.style.display='block';
  if(accessPanel)accessPanel.style.display='block';
  ['schoolControlCentre','schoolManagementCentre','schoolPlanCard','schoolWorkspaceCard','schoolGlanceCard','schoolNameGate','schoolExecutiveOverview','schoolGeneralEssentialCards','schoolRoleWorkspacePanel'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.style.display='none';
  });
  const signIn=document.getElementById('schoolSignInBox');
  const register=document.getElementById('schoolRegisterBox');
  if(signIn)signIn.style.display='block';
  if(register)register.style.display='none';
  const msg=document.getElementById('schoolAuthMessage');if(msg)msg.textContent=message;
}
function hideSchoolAuthGate(){const gate=document.getElementById('schoolAuthGate');if(gate)gate.style.display='none'; const access=document.getElementById('schoolAccessPanel'); if(access)access.style.display='none';}
function openSchoolSignIn(){
  const gate=document.getElementById('schoolAuthGate'); if(gate)gate.style.display='block';
  const access=document.getElementById('schoolAccessPanel'); if(access)access.style.display='block';
  const signIn=document.getElementById('schoolSignInBox'); if(signIn)signIn.style.display='block';
  const register=document.getElementById('schoolRegisterBox'); if(register)register.style.display='none';
  document.getElementById('schoolSignInIdentifier')?.focus();
}
function openSchoolMemberAccess(){openSchoolSignIn()}
function openSchoolFinanceAccess(){openSchoolSignIn()}
function openSchoolRegister(){
  document.getElementById('schoolSignInBox').style.display='none';
  document.getElementById('schoolRegisterBox').style.display='block';
  document.getElementById('schoolRegisterName')?.focus();
}
async function schoolSignIn(e){
  e.preventDefault();
  const form=e.target,button=form.querySelector('button[type="submit"]');
  button.disabled=true;button.textContent='Logging in…';
  try{
    const identifier=document.getElementById('schoolSignInIdentifier').value.trim();
    const password=document.getElementById('schoolSignInPassword').value;
    const r=await fetch('/api/schools/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({identifier,password})});
    const raw=await r.text(); let d={}; try{d=JSON.parse(raw)}catch{throw new Error('The school server returned an unexpected response. Please redeploy the latest EduShelf files on Render.');}
    if(!r.ok)throw new Error(d.error||'School login failed.');
    setSessionRole(d.user.role,d.user.email);
    selectedSchoolId=d.school.schoolId;
    schoolWorkspaces=[d.school];
    window.schoolLoginMemberRole=d.school.memberRole;
    sessionStorage.setItem('tusomeSchoolAccess','true');
    sessionStorage.setItem('tusomeSchoolMemberRole',d.school.memberRole);
    form.reset();
    // Always switch the visible page to the dedicated School Dashboard before
    // rendering the school member workspace. This prevents a teacher/learner
    // who was previously on the normal dashboard from remaining on that page.
    showPageDirect('schoolDashboard', true);
    hideSchoolAuthGate();
    hideSchoolNameGate();
    if(d.school.memberRole==='admin') showSchoolAdminDashboard();
    else openSchoolRoleWorkspace(d.school.memberRole);
    showToast?.(`Signed in. Opening ${d.school.memberRole==='bursar'?'Finance':d.school.memberRole} workspace.`, 'success');
  }catch(err){showToast?.(err.message,'error')}
  finally{button.disabled=false;button.textContent='Log In →'}
}

async function schoolRegister(e){
  e.preventDefault();const form=e.target,button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Creating school account...';
  try{
    const body={schoolName:document.getElementById('schoolRegisterName').value.trim(),email:document.getElementById('schoolRegisterEmail').value.trim(),phone:document.getElementById('schoolRegisterPhone').value.trim(),password:document.getElementById('schoolRegisterPassword').value};
    const r=await fetch('/api/auth/school-register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
    const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not create the school account.');
    setSessionRole(d.user.role,d.user.email);selectedSchoolId=d.school.schoolId;schoolWorkspaces=[{schoolId:d.school.schoolId,schoolName:d.school.schoolName,memberRole:'admin'}];sessionStorage.setItem('tusomeSchoolAccess','true');sessionStorage.setItem('tusomeSchoolMemberRole','admin');form.reset();showPageDirect('schoolDashboard',true);showSchoolAdminDashboard();showToast?.('School account created successfully.','success');
  }catch(err){showToast?.(err.message,'error')}finally{button.disabled=false;button.textContent='Create School Account'}
}

function showPageDirect(id,skipHistory=false){
  // Protected school dashboard must never expose its management content before authentication.
  // Some internal flows intentionally use showPageDirect(), so enforce the gate here too.
  if(id==='schoolDashboard'){
    const role=getSessionRole();
    const schoolAccess=sessionStorage.getItem('tusomeSchoolAccess')==='true';
    if(!role && !schoolAccess){
      const active=document.querySelector('.page.active');
      const current=active?.id;
      if(!skipHistory && current && current!=='schoolDashboard' && current!=='login'){
        appPageHistory=appPageHistory.filter(x=>x!=='schoolDashboard');
        appPageHistory.push(current);
        if(appPageHistory.length>12)appPageHistory.shift();
      }
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      const el=document.getElementById('schoolDashboard');if(el)el.classList.add('active');
      showSchoolAuthGate();
      window.scrollTo(0,0);
      return;
    }
  }
  const active=document.querySelector('.page.active');
  const current=active?.id;
  if(!skipHistory && current && current!==id && current!=='login'){
    appPageHistory=appPageHistory.filter(x=>x!==id);appPageHistory.push(current);if(appPageHistory.length>12)appPageHistory.shift();
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById(id);if(el)el.classList.add('active');
  refreshNotificationBadge();
}
async function updateSchoolDashboardNav(){
  const btn=document.getElementById('schoolDashboardNav');if(!btn)return;
  const role=getSessionRole();
  btn.style.display=(role==='school'||role==='admin')?'inline-block':'none';
}


async function loadSchoolPlanStatus(){
  const status=document.getElementById('schoolPlanStatus'),badge=document.getElementById('schoolPlanBadge'),box=document.getElementById('schoolPlanPaymentBox');
  if(!status||!badge)return;
  try{
    const r=await fetch('/api/my/subscription',{credentials:'include'}),d=await parseApiResponse(r);
    if(!r.ok)throw new Error(d.error||'Could not load school plan status.');
    const sid=selectedSchoolId||document.getElementById('schoolWorkspaceSelect')?.value||'';
    const schoolSubs=(d.schoolSubscriptions||[]).filter(x=>!sid||x.schoolId===sid);
    const current=schoolSubs.find(x=>['active','trial','requested','pending_payment'].includes(x.status));
    const isDemo=String(getSessionUserEmail?.()||'').toLowerCase()==='school@edushelf.com';
    if(!current){status.textContent=isDemo?'Demo school — no payment is required.':'No school plan subscription is currently linked to this school.';badge.textContent=isDemo?'Demo / Free':'No plan';if(box)box.style.display=(getCurrentSchoolMemberRole()==='admin'&&!isDemo)?'block':'none';if(!isDemo)await loadSchoolPlanOptions();return}
    status.textContent=isDemo?`${current.name||current.planKey} · Demo school · payment waived${current.endsAt?' · Demo access through '+new Date(current.endsAt).toLocaleDateString():''}`:`${current.name||current.planKey} · ${current.status}${current.endsAt?' · Ends '+new Date(current.endsAt).toLocaleDateString():''}`;
    badge.textContent=isDemo?'Demo / Free':(current.status==='active'?'Active':current.status.replace('_',' '));
    if(box)box.style.display=(getCurrentSchoolMemberRole()==='admin'&&!isDemo)?'block':'none';
    await loadSchoolPlanOptions();
  }catch(e){status.textContent=e.message;badge.textContent='Unavailable';if(box)box.style.display='none'}
}
function getCurrentSchoolMemberRole(){
  const opt=document.getElementById('schoolWorkspaceSelect')?.selectedOptions?.[0];
  return opt?.dataset?.memberRole||window.schoolData?.school?.memberRole||'';
}
async function loadSchoolPlanOptions(){
  const box=document.getElementById('schoolPlanOptions');if(!box)return;
  try{
    const r=await fetch('/api/plans',{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load school plans.');
    const plans=(d.plans||[]).filter(x=>x.audience==='school');
    box.innerHTML=plans.length?plans.map((p,i)=>`<label class="card" style="margin:0;cursor:pointer;border:1px solid #dbe5f2"><input type="radio" name="schoolPlanChoice" value="${escapeHtml(p.planKey)}" ${i===0?'checked':''} style="margin-right:8px"><b>${escapeHtml(p.name)}</b><div class="small" style="margin-top:6px">KES ${Number(p.priceMonthly||0).toLocaleString()}/month · KES ${Number(p.priceYearly||0).toLocaleString()}/year</div><div class="small" style="margin-top:6px">${escapeHtml(p.description||'')}</div></label>`).join(''):'<div class="notice">No school plans are currently available.</div>';
  }catch(e){box.innerHTML='<div class="notice">'+escapeHtml(e.message||'Could not load school plans.')+'</div>'}
}
async function paySchoolPlan(){
  const planKey=document.querySelector('input[name="schoolPlanChoice"]:checked')?.value||'';
  const cycle=document.getElementById('schoolPlanBillingCycle')?.value||'monthly';
  const phone=document.getElementById('schoolPlanPaymentPhone')?.value?.trim()||'';
  const msg=document.getElementById('schoolPlanPaymentMessage');
  if(!selectedSchoolId||!planKey)return showToast?.('Select a school plan first.','error');
  if(!phone)return showToast?.('Enter the M-PESA phone number to receive the payment prompt.','error');
  if(msg)msg.textContent='Starting secure M-PESA payment…';
  try{
    const r=await fetch('/api/schools/subscriptions/pay',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId,planKey,billingCycle:cycle,phone})});
    const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not start school plan payment.');
    if(msg)msg.textContent=d.message||'M-PESA prompt sent. Complete the payment on the authorized phone.';
    showToast?.('M-PESA payment prompt sent.','success');
    const checkout=d.checkoutRequestId;
    if(checkout){let attempts=0;const timer=setInterval(async()=>{attempts++;try{const sr=await fetch('/api/schools/subscriptions/payment-status/'+encodeURIComponent(checkout),{credentials:'include'}),sd=await parseApiResponse(sr);if(sr.ok&&(sd.status==='paid'||sd.subscriptionStatus==='active')){clearInterval(timer);if(msg)msg.textContent='School plan payment confirmed. Your school subscription is now active.';await loadSchoolPlanStatus();showToast?.('School plan activated successfully.','success')}else if(sr.ok&&(sd.status==='failed'||sd.subscriptionStatus==='payment_failed')){clearInterval(timer);if(msg)msg.textContent=sd.resultDescription||'The M-PESA payment was not completed.'}}catch(_e){}if(attempts>=30)clearInterval(timer)},4000)}
  }catch(e){if(msg)msg.textContent=e.message||'School plan payment failed.';showToast?.(e.message||'School plan payment failed.','error')}
}

function showSchoolRoleHome(){
  hideSchoolNameGate();
  const chooser=document.getElementById('schoolRoleChooser'); if(chooser)chooser.style.display='grid';
  const panel=document.getElementById('schoolRoleWorkspacePanel'); if(panel){panel.style.display='none';panel.innerHTML='';}
  ['schoolManagementCentre','schoolWorkspaceCard','schoolGlanceCard','schoolWorkspace','schoolPlanCard','schoolExecutiveOverview','schoolGeneralEssentialCards'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none'});
  const status=document.getElementById('schoolRoleStatus'); if(status)status.textContent='Choose your role to continue.';
  updateSchoolRoleCards();
}
function renderSchoolRoleWorkspace(role){
  const panel=document.getElementById('schoolRoleWorkspacePanel');
  const chooser=document.getElementById('schoolRoleChooser');
  if(!panel)return;
  const school=window.schoolData?.school?.schoolName || schoolWorkspaces.find(x=>x.schoolId===selectedSchoolId)?.schoolName || 'Your School';
  const configs={
    teacher:{icon:'👩🏽‍🏫',title:'School Teacher Workspace',desc:'Only school teaching functions are shown here. Your normal Tusome Teacher Dashboard remains separate.',items:[['attendance','📅','Attendance','Record and review attendance for your authorised school classes.'],['exams','📝','Exams & Results','Enter and review school assessment results for authorised classes.'],['timetable','🗓️','Timetable','View the school timetable and your assigned lessons.'],['communication','💬','School Communication','School messages and communication relevant to you.']]},
    learner:{icon:'🎓',title:'School Learner Workspace',desc:'Only school learning information is shown here. Use the normal Tusome sign-in for the broader learner platform.',items:[['attendance','📅','My Attendance','View your attendance records in this school.'],['exams','📊','My Results','View school examinations and published results.'],['timetable','🗓️','My Timetable','View your school lessons and timetable.'],['fees','💰','My School Fees','View school fee charges, payments and balance.']]},
    parent:{icon:'👪',title:'School Parent / Guardian Workspace',desc:'Only information connected to your authorised learner(s) and this school is shown here.',items:[['parent','📊','Learner Progress','View linked learner academic progress and assignments.'],['attendance','📅','Attendance','View attendance information for linked learners.'],['fees','💰','School Fees','View linked learner fee information and balances.'],['communication','💬','School Communication','View school communication available to parents/guardians.']]},
    bursar:{icon:'💳',title:'School Finance / Bursar Workspace',desc:'Finance users are restricted to school finance functions rather than learner or teacher dashboards.',items:[['fees','💰','Finance & Fees','Manage school fee charges, payments and balances.'],['fees','🧾','Payment Records','Review school payment records and outstanding balances.'],['fees','📈','Finance Overview','Open the school finance area for financial reporting and reconciliation.']]}};
  const cfg=configs[role];
  if(!cfg){panel.style.display='none';return;}
  if(chooser)chooser.style.display='none';
  panel.innerHTML=`<div class="topline" style="margin:0 0 12px"><div><h3 style="margin:0">${cfg.icon} ${cfg.title}</h3><p class="small" style="margin-top:6px"><b>${escapeHtml(school)}</b> · ${escapeHtml(cfg.desc)}</p></div><span class="tag">School Space</span></div><div class="school-module-grid">${cfg.items.map(([id,icon,title,desc])=>`<button class="school-module" type="button" onclick="openSchoolModule('${id}')"><span class="school-module-icon">${icon}</span><b>${title}</b><small>${desc}</small></button>`).join('')}</div><div class="notice" style="margin-top:14px"><b>Workspace boundary:</b> This school sign-in does not open the full learner or teacher dashboard. To use the broader Tusome platform, sign out and use the normal Tusome sign-in.</div>`;
  panel.style.display='block';
}
function openSchoolModule(id){
  const role=window.schoolLoginMemberRole||getCurrentSchoolMemberRole()||sessionStorage.getItem('tusomeSchoolMemberRole')||'';
  const allowed={teacher:['attendance','exams','timetable','communication'],learner:['attendance','exams','timetable','fees'],parent:['parent','attendance','fees','communication'],bursar:['fees']}[role]||[];
  if(!allowed.includes(id)){showToast?.('This school function is not available for your role.','error');return;}
  showPageDirect('schoolDashboard',true);
  hideSchoolAuthGate();
  renderSchoolRoleWorkspace(role);
  const status=document.getElementById('schoolRoleStatus');
  if(status)status.textContent='School workspace: '+(id==='fees'?'Finance & Fees':id.charAt(0).toUpperCase()+id.slice(1));
}
function updateSchoolRoleCards(){
  const role=getSessionRole();
  const memberRole=document.getElementById('schoolWorkspaceSelect')?.selectedOptions?.[0]?.dataset?.memberRole||'';
  const effective=memberRole||role;
  document.querySelectorAll('#schoolRoleChooser .school-module').forEach(btn=>{
    const onclick=btn.getAttribute('onclick')||''; const m=onclick.match(/openSchoolRoleWorkspace\('([^']+)'\)/); const target=m?.[1]; if(!target)return;
    const allowed=target==='parent'?role==='parent'||effective==='parent':target==='admin'?effective==='admin'||role==='admin':target==='bursar'?effective==='bursar'||effective==='admin'||role==='admin':effective===target||role===target||role==='admin';
    btn.style.opacity=allowed?'1':'0.52'; btn.setAttribute('aria-disabled',String(!allowed));
    const small=btn.querySelector('small'); if(small && !allowed && !small.dataset.original){small.dataset.original=small.textContent; small.textContent='Authorised '+target+' access required.';}
    if(small && allowed && small.dataset.original){small.textContent=small.dataset.original; delete small.dataset.original;}
  });
}

function openSchoolRoleWorkspace(target){
  // School-role workspaces must always render inside the School Dashboard page.
  if(document.getElementById('schoolDashboard') && !document.getElementById('schoolDashboard').classList.contains('active')){
    showPageDirect('schoolDashboard', true);
  }
  const role=getSessionRole();
  const memberRole=window.schoolLoginMemberRole||document.getElementById('schoolWorkspaceSelect')?.selectedOptions?.[0]?.dataset?.memberRole||role||'';
  const status=document.getElementById('schoolRoleStatus');
  const allowed = target==='parent' ? (role==='parent'||memberRole==='parent') : (target==='admin' ? memberRole==='admin'||role==='admin' : target==='bursar' ? memberRole==='bursar'||memberRole==='admin'||role==='admin' : memberRole===target||role===target||role==='admin');
  if(!allowed){ if(status) status.textContent='This workspace is locked for your account. Ask the school administrator to assign the correct role.'; showToast?.('Authorised school role required.','error'); return; }
  const chooser=document.getElementById('schoolRoleChooser'); if(chooser)chooser.style.display='none';
  ['schoolManagementCentre','schoolWorkspaceCard','schoolGlanceCard','schoolWorkspace'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none'});
  if(status) status.textContent=`Opening ${target==='bursar'?'Bursar / Finance':target==='parent'?'Parent / Guardian':target} workspace.`;
  if(['parent','learner','teacher','bursar'].includes(target)){ renderSchoolRoleWorkspace(target); return; }
  if(target==='admin'){
    ['schoolManagementCentre','schoolWorkspaceCard','schoolGlanceCard','schoolWorkspace','schoolPlanCard','schoolExecutiveOverview'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='block'});
    return loadSchoolManagement();
  }
}

let __schoolManagementPromise=null;
window.__schoolDashboardGeneration=window.__schoolDashboardGeneration||0;
function hasSchoolWorkspaceSession(){
  const role=String(getSessionRole()||'').trim().toLowerCase();
  return role==='school'||role==='admin'||sessionStorage.getItem('tusomeSchoolAccess')==='true';
}

async function openSchoolAdminSection(targetId,focusId=''){
  try{
    const sel=document.getElementById('schoolWorkspaceSelect');
    if(sel?.value)selectedSchoolId=sel.value;
    const memberRole=String(window.schoolLoginMemberRole||getCurrentSchoolMemberRole()||sel?.selectedOptions?.[0]?.dataset?.memberRole||sessionStorage.getItem('tusomeSchoolMemberRole')||'').toLowerCase();
    if(memberRole!=='admin'&&getSessionRole()!=='admin'&&getSessionRole()!=='school'){
      showToast?.('School administrator access is required to manage classes, subjects and teacher allocations.','error');
      return;
    }
    if(!document.getElementById('schoolDashboard')?.classList.contains('active'))showPageDirect('schoolDashboard',true);
    hideSchoolAuthGate();
    ['schoolManagementCentre','schoolWorkspaceCard','schoolGlanceCard','schoolPlanCard','schoolExecutiveOverview'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='block'});
    const workspace=document.getElementById('schoolWorkspace');
    if(!window.schoolData||!selectedSchoolId||!workspace||workspace.style.display==='none')await loadSchoolManagement();
    if(workspace?.style.display==='none'&&selectedSchoolId)await loadSelectedSchool();
    if(!selectedSchoolId||!workspace||workspace.style.display==='none'){
      showToast?.('The school workspace did not load. Use Refresh on the School Dashboard and check the school access message.','error');
      return;
    }
    const target=document.getElementById(targetId);
    if(!target){showToast?.('The requested school management section could not be found.','error');return;}
    target.scrollIntoView({behavior:'smooth',block:'start'});
    if(focusId){const field=document.getElementById(focusId);if(field)setTimeout(()=>field.focus({preventScroll:true}),300)}
  }catch(e){showToast?.(e.message||'Could not open the school management section.','error')}
}

async function loadSchoolManagement(){
  const role=getSessionRole();
  const schoolAccess=sessionStorage.getItem('tusomeSchoolAccess')==='true';
  if(!role && !schoolAccess){
    showSchoolAuthGate();
    return;
  }
  const generation=window.__schoolDashboardGeneration;
  if(__schoolManagementPromise)return __schoolManagementPromise;
  __schoolManagementPromise=(async()=>{
    const sel=document.getElementById('schoolWorkspaceSelect');if(!sel)return;
    try{
      const r=await fetch('/api/schools/mine',{credentials:'include'});
      const d=await parseApiResponse(r);
      if(!r.ok)throw new Error(d.error||'Could not load school access.');
      if(generation!==window.__schoolDashboardGeneration || !getSessionRole() || !hasSchoolWorkspaceSession())return;
      schoolWorkspaces=d.schools||[];updateSchoolRoleCards();
      sel.innerHTML=schoolWorkspaces.length?schoolWorkspaces.map(x=>`<option value="${escapeHtml(x.schoolId)}" data-member-role="${escapeHtml(x.memberRole)}">${escapeHtml(x.schoolName)} — ${escapeHtml(x.memberRole)}</option>`).join(''):'<option value="">No active school workspace</option>';
      if(!schoolWorkspaces.length){document.getElementById('schoolWorkspace').style.display='none';document.getElementById('schoolAccessStatus').textContent='No active school workspace is available. Request one from Premium Membership or ask your school administrator to add your account.';return;}
      selectedSchoolId=selectedSchoolId&&schoolWorkspaces.some(x=>x.schoolId===selectedSchoolId)?selectedSchoolId:schoolWorkspaces[0].schoolId;sel.value=selectedSchoolId;
      await loadSelectedSchool();
      if(generation!==window.__schoolDashboardGeneration || !getSessionRole() || !hasSchoolWorkspaceSession())return;
      await loadSchoolPlanStatus();
      if(generation!==window.__schoolDashboardGeneration || !getSessionRole() || !hasSchoolWorkspaceSession())return;
      await loadSchoolExecutiveOverview();
    }catch(e){sel.innerHTML='<option value="">Unable to load</option>';showToast?.(e.message,'error')}
  })();
  try{return await __schoolManagementPromise}finally{__schoolManagementPromise=null}
}

async function loadSchoolExecutiveOverview(){
  const box=document.getElementById('schoolExecutiveOverview'); if(!box)return;
  try{
    const sid=selectedSchoolId || document.getElementById('schoolWorkspaceSelect')?.value || '';
    if(!sid)return;
    const r=await fetch('/api/schools/overview?schoolId='+encodeURIComponent(sid),{credentials:'include'}),d=await parseApiResponse(r);
    if(!r.ok)throw new Error(d.error||'Could not load school overview.');
    const x=d.summary||{};
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    set('schoolExecTeachers',x.teachers??0); set('schoolExecLearners',x.learners??0); set('schoolExecClasses',x.classes??0);
    set('schoolExecAttendance',`${Number(x.attendancePercent||0).toFixed(1)}%`); set('schoolExecExams',x.exams??0); set('schoolExecAssignments',x.assignments??0);
    set('schoolExecFees',`KES ${Number(x.feesBilled||0).toLocaleString()}`); set('schoolExecParents',x.parents??0);
  }catch(e){
    ['schoolExecTeachers','schoolExecLearners','schoolExecClasses','schoolExecAttendance','schoolExecExams','schoolExecAssignments','schoolExecFees','schoolExecParents'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—'});
  }
}

let __selectedSchoolPromise=null;
async function loadSelectedSchool(){
  if(__selectedSchoolPromise)return __selectedSchoolPromise;
  __selectedSchoolPromise=(async()=>{
    const sel=document.getElementById('schoolWorkspaceSelect');selectedSchoolId=sel?.value||selectedSchoolId;if(!selectedSchoolId)return;
    try{
      const r=await fetch('/api/schools/dashboard?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'});
      const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load school dashboard.');
      document.getElementById('schoolWorkspace').style.display='block';document.getElementById('schoolAccessStatus').textContent=`${d.school.schoolName} · ${d.school.memberRole}`;document.getElementById('schoolMemberCount').textContent=d.counts.members;document.getElementById('schoolTeacherCount').textContent=d.counts.teachers;document.getElementById('schoolLearnerCount').textContent=d.counts.learners;document.getElementById('schoolClassCount').textContent=d.counts.classes;window.schoolData=d;renderSchoolManagement(d);loadAcademicManagement();loadRegisteredLearners();
    }catch(e){document.getElementById('schoolWorkspace').style.display='none';showToast?.(e.message,'error')}
  })();
  try{return await __selectedSchoolPromise}finally{__selectedSchoolPromise=null}
}
let __schoolParentMembersCache=null;
function toggleSchoolMembersFullList(force){
  const panel=document.getElementById('schoolMembersFullList');
  if(!panel)return;
  const shouldShow=typeof force==='boolean'?force:panel.style.display==='none';
  panel.style.display=shouldShow?'block':'none';
  if(shouldShow){
    showSchoolMemberGroup('learner');
    renderSchoolMemberGroups(window.schoolData?.members||[]);
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
}
async function showSchoolMemberGroup(group){
  ['learner','parent','teacher'].forEach(role=>{
    const el=document.getElementById('school'+role.charAt(0).toUpperCase()+role.slice(1)+'MemberGroup');
    if(el)el.style.display=role===group?'block':'none';
    const tab=document.getElementById('schoolMemberTab'+role.charAt(0).toUpperCase()+role.slice(1)+'s');
    if(tab)tab.classList.toggle('primary',role===group);
  });
  if(group==='parent' && !__schoolParentMembersCache){
    try{
      const r=await fetch('/api/schools/parents/credential-report?format=json',{credentials:'include'});
      const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load parents.');
      __schoolParentMembersCache=d.parents||[];
    }catch(e){showToast?.(e.message,'error');__schoolParentMembersCache=[];}
  }
  renderSchoolMemberGroups(window.schoolData?.members||[]);
}
function renderSchoolMemberGroups(members){
  const rows=Array.isArray(members)?members:[];
  const learners=rows.filter(m=>m.memberRole==='learner');
  const teachers=rows.filter(m=>m.memberRole==='teacher');
  const lr=document.getElementById('schoolLearnerMemberRows');
  const tr=document.getElementById('schoolTeacherMemberRows');
  const lc=document.getElementById('schoolLearnerGroupCount');
  const tc=document.getElementById('schoolTeacherGroupCount');
  const pc=document.getElementById('schoolParentGroupCount');
  if(lc)lc.textContent=`${learners.length} registered learner${learners.length===1?'':'s'}`;
  if(tc)tc.textContent=`${teachers.length} registered teacher${teachers.length===1?'':'s'}`;
  if(pc)pc.textContent=`${(__schoolParentMembersCache||[]).length} registered parent${(__schoolParentMembersCache||[]).length===1?'':'s'}`;
  if(lr)lr.innerHTML=learners.length?learners.map(m=>{const classLabel=[m.className,m.grade].filter(Boolean).join(' · ')+(m.stream?` — ${m.stream}`:'');return `<tr><td><b>${escapeHtml(m.fullName||'—')}</b></td><td>${escapeHtml(m.email||'—')}</td><td>${escapeHtml(m.username||'—')}</td><td>${escapeHtml(m.status||'—')}</td><td>${escapeHtml(classLabel||'—')}</td></tr>`}).join(''):'<tr><td colspan="5">No registered learners yet.</td></tr>';
  if(tr)tr.innerHTML=teachers.length?teachers.map(m=>`<tr><td><b>${escapeHtml(m.fullName||'—')}</b></td><td>${escapeHtml(m.email||'—')}</td><td>${escapeHtml(m.username||'—')}</td><td>${escapeHtml(m.status||'—')}</td></tr>`).join(''):'<tr><td colspan="4">No registered teachers yet.</td></tr>';
  const pr=document.getElementById('schoolParentMemberRows');
  const parents=Array.isArray(__schoolParentMembersCache)?__schoolParentMembersCache:[];
  if(pr)pr.innerHTML=parents.length?parents.map(m=>`<tr><td><b>${escapeHtml(m.parentName||'—')}</b></td><td>${escapeHtml(m.parentPhone||'—')}</td><td>${escapeHtml(m.username||'—')}</td><td>${escapeHtml(m.email||'—')}</td><td>${escapeHtml(m.linkedLearners||'—')}</td><td><button class="btn primary" type="button" onclick="resetParentPassword('${encodeURIComponent(m.email||'')}')">Reset password &amp; download CSV</button></td></tr>`).join(''):'<tr><td colspan="6">No registered parents / guardians yet.</td></tr>';
}

async function resetParentPassword(encodedEmail){
  const parentEmail=decodeURIComponent(String(encodedEmail||''));
  if(!selectedSchoolId)return showToast?.('Select a school workspace first.','error');
  if(!parentEmail)return showToast?.('Parent email is missing.','error');
  if(!confirm('Reset this parent account password? The current password will stop working. A new temporary password CSV will download.'))return;
  try{
    const r=await fetch('/api/schools/parents/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId,parentEmail})});
    const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not reset the parent password.');
    const p=d.parent||{};
    const csvCell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const csv=['Parent/Guardian Name,Parent Username,Parent Email,Phone,Temporary Password,Account Status', [p.parentName||'',p.username||p.phone||'',p.email||parentEmail,p.phone||'',d.temporaryPassword||'','Password reset — give to parent privately'].map(csvCell).join(',')].join('\n');
    downloadTextFile('\ufeff'+csv,'Tusome_Parent_Password_Reset_'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8');
    showToast?.('Parent password reset. Store the downloaded CSV securely and share the temporary password privately.','success');
  }catch(e){showToast?.(e.message||'Could not reset the parent password.','error')}
}

function toggleSchoolParentLinksPanel(){const p=document.getElementById('schoolParentLinksPanel');if(!p)return;const open=p.style.display==='none';p.style.display=open?'block':'none';if(open)loadSchoolParentLinks()}
function toggleSchoolRegisteredLearnersPanel(){const p=document.getElementById('schoolRegisteredLearnersPanel');if(!p)return;const open=p.style.display==='none';p.style.display=open?'block':'none';if(open)loadRegisteredLearners()}
function toggleSchoolTeacherListPanel(){const p=document.getElementById('schoolTeacherListPanel');if(!p)return;const open=p.style.display==='none';p.style.display=open?'block':'none';if(open){const teachers=(window.schoolData?.members||[]).filter(m=>m.memberRole==='teacher');const tb=document.getElementById('schoolTeacherListRows');if(tb)tb.innerHTML=teachers.length?teachers.map(m=>`<tr><td><b>${escapeHtml(m.fullName||'—')}</b></td><td>${escapeHtml(m.email||'—')}</td><td>${escapeHtml(m.username||'—')}</td><td>${escapeHtml(m.status||'—')}</td></tr>`).join(''):'<tr><td colspan="4">No registered teachers yet.</td></tr>';}}

function renderSchoolManagement(d){const classes=d.classes||[],members=d.members||[],materials=d.materials||[];const cls=document.getElementById('schoolClassesTable');const groups=[];const groupMap=new Map();classes.forEach(c=>{const key=`${String(c.grade||c.className||'').trim().toLowerCase()}|${String(c.className||'').trim().toLowerCase()}`;if(!groupMap.has(key)){const g={className:c.className||'',grade:c.grade||'',rows:[]};groupMap.set(key,g);groups.push(g)}groupMap.get(key).rows.push(c)});cls.innerHTML=groups.length?groups.map(g=>{const streams=g.rows.filter(c=>String(c.stream||'').trim());const plain=g.rows.filter(c=>!String(c.stream||'').trim());const streamHtml=streams.length?streams.map(c=>`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0"><span><b>${escapeHtml(c.stream)}</b> · ${c.learnerCount||0} learner${Number(c.learnerCount||0)===1?'':'s'}${c.teacherEmail?' · '+escapeHtml(c.teacherEmail):''}</span>${d.school.memberRole==='admin'||getSessionRole()==='admin'?`<button class="btn" type="button" onclick="deleteSchoolClass('${escapeHtml(c.classId)}')">Remove stream</button>`:'—'}</div>`).join(''):'<span class="small">No streams yet.</span>';const plainHtml=plain.map(c=>`<div style="margin:4px 0"><b>General</b> · ${c.learnerCount||0} learner${Number(c.learnerCount||0)===1?'':'s'} ${d.school.memberRole==='admin'||getSessionRole()==='admin'?`<button class="btn" type="button" onclick="deleteSchoolClass('${escapeHtml(c.classId)}')">Remove</button>`:''}</div>`).join('');return `<tr><td><b>${escapeHtml(g.className)}</b></td><td>${escapeHtml(g.grade||'—')}</td><td>${streamHtml}${plainHtml}</td><td>${g.rows.reduce((n,c)=>n+Number(c.learnerCount||0),0)}</td><td>${d.school.memberRole==='admin'||getSessionRole()==='admin'?`<button class="btn primary" type="button" onclick="addStreamToClass('${encodeURIComponent(g.className)}','${encodeURIComponent(g.grade||'')}')">＋ Add Stream</button>`:'—'}</td></tr>`}).join(''):'<tr><td colspan="5">No classes yet.</td></tr>';const mt=document.getElementById('schoolMembersTable');mt.innerHTML=members.length?members.map(m=>`<tr><td>${escapeHtml(m.email)}</td><td>${escapeHtml(m.memberRole)}</td><td>${escapeHtml(m.status)}</td><td>${(d.school.memberRole==='admin'||getSessionRole()==='admin')&&m.email!==getSessionUserEmail()?`<button class="btn" onclick="suspendSchoolMember('${encodeURIComponent(m.email)}')">Suspend</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="4">No members yet.</td></tr>';renderSchoolMemberGroups(members);const classLabel=c=>{const base=[c.className,c.grade].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · ');return c.stream?`${base} — ${c.stream}`:base};const cs=document.getElementById('schoolInviteClass');if(cs)cs.innerHTML='<option value="">No class</option>'+classes.map(c=>`<option value="${escapeHtml(c.classId)}">${escapeHtml(classLabel(c))}</option>`).join('');const lr=document.getElementById('learnerRegClass');if(lr)lr.innerHTML='<option value="">Select class / stream</option>'+classes.map(c=>`<option value="${escapeHtml(c.classId)}">${escapeHtml(classLabel(c))}</option>`).join('');const pls=document.getElementById('schoolParentLearner');if(pls){const learners=members.filter(m=>m.memberRole==='learner'&&m.status==='active');pls.innerHTML='<option value="">Select learner</option>'+learners.map(m=>`<option value="${escapeHtml(m.email)}">${escapeHtml(m.email)}</option>`).join('');}loadSchoolParentLinks();const rr=document.getElementById('schoolResources');rr.innerHTML=materials.length?materials.map(m=>`<div class="school-resource"><b>${escapeHtml(m.title)}</b><div class="small">${escapeHtml(m.subject||'')} · ${escapeHtml(m.grade||'')} · ${escapeHtml(m.teacherEmail||'')}</div><button class="btn" style="margin-top:6px" onclick="openMaterialById('${escapeHtml(m.id)}')">Open</button></div>`).join(''):'<div class="notice">No approved learning resources yet.</div>';}
function getSessionUserEmail(){return sessionStorage.getItem('tusomeCurrentUser')||localStorage.getItem('tusomeCurrentUser')||''}
async function loadAcademicManagement(){if(!selectedSchoolId)return;try{const r=await fetch('/api/schools/academic?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load academic data.');window.academicData=d;renderAcademicManagement(d);loadSchoolSubmissions();loadSchoolGradebook()}catch(e){showToast?.(e.message,'error')}}
function renderAcademicManagement(d){const subjects=d.subjects||[],alloc=d.allocations||[],terms=d.terms||[],assignments=d.assignments||[],members=(window.schoolData?.members||[]),classes=(window.schoolData?.classes||[]);const isAdmin=window.schoolData?.school?.memberRole==='admin'||getSessionRole()==='admin';const teacherList=members.filter(m=>m.memberRole==='teacher'&&m.status==='active');const classMap=new Map(classes.map(c=>[String(c.classId),c]));const classLabel=c=>{const base=[c.className,c.grade].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · ');return c.stream?`${base} — ${c.stream}`:base};const labelForId=id=>{const c=classMap.get(String(id));return c?classLabel(c):'Class';};const opts=(arr,val,text)=>arr.map(x=>`<option value="${escapeHtml(val(x))}">${escapeHtml(text(x))}</option>`).join('');document.getElementById('academicSubjectsTable').innerHTML=subjects.length?subjects.map(x=>`<tr><td>${escapeHtml(x.subjectName)}</td><td>${escapeHtml(x.learningArea||'—')}</td></tr>`).join(''):'<tr><td colspan="2">No subjects yet.</td></tr>';document.getElementById('academicTermsTable').innerHTML=terms.length?terms.map(x=>`<tr><td>${escapeHtml(x.academicYear)}</td><td>${escapeHtml(x.termName)}</td><td>${escapeHtml(x.startsOn||'—')} → ${escapeHtml(x.endsOn||'—')}</td><td>${escapeHtml(x.status)}</td></tr>`).join(''):'<tr><td colspan="4">No terms yet.</td></tr>';document.getElementById('academicAllocationsTable').innerHTML=alloc.length?alloc.map(x=>`<tr><td>${escapeHtml(x.teacherEmail)}</td><td>${escapeHtml(labelForId(x.classId||''))}</td><td>${escapeHtml(x.subjectName)}</td></tr>`).join(''):'<tr><td colspan="3">No teacher allocations yet.</td></tr>';document.getElementById('schoolAssignmentsTable').innerHTML=assignments.length?assignments.map(x=>`<tr><td>${escapeHtml(x.title)}</td><td>${escapeHtml(labelForId(x.classId||''))}</td><td>${escapeHtml(x.subjectName)}</td><td>${escapeHtml(x.teacherEmail)}</td><td>${x.dueAt?escapeHtml(new Date(x.dueAt).toLocaleString()):'—'}</td></tr>`).join(''):'<tr><td colspan="5">No assignments yet.</td></tr>';const ts=document.getElementById('academicTeacherSelect'),cs=document.getElementById('academicClassSelect'),ss=document.getElementById('academicSubjectSelect'),acs=document.getElementById('assignmentClassSelect'),ass=document.getElementById('assignmentSubjectSelect');if(ts)ts.innerHTML='<option value="">Select teacher</option>'+opts(teacherList,x=>x.email,x=>x.email);if(cs)cs.innerHTML='<option value="">Select class / stream</option>'+opts(classes,x=>x.classId,x=>classLabel(x));if(ss)ss.innerHTML='<option value="">Select subject</option>'+opts(subjects,x=>x.subjectId,x=>x.subjectName);if(acs)acs.innerHTML='<option value="">Select class / stream</option>'+opts(classes,x=>x.classId,x=>classLabel(x));if(ass)ass.innerHTML='<option value="">Select subject</option>'+opts(subjects,x=>x.subjectId,x=>x.subjectName);if(!isAdmin){['academicSubjectName','academicLearningArea','academicYear','academicStartsOn','academicEndsOn','academicTeacherSelect','academicClassSelect','academicSubjectSelect','assignmentClassSelect','assignmentSubjectSelect','assignmentTitle','assignmentInstructions','assignmentDueAt'].forEach(id=>{const e=document.getElementById(id);if(e)e.disabled=true;});}}

async function createAcademicSubject(){const body={schoolId:selectedSchoolId,subjectName:document.getElementById('academicSubjectName').value.trim(),learningArea:document.getElementById('academicLearningArea').value.trim()};if(!body.subjectName)return showToast?.('Enter a subject name.','error');await academicPost('/api/schools/subjects',body,'Subject added.');}
async function createAcademicTerm(){const body={schoolId:selectedSchoolId,academicYear:document.getElementById('academicYear').value.trim(),termName:document.getElementById('academicTermName').value,startsOn:document.getElementById('academicStartsOn').value||null,endsOn:document.getElementById('academicEndsOn').value||null,status:'planned'};if(!body.academicYear)return showToast?.('Enter the academic year.','error');await academicPost('/api/schools/terms',body,'Term added.');}
async function createAcademicAllocation(){const body={schoolId:selectedSchoolId,teacherEmail:document.getElementById('academicTeacherSelect').value,classId:document.getElementById('academicClassSelect').value,subjectId:document.getElementById('academicSubjectSelect').value};if(!body.teacherEmail||!body.classId||!body.subjectId)return showToast?.('Select teacher, class and subject.','error');await academicPost('/api/schools/allocations',body,'Teacher assigned.');}
async function createSchoolAssignment(){const body={schoolId:selectedSchoolId,classId:document.getElementById('assignmentClassSelect').value,subjectId:document.getElementById('assignmentSubjectSelect').value,title:document.getElementById('assignmentTitle').value.trim(),instructions:document.getElementById('assignmentInstructions').value.trim(),dueAt:document.getElementById('assignmentDueAt').value||null};if(!body.classId||!body.subjectId||!body.title)return showToast?.('Select class, subject and title.','error');await academicPost('/api/schools/assignments',body,'Assignment created.');}
async function academicPost(url,body,msg){try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Request failed.');showToast?.(msg,'success');loadSelectedSchool()}catch(e){showToast?.(e.message,'error')}}

async function loadLearnerAssignments(){
  if(getSessionRole()!=='learner')return; const grid=document.getElementById('learnerAssignmentsGrid'),note=document.getElementById('learnerAssignmentsNote'); if(!grid)return;
  try{const r=await fetch('/api/learner/assignments',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load assignments.');const rows=d.assignments||[];note.textContent=rows.length?`${rows.length} assignment${rows.length===1?'':'s'} available.`:'No class assignments have been posted for your enrolled school class yet.';
    grid.innerHTML=rows.map(a=>{const submitted=!!a.submissionId,graded=a.status==='returned'||a.status==='graded',overdue=a.dueAt&&!graded&&!submitted&&new Date(a.dueAt)<new Date(),id=escapeHtml(a.assignmentId);return `<article class="assignment-card"><span class="assignment-status ${graded?'graded':overdue?'overdue':''}">${graded?'Returned & graded':submitted?'Submitted':overdue?'Past due':'Not submitted'}</span><h4>${escapeHtml(a.title)}</h4><p><b>${escapeHtml(a.subjectName)}</b> · ${escapeHtml(a.className)}</p><p>${escapeHtml(a.instructions||'No additional instructions.')}</p><p class="small">Teacher: ${escapeHtml(a.teacherEmail)}${a.dueAt?' · Due: '+escapeHtml(new Date(a.dueAt).toLocaleString()):''}</p>${graded?`<div class="assignment-note"><b>Result:</b> ${escapeHtml(a.marks)} / ${escapeHtml(a.maxMarks)}${a.feedback?`<br><b>Teacher feedback:</b> ${escapeHtml(a.feedback)}`:''}</div>`:''}<div class="assignment-actions"><button class="btn primary" type="button" onclick="openAssignmentSubmit('${id}')">${submitted?'View / Resubmit':'Submit Work'}</button>${a.fileName?`<a class="btn" href="/api/learner/assignments/${encodeURIComponent(a.assignmentId)}/file" target="_blank" rel="noopener">Open Submitted File</a>`:''}</div><div id="submitBox_${id}" style="display:none;margin-top:12px"><textarea id="answer_${id}" maxlength="12000" placeholder="Write your answer here…">${escapeHtml(a.textAnswer||'')}</textarea><label>Optional file<input id="file_${id}" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"></label><p class="small">Maximum file size: 6 MB.</p><button class="btn primary" type="button" onclick="submitLearnerAssignment('${id}')">Submit / Resubmit</button><button class="btn" type="button" onclick="document.getElementById('submitBox_${id}').style.display='none'">Cancel</button><span id="submitMsg_${id}" class="small"></span></div></article>`}).join('');
  }catch(e){note.textContent=e.message;grid.innerHTML=''}
}
function openAssignmentSubmit(id){const el=document.getElementById('submitBox_'+id);if(el)el.style.display=el.style.display==='none'?'block':'none'}
async function loadLearnerGradebook(){
  const body=document.getElementById('learnerGradebookRows'); if(!body)return;
  try{const r=await fetch('/api/learner/gradebook',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load progress.');
    document.getElementById('learnerGradeAssignments').textContent=d.summary.assignments||0;document.getElementById('learnerGradeSubmitted').textContent=d.summary.submitted||0;document.getElementById('learnerGradeGraded').textContent=d.summary.graded||0;document.getElementById('learnerGradeAverage').textContent=d.summary.graded?(d.summary.averagePercent+'%'):'—';
    body.innerHTML=d.rows.length?d.rows.map(x=>`<tr><td>${escapeHtml(x.subjectName)}</td><td>${escapeHtml(x.title)}</td><td>${escapeHtml(x.className)}</td><td>${escapeHtml(x.status||'Not submitted')}</td><td class="grade-cell">${x.marks!=null?escapeHtml(x.marks)+' / '+escapeHtml(x.maxMarks||100):'—'}</td><td>${escapeHtml(x.feedback||'—')}</td></tr>`).join(''):'<tr><td colspan="6">No assignment results yet.</td></tr>';
  }catch(e){body.innerHTML='<tr><td colspan="6">'+escapeHtml(e.message)+'</td></tr>'}
}

async function loadSchoolGradebook(){
  if(!selectedSchoolId||!['teacher','admin'].includes(getSessionRole()))return; const body=document.getElementById('schoolGradebookRows');if(!body)return;
  try{const r=await fetch('/api/schools/gradebook?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load gradebook.');
    const rows=[]; for(const learner of d.learners){for(const a of d.assignments.filter(x=>x.classId===learner.classId)){const sub=d.submissions.find(x=>x.assignmentId===a.assignmentId&&x.learnerEmail===learner.learnerEmail);rows.push({learner,a,sub});}}
    body.innerHTML=rows.length?rows.map(x=>`<tr><td>${escapeHtml(x.learner.learnerEmail)}</td><td>${escapeHtml(x.a.className)}</td><td>${escapeHtml(x.a.subjectName)}</td><td>${escapeHtml(x.a.title)}</td><td>${escapeHtml(x.sub?.status||'Not submitted')}</td><td class="grade-cell">${x.sub?.marks!=null?escapeHtml(x.sub.marks)+' / '+escapeHtml(x.sub.maxMarks||100):'—'}</td><td>${escapeHtml(x.sub?.feedback||'—')}</td></tr>`).join(''):'<tr><td colspan="7">No gradebook records yet.</td></tr>';
  }catch(e){body.innerHTML='<tr><td colspan="7">'+escapeHtml(e.message)+'</td></tr>'}
}

async function submitLearnerAssignment(id){const answer=document.getElementById('answer_'+id)?.value.trim()||'',file=document.getElementById('file_'+id)?.files?.[0],msg=document.getElementById('submitMsg_'+id);if(!answer&&!file){if(msg)msg.textContent='Add an answer or choose a file.';return}if(file&&file.size>6*1024*1024){if(msg)msg.textContent='File must be 6 MB or smaller.';return}let fileData='';if(file){fileData=await new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(rd.result);rd.onerror=reject;rd.readAsDataURL(file)})}try{const r=await fetch('/api/learner/assignments/'+encodeURIComponent(id)+'/submit',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({textAnswer:answer,fileName:file?.name||'',fileMime:file?.type||'',fileData})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not submit assignment.');showToast?.(d.message||'Assignment submitted.','success');loadLearnerAssignments()}catch(e){if(msg)msg.textContent=e.message}}
async function loadSchoolSubmissions(){if(!selectedSchoolId||!['teacher','admin'].includes(getSessionRole()))return;try{const r=await fetch('/api/schools/submissions?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load submissions.');const rows=d.submissions||[],body=document.getElementById('schoolSubmissionsRows');if(!body)return;body.innerHTML=rows.length?rows.map(x=>`<tr><td>${escapeHtml(x.learnerEmail)}</td><td><b>${escapeHtml(x.title)}</b><br><small>${escapeHtml(x.subjectName)}</small></td><td>${escapeHtml(x.className)}</td><td>${escapeHtml(x.status)}</td><td>${x.marks!=null?escapeHtml(x.marks)+' / '+escapeHtml(x.maxMarks):'—'}</td><td>${escapeHtml(x.feedback||'—')}</td><td><button class="btn" onclick='gradeSchoolSubmission(${JSON.stringify(x.submissionId)},${x.marks==null?'null':Number(x.marks)},${Number(x.maxMarks||100)},${JSON.stringify(x.feedback||'')})'>Grade</button>${x.fileName?` <a class="btn" href="/api/schools/submissions/${encodeURIComponent(x.submissionId)}/file?schoolId=${encodeURIComponent(selectedSchoolId)}" target="_blank" rel="noopener">File</a>`:''}</td></tr>`).join(''):'<tr><td colspan="7">No submissions yet.</td></tr>'}catch(e){const b=document.getElementById('schoolSubmissionsRows');if(b)b.innerHTML='<tr><td colspan="7">'+escapeHtml(e.message)+'</td></tr>'}}
async function gradeSchoolSubmission(id,current,max,feedback){const marks=prompt('Enter marks (maximum '+max+'):',current==null?'':current);if(marks===null)return;const n=Number(marks);if(!Number.isFinite(n)||n<0||n>max){showToast?.('Enter valid marks within the maximum.','error');return}const fb=prompt('Teacher feedback:',feedback||'');if(fb===null)return;try{const r=await fetch('/api/schools/submissions/'+encodeURIComponent(id)+'/grade?schoolId='+encodeURIComponent(selectedSchoolId),{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({marks:n,maxMarks:max,feedback:fb})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not save grade.');showToast?.(d.message||'Grade saved.','success');loadSchoolSubmissions()}catch(e){showToast?.(e.message,'error')}}

async function loadParentChildren(){const sel=document.getElementById('parentChildSelect');if(!sel||getSessionRole()!=='parent')return;try{const r=await fetch('/api/parent/children',{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load linked learners.');const children=d.children||[];sel.innerHTML=children.length?children.map(x=>`<option value="${escapeHtml(x.learnerEmail)}">${escapeHtml(x.learnerEmail)} — ${escapeHtml(x.schoolName)}${x.className?' · '+escapeHtml(x.className):''}</option>`).join(''):'<option value="">No linked learners</option>';document.getElementById('parentNoLinks').style.display=children.length?'none':'block';document.getElementById('parentDashboardContent').style.display=children.length?'block':'none';if(children.length)await loadParentDashboard()}catch(e){document.getElementById('parentChildStatus').textContent=e.message;document.getElementById('parentNoLinks').style.display='block';document.getElementById('parentDashboardContent').style.display='none'}}
async function loadParentDashboard(){const learner=document.getElementById('parentChildSelect')?.value;if(!learner)return;try{const r=await fetch('/api/parent/dashboard?learnerEmail='+encodeURIComponent(learner),{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load learner progress.');document.getElementById('parentSchoolName').textContent=d.school?.schoolName||'—';document.getElementById('parentClassName').textContent=d.profile?.className||'—';document.getElementById('parentAverage').textContent=d.summary?.gradedSubjects?`${d.summary.averagePercent}%`:'—';document.getElementById('parentGradedSubjects').textContent=d.summary?.gradedSubjects||0;const gr=document.getElementById('parentGradesRows');gr.innerHTML=d.grades?.length?d.grades.map(x=>`<tr><td>${escapeHtml(x.subjectName)}</td><td>${escapeHtml(x.gradedCount)}</td><td>${Number(x.percent||0).toFixed(2)}%</td></tr>`).join(''):'<tr><td colspan="3">No graded results have been shared yet.</td></tr>';const ar=document.getElementById('parentAssignmentsRows');ar.innerHTML=d.assignments?.length?d.assignments.map(x=>`<tr><td>${escapeHtml(x.title)}</td><td>${escapeHtml(x.subjectName)}</td><td>${escapeHtml(x.status||'Not submitted')}</td><td>${x.marks!=null?escapeHtml(x.marks)+' / '+escapeHtml(x.maxMarks||100):'—'}</td></tr>`).join(''):'<tr><td colspan="4">No assignments yet.</td></tr>';document.getElementById('parentAI').textContent=`${d.grades?.length||0} subject progress record(s) and ${d.assignments?.length||0} assignment record(s) are available for this learner.`;window.parentDashboardData=d}catch(e){showToast?.(e.message,'error')}}
async function loadSchoolParentLinks(){if(!selectedSchoolId||!['admin'].includes(window.schoolData?.school?.memberRole)&&getSessionRole()!=='admin')return;try{const r=await fetch('/api/schools/parent-links?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load parent links.');const tb=document.getElementById('schoolParentLinksTable');if(tb)tb.innerHTML=d.links?.length?d.links.map(x=>`<tr><td>${escapeHtml(x.parentEmail)}</td><td>${escapeHtml(x.learnerEmail)}</td><td>${escapeHtml(x.className||'—')}</td><td><button class="btn" onclick="removeSchoolParentLink('${escapeHtml(x.linkId)}')">Remove</button></td></tr>`).join(''):'<tr><td colspan="4">No parent links yet.</td></tr>'}catch(e){const tb=document.getElementById('schoolParentLinksTable');if(tb)tb.innerHTML='<tr><td colspan="4">'+escapeHtml(e.message)+'</td></tr>'}}
async function linkSchoolParent(){const parentEmail=document.getElementById('schoolParentEmail')?.value.trim(),learnerEmail=document.getElementById('schoolParentLearner')?.value;if(!parentEmail||!learnerEmail)return showToast?.('Enter the parent email and select a learner.','error');try{const r=await fetch('/api/schools/parent-links',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId,parentEmail,learnerEmail})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not link parent.');showToast?.('Parent linked to learner.','success');document.getElementById('schoolParentEmail').value='';loadSchoolParentLinks()}catch(e){showToast?.(e.message,'error')}}
async function removeSchoolParentLink(id){if(!confirm('Remove this parent-learner link?'))return;try{const r=await fetch('/api/schools/parent-links/'+encodeURIComponent(id),{method:'DELETE',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not remove link.');loadSchoolParentLinks()}catch(e){showToast?.(e.message,'error')}}

function openVisibleLearnerRegistration(){
  const box=document.getElementById('visibleLearnerRegistration');
  const card=document.getElementById('schoolLearnerRegistrationQuick');
  if(card) card.style.display='block';
  if(box) box.style.display=box.style.display==='none'?'block':'none';
  const source=document.getElementById('learnerRegClass');
  const target=document.getElementById('visibleLearnerRegClass');
  if(source&&target&&source.options.length>1){target.innerHTML=source.innerHTML;}
  if(target&&target.options.length<=1){loadSchoolRegistrationClasses();}
  document.getElementById('visibleLearnerRegName')?.focus();
}
async function loadSchoolRegistrationClasses(){
  const target=document.getElementById('visibleLearnerRegClass'); if(!target)return;
  const sid=selectedSchoolId||document.getElementById('schoolWorkspaceSelect')?.value||''; if(!sid)return;
  try{const r=await fetch('/api/schools/dashboard?schoolId='+encodeURIComponent(sid),{credentials:'include'});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load classes.');const classes=d.classes||[];target.innerHTML='<option value="">Select class / stream</option>'+classes.map(c=>{const base=[c.className,c.grade].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · ');return `<option value="${escapeHtml(c.classId)}">${escapeHtml(base)}${c.stream?' — '+escapeHtml(c.stream):''}</option>`}).join('');}catch(e){showToast?.(e.message,'error')}
}
async function registerVisibleSchoolLearner(){
  const sid=selectedSchoolId||document.getElementById('schoolWorkspaceSelect')?.value||'';
  const body={schoolId:sid,fullName:document.getElementById('visibleLearnerRegName')?.value.trim(),admissionNumber:document.getElementById('visibleLearnerRegAdmission')?.value.trim(),classId:document.getElementById('visibleLearnerRegClass')?.value,gender:document.getElementById('visibleLearnerRegGender')?.value,dateOfBirth:document.getElementById('visibleLearnerRegDob')?.value||null,phone:document.getElementById('visibleLearnerRegPhone')?.value.trim(),email:document.getElementById('visibleLearnerRegEmail')?.value.trim(),guardianName:document.getElementById('visibleLearnerRegGuardianName')?.value.trim(),guardianPhone:document.getElementById('visibleLearnerRegGuardianPhone')?.value.trim()};
  try{const r=await fetch('/api/schools/learners/register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not register learner.');const n=document.getElementById('visibleLearnerRegCredentialNotice');if(n){n.style.display='block';n.innerHTML='<b>Account created successfully.</b><br>Username: <b>'+escapeHtml(d.learner.username)+'</b><br>Temporary password: <b>'+escapeHtml(d.temporaryPassword)+'</b><br><span class="small">Give these credentials securely to the learner or authorised guardian.</span>';}showToast?.('Learner registered and account created.','success');await loadSchoolRegistrationClasses();['visibleLearnerRegName','visibleLearnerRegAdmission','visibleLearnerRegDob','visibleLearnerRegPhone','visibleLearnerRegEmail','visibleLearnerRegGuardianName','visibleLearnerRegGuardianPhone'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});document.getElementById('visibleLearnerRegGender').value='';document.getElementById('visibleLearnerRegClass').value='';}catch(e){showToast?.(e.message,'error')}
}

async function registerSchoolLearner(){
  if(!selectedSchoolId)return showToast?.('Select a school workspace first.','error');
  const body={schoolId:selectedSchoolId,fullName:document.getElementById('learnerRegName')?.value.trim(),admissionNumber:document.getElementById('learnerRegAdmission')?.value.trim(),classId:document.getElementById('learnerRegClass')?.value,gender:document.getElementById('learnerRegGender')?.value,dateOfBirth:document.getElementById('learnerRegDob')?.value||null,phone:document.getElementById('learnerRegPhone')?.value.trim(),email:document.getElementById('learnerRegEmail')?.value.trim(),guardianName:document.getElementById('learnerRegGuardianName')?.value.trim(),guardianPhone:document.getElementById('learnerRegGuardianPhone')?.value.trim()};
  if(!body.fullName||!body.admissionNumber||!body.classId)return showToast?.('Enter the learner name, admission number and class/stream.','error');
  try{const r=await fetch('/api/schools/learners/register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not register learner.');const n=document.getElementById('learnerRegCredentialNotice');if(n){n.style.display='block';n.innerHTML='<b>Account created successfully.</b><br>Username: <b>'+escapeHtml(d.learner.username)+'</b><br>Temporary password: <b>'+escapeHtml(d.temporaryPassword)+'</b><br><span class="small">Give these credentials securely to the learner/authorised guardian. The learner must change the temporary password after first login.</span>';}showToast?.('Learner registered and account created.','success');['learnerRegName','learnerRegAdmission','learnerRegDob','learnerRegPhone','learnerRegEmail','learnerRegGuardianName','learnerRegGuardianPhone'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});document.getElementById('learnerRegGender').value='';document.getElementById('learnerRegClass').value='';await loadSelectedSchool();}catch(e){showToast?.(e.message,'error')}
}

let bulkLearnerRows=[];
async function openBulkLearnerRegistration(){
  try{
    const workspace=document.getElementById('schoolWorkspace');
    const sel=document.getElementById('schoolWorkspaceSelect');
    if(sel?.value) selectedSchoolId=sel.value;
    if(workspace && workspace.style.display==='none'){
      if(selectedSchoolId){
        await loadSelectedSchool();
      }else{
        const first=schoolWorkspaces?.[0]?.schoolId||'';
        if(first){selectedSchoolId=first;await loadSelectedSchool();}
      }
    }
    const target=document.getElementById('bulkLearnerCsvFile');
    if(target){target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.focus({preventScroll:true}),350);}
  }catch(e){showToast?.(e.message||'Could not open bulk learner registration.','error')}
}
function parseCsvLine(line){const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){out.push(cur.trim());cur='';}else cur+=ch;}out.push(cur.trim());return out;}
function parseCsvText(text){const lines=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());if(!lines.length)return [];const headers=parseCsvLine(lines[0]).map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,''));return lines.slice(1).map(line=>{const vals=parseCsvLine(line),o={};headers.forEach((h,i)=>o[h]=vals[i]??'');return {fullName:o.fullname||'',admissionNumber:o.admissionnumber||'',className:o.classgrade||o.class||'',stream:o.stream||'',gender:o.gender||'',dateOfBirth:o.dob||o.dateofbirth||'',phone:o.learnerphone||o.phone||'',email:o.learneremail||o.email||'',guardianName:o.parentguardianname||o.guardianname||'',guardianPhone:o.parentguardianphone||o.guardianphone||'',guardianEmail:o.parentguardianemail||o.guardianemail||o.parentemail||''};}).filter(x=>Object.values(x).some(v=>String(v).trim()));}
function downloadBulkLearnerTemplate(){const headers=['Full Name','Admission Number','Class/Grade','Stream','Gender','DOB','Learner Phone','Learner Email','Parent/Guardian Name','Parent/Guardian Phone','Parent/Guardian Email'];const example=['Amina Wanjiku','ADM-2026-001','Grade 4','Blue','Female','2016-03-12','0712345678','amina@example.com','Mary Wanjiku','0722123456','mary@example.com'];const csv=headers.map(v=>'"'+v+'"').join(',')+'\n'+example.map(v=>'"'+v.replace(/"/g,'""')+'"').join(',')+'\n';const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Tusome_Learner_Bulk_Registration_Template.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function clearBulkLearnerPreview(keepNotice=false){bulkLearnerRows=[];const f=document.getElementById('bulkLearnerCsvFile');if(f)f.value='';document.getElementById('bulkLearnerPreviewWrap').style.display='none';document.getElementById('bulkLearnerPreviewStatus').textContent='';document.getElementById('bulkLearnerRegisterBtn').disabled=true;if(!keepNotice)document.getElementById('bulkLearnerCredentialNotice').style.display='none';}
async function previewBulkLearnerCsv(input){const file=input?.files?.[0];if(!file)return;try{if(file.size>2*1024*1024)throw new Error('Keep the CSV below 2 MB.');const text=await file.text();bulkLearnerRows=parseCsvText(text);if(!bulkLearnerRows.length)throw new Error('No learner rows were found.');if(bulkLearnerRows.length>500)throw new Error('Bulk registration is limited to 500 learners per upload.');const seen=new Set(),localErrors=[];bulkLearnerRows.forEach((x,i)=>{const key=String(x.admissionNumber||'').trim().toLowerCase();if(!x.fullName||!key||!String(x.className||'').trim()||!String(x.guardianName||'').trim()||!String(x.guardianPhone||'').trim())localErrors.push(`Row ${i+2}: Full Name, Admission Number, Class/Grade, Parent/Guardian Name and Parent/Guardian Phone are required.`);if(key&&seen.has(key))localErrors.push(`Row ${i+2}: duplicate admission number in this file.`);if(key)seen.add(key);if(x.dateOfBirth){x.dateOfBirth=String(x.dateOfBirth).trim();if(!/^\d{4}-\d{2}-\d{2}$/.test(x.dateOfBirth))localErrors.push(`Row ${i+2}: DOB must be YYYY-MM-DD.`);}if(x.email&&!String(x.email).includes('@'))localErrors.push(`Row ${i+2}: Learner Email must be valid.`);if(x.guardianEmail&&!String(x.guardianEmail).includes('@'))localErrors.push(`Row ${i+2}: Parent/Guardian Email must be valid.`)});const head=['#','Full Name','Admission No.','Class/Grade','Stream','DOB','Learner Email','Parent/Guardian Name','Parent/Guardian Phone','Parent Email'];document.getElementById('bulkLearnerPreviewHead').innerHTML='<tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr>';document.getElementById('bulkLearnerPreviewRows').innerHTML=bulkLearnerRows.map((x,i)=>`<tr><td>${i+2}</td><td>${escapeHtml(x.fullName)}</td><td>${escapeHtml(x.admissionNumber)}</td><td>${escapeHtml(x.className||'—')}</td><td>${escapeHtml(x.stream||'Later')}</td><td>${escapeHtml(x.dateOfBirth||'—')}</td><td>${escapeHtml(x.email||'Auto')}</td><td>${escapeHtml(x.guardianName||'—')}</td><td>${escapeHtml(x.guardianPhone||'—')}</td><td>${escapeHtml(x.guardianEmail||'Auto from phone')}</td></tr>`).join('');document.getElementById('bulkLearnerPreviewWrap').style.display='block';const status=document.getElementById('bulkLearnerPreviewStatus');status.textContent=`${bulkLearnerRows.length} learner(s) ready for preview.`+(localErrors.length?' '+localErrors.slice(0,5).join(' '):'');status.style.color=localErrors.length?'#b91c1c':'';document.getElementById('bulkLearnerRegisterBtn').disabled=localErrors.length>0;}catch(e){clearBulkLearnerPreview();showToast?.(e.message,'error')}}
async function submitBulkLearnerRegistration(){if(!selectedSchoolId)return showToast?.('Select a school workspace first.','error');if(!bulkLearnerRows.length)return showToast?.('Choose and preview a CSV file first.','error');const btn=document.getElementById('bulkLearnerRegisterBtn');btn.disabled=true;btn.textContent='Registering…';try{const r=await fetch('/api/schools/learners/bulk-register',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId,rows:bulkLearnerRows})});const d=await parseApiResponse(r);if(!r.ok)throw new Error((d.error||'Bulk registration failed.')+(d.errors?.length?' '+d.errors.map(x=>`Row ${x.row}: ${x.error}`).join(' '):''));window.bulkLearnerCredentialsCsv=String(d.learnerCredentialsCsv||'');window.bulkParentCredentialsCsv=String(d.parentCredentialsCsv||'');const notice=document.getElementById('bulkLearnerCredentialNotice');notice.style.display='block';notice.innerHTML=`<b>Bulk registration completed: ${d.count} new learner(s).</b>${d.skippedExisting?.length?`<br><b>Already registered and skipped: ${d.skippedExisting.length}</b><br><span class="small">${d.skippedExisting.map(x=>`Row ${x.row}: ${escapeHtml(x.fullName)} — ${escapeHtml(x.admissionNumber)}`).join('<br>')}</span>`:''}<br><b>Parent accounts created: ${d.parentAccountsCreated||0}</b> · <b>Learner-parent links created: ${d.parentLinksCreated||0}</b><br>Learner and parent credentials are separate downloads.<br><button class="btn primary" type="button" style="margin-top:8px" onclick="downloadBulkCredentials()">⬇️ Learner Credential CSV</button><button class="btn primary" type="button" style="margin-top:8px" onclick="downloadBulkCredentialsPdf()">📄 Learner Credential PDF</button><button class="btn primary" type="button" style="margin-top:8px" onclick="downloadParentCredentials()">⬇️ Parent Credential CSV</button><button class="btn primary" type="button" style="margin-top:8px" onclick="downloadParentCredentialsPdf()">📄 Parent Credential PDF</button>`;showToast?.(`${d.count} new learner(s) registered${d.skippedExisting?.length?`; ${d.skippedExisting.length} already existed and were skipped`:''}.`,'success');clearBulkLearnerPreview(true);await loadSelectedSchool();}catch(e){showToast?.(e.message,'error')}finally{btn.disabled=!bulkLearnerRows.length;btn.textContent='Register All Learners'}}

function csvRowsForCredentialPdf(csv){const lines=String(csv||'').replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean);if(lines.length<2)return [];const h=parseCsvLine(lines[0]);return lines.slice(1).map(line=>{const v=parseCsvLine(line),o={};h.forEach((k,j)=>o[k]=v[j]??'');return o}).filter(o=>Object.values(o).some(v=>String(v).trim()));}
function pdfEscapeText(value){return String(value??'').replace(/[^\x20-\x7E]/g,'?').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');}
function makeTableCredentialPdf(csv,title){
  const rows=csvRowsForCredentialPdf(csv);
  if(!rows.length)throw new Error('No credential records are available for the PDF.');
  const keys=Object.keys(rows[0]);
  const pageW=842,pageH=595,margin=24,headerH=28,rowH=20,usableW=pageW-margin*2;
  const base=keys.map((k,j)=>j===0?145:j===1?90:Math.max(70,Math.min(145,usableW/keys.length)));
  const scale=usableW/base.reduce((a,b)=>a+b,0),widths=base.map(x=>x*scale);
  const rowsPerPage=Math.max(1,Math.floor((pageH-margin*2-headerH-10)/rowH));
  const pages=[];for(let i=0;i<rows.length;i+=rowsPerPage)pages.push(rows.slice(i,i+rowsPerPage));
  const objects=[];const add=o=>(objects.push(o),objects.length);const catalog=add(''),pagesObj=add(''),font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageRefs=[];
  for(const chunk of pages){
    const content=['BT','/F1 12 Tf',`${margin} ${pageH-margin-12} Td`,'('+pdfEscapeText(title)+') Tj','ET','0.92 g',`${margin} ${pageH-margin-headerH} ${usableW} ${headerH} re f`,'0 g'];
    let y=pageH-margin-headerH;
    const textY=y+9;
    content.push('BT','/F1 7 Tf');
    let x=margin;
    for(let c=0;c<keys.length;c++){content.push(`1 0 0 1 ${x+3} ${textY} Tm`,'('+pdfEscapeText(keys[c].slice(0,28))+') Tj');x+=widths[c]}
    content.push('ET');
    content.push('0 G','0.5 w');
    content.push(`${margin} ${y} m ${margin+usableW} ${y} l S`);
    for(let c=0;c<=keys.length;c++){const vx=margin+widths.slice(0,c).reduce((a,b)=>a+b,0);content.push(`${vx} ${y} m ${vx} ${y-headerH-(chunk.length*rowH)} l S`)}
    for(let r=0;r<chunk.length;r++){
      const ry=y-(r+1)*rowH;
      content.push(`${margin} ${ry} m ${margin+usableW} ${ry} l S`);
      content.push('BT','/F1 7 Tf');
      let cx=margin;
      for(let c=0;c<keys.length;c++){
        const maxChars=Math.max(6,Math.floor(widths[c]/4.1));
        let val=String(chunk[r][keys[c]]??'').replace(/[\r\n]+/g,' ');
        if(val.length>maxChars)val=val.slice(0,Math.max(3,maxChars-3))+'...';
        content.push(`1 0 0 1 ${cx+3} ${ry+6} Tm`,'('+pdfEscapeText(val)+') Tj');
        cx+=widths[c];
      }
      content.push('ET');
    }
    content.push(`${margin} ${y-headerH-(chunk.length*rowH)} m ${margin+usableW} ${y-headerH-(chunk.length*rowH)} l S`);
    const stream=content.join('\n');
    const cr=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pr=add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${cr} 0 R >>`);
    pageRefs.push(pr);
  }
  objects[catalog-1]=`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj-1]=`<< /Type /Pages /Kids [${pageRefs.map(x=>x+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`;
  let pdf='%PDF-1.4\n% TusomeEduShelf\n',offsets=[0];
  for(let n=0;n<objects.length;n++){offsets[n+1]=pdf.length;pdf+=`${n+1} 0 obj\n${objects[n]}\nendobj\n`}
  const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  for(let n=1;n<=objects.length;n++)pdf+=String(offsets[n]).padStart(10,'0')+' 00000 n \n';
  pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf],{type:'application/pdf'});
}
function downloadTextFile(data,name,type){const blob=data instanceof Blob?data:new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function fetchCredentialCsv(path){const r=await fetch(path,{credentials:'include',cache:'no-store'});if(!r.ok){let d={};try{d=await parseApiResponse(r)}catch{}throw new Error(d.error||'Could not download the credential report.')}return r.text()}
function downloadBulkCredentials(){const csv=String(window.bulkLearnerCredentialsCsv||'');if(!csv)return showToast?.('Learner credential report is not available. Complete registration again.','error');downloadTextFile(csv,'Tusome_Learner_Credentials_'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8');showToast?.('Learner credential CSV downloaded.','success')}
function downloadBulkCredentialsPdf(){const csv=String(window.bulkLearnerCredentialsCsv||'');if(!csv)return showToast?.('Learner credential report is not available. Complete registration again.','error');try{downloadTextFile(makeTableCredentialPdf(csv,'Tusome EduShelf — Learner Credentials'),'Tusome_Learner_Credentials_'+new Date().toISOString().slice(0,10)+'.pdf','application/pdf');showToast?.('Learner credential PDF downloaded.','success')}catch(e){showToast?.(e.message||'Could not create learner PDF.','error')}}
async function downloadParentCredentials(){try{const csv=String(window.bulkParentCredentialsCsv||'');if(csv){downloadTextFile(csv,'Tusome_Parent_Credentials_'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8');showToast?.('Parent credential CSV downloaded.','success');return}if(!selectedSchoolId)throw new Error('Select a school workspace first.');const report=await fetchCredentialCsv('/api/schools/parents/credential-report?schoolId='+encodeURIComponent(selectedSchoolId));downloadTextFile(report,'Tusome_Parent_Credentials_'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8');showToast?.('Parent credential CSV downloaded.','success')}catch(e){showToast?.(e.message||'Could not download parent credentials.','error')}}
async function downloadParentCredentialsPdf(){try{const csv=String(window.bulkParentCredentialsCsv||'');const report=csv||await fetchCredentialCsv('/api/schools/parents/credential-report?schoolId='+encodeURIComponent(selectedSchoolId));downloadTextFile(makeTableCredentialPdf(report,'Tusome EduShelf — Parent Credentials'),'Tusome_Parent_Credentials_'+new Date().toISOString().slice(0,10)+'.pdf','application/pdf');showToast?.('Parent credential PDF downloaded.','success')}catch(e){showToast?.(e.message||'Could not create parent PDF.','error')}}
async function fetchExistingLearnerCredentialCsv(){if(!selectedSchoolId)throw new Error('Select a school workspace first.');return fetchCredentialCsv('/api/schools/learners/credential-report?schoolId='+encodeURIComponent(selectedSchoolId))}
async function downloadExistingLearnerCredentials(){try{const csv=await fetchExistingLearnerCredentialCsv();downloadTextFile(csv,'Tusome_Existing_Learner_Credentials_'+new Date().toISOString().slice(0,10)+'.csv','text/csv;charset=utf-8');showToast?.('Existing learner credential report downloaded.','success')}catch(e){showToast?.(e.message||'Could not download the report.','error')}}
async function downloadExistingLearnerCredentialsPdf(){try{const csv=await fetchExistingLearnerCredentialCsv();downloadTextFile(makeTableCredentialPdf(csv,'Tusome EduShelf — Existing Learner Credential Report'),'Tusome_Existing_Learner_Credentials_'+new Date().toISOString().slice(0,10)+'.pdf','application/pdf');showToast?.('Existing learner PDF downloaded.','success')}catch(e){showToast?.(e.message||'Could not create the learner PDF.','error')}}
async function resetSchoolLearners(){if(!selectedSchoolId)return showToast?.('Select a school workspace first.','error');const confirmation=prompt('This permanently clears learner data and school-linked parent accounts. Type RESET LEARNERS to continue.');if(confirmation!=='RESET LEARNERS')return;try{const r=await fetch('/api/schools/learners/reset',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId,confirmation})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Fresh-start reset failed.');showToast?.(`${d.learnersDeleted} learner account(s) and ${d.parentAccountsDeleted} parent account(s) cleared.`,'success');await loadSelectedSchool()}catch(e){showToast?.(e.message||'Fresh-start reset failed.','error')}}

async function loadRegisteredLearners(){
  const box=document.getElementById('registeredLearnersRows'); if(!box||!selectedSchoolId)return;
  try{const r=await fetch('/api/schools/learners?schoolId='+encodeURIComponent(selectedSchoolId),{credentials:'include'}),d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not load registered learners.');const learners=d.learners||[];const classes=window.schoolData?.classes||[];box.innerHTML=learners.length?learners.map(x=>{const opts=classes.map(c=>`<option value="${escapeHtml(c.classId)}" ${String(c.classId)===String(x.classId)?'selected':''}>${escapeHtml(c.className)}${c.stream?' — '+escapeHtml(c.stream):''}</option>`).join('');return `<tr><td><b>${escapeHtml(x.fullName||'—')}</b></td><td>${escapeHtml(x.admissionNumber||'—')}</td><td>${escapeHtml(x.username||'—')}</td><td>${escapeHtml(x.grade||x.className||'—')}</td><td>${escapeHtml(x.stream||'Not assigned')}</td><td><select id="placement-${escapeHtml(x.email)}" onchange="updateLearnerPlacement('${encodeURIComponent(x.email)}',this.value)"><option value="">Choose class / stream</option>${opts}</select></td></tr>`}).join(''):'<tr><td colspan="6">No registered learners yet.</td></tr>';
  }catch(e){box.innerHTML=`<tr><td colspan="6">${escapeHtml(e.message)}</td></tr>`}
}
async function updateLearnerPlacement(email,classId){if(!classId)return;try{const r=await fetch('/api/schools/learners/'+email+'/placement',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId,classId})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not update placement.');showToast?.('Learner placement updated.','success');await loadSelectedSchool();await loadRegisteredLearners();}catch(e){showToast?.(e.message,'error');await loadRegisteredLearners()}}

async function openCreateSchoolClass(){return openSchoolAdminSection('schoolClassesManagementCard','schoolClassName')}

async function createSchoolClass(){const sel=document.getElementById('schoolWorkspaceSelect');if(sel?.value)selectedSchoolId=sel.value;if(!selectedSchoolId&&Array.isArray(schoolWorkspaces)&&schoolWorkspaces[0]?.schoolId)selectedSchoolId=schoolWorkspaces[0].schoolId;const body={schoolId:selectedSchoolId,className:document.getElementById('schoolClassName').value.trim(),grade:document.getElementById('schoolClassGrade').value.trim(),stream:document.getElementById('schoolClassStream').value.trim(),teacherEmail:document.getElementById('schoolClassTeacher').value.trim()};if(!body.className)return showToast?.('Enter a class name.','error');try{const r=await fetch('/api/schools/classes',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not create class.');showToast?.(body.stream?`Stream ${body.stream} added under ${body.className}.`:'Class created.','success');document.getElementById('schoolClassName').value='';document.getElementById('schoolClassStream').value='';document.getElementById('schoolClassTeacher').value='';await loadSelectedSchool()}catch(e){showToast?.(e.message,'error')}}
function addStreamToClass(className,grade){const name=decodeURIComponent(className),g=decodeURIComponent(grade||'');document.getElementById('schoolClassName').value=name;document.getElementById('schoolClassGrade').value=g;document.getElementById('schoolClassStream').value='';document.getElementById('schoolClassTeacher').value='';const target=document.getElementById('schoolClassStream');target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.focus({preventScroll:true}),350)}
async function deleteSchoolClass(id){if(!confirm('Remove this class?'))return;try{const r=await fetch('/api/schools/classes/'+encodeURIComponent(id),{method:'DELETE',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not remove class.');loadSelectedSchool()}catch(e){showToast?.(e.message,'error')}}
async function inviteSchoolMember(){const body={schoolId:selectedSchoolId,email:document.getElementById('schoolInviteEmail').value.trim(),memberRole:document.getElementById('schoolInviteRole').value,classId:document.getElementById('schoolInviteClass').value||null};if(!body.email)return showToast?.('Enter an email address.','error');try{const r=await fetch('/api/schools/invites',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not add member.');showToast?.(d.message||'Member invitation recorded.','success');document.getElementById('schoolInviteEmail').value='';loadSelectedSchool()}catch(e){showToast?.(e.message,'error')}}
async function suspendSchoolMember(email){if(!confirm('Suspend this school member?'))return;try{const r=await fetch('/api/schools/members/'+email,{method:'DELETE',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({schoolId:selectedSchoolId})});const d=await parseApiResponse(r);if(!r.ok)throw new Error(d.error||'Could not suspend member.');loadSelectedSchool()}catch(e){showToast?.(e.message,'error')}}

(async()=>{await loadServerMaterials();if(getSessionRole()==='learner'){await loadServerPurchases();await loadLearnerActivity()}populateMaterialFilters();populateMaterialFilters();renderMaterials();renderTeacher();renderAdmin();refreshProgress();checkAIStatus();if(getSessionRole()==='learner'){loadMarketplace();loadMembership();loadDashboardPremiumTrial('learner');loadLearnerAssignments();loadLearnerGradebook()} if(getSessionRole()==='teacher'){loadMembership();loadDashboardPremiumTrial('teacher')} if(getSessionRole()==='admin'){loadAdminMemberships();loadSchoolManagement()} if(getSessionRole()==='parent'){loadParentChildren()} updateSchoolDashboardNav()})();
