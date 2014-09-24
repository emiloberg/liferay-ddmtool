"use strict";


// FIGURE OUT WHICH SITE WE'RE GOING TO CREATE THE STRUCTURE
// IF THERE'S MORE THAN ONE, WE ASK THE USER WHICH SITE S/HE WANT TO
// UPLOAD THE TEMPLATE TO.
function watchFiles (watchFolder) {
	var watch 							= require('watch');

	var router	             			= require('./router.js');
	var Constants   					= require('./SingleConstants.js');
	var utilities						= require('./utilities.js');
	var uploadFiles						= require('./upload--upload-files.js');

	var Config							= require('./SingleConfig.js');

	
	watch.createMonitor(watchFolder, {ignoreDotFiles: true}, function (monitor) {

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('Now watching!', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		utilities.writeToScreen('  Folder:                        ' + watchFolder, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('  Will upload changes to server: ' + Config.fetch('hostFriendlyName'), Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('\nPress Ctrl+C to stop watching\n', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));

		monitor.on("created", function (f, stat) {
			utilities.writeToScreen('Created: ' + f, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'), true);
			uploadFiles(f, {watchMode: true});
		});
		
		monitor.on("changed", function (f, curr, prev) {
			utilities.writeToScreen('Changed: ' + f, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'), true);
			uploadFiles(f, {watchMode: true});
		});
		
		monitor.on("removed", function (f, stat) {
			utilities.writeToScreen('Removed: ' + f, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'), true);
			utilities.writeToScreen('         Removal of files is not yet supported', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'), true);
		});


		// Listen for Ctrl+C
		// TODO: For some reason, Ctrl+C does not work if use got into watch mode with
		// cli argument '-w'
		var stdin = process.openStdin();
		process.stdin.setRawMode(true);
		stdin.on('keypress', function (chunk, key) {
			if (key && key.ctrl && key.name == 'c') {
				stdin.pause();
				monitor.stop();
				router(Constants.fetch('STEP_JUST_WATCHED_FOLDER'));
			}
		});


	})	
	
};

module.exports = watchFiles;