const G={K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'};
const V={P:100,N:320,B:330,R:500,Q:900,K:0};
const N8=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
const K8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const sqn=i=>'abcdefgh'[i&7]+(8-(i>>3));

function init(){
  const b=Array(64).fill(null),o='RNBQKBNR';
  for(let c=0;c<8;c++){b[c]='b'+o[c];b[8+c]='bP';b[48+c]='wP';b[56+c]='w'+o[c];}
  return{b,turn:'w',c:{wK:1,wQ:1,bK:1,bQ:1},ep:-1};
}
function att(b,sq,by){
  const r=sq>>3,c=sq&7,pr=by==='w'?r+1:r-1;
  for(const dc of[-1,1]){const cc=c+dc;if(pr>=0&&pr<8&&cc>=0&&cc<8&&b[pr*8+cc]===by+'P')return true}
  for(const[dr,dc]of N8){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===by+'N')return true}
  for(const[dr,dc]of K8){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<8&&cc>=0&&cc<8&&b[rr*8+cc]===by+'K')return true}
  for(const[dr,dc]of K8){let rr=r+dr,cc=c+dc;const diag=dr&&dc;
    while(rr>=0&&rr<8&&cc>=0&&cc<8){const p=b[rr*8+cc];
      if(p){if(p[0]===by&&(p[1]==='Q'||p[1]===(diag?'B':'R')))return true;break}
      rr+=dr;cc+=dc}}
  return false;
}
function inCheck(s,col){const k=s.b.indexOf(col+'K');return att(s.b,k,col==='w'?'b':'w')}
function gen(s,col){
  const b=s.b,out=[],opp=col==='w'?'b':'w';
  for(let i=0;i<64;i++){
    const p=b[i];if(!p||p[0]!==col)continue;
    const t=p[1],r=i>>3,c=i&7;
    if(t==='P'){
      const d=col==='w'?-1:1,st=col==='w'?6:1,pr=col==='w'?0:7,r1=r+d;
      const add=(to)=>{if(to>>3===pr)for(const q of'QRBN')out.push({f:i,t:to,pr:q});else out.push({f:i,t:to})};
      if(r1<0||r1>7)continue;
      if(!b[r1*8+c]){add(r1*8+c);if(r===st&&!b[(r+2*d)*8+c])out.push({f:i,t:(r+2*d)*8+c,dp:1})}
      for(const dc of[-1,1]){const cc=c+dc;if(cc<0||cc>7)continue;const to=r1*8+cc;
        if(b[to]&&b[to][0]===opp)add(to);else if(to===s.ep)out.push({f:i,t:to,ep:1})}
    }else if(t==='N'||t==='K'){
      for(const[dr,dc]of(t==='N'?N8:K8)){const rr=r+dr,cc=c+dc;if(rr<0||rr>7||cc<0||cc>7)continue;
        const to=rr*8+cc;if(!b[to]||b[to][0]===opp)out.push({f:i,t:to})}
      if(t==='K'){const row=col==='w'?7:0;
        if(i===row*8+4&&!att(b,i,opp)){
          if(s.c[col+'K']&&!b[row*8+5]&&!b[row*8+6]&&b[row*8+7]===col+'R'&&!att(b,row*8+5,opp)&&!att(b,row*8+6,opp))out.push({f:i,t:row*8+6,ca:'K'});
          if(s.c[col+'Q']&&!b[row*8+1]&&!b[row*8+2]&&!b[row*8+3]&&b[row*8]===col+'R'&&!att(b,row*8+3,opp)&&!att(b,row*8+2,opp))out.push({f:i,t:row*8+2,ca:'Q'});
        }}
    }else{
      for(const[dr,dc]of K8){const diag=dr&&dc;
        if(t==='B'&&!diag||t==='R'&&diag)continue;
        let rr=r+dr,cc=c+dc;
        while(rr>=0&&rr<8&&cc>=0&&cc<8){const to=rr*8+cc,q=b[to];
          if(q){if(q[0]===opp)out.push({f:i,t:to});break}
          out.push({f:i,t:to});rr+=dr;cc+=dc}}
    }
  }
  return out;
}
function apply(s,m){
  const b=s.b.slice(),p=b[m.f],col=p[0],c={...s.c};
  b[m.t]=m.pr?col+m.pr:p;b[m.f]=null;
  if(m.ep)b[m.t+(col==='w'?8:-8)]=null;
  if(m.ca){const row=m.f>>3;if(m.ca==='K'){b[row*8+5]=b[row*8+7];b[row*8+7]=null}else{b[row*8+3]=b[row*8];b[row*8]=null}}
  if(p[1]==='K'){c[col+'K']=0;c[col+'Q']=0}
  for(const[sq,k]of[[63,'wK'],[56,'wQ'],[7,'bK'],[0,'bQ']])if(m.f===sq||m.t===sq)c[k]=0;
  return{b,turn:col==='w'?'b':'w',c,ep:m.dp?(m.f+m.t)/2:-1};
}
function legal(s){return gen(s,s.turn).filter(m=>!inCheck(apply(s,m),s.turn))}

