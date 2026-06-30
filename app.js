/* ===== tonight · 上海夜乐园 demo ===== */
const D = window.DEMO_DATA;
const app = document.getElementById('app');
const BRAND = (D.meta && D.meta.brand) || 'tonight';
const GCOLOR = {Techno:'#5B3DF5',House:'#5B3DF5',Disco:'#FF4D6D',EDM:'#5B3DF5',
  HipHop:'#FF6B2C',Soul:'#FF4D6D',Jazz:'#0A0A0A',Pop:'#FF4D6D',Rock:'#FF6B2C',
  Folk:'#0A0A0A',Latin:'#FF6B2C',Live:'#0A0A0A'};
/* live vote state (mutable, seeded from real signals) */
const VOTES = Object.assign({}, D.votes||{});
const MYVOTED = {};

/* ---- helpers ---- */
const $ = (s,r=document)=>r.querySelector(s);
const esc = s => (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.className='show';
  clearTimeout(toast._t);toast._t=setTimeout(()=>t.className='',1800);}
function stars(r){return `<span class="star">★${r}</span>`;}
function genrePills(dna,max=2){return (dna||[]).slice(0,max).map(g=>
  `<span class="tg" style="border-color:${GCOLOR[g.genre]||'#0A0A0A'};color:${GCOLOR[g.genre]||'#0A0A0A'};padding:3px 8px;font-size:10px">${esc(g.cn)}</span>`).join('');}
function cover(b){return (b.images&&b.images[0])||'';}
function navTo(name){ // open phone navigation app with real address
  const q=encodeURIComponent((name||'')+' 上海');
  const url=`https://uri.amap.com/search?keyword=${q}`;
  window.open(url,'_blank');
  toast('正在唤起地图导航…');
}

/* ---- radar chart ---- */
function radar(dna,size=150){
  const cx=size/2,cy=size/2,R=size/2-22;const axes=dna.slice(0,5);const n=Math.max(axes.length,3);
  const maxv=Math.max(...axes.map(a=>a.pct),1);let grid='';
  for(let ring=1;ring<=3;ring++){const rr=R*ring/3;let p=[];
    for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;p.push((cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1));}
    grid+=`<polygon points="${p.join(' ')}" fill="none" stroke="rgba(255,255,255,.1)"/>`;}
  let axl='',dp=[];
  axes.forEach((a,i)=>{const ang=-Math.PI/2+i*2*Math.PI/n;const ax=cx+R*Math.cos(ang),ay=cy+R*Math.sin(ang);
    axl+=`<line x1="${cx}" y1="${cy}" x2="${ax.toFixed(1)}" y2="${ay.toFixed(1)}" stroke="rgba(255,255,255,.08)"/>`;
    const vr=R*(a.pct/maxv);dp.push((cx+vr*Math.cos(ang)).toFixed(1)+','+(cy+vr*Math.sin(ang)).toFixed(1));});
  return `<svg class="radar" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b14dff"/><stop offset="1" stop-color="#22e0ff"/></linearGradient></defs>
    ${grid}${axl}<polygon points="${dp.join(' ')}" fill="url(#rg)" fill-opacity=".45" stroke="url(#rg)" stroke-width="2"/></svg>`;
}

/* ---- router ---- */
const routes={};
function go(h){location.hash=h;}
function render(){
  const h=(location.hash||'#home').slice(1);const [name,arg]=h.split('/');
  const fn=routes[name]||routes.home;app.scrollTop=0;
  app.innerHTML=`<div class="view">${fn(arg)}</div>`;
  const tabFor={home:'home',spot:'home',event:'home',events:'home',note:'home',rank:'rank',crew:'crew',passport:'passport'}[name]||'home';
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.route===tabFor));
  bindView(name);
}
window.addEventListener('hashchange',render);
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>go('#'+t.dataset.route));

