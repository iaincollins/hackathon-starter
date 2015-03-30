var mongoose = require('mongoose'),
    mongooseAutoIncrement = require('mongoose-auto-increment'),
    mongooseSearch = require('mongoose-search-plugin'),
    crypto = require('crypto'),
    slug = require('slug');

var config = {
  app: require('../config/app'),
  secrets: require('../config/secrets')
};

var schema = new mongoose.Schema({
  postId: Number,
  title: { type: String, required : true },
  description: { type: String, required : true },
  tags: [String],
  date: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  //{ type: Schema.ObjectId, ref: 'Person' }
  creator: {
    id: { type: String, required : true },
    name: { type: String, default: 'Anonymous' },
    email: { type: String }
  }
});

/**
 * Update the date on a post when it is modifeid
 */
schema.pre('save', function(next) {
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
schema.methods.creatorGravatar = function(size) {
  if (!size) size = 200;

  if (!this.creator.email) {
    return 'https://gravatar.com/avatar/?s=' + size + '&d=retro';
  }

  var md5 = crypto.createHash('md5').update(this.creator.email).digest('hex');
  return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};

schema.methods.getUrl = function() {
  return '/'+config.app.posts+'/'+this.postId+'/'+slug(this.title.toLowerCase());
};

schema.methods.getEditUrl = function() {
  return '/'+config.app.posts+'/edit/'+this.postId;
};

/**
 * Auto-incrimenting ID value (in addition to _id property)
  */
var connection = mongoose.createConnection(config.secrets.db); 
mongooseAutoIncrement.initialize(connection);
schema.plugin(mongooseAutoIncrement.plugin, {
    model: 'Post',
    field: 'postId',
    startAt: 1
});

schema.plugin(mongooseSearch, {
  fields: ['title', 'description', 'tags']
});
  
module.exports = mongoose.model('Post', schema);