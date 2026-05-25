import { DbConnection } from "./bindings";
import { body, button, div, h1, html, p, style } from "./html";
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


// let term = html("textarea")({rows: 1, cols: 50}) as HTMLTextAreaElement;


// let hist :string[] = JSON.parse(localStorage.getItem("history") ?? "[]") as string[]

let v : Term [] = []

// style(term, {
//   resize: "none",
//   fontFamily: "monospace",
//   width: "100%",
//   border: "none",
//   background: "transparent",
//   margin: "0",
//   padding: "0 7px",
// });

// (term.style as any).caretShape = "block"

let helps = {lam, v, proc, a,  ...Object.fromEntries(Object.entries(fake_builtins).map(([k,v])=>[k, proc(k)]))}

// let query = (t:string)=>{
//   t = t.trim();
//   hist.push(t)
//   localStorage.setItem("history", JSON.stringify(hist.slice(-50)))
//   hctr = 0
//   page.append(t.split("\n").map(line => "$ " + line).join("\n") + "\n\n")
//   page.append("v[" + v.length + "]:\n")
//   let rr = p("...")
//   console.log(...Object.keys(helps))


//   let l= v.length
//   v.push("...")
//   page.append(rr)


//   try{
//     let req = Function(...Object.keys(helps), "return " + t)(...Object.values(helps)) as Term
//     send(JSON.stringify(req)).then(res=>{
//       console.log("got response", res)
//       let trm = JSON.parse(res) as Term

//       rr.textContent = fmt(trm)
//       v[l] = trm
//     })
//     term.value = "";
//     term.rows = 1;
//   }
//   catch(e: any){
//     v[l] = "error"
//     rr.textContent = "Error: " + (e.message || String(e))

//   }

// }

// term.onkeydown = e =>{
//   if (e.key == "Enter") {
//     if (e.shiftKey) {
//       term.rows = term.value.split("\n").length + 1;
//       return
//     }else{
//       e.preventDefault();
//       query(term.value);
//     }
//   }
//   if (e.key == "ArrowUp"){
//     if (hctr == 0) hist.push(term.value)
//     hctr ++
//     term.value = hist[hist.length - 1 - hctr] ?? ""
//   }
//   if (e.key == "ArrowDown" || e.key == "/" && hctr > 0){
//     hctr -- 
//     term.value = hist[hist.length - 1 - hctr] ?? ""
//     e.preventDefault()
//   }

//   if (e.metaKey){
//     if (e.key == "k"){
//       page.textContent = "";
//     }
//   }
//   term.rows = term.value.split("\n").length;
// }

type Cell = {
  query: string,
  result: string
}



const mkcell = (content: string, output? : string ) => {

  console.log("mkcell", {content, output})
  let hitem = {
    query: content,
    result: output
  } as Cell

  hist.push(hitem)
  let c = hist.length


  let setstate = (query: string, result: string) => {
    hitem.query = query
    hitem.result = result
    localStorage.setItem("history", JSON.stringify(hist.slice(-50)))
    term.value = query
    term.rows = term.value.split("\n").length

    outview.textContent = result

    if (result.length) {
      let trm = JSON.parse(result) as Term
      outview.textContent = "v[" + v.length + "]:\n" + fmt(trm)
      v.push(trm)
    }
    
  }

  let term = html("textarea")({rows: 1, cols: 50}) as HTMLTextAreaElement;
  let outview = p()

  style(term, {
    resize: "none",
    fontFamily: "monospace",
    width: "100%",
    border: "none",
    background: "transparent",
    margin: "0",
    padding: "0 7px",
    overflow: "scroll",
  });

  (term.style as any).caretShape = "block"
  setstate(content, output ?? "")

  term.onkeydown = e =>{
    if (e.key == "Enter") {
      if (e.shiftKey) {
        term.rows = term.value.split("\n").length + 1;

        return
      }else{
        e.preventDefault();
        exec()
        if (c == hist.length) mkcell("", "")

      }
    }
  }

  let exec = () => {
    console.log("Executing query", term.value)
    setstate(term.value, "")
    try{
      let req = Function(...Object.keys(helps), "return " + term.value)(...Object.values(helps)) as Term
      send(JSON.stringify(req)).then(res=>{
        console.log("got response", res)
        setstate(term.value, res)
      })
    }
    catch(e: any){
      setstate(term.value, JSON.stringify({error: e.message || String(e)}))
    }

  }

  let cell = div(
    style(div(html("span")("$"), term), {
      display: "flex",
      flexDirection: "row",
    }),
    outview
  )
  style(cell,{
    border: "1px solid var(--color)",
    margin: "10px",
    borderRadius: "5px",
    padding: "10px",
  })
  page.append(cell)

  term.focus()

  if (output == undefined) exec()

}


const reset = () => {
  page.replaceChildren()
  hist = []
  mkcell("","")
  localStorage.removeItem("history")
}

const tutorial = () => {
  reset();
  v = []
  page.replaceChildren()
mkcell(`

Welcome to the lambda world interactive tutorial.
we use a Term language embedded in JavaScript that supports homoiconic representation of functions.
the basic Term is defined as:


type Dat = string | number | Dat[]
type Fun = {$fun: [number, "proc", string] | [number, "lam", Term]}
type Var = {$var: number}
type App = {$app: [Term, Term]}
type Term = Dat | Fun | Var | App

In this notebook environment, user queries get evaluated in JS to create Terms, which are evaluated on the Server.
first a cell that is just a number:
`, "");
mkcell("22 + 11 // try to edit this value and press Enter");
mkcell(`
There are 3 helpers that help construct terms in JS:
lam: construct a pure lambda,
proc: construct a procedure,
a: construct an application.`,'')
mkcell(`lam((x,y) => x) // here we create a lambda. the result gets pretty printed and stored in the v array. You can reference it results in the v array in future calls.`)
mkcell(`proc(x=>x+1) // procedures are allowed to use full JS syntax internally but they are limited in accessing global variables.`)
mkcell(`a(v[2], 41) // using a we construct a call to the previous procedure. press Enter here to run this cell`, "")

mkcell(`
There are 3 builtin methods to create global effects:

store(key, value) - stores a value under a key in the server's persistent storage
load(key) - loads a value from the server's persistent storage
secret(fn, arg) - calls fn with its own secret fingerprint and the provided argument. this can be used by functions to define or share private state in a finegrained manner.
`, '')

mkcell(`a(proc(x=>store("hello", x)), "world") // this will store at the global server for all to see`)
mkcell(`a(proc(x=>load("hello")), 0) // this will load the value we just stored`)


mkcell(`proc((privkey, arg)=>{
  let ctr = load("counter")
  store("counter", ctr + 1)
  return "people called this tutorial "  + ctr + " times before"
})//construct a global counter function`)

mkcell(`a(secret, v[5], 0) // this is how to call a proc with secret provided.`, '')

}




body.onkeydown = e => {
  if (e.metaKey){
    if (e.key == "k"){
      reset()
      mkcell("","")
    }
  }
}

let page = style(div(), {whiteSpace: "pre", paddingTop: "20px"});

let hist: Cell[] = [];

body.append(
  div(
    h1("λ🌎 lambada"),
    button(reset, "Reset"),
    button(tutorial, "Tutorial"),
    page,
  )
);

((JSON.parse(localStorage.getItem("history") ?? "null") ?? [
  {
    query: "22",
    result: "22"
  }
]) as Cell[]).forEach(c=>mkcell(c.query, c.result))


tutorial()