/* ===== park map zones (illustrated, no real basemap) ===== */
const ZONES=[
 {key:'外滩',name:'外滩·BUND',x:72,y:26,c:'#ff4d9d',regions:['外滩商圈','北外滩/外白渡桥','陆家嘴商圈','苏河湾','平凉路/东外滩']},
 {key:'静安',name:'静安·JING\'AN',x:40,y:30,c:'#b14dff',regions:['南京西路商圈','静安寺商圈','同乐坊/江宁路','曹家渡商圈','长寿路商圈','苏河湾']},
 {key:'徐汇',name:'徐汇·XUHUI',x:34,y:62,c:'#22e0ff',regions:['徐家汇商圈','衡山路/复兴西路','打浦桥/田子坊','龙华/西岸','肇嘉浜路/中山医院','淮海路','新天地/马当路']},
 {key:'浦东',name:'浦东·PUDONG',x:80,y:58,c:'#34f5b0',regions:['世纪大道','张江商圈','金桥商圈','洋泾商圈','花木','世纪公园/科技馆','源深体育中心','八佰伴','高行商圈','碧云社区']},
 {key:'五角场',name:'五角场·WUJIAO',x:64,y:14,c:'#ffd24d',regions:['五角场/大学路','虹口足球场/鲁迅公园','临平路/和平公园','虹口']},
 {key:'虹桥',name:'虹桥·HONGQIAO',x:14,y:48,c:'#ff7a6b',regions:['虹桥/古北','古北/仙霞新村','中山公园/江苏路','天山','娄山关路/威宁路','虹桥枢纽','虹桥火车站/国展中心','虹桥镇商圈','古北/仙霞新村']},
 {key:'近郊',name:'近郊·SUBURB',x:20,y:78,c:'#8b5cff',regions:[]}, // catch-all
];
function zoneFor(region){
  for(const z of ZONES){ if(z.regions.includes(region)) return z; }
  return ZONES[ZONES.length-1]; // 近郊 catch-all
}

/* ================= HOME (首页: 乐园地图 + 本周活动) ================= */
/* MAP_FILTER: cat=品类筛选, genre=音乐风格筛选 (可叠加) */
let MAP_FILTER={cat:'all',genre:'all'};
let WK_DAY='all';
const TODAY='2026-06-30';
function barGenres(b){return (b.dna||[]).map(g=>g.genre);}
function allGenres(){
  const c={};D.bars.forEach(b=>(b.dna||[]).forEach(g=>{c[g.genre]=(c[g.genre]||0)+1;}));
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([g])=>g);
}
const GENRE_CN={Techno:'Techno',House:'House',Disco:'Disco',EDM:'电子',HipHop:'嘻哈',Soul:'Soul/R&B',Jazz:'爵士',Pop:'流行',Rock:'摇滚',Folk:'民谣',Latin:'拉丁',Live:'现场'};
function filteredBars(){
  return D.bars.filter(b=>{
    if(MAP_FILTER.cat!=='all' && b.category!==MAP_FILTER.cat) return false;
    if(MAP_FILTER.genre!=='all' && !barGenres(b).includes(MAP_FILTER.genre)) return false;
    return true;
  });
}
routes.home=()=>{
  const cats=[...new Set(D.bars.map(b=>b.category))];
  const genres=allGenres();
  const fb=filteredBars();
  // week events grouped by day tab
  const upcoming=[...D.events].filter(e=>(e.start||'')>=TODAY).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
  const wk = WK_DAY==='all' ? upcoming.slice(0,10) : upcoming.filter(e=>(e.start||'').slice(0,10)===WK_DAY);
  const dayTabs=weekDayTabs(upcoming);
  return `
  <div class="cover">
    <div class="kicker">Shanghai / After Dark</div>
    <div class="mast">TO<br>NIGHT</div>
    <div class="sub">${esc(D.meta.tagline)}</div>
    <div class="meta">
      <div><b>${D.meta.bars_count}</b><span>Venues</span></div>
      <div><b>${D.meta.events_count}</b><span>Events</span></div>
      <div><b>${(Object.values(VOTES).reduce((a,b)=>a+b,0)/1000).toFixed(1)}K</b><span>Votes</span></div>
    </div>
  </div>

  <div class="entries">
    <div class="entry e-map" data-scroll="map"><div class="no">01</div>
      <div class="et">MAP</div><div class="es">${D.meta.bars_count} 家 · 按音乐风格找店</div><div class="arr">→</div></div>
    <div class="entry e-ev" data-go="#events"><div class="no">02</div>
      <div class="et">EVENTS</div><div class="es">${D.meta.events_count} 场 · 按日期浏览</div><div class="arr">→</div></div>
  </div>

  <div class="slabel" id="map-sec"><div class="st">THE MAP</div><div class="sm" data-go="#rank">榜单 →</div></div>
  <div class="hscroll">
    <span class="chip ${MAP_FILTER.cat==='all'?'on':''}" data-mfc="all">全部</span>
    ${cats.map(c=>`<span class="chip ${MAP_FILTER.cat===c?'on':''}" data-mfc="${esc(c)}">${esc(c)}</span>`).join('')}
  </div>
  <div class="hscroll">
    <span class="chip c-acc ${MAP_FILTER.genre==='all'?'on':''}" data-mfg="all">全部风格</span>
    ${genres.map(g=>`<span class="chip c-acc ${MAP_FILTER.genre===g?'on':''}" data-mfg="${g}">${esc(GENRE_CN[g]||g)}</span>`).join('')}
  </div>
  <div class="mapwrap"><div class="parkmap" id="parkmap">
    ${ZONES.map(z=>`<div class="zone" style="left:${z.x}%;top:${z.y-10}%;transform:translateX(-50%)">${esc(z.name.split('·')[1]||z.name)}</div>`).join('')}
    <div class="maptip" id="maptip"></div>
  </div></div>
  <div class="mapcount">${fb.length} 家显示中 · 点位查看详情 · 一键导航</div>

  <div class="slabel"><div class="st">THIS WEEK</div><div class="sm" data-go="#events">全部 →</div></div>
  <div class="hscroll">${dayTabs}</div>
  <div class="hscroll" id="wkrow" style="gap:14px">${wk.length?wk.map(wkCard).join(''):'<div style="color:var(--grey);padding:14px;font-size:13px">这天暂无活动</div>'}</div>
  <div style="height:24px"></div>`;
};
function weekDayTabs(upcoming){
  const days=[...new Set(upcoming.map(e=>(e.start||'').slice(0,10)))].slice(0,6);
  let tabs=`<span class="chip ${WK_DAY==='all'?'on':''}" data-wd="all">全部</span>`;
  tabs+=days.map(d=>`<span class="chip ${WK_DAY===d?'on':''}" data-wd="${d}">${dayLabel(d)}</span>`).join('');
  return tabs;
}
function dayLabel(start){
  const map={'2026-06-30':'今晚','2026-07-01':'明天','2026-07-02':'周四','2026-07-03':'周五','2026-07-04':'周六','2026-07-05':'周日'};
  return map[start]|| (start? start.slice(5).replace('-','/'):'近期');
}
function wkCard(e){
  return `<div class="ev-card" data-event="${e.id}">
    <div class="ph" style="background-image:url('${(e.images&&e.images[0])||''}')">
      <span class="day">${dayLabel((e.start||'').slice(0,10))}</span></div>
    <div class="t">${esc(e.title)}</div>
    <div class="v">${esc(e.venue||'')}</div></div>`;
}

