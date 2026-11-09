/** Animated, non-scoring CLOCK OUT coda. Every frame comes from the real frozen game state.
 * Decorative office slapstick; never infers employee welfare from a score. */
export function drawClockoutScene(canvas, frame = 0, reducedMotion = false) {
  if (!canvas) return;
  const cssW = 500, cssH = 490;
  const dpr = Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
  const bw = Math.round(cssW * dpr), bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, cssW, cssH);
  const t = reducedMotion ? 0 : frame;
  const w = Math.sin(t * 2.8), wobble = Math.sin(t * 12) * .012;
  const ink = '#112629', cream = '#f3dfb8', gold = '#e9b862', mint = '#93c5a4', rust = '#d86c4a';
  function box(x,y,w,h,fill,stroke=ink,line=4){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.strokeRect(x,y,w,h)}}
  function oval(x,y,rx,ry,fill,stroke=ink,lw=4){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
  function line(points,stroke,lw=5){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=stroke;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';c.stroke()}
  function poly(points,fill,stroke=ink,lw=4){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
  function txt(s,x,y,size,color=cream,weight=900){c.fillStyle=color;c.font=`${weight} ${size}px Arial`;c.fillText(s,x,y)}
  box(10,14,480,450,'#1a4140','#bd9865',5);
  for(let x=28;x<485;x+=55){c.fillStyle='#3b655b';c.fillRect(x,17,2,440)}
  box(16,414,468,49,'#b39265');box(16,415,468,9,'#e7bf7d',null);
  box(40,57,425,26,'#a27750');txt('ASTER INDUSTRIES · PROPERTY OF THE FIRM',56,74,11,'#f4d29a');
  c.save();c.translate(256,266);c.rotate(-.075 + wobble);
  box(-146,-122,281,219,'#364f4b',ink,9);
  box(-126,-103,240,177,'#94aa96',ink,6);
  box(-106,-83,202,89,'#1b3736','#44665b',5);
  oval(-48,-36,19,23,'#d8dfb1',ink,3);oval(42,-43,19,23,'#d8dfb1',ink,3);
  oval(-45,-30,6,12,ink,null);oval(45,-42,6,12,ink,null);
  line([[-91,-67],[-64,-78],[-32,-73]],rust,8);line([[18,-81],[62,-68]],rust,8);
  line([[-35,-3],[0,-13],[39,-7]],ink,8);
  line([[-10,-90],[9,-43],[-4,-15],[37,12]],'#dce8d8',3);
  box(-78,25,154,33,'#e7d0a2','#324b45',3);txt('NO LONGER HIRING',-67,47,13,ink);
  for (const [x,y] of [[-124,-112],[112,-112],[-126,88],[108,88]]) {
    oval(x,y,9,9,'#d8ae69',ink,3);line([[x-5,y-5],[x+4,y+4]],ink,2);
  }
  poly([[-20,85],[66,85],[61,150+w*5],[35,158+w*5],[9,140+w*4],[-17,157+w*4]],'#fff4dd');
  txt('STATUS:',-9,115,10,ink);txt('CLOCKED OUT',-9,131,11,'#a6543e');
  c.restore();
  if(!reducedMotion)for(let i=0;i<8;i++){
    const x=60+i*55+Math.sin(t*1.2+i*1.8)*11;
    const y=95+((t*19+i*37)%196);
    c.save();c.translate(x,y);c.rotate(t*.8+i);box(-4,-2,8,5,i%2?gold:mint,null);c.restore();
  }
  function character(x,base,skin,hair,suit,mood){
    c.save();c.translate(x,base+Math.sin(t*2.1+x)*2);c.rotate((mood==='finch'?-1:1)*.024*w);
    poly([[-59,77],[-42,2],[33,-1],[59,79]],suit);
    poly([[-9,0],[0,33],[11,-1]],mood==='finch'?rust:cream,null);
    oval(0,-37,50,62,skin);
    poly([[-48,-53],[-34,-98],[8,-100],[51,-57],[19,-72],[-23,-71]],hair);
    oval(-18,-34,8,13,'#fff4d7',ink,2);oval(19,-34,8,13,'#fff4d7',ink,2);
    const blink=Math.sin(t*3.1+x)>.995?.18:1;
    oval(-18,-32,3.8,7*blink,ink,null);oval(18,-32,3.8,7*blink,ink,null);
    if(mood==='finch'){
      line([[-31,-61],[-10,-52]],ink,4);line([[10,-53],[31,-60]],ink,4);
      oval(0,0,13,17,'#b46d54',ink,3);
      line([[38,5],[75,-38],[83,-59]],skin,16);oval(85,-65,12,13,skin);
    }else{
      line([[-32,-61],[-9,-65]],ink,4);line([[9,-65],[32,-61]],ink,4);
      c.beginPath();c.arc(0,-4,23,.09,Math.PI-.09);c.strokeStyle=ink;c.lineWidth=4;c.stroke();
      line([[-38,8],[-73,33],[-89,4]],skin,13);
    }
    c.restore();
  }
  character(92,369,'#f0cc95','#304243','#5c7975','finch');
  character(416,369,'#deae87','#252f33','#6ca78e','mira');
  box(16,445,468,19,'#0d302c',null);
}