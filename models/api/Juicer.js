var Q = require('q');
var request = require('request');
var config = {
  secrets: require('../../config/secrets')
};

module.exports = {
  
  getArticles: function() {
    var deferred = Q.defer();
    var url = config.secrets.bbc.juicer.host+"/articles?recent_first=yes&apikey=" + config.secrets.bbc.juicer.key;
    request(url, function (error, response, body) {
      var articles = [];
      
      if (response.statusCode == 200) 
          articles = JSON.parse(body).hits;
      
      deferred.resolve(articles);
    });
    return deferred.promise;
  }
  
};