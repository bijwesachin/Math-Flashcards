// === Calm & Smooth Fun Theme Logic ===

// Grab elements from your existing HTML
const cardContainer = document.getElementById('cardContainer');
const cardInner = document.getElementById('cardInner');
const frontQuestion = document.getElementById('frontQuestion');
const frontText = document.getElementById('frontText');
const frontImg = document.getElementById('frontImg');
const backText = document.getElementById('backText');
const backImg = document.getElementById('backImg');
const topicBadge = document.getElementById('topicBadge');
const topicLabel = document.getElementById('topicLabel');
const topicIcon = document.getElementById('topicIcon');
const progressLabel = document.getElementById('progressLabel');
const topicFilter = document.getElementById('topicFilter');
const searchInput = document.getElementById('searchInput');
const shuffleToggle = document.getElementById('shuffleToggle');
const resetBtn = document.getElementById('resetBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');
const frontSample = document.getElementById('frontSample');
const backTitle = document.getElementById('backTitle');

// State
let data = [];
let order = [];
let filtered = [];
let current = 0;
let flipped = false;
let animating = false;

// Track which cards have already played step animation
const playedSteps = new Set();

document.addEventListener('DOMContentLoaded', init);

// ---- Data + init ----
async function init(){
  try {
    const res = await fetch('data/flashcards.json', { cache: 'no-store' });
    if(!res.ok) throw new Error('Load error');
    const raw = await res.json();
    data = raw.map(c => ({
      ...c,
      question: (c.question && String(c.question).trim()) || c.front || c.subtopic || c.topic || 'Question',
      hint: c.hint || '',
      imageFront: c.imageFront || c.image || null,
      imageBack: c.imageBack || null,
      topic: c.topic || 'General',
      icon: c.icon || pickIcon(c.topic),
      color: c.color || '#eef2f7'
    }));
    order = data.map((_,i)=>i);
    filtered = [...order];
    current = 0;
    populateTopics();
    wire();
    render(0);
  } catch(e){
    console.error(e);
    if(frontQuestion) frontQuestion.textContent = 'Could not load data. Serve via http (e.g., python3 -m http.server)';
  }
}

function wire(){
  if(prevBtn) prevBtn.addEventListener('click', ()=>render(current-1));
  if(nextBtn) nextBtn.addEventListener('click', ()=>render(current+1));
  if(flipBtn) flipBtn.addEventListener('click', flip);
  if(cardContainer) cardContainer.addEventListener('click', (e)=>{
    const tag = (e.target.tagName||'').toLowerCase();
    if(['button','input','select','label','option'].includes(tag)) return;
    flip();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.code==='ArrowLeft') render(current-1);
    else if(e.code==='ArrowRight') render(current+1);
    else if(e.code==='Space' || e.code==='Enter'){ e.preventDefault(); flip(); }
  });
  if(topicFilter) topicFilter.addEventListener('change', applyFilters);
  if(searchInput) searchInput.addEventListener('input', debounce(applyFilters, 200));
  if(shuffleToggle) shuffleToggle.addEventListener('change', applyFilters);
  if(resetBtn) resetBtn.addEventListener('click', ()=>{
    if(topicFilter) topicFilter.value='ALL';
    if(searchInput) searchInput.value='';
    if(shuffleToggle) shuffleToggle.checked=false;
    if(resetBtn) resetBtn.style.visibility='hidden';
    applyFilters();
  });
}