/* ================= RANK (实时投票榜 + 评价) ================= */
routes.rank=()=>{
  // LAGOM hard-locked #1, rest by votes desc
  const rest=D.bars.filter(b=>b.id!=='lagom').sort((a,b)=>(VOTES[b.id]||0)-(VOTES[a.id]||0));
  const lagom=D.bars.find(b=>b.id==='lagom');
  const ranked=lagom?[lagom,...rest]:rest;
  const totalVotes=Object.values(VOTES).reduce((a,b)=>a+b,0);
  return `
  <div class="cal-hero">
    <div class="kicker" style="color:#888">Live Ranking</div>
    <div class="display" style="font-size:46px;margin-top:8px">今夜<br>谁最 IN</div>
    <div class="sub">玩家真实投票 · 一店一票 · 商家不可买位</div>
    <div class="sub" style="color:var(--lime);margin-top:10px">${totalVotes.toLocaleString()} 票 · 实时</div>
  </div>
  <div class="lb" id="lb">${ranked.map((b,i)=>lbItem(b,i)).join('')}</div>
  <div style="height:22px"></div>`;
};
function lbItem(b,i){
  return `<div class="lb-item ${i===0?'first':''}" data-lb="${b.id}">
    <span class="lb-no">${String(i+1).padStart(2,'0')}</span>
    <span class="lb-thumb" style="background-image:url('${cover(b)}')" data-spot="${b.id}"></span>
    <div class="lb-mid" data-spot="${b.id}">
      <div class="lb-nm">${esc(b.name)}</div>
      <div class="lb-sub">${stars(b.rating)} · ${esc(b.region)}</div>
    </div>
    <div style="text-align:center">
      <button class="lb-vbtn" data-vote="${b.id}">${MYVOTED[b.id]?'已投':'投票'}</button>
      <div class="lb-vcount" id="vc-${b.id}">${(VOTES[b.id]||0).toLocaleString()}</div>
    </div></div>`;
}

