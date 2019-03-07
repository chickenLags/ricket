var {Pool} = require('pg')

class Db{

    constructor(){
        this.pool = new Pool({
            connectionString: "postgres://zrkixnmgcipobc:6d73114dd9ebaa2d2aba278d5a83a6bf73a7a7a1b78e1772f01d1a66d4b94f34@ec2-79-125-4-96.eu-west-1.compute.amazonaws.com:5432/d3olhkutfptcdg",
            ssl: true

        })
        /*
        this.pool = new Pool({
            user: "zrkixnmgcipobc",
            host: "ec2-79-125-4-96.eu-west-1.compute.amazonaws.com",
            database: "d3olhkutfptcdg",
            password: "6d73114dd9ebaa2d2aba278d5a83a6bf73a7a7a1b78e1772f01d1a66d4b94f34",
            port: 5432,
            ssl: true
        });
        */
    }
    
}

module.exports = new Db();