var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')



//ERRORCHECK THIS BOII
router.get('/:ticketId', async (req, res) => {
    res.json({result: "hello not made yes updates", error: false})
})

//ERRORCHECK THIS BOII
router.post('/:ticketId', async (req, res) => {
    //this function adds an entry to ticketupdates
    // it creates a update first, then uses its id to enter it into the ticket update table. 
    // updates contains: id, date, body, change
  
    // do i have all info?
    if (req.body == undefined || req.body.body == undefined) return res.json({ result: false, error: "error: body (description) is missing" })
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
  
    if (result2) return res.json({ result: result, result2: result2, error: false, msg: "pay attention to return values. to fix the if statements in code!" })
    return res.json({ result: result, result2: result2, error: "pay attention to return values. to fix the if statements in code!" })
  })

  module.exports = router