/* Original procedural cast art. All coordinates use the calling canvas space.
 * FSArt.person(ctx, x, y, scale, name, mood, time): bottom-centred figure;
 * name = 'finch' | 'mira' | 'jules', mood = 'working' | 'happy' | 'worried'
 * | 'helping' | 'alarmed'. time is seconds; omitted values are safe defaults.
 * FSArt.machine(ctx, x, y, scale, modules, mood, time): bottom-centred QUOTA;
 * modules is a count 0..4, mood = 'idle' | 'telegraph' | 'hit' | 'defeated'.
 * Both functions isolate canvas state and use no external images or fonts. */
(function (root) {
  'use strict';
  const ink = '#173c3c', cream = '#fff1d3', coral = '#de7958', gold = '#efbf65', mint = '#83bea7';
  function shape(c, x, y, w, h, fill, radius = 8, line = 3) {
    c.beginPath(); c.roundRect(x, y, w, h, radius); c.fillStyle = fill; c.fill();
    c.lineWidth = line; c.strokeStyle = ink; c.stroke();
  }
  function circle(c, x, y, r, fill, line = 3) {
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
    c.lineWidth = line; c.strokeStyle = ink; c.stroke();
  }
  function stroke(c, points, color = ink, width = 4) {
    c.beginPath(); c.moveTo(points[0][0], points[0][1]);
    for (const p of points.slice(1)) c.lineTo(p[0], p[1]);
    c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  }
  function person(c, x, y, scale = 1, name = 'finch', mood = 'working', time = 0) {
    name = String(name).toLowerCase();
    const finch = name === 'finch', mira = name === 'mira';
    const coat = finch ? '#eab764' : mira ? '#74b59e' : '#718ca7';
    const skin = finch ? '#e9b487' : mira ? '#bd805e' : '#d49a70';
    const hair = finch ? '#775849' : mira ? '#403e3a' : '#473f3c';
    const upset = mood === 'worried' || mood === 'alarmed', happy = mood === 'happy' || mood === 'helping';
    const bob = Math.sin(time * 2.4 + (mira ? 1 : 0)) * 1.4;
    c.save(); c.translate(x, y); c.scale(scale, scale); c.translate(0, bob);
    // Shoes, legs, and distinctive garment silhouettes.
    stroke(c, [[-14,-40],[-16,-12],[-24,-8]], ink, 11);
    stroke(c, [[14,-40],[16,-12],[24,-8]], ink, 11);
    c.beginPath(); c.moveTo(-27,-93); c.lineTo(27,-93); c.lineTo(finch?35:31,-42); c.quadraticCurveTo(0,-31,finch?-35:-31,-42); c.closePath();
    c.fillStyle=coat; c.fill(); c.lineWidth=3; c.strokeStyle=ink; c.stroke();
    if (finch) { // lapels, tie and proud manager badge
      c.fillStyle=cream; c.beginPath(); c.moveTo(-13,-91); c.lineTo(0,-65); c.lineTo(13,-91); c.closePath(); c.fill();
      c.fillStyle=coral; c.beginPath(); c.moveTo(0,-86); c.lineTo(7,-80); c.lineTo(3,-61); c.lineTo(-3,-61); c.lineTo(-7,-80); c.closePath(); c.fill();
      shape(c,16,-79,12,8,cream,2,1.5);
    } else if (mira) { shape(c,-25,-79,50,30,'#e8d9b6',3,2); stroke(c,[[-14,-69],[15,-69]],'#6b998a',2); }
    else { stroke(c,[[-17,-87],[17,-50]],'#d9b984',3); shape(c,8,-78,15,12,'#e9d5a8',2,2); }
    // Arms react to the selected expression without obscuring the face.
    const wave = mood === 'helping' ? Math.sin(time*5)*6 : 0;
    stroke(c,[[-27,-83],[-40,-62],[-34,-48]],coat,12);
    stroke(c,[[27,-83],[40,-68],[mood==='helping'?49:35,(mood==='helping'?-94:-48)+wave]],coat,12);
    circle(c,-34,-48,5,skin,2); circle(c,mood==='helping'?49:35,(mood==='helping'?-94:-48)+wave,5,skin,2);
    // Neck and head; hair shapes remain distinguishable at small sizes.
    shape(c,-8,-108,16,20,skin,4,2);
    if (mira) { circle(c,-25,-142,16,hair); circle(c,25,-142,16,hair); }
    shape(c,-29,-155,58,57,skin,20,3);
    if (finch) { c.fillStyle=hair; c.beginPath(); c.moveTo(-28,-140); c.quadraticCurveTo(-32,-161,-5,-162); c.quadraticCurveTo(25,-165,29,-144); c.quadraticCurveTo(12,-154,0,-148); c.quadraticCurveTo(-15,-157,-28,-140); c.fill(); }
    else if (mira) { c.fillStyle=hair; c.beginPath(); c.moveTo(-29,-140); c.quadraticCurveTo(-32,-164,0,-164); c.quadraticCurveTo(32,-164,29,-140); c.lineTo(22,-151); c.quadraticCurveTo(1,-143,-22,-153); c.closePath(); c.fill(); }
    else { c.fillStyle=hair; c.beginPath(); c.moveTo(-28,-143); c.quadraticCurveTo(-30,-163,0,-163); c.quadraticCurveTo(28,-162,29,-144); c.quadraticCurveTo(5,-145,-8,-155); c.quadraticCurveTo(-17,-145,-28,-143); c.fill(); }
    const blink = Math.sin(time*1.7+(mira?1:2)) > .992;
    if (blink) { stroke(c,[[-16,-131],[-9,-131]],ink,2); stroke(c,[[9,-131],[16,-131]],ink,2); }
    else { circle(c,-12,-131,2.6,ink,0); circle(c,12,-131,2.6,ink,0); }
    stroke(c,[[-18,-140],[-9,upset?-143:-140]],ink,2); stroke(c,[[9,upset?-143:-140],[18,-140]],ink,2);
    c.beginPath(); c.strokeStyle=ink; c.lineWidth=2.5; c.lineCap='round';
    if (mood === 'alarmed') { c.ellipse(0,-115,4,6,0,0,7); }
    else { c.moveTo(-8,-117); c.quadraticCurveTo(0,upset?-123:(happy?-106:-112),8,-117); } c.stroke();
    c.restore();
  }
  function machine(c, x, y, scale = 1, modules = 4, mood = 'idle', time = 0) {
    modules = Math.max(0, Math.min(4, Math.floor(Number(modules) || 0)));
    c.save(); c.translate(x,y); c.scale(scale,scale);
    if (mood === 'defeated') { c.translate(0,7); c.rotate(-.15); }
    else if (mood === 'hit') c.translate(Math.sin(time*35)*5,0);
    else c.translate(0,Math.sin(time*2)*1.5);
    // Core is recognizable even before the promotions attach their four parts.
    shape(c,-75,-135,150,117,'#d49768',13,4); shape(c,-53,-108,106,62,'#f2c27d',9,3);
    const alarm=mood==='telegraph', dead=mood==='defeated';
    circle(c,-26,-82,12,alarm?'#e65e47':cream,3); circle(c,26,-82,12,alarm?'#e65e47':cream,3);
    if(dead){stroke(c,[[-31,-87],[-21,-77]],ink,2);stroke(c,[[-21,-87],[-31,-77]],ink,2);stroke(c,[[21,-87],[31,-77]],ink,2);stroke(c,[[31,-87],[21,-77]],ink,2);}
    else {circle(c,-26,-82,4,ink,0);circle(c,26,-82,4,ink,0);}
    shape(c,-31,-49,62,18,ink,3,2);
    if (!dead) { c.fillStyle=cream; c.fillRect(-23,-45,46,4); }
    shape(c,-88,-20,176,18,'#845f4a',5,3);
    // 1: stamp chimney, 2: sponsored gear, 3: chart antenna, 4: double-entry feeder.
    if(modules>=1){shape(c,-56,-170,43,35,'#edb35d',5,3);shape(c,-65,-179,61,13,coral,4,3);}
    if(modules>=2){c.save();c.translate(80,-94);c.rotate(time*1.2);c.beginPath();for(let i=0;i<16;i++){let a=i*Math.PI/8,r=i%2?19:26;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fillStyle=gold;c.fill();c.lineWidth=3;c.strokeStyle=ink;c.stroke();circle(c,0,0,6,coral,2);c.restore();}
    if(modules>=3){stroke(c,[[31,-135],[40,-169],[57,-169]],ink,4);shape(c,44,-187,43,30,mint,4,2);stroke(c,[[50,-164],[57,-173],[65,-169],[79,-181]],ink,2);}
    if(modules>=4){shape(c,-105,-72,30,49,'#85bda7',4,3);stroke(c,[[-99,-61],[-81,-61]],ink,2);stroke(c,[[-99,-52],[-81,-52]],ink,2);shape(c,-110,-34,40,10,coral,3,2);}
    if(alarm){stroke(c,[[-95,-150],[-104,-164]],coral,4);stroke(c,[[1,-151],[1,-169]],coral,4);stroke(c,[[98,-141],[108,-155]],coral,4);}
    c.restore();
  }
  root.FSArt = Object.freeze({person, machine});
})(window);
