var RouterArgs	             		= require('./SingleRouterArgs.js');

saveArgs = function saveArgs(argv) {

	RouterArgs.projectName = argv.project;
	RouterArgs.server = argv.server;

	if (argv.hasOwnProperty('project')) {
		if (RouterArgs.projectName.length > 0) { RouterArgs.hasProject = true; }
	}

	if (argv.hasOwnProperty('server')) {
		if (RouterArgs.server.length > 0) { RouterArgs.hasServer = true;}
	}

	if (argv.hasOwnProperty('c')) {
		RouterArgs.loadFromCache = true;
	}

	if (argv.hasOwnProperty('d')) {
		RouterArgs.doSaveAllFilesToDisk = true;
		RouterArgs.doSilently = true;
	}

	if (argv.hasOwnProperty('h') || argv.hasOwnProperty('help')) {
		RouterArgs.doShowHelp = true;
	}

	if (argv.hasOwnProperty('temp')) {
		RouterArgs.temp = true;
	}

};

module.exports = saveArgs;