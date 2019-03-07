const express = require('express')
const app = express()
const cors  = require('cors')
const port = 5000

const db = require('./classes/db')
const token = require('./classes/token')

var bodyParser = require('body-parser');

//enables cors
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
  }));

  app.use(bodyParser())


var API = require('./API')

app.get('/', (req, res) => res.send('Hello World!'))

//app.get('/users', async (req, res) => { const q = { text: "select * from users" } var result = await db.pool.query(q) res.json(result.rows) })

app.get('/login', async (req, res) => {
  //renders error when the login credentials weren't sent at all or partly.
  if (req.body == undefined ) return res.json({token: false, error: "no body at all"})
  if (req.body.username == undefined || req.body.password == undefined) return res.json({token: false, error: "username or password not sent"})

  //queries db for user
  const q = {text: "select * from users where username = $1 and password = $2", values: [req.body.username, req.body.password] }  
  var result = await db.pool.query(q)

  //checking whether user exists in db. and whether token already exists. then returns token or error.
  if (result.rowCount == 1) {
    var myToken = (token.byUsername(req.body.username)) ? token.byUsername(req.body.username) : token.generateToken(result.rows[0]);
    return res.json({token: myToken, error: false})
  }else if(result.rowCount > 1)   return res.json({token: false, error: "somehow more than one user with these credentials in database."})
  else res.json({token: false, error: "Wrong username or password"})

})


app.use('/API',API)


app.listen(port, () => console.log(`Ricket server listening on port ${port}!`))