/* Hilo punteado: baja por toda la página, se llena con el scroll y marca cada sección */
(function(){
  var dl=document.getElementById('dl');if(!dl)return;
  var fill=dl.querySelector('.dl-fill'),ids=['inicio','premios','como-funciona','testimonios','faq'],nodes=[],tops=[],tk=false;
  ids.forEach(function(){var n=document.createElement('i');n.className='dl-n';dl.appendChild(n);nodes.push(n)});
  function measure(){
    var h=document.documentElement.scrollHeight;dl.style.height=h+'px';
    ids.forEach(function(id,i){var el=document.getElementById(id);var t=el?el.getBoundingClientRect().top+window.pageYOffset:0;tops[i]=t;nodes[i].style.top=(i===0?14:t)+'px'});
    update();
  }
  function update(){
    tk=false;var probe=window.pageYOffset+window.innerHeight*.4;
    fill.style.height=Math.min(dl.offsetHeight,Math.max(0,probe))+'px';
    nodes.forEach(function(n,i){n.classList.toggle('on',probe>=(i===0?0:tops[i]))});
  }
  window.addEventListener('scroll',function(){if(!tk){tk=true;requestAnimationFrame(update)}},{passive:true});
  window.addEventListener('resize',measure);
  window.addEventListener('load',function(){measure();setTimeout(measure,700);setTimeout(measure,1800)});
  measure();
})();

/* Entrada suave de las secciones al aparecer en pantalla */
(function(){
  if(!('IntersectionObserver' in window)||(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches))return;
  var groups=['#premios .facts > div','#premios .phead .l > *','#premios .phead .r > *','#como-funciona .dgrid > div > *','#como-funciona .steps > li','#como-funciona .band > *','.tm-head > *','.tm-cols','#faq .fgrid > div:first-child > *','#faq details','footer .frow > *','footer .disc'];
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting||e.boundingClientRect.top<0){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  groups.forEach(function(sel){
    [].forEach.call(document.querySelectorAll(sel),function(el){
      var idx=[].indexOf.call(el.parentNode.children,el);
      el.classList.add('rv');if(/^H[1-3]$/.test(el.tagName))el.classList.add('rv-t');
      el.style.transitionDelay=Math.min(idx*80,400)+'ms';io.observe(el);
    });
  });
  setTimeout(function(){[].forEach.call(document.querySelectorAll('.rv:not(.in)'),function(el){var r=el.getBoundingClientRect();if(r.top<innerHeight){el.classList.add('in')}})},2500);
})();

/* Título principal: cada palabra sube desde una máscara, una tras otra */
(function(){
  var h=document.querySelector('.hero h1');if(!h)return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  h.setAttribute('aria-label',h.textContent.replace(/\s+/g,' ').trim());
  var n=0;
  function walk(el){
    [].slice.call(el.childNodes).forEach(function(c){
      if(c.nodeType===3){
        var f=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function(t){
          if(!t)return;
          if(/^\s+$/.test(t)){f.appendChild(document.createTextNode(' '));return}
          var w=document.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');
          var x=document.createElement('span');x.className='wi';x.style.animationDelay=(150+n*85)+'ms';x.textContent=t;
          w.appendChild(x);f.appendChild(w);n++;
        });
        c.parentNode.replaceChild(f,c);
      }else if(c.nodeType===1&&c.tagName!=='BR'){walk(c)}
    });
  }
  walk(h);
})();

