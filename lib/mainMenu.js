"use strict";

var showMainMenu = function () {

	var inquirer						= require("inquirer");

	var articlesGet	        			= require('./articlesGet.js');
	var articlesUpload	        		= require('./articlesUpload.js');
	var RouterArgs	             		= require('./RouterArgs.js');
	var saveEverythingToFile	        = require('./saveEverything.js');
	var uploadAllFiles	    			= require('./uploadAllFiles.js');
	var findDiffs	    				= require('./findDiffs.js');
	var watchFiles	             		= require('./watch.js');
	var Config							= require('./Config.js');
	var Constants                       = require('./Constants.js');
	var utilities	                    = require('./utilities.js');

	var debug	             			= require('./debug.js');

	var filesRootPath = Config.fetch('filesFolder');

	if (RouterArgs.fetch('debug')) {
		RouterArgs.set('debug', false);
		//RouterArgs.set('debug2', true);
		//articlesGet();
		articlesUpload.uploadAllArticles();
	} else if (RouterArgs.fetch('debug2')) {
		RouterArgs.set('debug2', true);
		articlesUpload.uploadAllArticles();
	} else if (RouterArgs.fetch('doSaveAllFilesToDisk')) {
		RouterArgs.set('doSaveAllFilesToDisk', false);
		saveEverythingToFile(filesRootPath);

	} else if (RouterArgs.fetch('doUploadAll')) {
		RouterArgs.set('doUploadAll', false);
		uploadAllFiles({autoMode: true});
	} else if (RouterArgs.fetch('goIntoWatch')) {
		RouterArgs.set('goIntoWatch', false);
		watchFiles(Config.fetch('filesFolder'));
	} else if (RouterArgs.fetch('goIntoDiffs')) {
		RouterArgs.set('goIntoDiffs', false);
		findDiffs();
	} else {
		if (!RouterArgs.fetch('doSilently')) {

			utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));

			inquirer.prompt([
					{
						type: "list",
						name: "mainMenu",
						message: "MAIN MENU",
						choices: [
							{
								name: 'Download All Articles',
								value: 'articlesDownloadAll'
							},
							{
								name: 'Upload All Articles',
								value: 'articlesUploadAll'
							},
							{
								name: 'Watch',
								value: 'watch'
							},
							{
								name: 'Download All DDM   [Server > Disk]',
								value: 'saveAllFilesToDisk'
							},
							{
								name: 'Upload All DDM     [Disk > Server]',
								value: 'uploadAllFilesToServer'
							},
							{
								name: 'Find Diffs',
								value: 'findDiffs'
							},
							new inquirer.Separator(),
							{
								name: 'Quit',
								value: 'quit'
							}
						]
					}
				], function( answers ) {
					if (answers.mainMenu === 'saveAllFilesToDisk') {
						saveEverythingToFile(filesRootPath);
					} else if (answers.mainMenu === 'watch') {
						watchFiles(Config.fetch('filesFolder'));
					} else if (answers.mainMenu === 'uploadAllFilesToServer') {
						uploadAllFiles();
					} else if (answers.mainMenu === 'findDiffs') {
						findDiffs();
					} else if (answers.mainMenu === 'articlesDownloadAll') {
						articlesGet();
					} else if (answers.mainMenu === 'articlesUploadAll') {
						articlesUpload.uploadAllArticles();
					} else {
						console.log('Bye bye!');
					}
				}
			);
		}
	}
};

module.exports = showMainMenu;