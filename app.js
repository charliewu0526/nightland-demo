/* ===== Nightland demo app ===== */
const D = window.DEMO_DATA;
const app = document.getElementById('app');
const GCOLOR = {Techno:'#a855f7',House:'#22d3ee',Disco:'#ec4899',EDM:'#8b5cf6',
  HipHop:'#f59e0b',Soul:'#fb7185',Jazz:'#38bdf8',Pop:'#f472b6',Rock:'#f87171',
  Folk:'#34d399',Latin:'#fbbf24',Live:'#2dd4bf'};

/* ---------- helpers ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const esc = s => (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function img(src){return src||'';}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.className='show';
  clearTimeout(toast._t);toast._t=setTimeout(()=>t.className='',1600);}
function genrePills(dna,max=2){return (dna||[]).slice(0,max).map(g=>
  `<span class="pill" style="background:${GCOLOR[g.genre]||'#444'}33;border-color:${GCOLOR[g.genre]||'#444'};color:${GCOLOR[g.genre]||'#ccc'}">${esc(g.cn)}</span>`).join('');}
function stars(r){return `<span class="star">★ ${r}</span>`;}

/* ---------- radar chart (SVG) for music DNA ---------- */
function radar(dna,size=150){
  const cx=size/2, cy=size/2, R=size/2-22;
  const axes = dna.slice(0,5);
  const n = Math.max(axes.length,3);
  const maxv = Math.max(...axes.map(a=>a.pct),1);
  let grid='';
  for(let ring=1;ring<=3;ring++){
    const rr=R*ring/3;let pts=[];
    for(let i=0;i<n;i++){const ang=-Math.PI/2+i*2*Math.PI/n;
      pts.push((cx+rr*Math.cos(ang)).toFixed(1)+','+(cy+rr*Math.sin(ang)).toFixed(1));}
    grid+=`<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(255,255,255,.1)"/>`;
  }
  let axl='';let dpts=[];
  axes.forEach((a,i)=>{
    const ang=-Math.PI/2+i*2*Math.PI/n;
    const ax=cx+R*Math.cos(ang), ay=cy+R*Math.sin(ang);
    axl+=`<line x1="${cx}" y1="${cy}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="rgba(255,255,255,.08)"/>`;
    const vr=R*(a.pct/maxv);
    dpts.push((cx+vr*Math.cos(ang)).toFixed(1)+','+(cy+vr*Math.sin(ang)).toFixed(1));
  });
  return `<svg class="radar" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a855f7"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs>
    ${grid}${axl}
    <polygon points="${dpts.join(' ')}" fill="url(#rg)" fill-opacity=".45" stroke="url(#rg)" stroke-width="2"/>
  </svg>`;
}

/* ---------- router ---------- */
const routes = {};
function go(hash){location.hash=hash;}
function render(){
  const h = (location.hash||'#home').slice(1);
  const [name,arg] = h.split('/');
  const fn = routes[name] || routes.home;
  app.scrollTop = 0;
  app.innerHTML = `<div class="view">${fn(arg)}</div>`;
  // tab highlight
  const tabFor = {home:'home',spot:'home',event:'home',crew:'crew',passport:'passport',me:'me'}[name]||'home';
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.route===tabFor));
  bindView(name);
}
window.addEventListener('hashchange',render);
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>go('#'+t.dataset.route));

