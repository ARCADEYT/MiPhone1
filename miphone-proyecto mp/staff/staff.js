(function(){
var $=function(i){return document.getElementById(i)},money=function(n){return '$'+n.toLocaleString('es-AR')},pad=function(n){return ('00000'+n).slice(-5)};
var PACKS=[[1,2500],[2,4500],[4,7600],[6,9600],[10,14000],[15,19500],[20,24000],[30,33000],[50,44000],[200,120000]];
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
function jget(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}}
function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var tt;function toast(t){var e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(function(){e.classList.remove('on')},2400)}

/* datos de demostración (semilla fija) */
var seed=7;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
var NAMES=['Martina Gómez','Lucas Pérez','Camila Ríos','Nicolás Acosta','Sofía Funes','Julián Molina','Agustina Barrios','Diego Vera','Romina Castro','Mateo Luna','Valentina Sosa','Franco Díaz','Lucía Herrera','Tomás Ibarra','Carolina Paz','Bruno Córdoba','Florencia Ruiz','Ezequiel Nieva','Julieta Aguirre','Santiago Olmos'];
var PAYS=['Mercado Pago','Mercado Pago','Mercado Pago','Transferencia'];
var ORDERS=[],now=Date.now(),used={};
for(var i=0;i<64;i++){
  var pk=PACKS[Math.min(PACKS.length-1,Math.floor(Math.pow(rnd(),1.6)*PACKS.length))],nums=[];
  while(nums.length<pk[0]){var x=Math.floor(rnd()*100000);if(!used[x]){used[x]=1;nums.push(x)}}
  var r=rnd(),nm=NAMES[Math.floor(rnd()*NAMES.length)];
  ORDERS.push({id:'MIP-'+(100200+i*37),t:now-Math.floor(rnd()*7*864e5),name:nm,phone:'+54 9 383 4'+(100+(i*7919)%900)+'-'+(1000+(i*6143)%9000),email:nm.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ /g,'.')+'@mail.com',n:pk[0],amt:pk[1],pay:PAYS[Math.floor(rnd()*4)],st:r<.82?'Aprobado':r<.94?'Pendiente':'Rechazado',nums:nums.sort(function(a,b){return a-b})});
}
ORDERS.sort(function(a,b){return b.t-a.t});
/* pedidos hechos en la demo del mismo navegador */
try{var loc=JSON.parse(localStorage.getItem('neb_orders'));if(loc)Object.keys(loc).forEach(function(k){var o=loc[k];ORDERS.unshift({id:k,t:now,name:'Cliente (demo local)',email:o.email,phone:o.phone||'—',n:o.nums.length,amt:(PACKS.filter(function(p){return p[0]===o.nums.length})[0]||[0,0])[1],pay:'Mercado Pago',st:'Aprobado',nums:o.nums})})}catch(e){}
var SK='miphone_status',over=jget(SK,{});ORDERS.forEach(function(o){if(over[o.id])o.st=over[o.id]});
function setStatus(id,st){var o=ORDERS.filter(function(x){return x.id===id})[0];o.st=st;over[id]=st;jset(SK,over);render();draw()}

/* login */
function login(){$('login').hidden=true;$('app').hidden=false;
  var a=$('app');[].forEach.call(a.querySelectorAll('.eb,h2,.k,.card'),function(e,i){e.style.setProperty('--i',i)});a.classList.remove('enter');void a.offsetWidth;a.classList.add('enter');
  render();draw()}
function tryLogin(){
  if($('u').value.trim().toLowerCase()==='staff'&&$('p').value==='miphone2026'){try{sessionStorage.setItem('staff','1')}catch(e){}login()}
  else $('er').textContent='Usuario o contraseña incorrectos.'}
$('go').onclick=tryLogin;
$('lf').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();tryLogin()}});
/* Al publicar como web aparte, cambiá esta dirección por la de la web del sorteo (por ej. '/') */
var HOME='MiPhone_Triple_Sorteo_v3.html';
$('bk').onclick=function(){if(window.parent!==window)parent.postMessage('staff-close','*');else location.href=HOME};
$('out').onclick=function(){try{sessionStorage.removeItem('staff')}catch(e){}$('app').hidden=true;$('login').hidden=false;$('p').value='';$('er').textContent=''};

/* estadísticas */
var shown={};
function countTo(id,val,fmt){var el=$(id),from=shown[id]||0,t0=null,d=900;shown[id]=val;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=fmt(val);return}
  function step(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,3);el.textContent=fmt(Math.round(from+(val-from)*e));if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
