var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var moment = require('moment');

var postSchema = new mongoose.Schema({
  title: { type: String, required : true },
  body: { type: String, required : true },
  date: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
  
  /*  
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
  if (this.isNew) {
    next();
  } else {
    this.updated = new Date();
    next();
  }
});

module.exports = mongoose.model('Post', postSchema);
