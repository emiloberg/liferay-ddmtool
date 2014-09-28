"use strict";


function uploadAllFiles () {

	var glob 							= require("glob");

	var lrException                     = require('./errorException.js');
	var uploadFiles						= require('./uploadFiles.js');
	var Config							= require('./Config.js');


	var globOptions = {
		cwd: Config.fetch('filesFolder')
	};

	glob('**/*.+(ftl|xml|vm)', globOptions, function (err, files) {
		if (err) {
			lrException(err);
		}

		// Prepend with DDM files root path
		for (var i = 0; i < files.length; i++) {
			files[i] = Config.fetch('filesFolder') + '/' + files[i];
		}

		uploadFiles(files);

	});

}

module.exports = uploadAllFiles;