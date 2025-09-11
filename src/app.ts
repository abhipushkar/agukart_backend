import express from "express";
import dotenv from "dotenv";
import routes from "./routes/index";
import bootstrap from "./bootstrap";  
import session from 'express-session';
import moment from 'moment-timezone';
import methodOverride from 'method-override';
import bodyParser  from 'body-parser';
import flash from 'express-flash'; 
// import crypto from 'crypto';
import cors from 'cors';

dotenv.config();
moment.tz.setDefault('Asia/Kolkata');


// const secretKey = crypto.randomBytes(64).toString('hex');
// console.log('Generated Secret Key:', secretKey);

const app = express();
const path = require('path');
 
//pre routes
app.use('/uploads', express.static('uploads')); 
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(bodyParser.urlencoded({limit: '100mb', extended: true }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(cors());

app.use(express.json()); 
 
app.use(methodOverride('_method', { methods: ['POST', 'GET'] }));

app.use(
    session({
      secret: process.env.SECRET as string, // Replace with your secret key
      resave: false,
      saveUninitialized: false,
    })
);

declare module 'express-session' {
    interface SessionData {
        auth_token: string; // Define the properties you need 
    }
}

app.use(flash());

app.use((req, res, next) => {
    res.locals.successMessage = (req as any).flash('success');
    res.locals.errorMessage = (req as any).flash('error');
    res.locals.currentdate = moment;
    next();
});

 
app.use(routes); 

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname,'views'));
 
bootstrap(app);
