
let livePc=null, liveStream=null, liveRoom='', liveLastSignal=0, liveMode='voice', livePollTimer=null, liveInitiator=false;
function discussionUser(){return String(localStorage.getItem('tusomeCurrentUser')||'Learner')}
function loadDiscussionPosts(){
  const box=document.getElementById('discussionPosts'); if(!box)return;
  const g=document.getElementById('discussionGrade')?.value||'', s=document.getElementById('discussionSubject')?.value||'';
  fetch('/api/discussions/posts?grade='+encodeURIComponent(g)+'&subject='+encodeURIComponent(s),{credentials:'include'}).then(r=>r.json()).then(d=>{
    if(!d.ok)throw new Error(d.error||'Could not load discussions.');
    box.innerHTML=d.posts?.length?d.posts.map(p=>`<article class="discussion-post"><div class="discussion-post-meta">${escHtml(p.author_role==='teacher'?'Teacher':'Learner')} • ${escHtml(p.grade||'All grades')}${p.subject?' • '+escHtml(p.subject):''}${p.topic?' • '+escHtml(p.topic):''} • ${new Date(p.createdAt).toLocaleString()}</div><div>${escapeHomeAIText(p.body).replace(/\n/g,'<br>')}</div></article>`).join(''):'<div class="discussion-empty">No discussions yet. Start one with a learning question.</div>';
  }).catch(e=>{box.innerHTML='<div class="notice">'+escHtml(e.message)+'</div>'});
}
function postDiscussion(){
  const body=(document.getElementById('discussionBody')?.value||'').trim(); if(!body){showToast?.('Write a message first.','error');return}
  const payload={body,grade:document.getElementById('discussionGrade')?.value||'',subject:document.getElementById('discussionSubject')?.value||'',topic:document.getElementById('discussionTopic')?.value||''};
  fetch('/api/discussions/posts',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(payload)}).then(r=>r.json()).then(d=>{if(!d.ok)throw new Error(d.error||'Could not post.');document.getElementById('discussionBody').value='';showToast?.('Discussion posted.','success');loadDiscussionPosts()}).catch(e=>showToast?.(e.message,'error'));
}
async function startLiveRoom(mode){
  let code=(document.getElementById('liveRoomCode')?.value||'').trim().replace(/[^A-Za-z0-9_-]/g,''); if(!code)code='ROOM'+Math.random().toString(36).slice(2,7).toUpperCase();
  document.getElementById('liveRoomCode').value=code; liveRoom=code; liveMode=mode; liveInitiator=true; await setupLiveMedia(mode); if(!livePc)return;
  const offer=await livePc.createOffer(); await livePc.setLocalDescription(offer); await sendLiveSignal('offer',offer); setLiveStatus('Room '+code+' started. Share the room code with a classmate or teacher. Waiting for a participant…'); startLivePolling();
}
async function joinLiveRoom(){
  const code=(document.getElementById('liveRoomCode')?.value||'').trim().replace(/[^A-Za-z0-9_-]/g,''); if(!code){showToast?.('Enter a room code first.','error');return} liveRoom=code; liveInitiator=false; await setupLiveMedia('video'); setLiveStatus('Joining room '+code+'…'); startLivePolling();
}
async function renegotiateLiveRoom(){
  if(!livePc || !liveRoom)return;
  try{const offer=await livePc.createOffer();await livePc.setLocalDescription(offer);await sendLiveSignal('offer',offer);setLiveStatus('Updating the live connection…')}catch(e){setLiveStatus('Could not update the live connection.')}
}
async function shareScreen(){
  if(!livePc||!liveRoom){showToast?.('Start or join a live room first.','error');return}
  if(!navigator.mediaDevices?.getDisplayMedia){showToast?.('Screen sharing is not supported by this browser.','error');return}
  try{
    screenStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false,preferCurrentTab:true,selfBrowserSurface:'exclude',surfaceSwitching:'include'});
    const track=screenStream.getVideoTracks()[0];
    const sender=livePc.getSenders().find(x=>x.track&&x.track.kind==='video');
    if(sender){await sender.replaceTrack(track)}else{livePc.addTrack(track,screenStream)}
    const local=document.getElementById('localLiveVideo');local.srcObject=screenStream;local.style.display='block';
    track.onended=()=>stopScreenShare();
    await renegotiateLiveRoom();
    setLiveStatus('Screen sharing is active. Only share learning content and avoid showing passwords or private information.');
  }catch(e){showToast?.('Screen sharing was cancelled or not permitted.','info')}
}
async function stopScreenShare(){
  if(!screenStream)return;
  screenStream.getTracks().forEach(t=>t.stop());screenStream=null;
  if(livePc){
    try{
      const sender=livePc.getSenders().find(x=>x.track&&x.track.kind==='video');
      if(sender&&cameraStream){const camTrack=cameraStream.getVideoTracks()[0];if(camTrack)await sender.replaceTrack(camTrack)}
      const local=document.getElementById('localLiveVideo');local.srcObject=cameraStream||liveStream;
      await renegotiateLiveRoom();
    }catch{}
  }
  setLiveStatus('Screen sharing stopped.');
}
async function setupLiveMedia(mode){
  try{if(liveStream)liveStream.getTracks().forEach(t=>t.stop());if(screenStream)screenStream.getTracks().forEach(t=>t.stop());screenStream=null;cameraStream=await navigator.mediaDevices.getUserMedia({audio:true,video:mode==='video'});liveStream=cameraStream;const v=document.getElementById('localLiveVideo');v.srcObject=liveStream;v.style.display=mode==='video'?'block':'none';livePc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});liveStream.getTracks().forEach(t=>livePc.addTrack(t,liveStream));livePc.ontrack=e=>{const rv=document.getElementById('remoteLiveVideo');rv.srcObject=e.streams[0];rv.style.display='block'};livePc.onicecandidate=e=>{if(e.candidate)sendLiveSignal('ice',e.candidate)};livePc.onconnectionstatechange=()=>{if(['connected','completed'].includes(livePc.connectionState))setLiveStatus('Live room connected. You can talk or study together now.');if(['failed','disconnected'].includes(livePc.connectionState))setLiveStatus('Live connection interrupted. You can try joining again.')}
  }catch(e){showToast?.('Microphone/camera permission was not granted or is unavailable.','error');setLiveStatus('Could not access the microphone or camera.');livePc=null}
}
async function sendLiveSignal(kind,payload){if(!liveRoom)return;try{await fetch('/api/discussions/signals',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({room:liveRoom,kind,payload})})}catch{} }
function startLivePolling(){clearInterval(livePollTimer);livePollTimer=setInterval(pollLiveSignals,1200);pollLiveSignals()}
async function pollLiveSignals(){if(!liveRoom||!livePc)return;try{const r=await fetch('/api/discussions/signals?room='+encodeURIComponent(liveRoom)+'&after='+liveLastSignal,{credentials:'include'});const d=await r.json();for(const x of (d.signals||[])){liveLastSignal=Math.max(liveLastSignal,Number(x.id));if(x.kind==='offer'){await livePc.setRemoteDescription(x.payload);const ans=await livePc.createAnswer();await livePc.setLocalDescription(ans);await sendLiveSignal('answer',ans);setLiveStatus('Connected to the room. Waiting for media…')}else if(x.kind==='answer'&&liveInitiator){await livePc.setRemoteDescription(x.payload)}else if(x.kind==='ice'){try{await livePc.addIceCandidate(x.payload)}catch{}}} }catch{}}
function setLiveStatus(t){const el=document.getElementById('liveRoomStatus');if(el)el.textContent=t;}
function leaveLiveRoom(){clearInterval(livePollTimer);livePollTimer=null;if(screenStream)screenStream.getTracks().forEach(t=>t.stop());if(liveStream)liveStream.getTracks().forEach(t=>t.stop());if(livePc)livePc.close();screenStream=null;cameraStream=null;liveStream=null;livePc=null;liveRoom='';liveLastSignal=0;liveInitiator=false;document.getElementById('localLiveVideo').srcObject=null;document.getElementById('remoteLiveVideo').srcObject=null;setLiveStatus('You left the live room.')}
