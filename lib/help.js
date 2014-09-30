"use strict";

var nprint		= require('node-print');

var showHelp = function () {

	var helpArgs = [
		{
			arg: '--project [PROJECT-NAME]',
			help: 'Load a project'
		},
		{
			arg: '--server [SERVER-NAME]',
			help: 'Load a server in project'
		},
		{
			arg: '--cache, -c',
			help: 'Use data from cache (and don\'t download it from server)'
		},
		{ arg: '', help: '' },
		{
			arg: '--download, -d',
			help: 'Save all files to disk'
		},
		{
			arg: '--upload, -u',
			help: 'Upload all files'
		},
		{
			arg: '--watch, -w',
			help: 'Go into watch mode'
		},
		{
			arg: '--diffs, -i',
			help: 'Go into diffs mode'
		},
		{ arg: '', help: '' },
		{
			arg: '--help, -h',
			help: 'Show this help'
		}
	];

	// TODO - ADD HELP HERE
	console.log();
	console.log('This app may be runned with the following arguments:');
	console.log();

	for (var x = 0; x < helpArgs.length; ++x) {
		nprint.pf('%30s   %10s', helpArgs[x].arg, helpArgs[x].help);
	}
};

module.exports = showHelp;