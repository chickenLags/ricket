var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')

// SHOULD RECONSIDER SHARETYPES
// CHECK var in body check doesnt work as expected. 


// POTENTIAL -> can add type back (thinking, doing, learning, etc)
// gets all tickets which one ownes or is shared to requester
router.get('/', async (req, res) => {

    //returns tickets where requestor the owner or when he is in ticketshares.userid
    const q = { text: " SELECT DISTINCT t.* FROM tickets t LEFT JOIN ticketshares ts ON t.id = ts.ticketid \
                        WHERE (t.owner = $1 OR ts.userid =$2) \
                        AND t.closed=$3",
                values: [token.byToken(req.headers.token).id, token.byToken(req.headers.token).id, false] }
    var result = await db.pool.query(q)

    if (result.rowCount >= 0) return res.json({ tickets: result.rows, error: false });
    return res.json( { tickets: false, error: "no tickets returns. "})

})

// Adds a ticket into the tickets table. and return the created ticket. 
// INPUT: req.body: ticket.name, ticket.body, 
// OPTIONAL: ticket.due, ticket.goalid
router.post('/', async (req, res) => {
    // check whether all info in body:
    if (!req.body)                  return res.json({ ticket: false, error: "Body is missing completely."})
    if (!req.body.ticket)           return res.json({ ticket: false, error: "ticket is missing completely."})
    if (!req.body.ticket.name)      return res.json({ ticket: false, error: "name is missing" })
    if (!req.body.ticket.body)      return res.json({ ticket: false, error: "name is missing" })
    // consolidate all info into ticket var
    var ticket =  req.body.ticket
    ticket.due = (!req.body.ticket.due)   ?    Date.now()   : req.body.ticket.due;
    ticket.goalid = (!req.body.ticket.goalid) ? null : req.body.ticket.goalid
    ticket.date = Date.now()
    // querrying hard
    const q = { text: "INSERT INTO tickets (name, body, due, owner, goalid, date) values ($1, $2, $3, $4, $5, $6) returning * ",
                values: [ticket.name, ticket.body, ticket.due, token.byToken(req.headers.token).id, ticket.goalid, ticket.date] 
              }
    db.pool.query(q)
        .then( result => {res.json({tickets: result.rows, error: false }) })
        .catch(result => {res.json({tickets: result, error: "Posting ticket failed"}) })
})

// Gets a single ticket matching thhe id. which contains: id, date, name, shared, closed, owner, due, and body and
//                        shared data is involved too if relevant
router.get('/:ticketId', async (req, res) => {

    //das query
    const q = {
        text: "SELECT * FROM tickets t LEFT JOIN  ticketshares ts ON t.id = ts.ticketid WHERE t.id = $1 and (t.owner = $2 or ts.userid = $3 ) Limit 1",
        values: [req.params.ticketId, token.byToken(req.headers.token).id, token.byToken(req.headers.token).id]
    }
    var result = await db.pool.query(q)

    // check that really only one result was returned. otherwise send error.
    if (result.rowCount == 1) res.json({ tickets: result.rows, error: false })
    if (result.rowCount == 0) res.json({ tickets: result, error: "there was no ticket found with this id. or this ticket is not shared with you. " })
    res.json({ ticket: result, error: "there where more than two tickets returned." })
})

// this function shares the specified ticket. 
// PARAMS: userid
router.post('/share/:ticketId', async (req, res) => {
    // check whether vars are there:
    if (!req.body) return res.json({error: "there is no body!"})
    if (! "userid" in req.body) return (res.json({ error: "There is no user id given to whom to share."}))

    
    // LOGIC
    // ADD entry into ticketshares
    // IF ticket is mine or shared to me
    // AND IF the one shared to is not the owner
    const q = {
        text: "\
        INSERT INTO ticketshares (ticketid, userid) \
        SELECT t.id, u.id FROM tickets t LEFT JOIN ticketshares ts on t.id = ts.ticketid LEFT JOIN users u ON u.id = $1 \
        WHERE t.id = $2 AND ( t.owner = $3 OR ts.userid = $3 ) AND NOT t.owner = $1\
        LIMIT 1 \
        returning * ",
        values: [req.body.userid, 
                 req.params.ticketId, token.byToken(req.headers.token).id]
    }

    db.pool.query(q).then(result => {
        res.json({tickets: result.rows, error: false})
    }).catch(result => {
        res.json({ result: result, error: "something went wrong in the queries." })
    })


} )

