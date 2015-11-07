/*
 This is the main controller, it will load all other controllers/routing logic into this file.
 It will also allow for the configuration of passport for authentication, as well as other middlewares
 in the future.
*/
var express = require('express');
var router = express.Router();
var main = '/api';

var routes = function(){

	router.get('/api/fail', function(req, res){
		console.log("failure in authentication");
		res.end();
	});
	router.get('/api/success', function(req, res){
		console.log("success");
		res.end();
	});
	return router;
};

module.exports = routes;