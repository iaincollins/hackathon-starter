/**
 * POST /theme
 * Change the theme for the current user
 */
exports.postTheme = function(req, res, next) {
  if (req.body['theme-name'])
    req.session.theme = req.body['theme-name'];
  res.redirect(req.session.returnTo || '/');
};
