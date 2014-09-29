"use strict";

var fs								= require('fs-extra');
var Q								= require('q');
var inquirer						= require("inquirer");

var Config							= require('./Config.js');
var Constants                       = require('./Constants.js');
var utilities	                    = require('./utilities.js');
var lrException                     = require('./errorException.js');

var findDiffs = function() {

	var glob 							= require('glob');
	var Table 							= require('cli-table');

	var saveEverythingToFile	        = require('./saveEverything.js');

	var allDDMs = [];
	var onlyLocalDDMs = [];
	var onlyServerDDMs = [];
	var bothSidesDDMs = [];
	var bothSidesEqual = [];
	var bothSidesDifferent = [];

	var ddmLocalPath = Config.fetch('filesFolder');
	var ddmCachePath = Constants.fetch('cacheFolder') + '/' + Config.fetch('projectName') + '/' + Constants.fetch('ddmCacheFolder');

	// Download all DDMs to a temporary folder
	fs.removeSync(ddmCachePath);
	saveEverythingToFile(ddmCachePath, {silent: true, returnToMainMenu: false});


	Q.resolve()
		// Find all DDMs available on server
		.then(function () {
			var deferred = Q.defer();
			glob('**/*.+(ftl|xml|vm)', { cwd: ddmCachePath }, function (err, files) {
				if (err) {
					lrException(err);
				}

				files.forEach(function(entry) {
					allDDMs.push({file: entry, onServer: true});
				});

				deferred.resolve();

			});
			return deferred.promise;
		})

		// Find all DDMs available locally and check if they're also available on server.
		.then(function () {
			var deferred = Q.defer();
			glob('**/*.+(ftl|xml|vm)', { cwd: ddmLocalPath }, function (err, files) {
				if (err) {
					lrException(err);
				}

				// Check if file exist on Server or not.
				var found = false;
				files.forEach(function(entry) {
					found = false;
					for (var i = 0; i < allDDMs.length; i++) {
						if(allDDMs[i].file === entry) {
							allDDMs[i].onLocal = true;
							found = true;
							break;
						}
					}
					if (found === false) {
						allDDMs.push({file: entry, onLocal: true});
					}
				});
				
				deferred.resolve();
			});
			return deferred.promise;
		})
		.then(function () {
			// Split into 3 different arrays depending on where files exist.
			allDDMs.forEach(function(entry) {
			    if(entry.onServer) {
					if (entry.onLocal) {
						bothSidesDDMs.push(entry);
					} else {
						onlyServerDDMs.push(entry);
					}
				} else if(entry.onLocal) {
					onlyLocalDDMs.push(entry);
				}
			});


			// Read all files which exist on both sides and check if equal or not
			var preparePromises = bothSidesDDMs.map(function(entry) {
				return readDDMs(entry.file, ddmCachePath, ddmLocalPath);
			});
			Q.all(preparePromises).then(function (withScriptDDMs) {

				// Split into 2 different arrays, one for equal, one for different
				bothSidesEqual = withScriptDDMs.filter(function (entry) {
					return entry.isEqual;
				});

				
				bothSidesDifferent = withScriptDDMs.filter(function (entry) {
					return entry.isEqual ^= true;
				});

				var outTable;
				var statusCategories = [
					{
						heading: 'Only available locally',
						data: onlyLocalDDMs
					},
					{
						heading: 'Only available on server',
						data: onlyServerDDMs
					},
					{
						heading: 'Differs between local and server',
						data: bothSidesDifferent
					}
				] ;

				utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

				for (var i = 0; i < 3; i++) {
					if (statusCategories[i].data.length > 0) {
						outTable = new Table({
							head: ['Path', 'Filename'],
							chars: {
								'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
								'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
								'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
								'right': '', 'right-mid': '', 'middle': ' '
							},
							style: {
								'padding-left': 2,
								'padding-right': 0,
								'head': ['magenta']
							},
							colWidths: [50]
						});

						for (var x = 0; x < statusCategories[i].data.length; x++) {
							outTable.push([
								utilities.filenameAndPathToPath(statusCategories[i].data[x].file),
								utilities.filenameAndPathToFilename(statusCategories[i].data[x].file, true)
							]);
						}

						utilities.writeToScreen(statusCategories[i].heading, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
						utilities.writeToScreen(outTable.toString() + '\n', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
					}

				}

				utilities.writeToScreen('Summary', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
				utilities.writeToScreen('  ' + onlyLocalDDMs.length + ' files only on local', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
				utilities.writeToScreen('  ' + onlyServerDDMs.length + ' files only on server', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
				utilities.writeToScreen('  ' + bothSidesDifferent.length + ' files differs', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
				utilities.writeToScreen('  ' + bothSidesEqual.length + ' files equal', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

				diffMainMenu(bothSidesDifferent, ddmCachePath, ddmLocalPath, onlyLocalDDMs);

			});

		});

};



function diffMainMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs) {

	var showMainMenu	             	= require('./mainMenu.js');

	utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

	// TODO, ONLY SHOW CHOICES WHICH ARE AVAILABLE!

	var choices = [
		{
			name: 'Show diffs',
			value: 'showdiffs'
		}
	];

	// Check if an external diff tool is configured.
	if (Config.fetch().hasOwnProperty('externalDiff')) {
		var externalDiffTool = Config.fetch('externalDiff');

		if (externalDiffTool !== undefined) {
			choices.push(
				{
					name: 'Open external diff tool',
					value: 'externaldiff'
				});
		}
	}

	choices.push(
		{
		name: 'Upload files which differs',
		value: 'uploaddiffs'
		},	{
			name: 'Download files which differs (TODO)',
			value: 'uploadSingleFileToServer'
		},
		new inquirer.Separator(),
		{
			name: 'Return to Main Menu',
			value: 'mainmenu'
		}
	);



	inquirer.prompt([
			{
				type: "list",
				name: "diffmenu",
				message: "DIFFS MENU",
				choices: choices
			}
		], function( answers ) {
			if (answers.diffmenu === 'mainmenu') {
				showMainMenu();
			} else if (answers.diffmenu === 'showdiffs') {
				diffMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs);
			} else if (answers.diffmenu === 'uploaddiffs') {
				uploadDiffsMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs);
			} else if (answers.diffmenu === 'externaldiff') {
				externalDiff(externalDiffTool, ddmLocalPath, ddmCachePath, function() {
					showMainMenu();
				});
			}
		}
	);
}

function externalDiff(toolPath, leftPath, rightPath, cb) {
	toolPath = toolPath.replace('%1', '"' + leftPath + '"');
	toolPath = toolPath.replace('%2', '"' + rightPath + '"');
	var exec = require('child_process').exec;
	var child = exec(toolPath, function (error) {
		if (error !== null) {
			lrException(error);
		}
	});

	if (typeof cb === "function") {
		cb.call();
	}

}

function uploadDiffsMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs) {


	inquirer.prompt([
			{
				type: "list",
				name: "whichfiles",
				message: "WHICH FILES DO YOU WANT TO UPLOAD?",
				choices: [
					{
						name: 'All files which differs or are only available locally',
						value: 'all'
					},
					{
						name: 'Select files',
						value: 'select'
					},
					new inquirer.Separator(),
					{
						name: 'Return to Diff Menu',
						value: 'back'
					}
				]
			}
		], function( answersWhichFiles ) {
			if (answersWhichFiles.whichfiles === 'back') {
				diffMainMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs);
			} else if (answersWhichFiles.whichfiles === 'all') {
				uploadDiffsAll(differsDDMs, ddmLocalPath, onlyLocalDDMs);
			} else if (answersWhichFiles.whichfiles === 'select') {
				uploadDiffsSelectMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs);
			}
		}
	);


}

function uploadDiffsAll(differsDDMs, ddmLocalPath, onlyLocalDDMs) {
	var uploadFiles						= require('./uploadFiles.js');

	var files = [];
	differsDDMs.forEach(function(entry) {
		files.push(ddmLocalPath + '/' + entry.file);
	});
	onlyLocalDDMs.forEach(function(entry) {
		files.push(ddmLocalPath + '/' + entry.file);
	});

	var cb = function() {
		var router = require('./router.js');
		router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
	};

	uploadFiles(files, {autoMode: true}, cb);

}

function uploadDiffsSelectMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs) {

	var uploadFiles						= require('./uploadFiles.js');

	 var choices = [];
	 differsDDMs.forEach(function(entry) {
		 choices.push({name: '(differs):       ' + entry.file, value: ddmLocalPath + '/' + entry.file});
	 });
	 onlyLocalDDMs.forEach(function(entry) {
	 	choices.push({name: '(only on local): ' + entry.file, value: ddmLocalPath + '/' + entry.file});
	 });


	 inquirer.prompt([
	 	{
	 		type: "checkbox",
	 		name: "files",
	 		message: "SELECT FILES TO UPLOAD",
	 		choices: choices
	 	}
	 ], function( answers ) {

			 var cb = function() {
				 var router	             			= require('./router.js');
				 router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
			 };

			 if (answers.files.length > 0) {
				 uploadFiles(answers.files, {autoMode: true}, cb);
			 } else {
				 uploadDiffsMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs);
			 }
	 	}
	 );

}



function diffMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs) {
	// TODO: Add possibility to see content of files which are only available on server/locally
	var fileChoices = [
		{name: 'Return to Diff Menu ', value: 'back'},
		new inquirer.Separator()
	];
	differsDDMs.forEach(function(entry, index) {
	    fileChoices.push({name: 'File ' + utilities.pad((index + 1) + ':', 3, 'right') + ' ' + entry.file, value: entry.file});
	});

	utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));

	inquirer.prompt([
			{
				type: "list",
				name: "difffile",
				message: "SELECT FILES TO SHOW DIFF",
				choices: fileChoices
			}
		], function( answers ) {
			if (answers.difffile === 'back') {
				diffMainMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs);
			} else {
				showDiff(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs, answers.difffile);
			}
		}
	);
}



function showDiff(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs, file) {
	var chalk = require('chalk');
	var jsdiff = require('diff');

	var localFile = fs.readFileSync(ddmCachePath + '/' + file, {encoding: Constants.fetch('filesEncoding')});
	var serverFile = fs.readFileSync(ddmLocalPath + '/' + file, {encoding: Constants.fetch('filesEncoding')});
	var diff = jsdiff.diffLines(localFile, serverFile);
	var lines = [];

	// Loop through every huck
	// A hunk is a block of text which is either added, removed or unchanged.
	diff.forEach(function(part){
		// Split each hunk into lines to be able to add line numbers.
		var textBlock = trimTrailingNewLine(part.value).match(/^.*([\n\r]|$)/gm);
		textBlock.forEach(function(entry) {
			lines.push({line: trimTrailingNewLine(entry), added: part.added, removed: part.removed});
		});
	});

	// Print every line, with the correct line number, color and +/- marking.
	var removedLines = 0;
	lines.forEach(function(entry, index) {
		if (entry.added) {
			console.log(chalk.green(utilities.pad(index + 1 - removedLines, 4, 'left') + ' + | ' + entry.line));
		} else if (entry.removed) {
			console.log(chalk.red('    ' + ' - | ' + entry.line));
			removedLines += 1;
		} else {
			console.log(chalk.reset(utilities.pad(index + 1 - removedLines, 4, 'left') + '   | ' + entry.line));
		}
	});

	// Return to diff menu.
	diffMenu(differsDDMs, ddmCachePath, ddmLocalPath, onlyLocalDDMs);
}



function trimTrailingNewLine(str) {
	str = str.replace(/(\r\n|\n|\r)$/g,'');
	return str;
}



function readDDMs(file, localPath, serverPath) {
	var isEqual = false;
	var deferred = Q.defer();
	fs.readFile(localPath + '/' + file, {encoding: Constants.fetch('filesEncoding')}, function (er, localData) {
		if (er) throw er;
		fs.readFile(serverPath + '/' + file, {encoding: Constants.fetch('filesEncoding')}, function (er, serverData) {
			if (er) throw er;
			isEqual = localData === serverData;
			deferred.resolve({file: file, isEqual: isEqual, localData: localData, serverData: serverData});
		});
	});
	return deferred.promise;
}

module.exports = findDiffs;