/* Fondo: resplandor suave que viaja con el scroll y une todas las secciones */
(function(){
  var cv=document.getElementById('bgnet');if(!cv)return;
  var ctx=cv.getContext('2d'),W=0,H=0,dpr=1,t=0,sy=window.pageYOffset,cur=0;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  function resize(){dpr=Math.min(2,window.devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  function blob(x,y,r,rgb,a){
    var g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function frame(){
    var max=Math.max(1,document.documentElement.scrollHeight-H),target=Math.min(1,Math.max(0,window.pageYOffset/max));
    cur+=(target-cur)*.06;t+=.0025;
    ctx.clearRect(0,0,W,H);
    var R=Math.max(W,H)*.55;
    /* tres manchas muy tenues que se desplazan según el avance de la página */
    blob(W*(.15+.7*cur)+Math.sin(t)*60,H*(.2+.5*cur)+Math.cos(t*.8)*40,R,'5,99,155',.045);
    blob(W*(.85-.6*cur)+Math.cos(t*.9)*60,H*(.8-.45*cur)+Math.sin(t)*40,R*.9,'19,122,160',.04);
    blob(W*(.5+.3*Math.sin(cur*6.28))+Math.sin(t*.7)*50,H*(.5+.3*cur),R*.7,'184,240,74',.05);
    if(!reduce&&!document.hidden)requestAnimationFrame(frame);
  }
  window.addEventListener('resize',function(){resize();if(reduce)frame()});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&!reduce)requestAnimationFrame(frame)});
  resize();frame();
})();

