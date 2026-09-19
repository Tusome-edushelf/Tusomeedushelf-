
const key='edushelfMaterials';
const curriculumSubjects=['Mathematics','English','Kiswahili','Integrated Science','Biology','Chemistry','Physics','Agriculture','Social Studies','Pre-Technical Studies','Creative Arts & Sports','Business Studies','Geography','History & Citizenship','Computer Studies','ICT','Home Science'];
let materials=JSON.parse(localStorage.getItem(key)||'null')||[
 {id:1,title:'Linear Functions Notes',subject:'Mathematics',grade:'Grade 8',topic:'Linear Functions',file:'linear-functions.pdf',approvalStatus:'approved',price:0},
 {id:2,title:'Magnification Revision',subject:'Biology',grade:'Grade 8',topic:'Magnification',file:'magnification.pdf',approvalStatus:'approved',price:0},
 {id:3,title:'Grammar Revision Notes',subject:'English',grade:'Grade 8',topic:'Grammar',file:'grammar.pdf',approvalStatus:'approved',price:0}
];
function save(){localStorage.setItem(key,JSON.stringify(materials))}
function logActivity(action){let logs=JSON.parse(localStorage.getItem('edushelfActivity')||'[]');logs.unshift({action,time:new Date().toLocaleString()});localStorage.setItem('edushelfActivity',JSON.stringify(logs.slice(0,50)))}
function logNotification(message){let n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]');n.unshift({message,time:new Date().toLocaleString(),read:false});localStorage.setItem('edushelfNotifications',JSON.stringify(n.slice(0,30)))}
function renderNotifications(){const box=document.getElementById('notificationList');if(!box)return;const n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]');box.innerHTML=n.length?n.map(x=>`<div class="material"><div><b>${x.read?'':'🔵 '}${x.message}</b><br><small>${x.time}</small></div></div>`).join(''):'<p>No notifications yet.</p>'}
function markNotificationsRead(){let n=JSON.parse(localStorage.getItem('edushelfNotifications')||'[]').map(x=>({...x,read:true}));localStorage.setItem('edushelfNotifications',JSON.stringify(n));renderNotifications()}
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
  const sets={subjectFilter:[...new Set(materials.map(m=>m.subject).filter(Boolean))].sort(),gradeFilter:[...new Set(materials.map(m=>m.grade).filter(Boolean))].sort((a,b)=>{const na=parseInt(a.match(/\d+/)?.[0]||0),nb=parseInt(b.match(/\d+/)?.[0]||0);return na-nb||a.localeCompare(b)}),topicFilter:[...new Set(materials.map(m=>m.topic).filter(Boolean))].sort()};
  Object.entries(sets).forEach(([id,values])=>{const el=document.getElementById(id);if(!el)return;const current=el.value;el.innerHTML='<option value="">'+(id==='subjectFilter'?'All subjects':id==='gradeFilter'?'All grades':'All topics')+'</option>'+values.map(v=>`<option value="${String(v).replace(/"/g,'&quot;')}">${v}</option>`).join('');if(values.includes(current))el.value=current});
}
function renderMaterials(list=materials.filter(m=>(m.approvalStatus||'approved')==='approved')){const box=document.getElementById('materials');if(!box)return;const count=document.getElementById('materialResultCount');if(count)count.textContent=`Showing ${list.length} of ${materials.length} material${materials.length===1?'':'s'}`;box.innerHTML=list.length?list.map(m=>{const idx=materials.indexOf(m);const paid=isPurchased(m.id),price=materialPrice(m);return `<div class="material"><div style="min-width:0"><b>${escHtml(m.title||'Untitled material')}</b><br><span class="tag">${escHtml(m.subject||'General')}</span> <span class="tag">${escHtml(m.grade||'All grades')}</span> <span class="tag">${price>0?'KES '+price:'FREE'}</span> <small>${escHtml(m.topic||'')}</small><br><small>📎 ${escHtml(m.file||'Uploaded material')}</small></div><button class="btn primary" onclick="openMaterial(${idx})">${price===0||paid?'Open':'Buy'}</button></div>`}).join(''):'<div class="notice">No materials match your search. Try a different keyword or reset the filters.</div>'}
function filterMaterials(){
  const q=(document.getElementById('search')?.value||'').trim().toLowerCase(),subject=document.getElementById('subjectFilter')?.value||'',grade=document.getElementById('gradeFilter')?.value||'',topic=document.getElementById('topicFilter')?.value||'',sort=document.getElementById('materialSort')?.value||'newest';
  let list=materials.filter(m=>(m.approvalStatus||'approved')==='approved').filter(m=>{const text=[m.title,m.subject,m.grade,m.topic,m.strand,m.competency,m.description,m.file].filter(Boolean).join(' ').toLowerCase();return (!q||text.includes(q))&&(!subject||m.subject===subject)&&(!grade||m.grade===grade)&&(!topic||m.topic===topic)});
  if(sort==='az')list.sort((a,b)=>(a.title||'').localeCompare(b.title||''));else if(sort==='priceLow')list.sort((a,b)=>materialPrice(a)-materialPrice(b));else if(sort==='priceHigh')list.sort((a,b)=>materialPrice(b)-materialPrice(a));else list.sort((a,b)=>(Number(b.id)||0)-(Number(a.id)||0));
  renderMaterials(list)
}
function resetMaterialFilters(){['search','subjectFilter','gradeFilter','topicFilter'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});const sort=document.getElementById('materialSort');if(sort)sort.value='newest';filterMaterials()}
async function openMaterial(i){const m=materials[i];if(!m)return;const price=materialPrice(m);if(price>0&&!isPurchased(m.id)){showPaymentForMaterial(m);return}localStorage.setItem('tusomeViews',String(Number(localStorage.getItem('tusomeViews')||0)+1));logActivity('Viewed material: '+m.title);logNotification('Opened learning material: '+m.title);refreshProgress();try{const r=await fetch('/api/materials/'+encodeURIComponent(m.id)+'/file',{credentials:'include'});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'Unable to open the material.')}const blob=await r.blob();const url=URL.createObjectURL(blob);const opened=window.open(url,'_blank');if(!opened){const a=document.createElement('a');a.href=url;a.download=m.file||'material';a.click()}setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(err){alert(err.message||'Unable to open the material.')}}
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
function filterMaterials(){const q=(document.getElementById('search')?.value||'').toLowerCase();renderMaterials(materials.filter(m=>Object.values(m).join(' ').toLowerCase().includes(q)))}
function renderTeacher(){const c=document.getElementById('count');if(c)c.textContent=materials.length;const box=document.getElementById('teacherMaterials');if(box)box.innerHTML=materials.length?materials.map(m=>`<div class="material"><div><b>${escHtml(m.title)}</b><br><small>${escHtml(m.subject||'')} • ${escHtml(m.grade||'')} • ${escHtml(m.topic||'')}</small><br><span class="tag">${escHtml(m.approvalStatus||'pending').toUpperCase()}</span></div></div>`).join(''):'<p>No materials uploaded.</p>'}
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
  const el=document.getElementById('adminApprovals');if(el)el.style.display='block';
  adminRefreshAll();
}

