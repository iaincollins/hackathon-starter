/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('about', { title: res.locals.title + " - About" });
};
