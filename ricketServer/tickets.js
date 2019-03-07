var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')

// SHOULD RECONSIDER SHARETYPES



// POTENTIAL -> can add type back (thinking, doing, learning, etc)
// gets all tickets which one ownes or is shared to requester
router.get('/', async (req, res) => {
    //gets the URI arguments
    //var keys = Object.keys(req.query)
    //var values = Object.values(req.query)

    //query db for all tickets
    const q = { text: "select * from tickets t LEFT JOIN ticketshares ts ON t.id = ts.ticketid where t.owner = $1 OR (t.shared = true and ts.userid =$2)",
                values: [token.byToken(req.headers.token).id, token.byToken(req.headers.token).id] }
    var result = await db.pool.query(q)

    // does below work? filtereing results based on URI arguments and returning as JSON. 
    //var filtered = result.rows.filter(row => keys.every(key => row[key] == values[keys.indexOf(key)]))
    if (result.rowCount >= 0) return res.json({ tickets: result.rows, error: false });
    return res.json( { tickets: false, error: "no tickets returns. "})

})

// Adds a ticket into the tickets table. and return the created ticket. 
// INPUT: req.body: ticket.name, ticket.body, 
// OPTIONAL: ticket.due
router.post('/', async (req, res) => {

    // check whether all info in body:
    // ticket contains = id, date, name, shared, closed, owner, due, body. 
    if (!req.body)          return res.json({ ticket: false, error: "Body is missing completely."})
    if (!req.body.ticket)   return res.json({ ticket: false, error: "ticket is missing completely."})
    if (!req.body.ticket.name)     return res.json({ ticket: false, error: "name is missing" })
    if (!req.body.ticket.body)     return res.json({ ticket: false, error: "name is missing" })

    // consolidate all info into ticket var
    var ticket =  req.body.ticket
    ticket.due = (!req.body.ticket.due)   ?    new Date().toISOString().slice(0,10)   : req.body.ticket.due;

    // querrying hard
    const q = { text: "INSERT INTO tickets (name, body, due, owner) values ( $1, $2, $3, $4) returning *",
                values: [ticket.name, ticket.body, ticket.due, token.byToken(req.headers.token).id] 
              }
    var result = await db.pool.query(q).catch(error => console.log("query failed for some reason." + JSON.stringify(error)))

    //rendering
    if (result.rowCount == 1) return res.json({ ticket : result.rows, error:false })
    return res.json( {result: result, error: "something went wrong with the insert. see console log. POST ./API/tickets/:ticketId"})

})

// Gets a single ticket matching thhe id. which contains: id, date, name, shared, closed, owner, due, and body and
//                        shared data is involved too if relevant
router.get('/:ticketId', async (req, res) => {

    //das query
    const q = {
        text: "SELECT * FROM tickets t LEFT JOIN  ticketshares ts ON t.id = ts.ticketid WHERE t.id = $1 and (t.owner = $2 or (t.shared = true and ts.userid = $3 ))",
        values: [req.params.ticketId, token.byToken(req.headers.token).id, token.byToken(req.headers.token).id]
    }
    var result = await db.pool.query(q)

    // check that really only one result was returned. otherwise send error.
    if (result.rowCount == 1) res.json({ ticket: result.rows[0], error: false })
    if (result.rowCount == 0) res.json({ ticket: result, error: "there was no ticket found with this id. or this ticket is not shared with you. " })
    res.json({ ticket: result, error: "there where more than two tickets returned." })
})









//ERRORCHECK THIS BOII
router.put('/:ticketId', async (req, res) => {
    // ticket contains = id, date, name, shared, closed, owner, due. 
    // CHECK: does not take into account who da owner

    // obtain keys and values. 
    var keys = Object.keys(req.body.ticket); var values = Object.values(req.body.ticket); //console.log(keys); console.log(values);

    // adds in the column names and new values that need to be changed. 
    var sets = []
    for (var i = 0; i < keys.length; i++) { if (keys[i] != "id" && keys[i] != "token") { sets.push(keys[i] + " = " + values[i]) } }
    sets = sets.join(", ")


    //DOES THIS WORK? the sets in the middle without using values? 
    // update db.
    const q = { text: "UPDATE tickets SET " + sets + " WHERE id = $1 AND owner = $2", values: [req.params.ticketId, token.byToken(req.body.token).id] }
    var result = await db.pool.query(q)

    // WHAT DOES RESULT EVEN RETURN? 
    // CHANGE THIS TO ERROR CHECK.
    res.json({ result: result, error: false })

})

//ERRORCHECK THIS BOII
router.put('/:ticketId/:goalId', async (req, res) => {
    //this function should edit the goalId. 

    const q = {
        text: "UPDATE goaltickets SET goalid = $1 where ticketid = $2",
        values: [req.params.goalId, req.params.ticketId]
    }
    var result = await db.pool.query(q)

    if (result.rowCount > 0) return res.json({ result: result.rows, error: false })
    return res.json({ result: result, error: "no rows were returned. is this how it should be in an UPDATE query?" })

})

//ERRORCHECK THIS BOII
router.post('/:ticketId/:goalId', async (req, res) => {

    //this function should add an entry into the goaltickets table. 
    const q = {
        text: "INSERT INTO goaltickets (goalid, ticketid) VALUES ($1, $2)",
        values: [req.params.goalId, req.params.ticketId]
    }
    var result = await db.pool.query(q)

    if (result.rowCount > 0) return res.json({ result: result.rows, error: false })
    return res.json({ result: result, error: "no rows returned! is this normal? does this work?" })

})

// ERRORCHECK THIS BOII
router.delete('/:ticketId/:goalId', async (req, res) => {
    //this function should delete a row from the goaltickets table
    const q = {
        text: "DELETE FROM goaltickets WHERE goalId = $1 and ticketid = $2",
        values: [req.params.goalId, req.params.ticketId]
    }
    var result = await db.pool.query(q);

    if (result.rowCount > 0) return res.json({ result: result.rows, error: false })
    return res.json({ result: result, error: "no rows returned! is this normal? does this work?" })
})

module.exports = router