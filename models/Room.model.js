const { Schema, model } = require('mongoose');

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const roomSchema = new Schema({
	name: { type: String, required: [true, 'Name is required.'], unique: true },
	description: { type: String, required: [true, 'Description is required.'] },
	imageUrl: { type: String },
	owner: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Owner is required.'],
	},
	reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }], // we will update this field a bit later when we create review model
});

const Room = model('Room', roomSchema);

module.exports = Room;