/* ================= HOME (今晚去哪) ================= */
routes.home = ()=>{
  const taste = D.user_taste.profile;
  const matched = [...D.bars].sort((a,b)=>(b.match||0)-(a.match||0)).slice(0,12);
  const cats = [...new Set(D.bars.map(b=>b.category))];
  const events = D.events.slice(0,8);
  const persona = D.seed.user.music_persona;
  return `
  <div class="hero">
    <h1>NIGHTLAND · 上海 🌙</h1>
    <div class="big">和你口味<span class="gradtext">对味的今晚</span></div>
    <div class="vibe">"${esc(D.meta.tagline)}"</div>
    <div class="stat">已收录 ${D.meta.bars_count} 家精选场所 · ${D.meta.events_count} 场今夜活动</div>
  </div>

  <div class="music-entry">
    <div class="lbl">🎵 你的夜晚音乐人格 · ${esc(persona)}</div>
    <div class="q">别人问预算，我们先问你听什么</div>
    <div class="taste-bars">
      ${taste.map(t=>`<div class="tb-row"><span class="g">${esc(t.cn)}</span>
        <span class="tb-track"><span class="tb-fill" style="width:${t.pct}%"></span></span>
        <span class="p">${t.pct}%</span></div>`).join('')}
    </div>
    <button class="btn" id="rematch">⚡ 用我的口味匹配今晚</button>
    <div class="prov">口味指纹聚合自 3 篇小红书笔记 + 71 条真实用户评论的曲风提及频次</div>
  </div>

  <div class="sec-title">🎧 按口味找店 <span class="more" data-go="#crew">AI 夜晚管家 ›</span></div>
  <div class="row">${cats.map(c=>`<span class="pill" data-cat="${esc(c)}">${esc(c)}</span>`).join('')}</div>

  <div class="sec-title">🔥 今晚热门活动</div>
  <div class="row">${events.map(evCard).join('')}</div>

  <div class="sec-title">💜 对味场所 · 按音乐匹配度</div>
  <div class="cardlist" id="spotlist">${matched.map(spotCard).join('')}</div>

  <div class="sec-title">🏆 城市策展榜 · 氛围感榜</div>
  <div class="rank">${rankList()}</div>
  <div style="height:20px"></div>`;
};

function spotCard(b){
  const cover = b.images[0]||'';
  return `<div class="spot" data-spot="${b.id}">
    <div class="ph" style="background-image:url('${cover}')">
      ${b.match?`<span class="match">🎵 ${b.match}% 对味</span>`:''}
      <span class="gnr">${genrePills(b.dna)}</span>
    </div>
    <div class="bd">
      <div class="nm">${esc(b.name)} ${stars(b.rating)}</div>
      <div class="meta"><span>${esc(b.category)}</span><span>📍${esc(b.region)}</span>
        ${b.bpm?`<span style="color:var(--neon-cyan)">${b.bpm.low}-${b.bpm.high} BPM</span>`:''}</div>
      ${b.match_reason?`<div class="why">💡 ${esc(b.match_reason)}</div>`:''}
    </div></div>`;
}
function evCard(e){
  const cover=e.images[0]||'';
  return `<div class="ev-card" data-event="${e.id}">
    <div class="ph" style="background-image:url('${cover}')"></div>
    <div class="bd"><div class="t">${esc(e.title)}</div>
      <div class="v">${esc(e.venue||'')}</div>
      <div class="d">${esc(e.date_text||'')} ${genrePills(e.dna,1)}</div></div></div>`;
}
function rankList(){
  const top=[...D.bars].sort((a,b)=>b.rating-a.rating).slice(0,5);
  return top.map((b,i)=>`<div class="rank-item" data-spot="${b.id}">
    <span class="rank-no ${i<3?'top':''}">${i+1}</span>
    <span class="rank-thumb" style="background-image:url('${b.images[0]||''}')"></span>
    <div style="flex:1"><div style="font-weight:700;font-size:14px">${esc(b.name)}</div>
      <div style="font-size:11px;color:var(--sub);margin-top:3px">${stars(b.rating)} · ${esc(b.region)} ${genrePills(b.dna,1)}</div></div>
  </div>`).join('');
}

