// VS Code: অ্যাডমিন প্যানেল। লগইন করলে সেটিংস, ব্যানার, প্রোডাক্ট, ব্লগ, ইউজার ও পাসওয়ার্ড বদলানো যায়
const $=s=>document.querySelector(s),
esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),
api=(a,b)=>fetch('api.php?a='+a,b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}:{}).then(r=>r.json()).catch(()=>({err:'Server error: api.php did not respond. Run the site with PHP and MySQL (see config.php).'})),
F={
 settings:[['name','Shop name'],['tagline','Tagline'],['logo','Logo','img'],['favicon','Icon (favicon)','img'],['phone','Phone'],['whatsapp','WhatsApp number (e.g. 8801XXXXXXXXX)'],['email','Email'],['address','Address'],['map','Google Map location: type an address, lat,lng, or paste the Google Maps embed code (empty = use the address)'],['social','Social links','soc'],['about','About text','area']],
 banners:[['title','Title'],['text','Text','area'],['link','Button link (e.g. #products)'],['img','Banner image','img']],
 products:[['name','Name'],['cat','Category'],['price','Price (e.g. ৳ 250)'],['old','Old price (optional)'],['desc','Description','area'],['img','Image','img']],
 blogs:[['title','Title'],['body','Post text','area'],['img','Image','img']]
},
T={settings:'Settings',banners:'Banners',products:'Products',blogs:'Blog',orders:'Orders',users:'Users',pass:'Password'},
main=$('#app'),
msg=t=>{const m=$('#msg');if(m)m.textContent=t},
get=fs=>Object.fromEntries(fs.map(([k])=>[k,$('#f_'+k).value.trim()])),
shrink=(f,m,png)=>new Promise(r=>{const i=new Image;i.onload=()=>{const s=Math.min(1,m/Math.max(i.width,i.height)),c=document.createElement('canvas'),x=c.getContext('2d');c.width=Math.round(i.width*s);c.height=Math.round(i.height*s);if(!png){x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}x.drawImage(i,0,0,c.width,c.height);r(c.toDataURL(png?'image/png':'image/jpeg',.85))};i.src=URL.createObjectURL(f)}),
form=(fs,o)=>`<div class="fl">${fs.map(([k,l,t])=>t=='soc'?`<div class="full"><b>${l}</b><div id="socs"></div><button type="button" class="btn blue sm" id="addsoc">Add link</button><input type="hidden" id="f_${k}" value="${esc(o[k])}"></div>`:`<label class="${t?'full':''}">${l}${t=='area'?`<textarea id="f_${k}">${esc(o[k])}</textarea>`:t=='img'?`<span class="up2"><input id="f_${k}" value="${esc(o[k])}" placeholder="Image link, or choose a file"><input type="file" accept="image/*" data-k="${k}">${o[k]?`<img src="${esc(o[k])}" alt="">`:''}</span>`:`<input id="f_${k}" value="${esc(o[k])}">`}</label>`).join('')}</div>`,
bind=()=>main.querySelectorAll('input[type=file]').forEach(i=>i.onchange=async()=>{
  const f=i.files[0];if(!f)return;msg('Uploading…');
  const k=i.dataset.k,png=k=='logo'||k=='favicon',r=await api('upload',{img:await shrink(f,png?600:1600,png)});
  if(r.err)return msg(r.err);
  $('#f_'+k).value=r.url;
  const im=i.parentNode.querySelector('img')||i.parentNode.appendChild(document.createElement('img'));im.src=r.url;
  msg('Image ready. Press Save.');
}),
save=async(k,v)=>{const r=await api('save',{key:k,val:v});if(r.err){msg(r.err);return false}D[k]=v;msg('Saved ✓');return true};
let D,tab='settings',ed=-1;

async function init(){D=await api('data');if(D.err){main.innerHTML=`<div class="panel"><p class="err">${esc(D.err)}</p></div>`;return}D.me&&D.me.role=='admin'?show():login()}

function login(){
  main.innerHTML=`<div class="panel" style="max-width:420px;margin:60px auto"><h1>Admin login</h1><form id="lf"><label>Admin ID<input name="id" required autocomplete="username"></label><label>Password<input name="pass" type="password" required autocomplete="current-password"></label><p class="err" id="err"></p><button class="btn green">Login</button></form><p class="alt"><a href="index.html">Back to website</a></p></div>`;
  $('#lf').onsubmit=async e=>{e.preventDefault();const r=await api('login',Object.fromEntries(new FormData(e.target)));if(r.err)$('#err').textContent=r.err;else init()};
}

function show(){
  main.innerHTML=`<h1>Admin panel</h1><div class="tabs">${Object.keys(T).map(k=>`<button class="${k==tab?'on':''}" data-t="${k}">${T[k]}</button>`).join('')}<a class="btn blue sm" href="index.html" target="_blank">View website</a><button data-t="out">Logout</button></div><div class="panel" id="p"></div><p class="msg" id="msg"></p>`;
  main.querySelectorAll('[data-t]').forEach(b=>b.onclick=async()=>{if(b.dataset.t=='out'){await api('logout',{});return init()}tab=b.dataset.t;ed=-1;show()});
  ({settings:pset,orders:pord,users:pusers,pass:ppass}[tab]||plist)();
}

function pset(){
  $('#p').innerHTML=form(F.settings,D.settings)+'<h3 style="margin-top:20px">Map preview</h3><iframe class="mapf" id="mp" title="Map preview"></iframe><p><button class="btn green" id="sv">Save settings</button></p>';
  bind();socUI();
  const mp=()=>{$('#mp').src=msrc($('#f_map').value,$('#f_address').value)};
  $('#f_map').onchange=mp;$('#f_address').onchange=mp;mp();
  $('#sv').onclick=()=>save('settings',get(F.settings));
}