/* ================= SPOT DETAIL ================= */
routes.spot=(id)=>{
  const b=D.bars.find(x=>x.id===id)||D.bars[0];
  const imgs=(b.images&&b.images.length)?b.images:[];
  const hasImg=imgs.length>0;
  const scoreEntries=Object.entries(b.scores||{});
  const nlp=b.real_data?(b.nlp||[]):[];
  const pos=nlp.filter(t=>t.affection===1).slice(0,8);
  const neg=nlp.filter(t=>t.affection===-1);
  const galleryImgs = b.real_data ? imgs.slice(1,9) : [];
  return `
  <div class="dt-hero ${hasImg?'':'noimg'}">
    <button class="dt-back" data-back>‹</button>
    ${hasImg?`<img src="${imgs[0]}" loading="lazy">`:''}
    <div class="grad"></div>
  </div>
  <div class="dt-body">
    <div class="dt-title">${esc(b.name)}</div>
    <div class="dt-sub">${stars(b.rating)} <span>${esc(b.category)}</span> <span>${esc(b.region)}</span>
      ${b.real_data?'<span class="flag real">真实档案 · '+(b.review_count||0)+' 条点评</span>':'<span class="flag">数据采集中</span>'}</div>

    <div class="card-box">
      <div class="block-h">音乐 DNA <span class="flag ai">AI 推测</span></div>
      <div class="radar-wrap">${radar(b.dna)}
        <div class="dna-legend">${b.dna.map(g=>`<div class="lg"><span class="sw" style="background:${GCOLOR[g.genre]||'#888'}"></span>${esc(g.cn)} <b style="margin-left:auto">${g.pct}%</b></div>`).join('')}</div>
      </div>
      ${b.bpm?`<span class="bpm">主打 ${b.bpm.driver} · ${b.bpm.low}–${b.bpm.high} BPM</span>`:''}
      <div class="prov">${esc(b.dna_evidence||'AI 智能推测')}</div>
    </div>

    <div class="block"><div class="block-h">评分</div>
    <div class="scorebars">${scoreEntries.map(([k,v])=>`<div class="sbar"><span class="lab">${esc(k)}</span>
      <span class="track"><span class="fill" style="width:${(v/5*100).toFixed(0)}%"></span></span><span class="val">${v}</span></div>`).join('')}</div></div>

    ${galleryImgs.length?`<div class="block"><div class="block-h">实拍 <span class="flag real">真实点评图</span></div>
      <div class="gallery">${galleryImgs.map(p=>`<div class="gph" style="background-image:url('${p}')"></div>`).join('')}</div></div>`:''}

    ${b.real_data?`
    <div class="block"><div class="block-h">氛围标签 <span class="flag real">点击看评价</span></div>
    <div class="tags-wrap">
      ${pos.map((t,i)=>`<span class="tg ${i===0?'on':''}" data-tag="${esc(t.name)}">${esc(t.name)} ${t.num}</span>`).join('')}
      ${neg.map(t=>`<span class="tg neg" data-tag="${esc(t.name)}">${esc(t.name)} ${t.num}</span>`).join('')}
    </div>
    <div id="tag-reviews">${tagReviewsHtml(pos[0]?pos[0].name:'')}</div></div>`:`
    <div class="pending">
      <div class="tx">该店口碑数据采集中</div>
      <div class="sx">基础信息（店名 / 评分 / 品类 / 营业）已是大众点评真实数据<br>评论与氛围标签将在爬虫补充采集后更新</div>
    </div>`}

    <div class="kv"><b>营业</b> ${esc((b.hours||[])[0]||'采集中')}</div>
    <div class="kv"><b>地址</b> ${esc(b.address||b.region||'')}</div>

    <div class="block"><div class="block-h">玩家评价 ${b.real_data?'<span class="flag real">真实点评</span>':'<span class="flag">示例</span>'}</div>
    <div class="review-input"><input id="rv-in" placeholder="说说你在这儿的夜晚…"><button data-review="${b.id}">发布</button></div>
    <div id="rv-list">${(b.real_data?(b.reviews||[]).slice(0,6).map(reviewCard):[]).join('')}</div></div>
  </div>
  <div class="cta-bar">
    <button class="btn ghost" data-nav="${esc(b.name)}">导航</button>
    <button class="btn warm" data-go="#crew">叫人一起去</button>
  </div>`;
};
function cmtCard(c){return `<div class="cmt"><div class="top"><span class="nick">${esc(c.nick||'玩家')}</span>
  <span class="ip">${esc(c.ip||'')}</span><span class="like">♥ ${c.liked||0}</span></div>
  <div class="ct">${esc(c.content||'')}</div></div>`;}