function render(){
  var ok=ORDERS.filter(function(o){return o.st==='Aprobado'}),ch=ok.reduce(function(s,o){return s+o.n},0),tot=ok.reduce(function(s,o){return s+o.amt},0);
  countTo('k1',ok.length,String);countTo('k2',ch,function(v){return v.toLocaleString('es-AR')});countTo('k3',tot,money);countTo('k4',ok.length?Math.round(tot/ok.length):0,money);
  var days=[],ds=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  for(var d=6;d>=0;d--){var s0=new Date();s0.setHours(0,0,0,0);s0=s0.getTime()-d*864e5;days.push({l:ds[new Date(s0).getDay()],v:ok.filter(function(o){return o.t>=s0&&o.t<s0+864e5}).reduce(function(a,o){return a+o.amt},0)})}
  var mx=Math.max.apply(null,days.map(function(x){return x.v}))||1;
  $('bars').innerHTML=days.map(function(x){return '<div class="bar"><em>'+(x.v?money(Math.round(x.v/1000))+'k':'')+'</em><i data-h="'+Math.max(3,x.v/mx*120)+'" style="height:3px"></i>'+x.l+'</div>'}).join('');
  var cnt={};ok.forEach(function(o){cnt[o.n]=(cnt[o.n]||0)+1});
  var top=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]}).slice(0,5),m=cnt[top[0]]||1;
  $('pk').innerHTML=top.map(function(k){return '<div><span>'+k+(k==1?' chance':' chances')+'</span><span class="tr"><i data-w="'+cnt[k]/m*100+'" style="width:0;transition:width .8s cubic-bezier(.2,.7,.2,1)"></i></span><b>'+cnt[k]+'</b></div>'}).join('');
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    [].forEach.call(document.querySelectorAll('.bar i'),function(e,i){e.style.transitionDelay=i*60+'ms';e.style.height=e.dataset.h+'px'});
    [].forEach.call(document.querySelectorAll('.pk .tr i'),function(e,i){e.style.transitionDelay=i*80+'ms';e.style.width=e.dataset.w+'%'})})});
}
/* pedidos */
function list(){var q=$('q').value.trim().toLowerCase(),f=$('f').value;
  return ORDERS.filter(function(o){return (!f||o.st===f)&&(!q||(o.id+o.name+o.email+(o.phone||'')).toLowerCase().indexOf(q)>-1)})}
function draw(){var L=list(),c={Aprobado:'a',Pendiente:'p',Rechazado:'x'};
  $('tb').innerHTML=L.length?L.map(function(o,i){var d=new Date(o.t);return '<tr class="r" style="--r:'+Math.min(i,16)+'" data-id="'+o.id+'"><td><b>'+o.id+'</b></td><td>'+d.toLocaleDateString('es-AR',{day:'2-digit',month:'short'})+' '+d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})+'</td><td>'+esc(o.name)+'<br><small style="color:var(--mut)">'+esc(o.phone||o.email)+'</small></td><td>'+o.n+'</td><td>'+money(o.amt)+'</td><td>'+o.pay+'</td><td><span class="st '+c[o.st]+'">'+o.st+'</span></td></tr>'}).join(''):'<tr><td colspan="7" class="emp">No hay pedidos con ese filtro.</td></tr>'}
$('q').oninput=draw;$('f').onchange=draw;
function close(){$('ov').classList.remove('open')}
$('tb').onclick=function(e){var r=e.target.closest('tr[data-id]');if(!r)return;var o=ORDERS.filter(function(x){return x.id===r.dataset.id})[0];
  var acts=o.st==='Pendiente'?'<div class="row"><button class="sbtn" data-ap="'+o.id+'">Aprobar pago</button><button class="sbtn r" data-rj="'+o.id+'">Rechazar</button></div>':(o.st==='Rechazado'?'<div class="row"><button class="sbtn o" data-ap="'+o.id+'">Aprobar igualmente</button></div>':'');
  $('mb').innerHTML='<div class="eb">Pedido</div><h2 style="margin:4px 0 0;font-size:28px">'+o.id+'</h2><dl><dt>Participante</dt><dd>'+esc(o.name)+'</dd><dt>Email</dt><dd>'+esc(o.email)+'</dd><dt>Celular</dt><dd>'+esc(o.phone||'—')+'</dd><dt>Fecha</dt><dd>'+new Date(o.t).toLocaleString('es-AR')+'</dd><dt>Pago</dt><dd>'+o.pay+' · '+o.st+'</dd><dt>Monto</dt><dd>'+money(o.amt)+'</dd></dl><b style="font-size:13px">'+o.n+(o.n===1?' número asignado':' números asignados')+'</b><div class="nums" style="margin-top:8px">'+o.nums.map(function(n){return '<span>'+pad(n)+'</span>'}).join('')+'</div>'+acts;
  $('ov').classList.add('open')};
$('mb').addEventListener('click',function(e){var a=e.target.closest('[data-ap]'),r=e.target.closest('[data-rj]');
  if(a){setStatus(a.dataset.ap,'Aprobado');close();toast('✓ Pago aprobado · '+a.dataset.ap)}
  if(r){setStatus(r.dataset.rj,'Rechazado');close();toast('Pago rechazado · '+r.dataset.rj)}});