function populateTopics(){
  const topics = [...new Set(data.map(c=>c.topic).filter(Boolean))].sort();
  if(topicFilter) {
    topicFilter.innerHTML = '<option value="ALL">All Topics</option>' + topics.map(t=>`<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  }
}

function applyFilters(){
  const topic = topicFilter ? topicFilter.value : 'ALL';
  const term = (searchInput && searchInput.value || '').toLowerCase();
  filtered = order.filter(i=>{
    const c = data[i];
    if(topic!=='ALL' && c.topic!==topic) return false;
    if(term){
      const blob = `${c.question||''} ${c.hint||''} ${c.back||''}`.toLowerCase();
      if(!blob.includes(term)) return false;
    }
    return true;
  });
  if(shuffleToggle && shuffleToggle.checked) shuffle(filtered);
  current = 0; flipped = false;
  if(resetBtn) resetBtn.style.visibility = (topic!=='ALL' || term || (shuffleToggle && shuffleToggle.checked)) ? 'visible' : 'hidden';
  render(0);
}

// ---- Renderers ----
function render(i){
  if(!filtered.length){ showEmpty(); return; }
  current = (i%filtered.length + filtered.length)%filtered.length;
  const c = data[filtered[current]];

  // Badge + title
  if(topicBadge){ topicBadge.style.display='inline-flex'; topicBadge.style.backgroundColor = c.color; }
  if(topicIcon) topicIcon.textContent = c.icon || pickIcon(c.topic);
  if(topicLabel) topicLabel.textContent = c.topic || 'General';
  if(frontQuestion) frontQuestion.textContent = c.question;

  // Hint text
  if(frontText){
    if(c.hint){ frontText.style.display='block'; frontText.textContent = c.hint; }
    else { frontText.style.display='none'; frontText.textContent=''; }
  }

  // Front image (fallback to emoji)
  if(frontImg){
     ensureFrontImgWrapper();
    if(c.imageFront){ frontImg.src = c.imageFront; frontImg.style.display='block'; }
    else { frontImg.src = emojiDataURL(c.icon || pickIcon(c.topic)); frontImg.style.display='block'; }
  }

  // Front "Sample Problem" extracted from back, large & bold
  if(frontSample){
    const parsed = parseBack(c.back);
    if(parsed && parsed.sample){
      const emo = pickFrontEmoji(c.topic);
      frontSample.style.display='block';
      frontSample.innerHTML = `${escapeHtml(parsed.sample)} <span class="front-emoji">${emo}</span>`;
    } else {
      frontSample.style.display='none';
      frontSample.textContent='';
    }
  }

  if(flipped){ renderBack(c); }
  if(cardContainer) cardContainer.classList.toggle('flipped', flipped);
  if(progressLabel) progressLabel.textContent = `${current+1} / ${filtered.length}`;
}

function flip(){
  if(animating || !filtered.length) return;
  animating = true;
  flipped = !flipped;
  const c = data[filtered[current]];
  if(flipped) renderBack(c);
  void cardContainer.offsetWidth;
  if(cardContainer) cardContainer.classList.toggle('flipped', flipped);
  setTimeout(()=>{ animating=false; }, 620);
}

function renderBack(c) {
  const parsed = parseBack(c.back);
  if (backTitle) backTitle.textContent = c.question || c.front || '';
  const topicKey = topicKeyFor(c.topic);

  const wrapper = document.createElement('div');
  wrapper.className = 'back-split';
  wrapper.setAttribute('data-topic', topicKey);

  const left = document.createElement('div');
  left.className = 'back-left';
  const container = document.createElement('div');
  container.className = 'back-sections';
  container.innerHTML = `
    <div class="info-card info-card--rule"><div class="icon">🧠</div><div class="content"><div class="title">Rule</div><div class="text">${escapeHtml(parsed.rule)}</div></div></div>
    <div class="info-card info-card--sample"><div class="icon">✏️</div><div class="content"><div class="title">Sample</div><div class="text">${escapeHtml(parsed.sample)}</div></div></div>
    <div class="info-card info-card--solution"><div class="icon">✅</div><div class="content"><div class="title">Solution Steps</div><div class="text"><ul class="steps">${stepsHtml(parsed.solution)}</ul></div></div></div>
  `;
  left.appendChild(container);

  const right = document.createElement('div');
  right.className = 'back-right';
  const img = document.createElement('img');
  if (c.imageRight) {
    img.src = c.imageRight;
    right.appendChild(img);
  } else {
    right.innerHTML = '<span style="opacity:0.2;font-size:3rem;">🧮</span>';
  }

  wrapper.appendChild(left);
  wrapper.appendChild(right);

  backText.innerHTML = '';
  backText.appendChild(wrapper);

  // Replay button
  const replayBtn = document.createElement('button');
  replayBtn.className = 'replay-btn';
  replayBtn.innerHTML = '🔁';
  replayBtn.style.background = topicGradient(c.topic);
  replayBtn.title = 'Replay Steps';
  replayBtn.addEventListener('click', () => animateSteps(container, true));
  backText.appendChild(replayBtn);

  animateSections(container);

  const id = filtered[current];
  if (!playedSteps.has(id)) {
    animateSteps(container, false);
    playedSteps.add(id);
  } else {
    container.querySelectorAll('.info-card--solution li').forEach(li => {
      li.style.opacity = 1;
      li.style.animation = 'none';
    });
  }
}


// ---- Animations ----
function animateSections(container){
  const cards = container.querySelectorAll('.info-card');
  cards.forEach((card,i)=> setTimeout(()=> card.classList.add('visible'), 150*i));
}

function animateSteps(container, forceReplay=false){
  const list = container.querySelectorAll('.info-card--solution li');
  if(!list.length) return;
  list.forEach(li => { li.style.opacity=0; li.style.animation='none'; });
  list.forEach((li,i)=> setTimeout(()=> li.style.animation = 'fadeStep 0.6s ease forwards', 600*i));
  if(forceReplay){
    // nothing else needed; animation sequence just ran
  }
}

// ---- Helpers ----
function parseBack(backRaw){
  const raw = String(backRaw||'').replace(/\r\n/g,'\n');
  function find(label){ const m = raw.match(new RegExp('^\\s*'+label+'\\s*:\\s*(.+)$','im')); return m ? m[1].trim() : ''; }
  let rule = find('Rule');
  let sample = find('Sample Problem') || find('Sample');
  let solution = find('Solution');
  // If none found, try old "Sample:" style
  if(!rule && !sample && !solution){
    const parts = raw.split(/\n\s*Sample\s*:/i);
    const explanation = (parts[0]||'').trim();
    let rest = (parts[1]||'').trim();
    if(rest){
      if(rest.includes('→')){ const i = rest.indexOf('→'); sample = rest.slice(0,i).trim(); solution = rest.slice(i+1).trim(); }
      else if(rest.includes('=')){ const i = rest.indexOf('='); sample = rest.slice(0,i).trim(); solution = rest.slice(i+1).trim(); }
      else { sample = rest; solution = rest; }
    }
    rule = explanation || 'Review the concept.';
  }
  return {rule, sample, solution};
}

function stepsHtml(text){
  const emojis = ['🚀','💡','📏','🧩','🪄','✨'];
  const lines = String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length) return '';
  return lines.map((l,i)=>`<li data-emoji="${emojis[i % emojis.length]}">${escapeHtml(l)}</li>`).join('');
}

function topicKeyFor(topic){
  if(!topic) return 'General';
  if(/fraction/i.test(topic)) return 'Fractions';
  if(/decimal/i.test(topic)) return 'Decimals';
  if(/geometry/i.test(topic)) return 'Geometry';
  if(/measure/i.test(topic)) return 'Measurement';
  if(/pattern|algebra/i.test(topic)) return 'Patterns';
  if(/number|place value/i.test(topic)) return 'Numbers';
  if(/data|probability/i.test(topic)) return 'Data';
  return 'General';
}

function topicGradient(topic){
  if(!topic) return 'linear-gradient(135deg,#bae6fd,#93c5fd)';
  const t = topic.toLowerCase();
  if(t.includes('fraction')) return 'linear-gradient(135deg,#fdba74,#fed7aa)';
  if(t.includes('decimal')) return 'linear-gradient(135deg,#67e8f9,#22d3ee)';
  if(t.includes('geometry')) return 'linear-gradient(135deg,#93c5fd,#bfdbfe)';
  if(t.includes('measure')) return 'linear-gradient(135deg,#d8b4fe,#c084fc)';
  if(t.includes('pattern') || t.includes('algebra')) return 'linear-gradient(135deg,#a7f3d0,#6ee7b7)';
  if(t.includes('number') || t.includes('place value')) return 'linear-gradient(135deg,#fcd34d,#fde68a)';
  if(t.includes('data')) return 'linear-gradient(135deg,#fbcfe8,#f9a8d4)';
  return 'linear-gradient(135deg,#bae6fd,#93c5fd)';
}

function pickFrontEmoji(topic){
  if(!topic) return '🎯';
  const t = topic.toLowerCase();
  if(t.includes('fraction')) return '🍕';
  if(t.includes('decimal')) return '💯';
  if(t.includes('geometry')) return '📐';
  if(t.includes('measure')) return '📏';
  if(t.includes('pattern') || t.includes('algebra')) return '🧩';
  if(t.includes('number')) return '🔢';
  if(t.includes('data')) return '📊';
  return '🎯';
}

function pickIcon(topic){
  const map={'Numbers & Place Value':'🔢','Operations':'±×÷','Fractions':'🍕','Decimals':'💯','Measurement & Data':'📏','Geometry':'📐','Patterns & Algebraic Thinking':'🧩','Data Analysis & Probability':'🎲'};
  return map[topic] || '🧮';
}

function emojiDataURL(e){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='480' height='320'>
<rect width='100%' height='100%' fill='#f8fafc'/>
<text x='50%' y='55%' font-size='120' text-anchor='middle' dominant-baseline='middle'>${e||'🧮'}</text>
</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function debounce(fn,ms){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,args),ms); }; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

function showEmpty(){
  if(frontQuestion) frontQuestion.textContent = 'No cards found';
  if(frontText){ frontText.textContent = 'Try different filters or clear search.'; frontText.style.display='block'; }
  if(frontImg){ frontImg.style.display='none'; }
  if(topicBadge) topicBadge.style.display='none';
  if(backText) backText.innerHTML = '<p><em>No explanation</em></p>';
  if(backImg) backImg.style.display='none';
  if(progressLabel) progressLabel.textContent = '0 / 0';
}
function ensureFrontImgWrapper() {
  if (!frontImg) return null;
  const p = frontImg.parentElement;
  if (p && p.classList.contains('card-image-panel')) return p;
  // Create the panel wrapper once
  const wrap = document.createElement('div');
  wrap.className = 'card-image-panel';
  p.insertBefore(wrap, frontImg);
  wrap.appendChild(frontImg);
  return wrap;
}
