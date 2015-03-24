var mongoose = require('mongoose'),
    autoIncrement = require('mongoose-auto-increment'),
    crypto = require('crypto');

var config = {
  secrets: require('../config/secrets')
};

var postSchema = new mongoose.Schema({
  id: Number,
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

var connection = mongoose.createConnection(config.secrets.db); 
autoIncrement.initialize(connection);
postSchema.plugin(autoIncrement.plugin, {
    model: 'Post',
    field: 'id',
    startAt: 1
});

module.exports = mongoose.model('Post', postSchema);