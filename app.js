// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require('dotenv/config');

// ℹ️ Connects to the database
require('./db');

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require('express');
const User = require('./models/User.model');

const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');

const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');

// Handles the handlebars
// https://www.npmjs.com/package/hbs
const hbs = require('hbs');
// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require('./config')(app);

// default value for title local
const projectName = 'rooms-app';
const capitalized = (string) =>
	string[0].toUpperCase() + string.slice(1).toLowerCase();

app.locals.title = `${capitalized(projectName)} created with IronLauncher`;

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		store: MongoStore.create({
			mongoUrl: process.env.MONGO_URL,
		}),
		resave: true,
		saveUninitialized: false, // <== false if you don't want to save empty session object to the store
	}),
);

passport.serializeUser((user, cb) => cb(null, user._id));

passport.deserializeUser((id, cb) => {
	User.findById(id)
		.then((user) => cb(null, user))
		.catch((err) => cb(err));
});

passport.use(
	new LocalStrategy(
		{
			usernameField: 'username',
			passwordField: 'password',
		},
		(username, password, done) => {
			User.findOne({ username })
				.then((user) => {
					if (!user) {
						return done(null, false, { message: 'Incorrect username' });
					}

					if (!bcrypt.compareSync(password, user.password)) {
						return done(null, false, { message: 'Incorrect password' });
					}

					done(null, user);
				})
				.catch((err) => done(err));
		},
	),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
// 👇 Start handling routes here
const index = require('./routes/index');
app.use('/', index);
const routes = require('./routes/auth/auth.routes');
app.use('/', routes);
const rooms = require('./routes/room.routes');
app.use('/', rooms);
const review = require('./routes/review.routes');
app.use('/', review);

// Add the line below, which you're missing:

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require('./error-handling')(app);

module.exports = app;
