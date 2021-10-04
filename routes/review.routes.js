const router = require('express').Router();
const User = require('../models/User.model');
const Room = require('../models/Room.model');
const Review = require('../models/Review.model');
const mongoose = require('mongoose');

router.post('/rooms/:id/review', (req, res, next) => {
	if (!req.isAuthenticated()) {
		console.log('no autenticado');
		res.redirect('/login'); // can't access the page, so go and log in
		return;
	}
	Room.findById(req.params.id)
		.then((room) => {
			if (!room.owner.equals(req.user._id)) {
				const review = new Review({
					user: req.user._id,
					comment: req.body.comment,
				});
				review
					.save()
					.then(() => {
						room.reviews.push(review);
						room
							.save()
							.then(() => {
								res.redirect(`/rooms/${req.params.id}`);
							})
							.catch((err) => {
								next(err);
							});
					})
					.catch((err) => {
						if (err instanceof mongoose.Error.ValidationError) {
							req.flash('error', err.message);
							res.redirect(`/rooms/${req.params.id}`);
						} else {
							next(error);
						}
					});
				return;
			}
			res.redirect('/login');
		})
		.catch((error) => {
			next(error);
		});
});

module.exports = router;
