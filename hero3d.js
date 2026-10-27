/* Aufmacher: Stapel wird zu Liste. Ein unordentlicher Stapel aus Mails, PDFs, Listen und Notizen;
   Bob zieht Blatt für Blatt heraus und legt es rechts als erledigte Zeile ab. Ein Fall geht rot an Sie.
   three.js r128, Liste als HTML für scharfen Text, pausiert außerhalb des Sichtfelds. */
(function(){
  var host=document.getElementById('hero3d');
  if(!host||!window.THREE)return;var T=THREE;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch(e){return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0,0);host.appendChild(renderer.domElement);
  var labels=document.createElement('div');labels.className='h-labels';host.appendChild(labels);
  var scene=new T.Scene();scene.fog=new T.Fog(0x0e0e12,13,30);
  var camera=new T.PerspectiveCamera(34,1,.1,100),look=new T.Vector3(),camBase=new T.Vector3();
  var grid=new T.GridHelper(60,60,0x24252b,0x18191e);grid.position.y=-3.2;scene.add(grid);
  var MONO='"IBM Plex Mono", ui-monospace, monospace';
  function docTex(kind,red){var c=document.createElement('canvas');c.width=256;c.height=340;var x=c.getContext('2d');
    x.fillStyle='rgba(22,23,29,0.94)';x.fillRect(0,0,256,340);x.strokeStyle=red?'#CC1922':'rgba(255,255,255,0.9)';x.lineWidth=5;x.strokeRect(4,4,248,332);
    x.fillStyle=red?'#FF4D57':'#fff';x.font='600 30px '+MONO;x.fillText(kind,22,52);
    x.fillStyle='rgba(255,255,255,0.28)';[[86,190],[118,150],[150,200],[182,120],[214,170],[246,140]].forEach(function(r){x.fillRect(22,r[0],r[1],10);});
    if(kind==='MAIL'){x.strokeStyle='rgba(255,255,255,0.5)';x.lineWidth=3;x.strokeRect(170,24,62,42);x.beginPath();x.moveTo(170,24);x.lineTo(201,48);x.lineTo(232,24);x.stroke();}
    if(kind==='XLS'){x.strokeStyle='rgba(255,255,255,0.35)';x.lineWidth=2;for(var r2=0;r2<4;r2++)for(var c2=0;c2<4;c2++)x.strokeRect(22+c2*52,270+r2*14,52,14);}
    var t=new T.CanvasTexture(c);t.anisotropy=4;return t;}
  var KINDS=['MAIL','PDF','XLS','SCAN','NOTIZ','PDF','MAIL'];
  var ROWS=[['Ohlsen · Angebot vorbereitet',0],['Kühn · Rechnung geprüft',0],['Kessler · Sonderteil · an Sie',1],['Brandt · Bestellung erfasst',0],['Stahl Peters · Termin bestätigt',0],['Jansen · Angebot vorbereitet',0],['Lenz · Preis abgeglichen',0],
            ['Meyer · Lieferschein zugeordnet',0],['Nord · Reklamation aufgenommen',0],['Brandt · Zahlung zugeordnet',0],['Kühn · Dublette · an Sie',1],['Ohlsen · Rückfrage beantwortet',0],['Jansen · Auftrag bestätigt',0],['Lenz · Gutschrift geprüft',0]];
  var NR=7,S=new T.Vector3(),LA=new T.Vector3(),LP={x:0,y:0};
  /* HTML-Liste */
  var list=document.createElement('div');list.className='h-list';list.innerHTML='<div class="h-list-h">Erledigt · <b>0</b></div><ol></ol>';labels.appendChild(list);
  var ol=list.querySelector('ol'),cnt=list.querySelector('b');
  var lbIn=document.createElement('div');lbIn.className='h-lb';labels.appendChild(lbIn);
  var docGeo=new T.PlaneGeometry(.8,1.06),docs=[],batch=0,order=[];
  function mkDocs(){docs.forEach(function(d){scene.remove(d.m);});docs=[];order=[];NR=mobile?4:7;
    for(var i=0;i<NR;i++){var r=ROWS[(batch*NR+i)%ROWS.length];
      var m=new T.Mesh(docGeo,new T.MeshBasicMaterial({map:docTex(KINDS[(i+batch)%KINDS.length],false),transparent:true,depthWrite:false,side:T.DoubleSide}));
      var d={m:m,red:!!r[1],txt:r[0],kind:KINDS[(i+batch)%KINDS.length],ph:Math.random()*6,off:new T.Vector3((Math.random()-.5)*.7,i*.09,-i*.04+(Math.random()-.5)*.2),
        rot:new T.Euler((Math.random()-.5)*.5,(Math.random()-.5)*.6,(Math.random()-.5)*1.1)};
      m.position.copy(S).add(d.off).add(new T.Vector3(0,6+i*.6,0));m.rotation.copy(d.rot);m.renderOrder=i;scene.add(m);docs.push(d);}
    /* Reihenfolge so wählen, dass die Liste von oben nach unten der ROWS-Reihenfolge folgt */
    for(var j=NR-1;j>=0;j--)order.push(docs[j]);
    order.forEach(function(d,k){var r=ROWS[(batch*NR+k)%ROWS.length];d.txt=r[0];d.red=!!r[1];});
    batch++;}
  function addRow(d){var li=document.createElement('li');if(d.red)li.className='r';li.innerHTML='<i>'+(d.red?'!':'✓')+'</i><span>'+d.txt+'</span>';ol.appendChild(li);cnt.textContent=ol.children.length;}
  /* Bob */
  var cv=document.createElement('canvas');cv.width=cv.height=64;var cx=cv.getContext('2d'),gr=cx.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=gr;cx.fillRect(0,0,64,64);
  var bob=new T.Group(),glow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
  bob.add(new T.Mesh(new T.SphereGeometry(.08,20,14),new T.MeshBasicMaterial({color:0xffffff})),glow);scene.add(bob);
  /* Kamera und Anordnung */
  var v=new T.Vector3(),tmp=new T.Vector3(),dir=new T.Vector3();
  var mobile=false;
  function size(){var w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;mobile=camera.aspect<.9;
    camera.fov=mobile?44:34;camBase.set(0,.6,15);look.set(0,0,0);camera.updateProjectionMatrix();
    camera.position.copy(camBase);camera.lookAt(look);camera.updateMatrixWorld();
    /* Anordnung in Bildschirm-Anteilen: Stapel oben, Liste darunter, bündig mit dem Inhaltsrand */
    var cr=Math.min(w-16,(w+1180)/2-Math.max(16,Math.min(48,w*.04))),lw=list.offsetWidth||300;
    if(mobile){LP.x=Math.max(16,w*.36);LP.y=h*.07;toWorld(w*.17,h*.2,S);}
    else{LP.x=cr-lw;LP.y=h*.38;toWorld(LP.x+lw*.42,h*.2,S);}
    toWorld(LP.x+lw,LP.y+h*.3,LA);}
  size();if('ResizeObserver' in window)new ResizeObserver(size).observe(host);else addEventListener('resize',size);
  var mx=0,my=0;addEventListener('pointermove',function(e){mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1;},{passive:true});
  function proj(p){v.copy(p).project(camera);return {x:(v.x*.5+.5)*host.clientWidth,y:(-v.y*.5+.5)*host.clientHeight};}
  function toWorld(px,py,out){v.set(px/host.clientWidth*2-1,-(py/host.clientHeight)*2+1,.5).unproject(camera);dir.copy(v).sub(camera.position).normalize();var t=-camera.position.z/dir.z;return out.copy(camera.position).addScaledVector(dir,t);}
  function slotWorld(i,out){var h=list.querySelector('.h-list-h').offsetHeight,lw=list.offsetWidth;
    var rowH=parseFloat(getComputedStyle(list).getPropertyValue('--row'))||36;
    return toWorld(LP.x+lw*.5,LP.y+h+10+i*rowH+rowH*.45,out);}
  function ease(k){return k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;}
  function bez(a,b,h,k,out){var c=tmp.set((a.x+b.x)/2,Math.max(a.y,b.y)+h,(a.z+b.z)/2+.8),u=1-k;return out.set(u*u*a.x+2*u*k*c.x+k*k*b.x,u*u*a.y+2*u*k*c.y+k*k*b.y,u*u*a.z+2*u*k*c.z+k*k*b.z);}
  var st='drop',t0=0,tm=0,last=0,cur=null,from=new T.Vector3(),to=new T.Vector3(),hold=new T.Vector3();
  mkDocs();bob.position.set(S.x+1.2,S.y+3,.6);
  function step(now){var dt=Math.min(.05,Math.max(0,now-last));last=now;tm+=dt;
    camera.position.x+=(camBase.x+mx*1.0-camera.position.x)*.04;camera.position.y+=(camBase.y-my*.6-camera.position.y)*.04;camera.position.z=camBase.z;camera.lookAt(look);
    docs.forEach(function(d,i){if(d===cur||d.gone)return;var tg=hold.copy(S).add(d.off);tg.y+=Math.sin(tm*1.2+d.ph)*.03;d.m.position.lerp(tg,st==='drop'?.06+i*.004:.12);d.m.rotation.z+=(d.rot.z+Math.sin(tm*.8+d.ph)*.03-d.m.rotation.z)*.1;});
    var nxt=null;for(var i=0;i<order.length;i++){if(!order[i].gone){nxt=order[i];break;}}
    if(st==='drop'){if(tm-t0>1.6){st='fetch';t0=tm;from.copy(bob.position);}}
    else if(st==='fetch'){if(!nxt){st='hold';t0=tm;}else{var k=ease(Math.min(1,(tm-t0)/.55));bob.position.lerpVectors(from,hold.copy(nxt.m.position).add(tmp.set(0,.65,.15)),k);
        if(k>=1){cur=nxt;st='carry';t0=tm;from.copy(cur.m.position);slotWorld(ol.children.length,to);if(cur.red){cur.m.material.map=docTex(cur.kind,true);cur.m.material.needsUpdate=true;}}}}
    else if(st==='carry'){var k2=ease(Math.min(1,(tm-t0)/1.05));bez(from,to,1.0,k2,cur.m.position);cur.m.rotation.x*=.9;cur.m.rotation.y*=.9;cur.m.rotation.z*=.88;
      var s=1-k2*.6;cur.m.scale.set(s,s,s);cur.m.material.opacity=k2<.75?1:Math.max(0,1-(k2-.75)/.25);
      bob.position.copy(cur.m.position).add(tmp.set(0,.5*s,.1));
      if(k2>.8&&!cur.added){cur.added=true;addRow(cur);}
      if(k2>=1){cur.gone=true;scene.remove(cur.m);cur=null;st=ol.children.length>=NR?'hold':'fetch';t0=tm;from.copy(bob.position);}}
    else if(st==='hold'){bob.position.lerp(hold.copy(LA).add(tmp.set(.3,0,.4)),.04);if(tm-t0>2.6){st='clear';t0=tm;list.classList.add('out');}}
    else if(st==='clear'){if(tm-t0>.6){ol.innerHTML='';cnt.textContent='0';list.classList.remove('out');mkDocs();st='drop';t0=tm;}}
    glow.scale.setScalar(1+Math.sin(tm*5)*.08);
    renderer.render(scene,camera);
    list.style.transform='translate('+LP.x+'px,'+LP.y+'px)';
    var left=docs.filter(function(d){return !d.gone&&d!==cur;}).length,b=proj(hold.copy(S).add(tmp.set(-.5,1.05,0)));
    lbIn.style.transform='translate('+b.x+'px,'+b.y+'px)';lbIn.textContent='Eingang · '+left;
  }
  for(var w=0;w<30;w++)step(w/60);
  if(reduce){for(var q=0;q<NR;q++)addRow(order[q]);order.forEach(function(d){d.gone=true;scene.remove(d.m);});step(tm+.01);renderer.render(scene,camera);return;}
  var base=performance.now()/1000-tm,running=false,raf=0,pausedAt=performance.now()/1000;last=tm;
  function loop(){step(performance.now()/1000-base);raf=requestAnimationFrame(loop);}
  function start(){if(running)return;running=true;base+=performance.now()/1000-pausedAt;last=performance.now()/1000-base;raf=requestAnimationFrame(loop);}
  function stop(){if(!running)return;running=false;pausedAt=performance.now()/1000;cancelAnimationFrame(raf);}
  function vis(){var r=host.getBoundingClientRect();return r.bottom>0&&r.top<(innerHeight||document.documentElement.clientHeight);}
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){es[0].isIntersecting?start():stop();},{threshold:.05}).observe(host);}else start();
  function chk(){if(!document.hidden&&vis())start();}chk();addEventListener('load',chk);addEventListener('scroll',chk,{passive:true});
  document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
})();
