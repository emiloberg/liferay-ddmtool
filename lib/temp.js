var temp = function() {
	var uploadFiles						= require('./upload--upload-files.js');
	var utilities	                    = require('./utilities.js');

	var files = [
//		'/Users/emiloberg/code/test-wcm/journal/templates/Ny Template.ftl',
		'/Users/emiloberg/code/test-wcm/journal/structures/Test Structure.xml'
	];

	// Update all files with timestamp
	var fs								= require('fs-extra');
	var Constants                       = require('./SingleConstants.js');
	for (var i = 0; i < files.length; i++) {
		if(utilities.filenameToLanguageType(files[i]) === 'ftl') {
			newScript = fs.readFileSync(files[i], {encoding: Constants.fetch('filesEncoding')});
			newScript = '<#-- Updated ' + new Date + ' ' + Date.now() + ' -->\n' + newScript;
			fs.writeFileSync(files[i], newScript, {encoding: Constants.fetch('filesEncoding')});
		}
	}

	uploadFiles(files);


};

module.exports = temp;