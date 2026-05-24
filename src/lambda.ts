import {hash} from "./hash"


export const store = (k:Term, v:Term)=> {
  localStorage.setItem(hashTerm(k), JSON.stringify(v))
  return "ok"
}

export const load = (k:Term): Term | undefined =>{
  let res = localStorage.getItem(hashTerm(k))
  return res ? JSON.parse(res) : undefined
}

export const hashTerm = (t:Term):string =>mat(t,
  d=> hash(JSON.stringify(d)),
  (n,t,b)=> hash("lam" + n + t + hashTerm(b)),
  (f,x) => hash("app" + hashTerm(f) + hashTerm(x)),
  (v) => hash("var" + v)
)

export const reset = ()=> localStorage.clear()
let runtimeKey = "s3cr3t"
const secret = (fn:Term, arg:Term):Term=> $(fn, hash(hashTerm(fn) + runtimeKey), arg)

export const builtins : {[key:string]: Function}  = {store, load, secret }

type Dat = string | number | Dat[]
type Fun = {$fun: [number, "proc", string] | [number, "lam", Term]}
type Var = {$var: number}
type App = {$app: [Term, Term]}
export type Term = Dat | Fun | Var | App

export const mat = <T>(w:Term, d:(d:Dat)=>T, f:(n:number, tag:"proc" | "lam", b:Term)=>T, a:(app:Term,b:Term)=>T, v:(v:number)=>T):T=>
  (Array.isArray(w) || typeof w != "object") ? d(w)
: ("$fun" in w) ? f(...w.$fun as [number, "proc", string]) : ("$app" in w) ? a(...w.$app) : v(w.$var)

const mklam = (arity: number, body: Term):Fun => ({$fun: [arity, "lam", body]})

export const mkproc = (code: string): Lam =>Function(...Object.keys(builtins),"return " + code)(...Object.values(builtins))
export const proc = (code:string):Fun => ({$fun: [ mkproc(code).length, "proc", code]})


export const a = (f:Term,...xs:Term[]): Term => xs.reduce((f,x)=>({$app:[f,x]}), f)

const kal = (f:Term, env:Term[]):Term => mat<Term>(f,()=>f, ()=>f,(f,x)=> a(kal(f, env), kal(x, env)), v=> env[v]!)


export const $ = (v:Term, ...args:Term[]):Term=>mat<Term>(v,
  d=>a(d, ...args),
  (n,t,b)=>
    (n>args.length) ? a(v, ...args)
    : $(
      (t=="proc") ? mkproc(b as string) ( ...args.slice(0,n).map(x=>$(x)))
      : kal(b, args.slice(0, n).map(x=>$(x))), ...args.slice(n).map(x=>$(x))
    ),
  (f,x)=> $(f,x,...args),
  ()=>a(v, ...args.map(x=>$(x)))
)


export const fmt = (v:Term):string=>{
  let defs: Term[] = []

  let code = ""
  let gob = (v:Term):string => mat(v,
    d=>JSON.stringify(d),
    (n,t,b)=>{
      if (!defs.includes(v)){
        defs.push(v)
        let argstr =Array.from({length:n}, (_,i )=>`x${i}`).join(", ")
        let c = `l${defs.length-1} = ${ t == "proc" ? `proc(${JSON.stringify(b)})` : "lam((" + argstr + ")=>" + gob(b) + ")"}\n`
        code += c
      }
      return `l${defs.indexOf(v)!}`
    },
    (f,x)=> `$(${gob(f)}, ${gob(x)})`,
    v=> `x${v}`
  )
  let c = gob(v)
  return code + c
}

export type Lam = (...x:Term[])=>Term

export const lam = (f: Lam):Term =>{
  let vars = Array.from({length: f.length}, (_,i )=> ({$var: i} as Var))
  let vmap = new Map<Var, Var> ()
  let go =(t:Term):Term=> mat<Term>(t,
    ()=>t, ()=> t, (a,b)=> ({$app:[go(a), go(b)] }),
    () => vars.includes(t as Var) ? t : vmap.getOrInsertComputed(t as Var, ()=> ({$var: vmap.size } as Var))!
  )

  let bod = f(...vars)
  bod = go(bod)

  vars.forEach (v=>v.$var += vmap.size)
  let res = a(mklam(f.length + vmap.size, bod), ...vmap.keys())
  return res
}

