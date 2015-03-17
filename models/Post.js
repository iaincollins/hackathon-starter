var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');

var postSchema = new mongoose.Schema({
  title: { type: String, required : true },
  body: { type: String, required : true }
  
  /*
  createdOn: Date,
  updatedOn: Date,
  
  creator: {
    id: { type: String, required : true },
    name: { type: String, required : true },
    avatar: { type: String, required : true }
  }
  */  
});

/**
 * Update the date on a post when it is modifeid
 */
postSchema.pre('save', function(next) {
  var post = this;
  // @todo Update
  next();
});

module.exports = mongoose.model('Post', postSchema);
