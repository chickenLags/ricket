
var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')

// returns list with goals
router.get('/', async (req, res) => {
    // query db for goals. 

    console.log("token: " + JSON.stringify(token.byToken(req.headers.token).id))
    const q = { 
      text: "SELECT * FROM goals WHERE owner = $1", 
      values: [token.byToken(req.headers.token).id] 
    }
    
    db.pool.query(q).then(result => {
      res.json({ goals: result.rows, error: false })
    }).catch(result => {
      res.json({ goals: result, error: "no goals returned... are there no goals or is there error?" })
    })

  })
  
// PARAMS: name, description, 
// OPTIONAL: notes.
router.post('/', async (req, res) => {
  // goals contains: id, name, description, completed, notes, owner. 

  //validates required vars
  if (req.body == undefined) return res.json({ error: "no id or req.body was given." })
  if (req.body.name == undefined || req.body.description == undefined) return res.json({ error: "name, description, or owner is missing" })
  var notes = (req.body.notes == undefined) ? "" : req.body.notes;

  // insert into db
  const q = { 
    text: "INSERT INTO goals (name, description, notes, owner) VALUES ($1, $2, $3, $4) RETURNING * ", 
    values: [req.body.name, req.body.description, notes, token.byToken(req.headers.token).id] 
  }
  db.pool.query(q).then(result => {
    res.json({ goals: result.rows, error: false })
  }).catch(result => {
    res.json({ goals: result, error: "insert failed." })
  })
})
  
// returns specified goal
router.get('/:goalId', async (req, res) => {
  // query the db
  const q = { 
    text: "SELECT * FROM goals WHERE owner = $1 and id = $2", 
    values: [token.byToken(req.headers.token).id, req.params.goalId] 
  }
  
  db.pool.query(q).then(result => {
    res.json({ goals: result.rows, error: false })
  }).catch(result => {
    res.json({ goals: result, error: "no rows! is the db empty, did the query not match or is there another error?" })
  })
})

// updates specified goal. only changes the parts received in body. 
// POSSIBLE PARAMS: name, description, completed, notes, owner
router.put('/:goalId', async (req, res) => {
  // goal contains = id, name, description, completed, notes, owner. 

  // obtain keys and values. 
  var keys = Object.keys(req.body); 
  var values = Object.values(req.body); 

  var possibleKeys = ["name", "description", "completed", "notes", "owner"]

  // adds in the column names and new values that need to be changed. 
  var tobeset = []
  var tobevalues = []
  var length = 0;

  for (var i = 0; i < keys.length; i++) {
    if (possibleKeys.indexOf( keys[i]  > -1) ) {
      tobeset.push(keys[i] + "= $" + (length + 1) + "" ) 
      tobevalues.push(values[i])
      length++
    }
  }
  tobeset = tobeset.join(", ")

  tobevalues.push(req.params.goalId)
  tobevalues.push(token.byToken(req.headers.token).id )


  //DOES THIS WORK? the sets in the middle without using values? 
  // update db.
  const q = { 
    text: "UPDATE goals SET " + tobeset + " WHERE id = $" + (length+1) + " AND owner = $" + (length + 2) + " RETURNING * ", 
    values: tobevalues
  }

  db.pool.query(q).then(result => {
    res.json({ goals: result.rows, error: false })
  }).catch(result => {
    res.json({ goals: result, error: "some error occured." })
  })

})


module.exports = router