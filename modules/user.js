const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/associate-backend")

const userSchema = mongoose.Schema({
    username:String,
    name:String,
    email:String,
    age:Number,
    password:String,
    posts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Post"
    }]

})

module.exports = mongoose.model("User",userSchema)