/* ================= SPOT DETAIL (夜店详情) ================= */
routes.spot = (id)=>{
  const b = D.bars.find(x=>x.id===id) || D.bars[0];
  const imgs = b.images.length?b.images:[''];
  const scoreEntries = Object.entries(b.scores||{});
  // pick a few real dianping nlp tags
  const pos = (D.dianping.nlp||[]).filter(t=>t.affection===1).slice(0,6);
  const neg = (D.dianping.nlp||[]).filter(t=>t.affection===-1).slice(0,2);
  // a few real comments from xhs as on-site reviews
  const reviews = (D.posts[0].comments||[]).slice(0,4);
  return `
  <div class="dt-hero">
    <button class="dt-back" data-back>‹</button>
    <div class="hero-slider" data-slider>${imgs.map((s,i)=>
      `<img src="${s}" ${i===0?'':'style="display:none"'} loading="lazy">`).join('')}</div>
    <div class="dt-dots">${imgs.map((_,i)=>`<i class="${i===0?'on':''}"></i>`).join('')}</div>
    <div class="grad"></div>
  </div>
  <div class="dt-body">
    <div class="dt-title">${esc(b.name)}</div>
    <div class="dt-sub">${stars(b.rating)} <span>${esc(b.category)}</span>
      <span>📍 ${esc(b.region)}</span></div>

    <div class="dna-card">
      <h3>🎵 音乐 DNA · 这家店的声音指纹</h3>
      <div class="radar-wrap">
        ${radar(b.dna)}
        <div class="dna-legend">
          ${b.dna.map(g=>`<div class="lg"><span class="dot" style="background:${GCOLOR[g.genre]||'#888'}"></span>
            ${esc(g.cn)} <b style="margin-left:auto;color:#fff">${g.pct}%</b></div>`).join('')}
        </div>
      </div>
      ${b.bpm?`<span class="bpm">主打 ${b.bpm.driver} · ${b.bpm.low}–${b.bpm.high} BPM</span>`:''}
      <div class="prov">推导依据：${esc(b.dna_evidence||'品类声音先验')}</div>
      ${b.match?`<div class="why" style="margin-top:10px">💡 ${esc(b.match_reason)} —— 与你 ${b.match}% 对味</div>`:''}
    </div>

    <div class="sec-title" style="margin-left:0">📊 真实评分</div>
    <div class="scorebars">
      ${scoreEntries.map(([k,v])=>`<div class="sbar"><span class="lab">${esc(k)}</span>
        <span class="track"><span class="fill" style="width:${(v/5*100).toFixed(0)}%"></span></span>
        <span class="val">${v}</span></div>`).join('')}
    </div>

    <div class="sec-title" style="margin-left:0">✨ 氛围标签 <span style="font-size:11px;color:var(--dim);font-weight:400">· 来自真实点评 NLP</span></div>
    <div class="tags-wrap">
      ${pos.map(t=>`<span class="pill neon">${esc(t.name)} <b style="opacity:.7">${t.num}</b></span>`).join('')}
      ${neg.map(t=>`<span class="pill tag-neg">⚠ ${esc(t.name)}</span>`).join('')}
    </div>

    <div class="kv">🕐 <b>${esc((b.hours||[])[0]||'营业时间待补')}</b></div>
    <div class="kv">📍 <b>${esc(b.address||'')}</b></div>

    <div class="sec-title" style="margin-left:0">💬 真实到访口碑 <span style="font-size:11px;color:var(--dim);font-weight:400">· 仅到店用户可评</span></div>
    ${reviews.map(c=>`<div class="cmt"><div class="top"><span class="nick">${esc(c.nick||'用户')}</span>
      <span class="ip">${esc(c.ip||'')}</span><span class="like">♥ ${c.liked||0}</span></div>
      <div class="ct">${esc(c.content||'')}</div></div>`).join('')}
  </div>
  <div class="cta-bar">
    <button class="btn ghost" style="flex:0 0 110px" data-toast="已收藏到我的夜单">♥ 收藏</button>
    <button class="btn" data-go="#crew">叫人一起去 ›</button>
  </div>`;
};