/* real LAGOM review card with star + body + pic thumbnails */
function reviewCard(r){
  const st='★'.repeat(r.star||5)+'☆'.repeat(Math.max(0,5-(r.star||5)));
  const pics=(r.pics||[]).slice(0,3).map(p=>`<span class="rv-pic" style="background-image:url('${p}')"></span>`).join('');
  return `<div class="cmt"><div class="top"><span class="nick">${esc(r.user||'点评用户')}</span>
    <span class="star" style="font-size:11px">${st}</span><span class="like">${esc(r.time||'')}</span></div>
    <div class="ct">${esc(r.body||'')}</div>
    ${pics?`<div class="rv-pics">${pics}</div>`:''}</div>`;
}
/* tag -> linked real reviews (from b.nlp[].matched_reviews) */
function tagReviewsHtml(tagName){
  const b=D.bars.find(x=>x.id==='lagom');
  if(!b||!tagName) return '';
  const t=(b.nlp||[]).find(x=>x.name===tagName);
  const list=(t&&t.matched_reviews)||[];
  if(!list.length) return `<div class="prov" style="margin:6px 0">「${esc(tagName)}」相关评价采集中</div>`;
  return `<div class="tagrv"><div class="tagrv-h">提到「${esc(tagName)}」的真实评价 · ${list.length} 条</div>
    ${list.map(reviewCard).join('')}</div>`;
}

/* ================= EVENTS CALENDAR (全部活动, 按日期分组) ================= */
routes.events=()=>{
  const all=[...D.events].sort((a,b)=>(a.start||'').localeCompare(b.start||''));
  // group by date
  const groups={};
  all.forEach(e=>{const d=(e.start||'').slice(0,10)||'近期';(groups[d]=groups[d]||[]).push(e);});
  const dates=Object.keys(groups).sort().reverse();
  return `
  <div class="cal-hero"><button class="dt-back" data-back>‹</button>
    <div class="kicker">Calendar</div>
    <div class="h1" style="margin-top:8px">活动日历</div>
    <div class="sub">${D.meta.events_count} 场 · 最新优先</div></div>
  <div style="padding:0 0 110px">
    ${dates.map(d=>`
      <div class="datehead">${dayLabel(d)} <span class="cnt">${d!=='近期'?d:''} · ${groups[d].length} 场</span></div>
      <div class="cardlist">${groups[d].map(evRow).join('')}</div>`).join('')}
  </div>`;
};
function evRow(e){
  return `<div class="spot" data-event="${e.id}" style="height:170px;background-image:url('${(e.images&&e.images[0])||''}')">
    <div class="ov"><div class="nm" style="font-size:18px">${esc(e.title)}</div>
      <div class="meta"><span>${esc(e.venue||'')}</span>${e.start_time?`<span>${esc(e.start_time.slice(11,16))}</span>`:''} ${genrePills(e.dna,1)}</div></div></div>`;
}

/* ================= EVENT DETAIL ================= */
routes.event=(id)=>{
  const e=D.events.find(x=>x.id===id)||D.events[0];
  const imgs=(e.images&&e.images.length)?e.images:[];
  return `
  <div class="dt-hero ${imgs.length?'':'noimg'}"><button class="dt-back" data-back>‹</button>
    ${imgs.length?`<img src="${imgs[0]}" loading="lazy">`:''}<div class="grad"></div></div>
  <div class="dt-body">
    <div class="dt-title">${esc(e.title)}</div>
    ${e.title_en?`<div class="dt-en">${esc(e.title_en)}</div>`:''}
    <div class="dt-sub">${esc(e.venue||'')}</div>
    <div class="tags-wrap">${(e.tags||[]).map(t=>`<span class="tg">${esc(t)}</span>`).join('')}</div>
    ${e.dna&&e.dna.length?`<div class="card-box"><div class="block-h">现场曲风预告 <span class="flag ai">AI 推测</span></div>
      <div class="tags-wrap">${e.dna.map(g=>`<span class="tg" style="border-color:${GCOLOR[g.genre]||'#444'};color:${GCOLOR[g.genre]||'#ccc'}">${esc(g.cn)} ${g.pct}%</span>`).join('')}</div></div>`:''}
    <div class="kv"><b>时间</b> ${esc(e.date_text||'')}${e.start_time?' · '+esc(e.start_time.slice(11,16)):''}</div>
    <div class="kv"><b>票价</b> ${esc(e.price||'免费 / 现场购票')}</div>
    <div class="kv"><b>地址</b> ${esc(e.address||'')}</div>
    <div class="block"><div class="block-h">活动详情</div>
    <p style="font-size:13.5px;line-height:1.8;color:#cfcbdb">${esc(e.desc||'')}</p></div>
  </div>
  <div class="cta-bar">
    <button class="btn ghost" data-nav="${esc(e.venue||e.title)}">导航</button>
    <button class="btn warm" data-toast="已报名，电子票在「我的」">报名 / 购票</button>
  </div>`;
};

