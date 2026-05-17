// FILE: /app/ui.js

import {enc,dec} from "../alm/core.js";

const SIZE=1024, HEADER=16;

function px(ctx,p,g){
  const x=p%SIZE, y=Math.floor(p/SIZE);
  const img=ctx.createImageData(1,1);
  img.data[0]=g; img.data[1]=g; img.data[2]=g; img.data[3]=255;
  ctx.putImageData(img,x,y);
}

function write(ctx,bytes,start){
  for(let i=0;i<bytes.length;i++){
    px(ctx,start+i,255-(bytes[i]&0xFF));
  }
}

function read(ctx,count,start){
  const data=ctx.getImageData(0,0,SIZE,SIZE).data;
  const out=new Uint8Array(count);
  for(let i=0;i<count;i++){
    out[i]=255-data[(start+i)*4];
  }
  return out;
}

export function uiEncode(text,key,canvas){
  const ctx=canvas.getContext("2d");
  canvas.width=SIZE; canvas.height=SIZE;
  ctx.fillStyle="white"; ctx.fillRect(0,0,SIZE,SIZE);

  const {header,payload}=enc(text,key);
  write(ctx,header,0);
  write(ctx,payload,HEADER);
}

export function uiDecode(key,canvas){
  const ctx=canvas.getContext("2d");

  const countBytes=read(ctx,8,0);
  let count=0n;
  for(let i=0;i<8;i++){
    count|=(BigInt(countBytes[i])<<BigInt(8*i));
  }

  const fpLen=read(ctx,1,8)[0];
  const header=read(ctx,8+1+fpLen,0);
  const payload=read(ctx,Number(count)*8,HEADER);

  return dec(header,payload,key);
}
