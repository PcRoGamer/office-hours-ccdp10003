/** Original Canvas2D vignette for the STORY promotion. Decorative only, never game evidence. */
export function drawPromotionCast(canvas,number,t=0){
 const dpr=Math.min(2,globalThis.devicePixelRatio||1),W=600,H=230;
 if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr)}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 const ink='#152b2c',cream='#f8e4b9',mint='#71bf9e',rust='#dc7650',gold='#f2c16e';
 const wobble=Math.sin(t*3.5),blink=Math.sin(t*1.9)>0.986?0.08:1;
 function rect(x,y,w,h,color,stroke=ink,lw=3){c.fillStyle=color;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.strokeRect(x,y,w,h)}}
 function path(points,color,stroke=ink,lw=4){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
 function oval(x,y,rx,ry,color,stroke=ink,lw=4){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
 c.clearRect(0,0,W,H);rect(0,0,W,H,'#193d3c',null);
 c.fillStyle='#204b48';for(let x=0;x<W;x+=50)c.fillRect(x,0,3,H);c.fillStyle='#42635b';for(let x=17;x<W;x+=83)c.fillRect(x,14,50,4);
 rect(3,187,595,42,'#8d7653');rect(3,188,595,8,'#dfb778');
 // Finch: overstated management smile, tiny body, absurdly extended congratulatory arm.
 c.save();c.translate(103,107+Math.sin(t*2)*2);c.rotate(wobble*.014);
 path([[-39,60],[-36,20],[36,20],[44,65]],'#344c4f');path([[-10,22],[0,52],[9,22]],'#dc7e56');
 oval(0,-13,55,64,'#f2d2a3');path([[-52,-30],[-34,-79],[10,-83],[52,-42],[18,-54],[-21,-52]],'#293c40');
 oval(-21,-14,8,13,'#fff4d8');oval(20,-14,8,13,'#fff4d8');oval(-20,-13,3.5,6*blink,ink,null);oval(20,-13,3.5,6*blink,ink,null);
 c.strokeStyle=ink;c.lineWidth=4;c.beginPath();c.arc(0,7,29,.14,Math.PI-.14);c.stroke();
 c.fillStyle='#ba7752';c.fillRect(-17,14,34,6);c.fillStyle=cream;c.font='bold 12px Arial';c.fillText('FINCH',-19,57);c.restore();
 // His triumphant stamp hits a machine part, which becomes the recurring quota silhouette.
 c.save();c.translate(306,97);c.rotate(-.018*wobble);
 rect(-60,9,125,91,'#3e6861');rect(-53,16,110,72,'#9db6a0');rect(-38,29,79,29,'#23413e');
 c.fillStyle='#e9bd79';c.font='bold 13px Arial';c.fillText('QUOTA',-34,48);
 for(let i=0;i<number;i++){rect(-54+i*23,72,18,10,i%2?rust:gold)}
 rect(30,-5,15,31,rust);rect(21,-15,33,13,gold);c.restore();
 // Mira, who does not share management's enthusiasm.
 c.save();c.translate(502,109+Math.sin(t*2.1+1)*2);c.rotate(-wobble*.02);
 path([[-49,64],[-37,23],[38,24],[54,70]],'#5b9b87');
 oval(0,-13,51,58,'#e1b48b');path([[-50,-14],[-40,-72],[19,-77],[52,-32],[45,-2],[35,-35],[-28,-42]],'#233536');
 oval(-19,-10,7,10,'#ffedd6');oval(19,-10,7,10,'#ffedd6');oval(-18,-10,3,5*blink,ink,null);oval(20,-9,3,5*blink,ink,null);
 c.strokeStyle=ink;c.lineWidth=3.5;c.beginPath();c.moveTo(-29,-24);c.lineTo(-10,-26);c.moveTo(12,-26);c.lineTo(29,-21);c.stroke();
 c.beginPath();c.moveTo(-14,22);c.quadraticCurveTo(4,10,17,21);c.stroke();
 c.strokeStyle=gold;c.lineWidth=6;c.beginPath();c.arc(0,-19,57,3.4,5.8);c.stroke();oval(52,-2,9,16,gold);c.fillStyle=cream;c.font='bold 12px Arial';c.fillText('MIRA',-16,58);c.restore();
 // Movement travels into the physical office, rather than a static explanation.
 const trigger=(t*1.25)%2;const y=60+Math.pow(Math.sin(Math.min(1,trigger)*Math.PI),2)*16;
 c.save();c.translate(199,y);c.rotate(-.18+wobble*.055);rect(-16,-14,32,31,cream);rect(-10,-7,21,3,'#568c74',null);rect(-10,1,17,3,'#568c74',null);c.restore();
 if(trigger<.2){oval(241,165,10+trigger*60,6+trigger*32,'#d59458',null);c.fillStyle='#f9dfb0';for(let i=0;i<7;i++){const a=i*Math.PI*2/7;c.fillRect(240+Math.cos(a)*24,165+Math.sin(a)*16,6,4)}}
 rect(0,0,600,24,'#153332',null);c.font='bold 11px Arial';c.fillStyle='#eac583';c.fillText('LIVE FROM THE PROMOTION FLOOR',13,16);c.fillStyle='#b9dfbc';c.fillText('MACHINE MODULE '+String(number).padStart(2,'0')+' / 05',420,16);
 c.strokeStyle='#c9ae6b';c.lineWidth=4;c.strokeRect(2,2,596,226);
}
