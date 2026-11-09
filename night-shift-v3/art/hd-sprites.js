/** Original Night Shift HD illustrated atlas, reused verbatim by the v3 arcade.
 * A single cache shared by authored scenes. Node tests can import without Image.
 */
let atlas;
function getAtlas(){
 if(typeof Image==='undefined')return null;
 if(!atlas){
  atlas=new Image();
  atlas.decoding='async';
  atlas.src=new URL('./hd-cast-atlas.png',import.meta.url).href;
 }
 return atlas;
}
export function drawSpriteTile(g,x,y,width,height,row=0,column=0){
 const img=getAtlas();
 if(!img?.complete||!img.naturalWidth)return false;
 const sw=img.naturalWidth/4,sh=img.naturalHeight/4;
 g.drawImage(img,column*sw,row*sh,sw,sh,x-width/2,y-height/2,width,height);
 return true;
}