async function loadServerMaterials(){try{const r=await fetch('/api/materials',{credentials:'include'});if(!r.ok)return false;const d=await r.json();materials=Array.isArray(d.materials)?d.materials:[];return true}catch(e){console.warn('Could not load server materials',e);return false}}
async function adminRefreshAll(){
  await loadServerMaterials();
  renderAdminFeedback();
  const pendingM=materials.filter(m=>(m.approvalStatus||'pending')!=='approved').length;
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  set('adminCount',materials.length);
  set('adminPendingMaterials',pendingM);
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
      </div>
    </div>`;
  }).join(''):'<p>No learning materials have been uploaded yet.</p>';
}
async function adminSetMaterialPrice(i,value){if(!materials[i])return;const price=Math.max(0,Number(value)||0);try{const r=await fetch('/api/materials/'+encodeURIComponent(materials[i].id)+'/review',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({approvalStatus:materials[i].approvalStatus||'pending',price})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not update price.');materials[i].price=price;logActivity(`Set material price: ${materials[i].title} = KES ${price.toFixed(2)}`);adminRefreshAll();renderMaterials()}catch(e){alert(e.message)}}
async function adminPreviewMaterial(i){const m=materials[i];if(!m)return;try{const r=await fetch('/api/materials/'+encodeURIComponent(m.id)+'/file',{credentials:'include'});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'Unable to open the material.')}const blob=await r.blob();const url=URL.createObjectURL(blob);const opened=window.open(url,'_blank');if(!opened){const a=document.createElement('a');a.href=url;a.download=m.file||'material';a.click()}setTimeout(()=>URL.revokeObjectURL(url),60000);logActivity('Admin reviewed material: '+m.title)}catch(err){alert(err.message||'Unable to open the material for review.')}}
async function adminMaterialApproval(i,status){if(!materials[i])return;try{const r=await fetch('/api/materials/'+encodeURIComponent(materials[i].id)+'/review',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({approvalStatus:status,price:Number(materials[i].price||0)})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not update material.');materials[i].approvalStatus=status;materials[i].approvedAt=d.material?.approvedAt||null;logActivity(`${status==='approved'?'Approved':'Rejected'} material: ${materials[i].title}`);logNotification(`Material ${materials[i].title}: ${status}`);adminRefreshAll();renderMaterials()}catch(e){alert(e.message)}}
function setSessionRole(role,email){
  sessionStorage.setItem('tusomeLoggedIn','true');
  sessionStorage.setItem('tusomeRole',role);
  sessionStorage.setItem('tusomeCurrentUser',email||role);
  localStorage.setItem('tusomeCurrentUser',email||role);
}
function getSessionRole(){return sessionStorage.getItem('tusomeLoggedIn')==='true'?sessionStorage.getItem('tusomeRole'):null}
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
  finally{button.disabled=false;button.textContent='Login'}
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
function show(id){
  const protectedRoles={learner:'learner',teacher:'teacher',admin:'admin',communication:'user'};
  if(protectedRoles[id]){
    const role=getSessionRole();
    if(!role){show('login');return}
    if(id==='learner'&&role!=='learner'){alert('This dashboard is for learners.');return}
    if(id==='teacher'&&role!=='teacher'){alert('This dashboard is for teachers.');return}
    if(id==='admin'&&role!=='admin'){alert('Administrator access is required.');return}
  }
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const el=document.getElementById(id);if(el)el.classList.add('active');
  if(id==='teacher'){loadServerMaterials().then(renderTeacher)}
  if(id==='admin'){adminRefreshAll()}
  if(id==='communication'){renderMyFeedback();renderAdminFeedback()}
  if(id==='notifications')renderNotifications();
  if(id==='progress'||id==='parent')refreshProgress();
  if(id==='payments')renderPayments();
  if(id==='curriculum')loadCurriculumCatalogue();
  updatePublicUi();
  window.scrollTo(0,0);
}
let aiReturnDashboard='learner';
function openAIAssistant(dashboard){
  aiReturnDashboard=dashboard||getSessionRole()||'learner';
  sessionStorage.setItem('tusomeAIReturnDashboard',aiReturnDashboard);
  show('ai');
}
function backFromAIAssistant(){
  const role=getSessionRole();
  const target=sessionStorage.getItem('tusomeAIReturnDashboard')||aiReturnDashboard||role||'learner';
  if(['learner','teacher','admin','parent'].includes(target)){show(target)}else{show(role==='admin'?'admin':role==='teacher'?'teacher':'learner')}
}

function copyAI(){navigator.clipboard?.writeText(document.getElementById('aiAnswer').textContent);alert('Response copied.')}
async function checkAIStatus(){const el=document.getElementById('aiStatus');if(!el)return;try{const r=await fetch('/api/health');const d=await r.json();el.className=d.ai?.configured?'success':'notice';el.textContent=d.ai?.configured?'🟢 Gemini AI connected • '+d.ai.model:'🟠 AI service is not configured. Add GEMINI_API_KEY to Render Environment.'}catch(e){el.className='notice';el.textContent='🔴 EduShelf server is not running. Start it with: npm install && npm start'}}
async function askAI(e){e.preventDefault();const subject=document.getElementById('aiSubject').value,grade=document.getElementById('aiGrade').value,mode=document.getElementById('aiMode').value,focus=document.getElementById('cbeFocus').value,prompt=document.getElementById('aiPrompt').value.trim(),qFile=document.getElementById('aiQuestionFile')?.files?.[0],wFile=document.getElementById('aiWorkingFile')?.files?.[0],box=document.getElementById('aiResult'),answer=document.getElementById('aiAnswer'),button=e.target.querySelector('button[type="submit"]');if(!prompt&&!qFile&&!wFile){alert('Enter a question or upload a question paper first.');return}if(mode==='mark'&&!qFile&&!wFile){alert('For Mark My Work, upload your question paper and/or your working.');return}button.disabled=true;button.textContent='⏳ Gemini is working...';answer.textContent='Gemini is preparing your response...';box.style.display='block';try{const readFile=async(file)=>{if(!file)return null;if(file.size>12*1024*1024)throw new Error('Please keep each uploaded file below 12 MB.');const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the selected file.'));reader.readAsDataURL(file)});return{name:file.name,mimeType:file.type,data:dataUrl}};const [questionFile,workingFile]=await Promise.all([readFile(qFile),readFile(wFile)]);const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject,grade,mode,focus,prompt,file:questionFile,questionFile,workingFile})});const data=await res.json();if(!res.ok)throw new Error(data.error||'The Gemini service could not respond.');answer.textContent=data.answer;if(mode==='mark')saveMarkAttempt(subject,grade,prompt,data.answer);logActivity('Used Gemini AI Study Assistant: '+mode+' / '+subject+' / '+grade);logNotification('Gemini response generated for '+subject+' ('+grade+').');refreshProgress();renderNotifications()}catch(err){answer.textContent='Sorry, Gemini could not respond.\n\n'+err.message;checkAIStatus()}finally{button.disabled=false;button.textContent='✨ Ask AI'}}
async function loadCurriculumCatalogue(){const box=document.getElementById('curriculumCatalogue');if(!box)return;box.textContent='Loading curriculum records...';try{const grade=document.getElementById('catGrade').value,subject=document.getElementById('catSubject').value;const r=await fetch('/api/curriculum?'+new URLSearchParams({grade,subject}));const data=await r.json();box.innerHTML=data.records.length?data.records.map(x=>`<div class="material"><div><b>${x.grade} • ${x.subject}</b><br><span class="tag">${x.strand}</span> <span class="tag">${x.substrand}</span><br><small>${(x.learningOutcomes||[]).join(' • ')||'Structure record — exact learning outcomes not yet imported for this entry.'}</small></div><span class="tag">${(x.learningOutcomes||[]).length} outcomes</span></div>`).join(''):'<p>No imported record matches this selection yet.</p>'}catch(e){box.textContent='Start the EduShelf server to load curriculum records.'}}
document.getElementById('aiMode')?.addEventListener('change',()=>{const mode=document.getElementById('aiMode').value;const hint=document.getElementById('aiFileHint');if(hint){hint.innerHTML=mode==='mark'?'Upload the <b>question paper</b> in the first slot and <b>your working</b> in the second slot. Gemini will compare them and mark each step.':'Use the <b>Question Paper</b> slot for a paper you want Gemini to solve. The <b>Your Working</b> slot is for Mark My Work.';}});

async function runGeneratedAI(subject,grade,mode,focus,prompt,resultBox,answerBox){resultBox.style.display='block';answerBox.textContent='Generating...';try{const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({subject,grade,mode,focus,prompt})});const data=await res.json();if(!res.ok)throw new Error(data.error||'AI request failed.');answerBox.textContent=data.answer;logActivity('Generated '+mode+' / '+subject+' / '+grade);logNotification('New AI '+mode+' generated for '+subject+' ('+grade+').');refreshProgress()}catch(err){answerBox.textContent='Sorry, the AI service is unavailable.\n\n'+err.message}}
function generateLesson(e){e.preventDefault();runGeneratedAI(document.getElementById('lessonSubject').value,document.getElementById('lessonGrade').value,'lesson','Learning Outcome / Strand / Sub-strand',`Create a ${document.getElementById('lessonDuration').value} lesson plan for ${document.getElementById('lessonStrand').value}. Topic/learning outcome: ${document.getElementById('lessonTopic').value}. Include objectives, key inquiry question, learning experiences, resources, competencies, values, PCIs, differentiation and assessment.`,document.getElementById('lessonResult'),document.getElementById('lessonAnswer'))}
function generateAssessment(e){e.preventDefault();runGeneratedAI(document.getElementById('assessmentSubject').value,document.getElementById('assessmentGrade').value,'assessment','Assessment / Rubric',`Create a ${document.getElementById('assessmentType').value} assessment for ${document.getElementById('assessmentStrand').value}. Topic/outcome: ${document.getElementById('assessmentTopic').value}. Include instructions, tasks/questions, marking guidance and a 4-level rubric with observable criteria.`,document.getElementById('assessmentResult'),document.getElementById('assessmentAnswer'))}
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
restoreServerSession();
(async()=>{await loadServerMaterials();if(getSessionRole()==='learner')await loadServerPurchases();populateMaterialFilters();populateMaterialFilters();renderMaterials();renderTeacher();renderAdmin();refreshProgress();checkAIStatus()})();
