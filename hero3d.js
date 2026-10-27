/* Aufmacher: Bob in Ihren Systemen. Knoten = Systeme, Bob wandert die Verbindungen entlang,
   Abweichungen leuchten rot, Bob läuft hin und klärt sie. three.js r128, pausiert außerhalb des Sichtfelds. */
(function(){
  var host=document.getElementById('hero3d');
  if(!host||!window.THREE)return; var T=THREE;
  var labels=document.createElement('div');labels.className='h-labels';host.appendChild(labels);
  var logEl=document.createElement('ol');logEl.className='h-log';logEl.setAttribute('aria-hidden','true');(host.parentNode||host).appendChild(logEl);
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch(e){return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0,0);host.appendChild(renderer.domElement);
  var scene=new T.Scene();scene.fog=new T.Fog(0x0e0e12,12,30);
  var camera=new T.PerspectiveCamera(34,1,.1,100),look=new T.Vector3(),camBase=new T.Vector3();
  var WHITE=0xffffff,RED=0xcc1922;
  var grid=new T.GridHelper(60,60,0x24252b,0x18191e);grid.position.y=-3.2;scene.add(grid);
  var world=new T.Group();scene.add(world);
  var N=[['Postfach',1.0,2.1,.5],['ERP',3.3,.8,-.8],['DATEV',5.4,2.3,.2],['Teams',5.9,-.5,.9],['CRM',1.7,-1.1,1.1],['Excel',3.9,-2.1,-.4],['Bank',7.0,1.0,-1.2]];
  var E=[[0,1],[0,4],[0,2],[1,2],[1,4],[1,5],[1,3],[2,6],[2,3],[3,5],[4,5],[6,3]];
  var VISIT=['Anfragen gelesen','Preise und Termine geprüft','Rechnung kontiert','Innendienst informiert','Angebot nachgefasst','Liste abgeglichen','Zahlung zugeordnet'];
  var ALERT=['Reklamation mit Frist','Liefertermin verschoben','Rechnung ohne Bestellung','Freigabe offen','Angebot läuft aus','Preis weicht ab','Zahlung fehlt'];
  var nodes=N.map(function(n,i){
    var g=new T.Group();g.position.set(n[1],n[2],n[3]);
    var core=new T.Mesh(new T.SphereGeometry(.11,24,16),new T.MeshBasicMaterial({color:WHITE}));
    var ring=new T.Mesh(new T.RingGeometry(.26,.285,48),new T.MeshBasicMaterial({color:WHITE,transparent:true,opacity:.35,side:T.DoubleSide}));
    var pulse=new T.Mesh(new T.RingGeometry(.26,.3,48),new T.MeshBasicMaterial({color:WHITE,transparent:true,opacity:0,side:T.DoubleSide}));
    g.add(core,ring,pulse);world.add(g);
    var el=document.createElement('div');el.className='h-lb';el.textContent=n[0];labels.appendChild(el);
    return {name:n[0],g:g,core:core,ring:ring,pulse:pulse,p:0,el:el,alert:false,nb:[]};
  });
  E.forEach(function(e){nodes[e[0]].nb.push(e[1]);nodes[e[1]].nb.push(e[0]);});
  var edgeMat=new T.LineBasicMaterial({color:WHITE,transparent:true,opacity:.18});
  E.forEach(function(e){var a=nodes[e[0]].g.position,b=nodes[e[1]].g.position;world.add(new T.Line(new T.BufferGeometry().setFromPoints([a,b]),edgeMat));});
  /* Glow-Textur für Bob */
  var cv=document.createElement('canvas');cv.width=cv.height=64;var cx=cv.getContext('2d'),gr=cx.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');cx.fillStyle=gr;cx.fillRect(0,0,64,64);
  var glowTex=new T.CanvasTexture(cv);
  var bob=new T.Group();var bobCore=new T.Mesh(new T.SphereGeometry(.09,20,14),new T.MeshBasicMaterial({color:WHITE}));
  var glow=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:WHITE,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));glow.scale.set(1.1,1.1,1);
  bob.add(bobCore,glow);world.add(bob);
  /* Spur */
  var TL=70,tp=new Float32Array(TL*3),tc=new Float32Array(TL*3),tg=new T.BufferGeometry();
  tg.setAttribute('position',new T.BufferAttribute(tp,3));tg.setAttribute('color',new T.BufferAttribute(tc,3));
  var trail=new T.Line(tg,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.9}));world.add(trail);var hist=[];
  /* Datenpakete */
  var pk=[],pkGeo=new T.SphereGeometry(.035,8,6);
  function packet(){var e=E[(Math.random()*E.length)|0],f=Math.random()<.5;var m=new T.Mesh(pkGeo,new T.MeshBasicMaterial({color:WHITE,transparent:true,opacity:.6}));world.add(m);pk.push({m:m,a:nodes[f?e[0]:e[1]].g.position,b:nodes[f?e[1]:e[0]].g.position,t:0,d:1.2+Math.random()});}
  /* Logik */
  var cur=0,prev=-1,to=1,t0=0,dur=1,clock=7*60+42,tm=0,alertAt=-1;
  bob.position.copy(nodes[0].g.position);
  function hhmm(){var h=(clock/60|0),m=clock%60;return (h<10?'0':'')+h+':'+(m<10?'0':'')+m;}
  function log(txt,red){var li=document.createElement('li');if(red)li.className='r';li.innerHTML='<time>'+hhmm()+'</time><span>'+txt+'</span>';logEl.insertBefore(li,logEl.firstChild);while(logEl.children.length>4)logEl.removeChild(logEl.lastChild);}
  function path(a,b){var q=[a],from={};from[a]=-1;while(q.length){var x=q.shift();if(x===b)break;nodes[x].nb.forEach(function(y){if(!(y in from)){from[y]=x;q.push(y);}});}var p=[],x=b;while(x!==a&&x!==-1&&x!==undefined){p.unshift(x);x=from[x];}return p;}
  function pick(){if(alertAt>=0&&alertAt!==cur){return path(cur,alertAt)[0];}var nb=nodes[cur].nb.filter(function(n){return n!==prev;});return nb[(Math.random()*nb.length)|0];}
  function depart(now){prev=cur;to=pick();var d=nodes[cur].g.position.distanceTo(nodes[to].g.position);dur=d/2.4;t0=now;}
  function arrive(now){cur=to;var n=nodes[cur];n.p=1;clock+=1+(Math.random()*2|0);
    if(n.alert){n.alert=false;alertAt=-1;setCol(n,WHITE);log(n.name+' · Rückfrage vorbereitet ✓',false);}
    else log(n.name+' · '+VISIT[cur],false);
    depart(now+.35);}
  function setCol(n,c){n.core.material.color.setHex(c);n.ring.material.color.setHex(c);n.pulse.material.color.setHex(c);n.el.classList.toggle('r',c===RED);}
  function raise(){var c=[];nodes.forEach(function(n,i){if(i!==cur&&i!==to&&!n.alert)c.push(i);});var i=c[(Math.random()*c.length)|0];nodes[i].alert=true;alertAt=i;setCol(nodes[i],RED);clock+=1;log(nodes[i].name+' · '+ALERT[i],true);}
  /* Größe und Kamera */
  function size(){var w=host.clientWidth||1,h=host.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;
    if(camera.aspect<.9){camera.fov=50;camBase.set(4.0,1.6,17);look.set(4.0,-4.3,0);}else{camera.fov=34;camBase.set(-3.2,1.6,15);look.set(-.4,-.6,0);}camera.updateProjectionMatrix();}
  size();if('ResizeObserver' in window)new ResizeObserver(size).observe(host);else addEventListener('resize',size);
  var mx=0,my=0;addEventListener('pointermove',function(e){mx=e.clientX/innerWidth*2-1;my=e.clientY/innerHeight*2-1;},{passive:true});
  var v=new T.Vector3(),last=performance.now()/1000,nextAlert=4,nextPk=0;
  depart(0);
  function step(now){var dt=Math.min(.05,Math.max(0,now-last));last=now;tm+=dt;
    camera.position.x+=(camBase.x+mx*1.0-camera.position.x)*.04;camera.position.y+=(camBase.y-my*.6-camera.position.y)*.04;camera.position.z=camBase.z;camera.lookAt(look);
    world.rotation.y=Math.sin(tm*.12)*.12;
    /* Bob */
    if(tm>=t0){var k=Math.min(1,(tm-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;bob.position.lerpVectors(nodes[cur].g.position,nodes[to].g.position,e);if(k>=1)arrive(tm);}
    glow.scale.setScalar(1+Math.sin(tm*5)*.08);
    hist.unshift(bob.position.clone());if(hist.length>TL)hist.pop();
    for(var i=0;i<TL;i++){var p=hist[Math.min(i,hist.length-1)],f=1-i/TL;tp[i*3]=p.x;tp[i*3+1]=p.y;tp[i*3+2]=p.z;tc[i*3]=tc[i*3+1]=tc[i*3+2]=f*f;}
    tg.attributes.position.needsUpdate=true;tg.attributes.color.needsUpdate=true;
    /* Knoten */
    nodes.forEach(function(n){n.p*=.94;var s=1+(1-n.p)*1.6;n.pulse.scale.setScalar(n.alert?1+((tm*1.4)%1)*1.4:s);n.pulse.material.opacity=n.alert?(1-((tm*1.4)%1))*.8:n.p*.7;
      n.ring.lookAt(camera.position);n.pulse.lookAt(camera.position);n.core.scale.setScalar(n.alert?1.25+Math.sin(tm*6)*.15:1+n.p*.5);});
    if(alertAt<0&&tm>nextAlert){raise();nextAlert=tm+9+Math.random()*4;}
    if(tm>nextPk){packet();nextPk=tm+.35;}
    for(var j=pk.length-1;j>=0;j--){var q=pk[j];q.t+=dt/q.d;q.m.position.lerpVectors(q.a,q.b,q.t);q.m.material.opacity=Math.sin(Math.PI*Math.min(1,q.t))*.6;if(q.t>=1){world.remove(q.m);q.m.material.dispose();pk.splice(j,1);}}
    renderer.render(scene,camera);
    /* Beschriftungen */
    var W=host.clientWidth,H=host.clientHeight;nodes.forEach(function(n){n.g.getWorldPosition(v);v.project(camera);n.el.style.transform='translate('+((v.x*.5+.5)*W+14)+'px,'+((-v.y*.5+.5)*H-8)+'px)';});
  }
  last=0;for(var w=0;w<240;w++)step(w/60);
  log('Postfach · '+VISIT[0]);
  if(reduce){renderer.render(scene,camera);return;}
  var base=performance.now()/1000-tm,running=false,raf=0,pausedAt=0;last=tm;
  function loop(){step(performance.now()/1000-base);raf=requestAnimationFrame(loop);}
  function start(){if(running)return;running=true;base+=performance.now()/1000-pausedAt;last=performance.now()/1000-base;raf=requestAnimationFrame(loop);}
  function stop(){if(!running)return;running=false;pausedAt=performance.now()/1000;cancelAnimationFrame(raf);}
  pausedAt=performance.now()/1000;
  if('IntersectionObserver' in window){new IntersectionObserver(function(es){es[0].isIntersecting?start():stop();},{threshold:.05}).observe(host);}else start();
  document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
})();
