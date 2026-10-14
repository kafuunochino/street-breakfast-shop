/** Original procedural Canvas2D artwork. No downloaded assets or DOM. */
export const C = { bg: '#f0d8ad', paper: '#fff5dc', ink: '#513b2b', muted: '#8d755d', green: '#3d684f', pale: '#e8dfbb', coral: '#ad5032', gold: '#d7ac65', line: '#dedac6' };
export function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
export function circle(ctx, x, y, radius, color) { ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill(); }
export function ellipse(ctx, x, y, rx, ry, color) { ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);circle(ctx,0,0,1,color);ctx.restore(); }
export function line(ctx, x, y, ex, ey, color, width=1) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();}
export function poly(ctx, points, color) { ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill(); }
export function label(ctx, str, x, y, size=12, color=C.ink, weight='normal', align='left') { ctx.fillStyle=color;ctx.font=`${weight==='bold'?700:weight==='normal'?400:weight} ${size}px "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(str,x,y); }
export function wrapped(ctx, str, x, y, maxWidth, size=12, color=C.ink, height=20, maxLines=4) {ctx.font=`400 ${size}px "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif`; const lines=[];let row='';for(const char of str){if(char==='\n'){lines.push(row);row='';continue;}if(ctx.measureText(row+char).width>maxWidth&&row){lines.push(row);row=char;}else row+=char;}if(row)lines.push(row);lines.slice(0,maxLines).forEach((s,i)=>label(ctx,s,x,y+i*height,size,color));return Math.min(lines.length,maxLines)*height;}
export function ingredientArt(ctx, id, x, y, s=1) {ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 if(id==='batter'){ellipse(ctx,0,12,22,7,'#dbc99f');poly(ctx,[[-22,-3],[22,-3],[16,17],[-16,17]],'#8ba38c');ellipse(ctx,0,-3,22,8,'#f0d799');line(ctx,10,-5,24,-23,'#987652',4);}
 if(id==='egg'){ellipse(ctx,0,4,23,16,'#fdf4d8');circle(ctx,1,3,11,'#e8ac49');circle(ctx,-2,0,3,'#f4ca71');}
 if(id==='crisp'){poly(ctx,[[-21,-10],[10,-20],[23,12],[-10,21]],'#dca947');for(let i=0;i<3;i++)line(ctx,-12,-6+i*8,9,-12+i*8,'#f2d487',2);}
 if(id==='cheese'){poly(ctx,[[-21,-2],[6,-19],[23,-1],[23,18],[-21,18]],'#e4af48');poly(ctx,[[-21,-2],[6,-19],[23,-1],[-21,6]],'#f3ce78');circle(ctx,-7,10,4,'#cb9534');circle(ctx,13,6,3,'#cb9534');}
 if(id==='rice'){ellipse(ctx,0,12,24,8,'#d9c69e');poly(ctx,[[-22,-1],[22,-1],[16,17],[-16,17]],'#c58060');ellipse(ctx,0,-2,22,13,'#faf1d6');for(let i=0;i<5;i++)line(ctx,-12+i*6,-3+(i%2)*4,-9+i*6,-5+(i%2)*4,'#e0d6b7',2);}
 if(id==='nori'){poly(ctx,[[-21,-12],[16,-21],[23,16],[-16,22]],'#587a5e');for(let i=0;i<4;i++)line(ctx,-13,-8+i*8,13,-13+i*8,'#77916c',2);}
 if(id==='scallion'){for(let i=0;i<3;i++){line(ctx,-10+i*10,17,-4+i*13,-18-i*3,'#799b5a',6);line(ctx,-10+i*10,17,-8+i*11,8,'#e3dfaa',6);}circle(ctx,-18,-2,5,'#8aa664');circle(ctx,-18,-2,2,'#e3dfaa');}
 ctx.restore(); }
export function foodArt(ctx,dish,x,y,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);const ids=dish.ingredients;
 if(!ids.length){ellipse(ctx,0,7,53,15,'#22392e24');label(ctx,'等一份热乎的',0,5,11,'#bdc2a5','normal','center');ctx.restore();return;}
 const cooked=dish.status==='cooked',rice=ids.includes('rice');ellipse(ctx,3,12,67,32,'#4e34282b');
 if(rice){poly(ctx,[[-43,29],[-19,-31],[0,-43],[20,-31],[43,29]],cooked?'#bb8240':'#e1cda2');poly(ctx,[[-38,23],[-15,-28],[0,-35],[15,-28],[37,23]],cooked?'#e4bb73':'#f5e8c9');for(let i=0;i<20;i++){const xx=((i*17)%57)-28,yy=((i*23)%41)-12;if(Math.abs(xx)<28-Math.max(0,-yy)*.5)line(ctx,xx,yy,xx+4,yy+1,cooked?'#c18f4a':'#fff7e2',2);}}
 else{ellipse(ctx,0,1,65,35,cooked?(dish.texture==='crisp'?'#a9672f':'#c58d49'):'#d9bc7c');ellipse(ctx,0,-2,61,31,cooked?'#e2b467':'#f1dda5');ellipse(ctx,-8,-12,42,13,'#ffe5a12b');if(cooked)for(let i=0;i<17;i++){const a=i*2.4,rx=24+(i%3)*12;ellipse(ctx,Math.cos(a)*rx,Math.sin(a)*22,3+(i%4),1.4,'#ac6e3670');}}
 if(ids.includes('egg')){ellipse(ctx,-8,-3,31,18,'#fdf3d3');ellipse(ctx,-23,-10,12,8,'#fff9e6');ellipse(ctx,10,1,13,10,'#f7eccc');ellipse(ctx,-9,-5,13,10,'#e5a334');ellipse(ctx,-12,-8,6,3,'#ffe07c');circle(ctx,-15,-9,2,'#fff0b7');}
 if(ids.includes('cheese')){poly(ctx,[[-29,-17],[16,-26],[32,10],[-13,25]],'#df9d30');poly(ctx,[[-27,-18],[15,-25],[29,7],[-12,22]],'#f2c65a');circle(ctx,9,-10,3,'#dcaa43');circle(ctx,-9,8,4,'#e1ab42');line(ctx,-22,-15,12,-22,'#ffe18c',2);if(cooked){line(ctx,4,15,5,28,'#f6d478',3);line(ctx,12,12,18,22,'#edbf59',2);}}
 if(ids.includes('crisp')){poly(ctx,[[14,-24],[40,-12],[25,19],[-1,8]],'#b97c2e');poly(ctx,[[13,-23],[37,-12],[23,16],[1,7]],'#e1ae4c');for(let i=0;i<4;i++)line(ctx,10+i*5,-13+i*2,24+i*2,-7+i*3,'#f5cf76',1);}
 if(ids.includes('nori')){roundRect(ctx,-16,-2,32,30,1,'#304f3c');for(let i=0;i<5;i++)line(ctx,-12,-1+i*6,12,1+i*5,'#66845a',1);for(let i=0;i<3;i++)line(ctx,-9+i*8,1,-7+i*8,25,'#456744',1);}
 if(ids.includes('scallion'))for(const [a,b]of[[-30,-3],[6,-18],[31,6],[-4,21]]){ellipse(ctx,a,b,5,2,'#426b37');ellipse(ctx,a-1,b-1,4,1.4,'#9bb955');}
 if(cooked){line(ctx,-39,-15,-25,-22,'#fff1b270',2);circle(ctx,40,8,2,'#ffe6a4');}
 ctx.restore();}
