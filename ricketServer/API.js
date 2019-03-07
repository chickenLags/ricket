
var express = require('express')
var router = express.Router()

var token = require('./classes/token')
var db = require('./classes/db')

// middleware that is specific to this router It checks whether a login token is valid. 
router.use(function hasLoggedIn(req, res, next) {
  // check whether logged in. 
  if (!token.byToken(req.headers.token)) return res.json({ token: false, error: "tried to access API without valid token." })
  next()
})


var tickets = require('./tickets')
var goals = require('./goals')
var updates = require('./updates')

router.use('/tickets', tickets)
router.use('/goals', goals)
router.use('/updates', updates)



module.exports = router