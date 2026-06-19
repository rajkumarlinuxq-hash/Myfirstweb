const SECURE_API_ENDPOINT = "https://vidtor-api-1.onrender.com/v1/generate-video";

// ✨ 1. CYBERPUNK NEON GLOW TRAIL LOGIC (TOUCH & DRAG)
const trailContainer = document.getElementById('pointer-trail-container');
function createTrailParticle(x, y) {
    const particle = document.createElement('div');
    particle.className = 'trail-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    trailContainer.appendChild(particle);
    setTimeout(() => particle.remove(), 600);
}
window.addEventListener('mousemove', (e) => createTrailParticle(e.clientX, e.clientY));
window.addEventListener('touchmove', (e) => {
    if(e.touches.length > 0) {
        createTrailParticle(e.touches[0].clientX, e.touches[0].clientY);
    }
});

// ✨ 2. PREMIUM 3D TILT EFFECT ON ACTIVE PANELS
const panels = document.querySelectorAll('.page-panel');
panels.forEach(panel => {
    panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        const x = e.clientX - rect.left - (rect.width/2);
        const y = e.clientY - rect.top - (rect.height/2);
        panel.style.transform = `perspective(1000px) rotateY(${x / 25}deg) rotateX(${-y / 25}deg) scale(1.01)`;
        panel.style.boxShadow = `0 35px 80px rgba(0, 210, 255, 0.15)`;
    });
    panel.addEventListener('mouseleave', () => {
        panel.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)`;
        panel.style.boxShadow = `0 30px 70px rgba(0,0,0,0.6)`;
    });
});

function toggleNavigationMenu() {
    const dropdown = document.getElementById('navDropdown');
    dropdown.style.display = (dropdown.style.display === 'flex') ? 'none' : 'flex';
}

function switchPanel(panelId) {
    document.getElementById('navDropdown').style.display = 'none';
    const allPanels = document.querySelectorAll('.page-panel');
    allPanels.forEach(panel => panel.classList.remove('active-panel'));
    const activePanel = document.getElementById('panel-' + panelId);
    if(activePanel) activePanel.classList.add('active-panel');
}

let loadingTimers = {};
function startHelixAnimation(canvasId) {
    const hCanvas = document.getElementById(canvasId); if(!hCanvas) return;
    const hCtx = hCanvas.getContext('2d'); hCanvas.width = hCanvas.parentElement.clientWidth; hCanvas.height = 45;
    let t = 0;
    function animate() {
        hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height); t += 0.08;
        for(let i=0; i<25; i++) {
            let x = (hCanvas.width / 25) * i;
            let y1 = hCanvas.height/2 + Math.sin(t + i*0.35) * 12;
            let y2 = hCanvas.height/2 + Math.sin(t + i*0.35 + Math.PI) * 12;
            hCtx.beginPath(); hCtx.arc(x, y1, 3, 0, Math.PI*2); hCtx.fillStyle = '#00d2ff'; hCtx.fill();
            hCtx.beginPath(); hCtx.arc(x, y2, 3, 0, Math.PI*2); hCtx.fillStyle = '#9d4edd'; hCtx.fill();
        }
        loadingTimers[canvasId] = requestAnimationFrame(animate);
    }
    animate();
}
function stopHelixAnimation(canvasId) { cancelAnimationFrame(loadingTimers[canvasId]); }

// Global storage variables to hold response asynchronously
let globalVideoUrl = null;
let globalFetchError = false;

function runPercentageEngine(percentTextId, barFillId, durationMs, helixId, on25PercentCallback, on100PercentCallback) {
    let start = 0;
    const textNode = document.getElementById(percentTextId); const barNode = document.getElementById(barFillId);
    startHelixAnimation(helixId);
    const interval = setInterval(() => {
        start++; textNode.innerText = `${start}%`; barNode.style.width = `${start}%`;
        
        // 🔥 TRIGGER BACKEND REQUEST EXACTLY AT 25% TO DEFEAT SERVER COLD-STARTS
        if (start === 25) {
            if (on25PercentCallback) on25PercentCallback();
        }

        if (start >= 100) { 
            clearInterval(interval); 
            stopHelixAnimation(helixId); 
            if(on100PercentCallback) on100PercentCallback(); 
        }
    }, durationMs / 100);
}

function hexToBlob(hexString, contentType) {
    const bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return new Blob([bytes], { type: contentType });
}

function processTextToVoice() {
    const textScript = document.getElementById('t2vPrompt').value.trim();
    const progBox = document.getElementById('t2vPromptProgressBox'); const scene3D = document.getElementById('t2v3DScene');
    if (!textScript) { alert("Please input text document script line!"); return; }
    progBox.style.display = "block"; scene3D.style.display = "none";

    runPercentageEngine('t2vPercentText', 't2vBarFill', 2000, 't2vHelixCanvas', null, () => {
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(textScript)}`;
        progBox.style.display = "none"; scene3D.style.display = "block";
        scene3D.innerHTML = `<div class="anime-boy-avatar">VOICE SYNTH</div><div class="payload-display-frame"><audio src="${audioUrl}" controls autoplay></audio></div>`;
    });
}

