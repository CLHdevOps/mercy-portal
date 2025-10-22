
const DEMO_PASSWORD = "mercyhouse2025!";
function requireAuth() {
  const authed = localStorage.getItem("mh_authed") === "1";
  if (!authed) {
    const overlay = document.createElement("div");
    overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
    overlay.innerHTML = `
      <div class="glass w-full max-w-md mx-auto rounded-2xl p-6 shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <img src="images/mercy-house-logo.png" alt="Mercy House" class="w-10 h-10 object-contain"/>
          <h2 class="text-xl font-semibold">Private Access</h2>
        </div>
        <p class="text-sm text-slate-600 mb-4">Enter the internal demo password to continue.</p>
        <input id="mh-pass" type="password" placeholder="Password" class="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-600"/>
        <div id="mh-err" class="text-red-600 text-sm mb-3 hidden">Incorrect password. Try again.</div>
        <button id="mh-btn" class="w-full rounded-xl bg-blue-600 text-white font-medium py-2 hover:bg-blue-700">Unlock</button>
        <p class="text-xs text-slate-500 mt-3">Demo password was set in code. Replace with SSO or server auth for production.</p>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector("#mh-btn").addEventListener("click", () => {
      const val = overlay.querySelector("#mh-pass").value;
      if (val === DEMO_PASSWORD) {
        localStorage.setItem("mh_authed", "1");
        overlay.remove();
      } else {
        overlay.querySelector("#mh-err").classList.remove("hidden");
      }
    });
  }
}

async function askAssistant(prompt) {
  const resBox = document.querySelector("#assistant-results");
  const thinking = document.createElement("div");
  thinking.className = "text-sm text-slate-500";
  thinking.textContent = "Thinking…";
  resBox.prepend(thinking);
  try {
    const docs = await (await fetch("docs/index.json")).json();
    const q = (prompt || "").toLowerCase();
    const scored = docs.map(d => {
      const hay = (d.title + " " + d.summary + " " + (d.keywords||[]).join(" ")).toLowerCase();
      const score = q.split(/\s+/).reduce((acc, term) => acc + (hay.includes(term) ? 1 : 0), 0);
      return {...d, score};
    }).sort((a,b)=>b.score-a.score);
    thinking.remove();
    const hits = scored.filter(d=>d.score>0).slice(0,3);
    const card = document.createElement("div");
    card.className = "rounded-xl border bg-white p-4 shadow-sm";
    if (hits.length === 0) {
      card.innerHTML = `<div class="text-slate-800 font-medium mb-1">No direct matches found.</div>
        <p class="text-slate-600 text-sm">Try asking about: <em>thrift store near me</em>, <em>SEO pricing</em>, or <em>Google Business Profile</em>.</p>`;
    } else {
      let answer = "I found the most relevant internal documents below. Open them to verify details.";
      if (q.includes("thrift") || q.includes("near me")) answer = "Top priority: launch Thrift Store & Local SEO with location pages and optimized Google Business Profiles.";
      if (q.includes("pricing") || q.includes("seo")) answer = "See the SEO Pricing proposals for scope, timelines, and KPIs.";
      card.innerHTML = `<div class="text-slate-800 font-medium mb-1">Draft answer</div>
        <p class="text-slate-700 text-sm mb-3">${answer}</p>
        <div class="text-slate-800 font-medium mb-1">Sources</div>
        <ul class="space-y-2">
          ${hits.map(h => `<li class="text-sm"><a href="docs/${h.file}" class="text-blue-600 underline" target="_blank" rel="noopener">${h.title}</a>
          <div class="text-slate-600">${h.summary}</div></li>`).join("")}
        </ul>`;
    }
    resBox.prepend(card);
  } catch (err) {
    thinking.remove();
    const errBox = document.createElement("div");
    errBox.className = "rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700";
    errBox.textContent = "Assistant error: " + (err?.message || err);
    resBox.prepend(errBox);
  }
}

(function(){
  function setupVideoHero(container, titleText){
    const video = container.querySelector("video");
    const title = document.createElement("div");
    title.className = "title-card";
    title.textContent = titleText || "OUR RESPONSE";
    container.appendChild(title);
    if (video){
      video.muted = true; video.playsInline = true;
      const attempt = video.play(); if (attempt?.catch) attempt.catch(()=>{});
      container.addEventListener("click", (e)=>{
        if (e.target.closest("a")) return; // let CTA clicks pass through
        video.muted = !video.muted; video.play();
      });
    }
    setTimeout(()=> title.classList.add("hide"), 1500);
  }
  window.MH = { requireAuth, askAssistant };
  window.addEventListener("DOMContentLoaded", ()=>{
    document.querySelectorAll(".video-hero").forEach((h, i)=> setupVideoHero(h, i===0 ? "OUR RESPONSE" : ""));
  });
})();
