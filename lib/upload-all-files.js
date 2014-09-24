"use strict";


function uploadAllFiles () {

	var glob 							= require("glob");

	var lrException                     = require('./error-exception.js');
	var uploadFiles						= require('./upload--upload-files.js');
	var Config							= require('./SingleConfig.js');


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