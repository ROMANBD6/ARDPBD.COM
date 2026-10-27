// VS Code: সাইটের সব ডাটা api.php থেকে আসে (admin.html এ বদলান); এখানে শুধু দেখানোর কোড
const $=s=>document.querySelector(s),dlg=$('#dlg'),
esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';'),
ok=u=>/^(https?:|\/|#|tel:|mailto:|uploads\/)/i.test(u||'')?u:'#',
api=(a,b)=>fetch('api.php?a='+a,b?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}:{}).then(r=>r.json()).catch(()=>({err:'Server error: api.php did not respond. Run the site with PHP and MySQL (see config.php).'})),
wa=()=>'https://wa.me/'+String(D.settings.whatsapp).replace(/\D/g,''),
pic=u=>u?`<img src="${esc(ok(u))}" alt="" loading="lazy">`:'<div class="ph"></div>',
num=v=>parseFloat(String(v).replace(/[০-৯]/g,d=>'০১২৩৪৫৬৭৮৯'.indexOf(d)).replace(/[^\d.]/g,'')),
msrc=(m,a)=>{m=String(m||'');const x=/src="([^"]+)"/.exec(m);if(x)m=x[1];return /^https:\/\/www\.google\.com\/maps\//.test(m)?m:'https://www.google.com/maps?q='+encodeURIComponent(m||a)+'&output=embed'},
soc=s=>{let L=[];try{L=JSON.parse(s.social)||[]}catch(e){}return L.filter(x=>x&&x.u).map(x=>`<a class="si" href="${esc(ok(x.u))}" target="_blank" rel="noopener" aria-label="${esc(x.t)}"><i class="fa-brands fa-${esc(x.t)}"></i></a>`).join('')};
let D,cat='All',qs='',cur=0,tm,cart=[];
try{cart=JSON.parse(localStorage.getItem('arp_cart'))||[]}catch(e){}

async function load(){D=await api('data');if(D.err){document.body.innerHTML=`<p style="padding:40px;font:18px sans-serif">${esc(D.err)}</p>`;return}draw()}

function draw(){
  const s=D.settings;
  document.title=s.name;$('#fav').href=ok(s.favicon);
  $('#logo').innerHTML=(s.logo?`<img src="${esc(ok(s.logo))}" alt="">`:'')+`<span>${esc(s.name)}</span>`;
  const wd=String(s.whatsapp||'').replace(/\D/g,'');
  $('#top').innerHTML=(s.email?`<span>${esc(s.email)}</span>`:'')+(s.phone?`<span>${esc(s.phone)}</span>`:'')+(soc(s)?`<span class="tsoc">${soc(s)}</span>`:'');
  $('#auth').innerHTML='<a href="#" class="cartb" data-do="cart" aria-label="Cart"><i class="fa-solid fa-cart-shopping"></i> <b id="cc">0</b></a>'+(D.me?(D.me.role=='admin'?'<a href="admin.html">Admin panel</a>':'')+`<span class="hi">Hi, ${esc(D.me.name)}</span><a href="#" data-do="out">Logout</a>`:'<a class="btn green sm" href="#" data-do="in">Login / Sign up</a>');upd();
  const B=D.banners.length?D.banners:[{title:s.name,text:s.tagline,link:'#products'}];
  $('#slides').innerHTML=B.map((b,i)=>{const h=i?'h2':'h1';return `<article class="sl">${b.img?`<img src="${esc(ok(b.img))}" alt="">`:''}<div class="cap"><${h}>${esc(b.title)}</${h}><p>${esc(b.text)}</p><a class="btn green" href="${esc(ok(b.link))}">View products</a></div></article>`}).join('');
  $('#dots').innerHTML=B.length>1?B.map((_,i)=>`<button data-do="go" data-i="${i}" aria-label="Slide ${i+1}"></button>`).join(''):'';
  go(0);prods();
  $('#about-t').textContent=s.about;
  $('#posts').innerHTML=D.blogs.slice(-6).reverse().map(b=>`<article class="card"><div class="im">${pic(b.img)}</div><div class="in"><h3>${esc(b.title)}</h3><p>${esc(String(b.body).slice(0,110))}…</p><a class="more" href="#" data-do="post" data-id="${esc(b.id)}">Read more</a></div></article>`).join('')||'<p>No posts yet.</p>';
  $('#cinfo').innerHTML=(s.address?`<div><h3>Visit us</h3><p>${esc(s.address)}</p><p><a class="more" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((/[<>]|^https?:/.test(s.map||'')?'':s.map)||s.address)}">Open in Google Maps</a></p></div>`:'')+(s.phone?`<div><h3>Call</h3><p><a href="tel:${esc(String(s.phone).replace(/\s/g,''))}">${esc(s.phone)}</a></p></div>`:'')+(s.email?`<div><h3>Email</h3><p><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></p></div>`:'')+((soc(s)||wd)?`<div><h3>Follow us</h3>${soc(s)?`<p>${soc(s)}</p>`:''}${wd?`<p><a class="btn green sm" target="_blank" rel="noopener" href="${wa()}"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a></p>`:''}</div>`:'')||'<p>Contact details will be added soon.</p>';
  $('#map').innerHTML=(s.map||s.address)?`<iframe class="mapf" src="${esc(msrc(s.map,s.address))}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"></iframe>`:'';
  $('#foot').innerHTML=`<div class="fsoc">${soc(s)}</div><p>© ${new Date().getFullYear()} ${esc(s.name)}. All rights reserved.</p>`;
  $('#fab').innerHTML=wd?`<a class="w" href="${wa()}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>`:'';
}

