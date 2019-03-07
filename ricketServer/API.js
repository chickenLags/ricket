
var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')

// middleware that is specific to this router It checks whether a login token is valid. 
router.use(function timeLog (req, res, next) {
  // check whether logged in. 
  if (!token.byToken(req.body.token)) return res.json({token: false, error: "tried to access API without valid token."})
  next()
})


// define the home page route
router.get('/', function (req, res) {
  res.json({
    value: 'this is the get function in this API. its only function is for testing', 
    token: token.byToken(req.body.token)
  })
})
// define the about route
router.post('/', function (req, res) {
  res.json({
    value: 'this is the post function in this API.its only function is for testing',
    token: token.byToken(req.body.token)
  })
})

router.get('/tickets', async (req, res) => {
  //gets the URI arguments
  var keys = Object.keys(req.query)
  var values = Object.values(req.query)
  
  //query db for all tickets
  const q = { text: "select * from tickets where owner = $1", values: [token.byToken(req.body.token).id] }
  var result = await db.pool.query(q)

  // does below work? filtereing results based on URI arguments and returning as JSON. 
  var filtered = result.rows.filter(row => keys.every(key => row[key] == values[keys.indexOf(key)]))
  res.json({filtered: filtered, message: "should check whether the filter based on URI query works."} );

})

//ERRORCHECK THIS BOII
router.post('/tickets', async (req, res) => {

  // check whether all info in body:
  if (req.body == undefined || req.body.name == undefined) return res.json({ticket: false, error: "name is missing"}) 
  var shared = (req.body.shared == undefined) ? false : req.body.shared;
  var due = (req.body.due == undefined) ? Date.now() : req.body.due;

  // CHECK: does the Date.now give the correct date? 

  // ticket contains = id, date, name, shared, closed, owner, due. 
  const q = {
    text: "INSERT INTO tickets (name, shared, due) values ( $1, $2, $3)",
    values: [req.body.name, shared, due]
  }

  var result = await db.pool.query(q);

  //update contains = id, date, body, change
  const q2 = {
    text: "INSERT INTO updates (body) VALUES ($1)",
    values: [req.body.body]
  }

  var result2 = await db.pool.query(q2);

  //CHECK: what does the db even return on succes and failure? 
  res.json({msg:"what does the db even return on success and failre?", "result from tickets:": result, "result from update": result2})

})

//ERRORCHECK THIS BOII
router.get('/tickets/:ticketId', async (req, res) => {
  //das query
  const q = { text: "SELECT * FROM tickets WHERE id = $1", values: [req.params.ticketId] }
  var result = await db.pool.query(q)

  // check that really only one result was returned. otherwise send error.
  if (result.rowCount == 1) res.json({ticket: result.rows[0], error: false })
  res.json({ticket:false, error: "there where more or less ticket than one with same id."})
})

//ERRORCHECK THIS BOII
router.put('/tickets/:ticketId', async(req, res) => {
  // ticket contains = id, date, name, shared, closed, owner, due. 
  // CHECK: does not take into account who da owner
  
  // obtain keys and values. 
  var keys = Object.keys(req.body.ticket); var values = Object.values(req.body.ticket); //console.log(keys); console.log(values);

  // adds in the column names and new values that need to be changed. 
  var sets = []
  for(var i = 0; i < keys.length; i++){ if (keys[i] != "id" && keys[i] != "token"){  sets.push(keys[i] + " = " + values[i]) } }
  sets = sets.join(", ")


  //DOES THIS WORK? the sets in the middle without using values? 
  // update db.
  const q = { text: "UPDATE tickets SET " + sets + " WHERE id = $1 AND owner = $2",  values: [req.params.ticketId, token.byToken(req.body.token).id] }
  var result = await db.pool.query(q)

  // WHAT DOES RESULT EVEN RETURN? 
  // CHANGE THIS TO ERROR CHECK.
  res.json({result: result, error: false})

})

//ERRORCHECK THIS BOII
router.put('/tickets/:ticketId/:goalId', async (req, res) => {
  //this function should edit the goalId. 

  const q = {
    text: "UPDATE goaltickets SET goalid = $1 where ticketid = $2",
    values: [req.params.goalId, req.params.ticketId] }
  var result = await db.pool.query(q)

  if (result.rowCount > 0) return res.json({result: result.rows, error:false})
  return res.json({result: result, error: "no rows were returned. is this how it should be in an UPDATE query?"})

 }) 

//ERRORCHECK THIS BOII
router.post('/tickets/:ticketId/:goalId', async (req, res) => {

  //this function should add an entry into the goaltickets table. 
  const q = {
    text: "INSERT INTO goaltickets (goalid, ticketid) VALUES ($1, $2)",
    values: [req.params.goalId, req.params.ticketId] }
  var result = await db.pool.query(q)

  if (result.rowCount > 0) return res.json({result: result.rows, error: false})
  return res.json({result: result, error: "no rows returned! is this normal? does this work?"})

 }) 

