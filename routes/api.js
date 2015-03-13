var juicer = require('../models/api/Juicer.js');

/**
 * GET /api
 */
exports.index = function(req, res) {
  res.render('api/index', { title: res.locals.title + " - API" });
};

/**
 * GET /api/juicer
 */
exports.getJuicer = function(req, res) {
  juicer.getArticles()
  .then(function(articles) {
    res.render('api/juicer', { title: res.locals.title + " - Juicer API", articles: articles });
  });
};
