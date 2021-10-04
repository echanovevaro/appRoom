const router = require('express').Router();
const User = require('../models/User.model');
const Room = require('../models/Room.model');
const multer = require('multer');
const mongoose = require('mongoose');

const upload = multer({ dest: './public/uploads/' });

router.post('/private-page', upload.single('photo'), (req, res, next) => {
	if (!req.isAuthenticated()) {
		res.redirect('/login'); // can't access the page, so go and log in
		return;
	}
	const room = new Room({
		name: req.body.name,
		description: req.body.description,
		owner: req.user._id,
	});
	if (req.file) {
		room.imageUrl = `/uploads/${req.file.filename}`;
	}

	room
		.save()
		.then(() => {
			res.redirect('/rooms');
		})

		.catch((error) => {
			if (error instanceof mongoose.Error.ValidationError) {
				res.status(500).render(`auth/private`, { errorMessage: error.message });
			} else if (error.code === 11000) {
				res
					.status(500)
					.render(`auth/private`, { errorMessage: 'name alrready exists!' });
			} else {
				next(error);
			}
		});
});

router.get('/rooms', (req, res, next) => {
	Room.find()
		.populate('owner')
		.then((rooms) => {
			if (req.user) {
				rooms.forEach((room) => {
					if (room.owner._id.equals(req.user._id)) {
						room.isOwner = true;
					}
				});
			}
			res.render('rooms', { rooms });
		})
		.catch((error) => {
			next(error);
		});
});

router.get('/rooms/:id/edit', (req, res, next) => {
	if (!req.isAuthenticated()) {
		res.redirect('/login'); // can't access the page, so go and log in
		return;
	}
	Room.findById(req.params.id)
		.then((room) => {
			if (room.owner.equals(req.user._id)) {
				res.render('room-edit', { room });
				return;
			}
			res.redirect('/login');
		})
		.catch((error) => {
			next(error);
		});
});

router.post('/rooms/:id', upload.single('photo'), (req, res, next) => {
	if (!req.isAuthenticated()) {
		console.log('no autenticado');
		res.redirect('/login'); // can't access the page, so go and log in
		return;
	}
	Room.findById(req.params.id)
		.then((room) => {
			if (room.owner.equals(req.user._id)) {
				const newRoom = {
					name: req.body.name,
					description: req.body.description,
				};

				if (req.file) {
					newRoom.imageUrl = `/uploads/${req.file.filename}`;
				}
				Room.findByIdAndUpdate(req.params.id, newRoom)
					.then(() => {
						res.redirect('/rooms');
					})
					.catch((error) => {
						next(error);
					});
				return;
			}
			res.redirect('/login');
			return;
		})
		.catch((error) => {
			next(error);
		});
});

router.post('/rooms/:id/delete', (req, res, next) => {
	if (!req.isAuthenticated()) {
		console.log('no autenticado');
		res.redirect('/login'); // can't access the page, so go and log in
		return;
	}
	Room.findById(req.params.id)
		.then((room) => {
			if (room.owner.equals(req.user._id)) {
				const { id } = req.params;
				Room.findByIdAndDelete(id)
					.then(() => {
						res.redirect('/rooms');
					})
					.catch((error) => {
						next(error);
					});
			} else {
				res.redirect('/login');
			}
		})
		.catch((error) => {
			next(error);
		});
});

router.get('/rooms/:id', (req, res, next) => {
	Room.findById(req.params.id)
		.populate({
			path: 'reviews',
			populate: {
				path: 'user',
				model: 'User',
			},
		})
		.populate('owner')
		.then((room) => {
			if (!req.user || (req.user && room.owner._id.equals(req.user._id))) {
				room.cantReview = true;
			}
			const errorMessage = req.flash('error');
			res.render('room-details', { room, errorMessage });
		})
		.catch((error) => {
			next(error);
		});
});

module.exports = router;