export function avatar(ctx,id,x,y,color,size=40,mood='calm',time=0){ctx.save();ctx.translate(x,y);ctx.scale(size/80,size/80);
 ellipse(ctx,1,35,31,11,'#3b332828');circle(ctx,0,-1,37,color);ellipse(ctx,0,34,29,22,id==='tang'?'#476a7d':id==='lin'?'#eee3bd':id==='min'?'#6e7b4c':id==='zao'?'#d5ac46':'#e6c08a');
 const hair=id==='zhou'?'#a1a093':id==='lan'?'#686052':'#4f483c';ellipse(ctx,0,-7,26,30,hair);if(id==='lan'){circle(ctx,-24,-15,11,hair);circle(ctx,22,-15,10,hair);}if(id==='man'){ellipse(ctx,-26,7,7,17,hair);ellipse(ctx,26,7,7,17,hair);}
 ellipse(ctx,-22,1,4,7,'#d8aa86');ellipse(ctx,22,1,4,7,'#d8aa86');ellipse(ctx,0,1,22,27,'#efc59f');ellipse(ctx,-5,-6,15,17,'#f6d4b1');poly(ctx,[[-23,-9],[-19,-24],[-4,-29],[0,-18],[20,-9]],hair);
 if(id==='tang'){poly(ctx,[[-27,-20],[-22,-34],[21,-34],[27,-20]],'#466c80');roundRect(ctx,-28,-21,55,7,2,'#2e4a59');roundRect(ctx,-5,-32,10,8,1,'#d9b660');}
 if(id==='lin'){circle(ctx,-14,-28,12,'#f8efd7');circle(ctx,0,-34,15,'#fff7e3');circle(ctx,14,-28,12,'#f8efd7');roundRect(ctx,-22,-29,44,13,3,'#efe0bd');}
 if(id==='zao'){ellipse(ctx,0,-22,28,13,'#e0b447');line(ctx,-27,-18,27,-18,'#9b792c',3);line(ctx,-13,-30,-15,-21,'#f4d47f',3);}
 if(id==='qiao'){poly(ctx,[[-25,-23],[-18,-35],[18,-35],[25,-23]],'#fff5db');line(ctx,0,-32,0,-24,'#c57471',3);line(ctx,-4,-28,4,-28,'#c57471',3);}
 if(id==='min'){poly(ctx,[[-24,-13],[-26,-29],[0,-38],[26,-28],[23,-13],[3,-28]],'#aa6257');for(let i=0;i<4;i++)circle(ctx,-15+i*10,-28+(i%2)*3,2,'#e7b9a1');}
 if(id==='dou'){ellipse(ctx,0,17,15,11,'#796345');ellipse(ctx,0,12,13,6,'#efc59f');line(ctx,-18,33,17,40,'#567a58',9);}
 line(ctx,-12,-7,-5,mood==='urgent'?-9:-7,'#685444',1.4);line(ctx,5,mood==='urgent'?-9:-7,12,-7,'#685444',1.4);
 const blink=Math.floor(time/2200)%5===4;if(blink){line(ctx,-11,0,-6,0,'#615044',1.5);line(ctx,6,0,11,0,'#615044',1.5);}else{circle(ctx,-8,0,2,'#4f473c');circle(ctx,9,0,2,'#4f473c');}
 if(id==='zhou'){roundRect(ctx,-18,-5,14,10,3,null,'#676352');roundRect(ctx,4,-5,14,10,3,null,'#676352');line(ctx,-4,-1,4,-1,'#676352');}
 ellipse(ctx,-15,9,4,2,'#dd9c812b');ellipse(ctx,15,9,4,2,'#dd9c812b');line(ctx,-1,4,1,7,'#ce9878',1);
 if(mood==='happy'){ctx.beginPath();ctx.arc(0,10,7,0,Math.PI);ctx.strokeStyle='#a76d59';ctx.lineWidth=2;ctx.stroke();}else line(ctx,-4,13,4,mood==='urgent'?12:13,'#a46e59',2);
 if(id==='lan'){circle(ctx,22,-21,5,'#e9b6a4');circle(ctx,22,-21,2,'#f7d67f');}line(ctx,-13,30,-12,49,'#f2dfb5',2);line(ctx,13,30,12,49,'#f2dfb5',2);
 ctx.restore();}
