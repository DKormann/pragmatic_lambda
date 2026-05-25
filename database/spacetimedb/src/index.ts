import { schema, table, t } from 'spacetimedb/server';
import { type Term, run, fmt } from "../../../src/lambda"

const spacetimedb = schema({
  runtime_salt: table({},{salt: t.string()}),
  store: table(
    {},{
      key: t.string().primaryKey(),
      value: t.string(),
    }
  )
});

export default spacetimedb;
export const init = spacetimedb.init(_ctx => {_ctx.db.runtime_salt.insert({salt: Math.random().toString(36).slice(2)})});
export const onConnect = spacetimedb.clientConnected(_ctx => {});
export const onDisconnect = spacetimedb.clientDisconnected(_ctx => {});

export const runTerm = spacetimedb.procedure(
  { query: t.string() },
  t.string(),
  (c, { query }) =>{
    let term = JSON.parse(query) as Term
    let res = c.withTx(c=>{
      return run(term,
        (k,v)=>c.db.store.insert({key:k, value:v}),
        k=> {
          let r = c.db.store.key.find(k)
          return r ? r.value : undefined
        },
        c.db.runtime_salt.iter().next().value!.salt
      )
    })
    return JSON.stringify(res)
  }
)


