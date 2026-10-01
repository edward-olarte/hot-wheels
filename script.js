(() => {
  'use strict';
  const canvas = document.getElementById('garden');
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('gardenWrap');
  const experience = document.getElementById('experience');
  const flowers = [];
  const motes = [];
  const snowflakes = [];
  const heartParticles = [];
  const packageImages = ['hotwheels-ferrari-f40.png','hotwheels-ferrari-sf90.png','hotwheels-lamborghini-huracan.png','hotwheels-lamborghini-centenario.png','hotwheels-lamborghini-gallardo.png'].map(src=>{const img=new Image();img.src=src;img.onload=()=>draw(0);return img;});
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0, height = 0, dpr = 1, paused = false, breeze = 0, targetBreeze = 0;
  let lastTime = 0, toastTimer;
  const palette = [
    {petal:'#529fd0', edge:'#b6e9f4', shadow:'#28649f', heart:'#31b9ec'},
    {petal:'#73c4df', edge:'#d9f4f3', shadow:'#3a8cab', heart:'#238fdb'},
    {petal:'#8aa8e5', edge:'#dbe5ff', shadow:'#536cae', heart:'#56b7f2'},
    {petal:'#b1dce9', edge:'#effbfa', shadow:'#6cacc3', heart:'#45cce5'},
    {petal:'#4b83bc', edge:'#a9d1ee', shadow:'#284e88', heart:'#2783dc'}
  ];
  const rand=(a,b)=>a+Math.random()*(b-a);
  function seedSnow(){
    snowflakes.length=0;
    const count=Math.max(22,Math.min(76,Math.round(width*height/15000)));
    for(let i=0;i<count;i++) snowflakes.push({x:rand(0,width),y:reducedMotion?rand(0,height):-rand(0,height*.32),radius:rand(.55,1.35),speed:rand(18,34),drift:rand(4,14),phase:rand(0,Math.PI*2),alpha:rand(.15,.34)});
  }
  function resize(){
    const r=wrap.getBoundingClientRect(); dpr=Math.min(devicePixelRatio||1,2);
    width=r.width; height=r.height; canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    seedSnow();
    if(!flowers.length) seed(); else reseat(); draw(0);
  }
  function seed(){
    const mobile=width<600, centerX=width*.54, baseY=height*(mobile?.98:.98);
    const n=14;
    for(let i=0;i<n;i++){
      const depth=rand(.52,1);
      const x=centerX+rand(-width*.035,width*.035);
      const f=makeFlower(x,baseY+rand(-height*.016,height*.012),depth,i);
      f.tall=height*(.24+depth*.24)*(mobile?.92:1);
      f.lean=rand(-.24,.24);
      f.size=(mobile?rand(52,68):rand(60,76))*depth;
      f.packageIndex=i===2?0:i===6?1:i===1?2:i===4?3:i===8?4:-1;
      if(f.packageIndex>=0){const offsets=[-.22,.22,-.11,.11,0],heights=[.39,.39,.44,.44,.41];f.x=centerX+rand(-width*.025,width*.025);f.tall=height*heights[f.packageIndex];f.lean=(centerX+width*offsets[f.packageIndex]-f.x)/f.tall;f.sway=.12;}
      flowers.push(f);
    }
    for(let i=0;i<38;i++) motes.push({x:rand(0,width),y:rand(height*.15,height*.88),r:rand(.45,1.5),phase:rand(0,7),speed:rand(.3,1.2),drift:rand(5,22)});
  }
  function makeFlower(x,y,depth,i){
    const tall=height*(.25+depth*.31)* (width<600?.83:1);
    const type='daisy';
    return {x,y,depth,tall,phase:rand(0,Math.PI*2),speed:rand(.32,.62),lean:rand(-.2,.2),size:(width<600?rand(12,22):rand(13,27))*depth,color:palette[Math.floor(rand(0,palette.length))],type,tilt:rand(-.24,.24),sway:rand(.35,.65),buds:Math.random()>.38?Math.floor(rand(1,4)):0,seed:rand(0,1000)};
  }
  function reseat(){
    const mobile=width<600, centerX=width*.54, baseY=height*(mobile?.98:.98);
    flowers.forEach((f,i)=>{f.x=centerX+rand(-width*.035,width*.035);f.y=baseY+rand(-height*.016,height*.012);f.tall=height*(.24+f.depth*.24)*(mobile?.92:1);f.lean=rand(-.24,.24);f.size=(mobile?rand(52,68):rand(60,76))*f.depth;if(f.packageIndex>=0){const offsets=[-.22,.22,-.11,.11,0],heights=[.39,.39,.44,.44,.41];f.x=centerX+rand(-width*.025,width*.025);f.tall=height*heights[f.packageIndex];f.lean=(centerX+width*offsets[f.packageIndex]-f.x)/f.tall;f.sway=.12;}});
  }
  function stemPath(f,t,scale=1){
    const sway=(Math.sin(t*f.speed+f.phase)*f.sway+breeze*.8)*f.depth;
    const topX=f.x+sway*f.tall*.48+f.lean*f.tall;
    const topY=f.y-f.tall;
    return {sway,topX,topY,draw(){ctx.beginPath();ctx.moveTo(f.x,f.y+4);ctx.bezierCurveTo(f.x+sway*f.tall*.12,f.y-f.tall*.33,topX-sway*f.tall*.16,topY+f.tall*.28,topX,topY)}};
  }
  function leaf(x,y,len,angle,phase){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.sin(phase)*.035);
    ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(len*.28,-len*.52,len*.85,-len*.42,len,-len*.08);ctx.bezierCurveTo(len*.72,len*.22,len*.28,len*.2,0,0);
    const g=ctx.createLinearGradient(0,0,len,-len*.15);g.addColorStop(0,'#153c27');g.addColorStop(.55,'#397d43');g.addColorStop(1,'#a5d96f');ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*.49,-len*.12,len*.91,-len*.1);ctx.strokeStyle='rgba(196,239,151,.72)';ctx.lineWidth=.6;ctx.stroke();ctx.restore();
  }
  function petalPath(ctx,rx,ry){ctx.beginPath();ctx.ellipse(0,-ry*.52,rx*.7,ry*.47,0,0,Math.PI*2)}
  function drawBloom(x,y,size,flower,t){
    const {color,type}=flower; const open=flower.open??1; const petals=type==='daisy'?12:type==='cosmos'?9:8;
    ctx.save();ctx.translate(x,y);ctx.rotate(flower.tilt+Math.sin(t*.32+flower.phase)*.1+breeze*.18);
    ctx.scale(open,open);
    // A fine translucent cup gives each flower a layered, luminous edge.
    for(let ring=1;ring>=0;ring--){
      const count=ring?petals:petals;
      for(let i=0;i<count;i++){
        const a=(Math.PI*2/count)*i+(ring?.12:0)+Math.sin(t*.55+flower.phase+i*.9)*.025;
        ctx.save();ctx.rotate(a);
        const rx=size*(type==='cosmos'?.37:.43)*(ring?.78:1), ry=size*(type==='cosmos'?1.15:1.05)*(ring?.78:1);
        const grad=ctx.createLinearGradient(0,-size*.1,0,-ry);grad.addColorStop(0,color.shadow);grad.addColorStop(.28,color.petal);grad.addColorStop(.82,color.edge);grad.addColorStop(1,'rgba(255,249,220,.9)');
        petalPath(ctx,rx,ry);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle='rgba(255,240,213,.28)';ctx.lineWidth=.55;ctx.stroke();
        // Petal vein, drawn as a delicate curve.
        ctx.beginPath();ctx.moveTo(0,-size*.17);ctx.quadraticCurveTo(rx*.06,-size*.55,0,-ry*.88);ctx.strokeStyle='rgba(255,246,219,.26)';ctx.lineWidth=.45;ctx.stroke();ctx.restore();
      }
    }
    const packageIndex=flower.packageIndex??-1;
    if(packageIndex>=0 && packageImages[packageIndex]?.complete && packageImages[packageIndex].naturalWidth){
      const pw=size*.78, ph=pw*(packageImages[packageIndex].naturalHeight/packageImages[packageIndex].naturalWidth);
      ctx.save();ctx.shadowColor='rgba(38,177,255,.65)';ctx.shadowBlur=14;ctx.fillStyle='#45baf3';ctx.beginPath();ctx.roundRect(-pw/2-3,-ph/2-3,pw+6,ph+6,6);ctx.fill();ctx.shadowBlur=0;
      ctx.beginPath();ctx.roundRect(-pw/2,-ph/2,pw,ph,4);ctx.clip();ctx.drawImage(packageImages[packageIndex],-pw/2,-ph/2,pw,ph);ctx.restore();
    } else {
      const center=size*.25;const cg=ctx.createRadialGradient(-center*.28,-center*.35,0,0,0,center*1.5);cg.addColorStop(0,'#183c68');cg.addColorStop(.35,'#0b1c31');cg.addColorStop(1,'#03070d');
      ctx.beginPath();ctx.arc(0,0,center,0,Math.PI*2);ctx.fillStyle=cg;ctx.fill();
      for(let i=0;i<19;i++){const a=i*2.4+flower.seed;const rr=center*rand(.22,.84);ctx.beginPath();ctx.arc(Math.cos(a)*rr,Math.sin(a)*rr,rand(.35,.85),0,Math.PI*2);ctx.fillStyle=i%3?'rgba(69,161,232,.92)':'rgba(25,85,151,.9)';ctx.fill()}
    }
    ctx.restore();
  }
  function drawFlower(f,t){
    const s=stemPath(f,t);s.draw();
    const stemGrad=ctx.createLinearGradient(f.x,f.y,s.topX,s.topY);stemGrad.addColorStop(0,'#153c26');stemGrad.addColorStop(.55,'#397943');stemGrad.addColorStop(1,'#a0d966');ctx.strokeStyle=stemGrad;ctx.lineWidth=1.1+f.depth*1.05;ctx.lineCap='round';ctx.stroke();
    const leafCount=4+f.buds;
    for(let i=0;i<leafCount;i++){
      const p=.3+i*(.42/Math.max(leafCount-1,1));const y=f.y-f.tall*p;const x=f.x+s.sway*f.tall*p*.45+f.lean*f.tall*p;const side=i%2?1:-1;
      leaf(x,y,f.size*(1.18+(i%2)*.2),side*(.55+f.depth*.22),t*f.speed+f.phase);
    }
    // Small side buds and occasional unopened growth keep the silhouettes natural.
    for(let i=0;i<f.buds;i++){
      const p=.75+i*.055;const bx=f.x+s.sway*f.tall*p*.48+f.lean*f.tall*p+(i%2?1:-1)*f.size*.4;const by=f.y-f.tall*p;
      ctx.beginPath();ctx.ellipse(bx,by,f.size*.16,f.size*.36,-.35,0,Math.PI*2);ctx.fillStyle=i%2?'#8bc75e':'#397943';ctx.fill();
    }
    const open=(f.open??(f.depth>.88?.98:.9))*(1+Math.sin(t*.8+f.phase)*.045);drawBloom(s.topX,s.topY+Math.sin(t*.45+f.phase)*2.8,f.size, {...f,open},t);
  }
  function drawTrackAndCars(t){
    const pts=[];for(let i=0;i<=80;i++){const u=i/80;pts.push({x:-width*.08+u*width*1.16,y:height*.815+Math.sin(u*Math.PI*2.05+.4)*height*.038+Math.sin(u*Math.PI*4.1)*height*.009})}
    ctx.save();ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(9,17,18,.76)';ctx.lineWidth=Math.max(18,width*.035);ctx.stroke();ctx.strokeStyle='rgba(204,190,140,.22)';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([8,10]);ctx.lineDashOffset=-t*13;ctx.strokeStyle='rgba(227,218,171,.34)';ctx.lineWidth=1;ctx.stroke();ctx.setLineDash([]);
    const cars=[{offset:0,color:'#e63e32',accent:'#ffcc73'},{offset:.34,color:'#e6b93f',accent:'#fff0b0'},{offset:.68,color:'#9fb787',accent:'#e6f2c5'}];cars.forEach((car,i)=>{const u=((t*(.055+i*.003)+car.offset)%1),idx=Math.min(pts.length-2,Math.floor(u*(pts.length-1))),a=pts[idx],b=pts[idx+1];ctx.save();ctx.translate(a.x,a.y-7);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));ctx.scale(width<600?.67:.9,width<600?.67:.9);ctx.shadowColor='rgba(230,155,78,.36)';ctx.shadowBlur=9;ctx.beginPath();ctx.moveTo(-25,4);ctx.lineTo(-22,-2);ctx.lineTo(-13,-4);ctx.lineTo(-7,-12);ctx.quadraticCurveTo(-4,-15,3,-14);ctx.lineTo(13,-12);ctx.lineTo(20,-5);ctx.lineTo(25,-3);ctx.lineTo(27,4);ctx.lineTo(24,7);ctx.lineTo(-23,7);ctx.closePath();ctx.fillStyle=car.color;ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(-9,-5);ctx.lineTo(-5,-11);ctx.quadraticCurveTo(-3,-12,2,-11);ctx.lineTo(8,-9);ctx.lineTo(12,-5);ctx.closePath();ctx.fillStyle='rgba(183,219,206,.88)';ctx.fill();ctx.strokeStyle='rgba(255,244,206,.52)';ctx.lineWidth=.7;ctx.stroke();ctx.beginPath();ctx.moveTo(-22,1);ctx.quadraticCurveTo(0,-1,21,1);ctx.strokeStyle=car.accent;ctx.lineWidth=1.5;ctx.stroke();[-15,16].forEach(x=>{ctx.beginPath();ctx.arc(x,6,5,0,Math.PI*2);ctx.fillStyle='#111919';ctx.fill();ctx.beginPath();ctx.arc(x,6,2.1,0,Math.PI*2);ctx.fillStyle='#aeb5a2';ctx.fill()});ctx.fillStyle='#fff2ba';ctx.shadowColor='#ffdf93';ctx.shadowBlur=7;ctx.fillRect(23,-1,2,2);ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(-31,-1);ctx.lineTo(-25,2);ctx.fillStyle='rgba(246,143,78,.68)';ctx.fill();ctx.restore()});ctx.restore();
  }
  function drawGrass(t){
    const base=height*.995, center=width*.54;
    for(let i=0;i<20;i++){
      const u=(i+.5)/20, side=u<.5?-1:1;
      const x=center+(u-.5)*width*.08;
      const len=height*(.25+(((i*37)%19)/19)*.15);
      const sway=Math.sin(t*.72+i*1.7)*18, tipX=x+side*len*(.24+((i*13)%7)*.025)+sway;
      const bladeW=9+((i*11)%8), hue=i%3;
      ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x+sway+side*bladeW,base-len*.62,tipX,base-len);ctx.quadraticCurveTo(x+sway-side*bladeW,base-len*.48,x,base);
      const grad=ctx.createLinearGradient(x,base,tipX,base-len);grad.addColorStop(0,'#254b2d');grad.addColorStop(.55,hue===0?'#619b3e':'#7eb94d');grad.addColorStop(1,hue===2?'#d0f29a':'#a9db70');ctx.fillStyle=grad;ctx.globalAlpha=.84;ctx.fill();ctx.globalAlpha=1;
      if(i%2===0){ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x+sway*.55,base-len*.55,tipX,base-len);ctx.strokeStyle='rgba(216,249,162,.78)';ctx.lineWidth=.65;ctx.stroke()}
    }
  }
  function drawBareBranches(t){
    const base=height*.98, center=width*.54;
    [-1,1,-.62,.62].forEach((side,i)=>{
      const len=height*(.32+(i%2)*.1), root=center+side*width*.035, tip=root+side*len*.48;
      const sway=Math.sin(t*.42+i)*8;
      ctx.beginPath();ctx.moveTo(root,base);ctx.quadraticCurveTo(root+side*len*.12+sway,base-len*.58,tip+sway,base-len);
      const stem=ctx.createLinearGradient(root,base,tip,base-len);stem.addColorStop(0,'#183f29');stem.addColorStop(1,'#73b94d');ctx.strokeStyle=stem;ctx.lineWidth=2.3;ctx.lineCap='round';ctx.stroke();
      for(let j=1;j<=4;j++){const q=j/5,x=root+(tip-root)*q+sway*q,y=base-len*q;leaf(x,y,len*.2,(j%2?1:-1)*(.56+side*.08),t*.45+i+j)}
    });
  }
  function drawSnow(t,dt){
    snowflakes.forEach(f=>{
      if(!reducedMotion){
        f.y+=f.speed*dt;
        if(f.y>height+4){f.y=-rand(8,height*.12);f.x=rand(0,width)}
      }
      const x=(f.x+(reducedMotion?0:Math.sin(t*.24+f.phase)*f.drift)+width)%width;
      ctx.beginPath();ctx.arc(x,f.y,f.radius,0,Math.PI*2);ctx.fillStyle=`rgba(229,241,246,${f.alpha})`;ctx.fill();
    });
  }
  function drawHearts(dt){
    for(let i=heartParticles.length-1;i>=0;i--){
      const h=heartParticles[i];
      h.life-=dt;
      if(!reducedMotion){h.x+=h.vx*dt;h.y+=h.vy*dt;h.vy+=24*dt;h.rotation+=h.spin*dt}
      if(h.life<=0){heartParticles.splice(i,1);continue}
      ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.rotation);ctx.scale(h.size,h.size);ctx.globalAlpha=Math.min(1,h.life/h.maxLife);ctx.fillStyle=h.color;
      ctx.beginPath();ctx.moveTo(0,.35);ctx.bezierCurveTo(-.55,-.05,-.85,-.45,-.45,-.65);ctx.bezierCurveTo(-.2,-.78,0,-.55,0,-.4);ctx.bezierCurveTo(0,-.55,.2,-.78,.45,-.65);ctx.bezierCurveTo(.85,-.45,.55,-.05,0,.35);ctx.fill();ctx.restore();
    }
  }
  function draw(t,dt=0){
    ctx.clearRect(0,0,width,height);
    const haze=ctx.createRadialGradient(width*.63,height*.63,0,width*.63,height*.63,height*.55);haze.addColorStop(0,'rgba(133,169,113,.11)');haze.addColorStop(1,'rgba(33,68,49,0)');ctx.fillStyle=haze;ctx.fillRect(0,0,width,height);
    motes.forEach(m=>{const x=(m.x+Math.sin(t*.18+m.phase)*m.drift+width)%width,y=m.y+Math.sin(t*.28+m.phase)*9;const alpha=.2+.5*(.5+.5*Math.sin(t*m.speed+m.phase));ctx.beginPath();ctx.arc(x,y,m.r,0,Math.PI*2);ctx.fillStyle=`rgba(222,239,174,${alpha})`;ctx.shadowBlur=8;ctx.shadowColor='rgba(219,241,164,.8)';ctx.fill();ctx.shadowBlur=0});
    drawBareBranches(t);
    flowers.slice().sort((a,b)=>Number(a.packageIndex>=0)-Number(b.packageIndex>=0)||a.depth-b.depth).forEach(f=>drawFlower(f,t));
    drawGrass(t);
    drawSnow(t,dt);
    drawHearts(dt);


  }
  function frame(now){requestAnimationFrame(frame);if(paused)return;const t=now/1000;const dt=Math.min(.05,(now-lastTime)/1000||0);lastTime=now;breeze+=(targetBreeze-breeze)*Math.min(1,dt*2.2);targetBreeze*=.985;draw(t,dt)}
  const audio = document.getElementById('bgMusic');
  const soundToggle = document.getElementById('soundToggle');
  const soundLabel = document.getElementById('soundLabel');
  let audioStarted = false, audioDisabledByUser = false;
  function startAudio(){
    if(!audio || audioStarted) return;
    audio.play().then(()=>{
      audioStarted = true;
      soundToggle.setAttribute('aria-pressed','true');
      soundLabel.textContent = 'PAUSAR SONIDO';
    }).catch(()=>{
      audioStarted = false;
    });
  }
  soundToggle.addEventListener('click',()=>{
    if(audioStarted){
      audio.pause();
      audioStarted = false;
      audioDisabledByUser = true;
      soundToggle.setAttribute('aria-pressed','false');
      soundLabel.textContent = 'ACTIVAR SONIDO';
    }else{
      audioDisabledByUser = false;
      startAudio();
    }
  });
  function bloomAt(clientX,clientY){
    if(!audioStarted && !audioDisabledByUser) startAudio();
    const rect=canvas.getBoundingClientRect();let x=(clientX-rect.left),y=(clientY-rect.top);
    if(!Number.isFinite(x)||x<0||x>width){x=width*.54+rand(-width*.09,width*.09);y=height*rand(.4,.6)}
    for(let i=0;i<5;i++){const life=rand(1.6,2.1);heartParticles.push({x:x+rand(-12,12),y:y+rand(-7,7),vx:rand(-18,18),vy:rand(-38,-22),life,maxLife:life,size:rand(7,10),rotation:rand(-.35,.35),spin:rand(-.9,.9),color:i%2?'#f2b2cb':'#f6dce8'})}
    const baseY=height*(width<600?.98:.98);const f=makeFlower(x,baseY+rand(-height*.02,height*.025),rand(.76,1),Math.floor(rand(0,4)));
    f.tall=height*rand(.28,.48)*(width<600?.8:1);f.size=(width<600?rand(29,40):rand(36,52));f.open=0;f.birth=performance.now()/1000;flowers.push(f);
    if(flowers.length>24)flowers.splice(0,1);
    const toast=document.getElementById('toast');toast.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('visible'),1900);
  }
  function animateBirth(){
    if(paused)return;const time=performance.now()/1000;
    flowers.forEach(f=>{if(f.open!==undefined)f.open=Math.min(1,f.open+0.011)});
    requestAnimationFrame(animateBirth);
  }
  canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();targetBreeze=Math.max(-1,Math.min(1,(e.clientX-r.left-r.width*.5)/(r.width*.5)))*.65});
  canvas.addEventListener('pointerleave',()=>targetBreeze=0);
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){const r=canvas.getBoundingClientRect();targetBreeze=(e.clientX-r.left-r.width*.5)/r.width*.5*.6}bloomAt(e.clientX,e.clientY)});
  document.getElementById('bloomButton').addEventListener('click',()=>bloomAt(NaN,NaN));
  // Decorative lights use simple CSS circles, all generated at runtime.
  const fireflies=document.querySelector('.fireflies');for(let i=0;i<24;i++){const dot=document.createElement('i');dot.className='firefly';dot.style.left=rand(8,94)+'%';dot.style.top=rand(22,84)+'%';dot.style.setProperty('--d',rand(3.5,8)+'s');dot.style.setProperty('--x',rand(-24,24)+'px');dot.style.animationDelay=rand(-8,0)+'s';fireflies.appendChild(dot)}
  document.querySelectorAll('.racer-extra').forEach(car=>{
    car.style.top=rand(1,38).toFixed(2)+'%';
    car.style.animationDuration=rand(3.1,7.2).toFixed(2)+'s';
    car.style.animationDelay='-'+rand(0,6).toFixed(2)+'s';
    car.style.setProperty('--bob-speed',rand(.55,1.5).toFixed(2)+'s');
    car.style.setProperty('--bob-delay','-'+rand(0,1.5).toFixed(2)+'s');
  });
  new ResizeObserver(resize).observe(wrap);resize();requestAnimationFrame(frame);requestAnimationFrame(animateBirth);
})();