/* ================= EVENT DETAIL (活动详情) ================= */
routes.event = (id)=>{
  const e = D.events.find(x=>x.id===id) || D.events[0];
  const imgs = e.images.length?e.images:[''];
  return `
  <div class="dt-hero">
    <button class="dt-back" data-back>‹</button>
    <img src="${imgs[0]}" loading="lazy">
    <div class="grad"></div>
  </div>
  <div class="dt-body">
    <div class="dt-title">${esc(e.title)}</div>
    <div class="dt-sub">📍 ${esc(e.venue||'')}</div>
    <div class="tags-wrap">${(e.tags||[]).map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>

    ${e.dna&&e.dna.length?`<div class="dna-card">
      <h3>🔊 今晚现场曲风预告</h3>
      <div class="tags-wrap">${e.dna.map(g=>`<span class="pill" style="background:${GCOLOR[g.genre]||'#444'}33;border-color:${GCOLOR[g.genre]||'#444'};color:${GCOLOR[g.genre]||'#ccc'}">${esc(g.cn)} ${g.pct}%</span>`).join('')}</div>
      <div class="prov">推导依据：活动标题/简介/标签真实关键词扫描</div>
    </div>`:''}

    <div class="kv">📅 <b>${esc(e.date_text||'')}</b></div>
    ${e.start_time?`<div class="kv">🕐 <b>${esc(e.start_time)}</b></div>`:''}
    ${e.price?`<div class="kv">🎟 <b>${esc(e.price)}</b></div>`:'<div class="kv">🎟 <b>免费 / 现场购票</b></div>'}
    <div class="kv">📍 <b>${esc(e.address||'')}</b></div>

    <div class="sec-title" style="margin-left:0">活动详情</div>
    <p style="font-size:13.5px;line-height:1.7;color:#cfcfdc">${esc(e.desc||'')}</p>
  </div>
  <div class="cta-bar">
    <button class="btn ghost" style="flex:0 0 110px" data-toast="已报名，凭证在「我的订单」">报名/购票</button>
    <button class="btn" data-go="#crew">叫人一起去 ›</button>
  </div>`;
};

/* ================= CREW (组局·和谁一起) ================= */
routes.crew = ()=>{
  const friends = D.seed.friends_online;
  const ev = D.events[0];
  const topMatch = [...D.bars].sort((a,b)=>(b.match||0)-(a.match||0))[0];
  return `
  <div class="hero"><h1>组局 · 和谁一起 👯</h1>
    <div class="big" style="font-size:24px">组局即推广<span class="gradtext">，人人皆造夜人</span></div>
    <div class="vibe">不向陌生人匹配，只协调你已有的关系</div>
  </div>

  <div class="glass">
    <div style="font-weight:800;font-size:15px;margin-bottom:6px">🤖 AI 夜晚管家</div>
    <div style="font-size:12px;color:var(--sub);margin-bottom:10px">说出口味+人数+区域，一键生成今晚路线</div>
    <div class="tags-wrap">
      <span class="pill on">深夜 Techno</span><span class="pill">4 人</span><span class="pill">外滩</span><span class="pill">微醺</span>
    </div>
    <div style="font-size:13px;line-height:1.9;background:rgba(168,85,247,.1);border-radius:10px;padding:12px;margin-top:8px">
      🍸 <b>21:00 预热</b> · ${esc(topMatch.name)}（${topMatch.match}% 对味）<br>
      🔊 <b>23:00 主场</b> · ${esc(ev.venue||'')} — ${esc(ev.title)}<br>
      🍜 <b>02:00 续摊</b> · 附近夜宵
    </div>
    <button class="btn" style="margin-top:12px" data-toast="路线已保存，可一键叫人">⚡ 生成今晚路线</button>
  </div>

  <div class="sec-title">👀 今晚谁有空 <span style="font-size:11px;color:var(--dim);font-weight:400">· 仅授权好友可见</span></div>
  <div class="glass" style="margin-top:0">
    ${friends.map(f=>`<div class="friend">
      <span class="av">${esc((f.nick||'?')[0])}</span>
      <div style="flex:1"><div style="font-weight:700">${esc(f.nick)}</div>
        <div style="font-size:12px;color:var(--sub)">${esc(f.status)}${f.spot?' · 📍'+esc(f.spot):''}</div></div>
      ${f.spot?'<span class="dot-on"></span>':'<span class="pill">叫TA</span>'}
    </div>`).join('')}
  </div>

  <div class="sec-title">🎉 发起一个局 · 成团解锁权益</div>
  <div class="glass" style="margin-top:0">
    <div style="font-weight:800">${esc(ev.title)}</div>
    <div style="font-size:12px;color:var(--neon-cyan);margin:5px 0">📍 ${esc(ev.venue||'')}</div>
    <div style="font-size:13px;color:var(--sub);margin-top:8px">成团进度 · 还差 <b style="color:#fff">2 人</b>解锁卡座升级</div>
    <div class="progress"><i style="width:66%"></i></div>
    <div class="tags-wrap">
      <span class="pill on">满2人 门票9折 ✓</span><span class="pill on">满4人 酒水券 ✓</span><span class="pill">满6人 卡座升级</span>
    </div>
    <button class="btn" style="margin-top:12px" data-toast="组局已发起，分享卡已生成">🔗 发起局并生成邀请海报</button>
    <div class="prov">被邀请人通过这个局完成真实成交 → 自动触发单层归因分佣（你的造夜人战绩 +1）</div>
  </div>
  <div style="height:20px"></div>`;
};

