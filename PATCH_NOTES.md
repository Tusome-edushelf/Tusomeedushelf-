TUSOME EDUSHELF v126.5 — SAFE FRONTEND PATCH

TARGET:
  index.html from the current main/v126.x baseline.

BUG FOUND:
  loadSchoolAdminExamWorkflow() calls:
      renderExamAdminReview(d.exams||[],'schoolExamAdminReviewRows')
  but renderExamAdminReview() ignored the second argument and always rendered
  into #examAdminReviewRows, the older teacher-dashboard panel.

EFFECT:
  Admins could see an empty "Results Review & Publication" panel even though
  submitted exams were still present in PostgreSQL.

CHANGE 1 — replace the existing function:
  function renderExamAdminReview(exams){
    const box=document.getElementById('examAdminReviewRows'); if(!box)return;
    ...
  }

WITH:
  function renderExamAdminReview(exams,targetId='examAdminReviewRows'){
    const box=document.getElementById(targetId)||document.getElementById('examAdminReviewRows');
    if(!box)return;
    const rows=exams.filter(x=>['pending','approved'].includes(String(x.approvalStatus||'')));
    box.innerHTML=rows.map(x=>`<div class="card" style="margin:8px 0"><div class="topline"><div><b>${escHtml(x.title)}</b><p class="small" style="margin:4px 0">${escHtml(x.className||'')} · ${escHtml(x.subjectName||'')} · ${escHtml(x.examDate||'')}</p></div><span class="tag">${escHtml(x.approvalStatus||'pending')}</span></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" onclick="downloadExamPrePublishPdf('${escHtml(x.examId)}')">📄 Pre-Publish PDF</button>${x.approvalStatus==='pending'?`<button class="btn" type="button" onclick="reviewExam('${escHtml(x.examId)}','approve')">✅ Approve</button>`:''}<button class="btn" type="button" onclick="reviewExam('${escHtml(x.examId)}','reject')">↩ Return to Teacher</button><button class="btn primary" type="button" onclick="approveAndPublishExam('${escHtml(x.examId)}')">🚀 Approve & Publish</button></div></div>`).join('')||'<p class="small">No submitted results are waiting for review.</p>';
  }

CHANGE 2 — in loadSchoolAdminExamWorkflow(), keep:
  renderExamAdminReview(d.exams||[],'schoolExamAdminReviewRows')

CHANGE 3 — after review/approve/publish actions, refresh both the normal
exam results centre and the admin review panel when the current effective
school role is admin. This prevents stale review cards.

Suggested replacement for reviewExam:
  async function reviewExam(id,action){
    try{
      const r=await fetch('/api/schools/exams/'+encodeURIComponent(id)+'/review?schoolId='+encodeURIComponent(selectedSchoolId),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({action})
      });
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Could not review results.');
      showToast?.(d.message,'success');
      await loadTeacherExamResultsCentre();
      if(getSessionRole()==='admin' || window.schoolLoginMemberRole==='admin')
        await loadSchoolAdminExamWorkflow();
    }catch(e){showToast?.(e.message,'error')}
  }

Suggested replacement for approveAndPublishExam:
  async function approveAndPublishExam(examId){
    if(!confirm('Approve and publish these results now? Learners and parents will be able to see them after publication.'))return;
    try{
      const r=await fetch('/api/schools/exams/'+encodeURIComponent(examId)+'/approve-publish?schoolId='+encodeURIComponent(selectedSchoolId),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include'
      });
      const d=await parseApiResponse(r);
      if(!r.ok)throw new Error(d.error||'Could not approve and publish results.');
      showToast?.(d.message||'Results approved and published.','success');
      await loadTeacherExamResultsCentre();
      if(getSessionRole()==='admin' || window.schoolLoginMemberRole==='admin')
        await loadSchoolAdminExamWorkflow();
    }catch(e){showToast?.(e.message||'Could not publish results.','error')}
  }

IMPORTANT:
  Do NOT change server.mjs.
  Do NOT change PostgreSQL.
  Do NOT recreate learners, classes, or exams.
  The current database source of truth remains:
    230 learners
    4 classes
    10 exams
    2 exam classes
  Existing v126 exam workflow, bulk registration, school login, and
  learner/parent publication restrictions must remain intact.