/* IA sencilla: búsqueda de 2 jugadas con evaluación de material */
function ev(s){let x=0;for(let i=0;i<64;i++){const p=s.b[i];if(!p)continue;const r=i>>3,c=i&7;
  const v=V[p[1]]+(p[1]==='K'?0:(7-Math.abs(2*r-7)/1+7-Math.abs(2*c-7))*2);x+=p[0]==='w'?v:-v}return x}
function nm(s,d,a,bt){
  const ms=legal(s);
  if(!ms.length)return inCheck(s,s.turn)?-99999-d:0;
  if(!d){const e=ev(s);return s.turn==='w'?e:-e}
  let best=-Infinity;
  for(const m of ms){const v=-nm(apply(s,m),d-1,-bt,-a);if(v>best)best=v;if(v>a)a=v;if(a>=bt)break}
  return best;
}
function aiMove(s){
  let best=null,bv=-Infinity;
  for(const m of legal(s)){const v=-nm(apply(s,m),2,-Infinity,Infinity)+Math.random()*6;if(v>bv){bv=v;best=m}}
  return best;
}

/* Estado de la partida y UI */
let S,hist,log,last,sel,targets,flipped=false,over=false;
const $=id=>document.getElementById(id);
function reset(){S=init();hist=[];log=[];last=null;sel=-1;targets=[];over=false;render()}
function render(){
  const bd=$('board');bd.innerHTML='';
  const lg=legal(S),chk=inCheck(S,S.turn);
  for(let k=0;k<64;k++){
    const i=flipped?63-k:k,r=i>>3,c=i&7,p=S.b[i];
    const d=document.createElement('div');
    d.className='sq '+((r+c)%2?'d':'l');
    if(last&&(i===last.f||i===last.t))d.classList.add('last');
    if(i===sel)d.classList.add('sel');
    if(chk&&p===S.turn+'K')d.classList.add('chk');
    if(targets.includes(i)){d.classList.add('hint');if(p||(S.b[sel]&&S.b[sel][1]==='P'&&i===S.ep))d.classList.add('cap')}
    if(p){const s=document.createElement('span');s.className='pc '+p[0];s.textContent=G[p[1]]+'\uFE0E';d.appendChild(s)}
    if(c===(flipped?7:0)){const e=document.createElement('span');e.className='co r';e.textContent=8-r;d.appendChild(e)}
    if(r===(flipped?0:7)){const e=document.createElement('span');e.className='co f';e.textContent='abcdefgh'[c];d.appendChild(e)}
    d.onclick=()=>click(i);
    bd.appendChild(d);
  }
  const who=S.turn==='w'?'blancas':'negras';
  const st=$('status');st.className='';
  if(!lg.length){over=true;st.className='end';
    st.textContent=chk?`¡Jaque mate! Ganan las ${S.turn==='w'?'negras':'blancas'}`:'Tablas por rey ahogado'}
  else{over=false;st.textContent=`Turno de las ${who}`+(chk?' — ¡Jaque!':'')}
  const mv=$('moves');mv.innerHTML='';
  log.forEach((t,j)=>{if(j%2===0){const n=document.createElement('span');n.className='n';n.textContent=(j/2+1)+'.';mv.appendChild(n)}
    const e=document.createElement('span');e.textContent=t;mv.appendChild(e)});
  mv.scrollTop=mv.scrollHeight;
}
function click(i){
  if(over||(aiOn()&&S.turn==='b'))return;
  const p=S.b[i];
  if(sel>=0&&targets.includes(i)){
    const ms=legal(S).filter(m=>m.f===sel&&m.t===i);
    if(ms.length>1){askPromo(ms);return}
    play(ms[0]);return;
  }
  if(p&&p[0]===S.turn){sel=i;targets=legal(S).filter(m=>m.f===i).map(m=>m.t)}
  else{sel=-1;targets=[]}
  render();
}
function askPromo(ms){
  const pb=$('pb');pb.innerHTML='';
  for(const m of ms){const b=document.createElement('button');b.textContent=G[m.pr]+'\uFE0E';
    b.onclick=()=>{$('promo').classList.remove('on');play(m)};pb.appendChild(b)}
  $('promo').classList.add('on');
}
function play(m){
  hist.push({S,last,n:log.length});
  const p=S.b[m.f],cap=S.b[m.t]||m.ep;
  let t=m.ca?(m.ca==='K'?'O-O':'O-O-O'):(p[1]==='P'?'':p[1])+sqn(m.f)+(cap?'x':'-')+sqn(m.t)+(m.pr?'='+m.pr:'');
  S=apply(S,m);last=m;sel=-1;targets=[];
  const has=legal(S).length>0,ck=inCheck(S,S.turn);
  t+=ck?(has?'+':'#'):'';log.push(t);
  render();
  if(aiOn()&&S.turn==='b'&&has)setTimeout(()=>{const a=aiMove(S);if(a)play(a)},350);
}
const aiOn=()=>$('mode').value==='1';
$('new').onclick=reset;
$('flip').onclick=()=>{flipped=!flipped;render()};
$('mode').onchange=reset;
$('undo').onclick=()=>{
  if(!hist.length)return;
  let h=hist.pop();
  if(aiOn()&&hist.length&&h.S.turn==='b')h=hist.pop();
  S=h.S;last=h.last;log.length=h.n;sel=-1;targets=[];render();
};
reset();
