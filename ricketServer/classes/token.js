

class Token{

    

    constructor(){
        this.a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
        this.length = 32;
        this.tokens = [];
    }

    generateToken(user){
        // checks whether user already known and returns if so
        var token = this.byUsername(user.username)
        if (token) return token.token

        //generates token an finally returns it. 
        var b = [];  
        for (var i=0; i<this.length; i++) {
            var j = (Math.random() * (this.a.length-1)).toFixed(0);
            b[i] = this.a[j];
        }
        token = b.join("")
        this.tokens.push({username: user.username, password: user.password, id: user.id, token: token })
        return token;
    }

    byUsername(username){
        var result = this.tokens.find( token => token.username == username)
        return (result == undefined) ? false : result 
    }

    byToken(myToken){
        var result = this.tokens.find( token => token.token == myToken)
        return (result == undefined) ? false : result;
    }

    
}

module.exports = new Token();