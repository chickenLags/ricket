const express = require('express')
const app = express()
const cors  = require('cors')
const port = process.env.PORT || 5000
const db = require('./classes/db')
const token = require('./classes/token')
var bodyParser = require('body-parser');

//enables cors
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type', 'token', 'Access-Control-Allow-Origin'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
}))
app.use(bodyParser())
app.use( (req, res, next) => {
  //console.log("received headers: " + JSON.stringify(req.headers))
  console.log("received body: " + JSON.stringify(req.body))
  console.log("received params: " + JSON.stringify(req.params))
  console.log("received message on: " + new Date().toGMTString())
  next()
})
var API = require('./API')
//app.get('/users', async (req, res) => { const q = { text: "select * from users" } var result = await db.pool.query(q) res.json(result.rows) })
// returns token for the loginer. 
// PARAMS: body.password, body.username
app.post('/login', async (req, res) => {
  console.log("getting into the LOGIN path.")
  //renders error when the login credentials weren't sent at all or partly.
  if (req.body == undefined ) return res.json({token: false, error: "no body at all"})
  if (!req.body.username) return res.json( {token: false, error: "no username sent in body."} )
  if (!req.body.password) return res.json( {token: false, error: "no password sent in body."} )
  //queries db for user
  const q = {
    text: "select * from users where username = $1 and password = $2", 
    values: [req.body.username, req.body.password] 
  } 
  db.pool.query(q).then(result => {
    if (result.rowCount == 1) {
      var myToken = token.generateToken(result.rows[0]);
      res.json({token: myToken, error: false})
    }else {
      res.json({token:result, error: "wrong username or password"})
  }}).catch(result => {
    res.json( {result: result, error: "Error occured in logging in" })
  })
})
app.use('/API',API)
app.listen(port, () => console.log(`Ricket server listening on port ${port}!`))