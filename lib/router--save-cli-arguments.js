var RouterArgs	             		= require('./SingleRouterArgs.js');

saveArgs = function saveArgs(argv) {

	RouterArgs.set('projectName', argv.project);
	RouterArgs.set('server', argv.server);

	if (argv.hasOwnProperty('project')) {
		if (RouterArgs.fetch('projectName').length > 0) {
			RouterArgs.set('hasProject', true);
		}
	}

	if (argv.hasOwnProperty('server')) {
		if (RouterArgs.fetch('server').length > 0) {
			RouterArgs.set('hasServer', true);
		}
	}

	if (argv.hasOwnProperty('c')) {
		RouterArgs.set('loadFromCache', true);
	}

	if (argv.hasOwnProperty('d')) {
		RouterArgs.set('doSaveAllFilesToDisk', true);
		RouterArgs.set('doSilently', true);
	}

	if (argv.hasOwnProperty('h') || argv.hasOwnProperty('help')) {
		RouterArgs.set('doShowHelp', true);
	}

	if (argv.hasOwnProperty('temp')) {
		RouterArgs.set('temp', true);
	}

};

module.exports = saveArgs;