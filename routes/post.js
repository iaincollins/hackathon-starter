var Post = require('../models/Post');

/**
 * GET /post/new
 */
exports.getNewPost = function(req, res) {  
  res.render('post/new', { title: res.locals.title + " - New post" });
};

/**
 * POST /post/new
 */
exports.postNewPost = function(req, res, next) {
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('description', 'Description cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (req.headers['x-validate'])
    return res.json({ errors: errors });
  
  if (errors) {
    req.flash('errors', errors);
    return res.render('post/new');
  }

  var post = new Post({
    title: req.body.title,
    description: req.body.description,
    tags: splitTags(req.body.tags),
    creator: {
      id: req.user.id,
      name: req.user.profile.name,
      email: req.user.email
    }
  });

  post.save(function(err) {
    if (err) return next(err);
    return res.redirect(post.getUrl());
  });

};

/**
 * GET /posts
 */
exports.getPosts = function(req, res) {
  var numberOfResultsLimit = 100;
  var numberOfResults = 10;
  if (numberOfResults > numberOfResultsLimit)
    numberOfResults = numberOfResultsLimit;
  
  var pageNumber = (parseInt(req.query.page) > 1) ? parseInt(req.query.page) : 1;

  var skip = 0;
  if (pageNumber > 1)
    skip = (pageNumber - 1) * numberOfResults;    
  
  Post.find({}, null , { skip: skip, limit: numberOfResults, sort : { _id: -1 } }).exec(function (err, posts) {
    Post.count({}, function( err, count) {
        res.render('post/list', { title: res.locals.title + " - Posts", posts: posts, postCount: count, postLimit: numberOfResults, page: pageNumber });
    });
  });
  
};

/**
 * GET /post/:id
 */
exports.getPost = function(req, res) {
  var postId = req.params.id;

  Post.findOne({ id: postId }, function (err, post) {
    if (err)
      return res.render('404');
    
    return res.render('post/view', { title: res.locals.title + " - " + post.title, post: post });
  });
};


/**
 * GET /post/edit/:id
 */
exports.getEditPost = function(req, res) {
  var postId = req.params.id;

  Post.findOne({ id: postId }, function (err, post) {
    if (err)
      return res.render('404');

    if (req.user.id != post.creator.id 
        && req.user.permissions.moderator != true
        && req.user.permissions.admin != true )
      return res.render('403');
    
    return res.render('post/edit', { title: res.locals.title + " - Edit " + post.title, post: post });
  });
};

/**
 * POST /post/edit/:id
 */
exports.postEditPost = function(req, res) {
  req.assert('id', 'Post ID cannot be blank').notEmpty();
  req.assert('title', 'Title cannot be blank').notEmpty();
  req.assert('description', 'Description cannot be blank').notEmpty();

  
  var errors = req.validationErrors();

  if (req.headers['x-validate'])
    return res.json({ errors: errors });
  
  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }
  
  Post.findOne({ id: req.params.id }, function (err, post) {
    if (err)
      return res.render('404');
    
    if (req.user.id != post.creator.id 
        && req.user.permissions.moderator != true
        && req.user.permissions.admin != true )
      return res.render('403');
    
    post.title = req.body.title;
    post.description = req.body.description;
    post.tags = splitTags(req.body.tags);
    
    post.save(function(err) {
      if (err) return next(err);
      return res.redirect(post.getUrl());
    });
      
  });
  
};

function splitTags(str) {
  if (!str || str.trim() == '')
    return [];
  
  return str.match(/(".*?"|[^",]+)+(?=,*|,*$)/g).map(function(s) { return s.trim().replace(/(^\"|\"$)/g, '').trim() })
};