/* Timeline global: el hilo se llena con el scroll y los puntos marcan cada sección */
(function(){
  var rail=document.getElementById('rail');if(!rail)return;
  var fill=rail.querySelector('.rl-fill'),bar=document.getElementById('rl-top');
  var dots=[].slice.call(rail.querySelectorAll('.rl-dot')),tops=[],ticking=false;
  function maxS(){return Math.max(1,document.documentElement.scrollHeight-window.innerHeight)}
  function measure(){
    var m=maxS();
    dots.forEach(function(d,i){
      var el=document.getElementById(d.getAttribute('data-t'));
      var t=el?el.getBoundingClientRect().top+window.pageYOffset:0;
      tops[i]=t;d.style.top=Math.min(100,Math.max(0,t/m*100))+'%';
    });
    update();
  }
  function update(){
    ticking=false;
    var p=Math.min(1,Math.max(0,window.pageYOffset/maxS()));
    fill.style.height=(p*100)+'%';bar.style.transform='scaleX('+p+')';
    var probe=window.pageYOffset+window.innerHeight*.4,act=0;
    tops.forEach(function(t,i){if(probe>=t)act=i});
    dots.forEach(function(d,i){
      d.classList.toggle('on',i===act);d.classList.toggle('done',i<act);
      if(i===act)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
  window.addEventListener('resize',measure);
  window.addEventListener('load',function(){measure();setTimeout(measure,600)});
  measure();
})();

/* Duplica cada lista una vez para el loop infinito (igual que el componente original) */
document.querySelectorAll('[data-tm]').forEach(function(ul){
  var items=Array.prototype.slice.call(ul.children);
  items.forEach(function(li){
    var c=li.cloneNode(true);
    c.setAttribute('aria-hidden','true');
    c.setAttribute('tabindex','-1');
    ul.appendChild(c);
  });
});

(function(){
  var PACKS=[[1,2500],[2,4500],[4,7600],[6,9600],[10,14000,1],[15,19500],[20,24000],[30,33000],[50,44000],[200,120000]];
  function readCfg(){try{return JSON.parse(localStorage.getItem('miphone_cfg'))||{}}catch(e){return {}}}
  function hotIdx(){for(var i=0;i<PACKS.length;i++)if(PACKS[i][2])return i;return 0}
  (function(){var c=readCfg();if(c.packs&&c.packs.length)PACKS=c.packs})();
  var sel=hotIdx(),pm='mp',serverMode=false,mpOn=true,$=function(i){return document.getElementById(i)};
  var money=function(n){return '$'+n.toLocaleString('es-AR')};
  var store={get:function(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

  function buildChips(){
    $('packs').innerHTML=PACKS.map(function(p,i){var u=Math.round(p[1]/p[0]);return '<button class="opt" data-i="'+i+'" role="radio"><span class="o-n"><b>'+p[0]+'</b><small>'+(p[0]===1?'chance':'chances')+'</small></span><span class="o-p"><b>'+money(p[1])+'</b><small>'+money(u)+' c/u</small></span>'+(p[2]?'<i class="o-tag">Más elegido</i>':(i===PACKS.length-1?'<i class="o-tag b">Mejor precio</i>':''))+'</button>'}).join('');
  }
  function fillTC(){var u=document.getElementById('tcPacks');if(u)u.innerHTML=PACKS.map(function(p){return '<li><b>'+p[0]+(p[0]===1?' chance':' chances')+'</b> – '+money(p[1])+'</li>'}).join('')}
  function renderPacks(){fillTC();
    [].forEach.call($('packs').children,function(c,i){c.classList.toggle('on',i===sel);c.setAttribute('aria-checked',i===sel)});
    var p=PACKS[sel],unit=Math.round(p[1]/p[0]),base=PACKS[0][1]/PACKS[0][0],save=Math.round((1-unit/base)*100),w=p[0]===1?'chance':'chances',t=$('sT');
    t.textContent=money(p[1]);t.classList.remove('t');void t.offsetWidth;t.classList.add('t');
    $('sU').textContent=p[0]+' '+w+' · '+money(unit)+' por chance';
    $('sS').textContent=p[2]?'Más elegido · ahorrás '+save+'%':(save>0?'Ahorrás '+save+'%':'Precio base');
    $('sS').className='tk-tag'+(p[2]?' hot':'');
    $('go').textContent='Continuar con '+p[0]+' '+w;
  }
  $('packs').addEventListener('click',function(e){var b=e.target.closest('.opt');if(b){sel=+b.dataset.i;renderPacks()}});
  buildChips();renderPacks();
  function applyMP(){
    var c=readCfg(),on=serverMode?mpOn:(!(c.mp&&c.mp.linked===false)&&!(c.mp&&!c.mp.linked));
    var b=document.querySelector('.pm[data-pm="mp"]');
    if(b){b.disabled=serverMode&&!on;b.querySelector('small').textContent=on?'Aprobación inmediata':'Requiere configurar el servidor'}
    $('mpSetup').hidden=!serverMode||on;
    if(!on&&pm==='mp'){var t=document.querySelector('.pm[data-pm="tr"]');if(t)t.click()}
  }
  setTimeout(applyMP,0);
  /* El servidor es la fuente de verdad de los precios (el cobro se calcula allá, no en el navegador) */
  fetch('/api/packs',{cache:'no-store'}).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(d){
    if(!d.packs||!d.packs.length)return;serverMode=true;mpOn=!!d.mp;PACKS=d.packs;sel=hotIdx();buildChips();renderPacks();applyMP();
  }).catch(function(){});
  window.addEventListener('message',function(e){if(e.data==='cfg-updated'&&!serverMode){var c=readCfg();if(c.packs&&c.packs.length)PACKS=c.packs;sel=hotIdx();buildChips();renderPacks();applyMP()}});

  function open(id){$('o-'+id).classList.add('open')}
  function closeAll(){document.querySelectorAll('.ov').forEach(function(o){o.classList.remove('open')})}
  document.addEventListener('click',function(e){
    var o=e.target.closest('[data-open]');if(o){closeAll();open(o.dataset.open);return}
    var g=e.target.closest('[data-goto]');if(g){closeAll();$(g.dataset.goto).scrollIntoView();return}
    if(e.target.closest('[data-close]')||e.target.classList.contains('ov'))closeAll();
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll()});

  function view(n){
    ['v1','v2','v3','v4','v5'].forEach(function(v,i){$(v).classList.toggle('on',i+1===n)});
    $('d1').className=n===1?'on':'';$('d2').className=n===2?'on':'';$('d3').className=n>=3?'on':'';
    var h=document.querySelector('#o-checkout .modal');if(h)h.scrollTop=0;
  }
  $('go').onclick=function(){var p=PACKS[sel];$('cN').textContent=p[0]+(p[0]===1?' chance':' chances');$('cT').textContent=money(p[1]);$('trM').textContent=money(p[1]);view(1);open('checkout')};
  $('to2').onclick=function(){
    var ok=$('fn').value.trim()&&/^\d{7,9}$/.test($('fd').value.replace(/\D/g,''))&&/^\S+@\S+\.\S+$/.test($('fe').value.trim())&&$('fw').value.trim()&&$('fc').checked;
    $('err').textContent=ok?'':'Completá todos los datos y aceptá las bases.';
    if(ok)view(2);
  };
  $('back1').onclick=function(){view(1)};
  document.querySelectorAll('.pm').forEach(function(b){b.onclick=function(){
    pm=b.dataset.pm;document.querySelectorAll('.pm').forEach(function(x){x.classList.toggle('on',x===b)});
    $('pmp').style.display=pm==='mp'?'':'none';$('ptr').style.display=pm==='tr'?'':'none';
    $('pay').textContent=pm==='mp'?'Pagar con Mercado Pago':'Registrar mi transferencia';$('err2').textContent='';
  }});

  function pad(n){return ('00000'+n).slice(-5)}
  function api(url,opt){return fetch(url,opt).then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok)throw new Error(j.error||'Error de conexión. Intentá de nuevo.');return j})})}
  function showOk(o){
    $('oid').textContent=o.id;$('onums').innerHTML=o.nums.map(function(n){return '<span>'+pad(n)+'</span>'}).join('');view(4);
  }
  function showNote(icon,color,h,p,id){
    var i=$('v5i');i.textContent=icon;i.style.background=color;$('v5h').textContent=h;$('v5p').textContent=p;$('v5o').textContent=id||'';view(5);
  }
  /* Paso 2: crea el pedido en el servidor y, con Mercado Pago, redirige al Checkout Pro */
  $('pay').onclick=function(){
    var btn=$('pay'),p=PACKS[sel],label=btn.textContent;
    $('err2').textContent='';btn.disabled=true;btn.textContent='Un momento…';
    api('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      chances:p[0],name:$('fn').value.trim(),dni:$('fd').value.replace(/\D/g,''),email:$('fe').value.trim(),phone:$('fw').value.trim(),method:pm==='mp'?'mp':'transfer'})
    }).then(function(d){
      if(pm==='mp'&&d.url){btn.textContent='Abriendo Mercado Pago…';location.href=d.url;return}
      btn.disabled=false;btn.textContent=label;
      showNote('✓','#b8f04a','Pedido registrado','Hacé la transferencia indicando este código. Cuando verifiquemos el pago te asignamos tus números.',d.orderId);
    }).catch(function(e){$('err2').textContent=e.message;btn.disabled=false;btn.textContent=label});
  };

  /* Regreso desde Mercado Pago: ?order=MIP-…&t=…&payment_id=… (el webhook puede tardar unos segundos) */
  (function(){
    var q=new URLSearchParams(location.search),id=q.get('order'),t=q.get('t');
    if(!/^MIP-\d{6}$/.test(id||'')||!t)return;
    var pid=q.get('payment_id')||q.get('collection_id')||'',tries=0;
    try{history.replaceState(null,'',location.pathname+location.hash)}catch(e){}
    $('v3t').textContent='Estamos confirmando tu pago con Mercado Pago. No cierres esta ventana.';
    view(3);open('checkout');
    function poll(){
      tries++;
      api('/api/orders/'+id+'?t='+encodeURIComponent(t)+(pid?'&payment_id='+encodeURIComponent(pid):''))
        .then(function(o){
          if(o.status==='approved')return showOk(o);
          if(o.status==='rejected'||o.status==='failed')return showNote('×','#ff8a80','No se pudo completar el pago','Mercado Pago no aprobó el pago. No se te cobró nada. Podés volver a intentarlo con otro medio de pago.',id);
          if(tries<30)return setTimeout(poll,3000);
          showNote('!','#f1c40f','Tu pago está en proceso','Todavía no recibimos la confirmación. Apenas se acredite, tus números quedan asignados. Guardá este código y consultalo en “Buscar mis números”.',id);
        }).catch(function(){if(tries<30)setTimeout(poll,3000);else showNote('!','#f1c40f','No pudimos verificar el pago','Guardá este código y consultalo en “Buscar mis números” en unos minutos.',id)});
    }
    poll();
  })();

  function lookup(q){return api('/api/lookup?q='+encodeURIComponent(q)).then(function(d){return d.orders||[]})}
  function numsHtml(o){return '<p><b>Pedido '+o.id+'</b> · '+o.nums.length+' números</p><div class="nums">'+o.nums.map(function(n){return '<span>'+pad(n)+'</span>'}).join('')+'</div>'}
  $('search').onclick=function(){
    var q=$('q').value.trim(),r=$('res');
    if(!q){r.innerHTML='<p>Ingresá tu email o código de pedido.</p>';return}
    r.innerHTML='<p>Buscando…</p>';
    lookup(q).then(function(L){r.innerHTML=L.length?L.map(numsHtml).join(''):'<p>No encontramos una participación aprobada con ese dato.</p>'})
      .catch(function(e){r.innerHTML='<p>'+e.message+'</p>'});
  };

  var target=new Date('2026-10-18T21:00:00-03:00').getTime();
  function tick(){
    var d=Math.max(0,target-Date.now()),s=Math.floor(d/1000),dd=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),ss=s%60;
    var z=function(n){return ('0'+n).slice(-2)};
    $('cd-d').textContent=z(dd);$('cd-h').textContent=z(h);$('cd-m').textContent=z(m);var e=$('cd-s');if(e.textContent!==z(ss)){e.textContent=z(ss);e.classList.remove('t');void e.offsetWidth;e.classList.add('t')}
  }
  tick();setInterval(tick,1000);


  /* Chat de ayuda (IA simulada, basada en reglas) */
  (function(){
    var B=$('chB'),Q=$('chQ'),F=$('chF'),I=$('chI'),started=false,busy=false;
    var norm=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};
    var esc=function(s){return s.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})};
    function scroll(){B.scrollTop=B.scrollHeight}
    function add(cls,html){var d=document.createElement('div');d.className='ch-m '+cls;d.innerHTML=html;B.appendChild(d);scroll();return d}
    function actions(d,acts){if(!acts||!acts.length)return;var w=document.createElement('div');w.className='ch-act';acts.forEach(function(a){var b=document.createElement('button');b.type='button';b.textContent=a[0];b.setAttribute(a[1],a[2]);w.appendChild(b)});d.appendChild(w);scroll()}
    function reply(text,acts,extra){
      busy=true;var t=document.createElement('div');t.className='ch-m bot ch-t';t.innerHTML='<i></i><i></i><i></i>';B.appendChild(t);scroll();
      setTimeout(function(){
        t.remove();var d=add('bot','');var i=0,step=Math.max(1,Math.round(text.length/45));
        (function type(){i=Math.min(text.length,i+step);d.textContent=text.slice(0,i);scroll();
          if(i<text.length)setTimeout(type,22);else{if(extra)d.insertAdjacentHTML('beforeend',extra);actions(d,acts);busy=false}})();
      },600+Math.random()*500);
    }
    var price=function(i){return PACKS[i][0]+' '+(PACKS[i][0]===1?'chance':'chances')+' por '+money(PACKS[i][1])};
    var A_BUY=['Quiero comprar','data-goto','chances'],A_MIS=['Buscar mis números','data-open','mis'],A_BASES=['Ver bases y condiciones','data-open','bases'];
    function answer(raw){
      var m=norm(raw),code=raw.match(/MIP-?\d{6}/i);
      if(/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|ola)\b/.test(m))return ['¡Hola! 👋 Soy Mia, la asistente de MiPhone Catamarca. Puedo ayudarte con precios, pagos, tus números y las reglas del sorteo. ¿Qué necesitás?'];
      if(/precio|cuesta|cuanto|valor|pack|promo|descuento|barato/.test(m))return ['Estos son los packs más pedidos:\n• '+price(0)+'\n• '+price(4)+' (el más elegido)\n• '+price(6)+'\n• '+price(9)+'\nCuantas más chances, menos pagás por cada una.',[A_BUY]];
      if(/comprar|participar|anotar|chance|quiero entrar|como juego|como participo/.test(m))return ['Es muy simple:\n1) Elegí tu pack de chances.\n2) Completá tus datos.\n3) Pagá con Mercado Pago o transferencia.\n4) Recibís tus números únicos por email.',[A_BUY]];
      if(/pago|pagar|mercado|transfer|tarjeta|comprobante|cobr/.test(m))return ['Podés pagar con Mercado Pago (aprobación inmediata) o con transferencia subiendo el comprobante. Con Mercado Pago pagás en su sitio seguro y tus números se asignan apenas se aprueba el pago.',[A_BUY]];
      if(/numero|mis chances|pedido|codigo|recib|no me llego|email|mail/.test(m))return ['Tus números se asignan apenas el pago queda confirmado, y podés consultarlos cuando quieras con tu email o tu código de pedido (ej: MIP-123456).',[A_MIS]];
      if(/cuando|fecha|hora|sortea|transmi|en vivo|youtube|instagram|dia/.test(m)){var d=Math.max(0,Math.ceil((new Date('2026-10-18T21:00:00-03:00').getTime()-Date.now())/36e5));return ['El sorteo es el 18 de octubre a las 21:00 y se transmite en vivo por YouTube e Instagram.'+(d>0?' Faltan unas '+d+' horas.':' ¡Ya llegó la hora!')]}
      if(/premio|iphone|gana|ganador|que sorteas|que se sortea/.test(m))return ['Se sortean tres premios, uno por extracción, y cada chance participa en las tres. Todos los equipos se entregan nuevos, cerrados y con garantía oficial, con envío incluido a todo el país.',[['Ver premios','data-goto','premios']]];
      if(/regla|base|condicion|requisito|edad|mayor|legal|reglamento|como se asign|aleatori|repet/.test(m))return ['Participan mayores de 18 años con residencia en Argentina. Los números se asignan al azar recién cuando se confirma el pago, nunca se repiten y cada uno juega las tres extracciones.',[A_BASES]];
      if(/envio|entrega|reclamar|retir/.test(m))return ['El envío está incluido y llega a todo el país. Te contactamos para coordinar la entrega y se documenta con una constancia.',[['Ver transparencia','data-open','transp']]];
      if(/humano|persona|asesor|whatsapp|agente|operador|hablar con/.test(m))return ['Soy un asistente automático y no puedo derivarte a una persona desde acá, pero puedo seguir ayudándote con precios, pagos y tus números. 🙂'];
      if(/gracias|genial|perfecto|ok|listo|chau|adios/.test(m))return ['¡De nada! Si necesitás algo más, acá estoy. ¡Mucha suerte en el sorteo! 🍀'];
      return ['No estoy segura de haber entendido 🤔. Puedo ayudarte con: precios, cómo participar, medios de pago, tus números, fecha del sorteo, premios y reglas. ¿Sobre cuál querés saber?',[A_BUY,A_MIS,A_BASES]];
    }
    function send(t){
      t=t.trim();if(!t||busy)return;add('me',esc(t));I.value='';
      var code=t.match(/MIP-?\d{6}/i);
      if(code){
        var id=code[0].toUpperCase().replace(/^MIP-?/,'MIP-');busy=true;
        lookup(id).then(function(L){busy=false;
          if(L.length)reply('Encontré tu pedido '+id+' con '+L[0].nums.length+' números. Participan en las tres extracciones:',[A_MIS],'<div class="nums">'+L[0].nums.map(function(n){return '<span>'+pad(n)+'</span>'}).join('')+'</div>');
          else reply('No encontré ningún pedido aprobado con el código '+id+'. Revisá que esté bien escrito; si pagaste hace pocos minutos, puede tardar en acreditarse.',[A_MIS])
        }).catch(function(){busy=false;reply('No pude consultar el pedido ahora. Probá de nuevo en un rato.',[A_MIS])});
        return;
      }
      var r=answer(t);reply(r[0],r[1],r[2]);
    }
    var SUG=['¿Cuánto cuestan las chances?','¿Cómo participo?','¿Cuándo es el sorteo?','¿Cómo pago?','¿Qué premios hay?','¿Cuáles son las reglas?','¿Cómo recibo mis números?','¿Hay envío?','Hablar con una persona'],PG=3,page=0,pages=Math.ceil(SUG.length/PG);
    var L=$('chL'),R=$('chR'),D=$('chD');
    function draw(){
      Q.innerHTML=SUG.slice(page*PG,page*PG+PG).map(function(s){return '<button type="button">'+s+'</button>'}).join('');
      D.innerHTML=SUG.length?Array.apply(null,Array(pages)).map(function(_,i){return '<i class="'+(i===page?'on':'')+'"></i>'}).join(''):'';
    }
    var BAR=$('chBar'),hov=false,opened=false,rm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
    function pause(){BAR.style.animationPlayState=(hov||!opened||document.hidden)?'paused':'running'}
    function bar(){BAR.classList.remove('run');void BAR.offsetWidth;if(!rm){BAR.classList.add('run');pause()}}
    function go(d){
      Q.classList.toggle('rv',d<0);Q.classList.add('sw');
      setTimeout(function(){page=(page+d+pages)%pages;draw();Q.classList.remove('sw');Q.classList.add('in');void Q.offsetWidth;Q.classList.remove('in')},260);
      bar();
    }
    draw();bar();
    BAR.addEventListener('animationend',function(){go(1)});
    L.onclick=function(){go(-1)};R.onclick=function(){go(1)};
    [Q.parentNode,D].forEach(function(el){el.addEventListener('mouseenter',function(){hov=true;pause()});el.addEventListener('mouseleave',function(){hov=false;pause()})});
    document.addEventListener('visibilitychange',pause);
    new MutationObserver(function(){opened=$('o-ayuda').classList.contains('open');if(opened)bar();pause()}).observe($('o-ayuda'),{attributes:true,attributeFilter:['class']});
    Q.addEventListener('click',function(e){var b=e.target.closest('button');if(b)send(b.textContent)});
    F.addEventListener('submit',function(e){e.preventDefault();send(I.value)});
    new MutationObserver(function(){
      if($('o-ayuda').classList.contains('open')){
        if(!started){started=true;add('bot','¡Hola! 👋 Soy Mia, tu asistente con IA. ¿En qué te puedo ayudar hoy?')}
        setTimeout(function(){I.focus({preventScroll:true})},50);
      }
    }).observe($('o-ayuda'),{attributes:true,attributeFilter:['class']});
  })();

  /* Carrusel de premios continuo: avanza solo y da la vuelta sin saltos (3 -> 1) */
  var prem=$('premios'),tr=$('track'),cv=tr.parentNode,orig=[].slice.call(tr.children),N=orig.length,cnt=$('cnt'),fill=$('barfill');
  var hov=false,inView=true,reduceM=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  function clone(c){var k=c.cloneNode(true);k.setAttribute('aria-hidden','true');[].forEach.call(k.querySelectorAll('[id]'),function(n){n.removeAttribute('id')});return k}
  orig.slice().forEach(function(c){tr.insertBefore(clone(c),orig[0])});
  orig.forEach(function(c){tr.appendChild(clone(c))});
  var all=[].slice.call(tr.children),idx=N;
  function mark(){all.forEach(function(el,k){el.classList.toggle('act',k===idx)});cnt.textContent='0'+((idx%N)+1)+' / 0'+N}
  function place(){var c=all[idx];tr.style.transform='translate3d('+(cv.clientWidth/2-(c.offsetLeft+c.offsetWidth/2))+'px,0,0)'}
  function applyPause(){fill.style.animationPlayState=(hov||!inView||document.hidden)?'paused':'running'}
  function restartBar(){fill.classList.remove('run');void fill.offsetWidth;if(!reduceM){fill.classList.add('run');applyPause()}}
  function silent(fn){tr.classList.add('nj');tr.style.transition='none';fn();void tr.offsetWidth;tr.style.transition='';tr.classList.remove('nj')}
  function normalize(){if(idx>=2*N||idx<N){silent(function(){idx=((idx%N)+N)%N+N;place();mark()})}}
  function go(i){idx=i;place();mark();restartBar()}
  tr.addEventListener('transitionend',function(e){if(e.target===tr&&e.propertyName==='transform')normalize()});
  fill.addEventListener('animationend',function(e){if(e.animationName==='barRun')go(idx+1)});
  $('pprev').onclick=function(){go(idx-1)};$('pnext').onclick=function(){go(idx+1)};
  [cv,fill.parentNode].forEach(function(el){el.addEventListener('mouseenter',function(){hov=true;applyPause()});el.addEventListener('mouseleave',function(){hov=false;applyPause()})});
  var tx=0;cv.addEventListener('touchstart',function(e){tx=e.touches[0].clientX},{passive:true});
  cv.addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-tx;if(Math.abs(d)>45)go(idx+(d<0?1:-1))},{passive:true});
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){inView=es[0].isIntersecting;applyPause()},{threshold:.25}).observe(prem);
  document.addEventListener('visibilitychange',applyPause);
  function initPos(){silent(function(){normalize();place();mark()})}
  window.addEventListener('resize',initPos);window.addEventListener('load',initPos);
  initPos();restartBar();
})();

