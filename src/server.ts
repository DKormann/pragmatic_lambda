import { body, div, h1, html, style } from "./html";
import { $, a, builtins, fmt, lam, load, proc, store, type Term } from "./lambda";


let term = html("textarea")({rows: 1, cols: 50}) as HTMLTextAreaElement;

let hist :string[] = []
let hctr = 0
let v : Term [] = []

style(term, {
  resize: "none",
  fontFamily: "monospace",
  width: "100%",
})

let helps = {lam, v, proc, a,  ...Object.fromEntries(Object.entries(builtins).map(([k,v])=>[k, proc(k)]))}

let run = (s:string) => {
  try{
    let r = $(Function( ...Object.keys(helps),"return " + s) (...Object.values(helps)) as Term)
    let f = fmt(r)
    v.push(r)
    return f
  }catch(e){
    return "Error: " + e
  }
}

let query = (t:string)=>{
  t = t.trim();
  hist.push(t)
  hctr = 0
  page.append(t.split("\n").map(line => "$ " + line).join("\n") + "\n\n")
  page.append("v[" + v.length + "]:\n")
  page.append(run(t) + "\n\n")
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
