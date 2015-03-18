var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var moment = require('moment');

var postSchema = new mongoose.Schema({
  title: { type: String, required : true },
  body: { type: String, required : true },
  date: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  
  creator: {
    id: { type: String, required : true },
    name: { type: String, default: 'Anonymous' },
    email: { type: String }
  }

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


/**
 * Get URL to the creators gravatar.
 */
postSchema.methods.creatorGravatar = function(size) {
      if (!size) size = 200;

      if (!this.creator.email) {
        return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
      }

      var md5 = crypto.createHash('md5').update(this.creator.email).digest('hex');
      return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};


module.exports = mongoose.model('Post', postSchema);