function plist(){
  const L=D[tab],fs=F[tab],o=ed>=0?L[ed]:ed==-2?{}:null;
  $('#p').innerHTML=`<p><button class="btn green sm" id="add">Add new</button></p>`+L.map((x,i)=>`<div class="row"><span>${x.img?`<img src="${esc(x.img)}" alt="">`:''} ${esc(x.title||x.name)}</span><span><button class="btn blue sm" data-e="${i}">Edit</button> <button class="btn sm" style="background:#b00020;color:#fff" data-d="${i}">Delete</button></span></div>`).join('')+(o?`<h3 style="margin-top:24px">${ed==-2?'New item':'Edit item'}</h3>${form(fs,o)}<p><button class="btn green" id="sv">Save</button> <button class="btn blue" id="cx">Cancel</button></p>`:'');
  bind();
  $('#add').onclick=()=>{ed=-2;plist()};
  $('#p').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{ed=+b.dataset.e;plist();scrollTo(0,document.body.scrollHeight)});
  $('#p').querySelectorAll('[data-d]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this item?')&&await save(tab,L.filter((_,i)=>i!=b.dataset.d))){ed=-1;plist()}});
  if(o){
    $('#cx').onclick=()=>{ed=-1;plist()};
    $('#sv').onclick=async()=>{
      const v={...(ed>=0?L[ed]:{id:Date.now().toString(36)}),...get(fs)};
      if(!(v.title||v.name))return msg('Please enter a title or name');
      if(await save(tab,ed>=0?L.map((x,i)=>i==ed?v:x):[...L,v])){ed=-1;plist()}
    };
  }
}

async function pusers(){
  const u=await api('users');
  $('#p').innerHTML=`<h3>Registered users (${u.length})</h3>`+(u.map(x=>`<div class="row"><span>${esc(x.name)}</span><span>${esc(x.email)} · ${esc(x.phone)} · ${esc(x.date)}</span></div>`).join('')||'<p>No users yet.</p>');
}

function ppass(){
  $('#p').innerHTML='<label>New admin password (8+ characters)<input id="np" type="password" autocomplete="new-password"></label><p><button class="btn green" id="sv">Change password</button></p>';
  $('#sv').onclick=async()=>{const r=await api('pass',{pass:$('#np').value});msg(r.err||'Password changed ✓');if(!r.err)$('#np').value=''};
}
const SOC=[['facebook-f','Facebook'],['youtube','YouTube'],['tiktok','TikTok'],['instagram','Instagram'],['x-twitter','X (Twitter)'],['linkedin-in','LinkedIn'],['telegram','Telegram'],['pinterest-p','Pinterest'],['snapchat','Snapchat']],
ST=['New','Confirmed','Printing','Ready','Delivered','Cancelled'];

function msrc(m,a){
  m=String(m||'');const x=/src="([^"]+)"/.exec(m);if(x)m=x[1];
  return /^https:\/\/www\.google\.com\/maps\//.test(m)?m:'https://www.google.com/maps?q='+encodeURIComponent(m||a)+'&output=embed';
}

function socUI(){
  const h=$('#f_social');let L=[];
  try{L=JSON.parse(h.value)||[]}catch(e){}
  const put=()=>{h.value=JSON.stringify(L)},
  draw=()=>{$('#socs').innerHTML=L.map((x,i)=>`<div class="srow"><select data-i="${i}">${SOC.map(([v,n])=>`<option value="${v}"${v==x.t?' selected':''}>${n}</option>`).join('')}</select><input data-i="${i}" value="${esc(x.u)}" placeholder="https://..."><button type="button" class="btn sm" data-r="${i}">Remove</button></div>`).join('')};
  $('#socs').onchange=e=>{if(e.target.tagName=='SELECT'){L[e.target.dataset.i].t=e.target.value;put()}};
  $('#socs').oninput=e=>{if(e.target.tagName=='INPUT'){L[e.target.dataset.i].u=e.target.value.trim();put()}};
  $('#socs').onclick=e=>{const r=e.target.dataset.r;if(r!=null){L.splice(+r,1);put();draw()}};
  $('#addsoc').onclick=()=>{L.push({t:'facebook-f',u:''});put();draw()};
  draw();
}

async function pord(){
  const o=await api('orders');
  $('#p').innerHTML=`<h3>Orders (${o.length})</h3>`+(o.map(x=>`<div class="ord"><div class="row"><b>${esc(x.id)}</b><span>${esc(x.created)}</span><select data-o="${esc(x.id)}">${ST.map(s=>`<option${s==x.status?' selected':''}>${s}</option>`).join('')}</select></div><p><b>${esc(x.name)}</b> · ${esc(x.phone)} · ${esc(x.email)}</p><p>${esc(x.addr)}</p>${x.note?`<p>Note: ${esc(x.note)}</p>`:''}<ul>${x.items.map(i=>`<li>${esc(i.q)} × ${esc(i.name)} (${esc(i.price||'price on request')})</li>`).join('')}</ul><p><b>Total: ${x.total?'৳ '+esc(x.total):'to be confirmed'}</b></p></div>`).join('')||'<p>No orders yet.</p>');
  $('#p').querySelectorAll('[data-o]').forEach(s=>s.onchange=async()=>{const r=await api('ostatus',{id:s.dataset.o,status:s.value});msg(r.err||'Status updated ✓')});
}
init();
