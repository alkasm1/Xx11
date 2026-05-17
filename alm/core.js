// FILE: /alm/core.js

const FP = {
  owner: "Raafat Omar",
  ar: "رأفت عمر",
  sig: "ALMFP::Raafat-Omar-ALM-Core::رأفت-عمر"
};

function fpBytes(){
  return new TextEncoder().encode(JSON.stringify(FP));
}

const B=32, LMAX=12;

const mapI={
1:"ا",2:"ب",3:"ت",4:"ث",5:"ج",6:"ح",7:"خ",8:"د",9:"ذ",
10:"ر",11:"ز",12:"س",13:"ش",14:"ص",15:"ض",16:"ط",
17:"ظ",18:"ع",19:"غ",20:"ف",21:"ق",22:"ك",23:"ل",
24:"م",25:"ن",26:"ه",27:"و",28:"ي"
};

const mapC={};
for(let k in mapI) mapC[mapI[k]]=Number(k);

function norm(s){
  return (s||"")
    .replace(/[إأآ]/g,"ا")
    .replace(/ى/g,"ي")
    .replace(/ؤ/g,"و")
    .replace(/ئ/g,"ي")
    .replace(/ة/g,"ه");
}

function clean(t){
  return (t||"")
    .split("")
    .filter(c=>mapC[c]||c===" ")
    .join("")
    .replace(/\s+/g," ")
    .trim();
}

function split(w){
  const a=[];
  for(let i=0;i<w.length;i+=LMAX) a.push(w.slice(i,i+LMAX));
  return a;
}

function w2c(w){
  const c=new Array(LMAX).fill(0);
  let p=0;
  for(let i=w.length-1;i>=0;i--){
    const idx=mapC[w[i]];
    if(idx===undefined) continue;
    c[p++]=idx;
    if(p>=LMAX) break;
  }
  let C=0n;
  for(let i=0;i<LMAX;i++){
    C+=BigInt(c[i])*(BigInt(B)**BigInt(i));
  }
  return C;
}

function c2w(C){
  let out="";
  for(let i=0;i<LMAX;i++){
    const d=Number(C%BigInt(B));
    C/=BigInt(B);
    if(d) out=mapI[d]+out;
  }
  return out;
}

export function enc(text,key){
  text=clean(norm(text));
  const words=text.split(" ");
  const blocks=[];
  words.forEach(w=>split(w).forEach(b=>blocks.push(b)));

  const count=BigInt(blocks.length);
  const fp=fpBytes();
  const header=new Uint8Array(8+1+fp.length);

  for(let i=0;i<8;i++){
    header[i]=Number((count>>BigInt(8*i))&0xFFn);
  }

  header[8]=fp.length;
  header.set(fp,9);

  const payload=new Uint8Array(blocks.length*8);
  blocks.forEach((b,bi)=>{
    let C=w2c(b)^key;
    for(let j=0;j<8;j++){
      payload[bi*8+j]=Number((C>>BigInt(8*j))&0xFFn);
    }
  });

  return {header,payload};
}

export function dec(header,payload,key){
  let count=0n;
  for(let i=0;i<8;i++){
    count|=(BigInt(header[i])<<BigInt(8*i));
  }

  const fpLen=header[8];
  let fp=null;
  if(fpLen>0) fp=new TextDecoder().decode(header.slice(9,9+fpLen));

  const blocks=[];
  for(let bi=0;bi<Number(count);bi++){
    let C=0n;
    for(let j=0;j<8;j++){
      C|=(BigInt(payload[bi*8+j])<<BigInt(8*j));
    }
    blocks.push(c2w(C^key));
  }

  return {text:blocks.join(" "),fp};
}
