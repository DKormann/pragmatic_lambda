import { DbConnection } from "./bindings";
import { body, div, h1, html, p, style } from "./html";
import { a, fake_builtins, fmt, lam, proc, type Term } from "./lambda";


let send = await new Promise<(query:string)=>Promise<string>>((rs,rj)=>{
  console.log("Connecting to database...")
  DbConnection.builder()
  .withUri("ws://localhost:3000")
  .withDatabaseName("pragmatic-lambda")
  .onConnect((c, i, t)=>{
    console.log("Connected to database, initializing...")
    rs((query:string)=>c.procedures.runTerm({query}).catch(e=> JSON.stringify({error: e.message || String(e)})))})
  .onConnectError((ctx, err)=>rj(err)
).build()})


let term = html("textarea")({rows: 1, cols: 50}) as HTMLTextAreaElement;

let hist :string[] = []
let hctr = 0
let v : Term [] = []

style(term, { resize: "none", fontFamily: "monospace", width: "100%" })

let helps = {lam, v, proc, a,  ...Object.fromEntries(Object.entries(fake_builtins).map(([k,v])=>[k, proc(k)]))}

let query = (t:string)=>{
  t = t.trim();
  hist.push(t)
  hctr = 0
  page.append(t.split("\n").map(line => "$ " + line).join("\n") + "\n\n")
  page.append("v[" + v.length + "]:\n")
  let rr = p("...")
  console.log(...Object.keys(helps))
  let req = Function(...Object.keys(helps), "return " + t)(...Object.values(helps)) as Term

  let l= v.length
  v.push("...")

  send(JSON.stringify(req)).then(res=>{
    let trm = JSON.parse(res) as Term
    rr.textContent = fmt(trm)
    v[l] = trm
  })
  page.append(rr)
  term.value = "";
  term.rows = 1;
}

term.onkeydown = e =>{
  if (e.key == "Enter") {
    if (e.shiftKey) {
      term.rows = term.value.split("\n").length + 1;
      return
    }else{
      e.preventDefault();
      query(term.value);
    }
  }
  if (e.key == "ArrowUp"){
    if (hctr == 0) hist.push(term.value)
    hctr ++
    term.value = hist[hist.length - 1 - hctr] ?? ""
  }
  if (e.key == "ArrowDown" || e.key == "/" && hctr > 0){
    hctr -- 
    term.value = hist[hist.length - 1 - hctr] ?? ""
    e.preventDefault()
  }

  if (e.metaKey){
    if (e.key == "k"){
      page.textContent = "";
    }
  }
  term.rows = term.value.split("\n").length;
}

term.onkeyup = e =>{term.rows = term.value.split("\n").length}

let page = style(div("\n"), {
  whiteSpace: "pre",
})

body.append(
  div(
    style(h1("λ🌎 lambada"), {marginBottom: "0"}),
    page,
    term,
  )
)


term.focus()