function prods(){
  const cs=['All',...new Set(D.products.map(p=>p.cat).filter(Boolean))];
  if(!cs.includes(cat))cat='All';
  $('#chips').innerHTML=cs.map(c=>`<button class="chip${c==cat?' on':''}" data-do="cat" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  const L=D.products.filter(p=>(cat=='All'||p.cat==cat)&&(p.name+' '+p.desc).toLowerCase().includes(qs));
  $('#grid').innerHTML=L.map(p=>{const o=num(p.old),n=num(p.price),off=o>n&&n>0?Math.round((o-n)/o*100):0;
    return `<article class="card"><div class="im">${off?`<span class="off">-${off}%</span>`:''}${pic(p.img)}</div><div class="in"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p><p class="pr">${p.old?`<s>${esc(p.old)}</s> `:''}<b>${esc(p.price||'Price on request')}</b></p><div class="acts"><button class="btn green sm" data-do="add" data-id="${esc(p.id)}"><i class="fa-solid fa-cart-plus"></i> Add to cart</button><button class="btn blue sm" data-do="buy" data-id="${esc(p.id)}">Order now</button></div></div></article>`}).join('')||'<p>No matching products.</p>';
}

function go(i){
  const a=[...document.querySelectorAll('.sl')],d=[...document.querySelectorAll('#dots button')];
  cur=(i+a.length)%a.length;
  a.forEach((x,k)=>x.classList.toggle('on',k==cur));d.forEach((x,k)=>x.classList.toggle('on',k==cur));
  clearInterval(tm);
  if(a.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)tm=setInterval(()=>go(cur+1),6000);
}

function upd(){const e=$('#cc');if(e)e.textContent=cart.reduce((n,x)=>n+x.q,0)}
function saveCart(){try{localStorage.setItem('arp_cart',JSON.stringify(cart))}catch(e){}upd()}
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e.t);e.t=setTimeout(()=>e.classList.remove('on'),1800)}

function add(id,quiet){
  const p=D.products.find(x=>x.id==id);if(!p)return;
  const c=cart.find(x=>x.id==id);
  if(c)c.q=Math.min(999,c.q+1);else cart.push({id,q:1});
  saveCart();if(!quiet)toast(p.name+' added to cart');
}

function cartView(){
  cart=cart.filter(x=>D.products.some(p=>p.id==x.id));saveCart();
  let tot=0,tbd=false;
  const rows=cart.map(x=>{
    const p=D.products.find(p=>p.id==x.id),n=num(p.price);
    if(n>0)tot+=n*x.q;else tbd=true;
    return `<div class="crow"><span><b>${esc(p.name)}</b><br><small>${esc(p.price||'Price on request')}</small></span><span class="qty"><button data-do="dec" data-id="${esc(x.id)}" aria-label="Less">−</button><b>${x.q}</b><button data-do="inc" data-id="${esc(x.id)}" aria-label="More">+</button></span><button class="rm" data-do="del" data-id="${esc(x.id)}" aria-label="Remove">×</button></div>`;
  }).join('');
  const user=D.me&&D.me.role=='user';
  $('#dbody').innerHTML='<h3>Your cart</h3>'+(cart.length?rows+`<p class="tot">Total: <b>${tot?'৳ '+tot:''}${tbd?(tot?' + ':'')+'price to be confirmed':''}</b></p>`+(user?`<form id="of"><label>Delivery address<textarea name="addr" required minlength="5" maxlength="500">${esc(localStorage.getItem('arp_addr')||'')}</textarea></label><label>Order note (size, text, design details)<textarea name="note" maxlength="2000"></textarea></label><p class="err" id="err"></p><button class="btn green">Place order</button></form>`:'<p>Please login or sign up to place your order.</p><button class="btn green" data-do="in">Login / Sign up</button>'):'<p>Your cart is empty.</p>');
  const f=$('#of');
  if(f)f.onsubmit=async e=>{
    e.preventDefault();
    const v=Object.fromEntries(new FormData(f)),r=await api('order',{items:cart.map(x=>({id:x.id,q:x.q})),addr:v.addr,note:v.note});
    if(r.err){$('#err').textContent=r.err;return}
    try{localStorage.setItem('arp_addr',v.addr)}catch(x){}
    cart=[];saveCart();
    $('#dbody').innerHTML=`<h3>Order received ✓</h3><p>Your order number is <b>${esc(r.id)}</b>.${r.total?' Total: ৳ '+r.total+'.':''} We will contact you to confirm the details.</p>`;
  };
  if(!dlg.open)dlg.showModal();
}

function auth(m){
  const L=m=='login';
  $('#dbody').innerHTML=`<h3>${L?'Login':'Create account'}</h3><form id="af">${L?'<label>Email or mobile number<input name="id" required autocomplete="username"></label>':'<label>Name<input name="name" required maxlength="60"></label><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Mobile number<input name="phone" type="tel" required placeholder="01XXXXXXXXX" autocomplete="tel"></label>'}<label>Password<input name="pass" type="password" required ${L?'':'minlength="6"'} autocomplete="${L?'current-password':'new-password'}"></label><p class="err" id="err"></p><button class="btn green">${L?'Login':'Continue'}</button></form><p class="alt">${L?'New here? <a href="#" data-do="up">Create an account</a>':'Have an account? <a href="#" data-do="inn">Login</a>'}</p>`;
  $('#af').onsubmit=async e=>{
    e.preventDefault();
    const f=Object.fromEntries(new FormData(e.target)),r=await api(m,f);
    if(r.err){$('#err').textContent=r.err;return}
    if(r.step=='verify'){verify(f.email,r);return}
    dlg.close();load();
  };
  if(!dlg.open)dlg.showModal();
}

function verify(em,r){
  $('#dbody').innerHTML=`<h3>Verify your email and mobile</h3><p>We sent a 6-digit code to <b>${esc(em)}</b> and another one by SMS. Enter both codes below.</p>${r.dev?`<p class="dev">Test mode, no real message was sent. Email code: <b>${esc(r.dev.email)}</b> &middot; SMS code: <b>${esc(r.dev.sms)}</b></p>`:''}<form id="vf"><label>Email code<input name="ecode" inputmode="numeric" maxlength="6" required autocomplete="one-time-code"></label><label>SMS code<input name="scode" inputmode="numeric" maxlength="6" required></label><p class="err" id="err"></p><button class="btn green">Verify and create account</button></form><p class="alt"><a href="#" data-do="rs" data-e="${esc(em)}">Resend codes</a></p>`;
  $('#vf').onsubmit=async e=>{
    e.preventDefault();
    const x=await api('verify',{email:em,...Object.fromEntries(new FormData(e.target))});
    if(x.err){$('#err').textContent=x.err;return}
    dlg.close();load();
  };
}

document.addEventListener('click',async e=>{
  const t=e.target.closest('[data-do]');
  if(!t){if(e.target.closest('#nav a'))$('#nav').classList.remove('open');return}
  e.preventDefault();
  const d=t.dataset,x=d.do;
  if(x=='in'||x=='inn')auth('login');
  else if(x=='up')auth('signup');
  else if(x=='out'){await api('logout',{});load()}
  else if(x=='cat'){cat=d.c;prods()}
  else if(x=='go')go(+d.i);
  else if(x=='cart')cartView();
  else if(x=='add')add(d.id);
  else if(x=='buy'){if(!cart.some(c=>c.id==d.id))add(d.id,1);cartView()}
  else if(x=='inc'||x=='dec'||x=='del'){const c=cart.find(c=>c.id==d.id);if(c){if(x=='del')cart=cart.filter(y=>y!==c);else c.q=Math.max(1,Math.min(999,c.q+(x=='inc'?1:-1)));saveCart();cartView()}}
  else if(x=='rs'){const r=await api('resend',{email:d.e});if(r.err)$('#err').textContent=r.err;else{verify(d.e,r);toast('New codes sent')}}
  else if(x=='x')dlg.close();
  else if(x=='post'){const b=D.blogs.find(b=>b.id==d.id);if(b){$('#dbody').innerHTML=`<h3>${esc(b.title)}</h3>${pic(b.img)}<p class="pre">${esc(b.body)}</p>`;dlg.showModal()}}
});
$('.burger').onclick=e=>e.target.setAttribute('aria-expanded',$('#nav').classList.toggle('open'));
$('#q').oninput=e=>{qs=e.target.value.toLowerCase();prods()};
load();
