import { readFileSync } from "node:fs";
const BASE="http://localhost:8882", GUEST={Cookie:"relay_guest=1"};
// Use the real seeded style samples so it's on-voice (like the app does)
const styles = (await (await fetch(`${BASE}/api/style-samples`,{headers:GUEST})).json()).styleSamples.map(s=>s.body);
for (const file of ["Email_Dictation_1.m4a","Email_Dictation_2.m4a","Email_Dictation_3.m4a"]) {
  const buf=readFileSync(`../Resources/Sample Voicenotes/${file}`);
  const fd=new FormData(); fd.append("audio", new Blob([buf],{type:"audio/m4a"}), file);
  const t=await (await fetch(`${BASE}/api/transcribe`,{method:"POST",body:fd,headers:GUEST})).json();
  const d=await (await fetch(`${BASE}/api/draft`,{method:"POST",headers:{"Content-Type":"application/json",...GUEST},
    body:JSON.stringify({transcript:t.transcript,segments:t.segments,tone:"Warm",length:"Standard",styleSamples:styles,signOff:"Thanks,\nConnor",senderName:"Connor",model:"gpt-4.1"})})).json();
  const v=d.verdict||{};
  const blanks = d.paragraphs.filter(p=>p.every(s=>!s.t.trim())).length;
  console.log(`${file}: model=${d.model} status=${d.status} attempts=${v.attempts} fabs=${(v.fabrications||[]).length} acc=${Math.round((v.accuracy??0)*100)}% blankParas=${blanks}`);
}
