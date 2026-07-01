/* ===== tonight · 上海夜乐园 demo ===== */
const D = window.DEMO_DATA;
const app = document.getElementById('app');
const BRAND = (D.meta && D.meta.brand) || 'tonight';
const GCOLOR = {Techno:'#5B3DF5',House:'#5B3DF5',Disco:'#FF4D6D',EDM:'#5B3DF5',
  HipHop:'#FF6B2C',Soul:'#FF4D6D',Jazz:'#0A0A0A',Pop:'#FF4D6D',Rock:'#FF6B2C',
  Folk:'#0A0A0A',Latin:'#FF6B2C',Live:'#0A0A0A'};
/* inline line-icons (no emoji) */
const IC={
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};
/* live vote state (mutable, seeded from real signals) */
const VOTES = Object.assign({}, D.votes||{});
const MYVOTED = {};

/* ---- user session: persona (from quiz) + current location ---- */
const PROFILES={ // 商圈中心点(GCJ-02真实坐标) — 可切换的模拟定位
  '静安寺商圈':[31.2245,121.4450],'外滩商圈':[31.2390,121.4900],
  '徐家汇商圈':[31.1940,121.4370],'五角场/大学路':[31.3036,121.5140],
  '新天地/马当路':[31.2200,121.4750],'陆家嘴商圈':[31.2370,121.5050]};
