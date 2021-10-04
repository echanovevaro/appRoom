const router = require('express').Router();
const User = require('../../models/User.model');
const Room = require('../../models/Room.model');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Bcrypt to encrypt passwords
const bcrypt = require('bcrypt');
const bcryptSalt = 10;

/* GET home page */
router.get('/signup', (req, res, next) => {
	res.render('auth/signup');
});

router.post('/signup', (req, res, next) => {
	const { username, password, email } = req.body;

	if (username === '' || password === '' || email === '') {
		res.render('auth/signup', {
			errorMessage: 'Indicate username and password',
		});
		return;
	}
	if (!username || !password || !email) {
		res.render('auth/signup', {
			errorMessage: 'Indicate username and password',
		});
		return;
	}
	User.findOne({ username: username })
		.then((user) => {
			if (user) {
				res.render('auth/signup', {
					errorMessage: 'The username already exists',
				});
				return;
			}

			// Encrypt the password
			const salt = bcrypt.genSaltSync(bcryptSalt);
			const hashPass = bcrypt.hashSync(password, salt);

			// Save the user in DB

			const newUser = new User({
				username: username,
				email: email,
				password: hashPass,
			});
			newUser
				.save()
				.then(() => res.redirect('/login'))
				.catch((err) => next(err));
		})
		.catch((err) => next(err));
});

router.get('/login', (req, res, next) => res.render('auth/login'));

router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/private-page',
		failureRedirect: '/login',
		failureFlash: true, // !!!
	}),
);

router.get('/private-page', (req, res, next) => {
	if (!req.user) {
		res.redirect('/login'); // can't access the page, so go and log in
		return;
	}
	Room.find({ owner: req.user._id })
		.populate('owner')
		.then((rooms) => {
			rooms.forEach((room) => {
				room.isOwner = true;
			});
			res.render('rooms', { rooms });
		})
		.catch((err) => {
			next(err);
		});
});

router.get('/rooms/new', (req, res) => {
	if (!req.user) {
		res.redirect('/login'); // can't access the page, so go and log in
		return;
	}

	// ok, req.user is defined
	res.render('auth/private', { user: req.user });
});

router.get('/logout', (req, res) => {
	req.logout();
	res.redirect('/');
});

module.exports = router;