// unshares the specified ticket
router.delete('/share/:ticketId', async (req, res) =>{
    //check whether required vars are there.
    if (! req.body ) return res.json({ error: "body is missing"})
    if (! "userid" in req.body ) return res.json({ error: "user id to deshare is missing"})

    //LOGIC:
    // remove entry from ticketshares 
    // IF queror is owner or ticket is shared to him
    const q = {
        text: " DELETE FROM ticketshares \
                WHERE ticketid = $1 AND userid = $2 \
                AND EXISTS (SELECT * FROM tickets t LEFT JOIN ticketshares ts ON t.id = ts.ticketid \
                WHERE t.id = $1 AND ( t.owner = $3 OR ts.userid = $3 ) ) \
                RETURNING *",
        values: [ req.params.ticketId, req.body.userid, token.byToken(req.headers.token).id ]
    }

    db.pool.query(q).then( result => {
        res.json({ tickets : result.rows, error: false})
    }).catch(result => {
        res.json({result: result, error: "something went wrong with getting owner of ticket."})
    })
})

// updates the due date of specified ticket
// PARAMS: due
router.put('/due/:ticketId', async (req, res) => {
    // validate required vars
    if(! req.body) return res.json({error: "no body was sent"})
    if(! "due" in req.body) return res.json({error: "no new due date was given."})
    //LOGIC 
    // update tickets due date 
    // IF i am owner or ticket is shared to me.
    const q = {
        text: "\
        UPDATE tickets SET due = $1 \
        WHERE id = $2 \
        AND EXISTS(\
            SELECT * FROM tickets t LEFT JOIN ticketshares ts ON t.id = ts.ticketid \
            WHERE t.id = $2 AND ( t.owner = $3 OR ts.userid = $3 ) )\
        RETURNING *",
        values: [req.body.due, req.params.ticketId, token.byToken(req.headers.token).id]
    }
    db.pool.query(q).then(result => {res.json({tickets: result.rows, due: req.body.due, error: false}) })
                    .catch(result => {res.json({ result: result, due: req.body.due, error: "query failed."}) })
})

// changes ticket.closed in accordance
// PARAMS req.body.closed
router.put('/close/:ticketId', async (req, res) =>{
    //LOGIC:
    // change closed in tickets to given var
    // IF queror owns ticket or is shared to
    const q = {
        text: "UPDATE tickets SET closed = $1 \
                WHERE id = $2 \
                AND EXISTS( \
                    SELECT * FROM tickets t LEFT JOIN ticketshares ts ON t.id = ts.ticketid \
                    WHERE t.id = $2 AND (t.owner = $3 or ts.userid = $3 ) )\
                RETURNING *",
        values: [true, req.params.ticketId, token.byToken(req.headers.token).id]
    }
    db.pool.query(q).then(result => {res.json({ tickets: result.rows, error: false} ) })
                    .catch(result => {res.json({ tickets: result, error: "Query failed for some reason."}) })
})

router.delete('/:ticketId', async(req, res) => {
    const q = {
        text: "DELETE FROM tickets \
                WHERE id = $1 \
                AND EXISTS( \
                    SELECT * FROM tickets t LEFT JOIN ticketshares ts ON t.id = ts.ticketid \
                    WHERE t.id = $1 AND (t.owner = $2 or ts.userid = $2) \
                )",
        values: [req.params.ticketId, token.byToken(req.headers.token).id]
    }

    db.pool.query(q).then(result => {
        res.json({ tickets: result.rows, error: false })
    }).catch(result =>{
        res.json({tickets: result, error: "Delete of ticket failed"})
    })
})

// should change the goalid of specified ticket in goaltickets.
// PARAMS: req.body.goalid
router.put('/setgoal/:goalid', async (req, res) => {
    //LOGIC:
    // update goalid in specified ticket 
    // IF queror is (shared) owner of ticket
    var params = req.body.ticketids
    var todo = ''
    for(var count = 2; count < params.length + 2; count++){
        if (count > 2) todo = todo.concat(', ')
        todo = todo.concat("$", count.toString())
    }
    var values = [req.params.goalid]
    params.map(p => values.push(p))
    const q = {
        text: " UPDATE tickets SET goalid = $1 WHERE id IN (" + todo + ") RETURNING * ",
                values: values
    }
    db.pool.query(q).then(result => {res.json({ tickets: result.rows, error: false})
                  }).catch(result => {res.json({ result: result, error: "something went wrong during the changing of id's"})} )
})

// gets all the tickets with certain goalId
router.get('/goal/:goalId', async (req, res) => {
    const q = { text: "SELECT * from tickets where goalid = $1 AND owner = $2",
                values: [req.params.goalId, token.byToken(req.headers.token).id]
    }
    db.pool.query(q).then(result => { res.json({ tickets: result.rows, error: false}) })
                    .catch(result => {res.json({ result: result, error: "something went wrong during the querying tickets with specific goalid"}) })
})




module.exports = router