const USER={
  done:false,                 // 是否完成今夜人格问卷
  persona:null,               // {label, genre, social, energy, budget}
  loc:'静安寺商圈',           // 当前位置(默认静安寺)
  ll:[31.2245,121.4450],
};
try{const s=JSON.parse(localStorage.getItem('tonight_user')||'null');if(s)Object.assign(USER,s);}catch(e){}
function saveUser(){try{localStorage.setItem('tonight_user',JSON.stringify(USER));}catch(e){}}
function setLoc(name){USER.loc=name;USER.ll=PROFILES[name]||USER.ll;saveUser();}
/* Haversine — 真实距离(km) */
function distKm(ll){
  if(!ll||!USER.ll) return null;
  const R=6371,[la1,lo1]=USER.ll,[la2,lo2]=ll;
  const dLa=(la2-la1)*Math.PI/180,dLo=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dLa/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLo/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function distLabel(b){const d=distKm(b.ll);if(d==null)return'';
  if(d<1)return Math.round(d*1000)+'m · 步行'+Math.max(1,Math.round(d*1000/75))+'分钟';
  return d.toFixed(1)+'km';}
function byNearest(list){return [...list].sort((a,b)=>(distKm(a.ll)??999)-(distKm(b.ll)??999));}
/* persona-aware match: blend music-match + social fit */
function personaScore(b){
  let s=b.match||50;
  if(USER.persona){
    const g=USER.persona.genre;
    if(g&&(b.dna||[]).some(x=>x.genre===g)) s+=25;
  }
  return Math.min(99,s);
}

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
  let h=(location.hash||'#home').slice(1);let [name,arg]=h.split('/');
  // 问卷为可选入口(不强制拦截开屏 — 投资人/新用户可直接进首页)
  const fn=routes[name]||routes.home;app.scrollTop=0;
  app.innerHTML=`<div class="view">${fn(arg)}</div>`;
  const tabFor={home:'home',spot:'home',map:'home',rank:'home',quiz:'home',event:'events',events:'events',note:'events',scene:'events',crew:'crew',passport:'passport'}[name]||'home';
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
/* MAP_FILTER: cat=品类, genre=曲风, feat=特色(可叠加) */
let MAP_FILTER={cat:'all',genre:'all',feat:'all'};
let WK_DAY='all';
/* 每日心情(轻量 2-3 题·结合人格给更准推荐) */
const MOODQ=[
  {k:'energy',q:'今晚的能量？',opts:[
    {v:'high',t:'炸场',feat:'live'},{v:'low',t:'微醺放空',feat:'quiet'}]},
  {k:'scene',q:'和谁？',opts:[
    {v:'meet',t:'想认识人',feat:'female'},{v:'crew',t:'和朋友',feat:'live'},{v:'solo',t:'想独处',feat:'quiet'}]},
  {k:'want',q:'此刻想要？',opts:[
    {v:'floor',t:'舞池蹦迪',feat:'live'},{v:'terrace',t:'露台聊天',feat:'terrace'},
    {v:'live',t:'现场音乐',feat:'live'},{v:'calm',t:'安静喝一杯',feat:'quiet'}]},
];
let MOOD={}; // {energy,scene,want} 今晚(可选)
try{const m=JSON.parse(localStorage.getItem('tonight_mood')||'null');if(m)MOOD=m;}catch(e){}
function saveMood(){try{localStorage.setItem('tonight_mood',JSON.stringify(MOOD));}catch(e){}}
function moodFeats(){ // 当前心情命中的特色集合
  const s=new Set();
  MOODQ.forEach(q=>{const a=MOOD[q.k];if(a){const o=q.opts.find(x=>x.v===a);if(o&&o.feat)s.add(o.feat);}});
  return [...s];
}
function moodAnswered(){return MOODQ.some(q=>MOOD[q.k]);}
function moodLabel(){return MOODQ.map(q=>{const a=MOOD[q.k];const o=a&&q.opts.find(x=>x.v===a);return o?o.t:null;}).filter(Boolean).join(' · ');}
/* ---- mood popup (reusable modal) ---- */
function openMood(){
  const wrap=document.getElementById('modal');
  wrap.innerHTML=`
  <div class="sheet">
    <div class="sheet-grip"></div>
    <div class="sheet-h">今晚想怎样<span class="sheet-sub">结合你的人格，给更准的推荐</span></div>
    ${MOODQ.map(q=>`<div class="msheet-row"><div class="msheet-q">${esc(q.q)}</div>
      <div class="msheet-chips">${q.opts.map(o=>`<span class="chip ${MOOD[q.k]===o.v?'on':''}" data-msk="${q.k}" data-msv="${o.v}">${esc(o.t)}</span>`).join('')}</div></div>`).join('')}
    <button class="btn warm" id="mood-apply">应用到今夜推荐</button>
    <div class="quiz-skip" id="mood-close">跳过</div>
  </div>`;
  wrap.className='show';
  wrap.querySelectorAll('[data-msk]').forEach(el=>el.onclick=()=>{
    const k=el.dataset.msk;MOOD[k]=(MOOD[k]===el.dataset.msv)?undefined:el.dataset.msv;
    wrap.querySelectorAll(`[data-msk="${k}"]`).forEach(x=>x.classList.toggle('on',x===el&&MOOD[k]===el.dataset.msv));
  });
  wrap.querySelector('#mood-apply').onclick=()=>{saveMood();closeModal();render();if(moodAnswered())toast('已按今晚心情调整推荐');};
  wrap.querySelector('#mood-close').onclick=()=>closeModal();
}
function closeModal(){const w=document.getElementById('modal');if(w){w.className='';w.innerHTML='';}}
const TODAY='2026-06-30';
function barGenres(b){return (b.dna||[]).map(g=>g.genre);}
function allGenres(){
  const c={};D.bars.forEach(b=>(b.dna||[]).forEach(g=>{c[g.genre]=(c[g.genre]||0)+1;}));
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([g])=>g);
}
const GENRE_CN={Techno:'Techno',House:'House',Disco:'Disco',EDM:'电子',HipHop:'嘻哈',Soul:'Soul/R&B',Jazz:'爵士',Pop:'流行',Rock:'摇滚',Folk:'民谣',Latin:'拉丁',Live:'现场'};
/* 特色标签(从真实点评分析得出;冷启动期规则派生,LAGOM 用真实NLP) */
const FEATURES=[
  {k:'terrace',t:'露台',kw:['露台','户外','天台','屋顶']},
  {k:'female',t:'女生友好',kw:['女生','闺蜜','安全','氛围感']},
  {k:'nolow',t:'无低消',kw:['无低消','低消','没有最低']},
  {k:'live',t:'现场音乐',kw:['音乐演出','驻唱','live','乐队','现场']},
  {k:'quiet',t:'安静聊天',kw:['清吧','聊天','安静','适合聊']},
  {k:'pet',t:'宠物友好',kw:['宠物','狗','猫']},
];
function barFeatures(b){
  // LAGOM: 用真实 NLP 标签匹配; 其余: 用品类/曲风做规则派生(标注推测)
  const text=(b.real_data?((b.nlp||[]).map(t=>t.name).join(' ')):'')+' '+(b.tags||[]).join(' ')+' '+(b.category||'');
  const set=new Set();
  FEATURES.forEach(f=>{ if(f.kw.some(k=>text.includes(k))) set.add(f.k); });
  // 规则派生兜底(体现"从评论/品类分析"): 清吧→安静, 特调→女生友好, 精酿/民谣→现场
  if(b.category&&b.category.includes('清吧')) set.add('quiet');
  if(b.category&&b.category.includes('特调')) set.add('female');
  if(b.category&&(b.category.includes('精酿')||b.category.includes('民谣')||b.category.includes('小酒馆'))) set.add('live');
  return [...set];
}
function filteredBars(){
  return D.bars.filter(b=>{
    if(MAP_FILTER.cat!=='all' && b.category!==MAP_FILTER.cat) return false;
    if(MAP_FILTER.genre!=='all' && !barGenres(b).includes(MAP_FILTER.genre)) return false;
    if(MAP_FILTER.feat!=='all' && !barFeatures(b).includes(MAP_FILTER.feat)) return false;
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
  // curator picks: 人格×今晚心情 调味
  const lagom=D.bars.find(b=>b.id==='lagom');
  const mfeats=moodFeats();
  let pool=D.bars.filter(b=>b.id!=='lagom');
  if(mfeats.length){ // 心情命中的特色 → 优先
    pool=pool.map(b=>{const fs=barFeatures(b);return {b,hit:mfeats.filter(f=>fs.includes(f)).length};})
      .sort((a,b)=>b.hit-a.hit||(b.b.match||0)-(a.b.match||0)).map(x=>x.b);
  } else {
    pool=pool.sort((a,b)=>(b.match||0)-(a.match||0));
  }
  const picks=[lagom,pool[0],pool[1]].filter(Boolean);
  const pickWhy=[
    '清吧 · 有露台 · 想安静喝一杯聊到天亮',
    mfeats.length?('今晚想「'+moodLabel()+'」· 为你调过味的推荐'):'今夜对味度最高 · 跟着耳朵走准没错',
    '人少不踩雷 · 藏在巷子里的好去处',
  ];
  // cover: 今夜精选场子(用 LAGOM 真实档案做主角，绕开"今晚无活动"的时效问题)
  const covBar=lagom||picks[0];
  const covImg=cover(covBar)||'';
  const covDist=distLabel(covBar);
  return `
  <div class="topbar">
    <div class="tb-loc"><span class="tb-hi">${USER.persona?esc(USER.persona.label):'今夜好'}</span>
      <span class="tb-city">${esc((USER.loc||'静安寺商圈').replace('商圈','').replace('/马当路',''))} · 今夜</span></div>
    <div class="tb-actions">
      <button class="icon-btn" data-scroll="discover">${IC.search}</button>
      <button class="icon-btn" data-toast="今晚 3 个局在等你">${IC.bell}</button>
      <button class="icon-btn avatar" data-go="#passport"></button>
    </div>
  </div>

  <div class="cover-hero" style="background-image:url('${covImg}')" data-spot="${covBar.id}">
    <button class="fav-btn" data-toast="已收藏到你的夜单">${IC.heart}</button>
    <div class="cap">
      <div class="day">今夜为你 · ${covBar.real_data?'真实档案':'精选'}</div>
      <div class="ttl">${esc((covBar.name||'').split(/[·・]/)[0].trim())}</div>
      <div class="loc">${esc(covBar.category||'')} · ${esc((covBar.region||'').replace('商圈',''))}${covDist?' · '+covDist:''}</div>
    </div>
  </div>

  <div class="mood-strip" data-moodopen>
    ${moodAnswered()?`<span class="ms-on">今晚 · ${esc(moodLabel())}</span><span class="mood-clear" data-moodclear>重选</span>`
      :`<span class="ms-ask">今晚想怎样？<b>10 秒调出你的专属推荐</b></span><span class="ms-arr">›</span>`}
  </div>

  <div class="bento">
    <div class="b b1" data-go="#map"><div class="bn">EXPLORE</div>
      <div class="bt">夜巡地图</div><div class="bs">${D.meta.bars_count} 家 · 按曲风点亮全城</div>
      <div class="b-badge">${D.meta.bars_count}</div></div>
    <div class="b b2" data-go="#rank"><div class="bn">RANK</div>
      <div class="bt">今夜风云</div><div class="bs">玩家票选</div></div>
    <div class="b b3" data-go="#events"><div class="bn">EVENTS</div>
      <div class="bt">时刻表</div><div class="bs">${D.meta.events_count} 场</div></div>
  </div>

  <div class="sect" id="discover"><div class="t"><small>Curated for tonight</small>今夜为你选了 ${picks.length} 个</div></div>
  ${picks.map((b,i)=>`
    <div class="pick" style="background-image:url('${cover(b)}')" data-spot="${b.id}">
      <div class="tag">${b.real_data?'真实档案':'AI 精选'}</div>
      <button class="fav-btn sm" data-toast="已收藏" data-stop>${IC.heart}</button>
      <div class="cap"><div class="nm">${esc(b.name)}</div>
        <div class="why">${pickWhy[i]||esc(b.region)}</div></div>
    </div>`).join('')}

  <div class="concierge" data-toast="正在为你规划今晚：预热 → 主场 → 续摊">
    <div class="cc-l"><div class="ct">懒得选？让我安排今晚</div>
      <div class="cs">口味 + 人数 + 区域，一条完整夜路线</div></div>
    <div class="cc-arr">${IC.arrow}</div>
  </div>
  <div style="height:120px"></div>`;
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

/* ================= QUIZ · 今夜人格问卷 (开屏) ================= */
const QUIZ=[
  {k:'genre',q:'今晚，耳朵想要什么？',sub:'音乐是第一匹配维度',opts:[
    {v:'Techno',t:'暗黑电子',d:'Techno / 深夜低频'},
    {v:'Disco',t:'复古迪斯科',d:'Disco / Funk 律动'},
    {v:'Jazz',t:'微醺爵士',d:'Jazz / Soul 慢摇'},
    {v:'Live',t:'现场演出',d:'Live / 乐队'}]},
  {k:'social',q:'今晚，为了什么出来？',sub:'来夜店，多半是冲着社交',opts:[
    {v:'meet',t:'想认识新朋友',d:'开放、热闹的场'},
    {v:'crew',t:'和死党炸场',d:'适合一群人'},
    {v:'date',t:'约会专属',d:'氛围、私密'},
    {v:'solo',t:'一个人静静喝',d:'清吧、慢调'}]},
  {k:'energy',q:'今晚的能量？',sub:'',opts:[
    {v:'high',t:'蹦到天亮',d:'高能、舞池'},
    {v:'low',t:'聊到深夜',d:'慵懒、微醺'}]},
  {k:'budget',q:'今晚的预算氛围？',sub:'',opts:[
    {v:'fine',t:'精致小酌',d:'品质优先'},
    {v:'value',t:'性价比畅饮',d:'尽兴就好'}]},
  {k:'loc',q:'你现在在哪？',sub:'用于推荐附近的好去处',opts:[
    {v:'静安寺商圈',t:'静安寺',d:'静安 / 南西'},
    {v:'外滩商圈',t:'外滩',d:'黄浦 / 北外滩'},
    {v:'徐家汇商圈',t:'徐汇',d:'衡复 / 徐家汇'},
    {v:'新天地/马当路',t:'新天地',d:'卢湾 / 马当路'}]},
];
let QZ={step:0,ans:{}};
const PERSONA_LABEL={
  Techno:'深夜 Techno',Disco:'复古 Disco',Jazz:'微醺爵士',Live:'现场派'};
const SOCIAL_LABEL={meet:'社交家',crew:'团魂',date:'约会咖',solo:'独行客'};
function buildPersona(){
  const a=QZ.ans;const label=(PERSONA_LABEL[a.genre]||'夜行')+' '+(SOCIAL_LABEL[a.social]||'玩家');
  USER.persona={label,genre:a.genre,social:a.social,energy:a.energy,budget:a.budget};
  setLoc(a.loc||'静安寺商圈');USER.done=true;saveUser();
}
/* 首次流程: 纯人格5题 → 结果。(心情改为首页弹窗) */
routes.quiz=()=>{
  if(QZ.step<QUIZ.length){ return quizQuestion(); }
  // ---- result ----
  const a=QZ.ans;const label=(PERSONA_LABEL[a.genre]||'夜行')+' '+(SOCIAL_LABEL[a.social]||'玩家');
  return `
  <div class="quiz-wrap result">
    <div class="kicker" style="text-align:center">Your nightlife persona</div>
    <div class="persona-big">
      <div class="pl">今夜的你是</div>
      <div class="pn">${esc(label)}</div>
      <div class="ptags">
        <span>${esc(GENRE_CN[a.genre]||a.genre)}</span>
        <span>${esc(SOCIAL_LABEL[a.social]||'')}</span>
        <span>${a.energy==='high'?'蹦到天亮':'聊到深夜'}</span>
      </div>
      <div class="ploc">已定位 · ${esc((a.loc||'静安寺商圈').replace('商圈','').replace('/马当路',''))} · 为你锁定附近对味场子</div>
    </div>
    <button class="btn warm" id="quiz-done">进入今夜</button>
    <div class="quiz-skip" id="quiz-retry">重新测一次</div>
  </div>`;
};
function quizQuestion(){
  // question screen
  const Q=QUIZ[QZ.step];const prog=Math.round((QZ.step)/QUIZ.length*100);
  return `
  <div class="quiz-wrap">
    <div class="quiz-prog"><i style="width:${prog}%"></i></div>
    <div class="quiz-step">0${QZ.step+1} / 0${QUIZ.length}</div>
    <div class="quiz-q">${esc(Q.q)}</div>
    ${Q.sub?`<div class="quiz-sub">${esc(Q.sub)}</div>`:''}
    <div class="quiz-opts">
      ${Q.opts.map(o=>`<div class="qopt" data-qk="${Q.k}" data-qv="${o.v}">
        <div class="qt">${esc(o.t)}</div><div class="qd">${esc(o.d)}</div></div>`).join('')}
    </div>
    ${QZ.step>0?`<div class="quiz-skip" id="quiz-back">← 上一题</div>`:`<div class="quiz-skip" id="quiz-skipall">跳过，直接逛</div>`}
  </div>`;
};

/* ================= MAP (夜上海) ================= */
routes.map=()=>{
  const cats=[...new Set(D.bars.map(b=>b.category))];
  const genres=allGenres();
  const fb=filteredBars();
  const activeCount=[MAP_FILTER.cat,MAP_FILTER.genre,MAP_FILTER.feat].filter(x=>x!=='all').length;
  return `
  <div class="cal-hero" style="padding:44px 20px 10px"><div class="kicker">Vibe Map</div>
    <div class="h1" style="margin-top:8px">夜巡</div>
    <div class="sub">${esc((USER.loc||'静安寺商圈').replace('商圈',''))}附近 · 按曲风与氛围点亮这座城 · ${fb.length} 家</div></div>
  <div class="filt">
    <div class="filt-row"><span class="filt-lab">类型</span><div class="filt-chips">
      <span class="chip sm ${MAP_FILTER.cat==='all'?'on':''}" data-mfc="all">全部</span>
      ${cats.map(c=>`<span class="chip sm ${MAP_FILTER.cat===c?'on':''}" data-mfc="${esc(c)}">${esc(c)}</span>`).join('')}
    </div></div>
    <div class="filt-row"><span class="filt-lab">曲风</span><div class="filt-chips">
      <span class="chip sm warm ${MAP_FILTER.genre==='all'?'on':''}" data-mfg="all">全部</span>
      ${genres.map(g=>`<span class="chip sm warm ${MAP_FILTER.genre===g?'on':''}" data-mfg="${g}">${esc(GENRE_CN[g]||g)}</span>`).join('')}
    </div></div>
    <div class="filt-row"><span class="filt-lab">特色</span><div class="filt-chips">
      <span class="chip sm ${MAP_FILTER.feat==='all'?'on':''}" data-mff="all">全部</span>
      ${FEATURES.map(f=>`<span class="chip sm ${MAP_FILTER.feat===f.k?'on':''}" data-mff="${f.k}">${esc(f.t)}</span>`).join('')}
    </div>
    <div class="filt-note">特色标签由真实点评分析得出 · 冷启动持续扩充</div></div>
  </div>
  <div class="mapwrap" style="height:320px"><div class="parkmap" id="parkmap">
    ${ZONES.map(z=>`<div class="zone" style="left:${z.x}%;top:${z.y-10}%;transform:translateX(-50%)">${esc(z.name.split('·')[1]||z.name)}</div>`).join('')}
    <div class="maptip" id="maptip"></div>
  </div></div>
  <div class="mapcount">${activeCount?activeCount+' 个筛选 · ':''}点亮的是已收录场所 · 点开查看详情、一键导航</div>
  <div class="sect"><div class="t" style="font-size:17px"><small>List</small>符合条件的场子</div></div>
  <div class="cardlist">${byNearest(fb).slice(0,8).map(nearCard).join('')||'<div style="color:var(--dim);padding:14px">换个筛选试试</div>'}</div>
  <div style="height:110px"></div>`;
};
function nearCard(b){
  return `<div class="spot" style="height:180px;background-image:url('${cover(b)}')" data-spot="${b.id}">
    <div class="badge">${distLabel(b)||esc(b.region.replace('商圈',''))}</div>
    <div class="ov"><div class="nm" style="font-size:18px">${esc(b.name)}</div>
      <div class="meta" style="color:#fff">${esc(b.category)} · ${barFeatures(b).slice(0,2).map(k=>{const f=FEATURES.find(x=>x.k===k);return f?f.t:'';}).filter(Boolean).join(' · ')||esc((b.region||'').replace('商圈',''))}</div></div></div>`;
}

/* ================= SCENE · AFTERGLOW (社区) ================= */
routes.scene=()=>{
  // curated 造夜人手记 from real posts (re-styled, not raw 小红书)
  const editor=D.posts[0];
  // vibe slices seeded from real bars (photo-first, one-line vibe)
  const vibes=[
    {b:D.bars.find(x=>x.id==='lagom'),txt:'露台风很轻，杯子里是一抹清幽。'},
    {b:D.bars.filter(x=>x.id!=='lagom')[2],txt:'低频压到胸口，今晚不想回家。'},
    {b:D.bars.filter(x=>x.id!=='lagom')[5],txt:'霓虹打在脸上，谁还看时间。'},
  ].filter(v=>v.b);
  const friends=D.seed.friends_online;
  return `
  <div class="cal-hero" style="padding:44px 20px 8px"><div class="kicker">Afterglow</div>
    <div class="h1" style="margin-top:8px">余温</div>
    <div class="sub">晒今晚的 vibe · 沉淀你的夜 · 看造夜人怎么玩</div></div>

  <div class="stories">
    <div class="story"><div class="ring"><i style="background-image:url('${cover(vibes[0]&&vibes[0].b||D.bars[1])}')"></i><span class="live"></span></div><div class="nm">我的现场</div></div>
    ${friends.map(f=>`<div class="story"><div class="ring"><i></i>${f.spot?'<span class="live"></span>':''}</div><div class="nm">${esc(f.nick)}</div></div>`).join('')}
  </div>

  <div class="sect"><div class="t"><small>Editor's pick</small>造夜人手记</div></div>
  <div class="pick" style="background-image:url('${(editor.images&&editor.images[0])||''}')" data-note="${editor.id}">
    <div class="tag">造夜人 @${esc(editor.author||'')}</div>
    <div class="cap"><div class="nm" style="font-size:18px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(editor.title)}</div>
      <div class="why">经 tonight 编辑精选 · 点开看完整手记</div></div>
  </div>

  <div class="sect"><div class="t"><small>Vibe check</small>今夜现场</div></div>
  <div class="cardlist">
    ${vibes.map(v=>`<div class="spot" style="height:200px;background-image:url('${cover(v.b)}')" data-spot="${v.b.id}">
      <div class="badge">${esc(v.b.region)}</div>
      <div class="ov"><div class="nm" style="font-size:17px">${esc(v.b.name)}</div>
        <div class="meta" style="font-size:13px;color:#fff">${esc(v.txt)}</div></div></div>`).join('')}
  </div>
  <div class="prov" style="margin:8px 20px">现场 vibe 与手记为氛围演示；评测原始数据退至后台，仅作口碑标签与选品洞察</div>
  <div style="height:110px"></div>`;
};

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
    <div class="dt-title">${esc((b.name||'').split(/[·・]/)[0].trim())}</div>
    <div class="dt-sub">${stars(b.rating)} <span>${esc(b.category)}</span> <span>${esc(b.region)}</span>
      ${b.real_data?'<span class="flag real">真实档案 · '+(b.review_count||0)+' 条点评</span>':'<span class="flag">口碑陆续上新</span>'}</div>

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
      <div class="tx">这家的口碑，正在路上</div>
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
  document.querySelectorAll('[data-stop]').forEach(el=>el.addEventListener('click',e=>e.stopPropagation()));
  document.querySelectorAll('[data-nav]').forEach(el=>el.onclick=(e)=>{e.stopPropagation();navTo(el.dataset.nav);});
  document.querySelectorAll('[data-scroll]').forEach(el=>el.onclick=()=>{const t=$('#'+el.dataset.scroll);if(t)t.scrollIntoView({behavior:'smooth'});else go('#map');});
  // map filters (category + genre + feature, stackable)
  document.querySelectorAll('[data-mfc]').forEach(el=>el.onclick=()=>{MAP_FILTER.cat=el.dataset.mfc;render();});
  document.querySelectorAll('[data-mfg]').forEach(el=>el.onclick=()=>{MAP_FILTER.genre=el.dataset.mfg;render();});
  document.querySelectorAll('[data-mff]').forEach(el=>el.onclick=()=>{MAP_FILTER.feat=el.dataset.mff;render();});
  // mood popup open/clear
  document.querySelectorAll('[data-moodopen]').forEach(el=>el.onclick=()=>openMood());
  const mc=$('[data-moodclear]'); if(mc) mc.onclick=()=>{MOOD={};saveMood();render();};
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
  // park map dots (home + map both have #parkmap)
  if(name==='home'||name==='map'){renderDots();}
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