/* ================= CREW (组局) ================= */
routes.crew=()=>{
  const f=D.seed.friends_online;const ev=D.events[0];
  const top=[...D.bars].sort((a,b)=>(VOTES[b.id]||0)-(VOTES[a.id]||0))[0];
  return `
  <div class="cal-hero"><div class="kicker">Crew</div>
    <div class="h1" style="margin-top:8px">和谁一起</div>
    <div class="sub">组局即推广 · 只协调你已有的关系，不向陌生人匹配</div></div>
  <div class="card-box" style="margin:14px 20px">
    <div class="block-h">AI 夜晚管家</div>
    <div style="font-size:12px;color:var(--sub);margin-bottom:10px">说出口味 + 人数 + 区域，一键生成今晚路线</div>
    <div class="tags-wrap"><span class="tg on">深夜 Techno</span><span class="tg">4 人</span><span class="tg">外滩</span></div>
    <div style="font-size:13px;line-height:2;background:var(--card2);border-radius:14px;padding:14px;margin-top:10px">
      <b>21:00 预热</b> · ${esc(top.name)}<br><b>23:00 主场</b> · ${esc(ev.venue||'')} — ${esc(ev.title)}<br><b>02:00 续摊</b> · 附近夜宵</div>
    <button class="btn warm" style="margin-top:14px" data-toast="路线已保存，可一键叫人">生成今晚路线</button></div>
  <div class="slabel"><div class="st">今晚谁有空</div></div>
  <div class="card-box" style="margin:0 20px">${f.map(x=>`<div class="friend"><span class="av">${esc((x.nick||'?')[0])}</span>
    <div style="flex:1"><div style="font-weight:700">${esc(x.nick)}</div>
    <div style="font-size:12px;color:var(--sub)">${esc(x.status)}${x.spot?' · '+esc(x.spot):''}</div></div>
    ${x.spot?'<span class="dot-on"></span>':'<span class="chip">叫TA</span>'}</div>`).join('')}</div>
  <div class="slabel"><div class="st">发起局</div></div>
  <div class="card-box" style="margin:0 20px">
    <div style="font-weight:800;font-size:15px">${esc(ev.title)}</div>
    <div style="font-size:12px;color:var(--neon);margin:6px 0">${esc(ev.venue||'')}</div>
    <div style="font-size:13px;color:var(--sub);margin-top:8px">成团进度 · 还差 <b style="color:#fff">2 人</b>解锁卡座升级</div>
    <div class="progress"><i style="width:66%"></i></div>
    <div class="tags-wrap"><span class="tg on">满2人 门票9折</span><span class="tg on">满4人 酒水券</span><span class="tg">满6人 卡座升级</span></div>
    <button class="btn" style="margin-top:14px" data-toast="组局已发起，分享卡已生成">发起局 · 生成邀请海报</button>
    <div class="prov">被邀请人真实成交 → 自动触发单层归因分佣（造夜人战绩 +1）</div></div>
  <div style="height:110px"></div>`;
};

