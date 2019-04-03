var express = require('express')
var router = express.Router()
//specific imports
var token = require('./classes/token')
var db = require('./classes/db')
// returns all subjects of this specific ticket.
router.get('/', async (req, res) => {
    const q = {
        text: "SELECT * FROM subjects \
           WHERE EXISTS( \
              SELECT * FROM subjects \
              WHERE owner = $1 \
           )",
        values: [token.byToken(req.headers.token).id]
    }
    db.pool.query(q)
        .then(result => res.json({ subjects: result.rows, error: false }))
        .catch(result => res.json({ result: result, error: "Error occured when retrieving subjects." }))
})
// creates a new subject (id, name, description, closed, notes, owner, date)
// BODY PARAMS: name, description, 
// OPTIONAL BODY PARAMS: notes 
router.post('/', async (req, res) => {
    // do i have vars?
    if (req.body == undefined) return res.json({ subjects: false, error: "POST request has no body." })
    if (req.body.name == undefined) return res.json({ subjects: false, error: "POST request has no body.name." })
    if (req.body.description == undefined) return res.json({ subjects: false, error: "POST request has no body.description." })
    var notes = (req.body.notes == undefined) ? "" : req.body.notes
    var date = Date.now()
    //the query
    const q = {
        text: "INSERT INTO subjects (name, description, notes, owner, date) VALUES ($1, $2, $3, $4, $5) RETURNING * ",
        values: [req.body.name, req.body.description, notes, token.byToken(req.headers.token).id, date]
    }
    db.pool.query(q)
        .then(result => { res.json({ subjects: result.rows, error: false }) })
        .catch(result => { res.json({ subjects: result, error: "Error occured when adding subject." }) })
})
// returns specific subject
router.get('/:subjectid', (req, res) => {
    // the query
    const q = {
        text: "SELECT * FROM subjects WHERE owner=$1 AND id= $2",
        values: [token.byToken(req.headers.token).id, req.params.subjectid]
    }
    db.pool.query(q)
        .then(result => res.json({subjects: result.rows, error: false}))
        .catch(result => res.json({subjects: result, error: "Failed to retrieve specific subject."}))
})
// changes the existing subject
router.put('/:subjectid', (req, res) => {
    //the request should contain all information about the subject. it also overrides existing data with same data. 
    if (req.body == undefined) return res.json({ subjects: false, error: "POST request has no body." })
    if (req.body.name == undefined) return res.json({ subjects: false, error: "POST request has no body.name." })
    if (req.body.description == undefined) return res.json({ subjects: false, error: "POST request has no body.description." })
    if (req.body.notes == undefined) return res.json({ subjects: false, error: "PUT request did not receive body.notes."})
    //the querry:
    const q = {
        text: "UPDATE subjects SET name=$1, description=$2, notes=$3 WHERE id=$4 AND owner=$5 RETURNING *",
        values: [req.body.name, req.body.description, req.body.notes, req.params.subjectid, token.byToken(req.headers.token).id]
    }
    db.pool.query(q)
        .then( result => res.json({subjects: result.rows, error: false}))
        .catch(result => res.json({subjects: result, error: "Failed to update the subject"}))
})

module.exports = router