
function escapeHtml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
function showToast(message,type='info',duration=4200){const region=document.getElementById('tusomeToastRegion');if(!region)return;const item=document.createElement('div');item.className='tusome-toast '+type;item.setAttribute('role',type==='error'?'alert':'status');const close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Dismiss message');close.textContent='×';const text=document.createElement('span');text.textContent=String(message||'');item.append(close,text);region.appendChild(item);const timer=setTimeout(()=>item.remove(),duration);close.addEventListener('click',()=>{clearTimeout(timer);item.remove()})}
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
async function renderNotifications(){const box=document.getElementById('notificationList');if(!box)return;try{const res=await fetch('/api/notifications?limit=50',{credentials:'include'});if(!res.ok)throw new Error('server notifications unavailable');const data=await res.json();const n=data.notifications||[];const badge=document.getElementById('notificationUnreadBadge');if(badge){badge.textContent=`${data.unread||0} unread`;badge.style.display=data.unread?'inline-block':'none'}box.innerHTML=n.length?n.map(x=>`<div class="material" style="border-left:4px solid ${x.type==='success'?'#2e7d32':x.type==='warning'?'#f59e0b':x.type==='review'?'#2563eb':'#64748b'}"><div><b>${x.readAt?'':'🔵 '}${escapeHtml(x.title)}</b><p style="margin:5px 0">${escapeHtml(x.message)}</p><small>${new Date(x.createdAt).toLocaleString()}</small>${x.readAt?'':' <button class="btn" style="margin-left:8px" onclick="markNotificationRead('+x.id+')">Mark read</button>'}</div></div>`).join(''):'<p>No notifications yet.</p>'}catch(e){const n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]');box.innerHTML=n.length?n.map(x=>`<div class="material"><div><b>${x.read?'':'🔵 '}${escapeHtml(x.message)}</b><br><small>${escapeHtml(x.time)}</small></div></div>`).join(''):'<p>No notifications yet.</p>'}}
async function markNotificationRead(id){try{await fetch('/api/notifications/'+id+'/read',{method:'PATCH',credentials:'include'});}catch{}renderNotifications()}
async function markNotificationsRead(){try{await fetch('/api/notifications/read-all',{method:'PATCH',credentials:'include'});}catch{}let n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]').map(x=>({...x,read:true}));localStorage.setItem('edushelfNotifications',JSON.stringify(n));renderNotifications()}
async function refreshNotificationBadge(){try{const res=await fetch('/api/notifications?limit=1',{credentials:'include'});if(res.ok){const d=await res.json();const count=Number(d.unread||0);const badge=document.getElementById('notificationUnreadBadge');if(badge){badge.textContent=`${count} unread`;badge.style.display=count?'inline-block':'none'}const nav=document.getElementById('notificationNavCount');if(nav){nav.textContent=count>99?'99+':String(count);nav.style.display=count?'inline-block':'none';nav.setAttribute('aria-label',`${count} unread notifications`)}}}catch{}}
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
async function loadServerPurchases(){try{const r=await fetch('/api/payments/my',{credentials:'include'});if(!r.ok)return false;const d=await r.json();serverPurchases=Array.isArray(d.purchases)?d.purchases:[];localStorage.setItem('tusomePurchases',JSON.stringify(serverPurchases.map(x=>({id:x.transactionId,materialId:x.materialId,amount:Number(x.amount||0),status:'paid',mpesaReceipt:x.mpesaReceipt||'',time:x.createdAt||''}))));return true}catch(e){console.warn('Could not load purchases',e);return false}}
function materialPrice(m){return Number(m.price||0)}
function populateMaterialFilters(){
  const gradeValues=[...new Set(materials.map(m=>m.grade).filter(Boolean))].sort((a,b)=>{const na=parseInt(String(a).match(/\d+/)?.[0]||0),nb=parseInt(String(b).match(/\d+/)?.[0]||0);return na-nb||String(a).localeCompare(String(b))});
  const sets={subjectFilter:[...new Set(materials.map(m=>m.subject).filter(Boolean))].sort(),gradeFilter:gradeValues,topicFilter:[...new Set(materials.map(m=>m.topic).filter(Boolean))].sort(),strandFilter:[...new Set(materials.map(m=>m.strand).filter(Boolean))].sort(),fileTypeFilter:[...new Set(materials.map(m=>m.fileType||m.file).filter(Boolean).map(x=>{const v=String(x);return v.includes('/')?v.split('/').pop().toUpperCase():v.split('.').pop().toUpperCase()}))].sort()};
  const labels={subjectFilter:'All subjects',gradeFilter:'All grades',topicFilter:'All topics',strandFilter:'All strands',fileTypeFilter:'All file types'};
  Object.entries(sets).forEach(([id,values])=>{const el=document.getElementById(id);if(!el)return;const current=el.value;el.innerHTML='<option value="">'+labels[id]+'</option>'+values.map(v=>`<option value="${String(v).replace(/"/g,'&quot;')}">${escHtml(v)}</option>`).join('');if(values.includes(current))el.value=current});
}

let learnerActivity={};
async function loadLearnerActivity(){if(getSessionRole()!=='learner')return;try{const r=await fetch('/api/learner/activity',{credentials:'include'});if(!r.ok)return;const d=await r.json();learnerActivity={};(d.activity||[]).forEach(x=>learnerActivity[String(x.materialId)]=x);renderLearnerSaved()}catch(e){console.warn('Could not load learner activity',e)}}
async function toggleBookmark(materialId){const current=!!learnerActivity[String(materialId)]?.bookmarked;try{const r=await fetch('/api/learner/materials/'+encodeURIComponent(materialId)+'/bookmark',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({bookmarked:!current})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save material.');learnerActivity[String(materialId)]={...(learnerActivity[String(materialId)]||{}),bookmarked:d.bookmarked};renderMaterials();renderLearnerSaved();logNotification(d.bookmarked?'Material saved to your bookmarks.':'Material removed from your bookmarks.');showToast(d.bookmarked?'Material saved to your bookmarks.':'Material removed from your bookmarks.','success')}catch(e){alert(e.message)}}
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
function openMaterialReader(m){if(!m)return;activeReaderMaterialId=String(m.id);const url='/api/materials/'+encodeURIComponent(m.id)+'/file';const title=document.getElementById('readerTitle'),meta=document.getElementById('readerMeta'),frame=document.getElementById('readerFrame'),loading=document.getElementById('readerLoading'),download=document.getElementById('readerDownload'),save=document.getElementById('readerBookmarkBtn');if(title)title.textContent=m.title||'Learning material';if(meta)meta.textContent=[m.subject||'General',m.grade||'All grades',m.topic||''].filter(Boolean).join(' • ');if(download){download.href=url;download.setAttribute('download',m.file||'learning-material');download.setAttribute('aria-label','Download '+(m.title||'learning material'))}if(save){const saved=!!learnerActivity[String(m.id)]?.bookmarked;save.textContent=saved?'🔖 Saved':'🔖 Save';save.setAttribute('aria-label',saved?'Remove bookmark':'Save material')}if(frame){frame.style.display='none';frame.src='';frame.onload=()=>{if(loading)loading.style.display='none';frame.style.display='block'};frame.onerror=()=>{if(loading)loading.innerHTML='<div class="reader-error"><b>This file could not be displayed here.</b><p>Use the Download button above to open the material.</p></div>';frame.style.display='none'};frame.src=url}if(loading)loading.innerHTML='Loading your material…';loadReaderAnnotations();const note=document.getElementById('readerNoteText');if(note)note.value='';setReaderNoteStatus('');show('reader')}
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
    <button class="btn" type="button" onclick="show('learner')">Cancel</button>`;
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
      const data=await r.json();
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
        alert('Payment confirmed. The material is now unlocked.');
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
function openCommunicationCentre(){show('communication')}
function adminTab(tab){
  document.querySelectorAll('.admin-panel').forEach(x=>x.style.display='none');
  if(tab==='command'){adminRefreshAll();window.scrollTo({top:0,behavior:'smooth'});return;}
  const map={approvals:'adminApprovals',payments:'adminPayments',revenue:'adminRevenue',backups:'adminBackups',analytics:'adminAnalytics'};
  const el=document.getElementById(map[tab]||'adminApprovals');if(el)el.style.display='block';
  adminRefreshAll();
  if(tab==='payments'||tab==='revenue')loadAdminPayments();
  if(tab==='backups')loadAdminBackups();
  if(tab==='analytics')loadAdminAnalytics();
}

async function loadServerMaterials(){try{const r=await fetch('/api/materials',{credentials:'include'});if(!r.ok)return false;const d=await r.json();materials=Array.isArray(d.materials)?d.materials:[];return true}catch(e){console.warn('Could not load server materials',e);return false}}
async function loadAdminPayments(){
  try{
    const r=await fetch('/api/admin/payments',{credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load payment records.');
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
  try{const r=await fetch('/api/admin/revenue-settings',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({teacherPercentage:teacher})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save revenue split.');document.getElementById('platformRevenuePercent').textContent='Platform: '+d.settings.platformPercentage+'%';alert('Revenue split saved. New purchases will use '+d.settings.teacherPercentage+'% for teachers and '+d.settings.platformPercentage+'% for the platform.');}catch(e){alert(e.message)}
}
async function createTeacherPayout(){
  const teacherEmail=(document.getElementById('payoutTeacherEmail')?.value||'').trim(),amount=Number(document.getElementById('payoutAmount')?.value||0),notes=(document.getElementById('payoutNotes')?.value||'').trim();if(!teacherEmail||!amount||amount<=0){alert('Enter the teacher email and payout amount.');return}
  try{const r=await fetch('/api/admin/teacher-payouts',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({teacherEmail,amount,notes})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not create payout.');document.getElementById('payoutAmount').value='';document.getElementById('payoutNotes').value='';loadAdminPayments();alert('Teacher payout record created. You can mark it Paid after the actual transfer is completed.');}catch(e){alert(e.message)}
}
async function markTeacherPayoutPaid(id){if(!confirm('Mark this teacher payout as paid?'))return;try{const r=await fetch('/api/admin/teacher-payouts/'+encodeURIComponent(id)+'/paid',{method:'PATCH',credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not update payout.');loadAdminPayments()}catch(e){alert(e.message)}}
async function loadAdminBackups(){
  const status=document.getElementById('backupStatus'); if(status)status.textContent='Loading backup and recovery data...';
  try{
    const r=await fetch('/api/admin/backups',{credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load backups.');
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
  try{const r=await fetch('/api/admin/backups/run',{method:'POST',credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Backup failed.');alert('Backup created: '+d.backup.fileName);loadAdminBackups();}catch(e){alert(e.message)}
}
async function testAdminRestore(id){
  try{const r=await fetch('/api/admin/backups/'+encodeURIComponent(id)+'/test-restore',{method:'POST',credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Restore test failed.');alert('Restore test passed. The backup contains all required datasets and valid file data.');loadAdminBackups();}catch(e){alert(e.message)}
}
async function restoreAdminBackup(id){
  const typed=prompt('This will REPLACE the current database with this backup. Type exactly: RESTORE TUSOME EDUSHELF');
  if(typed!=='RESTORE TUSOME EDUSHELF')return;
  try{const r=await fetch('/api/admin/backups/'+encodeURIComponent(id)+'/restore',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({confirmation:typed})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Restore failed.');alert(d.message||'Backup restored.');location.reload();}catch(e){alert(e.message)}
}
async function adminDeleteMaterial(i){
  const m=materials[i];if(!m)return;const typed=prompt(`Move “${m.title}” to the recovery bin? Type exactly: DELETE MATERIAL`);if(typed!=='DELETE MATERIAL')return;
  try{const r=await fetch('/api/admin/materials/'+encodeURIComponent(m.id),{method:'DELETE',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({confirmation:typed,reason:'Moved to recovery bin by administrator'})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not delete material.');alert('Material moved to the recovery bin.');adminRefreshAll();renderMaterials();}catch(e){alert(e.message)}
}
async function restoreDeletedMaterial(id){
  const typed=prompt('Recover this material and return it to pending review? Type exactly: RESTORE MATERIAL');if(typed!=='RESTORE MATERIAL')return;
  try{const r=await fetch('/api/admin/materials/'+encodeURIComponent(id)+'/restore',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({confirmation:typed})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not recover material.');alert('Material recovered and returned to pending review.');loadAdminBackups();adminRefreshAll();renderMaterials();}catch(e){alert(e.message)}
}

async function loadTeacherAnalytics(){
  try{
    const r=await fetch('/api/teacher/analytics',{credentials:'include'}); const d=await r.json();
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
    const d=await r.json();
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
    const r=await fetch('/api/admin/analytics',{credentials:'include'}); const d=await r.json(); if(!r.ok) throw new Error(d.error||'Could not load analytics.');
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
  void (async()=>{try{const r=await fetch('/api/admin/analytics',{credentials:'include'});const d=await r.json();if(!r.ok)return;set('commandUsers',(Number(d.users?.learner||0)+Number(d.users?.teacher||0)+Number(d.users?.admin||0)));set('commandPaid',d.payments?.paid?.count||0);}catch(e){console.warn('Command centre summary unavailable',e)}})();
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
async function adminSetMaterialPrice(i,value){if(!materials[i])return;const price=Math.max(0,Number(value)||0);try{const r=await fetch('/api/materials/'+encodeURIComponent(materials[i].id)+'/review',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({approvalStatus:materials[i].approvalStatus||'pending',price})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not update price.');materials[i].price=price;logActivity(`Set material price: ${materials[i].title} = KES ${price.toFixed(2)}`);adminRefreshAll();renderMaterials()}catch(e){alert(e.message)}}
async function adminPreviewMaterial(i){const m=materials[i];if(!m)return;const url='/api/materials/'+encodeURIComponent(m.id)+'/file';const opened=window.open(url,'_blank');if(!opened){alert('Your browser blocked the document tab. Please allow pop-ups for EduShelf and click Review / Open again.')}else{logActivity('Admin reviewed material: '+m.title)}}
async function adminMaterialApproval(i,status){if(!materials[i])return;try{const r=await fetch('/api/materials/'+encodeURIComponent(materials[i].id)+'/review',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({approvalStatus:status,price:Number(materials[i].price||0)})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not update material.');materials[i].approvalStatus=status;materials[i].approvedAt=d.material?.approvedAt||null;logActivity(`${status==='approved'?'Approved':'Rejected'} material: ${materials[i].title}`);logNotification(`Material ${materials[i].title}: ${status}`);adminRefreshAll();renderMaterials()}catch(e){alert(e.message)}}
function setSessionRole(role,email){
  sessionStorage.setItem('tusomeLoggedIn','true');
  sessionStorage.setItem('tusomeRole',role);
  sessionStorage.setItem('tusomeCurrentUser',email||role);
  localStorage.setItem('tusomeCurrentUser',email||role);
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
    setSessionRole(data.user.role,data.user.email);
    form.reset();
    alert('Account created successfully. Welcome to Tusome EduShelf!');
    show(data.user.role==='teacher'?'teacher':'learner');
  }catch(err){alert(err.message)}
  finally{button.disabled=false;button.textContent='Sign Up'}
}
async function login(e){
  e.preventDefault();
  const form=e.target, button=form.querySelector('button[type="submit"]');
  const role=document.getElementById('role').value;
  const email=form.querySelector('input[type="email"]').value.trim();
  const password=form.querySelector('input[type="password"]').value;
  button.disabled=true;button.textContent='Logging in...';
  try{
    const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({email,password,role})});
    const raw=await res.text();
    let data={};
    try{data=JSON.parse(raw)}catch{throw new Error('The EduShelf server returned an unexpected response. Please redeploy the latest EduShelf files on Render and try again.')} 
    if(!res.ok)throw new Error(data.error||'Login failed.');
    setSessionRole(data.user.role,data.user.email);
    show(data.user.role==='admin'?'admin':data.user.role==='teacher'?'teacher':'learner');
    form.reset();
  }catch(err){alert(err.message)}
  finally{button.disabled=false;button.textContent='Sign In'}
}
function updatePublicUi(){const b=document.getElementById('communicationLaunch');if(!b)return; b.style.display=getSessionRole()?'block':'none';}
async function logoutUser(){
  try{await fetch('/api/auth/logout',{method:'POST',credentials:'include'})}catch{}
  sessionStorage.removeItem('tusomeLoggedIn');
  sessionStorage.removeItem('tusomeRole');
  sessionStorage.removeItem('tusomeCurrentUser');
  localStorage.removeItem('tusomeCurrentUser');
  show('home');
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
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'The AI assistant could not respond.');
    pending.innerHTML='<b>Tusome EduShelf AI:</b> '+renderHomeAIAnswer(data.answer);
  }catch(err){
    pending.innerHTML='<b>Tusome EduShelf AI:</b> Sorry, I could not respond right now. '+escapeHomeAIText(err.message);
  }finally{button.disabled=false;button.textContent='✨ Ask';}
}


function toggleHelpFaq(button){const item=button.closest('.help-faq');if(!item)return;const open=!item.classList.contains('open');item.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}
function filterHelp(){const q=(document.getElementById('helpSearch')?.value||'').trim().toLowerCase();const items=[...document.querySelectorAll('#helpFaqs .help-faq')];let visible=0;items.forEach(item=>{const match=!q||item.dataset.help.includes(q)||item.textContent.toLowerCase().includes(q);item.style.display=match?'block':'none';if(match)visible++});const no=document.getElementById('helpNoResults');if(no)no.style.display=visible?'none':'block'}

function show(id){
  const protectedRoles={learner:'learner',teacher:'teacher',admin:'admin',communication:'user',account:'user',reader:'learner',practice:'learner'};
  if(protectedRoles[id]){
    const role=getSessionRole();
    if(!role){show('login');return}
    if(id==='learner'&&role!=='learner'){alert('This dashboard is for learners.');return}
    if(id==='reader'&&role!=='learner'){alert('The material reader is for learners.');return}
    if(id==='practice'&&role!=='learner'){alert('Practice Mode is for learners.');return}
    if(id==='teacher'&&role!=='teacher'){alert('This dashboard is for teachers.');return}
    if(id==='admin'&&role!=='admin'){alert('Administrator access is required.');return}
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById(id);if(el)el.classList.add('active');
  if(id==='teacher'){loadServerMaterials().then(renderTeacher);loadTeacherEarnings();loadTeacherAnalytics()}
  if(id==='admin'){adminRefreshAll();loadAdminAnalytics()}
  if(id==='communication'){renderMyFeedback();renderAdminFeedback()}
  if(id==='notifications')renderNotifications(); else refreshNotificationBadge(); if(id==='account')loadAccountProfile();
  if(id==='progress'||id==='parent')refreshProgress();
  if(id==='payments')renderPayments();
  if(id==='curriculum')loadCurriculumCatalogue();
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
    if(/^#{1,4}\s/.test(line)){const m=line.match(/^(#{1,4})\s+(.*)$/);html+=`<h${Math.min(4,m[1].length)}>${inlineAI(m[2])}</h${Math.min(4,m[1].length)}>`;i++;continue;}
    if(/^[-*]\s+/.test(line)){html+='<ul>';while(i<lines.length&&/^[-*]\s+/.test(lines[i].trim())){html+='<li>'+inlineAI(lines[i].trim().replace(/^[-*]\s+/,''))+'</li>';i++;}html+='</ul>';continue;}
    if(/^\d+[.)]\s+/.test(line)){html+='<ol>';while(i<lines.length&&/^\d+[.)]\s+/.test(lines[i].trim())){html+='<li>'+inlineAI(lines[i].trim().replace(/^\d+[.)]\s+/,''))+'</li>';i++;}html+='</ol>';continue;}
    if(/^⚠️|^VERIFICATION REMINDER:/i.test(line)){html+='<div class="ai-note">'+inlineAI(line)+'</div>';i++;continue;}
    const para=[line];i++;while(i<lines.length&&lines[i].trim()&&!/^\|.*\|$/.test(lines[i].trim())&&!/^#{1,4}\s/.test(lines[i].trim())&&!/^[-*]\s+/.test(lines[i].trim())&&!/^\d+[.)]\s+/.test(lines[i].trim())){para.push(lines[i].trim());i++;}html+='<p>'+inlineAI(para.join(' '))+'</p>';
  }
  target.innerHTML=html;
}
function copyAI(){navigator.clipboard?.writeText(document.getElementById('aiAnswer').textContent);alert('Response copied.')}
async function checkAIStatus(){const el=document.getElementById('aiStatus');if(!el)return;try{const r=await fetch('/api/health');const d=await r.json();el.className=d.ai?.configured?'success':'notice';el.textContent=d.ai?.configured?'🟢 Gemini AI connected • '+d.ai.model:'🟠 AI service is not configured. Add GEMINI_API_KEY to Render Environment.'}catch(e){el.className='notice';el.textContent='🔴 EduShelf server is not running. Start it with: npm install && npm start'}}
async function buildAIContext(role,mode){
  if(role==='learner'){return JSON.stringify({activity:JSON.parse(localStorage.getItem('edushelfActivity')||'[]').slice(0,20),attempts:getMarkAttempts().slice(0,20)});}
  if(role==='parent'){const attempts=getMarkAttempts();return JSON.stringify({progress:document.getElementById('parentActivity')?.textContent||'',aiSessions:document.getElementById('parentAI')?.textContent||'',practice:document.getElementById('parentPractice')?.textContent||'',recentAttempts:attempts.slice(0,10)});}
  if(role==='admin'){
    try{const r=await fetch('/api/admin/ai-context',{credentials:'include'});const d=r.ok?await r.json():{error:'Could not load live admin context.'};return JSON.stringify(d).slice(0,30000)}catch(e){return JSON.stringify({error:'Could not load the live admin context. Use the visible dashboard information only.'});}
  }
  return '';
}
async function loadAccountProfile(){try{const r=await fetch('/api/account/profile',{credentials:'include'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load account.');const p=d.profile||{};document.getElementById('accountDisplayName').value=p.displayName||'';document.getElementById('accountAvatarUrl').value=p.avatarUrl||'';document.getElementById('accountEmail').textContent=p.email||'';document.getElementById('accountRole').textContent=p.role||'';document.getElementById('prefPlatform').checked=p.notificationPreferences?.platform!==false;document.getElementById('prefEmail').checked=p.notificationPreferences?.email!==false;const rows=d.activity||[];document.getElementById('accountActivity').innerHTML=rows.length?rows.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString()}</td><td>${escapeHtml(x.action||'')}</td><td>${escapeHtml((x.entityType||'')+' '+(x.entityId||''))}</td></tr>`).join(''):'<tr><td colspan="3">No recent account activity.</td></tr>'}catch(e){alert(e.message)}}
async function saveAccountProfile(){try{const body={displayName:document.getElementById('accountDisplayName').value,avatarUrl:document.getElementById('accountAvatarUrl').value,notificationPreferences:{platform:document.getElementById('prefPlatform').checked,email:document.getElementById('prefEmail').checked}};const r=await fetch('/api/account/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save profile.');alert('Account settings saved.');loadAccountProfile()}catch(e){alert(e.message)}}
async function changeAccountPassword(){const notice=document.getElementById('passwordNotice');try{const r=await fetch('/api/account/password',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({currentPassword:document.getElementById('currentPassword').value,newPassword:document.getElementById('newPassword').value})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not change password.');notice.textContent='Password changed successfully.';showToast('Password changed successfully.','success');document.getElementById('currentPassword').value='';document.getElementById('newPassword').value='';}catch(e){notice.textContent=friendlyError(e,'Could not change your password.');showToast(notice.textContent,'error')}}
async function askAI(e){e.preventDefault();const subject=document.getElementById('aiSubject').value,grade=document.getElementById('aiGrade').value,mode=document.getElementById('aiMode').value,focus=document.getElementById('cbeFocus').value,enteredPrompt=document.getElementById('aiPrompt').value.trim(),qFile=document.getElementById('aiQuestionFile')?.files?.[0],wFile=document.getElementById('aiWorkingFile')?.files?.[0],box=document.getElementById('aiResult'),answer=document.getElementById('aiAnswer'),button=e.target.querySelector('button[type="submit"]');const defaultPrompts={lesson:'Create a lesson plan for the selected subject and grade. Include objectives, learning activities, resources, differentiation and assessment.',scheme:'Create a structured scheme of work for the selected subject and grade, with sequence, topics, outcomes, activities, resources and assessment checkpoints.',assessment:'Create an assessment for the selected subject and grade with clear questions/tasks and marking guidance.',rubric:'Create a four-level rubric with observable criteria for the selected subject and grade.',differentiated:'Create differentiated activities for learners needing support, learners at expected level and learners ready for extension.',remediation:'Create remedial activities for likely learning gaps in the selected topic.',enrichment:'Create enrichment activities that deepen understanding of the selected topic.',admin_summary:'Summarize the current platform activity from the supplied dashboard data.',moderation:'Review the supplied material information for moderation concerns and items requiring human review.',duplicate:'Identify likely duplicate or highly similar materials from the supplied material list.',admin_reports:'Prepare a concise report on uploads, users and payments from the supplied dashboard data.',approval_queue:'Identify materials currently waiting for approval from the supplied dashboard data.',parent_progress:'Summarize the learner progress from the supplied progress data.',parent_revision:'Suggest revision activities based on the learner progress data.',parent_report:'Explain the learner performance information in simple language.',parent_study:'Suggest practical study-support ideas based on the learner progress data.'};const prompt=enteredPrompt||defaultPrompts[mode]||'';if(!prompt&&!qFile&&!wFile){alert('Enter a question or upload a question paper first.');return}if(mode==='mark'&&!qFile&&!wFile){alert('For Mark My Work, upload your question paper and/or your working.');return}button.disabled=true;button.textContent='⏳ Gemini is working...';answer.textContent='Gemini is preparing your response...';box.style.display='block';try{const readFile=async(file)=>{if(!file)return null;if(file.size>12*1024*1024)throw new Error('Please keep each uploaded file below 12 MB.');const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the selected file.'));reader.readAsDataURL(file)});return{name:file.name,mimeType:file.type,data:dataUrl}};const [questionFile,workingFile]=await Promise.all([readFile(qFile),readFile(wFile)]);const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject,grade,mode,focus,prompt,file:questionFile,questionFile,workingFile,role:aiReturnDashboard,context:await buildAIContext(aiReturnDashboard,mode)})});const data=await res.json();if(!res.ok)throw new Error(data.error||'The Gemini service could not respond.');renderAIResponse(answer,data.answer);if(mode==='mark')saveMarkAttempt(subject,grade,prompt,data.answer);logActivity('Used Gemini AI Study Assistant: '+mode+' / '+subject+' / '+grade);logNotification('Gemini response generated for '+subject+' ('+grade+').');refreshProgress();renderNotifications()}catch(err){answer.textContent='Sorry, Gemini could not respond.\n\n'+err.message;checkAIStatus()}finally{button.disabled=false;button.textContent='✨ Ask AI'}}
async function loadCurriculumCatalogue(){const box=document.getElementById('curriculumCatalogue');if(!box)return;box.textContent='Loading curriculum records...';try{const grade=document.getElementById('catGrade').value,subject=document.getElementById('catSubject').value;const r=await fetch('/api/curriculum?'+new URLSearchParams({grade,subject}));const data=await r.json();box.innerHTML=data.records.length?data.records.map(x=>`<div class="material"><div><b>${x.grade} • ${x.subject}</b><br><span class="tag">${x.strand}</span> <span class="tag">${x.substrand}</span><br><small>${(x.learningOutcomes||[]).join(' • ')||'Structure record — exact learning outcomes not yet imported for this entry.'}</small></div><span class="tag">${(x.learningOutcomes||[]).length} outcomes</span></div>`).join(''):'<p>No imported record matches this selection yet.</p>'}catch(e){box.textContent='Start the EduShelf server to load curriculum records.'}}
document.getElementById('aiMode')?.addEventListener('change',()=>{const mode=document.getElementById('aiMode').value;const hint=document.getElementById('aiFileHint');if(hint){hint.innerHTML=mode==='mark'?'Upload the <b>question paper</b> in the first slot and <b>your working</b> in the second slot. Gemini will compare them and mark each step.':'Use the <b>Question Paper</b> slot for a paper you want Gemini to solve. The <b>Your Working</b> slot is for Mark My Work.';}});

async function runGeneratedAI(subject,grade,mode,focus,prompt,resultBox,answerBox,extraContext=''){resultBox.style.display='block';answerBox.textContent='Generating...';try{const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject,grade,mode,focus,prompt,role:aiReturnDashboard,context:extraContext})});const data=await res.json();if(!res.ok)throw new Error(data.error||'AI request failed.');renderAIResponse(answerBox,data.answer);logActivity('Generated '+mode+' / '+subject+' / '+grade);logNotification('New AI '+mode+' generated for '+subject+' ('+grade+').');refreshProgress()}catch(err){answerBox.textContent='Sorry, the AI service is unavailable.\n\n'+err.message}}
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
  try{const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({role:'teacher',mode:'material_quality',subject:document.getElementById('subject').value,grade:document.getElementById('grade').value,focus:document.getElementById('strand').value,prompt:`Review this proposed learning material before submission. Title: ${document.getElementById('title').value}. Topic: ${document.getElementById('topic').value}. Competency: ${document.getElementById('competency').value}. Description: ${document.getElementById('desc').value}`,file:{name:file.name,mimeType:file.type,data}})});const d=await res.json();if(!res.ok)throw new Error(d.error||'Quality check failed.');renderAIResponse(answer,d.answer);logActivity('Used AI material quality checker: '+document.getElementById('title').value)}catch(e){answer.textContent='Quality check failed.\n\n'+e.message}}
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
async function restoreServerSession(){
  try{
    const r=await fetch('/api/auth/me',{credentials:'include'});
    if(r.ok){const d=await r.json();setSessionRole(d.user.role,d.user.email);if(d.user.role==='learner')await loadServerPurchases()}
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
async function markUploadedPracticeAnswer(file){if(!file)return;const name=document.getElementById('practiceUploadName');const result=document.getElementById('practiceMarkResult');if(name)name.textContent=file.name;if(file.size>12*1024*1024){showToast?.('Please keep the answer file below 12 MB.','error');return}const allowed=['application/pdf','image/png','image/jpeg','image/webp','image/heic','image/heif'];if(!allowed.includes(file.type)){showToast?.('Upload a PDF or clear image (JPG, PNG, WEBP, HEIC).','error');return}const q=practiceState.questions[practiceState.index];if(!q)return;if(result){result.style.display='block';result.textContent='⏳ Marking your uploaded answer...'}try{const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the answer file.'));r.readAsDataURL(file)});const prompt=`Mark this learner response for ${q.grade}, ${q.subject}, topic ${q.topic}. Question: ${q.q}. Expected answer: ${q.options[q.answer]}. Explain whether the uploaded response answers the question, identify the evidence in the learner response, give a supportive correction, and suggest one next step. This is formative practice feedback, not an official grade.`;const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject:q.subject,grade:q.grade,mode:'mark',focus:`${q.strand} / ${q.substrand}`,prompt,workingFile:{name:file.name,mimeType:file.type,data},role:'learner'})});const d=await res.json();if(!res.ok)throw new Error(d.error||'AI marking failed.');renderAIResponse(result,d.answer);logActivity('Uploaded answer for AI marking: '+q.subject+' / '+q.grade);logNotification('Your uploaded practice answer has been marked.');refreshProgress();}catch(e){if(result)result.textContent='Could not mark this answer. '+e.message;showToast?.('Could not mark the uploaded answer.','error')}}
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
configureAIAssistant(getSessionRole()||'learner');
(async()=>{await loadServerMaterials();if(getSessionRole()==='learner'){await loadServerPurchases();await loadLearnerActivity()}populateMaterialFilters();populateMaterialFilters();renderMaterials();renderTeacher();renderAdmin();refreshProgress();checkAIStatus()})();


function applyAccessibility(){const b=document.body;const mode=localStorage.getItem('tusomeA11yText')||'normal';b.classList.toggle('a11y-large',mode==='large');b.classList.toggle('a11y-contrast',localStorage.getItem('tusomeA11yContrast')==='true');b.classList.toggle('a11y-reduced-motion',localStorage.getItem('tusomeA11yMotion')==='true');document.getElementById('a11yNormal')?.classList.toggle('active',mode==='normal');document.getElementById('a11yLarge')?.classList.toggle('active',mode==='large');document.getElementById('a11yContrast')?.classList.toggle('active',localStorage.getItem('tusomeA11yContrast')==='true');document.getElementById('a11yMotion')?.classList.toggle('active',localStorage.getItem('tusomeA11yMotion')==='true')}
function toggleAccessibilityPanel(){const p=document.getElementById('accessibilityPanel');if(!p)return;const open=!p.classList.contains('open');p.classList.toggle('open',open);document.querySelector('.a11y-toggle')?.setAttribute('aria-expanded',String(open));if(open)document.getElementById('a11yNormal')?.focus()}
function setAccessibility(mode){localStorage.setItem('tusomeA11yText',mode);applyAccessibility()}
function toggleAccessibilityOption(type){const key=type==='contrast'?'tusomeA11yContrast':'tusomeA11yMotion';localStorage.setItem(key,localStorage.getItem(key)==='true'?'false':'true');applyAccessibility()}
function resetAccessibility(){['tusomeA11yText','tusomeA11yContrast','tusomeA11yMotion'].forEach(k=>localStorage.removeItem(k));applyAccessibility()}
applyAccessibility();
