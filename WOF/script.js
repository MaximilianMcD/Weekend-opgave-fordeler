let elever=JSON.parse(localStorage.getItem("elever"))||["Anders And","Peter Plys"];
let tasks=JSON.parse(localStorage.getItem("tasks"))||[{n:"Plukke Æbler",p:3,c:2,d:"alle"}];
let data=JSON.parse(localStorage.getItem("data"))||{};

elever.forEach(e=>{if(!data[e])data[e]={point:0,historik:[],sidste:null}});

function save(){
    localStorage.setItem("elever",JSON.stringify(elever));
    localStorage.setItem("tasks",JSON.stringify(tasks));
    localStorage.setItem("data",JSON.stringify(data));
}

function renderElev(){
    let d=document.getElementById("elevList");d.innerHTML="";
    elever.forEach(e=>d.innerHTML+=`<div><input type=checkbox checked value="${e}"> ${e}</div>`);
}

function vaelgAlle(val){
    document.querySelectorAll("#elevList input").forEach(cb => cb.checked = val);
}

function visData(){
    let d=document.getElementById("data");d.innerHTML="";
    Object.entries(data).forEach(([e,v])=>{
        d.innerHTML+=`${e} <span class='badge'>${v.point}p</span><br>`;
    });
}

function fairnessScore(){
    let pts=Object.values(data).map(d=>d.point);
    if(pts.length===0)return;
    let max=Math.max(...pts),min=Math.min(...pts);
    let score=100-(max-min)*10;
    document.getElementById("fairness").innerText="Fairness: "+Math.max(0,score)+"%";
}

function getTasks(day){
    return tasks.filter(t=>t.d==="alle"||(t.d==="weekend"&&day!="fredag")||(t.d==="søndag"&&day==="søndag"));
}

function score(e,op){
    let s=data[e].point;
    if(data[e].sidste==op.n)s+=5;
    if(data[e].historik.slice(-3).includes(op.n))s+=3;
    return s;
}

function choose(aktive,op){
    return aktive.sort((a,b)=>score(a,op)-score(b,op))[0];
}

function lavDag(day,aktive){
    let res=[];
    getTasks(day).forEach(op=>{
        for(let i=0;i<op.c;i++){
            let e=choose([...aktive],op);
            data[e].point+=op.p;
            data[e].sidste=op.n;
            data[e].historik.push(op.n);
            res.push({opgave:op.n,elev:e});
        }
    });
    return res;
}

function render(id,rows){
    let t=document.getElementById(id);t.innerHTML="";
    rows.forEach(r=>{
        let options=elever.map(e=>`<option ${e===r.elev?"selected":""}>${e}</option>`).join("");
        t.innerHTML+=`<tr><td>${r.opgave}</td><td><select onchange="changeElev('${r.opgave}',this.value)">${options}</select></td></tr>`;
    });
}

function changeElev(opgave,newElev){
    data[newElev].point+=1;
    save();visData();fairnessScore();
}

function fordel(){
    let aktive=[...document.querySelectorAll("input:checked")].map(e=>e.value);
    let inaktive=elever.filter(e=>!aktive.includes(e));

    // beregn gennemsnit point
    let total=0;
    let count=0;
    Object.values(data).forEach(d=>{total+=d.point; count++;});
    let avg = count>0 ? Math.round(total/count) : 0;

    // giv fraværende gennemsnit
    inaktive.forEach(e=>{
        data[e].point = Math.round((data[e].point + avg) /1.75);
    });

    let f = lavDag("fredag",aktive);
    let l = lavDag("lørdag",aktive);
    let s = lavDag("søndag",aktive);

    render("fredag",f);
    render("lordag",l);
    render("sondag",s);

    gemWeekend({fredag:f,lørdag:l,søndag:s});

    save();
    visData();
    fairnessScore();
    visWeekender();
}


function resetPoint(){
    Object.values(data).forEach(d=>{d.point=0;d.historik=[];d.sidste=null});
    save();visData();fairnessScore();
}

function openElevEditor(){document.getElementById("elevModal").style.display="flex";renderEditor();}
function closeElevModal(){document.getElementById("elevModal").style.display="none";}
function renderEditor(){
    let d=document.getElementById("editorList");d.innerHTML="";
    elever.forEach((e,i)=>d.innerHTML+=`${e} <button onclick='removeElev(${i})'>X</button><br>`);
}
function addElev(){
    let v=newElev.value;if(!v)return;
    elever.push(v);data[v]={point:0,historik:[],sidste:null};
    save();renderElev();renderEditor();
}
function removeElev(i){delete data[elever[i]];elever.splice(i,1);save();renderElev();renderEditor();}

function openTaskEditor(){document.getElementById("taskModal").style.display="flex";renderTasks();}
function closeTaskModal(){document.getElementById("taskModal").style.display="none";}
function renderTasks(){
    let d=document.getElementById("taskList");d.innerHTML="";
    tasks.forEach((t,i)=>d.innerHTML+=`${t.n} (${t.p}p x${t.c}) <button onclick='removeTask(${i})'>X</button><br>`);
}
function addTask(){
    let n=tNavn.value,p=+tPoint.value,c=+tCount.value,d=tDag.value;
    if(!n||!p||!c)return;
    tasks.push({n,p,c,d});save();renderTasks();
}
function removeTask(i){tasks.splice(i,1);save();renderTasks();}

renderElev();visData();fairnessScore();

// --- GEM WEEKENDER ---
let weekends = JSON.parse(localStorage.getItem("weekends")) || [];

function gemWeekend(plan){
    let dato = new Date().toLocaleString();
    weekends.push({dato, plan});
    localStorage.setItem("weekends", JSON.stringify(weekends));
}

function visWeekender(){
    let d = document.getElementById("data");
    d.innerHTML += "<hr><b>Tidligere weekender:</b><br>";
    weekends.slice(-5).reverse().forEach((w,i)=>{
        d.innerHTML += `<div style='cursor:pointer;color:#2563eb' onclick='visWeekendDetalje(${weekends.length-1-i})'><u>${w.dato}</u></div>`;
    });
}

function visWeekendDetalje(index){
    let w = weekends[index];
    if(!w) return;

    render("fredag", w.plan.fredag);
    render("lordag", w.plan.lørdag);
    render("sondag", w.plan.søndag);

    document.getElementById("fairness").innerText = `"Viser historik for ${w.dato}"`;
}

visWeekender();

function openHelp() {document.getElementById("helpModal").style.display="flex";}
function closeHelp(){document.getElementById("helpModal").style.display="none";}