$('mx').onclick=close;$('ov').onclick=function(e){if(e.target===$('ov'))close()};document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
$('csv').onclick=function(){var rows=[['Pedido','Fecha','Nombre','Email','Celular','Chances','Monto','Pago','Estado','Numeros']].concat(list().map(function(o){return [o.id,new Date(o.t).toISOString(),o.name,o.email,o.phone||'',o.n,o.amt,o.pay,o.st,o.nums.map(pad).join(' ')]}));
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"'}).join(',')}).join('\n');
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'}));a.download='pedidos-miphone.csv';a.click()};

/* ===== Configuración: packs y Mercado Pago ===== */
var DEF=[[1,2500],[2,4500],[4,7600],[6,9600],[10,14000,1],[15,19500],[20,24000],[30,33000],[50,44000],[200,120000]];
var KEY='miphone_cfg';
function getCfg(){return jget(KEY,{})}
function setCfg(c){jset(KEY,c);try{if(window.parent!==window)parent.postMessage('cfg-updated','*')}catch(e){}}
var rows=(getCfg().packs||DEF).map(function(p){return [p[0],p[1],p[2]?1:0]});
function drawRows(){
  $('prs').innerHTML=rows.map(function(p,i){var u=p[0]>0&&p[1]>0?money(Math.round(p[1]/p[0])):'—';
    return '<div class="pr" data-i="'+i+'"><input type="number" min="1" step="1" inputmode="numeric" value="'+(p[0]||'')+'" data-f="0" aria-label="Chances"><input type="number" min="1" step="100" inputmode="numeric" value="'+(p[1]||'')+'" data-f="1" aria-label="Precio"><span class="cu">'+u+'</span><span class="rd"><input type="radio" name="hot" '+(p[2]?'checked':'')+' data-hot="1" aria-label="Más elegido"></span><button class="del" data-del="1" aria-label="Quitar pack">×</button></div>'}).join('')}
function msg(t,ok){var m=$('pmsg');m.textContent=t;m.className='msg '+(ok?'ok':'no')}
$('prs').addEventListener('input',function(e){var r=e.target.closest('.pr');if(!r||e.target.dataset.f==null)return;var i=+r.dataset.i,f=+e.target.dataset.f;rows[i][f]=Math.max(0,Math.floor(+e.target.value)||0);var p=rows[i];r.querySelector('.cu').textContent=p[0]>0&&p[1]>0?money(Math.round(p[1]/p[0])):'—'});
$('prs').addEventListener('change',function(e){if(e.target.dataset.hot){var i=+e.target.closest('.pr').dataset.i;rows.forEach(function(p,k){p[2]=k===i?1:0})}});
$('prs').addEventListener('click',function(e){var b=e.target.closest('[data-del]');if(!b)return;if(rows.length<=1){msg('Tiene que haber al menos un pack.');return}rows.splice(+b.closest('.pr').dataset.i,1);drawRows()});
$('padd').onclick=function(){if(rows.length>=12){msg('Máximo 12 packs.');return}rows.push([0,0,0]);drawRows();msg('')};
$('prst').onclick=function(){rows=DEF.map(function(p){return [p[0],p[1],p[2]?1:0]});drawRows();msg('Valores originales cargados. Tocá “Guardar cambios” para aplicarlos.',true)};
$('psave').onclick=function(){
  var seen={},bad=rows.some(function(p){return !(p[0]>0&&p[1]>0)});
  if(bad){msg('Completá cantidad y precio en todos los packs.');return}
  var dup=rows.some(function(p){if(seen[p[0]])return true;seen[p[0]]=1;return false});
  if(dup){msg('No puede haber dos packs con la misma cantidad.');return}
  rows.sort(function(a,b){return a[0]-b[0]});
  var out=rows.map(function(p){return p[2]?[p[0],p[1],1]:[p[0],p[1]]}),c=getCfg();c.packs=out;setCfg(c);drawRows();msg('✓ Cambios guardados. Ya se ven en la web.',true);toast('✓ Packs guardados')};
drawRows();
function drawMP(){
  fetch('../api/packs',{cache:'no-store'}).then(function(r){return r.json()}).then(function(d){
    var on=!!d.mp;$('mps').className='mp'+(on?' on':'');$('mpt').textContent=on?'Conectada':'Sin conectar';
    $('mpd').textContent=on?'El servidor tiene las credenciales de Mercado Pago cargadas.':'Falta cargar MP_ACCESS_TOKEN en el servidor.'
  }).catch(function(){$('mpt').textContent='Sin conexión con el servidor';$('mpd').textContent='Abrí el sitio desde el servidor (npm start), no como archivo suelto.'});
}
drawMP();
try{if(sessionStorage.getItem('staff')==='1')login()}catch(e){}
})();
