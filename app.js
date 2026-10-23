const express = require('express');
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser')
const app = express();
const userModel = require('./modules/user')
const postModel = require('./modules/post')
const jwt = require("jsonwebtoken")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(cookieParser())

app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts")

    res.render("profile", { user })
})

app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user")
    if(post.likes.indexOf(req.user.id)=== -1){
        post.likes.push(req.user.id)
    }else{
        post.likes.splice(post.likes.indexOf(req.user.id), 1)
    }
    
    await post.save()
    res.redirect("/profile")
})


app.post("/post", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email })
    let { content } = req.body
    let post = await postModel.create({
        user: user._id,
        content,
    })

    user.posts.push(post._id)
    await user.save()
    res.redirect("/profile")

})


app.get("/", (req, res) => {
    res.render("index")

})

app.get("/logout", (req, res) => {
    res.cookie("token", "")
    res.redirect("/login")

})

app.get("/login", (req, res) => {
    res.render("login")
})


app.post("/register", async (req, res) => {
    const { name, username, email, age, password } = req.body
    const user = await userModel.findOne({ email })
    if (user) return res.status(400).send("User already exists")
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            const user = userModel({
                name,
                username,
                email,
                age,
                password: hash
            })
            await user.save();
            const token = jwt.sign({ email: email, userid: user._id }, "secretkeyssagar")
            res.cookie("token", token)
            res.send("registered")
        })
    })



})


app.post("/login", async (req, res) => {
    const { email, password } = req.body
    const user = await userModel.findOne({ email })
    if (!user) return res.status(400).send("Something went wrong")
    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {

            const token = jwt.sign({ email: email, userid: user._id }, "secretkeyssagar")
            res.cookie("token", token)
            res.status(200).send("Login Successfull")
        }
        else res.redirect("/login")
    })



})

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }

    try {
        const user = jwt.verify(token, "secretkeyssagar");

        req.user = user;


        next();
    } catch (err) {
        return res.status(401).send("Invalid or expired token. Please login again.");
    }
}


app.listen(3000)