var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')

// returns all updates of this specific ticket.
router.get('/:ticketId', async (req, res) => {

  const q = {
    text: "SELECT * FROM updates \
           WHERE ticketId = $1 \
           AND EXISTS( \
              SELECT * FROM tickets \
              WHERE owner = $2 \
           )",
    values: [req.params.ticketId, token.byToken(req.headers.token).id]
  }

  db.pool.query(q).then(result => {
    res.json({ updates: result.rows, error: false })
  }).catch(result => {
    res.json({ result: result, error: "Error occured when retrieving updates of this ticket." })
  })

})
// adds an update to updates
router.post('/:ticketId', async (req, res) => {
  // updates contains: id, date, body, change, ticketid
  // do i have all info? 
  if (req.body == undefined) return res.json({ result: false, error: "error: body (description) is missing" })
  if (req.body.body == undefined) return res.json({ result: false, error: "error: body (description) is missing" })
  var change = (req.body.change == undefined) ? false : true;
  var date = Date.now()
  const q = {
    text: "INSERT INTO updates (body, change, ticketid, date) VALUES ($1, $2, $3, $4) RETURNING * ",
    values: [req.body.body, change, req.params.ticketId, date]
  }
  db.pool.query(q).then(result => {
    res.json({ updates: result.rows, error: false })
  }).catch(result => {
    res.json({ update: result, error: "Error occured when adding update." })
  })
})

module.exports = router