async function generateSecureAIVideo(urlFieldId, fileFieldId, progBoxId, percentTextId, barFillId, scene3DId, helixId, type, motionPromptId) {
    const imgUrlInput = document.getElementById(urlFieldId).value.trim();
    const fileInput = document.getElementById(fileFieldId);
    const progBox = document.getElementById(progBoxId);
    const scene3D = document.getElementById(scene3DId);
    const subtitleVal = type === 'subtitle' ? document.getElementById('p2vtPrompt').value.trim() : '';

    let targetImgUrl = imgUrlInput;

    if (fileInput.files && fileInput.files[0]) {
        const localFile = fileInput.files[0];
        targetImgUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    let width = img.width; let height = img.height;
                    if (width > 800) { height *= 800 / width; width = 800; }
                    canvas.width = width; canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(localFile);
        });
    }

    if (!targetImgUrl) { alert("Bhai, pehle koi photo upload karo!"); return; }
    
    // Reset state variables
    globalVideoUrl = null;
    globalFetchError = false;
    progBox.style.display = "block"; 
    scene3D.style.display = "none";

    // Request triggers at 25% mark mark asynchronously
    runPercentageEngine(percentTextId, barFillId, 120000, helixId, 
        async () => {
            try {
                const response = await fetch(SECURE_API_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image_url: targetImgUrl })
                });

                if (!response.ok) throw new Error("API Failure");

                const data = await response.json();
                const videoBlob = hexToBlob(data.video_bytes, "video/mp4");
                globalVideoUrl = URL.createObjectURL(videoBlob);
            } catch (err) {
                console.error("Background fetch error:", err);
                globalFetchError = true;
            }
        },
        () => {
            progBox.style.display = "none";
            
            function checkAndRenderOutput() {
                if (globalVideoUrl) {
                    scene3D.style.display = "block";
                    let subtitleHTML = "";
                    if (type === 'subtitle' && subtitleVal) {
                        subtitleHTML = `<div style="position:absolute; bottom:50px; left:50%; transform:translateX(-50%); width:90%; font-weight:800; text-shadow:2px 2px 4px #000; color:#fff; font-size:1.2rem; text-align:center; z-index:20;">${subtitleVal}</div>`;
                    }

                    scene3D.innerHTML = `
                        <div class="anime-boy-avatar">100% REAL AI</div>
                        <div class="payload-display-frame" style="position:relative;">
                            <video src="${globalVideoUrl}" autoplay loop muted playsinline controls style="width:100%; border-radius:12px;"></video>
                            ${subtitleHTML}
                        </div>
                        <a href="${globalVideoUrl}" download="VIDTOR_REAL_AI_${Date.now()}.mp4" class="btn-download-trigger">⬇️ Download Secure AI Video File</a>
                    `;
                } else if (globalFetchError) {
                    alert("Render Engine Serverless Update: Node took too long to respond. Please wait 10 seconds and submit again.");
                } else {
                    progBox.style.display = "block";
                    document.getElementById(percentTextId).innerText = "Finalizing...";
                    setTimeout(checkAndRenderOutput, 2000);
                }
            }
            
            checkAndRenderOutput();
        }
    );
}

// ✨ 3. AUTOMATED FLOATING CYBER TUNNEL BACKGROUND ENGINE
const canvas = document.getElementById('matrix100CirclesCanvas'); const ctx = canvas.getContext('2d');
function resizeCanvasEngine() { canvas.width = canvas.parentElement.clientWidth * 2; canvas.height = canvas.parentElement.clientHeight * 2; }
resizeCanvasEngine();
let animationFrameTimer = 0;
function draw3DTunnelMatrix() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); animationFrameTimer += 0.04;
    ctx.save(); ctx.translate(canvas.width/2, canvas.height/2); ctx.scale(1, 0.45); ctx.translate(-canvas.width/2, -canvas.height/2);
    for (let i = 0; i < 120; i++) {
        let radius = 10 + (i * 3.5);
        ctx.beginPath(); ctx.arc(canvas.width/2, canvas.height/2 + Math.sin(animationFrameTimer + i*0.06)*15, radius, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(0, 210, 255, ${0.08 + (1 - i/120)*0.45})`; ctx.stroke();
    }
    ctx.restore(); requestAnimationFrame(draw3DTunnelMatrix);
}
try { requestAnimationFrame(draw3DTunnelMatrix); } catch(e){}
