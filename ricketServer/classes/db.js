var {Pool} = require('pg')

class Db{
    constructor(){
        if(process.env.DATABASE_URL){
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: true
            })
        }
    }
    
}

module.exports = new Db();