
var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')

//ERRORCHECK THIS BOII
router.get('/', async (req, res) => {
    // query db for goals. 
    const q = { text: "SELECT * FROM goals WHERE owner = $1", values: [token.byToken(req.body.token).id] }
    var result = await db.pool.query(q)
  
    //simple error check and renders. 
    if (result.rowCount > 0) return res.json({ goals: result.rows, error: false })
    res.json({ goals: false, error: "no goals returned... are there no goals or is there error?" })
  })
  
  //ERRORCHECK THIS BOII
  router.post('/', async (req, res) => {
    // goals contains: id, name, description, completed, notes, owner. 
    // check whether id was sent 
    if (req.body == undefined || req.body.id == undefined) return res.json({ error: "no id or req.body was given." })
  
    // check wheter other important things are there:
    if (req.body.name == undefined || req.body.description == undefined || req.body.owner == undefined) return res.json({ error: "name, description, or owner is missing" })
    var notes = (req.body.notes == undefined) ? "" : req.body.notes;
  
    // insert into db
    const q = { text: "INSERT INTO goals (name, description, owner, notes) VALUES ($1, $2, $3, $4)", values: [req.body.name, req.body.description, req.body.owner, notes] }
    result = await db.pool.query(q)
  
    //WHAT DOES INSERT RETURN? WHAT TO ERRORCHECK FOR?
    if (result) return res.json({ result: result, error: false })
  
  })
  
  //ERRORCHECK THIS BOII
  router.get('/:goalId', async (req, res) => {
    // query the db
    const q = { text: "SELECT * FROM goals WHERE owner = $1 and id = $2", values: [token.byToken(req.body.token).id, req.params.goalID] }
    var result = await db.pool.query(q)
  
    //return without error if rows.
    if (result.rowCount > 0) return res.json({ result: result.rows, error: false })
    return res.json({ result: result, error: "no rows! is the db empty, did the query not match or is there another error?" })
  
  
  })
  
  //ERRORCHECK THIS BOII
  router.put('/:goalId', async (req, res) => {
    // goal contains = id, name, description, completed, notes, owner. 
  
    // CHECK does not take into account who da owner
  
    // obtain keys and values. 
    var keys = Object.keys(req.body); var values = Object.values(req.body); //console.log(keys); console.log(values);
  
    // adds in the column names and new values that need to be changed. 
    var sets = []
    for (var i = 0; i < keys.length; i++) { if (keys[i] != "token" && keys[i] != "id") { sets.push(keys[i] + " = " + values[i]) } }
    sets.join(", ")
  
  
    //DOES THIS WORK? the sets in the middle without using values? 
    // update db.
    const q = { text: "UPDATE goals SET " + sets + " WHERE id = $1", values: [req.params.goalId] }
    var result = await db.pool.query(q)
  
    // WHAT DOES RESULT EVEN RETURN? 
    // CHANGE THIS TO ERROR CHECK.
    res.json({ result: result, error: false })
  
  })
  
  //ERRORCHECK THIS BOII
  router.get('/:goalId/tickets', async (req, res) => {
    // this function should get all the tickets which are linked to a certain goal ID.
    var goalId = req.params.goalId
  
    // query db WITH MAD INNER JOIN
    const q = {
      text: "SELECT * FROM tickets t INNER JOIN goaltickets g ON t.id = g.ticketid where owner = $1 and g.id = $2",
      values: [token.byToken(req.body.token).id, req.params.goalId]
    }
    var result = await db.pool.query(q)
  
    if (result.rowCount > 0) return res.json({ result: result.rows, error: false })
    return res.json({ result: false, error: "No rows returned! maybe no matches? maybe error in code" })
  
  
  
  })


  module.exports = router