/* ================= PASSPORT (护照 + 钱包) ================= */
routes.passport=()=>{
  const u=D.seed.user;const w=D.seed.wallet;
  return `
  <div class="cal-hero"><div class="kicker">Passport</div>
    <div class="h1" style="margin-top:8px">我是谁</div>
    <div class="sub">你的身份 = 你听什么 + 你带过谁来</div></div>
  <div class="persona"><div class="pl">你的夜晚音乐人格</div>
    <div class="pn">${esc(u.music_persona)}</div>
    <div style="font-size:11px;color:var(--sub)">${esc(u.persona_from)}</div>
    <div class="badge-grid">${u.badges.map(b=>`<span class="badge">${esc(b)}</span>`).join('')}</div></div>
  <div class="stat-grid">
    <div class="stat-box"><div class="n" style="color:var(--neon)">Lv.${u.level}</div><div class="l">${esc(u.level_name)}</div></div>
    <div class="stat-box"><div class="n">${u.stamps}</div><div class="l">集章</div></div>
    <div class="stat-box"><div class="n">${u.promoter.brought}</div><div class="l">带过的人</div></div></div>
  <div class="wallet"><div style="font-size:12px;opacity:.7">分佣钱包余额</div>
    <div class="bal">¥${w.balance.toFixed(2)}</div>
    <div style="font-size:12px;opacity:.7;margin-top:6px">待结算 ¥${w.pending.toFixed(2)} · 累计提现 ¥${w.withdrawn.toFixed(2)}</div>
    <div style="display:flex;gap:10px;margin-top:14px"><button class="btn" style="background:#0b0b0f;color:var(--neon)" data-toast="提现申请已提交">提现</button>
      <button class="btn" style="background:rgba(0,0,0,.15);color:#0b0b0f" data-toast="可兑换酒水券/门票/卡座">兑换权益</button></div></div>
  <div class="slabel"><div class="st">夜行足迹</div></div>
  <div class="card-box" style="margin:0 20px"><div style="font-size:13px;color:var(--sub)">已集 ${u.stamps}/${u.stamp_target} 章 · 集齐解锁年度足迹卡</div>
    <div class="progress"><i style="width:${(u.stamps/u.stamp_target*100).toFixed(0)}%"></i></div>
    <div class="hscroll" style="padding:6px 0">${D.bars.slice(0,8).map(b=>`<span class="lb-thumb" style="background-image:url('${cover(b)}');flex:0 0 50px;width:50px;height:50px"></span>`).join('')}</div></div>
  <div class="slabel"><div class="st">攻略社区</div></div>
  <div class="pad">${D.posts.map(noteCard).join('')}</div>
  <div class="prov" style="margin:4px 20px">护照战绩为演示编排：机制真实，数字以真实活动价格 / 小红书互动量做种子</div>
  <div style="height:110px"></div>`;
};
function noteCard(p){const m=p.metrics||{};return `<div class="note-card" data-note="${p.id}">
  <div class="ph" style="background-image:url('${(p.images&&p.images[0])||''}')"></div>
  <div class="bd"><div class="t">${esc(p.title)}</div>
  <div class="au">@${esc(p.author||'')} <span class="heart">♥ ${m.liked_count||0} · ⭐ ${m.collected_count||0}</span></div></div></div>`;}

/* ================= NOTE DETAIL ================= */
routes.note=(id)=>{
  const p=D.posts.find(x=>x.id===id)||D.posts[0];const m=p.metrics||{};
  return `<div class="dt-hero" style="height:300px"><button class="dt-back" data-back>‹</button>
    <img src="${(p.images&&p.images[0])||''}" loading="lazy"><div class="grad"></div></div>
  <div class="dt-body"><div class="dt-title" style="font-size:19px">${esc(p.title)}</div>
    <div style="font-size:12px;color:var(--sub);margin:8px 0">@${esc(p.author||'')}</div>
    <div class="stat-grid" style="margin:12px 0">
      <div class="stat-box"><div class="n" style="font-size:17px">${m.liked_count||0}</div><div class="l">赞</div></div>
      <div class="stat-box"><div class="n" style="font-size:17px">${m.collected_count||0}</div><div class="l">收藏</div></div>
      <div class="stat-box"><div class="n" style="font-size:17px">${m.comment_count||0}</div><div class="l">评论</div></div>
      <div class="stat-box"><div class="n" style="font-size:17px">${m.share_count||0}</div><div class="l">分享</div></div></div>
    <p style="font-size:13.5px;line-height:1.75;color:#d4d0e6;white-space:pre-wrap">${esc(p.content||'')}</p>
    <div class="block-h" style="margin:16px 0 8px">真实评论 · 用户在问什么</div>
    ${(p.comments||[]).slice(0,12).map(cmtCard).join('')}</div>`;
};

