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
  req.assert('title', 'The title cannot be blank').notEmpty();
  req.assert('body', 'The detail cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (req.headers['x-validate'])
    return res.json({ errors: errors });
  
  if (errors) {
    req.flash('errors', errors);
    return res.render('new/post');
  }

  var post = new Post({
    title: req.body.title,
    body: req.body.body,
    creator: {
      id: req.user.id,
      name: req.user.profile.name,
      email: req.user.email
    }
  });

    console.log (req.user);
    
  post.save(function(err) {
    if (err) return next(err);
    // @todo go to new post URL
    return res.redirect('/post/'+post._id);  
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
    Post.count({}, function( err, count){
        res.render('post/list', { title: res.locals.title + " - Posts", posts: posts, postCount: count, postLimit: numberOfResults, page: pageNumber });
    });
  });
  
};

/**
 * GET /post/:id
 */
exports.getPost = function(req, res) {

  var postId = req.params.id;

  console.log(postId);

  Post.find({ _id: postId }, function (err, post) {
    res.render('post/view', { title: res.locals.title + " - View Post", post: post[0] });
  });
};