// ERRORCHECK THIS BOII
router.del('/tickets/:ticketId/:goalId', async (req, res) => {
  //this function should delete a row from the goaltickets table
  const q = {
    text: "DELETE FROM goaltickets WHERE goalId = $1 and ticketid = $2",
    values: [req.params.goalId, req.params.ticketId] }
  var result = await db.pool.query(q);

  if (result.rowCount > 0) return res.json({result: result.rows, error: false})
  return res.json({result: result, error: "no rows returned! is this normal? does this work?"})
 }) 

//ERRORCHECK THIS BOII
router.get('/goals', async (req, res) => {
  // query db for goals. 
  const q = { text: "SELECT * FROM goals WHERE owner = $1", values: [token.byToken(req.body.token).id] }
  var result = await db.pool.query(q)

  //simple error check and renders. 
  if (result.rowCount > 0) return res.json({goals: result.rows, error: false})
  res.json({goals: false, error: "no goals returned... are there no goals or is there error?"})
})

//ERRORCHECK THIS BOII
router.post('/goals', async (req, res) => {
  // goals contains: id, name, description, completed, notes, owner. 
  // check whether id was sent 
  if (req.body == undefined || req.body.id == undefined) return res.json({error: "no id or req.body was given."})

  // check wheter other important things are there:
  if (req.body.name == undefined || req.body.description == undefined || req.body.owner == undefined) return res.json({error: "name, description, or owner is missing"})
  var notes = (req.body.notes == undefined) ? "" : req.body.notes;

  // insert into db
  const q = { text: "INSERT INTO goals (name, description, owner, notes) VALUES ($1, $2, $3, $4)", values: [req.body.name, req.body.description, req.body.owner, notes] }
  result = await db.pool.query(q)

  //WHAT DOES INSERT RETURN? WHAT TO ERRORCHECK FOR?
  if (result) return res.json({result: result, error: false})

})

//ERRORCHECK THIS BOII
router.get('/goals/:goalId', async (req, res) => { 
  // query the db
  const q = { text: "SELECT * FROM goals WHERE owner = $1 and id = $2", values: [token.byToken(req.body.token).id, req.params.goalID] }
  var result = await db.pool.query(q)

  //return without error if rows.
  if (result.rowCount > 0) return res.json({result: result.rows, error: false})
  return res.json({result: result, error: "no rows! is the db empty, did the query not match or is there another error?"})


}) 

//ERRORCHECK THIS BOII
router.put('/goals/:goalId', async (req, res) => { 
  // goal contains = id, name, description, completed, notes, owner. 

  // CHECK does not take into account who da owner
  
  // obtain keys and values. 
  var keys = Object.keys(req.body); var values = Object.values(req.body); //console.log(keys); console.log(values);

  // adds in the column names and new values that need to be changed. 
  var sets = []
  for(var i = 0; i < keys.length; i++){ if (keys[i] != "token" && keys[i] != "id"){  sets.push(keys[i] + " = " + values[i]) } }
  sets.join(", ")


  //DOES THIS WORK? the sets in the middle without using values? 
  // update db.
  const q = { text: "UPDATE goals SET " + sets + " WHERE id = $1",  values: [req.params.goalId] }
  var result = await db.pool.query(q)

  // WHAT DOES RESULT EVEN RETURN? 
  // CHANGE THIS TO ERROR CHECK.
  res.json({result: result, error: false})

})

//ERRORCHECK THIS BOII
router.get('/goals/:goalId/tickets', async (req, res) => { 
  // this function should get all the tickets which are linked to a certain goal ID.
  var goalId = req.params.goalId

  // query db WITH MAD INNER JOIN
  const q = {
    text: "SELECT * FROM tickets t INNER JOIN goaltickets g ON t.id = g.ticketid where owner = $1 and g.id = $2",
    values: [token.byToken(req.body.token).id, req.params.goalId] }
  var result = await db.pool.query(q)

  if (result.rowCount > 0) return res.json({result: result.rows, error: false})
  return res.json({result: false, error: "No rows returned! maybe no matches? maybe error in code"})



}) 

//ERRORCHECK THIS BOII
router.post('/updates/:ticketId', async (req, res) => {
  //this function adds an entry to ticketupdates
  // it creates a update first, then uses its id to enter it into the ticket update table. 
  // updates contains: id, date, body, change

  // do i have all info?
  if (req.body == undefined || req.body.body == undefined ) return res.json({result: false, error: "error: body (description) is missing"}) 
  var change = (req.body.change == undefined) ? false : true;
  var date = (req.body.date == undefined) ? Date.now() : req.body.date;
  

  const q = {
    text: "INSERT INTO updates (date, body, change) VALUES ($1, $2, $3)",
    values: [date, req.body.body, change]
  }

  var result = await db.pool.query(q)

  //DOES THIS CHECK FOR SUCCES?
  if (result) {
    const q2 = {
      text: "INSERT INTO ticketupdates (ticketid, updateid) VALUES ($1, $2)",
      values: [req.params.ticketId, 0] // WHAT DO I EVEN PUT HERE??
    }

    var result2 = await db.pool.query(q)
  }

  if (result2) return res.json({result: result, result2: result2, error: false, msg: "pay attention to return values. to fix the if statements in code!"})
  return res.json({result: result, result2: result2, error: "pay attention to return values. to fix the if statements in code!"})
}) 

module.exports = router