/* menú: marca la sección que se está viendo */
(function(){var ids=['premios','como-funciona','testimonios','faq'],L=ids.map(function(i){return document.querySelector('.nav ul a[href="#'+i+'"]')}),k=0;
function u(){k=0;var p=innerHeight*.35,a=-1;ids.forEach(function(id,i){var e=document.getElementById(id);if(e&&e.getBoundingClientRect().top<=p)a=i});L.forEach(function(l,i){if(l)l.classList.toggle('on',i===a)})}
addEventListener('scroll',function(){if(!k){k=1;requestAnimationFrame(u)}},{passive:true});u()})();

/* Cómo funciona: la línea se llena con el scroll y enciende cada paso */
(function(){var ol=document.getElementById('steps');if(!ol)return;var li=[].slice.call(ol.children),k=0;
function u(){k=0;var r=ol.getBoundingClientRect(),pr=innerHeight*.6,h=r.height-84,p=Math.min(1,Math.max(0,(pr-r.top-42)/h));ol.style.setProperty('--p',p);
li.forEach(function(e){var c=e.getBoundingClientRect();e.classList.toggle('on',c.top+42<=pr)})}
addEventListener('scroll',function(){if(!k){k=1;requestAnimationFrame(u)}},{passive:true});addEventListener('resize',u);u()})();

/* Acceso Staff: el panel (carpeta staff/) se abre dentro de esta misma página */
(function(){
var box=null;
function openS(push){
  if(!box){box=document.createElement('div');box.className='sf';var f=document.createElement('iframe');f.title='Panel Staff';f.src='staff/index.html';box.appendChild(f);document.body.appendChild(box)}
  box.classList.add('open');document.documentElement.style.overflow='hidden';
  if(push!==false){try{history.pushState({staff:1},'','#staff')}catch(e){location.hash='staff'}}
}
function closeS(){if(box)box.classList.remove('open');document.documentElement.style.overflow=''}
document.addEventListener('click',function(e){var a=e.target.closest('#staffLink');if(a){e.preventDefault();openS()}});
window.addEventListener('message',function(e){if(e.data==='staff-close'){closeS();try{if(location.hash==='#staff')history.back()}catch(x){}}});
window.addEventListener('popstate',function(){if(location.hash==='#staff')openS(false);else closeS()});
if(location.hash==='#staff')openS(false);
})();