export function streetArt(ctx, x, y, w, h, day=0) {ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.translate(x,y);ctx.scale(w/390,h/110);ctx.fillStyle=day===3?'#d9e1d6':'#e2e9d6';ctx.fillRect(0,0,390,110);circle(ctx,335,22,22,'#faebba');poly(ctx,[[0,60],[0,37],[62,37],[62,15],[98,15],[98,110],[0,110]],'#c7d3bd');poly(ctx,[[292,110],[292,35],[350,35],[350,56],[390,56],[390,110]],'#c2cdb9');roundRect(ctx,110,24,174,86,0,'#dfc7a1');roundRect(ctx,130,31,132,26,3,'#8c6f50');label(ctx,'街 角 早 餐 铺',196,44,13,'#f9e7bd','bold','center');poly(ctx,[[102,60],[292,60],[303,82],[91,82]],'#efd7a7');for(let i=0;i<7;i++)poly(ctx,[[103+i*27,60],[116+i*27,60],[112+i*30,82],[96+i*30,82]],'#cb7054');roundRect(ctx,128,85,78,25,0,'#63806a');roundRect(ctx,225,85,39,25,0,'#a28d65');line(ctx,168,86,168,110,'#c9ba87',2);line(ctx,0,108,390,108,'#b6b99b',2);poly(ctx,[[69,110],[92,110],[96,90],[65,90]],'#ae7754');circle(ctx,79,83,17,'#7b9867');circle(ctx,69,77,13,'#8eaa76');roundRect(ctx,316,91,21,19,2,'#b18a61');line(ctx,326,91,328,67,'#7f965f',3);circle(ctx,328,66,8,day>0?'#c4989a':'#90a572');if(day===3)for(let i=0;i<18;i++)line(ctx,i*24,5+(i%3)*17,i*24-8,30+(i%3)*17,'#b7c9b8',1);ctx.restore(); }