/* ================= binding ================= */
function bindView(name){
  const bk=$('[data-back]'); if(bk) bk.onclick=()=>history.back();
  document.querySelectorAll('[data-spot]').forEach(el=>el.onclick=()=>go('#spot/'+el.dataset.spot));
  document.querySelectorAll('[data-event]').forEach(el=>el.onclick=()=>go('#event/'+el.dataset.event));
  document.querySelectorAll('[data-note]').forEach(el=>el.onclick=()=>go('#note/'+el.dataset.note));
  document.querySelectorAll('[data-go]').forEach(el=>el.onclick=()=>go(el.dataset.go));
  document.querySelectorAll('[data-toast]').forEach(el=>el.onclick=(e)=>{e.stopPropagation();toast(el.dataset.toast);});
  document.querySelectorAll('[data-nav]').forEach(el=>el.onclick=(e)=>{e.stopPropagation();navTo(el.dataset.nav);});
  // map filters (category + genre, stackable) — re-render only dots+filters
  document.querySelectorAll('[data-mfc]').forEach(el=>el.onclick=()=>{MAP_FILTER.cat=el.dataset.mfc;render();});
  document.querySelectorAll('[data-mfg]').forEach(el=>el.onclick=()=>{MAP_FILTER.genre=el.dataset.mfg;render();});
  // week day tabs
  document.querySelectorAll('[data-wd]').forEach(el=>el.onclick=()=>{WK_DAY=el.dataset.wd;render();});
  // clickable atmosphere tag -> scroll to linked reviews
  document.querySelectorAll('[data-tag]').forEach(el=>el.onclick=()=>{
    const name=el.dataset.tag;
    document.querySelectorAll('[data-tag]').forEach(x=>x.classList.toggle('on',x===el));
    const box=$('#tag-reviews'); if(box){box.innerHTML=tagReviewsHtml(name);box.scrollIntoView({behavior:'smooth',block:'center'});}
  });
  // voting
  document.querySelectorAll('[data-vote]').forEach(el=>el.onclick=(e)=>{
    e.stopPropagation();const id=el.dataset.vote;
    if(MYVOTED[id]){toast('一店一票，今日已投');return;}
    MYVOTED[id]=true;VOTES[id]=(VOTES[id]||0)+1;
    toast('投票成功 +1，榜单已更新');setTimeout(render,400);
  });
  // review publish
  const rb=$('[data-review]'); if(rb) rb.onclick=()=>{
    const inp=$('#rv-in');const v=(inp.value||'').trim();if(!v){toast('写点什么再发布~');return;}
    const html=cmtCard({nick:'我',ip:'上海',liked:0,content:v});
    $('#rv-list').insertAdjacentHTML('afterbegin',html);inp.value='';toast('评价已发布 ✓');
  };
  // park map dots
  if(name==='home'){renderDots();}
}
function renderDots(){
  const pm=$('#parkmap'); if(!pm) return;
  const tip=$('#maptip');
  let list=filteredBars();
  // remove old dots
  pm.querySelectorAll('.dot').forEach(d=>d.remove());
  list.forEach(b=>{
    const z=zoneFor(b.region);
    // hash offset within zone
    let h=0;for(const ch of (b.id||b.name))h=(h*31+ch.charCodeAt(0))>>>0;
    const ox=((h%100)/100-0.5)*22, oy=(((h>>7)%100)/100-0.5)*20;
    const x=Math.max(4,Math.min(96,z.x+ox)), y=Math.max(8,Math.min(92,z.y+oy));
    const dot=document.createElement('div');
    dot.className='dot'+(b.real_data?' lagom':'');
    if(!b.real_data){dot.style.background=z.c;dot.style.color=z.c;}
    dot.style.left=x+'%';dot.style.top=y+'%';
    dot.onclick=()=>{
      pm.querySelectorAll('.dot').forEach(d=>d.classList.remove('act'));dot.classList.add('act');
      tip.innerHTML=`<span class="mt-ph" style="background-image:url('${cover(b)}')"></span>
        <div style="flex:1;min-width:0"><div class="mt-nm">${esc(b.name)} ${b.real_data?'<span class="flag real">真实</span>':''}</div>
        <div class="mt-meta">${stars(b.rating)} · ${esc(b.category)} · ${esc(b.region)}</div></div>
        <span class="mt-go" data-spot="${b.id}">›</span>`;
      tip.classList.add('show');
      tip.querySelector('[data-spot]').onclick=()=>go('#spot/'+b.id);
    };
    pm.appendChild(dot);
  });
}
render();
