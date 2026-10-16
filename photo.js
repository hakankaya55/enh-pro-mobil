(()=>{
const q=id=>document.getElementById(id); let raw=null,last=null,busy=false,revision=0;
const block=document.createElement('div');block.className='panel';block.style.marginTop='20px';
block.innerHTML=`<h2>Fotoğraftan Direk Tanıma <small>· Tek Devre</small></h2>
<p class="muted">Üst travers düzeninden tip adayı, gövde çaprazlarından boy kodu. İlk arazi denemesi sürümü.</p>
<div style="display:flex;gap:10px;flex-wrap:wrap"><button id="pCamera" class="green" style="width:auto">📷 FOTOĞRAF ÇEK</button><button id="pChoose" style="width:auto">FOTOĞRAF SEÇ</button></div>
<input id="pCameraFile" type="file" accept="image/*" capture="environment" hidden><input id="pGalleryFile" type="file" accept="image/*" hidden>
<img id="pPreview" alt="Seçilen direk fotoğrafı" hidden style="max-width:100%;max-height:460px;display:block;margin:16px auto;object-fit:contain">
<p class="muted">Tip için üst kısmı net çekin. Boy için direğin zeminden tepeye kadar tamamı ve çaprazları görünmeli.</p>
<p class="muted">Otomatik analiz: bağlantı kurulmadıysa çalışmaz. Aşağıdaki elle karşılaştırma bölümünü bağlantısız kullanabilirsiniz.</p><details><summary>Analiz bağlantısı</summary><p>Otomatik analiz internet bağlantısı ve kurulmuş analiz hizmeti gerektirir. Fotoğraf ANALİZ ET ile gönderilir; API kullanım ücreti olabilir.</p><label>Analiz hizmeti adresi (HTTPS)</label><input id="pUrl" type="url" placeholder="https://…"><label>Bağlantı parolası</label><input id="pToken" type="password" autocomplete="off"><p class="muted">OpenAI anahtarı burada kullanılmaz. Parola bu oturumda tutulur.</p></details>
<button id="pAnalyze" class="green" style="margin-top:16px">FOTOĞRAFI ANALİZ ET</button><div id="pResult" class="result" style="margin-top:16px;white-space:pre-wrap" role="status">Fotoğraf bekleniyor.</div>
<button id="pApply" hidden style="margin-top:10px">SONUCU KONTROL ETTİM · ASİSTANA AKTAR</button>
<details style="margin-top:18px"><summary>Etiketli tek devre referansları</summary><label>Direk tipi</label><select id="pRefType"></select><label>Görsel</label><select id="pRefMode"><option value="field">Arazi fotoğrafı</option><option value="technical">Teknik şema</option></select><img id="pRef" alt="Etiketli referans" style="max-width:100%;max-height:650px;display:block;margin:auto;object-fit:contain"></details>`;
q('boy').appendChild(block);
const countLink=document.createElement('p');countLink.innerHTML='<a href="./count.html">ÜCRETSİZ · Deneysel otomatik çapraz sayımını aç</a>';block.prepend(countLink);
const manual=document.createElement('details');
manual.innerHTML=`<summary>Fotoğrafla elle karşılaştır · Bağlantısız</summary><p>Fotoğrafınızı üstte inceleyin; etiketli referanslarla karşılaştırıp tip ve çapraz sayısını kendiniz seçin. Bu bölüm otomatik tanıma yapmaz.</p><label>Kontrol ettiğiniz direk tipi</label><select id="pManualType"></select><label>Tek yüzde saydığınız gövde çaprazı</label><select id="pManualCross"></select><p id="pManualResult" role="status"></p><button id="pManualApply">SEÇİMİ ASİSTANA AKTAR</button>`;
block.appendChild(manual);
Object.keys(POLE_REFS.poles).forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;q('pManualType').appendChild(o);});
function manualCross(){const e=POLE_REFS.poles[q('pManualType').value];q('pManualCross').replaceChildren();Object.entries(e.cross_to_code).forEach(([n,code])=>{const o=document.createElement('option');o.value=n;o.textContent=n+' çapraz → boy kodu '+(code>=0?'+':'')+code;q('pManualCross').appendChild(o);});manualResult();}
function manualResult(){const code=POLE_REFS.poles[q('pManualType').value].cross_to_code[q('pManualCross').value];q('pManualResult').textContent='Elle seçilen boy kodu: '+(code>=0?'+':'')+code+' (metre değildir).';}
q('pManualType').onchange=manualCross;q('pManualCross').onchange=manualResult;
q('pManualApply').onclick=()=>{q('boyTip').value=q('pManualType').value;updateCross();q('cross').value=q('pManualCross').value;calculateBoy();q('boyTip').scrollIntoView({behavior:'smooth'});};manualCross();
const local=document.createElement('div');
local.innerHTML=`<h3>Ücretsiz · Cihazda benzerlik karşılaştırması</h3><p>Direk fotoğrafın ortasında olmalı. Üst traversin bulunduğu bölümü kullanın. Benzerlik sırası doğruluk oranı değildir; sonuçları referanslarla kontrol edin.</p><label>Üstten kullanılacak bölüm: <span id="pCropValue">40</span>%</label><input id="pCrop" type="range" min="10" max="100" value="40"><p>Yalnızca üst traversi içeren bir fotoğraf seçtiyseniz %100 kullanın.</p><button id="pLocal">ÜCRETSİZ · CİHAZDA KARŞILAŞTIR</button><div id="pLocalResult" role="status" style="white-space:pre-wrap;margin:12px 0"></div>`;
block.insertBefore(local,manual);
q('pCrop').oninput=()=>{q('pCropValue').textContent=q('pCrop').value;};
async function pixels(src,percent,flip=false){
 const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=src;});
 const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d',{willReadFrequently:true});
 const sh=Math.max(1,Math.round(im.height*percent/100)),side=Math.min(im.width,sh),sx=(im.width-side)/2,sy=(sh-side)/2;
 if(flip){ctx.translate(48,0);ctx.scale(-1,1);}ctx.drawImage(im,sx,sy,side,side,0,0,48,48);
 const p=ctx.getImageData(0,0,48,48).data,g=[];for(let i=0;i<p.length;i+=4)g.push(.299*p[i]+.587*p[i+1]+.114*p[i+2]);
 const f=[];let norm=0;for(let y=1;y<47;y++)for(let x=1;x<47;x++){const i=y*48+x,v=Math.abs(g[i+1]-g[i-1])+Math.abs(g[i+48]-g[i-48]);f.push(v);norm+=v*v;}
 norm=Math.sqrt(norm);if(norm<1)throw Error('Görselde yeterli ayrıntı yok.');return f.map(v=>v/norm);
}
q('pLocal').onclick=async()=>{
 if(!raw){q('pLocalResult').textContent='Önce fotoğraf seçin veya çekin.';return;}
 const current=revision,source=raw,percent=Number(q('pCrop').value);q('pLocal').disabled=true;q('pLocalResult').textContent='Cihazda karşılaştırılıyor…';
 try{const target=await pixels(source,percent),rank=[];
 for(const [tip,e] of Object.entries(POLE_REFS.poles)){let best=-1;for(const crop of [30,40,55,100])for(const flip of [false,true]){const f=await pixels(e.field,crop,flip);best=Math.max(best,target.reduce((sum,v,i)=>sum+v*f[i],0));}rank.push({tip,score:best});}
 if(current!==revision)return;rank.sort((a,b)=>b.score-a.score);
 q('pLocalResult').textContent='Olası tipler (görsel benzerlik sırası):\n'+rank.slice(0,3).map((r,i)=>(i+1)+'. '+r.tip).join('\n')+'\n\nEğitilmiş bir model sonucu değildir. Referansları inceleyip aşağıda tipi ve çapraz sayısını kendiniz seçin. Çapraz sayılmadı; boy kodu tahmin edilmedi. Fotoğraf cihazdan gönderilmedi.';
 }catch(e){if(current===revision)q('pLocalResult').textContent='Karşılaştırma açılamadı. Referansların yüklenmesi için ilk açılışı internetle yapın. '+e.message;}
 finally{q('pLocal').disabled=false;}
};
q('pUrl').value=localStorage.getItem('enh-analysis-url')||'';
q('pCamera').onclick=()=>q('pCameraFile').click();q('pChoose').onclick=()=>q('pGalleryFile').click();
function status(s){q('pResult').textContent=s;}
async function pick(e){
 const file=e.target.files[0];if(!file)return; if(file.size>20*1024*1024){status('Fotoğraf en fazla 20 MB olabilir.');return;}
 const current=++revision;q('pLocalResult').textContent='';raw=null;last=null;q('pApply').hidden=true;q('pPreview').hidden=true;
 try{const url=URL.createObjectURL(file);const im=new Image();await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=url;});URL.revokeObjectURL(url);
 const scale=Math.min(1,2000/im.width,2600/im.height);const c=document.createElement('canvas');c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);c.getContext('2d').drawImage(im,0,0,c.width,c.height);
 if(current!==revision)return;raw=c.toDataURL('image/jpeg',.9);q('pPreview').src=raw;q('pPreview').hidden=false;status('Fotoğraf hazır. Üst kısmı ve gövdeyi kontrol edip analizi başlatın.');
 }catch{status('Fotoğraf açılamadı. JPEG veya PNG olarak tekrar seçin.');}
}
q('pCameraFile').onchange=pick;q('pGalleryFile').onchange=pick;
q('pAnalyze').onclick=async()=>{
 if(busy)return;if(!raw){status('Önce fotoğraf çekin veya seçin.');return;}
 const address=q('pUrl').value.trim().replace(/\/$/,'');const token=q('pToken').value.trim();let url;
 try{url=new URL(address);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error();}catch{status('Otomatik analiz için HTTPS analiz hizmeti adresini bağlantı ayarlarına girin.');return;}
 if(!token){status('Analiz hizmetinin bağlantı parolası gerekli.');return;}
 localStorage.setItem('enh-analysis-url',address);busy=true;last=null;q('pAnalyze').disabled=true;q('pApply').hidden=true;status('Üst traversler referanslarla karşılaştırılıyor; ardından çaprazlar incelenecek…');
 const current=revision;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),330000);
 try{const response=await fetch(address+'/analyze',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({image:raw}),signal:controller.signal});const r=await response.json();if(!response.ok)throw Error(r.error||'Analiz tamamlanamadı.');if(current!==revision)return;
 last=r;const code=r.boy_code;status(`Tip adayı: ${r.tip||'Belirlenemedi'}\nGörsel değerlendirme: ${r.confidence}\n${r.reason}\nÇapraz sayısı: ${r.cross_count??'Belirlenemedi'}\nBoy kodu: ${code==null?'Belirlenemedi':(code>=0?'+':'')+code}\n${r.count_reason}\nSonuç metre cinsinden boy değildir; arazide kontrol edin.`);
 q('pApply').hidden=!(r.tip&&code!=null&&POLE_REFS.poles[r.tip]?.cross_to_code[String(r.cross_count)]===code);
 }catch(e){if(current===revision)status(e.name==='AbortError'?'Analiz zaman aşımına uğradı.':(e.message==='Failed to fetch'?'Analiz hizmetine ulaşılamadı. İnternet, HTTPS adresi ve hizmet ayarlarını kontrol edin.':e.message));}
 finally{clearTimeout(timer);busy=false;q('pAnalyze').disabled=false;}
};
q('pApply').onclick=()=>{if(!last)return;q('boyTip').value=last.tip;updateCross();q('cross').value=String(last.cross_count);calculateBoy();q('boyTip').scrollIntoView({behavior:'smooth'});};
Object.keys(POLE_REFS.poles).forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;q('pRefType').appendChild(o);});
function ref(){q('pRef').src=POLE_REFS.poles[q('pRefType').value][q('pRefMode').value];q('pRef').alt=q('pRefType').value+' · '+q('pRefMode').selectedOptions[0].textContent;}
q('pRefType').onchange=ref;q('pRefMode').onchange=ref;ref();
})();
