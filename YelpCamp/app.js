// if(process.env.NODE_ENV!=="production"){
//     require('dotenv').config();
// }
require('dotenv').config();
//A .env file stores environment variables, such as configuration settings, for an application in a simple text format.

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const ExpressError = require('./utils/expressErorr');
const userRoutes = require('./routes/user');
const campgrounds = require('./routes/campground');
const reviews = require('./routes/reviews');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy=require('passport-local');
const User=require('./models/user');
const helmet = require('helmet');
const dataURL=process.env.data_URL || 'mongodb://localhost:27017/Yelp-App';
const mongoSanitize = require('express-mongo-sanitize');
mongoose.connect(dataURL);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});
const store = MongoStore.create({
    mongoUrl: dataURL,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});
const sessionConfig = {
    store,
    name: 'session',
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        //client side cannot interfere with our cookie
        httpOnly: true,
        //secure:true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
// Use Helmet!
app.use(helmet({contentSecurityPolicy:false}));
// const scriptSrcUrls = [
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://api.mapbox.com/",
//     "https://kit.fontawesome.com/",
//     "https://cdnjs.cloudflare.com/",
//     "https://cdn.jsdelivr.net",
// ];
// const styleSrcUrls = [
//     "https://kit-free.fontawesome.com/",
//     "https://stackpath.bootstrapcdn.com/",
//     "https://api.mapbox.com/",
//     "https://api.tiles.mapbox.com/",
//     "https://fonts.googleapis.com/",
//     "https://use.fontawesome.com/",
// ];
// const connectSrcUrls = [
//     "https://api.mapbox.com/",
//     "https://a.tiles.mapbox.com/",
//     "https://b.tiles.mapbox.com/",
//     "https://events.mapbox.com/",
// ];
// const fontSrcUrls = [];
// app.use(
//     helmet.contentSecurityPolicy({
//         directives: {
//             defaultSrc: [],
//             connectSrc: ["'self'", ...connectSrcUrls],
//             scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//             styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//             workerSrc: ["'self'", "blob:"],
//             objectSrc: [],
//             imgSrc: [
//                 "'self'",
//                 "blob:",
//                 "data:",
//                 "https://res.cloudinary.com/douqbebwk/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
//                 "https://images.unsplash.com/",
//             ],
//             fontSrc: ["'self'", ...fontSrcUrls],
//         },
//     })
// );
app.use(mongoSanitize());
app.use(session(sessionConfig));
app.use(flash());
//
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
//This method from passport-local-mongoose returns an authentication strategy configured to work with your User model. This strategy is used by Passport to handle the actual authentication process.
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//we are telling express to access static folder 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

//app.use: This function is used to set up middleware in an Express.js application
//res.locals:In Express.js, res.locals is an object that provides a way to pass data through the application during the request-response cycle. It allows you to store variables that can be accessed by your templates and other middleware functions. 
//This calls the flash method on the request object to retrieve the flash message stored under the key 'success'. Flash messages are stored temporarily in the session and are meant to be used once. After they are accessed, they are removed from the session.
// It retrieves any flash messages stored under the keys 'success' and 'error'.
// It assigns these messages to res.locals.success and res.locals.error, respectively, making them available to your templates.
// It then calls next() to pass control to the next middleware or route handler.
app.use((req, res, next) => {
    
    res.locals.activeUser = req.user;
    
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
// app.get('/fake',async(req,res)=>{
//     const user = new User({email:'hdsbjj@gmail.com',username:'Nidhi'});
//     const newUser =await User.register(user,'monkey');
//     res.send(newUser);
// })

app.use('/campgrounds', campgrounds);

app.use('/campgrounds/:id/reviews', reviews);
app.use('',userRoutes);
app.get('/', (req, res) => {
    res.render('campgrounds/home');
});
app.all('*', (req, res, next) => {
    next(new ExpressError('PAGE NOT FOUND!!!', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Something went wrong!!";
    
    res.status(statusCode).render('error', { err });
})
const PORT=process.env.PORT;
app.listen(PORT, () => {
    console.log('Serving on port 3000');
});
