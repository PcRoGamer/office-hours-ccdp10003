// Render source-owned Canvas2D scenes for independently reproducible visual audit.
// npm install --no-save skia-canvas  OR  SKIA_CANVAS_MODULE=/path/to/skia-canvas node qa/v3-intake-render.mjs
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {createIntakeCard} from '../night-shift-v3/scenes/intake/index.js';
const require=createRequire(import.meta.url);
const {Canvas}=require(process.env.SKIA_CANVAS_MODULE||'skia-canvas');
const dir=new URL('./v3-intake-evidence/',import.meta.url);await mkdir(dir,{recursive:true});
const ctx={rng:{next:()=>.4},run:{perks:[],directive:null,attemptId:'render'},events:{emit:()=>{}},audio:{play:()=>{}}};
for(const id of ['I1','I2','I3','I4']){
 const canvas=new Canvas(1280,720),g=canvas.getContext('2d');const s=createIntakeCard(id,ctx);s.enter();
 if(id==='I1')for(let i=0;i<33;i++)s.update(.05);
 s.draw(g);await writeFile(new URL(`intake-${id}-canvas-1280.png`,dir),await canvas.toBuffer('png'));s.dispose();
}
const canvas=new Canvas(650,800),g=canvas.getContext('2d');g.fillStyle='#11343d';g.fillRect(0,0,650,800);
const s=createIntakeCard('I2',ctx);const scale=650/1280;g.translate(0,(800-720*scale)*.57);g.scale(scale,scale);s.draw(g);
await writeFile(new URL('intake-I2-canvas-portrait.png',dir),await canvas.toBuffer('png'));
console.log('Captured real Intake scene draw() output, not browser screenshots.');
