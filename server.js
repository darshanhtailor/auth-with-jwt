const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const dbConnect = require('./db');
dbConnect();

const verifyJwt = require('./verifyJwt');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const jwtSecret = 'secret';

app.get('/', (req, res)=>{
    res.send('hello world');
});

app.get('/check', verifyJwt, (req, res)=>{
    res.send('auth route');
});

app.post('/login', async(req, res)=>{
    try{
        const user = await User.findOne({email: req.body.email});
        if(!user){
            throw new Error('User not found');
        }

        const valid = await bcrypt.compare(req.body.password, user.password);
        if(!valid){
            throw new Error('Incorrect password');
        }

        const authToken = jwt.sign({user_id: user._id.toString(), email: user.email}, jwtSecret);
        res.send({user_id: user._id.toString(), auth_token: authToken});
    } catch(err){
        res.send({error: err.message});
    }
});

app.post('/signup', async(req, res)=>{
    try{
        const user = req.body;

        if(user.password != user.confirm_password){
            throw new Error('Passwords do not match');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(user.password, salt);

        user.password = hashedPass;
        delete user.confirm_password;

        await new User(user).save();
        res.send({message: 'User created'});
    } catch(err){
        res.send({error: err.message});
    }
});

app.listen(3000, (req, res)=>{
    console.log('Server started on http://localhost:3000/');
});