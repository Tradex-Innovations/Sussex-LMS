import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';

// Decode the 8-bit RGB/RGBA PNGs used by portal captures. No browser or image
// package is required in CI. Large pure-black areas indicate a failed capture.
export function blackPixelFraction(png) {
 assert.equal(png.readUInt32BE(0),0x89504e47,'Expected PNG');
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20),color=png[25];
 assert.equal(png[24],8,'Capture must use 8-bit colour');
 assert.equal(png[28],0,'Capture must be non-interlaced');
 assert.ok(color===2||color===6,'Capture must be RGB or RGBA');
 const channels=color===6?4:3,stride=width*channels,chunks=[];
 for(let offset=8;offset<png.length;){
  const length=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);
  if(type==='IDAT')chunks.push(png.subarray(offset+8,offset+8+length));
  offset+=length+12;
 }
 const raw=inflateSync(Buffer.concat(chunks));
 assert.equal(raw.length,(stride+1)*height,'Capture pixel data is incomplete');
 let previous=Buffer.alloc(stride),black=0;
 for(let y=0;y<height;y++){
  const offset=y*(stride+1),filter=raw[offset],row=Buffer.allocUnsafe(stride);
  assert.ok(filter<=4,'Unknown PNG row filter');
  for(let x=0;x<stride;x++){
   const a=x>=channels?row[x-channels]:0,b=previous[x],c=x>=channels?previous[x-channels]:0;
   let prediction=0;
   if(filter===1)prediction=a;
   if(filter===2)prediction=b;
   if(filter===3)prediction=Math.floor((a+b)/2);
   if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);prediction=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
   row[x]=(raw[offset+1+x]+prediction)&255;
  }
  for(let x=0;x<stride;x+=channels)if(row[x]<8&&row[x+1]<8&&row[x+2]<8)black++;
  previous=row;
 }
 return black/(width*height);
}