/* ================= PASSPORT (夜生活护照·我是谁) ================= */
routes.passport = ()=>{
  const u = D.seed.user;
  return `
  <div class="hero"><h1>夜生活护照 🪪</h1>
    <div class="vibe">你的身份 = 你听什么 + 你带过谁来</div>
  </div>
  <div class="persona-card">
    <div class="pl">🎵 你的夜晚音乐人格</div>
    <div class="pn gradtext">${esc(u.music_persona)}</div>
    <div style="font-size:11px;color:var(--dim)">${esc(u.persona_from)}</div>
    <div class="badge-grid">${u.badges.map(b=>`<span class="pill neon">${esc(b)}</span>`).join('')}</div>
  </div>
  <div class="stat-grid">
    <div class="stat-box"><div class="n gradtext">Lv.${u.level}</div><div class="l">${esc(u.level_name)}</div></div>
    <div class="stat-box"><div class="n">${u.stamps}</div><div class="l">场所集章</div></div>
    <div class="stat-box"><div class="n">${u.promoter.brought}</div><div class="l">带过的人</div></div>
  </div>

  <div class="sec-title">🗺 场所集章 · 夜行足迹</div>
  <div class="glass" style="margin-top:0">
    <div style="font-size:13px;color:var(--sub)">已集 ${u.stamps} / ${u.stamp_target} 章 · 集齐解锁年度足迹卡</div>
    <div class="progress"><i style="width:${(u.stamps/u.stamp_target*100).toFixed(0)}%"></i></div>
    <div class="row" style="padding:6px 0">${D.bars.slice(0,8).map(b=>
      `<span class="rank-thumb" style="background-image:url('${b.images[0]||''}');flex:0 0 52px;width:52px;height:52px"></span>`).join('')}</div>
  </div>

  <div class="sec-title">🏅 造夜人战绩</div>
  <div class="glass" style="margin-top:0">
    <div class="stat-grid" style="margin:0">
      <div class="stat-box"><div class="n">¥${u.promoter.gmv.toLocaleString()}</div><div class="l">带客成交额</div></div>
      <div class="stat-box"><div class="n gradtext">${esc(u.promoter.rank)}</div><div class="l">推广员等级</div></div>
      <div class="stat-box"><div class="n">#${u.promoter.rank_no}</div><div class="l">城市排名</div></div>
    </div>
    <button class="btn ghost" style="margin-top:12px" data-toast="炫耀海报已生成，可发朋友圈/小红书">📤 一键生成炫耀海报</button>
  </div>
  <div class="prov" style="margin:8px 16px">演示编排：机制真实，数字以真实活动价格 / 小红书爆款互动量做种子（illustrative）</div>
  <div style="height:20px"></div>`;
};

