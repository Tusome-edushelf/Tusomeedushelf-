
let digitalLibraryResources=[];
function digitalLibraryRole(){return getSessionRole()||''}
async function loadDigitalLibrary(){
  const role=digitalLibraryRole();
  if(!role)return;
  const r=await fetch('/api/digital-library',{credentials:'include'});
  const d=await r.json();
  if(!r.ok){showToast?.(d.error||'Could not load the digital library.','error');return}
  digitalLibraryResources=Array.isArray(d.resources)?d.resources:[];
  if(role==='learner'){await loadServerMaterials();await loadServerPurchases();}
  document.getElementById('dlTotal').textContent=d.counts?.total??digitalLibraryResources.length;
  document.getElementById('dlLinks').textContent=d.counts?.links??digitalLibraryResources.filter(x=>x.kind==='link').length;
  document.getElementById('dlUploaded').textContent=d.counts?.uploaded??digitalLibraryResources.filter(x=>x.kind==='material').length;
  const saved=Object.values(learnerActivity||{}).filter(x=>x?.bookmarked).length;
  document.getElementById('dlSaved').textContent=String(saved);
  populateDigitalLibraryFilters();
  renderDigitalLibrary();
  const contributor=document.getElementById('digitalLibraryContributor');
  if(contributor)contributor.style.display=['teacher','admin'].includes(role)?'block':'none';
  const admin=document.getElementById('digitalLibraryAdmin');
  if(admin)admin.style.display=role==='admin'?'block':'none';
  if(role==='admin')loadDigitalLibraryAdmin();
}
function populateDigitalLibraryFilters(){
  const sets={dlSubject:[...new Set(digitalLibraryResources.map(x=>x.subject).filter(Boolean))].sort(),dlGrade:[...new Set(digitalLibraryResources.map(x=>x.grade).filter(Boolean))].sort(),dlType:[...new Set(digitalLibraryResources.map(x=>x.resourceType).filter(Boolean))].sort()};
  for(const [id,vals] of Object.entries(sets)){const el=document.getElementById(id);if(!el)continue;const current=el.value;const label=id==='dlSubject'?'All subjects':id==='dlGrade'?'All grades':'All types';el.innerHTML=`<option value="">${label}</option>`+vals.map(v=>`<option value="${escHtml(v)}">${escHtml(v)}</option>`).join('');if(vals.includes(current))el.value=current}
}
function renderDigitalLibrary(){
  const q=(document.getElementById('dlSearch')?.value||'').trim().toLowerCase();
  const subject=document.getElementById('dlSubject')?.value||'';const grade=document.getElementById('dlGrade')?.value||'';const type=document.getElementById('dlType')?.value||'';const sort=document.getElementById('dlSort')?.value||'newest';
  let rows=digitalLibraryResources.filter(x=>{const hay=[x.title,x.subject,x.grade,x.topic,x.strand,x.description,x.resourceType].filter(Boolean).join(' ').toLowerCase();return(!q||hay.includes(q))&&(!subject||x.subject===subject)&&(!grade||x.grade===grade)&&(!type||x.resourceType===type)});
  if(sort==='az')rows.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));else rows.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const box=document.getElementById('digitalLibraryResults');
  box.innerHTML=rows.length?rows.map(x=>{const meta=[x.subject,x.grade,x.topic].filter(Boolean);const desc=escHtml(x.description||'Digital learning resource.');const title=escHtml(x.title||'Untitled resource');const typeLabel=escHtml(x.resourceType||'Resource');const id=escHtml(x.resourceId||'');const paid=x.kind==='material'&&isPurchased(x.resourceId);const m= x.kind==='material' ? materials.find(mm=>String(mm.id)===String(x.resourceId)) : null;const price=m?materialPrice(m):0;const button=x.kind==='material'?(price>0&&!paid?`<button class="btn primary" type="button" onclick="openDigitalLibraryMaterial('${id}')">Buy — KES ${price}</button>`:`<button class="btn primary" type="button" onclick="openDigitalLibraryMaterial('${id}')">Open</button>`):`<button class="btn primary" type="button" onclick="openDigitalLibraryLink('${id}')">Open Resource</button>`;return `<article class="digital-resource-card"><div class="digital-resource-meta"><span class="tag">${typeLabel}</span>${meta.map(v=>`<span class="tag">${escHtml(v)}</span>`).join('')}</div><h3>${title}</h3><p class="small">${desc}</p><small class="small">${x.kind==='material'?'Approved Tusome EduShelf material':'Curated online resource'}</small><div class="digital-resource-actions">${button}${x.kind==='material'&&getSessionRole()==='learner'?`<button class="btn" type="button" onclick="saveDigitalLibraryMaterial('${id}')">🔖 Save</button>`:''}</div></article>`}).join(''):'<div class="notice" style="grid-column:1/-1">No digital resources match your filters.</div>';
}
function openDigitalLibraryLink(id){const item=digitalLibraryResources.find(x=>String(x.resourceId)===String(id));if(item?.url)window.open(item.url,'_blank','noopener,noreferrer')}
async function openDigitalLibraryMaterial(id){
  const item=digitalLibraryResources.find(x=>String(x.resourceId)===String(id));if(!item)return;
  if(getSessionRole()==='learner'){await loadServerMaterials();const m=materials.find(x=>String(x.id)===String(id));if(m){openMaterial(materials.indexOf(m));return}}
  window.open('/api/materials/'+encodeURIComponent(id)+'/file','_blank','noopener,noreferrer');
}
async function saveDigitalLibraryMaterial(id){await loadServerMaterials();const m=materials.find(x=>String(x.id)===String(id));if(!m)return;await toggleBookmark(String(id));const saved=!!learnerActivity[String(id)]?.bookmarked;document.getElementById('dlSaved').textContent=String(Object.values(learnerActivity||{}).filter(x=>x?.bookmarked).length);showToast?.(saved?'Resource saved.':'Resource removed from saved items.', 'success')}
function clearDigitalResourceForm(){['dlNewTitle','dlNewUrl','dlNewSubject','dlNewGrade','dlNewTopic','dlNewDescription'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});const s=document.getElementById('dlContributorStatus');if(s)s.textContent=''}
async function addDigitalResource(){
  const payload={title:document.getElementById('dlNewTitle').value,url:document.getElementById('dlNewUrl').value,resourceType:document.getElementById('dlNewType').value,subject:document.getElementById('dlNewSubject').value,grade:document.getElementById('dlNewGrade').value,topic:document.getElementById('dlNewTopic').value,description:document.getElementById('dlNewDescription').value};
  try{const r=await fetch('/api/digital-library/resources',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw new Error(d.error||'Could not submit resource.');document.getElementById('dlContributorStatus').textContent=d.status==='pending'?'Submitted for administrator review.':'Published to the digital library.';showToast?.(d.status==='pending'?'Resource submitted for review.':'Resource published.','success');clearDigitalResourceForm();loadDigitalLibraryAdmin?.();}catch(e){showToast?.(e.message,'error')}}
async function loadDigitalLibraryAdmin(){if(getSessionRole()!=='admin')return;const box=document.getElementById('digitalLibraryAdminRows');if(!box)return;try{const r=await fetch('/api/admin/digital-library/resources',{credentials:'include'}),d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load resource submissions.');const rows=d.resources||[];box.innerHTML=rows.length?rows.map(x=>`<div class="digital-admin-row"><div><b>${escHtml(x.title)}</b><br><small>${escHtml(x.resourceType||'Link')} · ${escHtml(x.subject||'General')} · ${escHtml(x.grade||'All grades')}</small></div><div><small>${escHtml(x.createdBy||'')}<br>${escHtml(x.status)}</small></div><a class="btn" href="${escHtml(x.url)}" target="_blank" rel="noopener noreferrer">Preview</a><div>${x.status==='pending'?`<button class="btn primary" onclick="setDigitalResourceStatus('${escHtml(x.resourceId)}','approved')">Approve</button><button class="btn" onclick="setDigitalResourceStatus('${escHtml(x.resourceId)}','rejected')">Reject</button>`:'<span class="tag">'+escHtml(x.status)+'</span>'}</div></div>`).join(''):'<p class="small">No submitted digital links yet.</p>'}catch(e){box.innerHTML=`<p class="small">${escHtml(e.message)}</p>`}}
async function setDigitalResourceStatus(id,status){try{const r=await fetch('/api/admin/digital-library/resources/'+encodeURIComponent(id)+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({status})}),d=await r.json();if(!r.ok)throw new Error(d.error||'Could not update resource.');showToast?.('Resource status updated.','success');await loadDigitalLibraryAdmin();await loadDigitalLibrary()}catch(e){showToast?.(e.message,'error')}}
