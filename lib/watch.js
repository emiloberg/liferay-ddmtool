"use strict";


// FIGURE OUT WHICH SITE WE'RE GOING TO CREATE THE STRUCTURE
// IF THERE'S MORE THAN ONE, WE ASK THE USER WHICH SITE S/HE WANT TO
// UPLOAD THE TEMPLATE TO.
function watchFiles (watchFolder) {
	var watch 							= require('watch');

	var router	             			= require('./router.js');
	var Constants   					= require('./Constants.js');
	var utilities						= require('./utilities.js');
	var uploadFiles						= require('./uploadFiles.js');

	var Config							= require('./Config.js');

	
	watch.createMonitor(watchFolder, {ignoreDotFiles: true}, function (monitor) {

		utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('Now watching!', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		utilities.writeToScreen('  Folder:                        ' + watchFolder, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('  Will upload changes to server: ' + Config.fetch('hostFriendlyName'), Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		utilities.writeToScreen('\nPress Ctrl+C to stop watching\n', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));

		Config.set('logMode', 'sparse');
		Config.set('logTimestamp', true);

		monitor.on("created", function (f) {
			utilities.writeToScreen('Created: ' + f, Constants.fetch('SEVERITY_IMPORTANT'), Constants.fetch('SCREEN_PRINT_NORMAL'));
			uploadFiles(f, {autoMode: true});
		});
		
		monitor.on("changed", function (f) {
			utilities.writeToScreen('Changed: ' + f, Constants.fetch('SEVERITY_IMPORTANT'), Constants.fetch('SCREEN_PRINT_NORMAL'));
			uploadFiles(f, {autoMode: true});
		});
		
		monitor.on("removed", function (f) {
			utilities.writeToScreen('Removed: ' + f, Constants.fetch('SEVERITY_IMPORTANT'), Constants.fetch('SCREEN_PRINT_NORMAL'));
			utilities.writeToScreen('         Removal of files is not yet supported', Constants.fetch('SEVERITY_IMPORTANT'), Constants.fetch('SCREEN_PRINT_NORMAL'));
		});


		// Listen for Ctrl+C
		// TODO: For some reason, Ctrl+C does not work if use got into watch mode with
		// cli argument '-w'
		var stdin = process.openStdin();
		process.stdin.setRawMode(true);
		stdin.on('keypress', function (chunk, key) {
			if (key && key.ctrl && key.name == 'c') {

				Config.set('logMode', 'normal');
				Config.set('logTimestamp', false);

				stdin.pause();
				monitor.stop();
				router(Constants.fetch('STEP_JUST_WATCHED_FOLDER'));
			}
		});


	})	
	
}

module.exports = watchFiles;