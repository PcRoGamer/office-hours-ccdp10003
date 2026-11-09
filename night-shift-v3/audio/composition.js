/**
 * QUOTA PANIC: NIGHT SHIFT v3 — "The Promotion Trap"
 * Original 16th-note event score. No copied recordings or imported tracks.
 * Every section rearranges a recurring four-note memo motif.
 * This module is pure and deterministic.
 */
export const SCORE_MODES = Object.freeze(['work', 'promotion', 'boss', 'victory']);
export const SCORE = Object.freeze({
  work:      { bpm: 112, swing: 0.13, bars: 4, name: 'Unpaid Overtime', harmony: [[50,53,57,60,64],[43,53,57,59,64],[48,52,55,59,62],[45,49,55,58,62]] },
  promotion: { bpm: 88,  swing: 0.18, bars: 4, name: 'An Unexpected Raise', harmony: [[53,57,60,64,67],[52,55,59,62,67],[50,53,57,60,64],[43,53,57,59,64]] },
  boss:      { bpm: 148, swing: 0.03, bars: 4, name: 'Printer Mutiny', harmony: [[38,41,45,50],[39,42,46,51],[42,45,49,54],[40,44,47,52]] },
  victory:   { bpm: 105, swing: 0.12, bars: 4, name: 'Clocked Out', harmony: [[50,54,57,62,64],[43,47,50,55,59],[48,52,55,59,62],[50,54,57,61,64]] }
});
const MODES = new Set(SCORE_MODES);
const C = (voice, midi=0, gain=1, len=1, pan=0) => ({voice,midi,gain,len,pan});
const clamp = x => Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const memo = Object.freeze([0,2,5,4,2,-1,0,7]);

/** @returns {{notes: Array<{voice:string,midi:number,gain:number,len:number,pan:number}>, bar:number, beat:number, bpm:number, section:string}} */
export function scoreStep({mode='work',step=0,pressure=0.15,streak=0}={}) {
  if (!MODES.has(mode)) throw new RangeError('Unknown score mode: '+mode);
  if (!Number.isSafeInteger(step) || step < 0) throw new RangeError('step must be a nonnegative integer');
  const score=SCORE[mode], pos=step%16, bar=Math.floor(step/16)%4, chord=score.harmony[bar];
  const density=clamp(pressure), notes=[], root=chord[0], beat=pos/4;
  if (mode==='work') {
    if ([0,7,8,14].includes(pos)) notes.push(C('kick',0,pos===0?0.9:0.61));
    if ([4,12].includes(pos)) notes.push(C('snare',0,0.61));
    if (pos%2===0) notes.push(C('hat',0,pos%4===0?0.30:0.16));
    if (pos%4===3 && density>.25) notes.push(C('shaker',0,0.12+density*.12));
    if ([0,3,7,10,14].includes(pos)) notes.push(C('bass',root-12 + ({0:0,3:7,7:12,10:7,14:0}[pos]),pos===0?.72:.49,2));
    if ([0,9].includes(pos)) {
      const shape=pos===0?[1,2,3,4]:[1,3,4];
      for (let i=0;i<shape.length;i++) notes.push(C('keys',chord[shape[i]],pos===0?.22:.17,7,[-.31,-.12,.13,.30][i]));
    }
    if ([2,6,11,15].includes(pos)) {
      const k=({2:0,6:1,11:2,15:3})[pos];
      notes.push(C('marimba',62+memo[(bar*4+k)%8],.23+density*.10,2,(k%2?.28:-.28)));
    }
    if (density>.55 && [1,5,9,13].includes(pos)) notes.push(C('clave',0,.1+density*.09));
    if (streak>=3 && [0,8].includes(pos)) notes.push(C('bell',root+24+memo[(bar+pos/8)%8],Math.min(.20,.07+streak*.014),4,.26));
  } else if (mode==='promotion') {
    if ([0,8].includes(pos)) notes.push(C('kick',0,.35));
    if ([4,12].includes(pos)) notes.push(C('brush',0,.29));
    if (pos%4===2) notes.push(C('shaker',0,.20));
    if (pos===0) {
      chord.slice(1).forEach((m,i)=>notes.push(C('pad',m,.13,15,(i-1.5)*.17)));
      notes.push(C('bass',root-12,.46,7));
    }
    if ([4,10].includes(pos)) chord.slice(1,4).forEach((m,i)=>notes.push(C('keys',m,.18,5,(i-1)*.25)));
    if ([2,6,11,14].includes(pos)) notes.push(C('bell',72+memo[(bar*3+Math.floor(pos/4))%8],.18,4,pos%4===2?-.3:.3));
    if (pos===15 && bar===3) notes.push(C('swell',65,.20,4));
  } else if (mode==='boss') {
    if ([0,3,7,8,11,14].includes(pos)) notes.push(C('kick',0,pos===0?1:.81));
    if ([4,12].includes(pos)) notes.push(C('snare',0,.90));
    if (pos%2===0) notes.push(C('hat',0,.30+density*.12));
    if (pos%4===3 && density>.25) notes.push(C('shaker',0,.13));
    if ([0,2,3,6,8,11,14].includes(pos)) notes.push(C('bass',root-12 + (pos===11?7:pos===6?12:0),.80,Math.max(1,pos%3?1:2)));
    if (pos===0 || pos===10) chord.slice(1).forEach((m,i)=>notes.push(C('brass',m+12,.20,2,(i-1)*.22)));
    if ([1,5,9,13].includes(pos)) notes.push(C('marimba',62+memo[(bar+Math.floor(pos/4))%8]+(bar===3?-1:0),.36,1,0));
    if (pos===15 && bar===3) notes.push(C('tom',0,.72));
    if (density>.55 && [2,6,10,14].includes(pos)) notes.push(C('clave',0,.20));
  } else {
    if ([0,8].includes(pos)) notes.push(C('kick',0,.55));
    if ([4,12].includes(pos)) notes.push(C('brush',0,.22));
    if (pos%4===2) notes.push(C('hat',0,.15));
    if (pos===0) {
      chord.slice(1).forEach((m,i)=>notes.push(C('pad',m,.14,15,(i-1.5)*.2)));
      notes.push(C('bass',root-12,.44,8));
    }
    if (pos===8) notes.push(C('bass',root-5,.31,5));
    if ([3,11].includes(pos)) chord.slice(1,4).forEach((m,i)=>notes.push(C('keys',m+12,.14,5,(i-1)*.25)));
    if ([0,5,9,12].includes(pos)) notes.push(C('bell',74+[0,4,7,12][[0,5,9,12].indexOf(pos)]+(bar===3?2:0),.21,5,0));
  }
  return {notes,bar,beat,bpm:score.bpm,section:score.name};
}
export function stepSeconds(mode) {
  if (!MODES.has(mode)) throw new RangeError('Unknown mode');
  return 60 / SCORE[mode].bpm / 4;
}
export const midiHz = midi => 440*Math.pow(2,(midi-69)/12);