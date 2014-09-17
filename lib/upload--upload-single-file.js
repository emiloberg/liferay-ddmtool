var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var Config							= require('./SingleConfig.js');
var uploadFiles						= require('./upload--upload-files.js');

var uploadSingleFileToServer = function() {
	console.log('Upload single file');

	var fileFolders = [];

	// TODO: Change so that only files that actually exists (and are changed) shows up.

	// TODO - Se till att vi får med *alla* saker vi kan ladda upp, t.ex. document/media osv.
	for (var i = 0; i < LrClassNameConfig.fetch().length; i++) {
		if (LrClassNameConfig.fetch(i, 'type') === 'template' || LrClassNameConfig.fetch(i, 'type') === 'journalStructure') {
			fileFolders.push({
				name: LrClassNameConfig.fetch(i, 'friendlyName'),
				value: LrClassNameConfig.fetch(i, 'filesPath')
			});
		}
	}

	inquirer.prompt([
			{
				type: "list",
				name: "folder",
				message: "What kind of file do you want to upload",
				choices: fileFolders
			}
		], function( typeAnswers ) {
			// TODO - check if folder actually exists.
			fs.readdir(Config.fetch('filesFolder') + '/' + typeAnswers.folder, function (err, files) {
				if (err) {
					throw Error(err);
				}

				inquirer.prompt([
						{
							type: "list",
							name: "file",
							message: "Which file do you want to upload",
							choices: files
						}
					], function( fileAnswers ) {
						uploadFiles([Config.fetch('filesFolder') + '/' + typeAnswers.folder + '/' + fileAnswers.file]);
					}
				);

			});
		}
	);
};

module.exports = uploadSingleFileToServer;