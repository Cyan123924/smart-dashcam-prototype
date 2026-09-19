const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let stream = null;
let recording = false;
let protectedClips = [];
let manualClips = [];
let impactBusy = false;

const camera = $("#camera");
const placeholder = $("#cameraPlaceholder");
const recIndicator = $("#recIndicator");
const recText = $("#recText");
const systemState = $("#systemState");
const impactCard = $("#impactCard");
const impactState = $("#impactState");
const impactHint = $("#impactHint");

function timeString(){
  return new Date().toLocaleTimeString([], {hour12:false});
}
function updateClock(){
  $("#timestamp").textContent = timeString();
}
setInterval(updateClock,1000); updateClock();

async function enableCamera(){
  if(!navigator.mediaDevices?.getUserMedia){
    showToast("Camera access is not supported in this browser.");
    return;
  }
  try{
    stream = await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},
      audio:false
    });
    camera.srcObject = stream;
    placeholder.classList.add("hidden");
    systemState.textContent = "CAMERA READY";
    showToast("Rear camera connected.");
  }catch(err){
    showToast("Camera permission was not granted.");
  }
}
$("#enableCamera").addEventListener("click", enableCamera);

function setRecording(on){
  recording = on;
  recIndicator.classList.toggle("recording",on);
  recText.textContent = on ? "RECORDING" : "STANDBY";
  $("#startBtn").classList.toggle("active",on);
  systemState.textContent = on ? "ROLLING BUFFER ACTIVE" : (stream ? "CAMERA READY":"SYSTEM READY");
  $("#startBtn").innerHTML = on ? "<span>■</span> STOP RECORDING" : "<span>●</span> START RECORDING";
}
$("#startBtn").addEventListener("click",()=>{
  if(!stream) enableCamera().then(()=>setRecording(!recording));
  else setRecording(!recording);
});

$("#saveBtn").addEventListener("click",()=>{
  if(!recording){
    showToast("Start recording first.");
    return;
  }
  manualClips.unshift({
    id:Date.now(), time:timeString(), type:"Manual Recording", note:"Saved locally by owner"
  });
  renderManual();
  showToast("Recording saved locally.");
});

function showScreen(id){
  $$(".screen").forEach(s=>s.classList.toggle("active",s.id===id));
  $$(".bottom").forEach(b=>b.classList.toggle("active",b.dataset.screen===id));
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-screen]").forEach(el=>el.addEventListener("click",()=>showScreen(el.dataset.screen)));

function simulateImpact(){
  if(impactBusy) return;
  impactBusy = true;
  $("#impactFlash").classList.add("show");
  impactCard.classList.add("impacting");
  impactState.textContent = "IMPACT RECEIVED";
  impactState.style.color = "var(--danger)";
  impactHint.textContent = "Protecting the rolling buffer and post-event preview…";
  systemState.textContent = "INCIDENT DETECTED";
  $("#recIndicator").classList.add("recording");
  recText.textContent = "PROTECTING";
  setTimeout(()=>{
    const clip = {id:Date.now(),time:timeString(),type:"Incident Clip",note:"30 sec before + impact + 30 sec after"};
    protectedClips.unshift(clip);
    renderProtected();
    $("#impactFlash").classList.remove("show");
    impactState.textContent = "PROTECTED";
    impactHint.textContent = "Impact received — incident clip protected and ready for review.";
    impactCard.style.borderColor = "rgba(255,77,94,.55)";
    systemState.textContent = "INCIDENT PROTECTED";
    showToast("Incident clip protected and ready for review.");
    setTimeout(()=>{
      impactState.textContent = "MONITORING";
      impactState.style.color = "";
      impactHint.textContent = "Demo sensor is ready. Use the button below to simulate an event.";
      impactCard.style.borderColor = "";
      systemState.textContent = recording ? "ROLLING BUFFER ACTIVE" : (stream ? "CAMERA READY":"SYSTEM READY");
      recText.textContent = recording ? "RECORDING" : "STANDBY";
      if(!recording) $("#recIndicator").classList.remove("recording");
      impactBusy = false;
    },3200);
  },1800);
}
$("#impactBtn").addEventListener("click",simulateImpact);

function renderProtected(){
  $("#protectedCount").textContent = protectedClips.length;
  const box=$("#protectedList");
  if(!protectedClips.length){
    box.className="clip-list empty-state";
    box.innerHTML='<div class="empty-icon">⌁</div><h3>No protected incident yet</h3><p>Use “Simulate Impact” on the main screen to create the presentation demo.</p>';
    return;
  }
  box.className="clip-list";
  box.innerHTML=protectedClips.map(c=>`
    <article class="clip">
      <div class="clip-preview">INCIDENT PREVIEW</div>
      <div><b>Incident • ${c.time}</b><small>30 sec before → <strong>IMPACT EVENT</strong> → 30 sec after</small><small>🔒 Protected locally • Owner controlled</small></div>
      <span class="clip-tag">PROTECTED</span>
    </article>`).join("");
}
function renderManual(){
  $("#manualCount").textContent=manualClips.length;
  const box=$("#manualList");
  if(!manualClips.length){
    box.className="clip-list empty-state";
    box.innerHTML='<div class="empty-icon">▣</div><h3>No manual recordings</h3><p>Press “Save Recording” while recording to save a local clip.</p>';
    return;
  }
  box.className="clip-list";
  box.innerHTML=manualClips.map(c=>`
    <article class="clip">
      <div class="clip-preview">LOCAL VIDEO</div>
      <div><b>Manual Recording • ${c.time}</b><small>${c.note}</small></div>
      <span class="clip-tag" style="color:#72d7c9;border-color:#286e67">LOCAL</span>
    </article>`).join("");
}
function showToast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.remove("show"),2200);
}
renderProtected(); renderManual();