/* ================= ME (我的·社区+钱包) ================= */
routes.me = ()=>{
  const w = D.seed.wallet;
  return `
  <div class="hero"><h1>我的 🎧</h1></div>
  <div class="wallet">
    <div style="font-size:12px;color:var(--sub)">分佣钱包余额</div>
    <div class="bal">¥${w.balance.toFixed(2)}</div>
    <div style="font-size:12px;color:var(--sub);margin-top:6px">待结算 ¥${w.pending.toFixed(2)} · 累计提现 ¥${w.withdrawn.toFixed(2)}</div>
    <div style="display:flex;gap:10px;margin-top:12px">
      <button class="btn" data-toast="提现申请已提交">提现</button>
      <button class="btn ghost" data-toast="可兑换酒水券/门票/卡座升级">兑换权益</button>
    </div>
    <div class="prov">${esc(w.note)}</div>
  </div>

  <div class="sec-title">📖 夜生活攻略 · 社区</div>
  <div class="section" style="padding-top:0">${D.posts.map(noteCard).join('')}</div>
  <div style="height:20px"></div>`;
};
function noteCard(p){
  const m=p.metrics||{};
  return `<div class="note-card" data-note="${p.id}">
    <div class="ph" style="background-image:url('${p.images[0]||''}')"></div>
    <div class="bd"><div class="t">${esc(p.title)}</div>
      <div class="au">@${esc(p.author||'')} <span class="heart">♥ ${m.liked_count||0} · ⭐ ${m.collected_count||0}</span></div>
    </div></div>`;
}
/* note detail */
routes.note = (id)=>{
  const p = D.posts.find(x=>x.id===id)||D.posts[0];
  const m=p.metrics||{};
  return `
  <div class="dt-hero" style="height:300px">
    <button class="dt-back" data-back>‹</button>
    <img src="${p.images[0]||''}" loading="lazy"><div class="grad"></div>
  </div>
  <div class="dt-body">
    <div class="dt-title" style="font-size:19px">${esc(p.title)}</div>
    <div class="au" style="font-size:12px;color:var(--sub);margin:8px 0">@${esc(p.author||'')}</div>
    <div class="stat-grid" style="margin:12px 0">
      <div class="stat-box"><div class="n" style="font-size:18px">${m.liked_count||0}</div><div class="l">赞</div></div>
      <div class="stat-box"><div class="n" style="font-size:18px">${m.collected_count||0}</div><div class="l">收藏</div></div>
      <div class="stat-box"><div class="n" style="font-size:18px">${m.comment_count||0}</div><div class="l">评论</div></div>
      <div class="stat-box"><div class="n" style="font-size:18px">${m.share_count||0}</div><div class="l">分享</div></div>
    </div>
    <p style="font-size:13.5px;line-height:1.7;color:#cfcfdc;white-space:pre-wrap">${esc(p.content||'')}</p>
    <div class="sec-title" style="margin-left:0">💬 真实评论 · 用户在问什么</div>
    ${(p.comments||[]).slice(0,12).map(c=>`<div class="cmt"><div class="top">
      <span class="nick">${esc(c.nick||'用户')}</span><span class="ip">${esc(c.ip||'')}</span>
      <span class="like">♥ ${c.liked||0}</span></div>
      <div class="ct">${esc(c.content||'')}</div></div>`).join('')}
  </div>`;
};

/* ================= interaction binding ================= */
function bindView(name){
  // back
  const bk=$('[data-back]'); if(bk) bk.onclick=()=>history.back();
  // navigate to spot / event / note
  document.querySelectorAll('[data-spot]').forEach(el=>el.onclick=()=>go('#spot/'+el.dataset.spot));
  document.querySelectorAll('[data-event]').forEach(el=>el.onclick=()=>go('#event/'+el.dataset.event));
  document.querySelectorAll('[data-note]').forEach(el=>el.onclick=()=>go('#note/'+el.dataset.note));
  document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>go(el.dataset.go));
  // category filter -> home spotlist
  document.querySelectorAll('[data-cat]').forEach(el=>el.onclick=()=>{
    const cat=el.dataset.cat;
    document.querySelectorAll('[data-cat]').forEach(x=>x.classList.toggle('on',x===el));
    const list=$('#spotlist'); if(!list)return;
    const sub=D.bars.filter(b=>b.category===cat).sort((a,b)=>(b.match||0)-(a.match||0));
    list.innerHTML=sub.map(spotCard).join('')||'<div style="color:var(--dim);padding:20px">暂无</div>';
    list.querySelectorAll('[data-spot]').forEach(x=>x.onclick=()=>go('#spot/'+x.dataset.spot));
  });
  // toasts
  document.querySelectorAll('[data-toast]').forEach(el=>el.onclick=()=>toast(el.dataset.toast));
  const rm=$('#rematch'); if(rm) rm.onclick=()=>toast('已按你的口味重新匹配 ✓');
  // image slider (spot detail)
  const sl=$('[data-slider]');
  if(sl){const imgs=[...sl.querySelectorAll('img')];let i=0;
    if(imgs.length>1){setInterval(()=>{imgs[i].style.display='none';i=(i+1)%imgs.length;
      imgs[i].style.display='';document.querySelectorAll('.dt-dots i').forEach((d,k)=>d.classList.toggle('on',k===i));},2600);}}
}

/* boot */
render();
