"use strict";

var fs								= require('fs-extra');
var Q								= require('q');

var Structures						= require('./Structures.js');
var Templates						= require('./Templates.js');
var Sites							= require('./Sites.js');
var LrClassNameConfig	    		= require('./ClassNameConfig.js');
var Constants                       = require('./Constants.js');
var lrException                     = require('./errorException.js');
var Config							= require('./Config.js');
var utilities	                    = require('./utilities.js');

var cache = {
	getAllCache: function () {
		// Todo - Add error handling for missing files
		Sites.setAll(cache.readFileFromCache(Constants.fetch('cacheSitesFilename')));
		Structures.setAll(cache.readFileFromCache(Constants.fetch('cacheStructuresFilename')));
		Templates.setAll(cache.readFileFromCache(Constants.fetch('cacheTemplatesFilename')));
		LrClassNameConfig.setAll(cache.readFileFromCache(Constants.fetch('cacheClassNameConfig')));
	},
	readFileFromCache: function (filename) {
		// Todo - Add error handling for non json files
		return fs.readJsonSync(Config.fetch('cacheFolder') + '/' + Config.fetch('projectName') + '/' + filename);
	},
	saveToCache: function (e, filename) {
		fs.outputFileSync(Config.fetch('cacheFolder') + '/' + Config.fetch('projectName') + '/' + filename, JSON.stringify(e));
	},
	readFromCache: function () {
		utilities.writeToScreen('Reading data from Cache', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
		Q.resolve()
			.then(cache.getAllCache)
			.done(function () {
				var router = require('./router.js');
				router(Constants.fetch('STEP_JUST_READ_ALL_FROM_SERVER'));
			}, function (e) {
				lrException(e);
			});
	},
	clearCache: function () {
		fs.removeSync(Config.fetch('cacheFolder') + '/' + Config.fetch('projectName'));
	}

};

module.exports = cache;