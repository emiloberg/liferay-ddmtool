#!/usr/bin/env node

var argv							= require('minimist')(process.argv.slice(2));

var Constants                       = require('./lib/Constants.js');
var saveArgs	             		= require('./lib/routerSaveArgs.js');
var router	             			= require('./lib/router.js');
var LrClassNameConfig	    		= require('./lib/ClassNameConfig.js');

var utilities	                    = require('./lib/utilities.js');
var Config							= require('./lib/Config.js');

// Set paths
var userHome 			= utilities.getUserHome();
var ddmToolFolder 		= Constants.fetch('ddmToolFolder');
var settingsFolder 		= Constants.fetch('settingsFolder');
var projectsFolder 		= Constants.fetch('projectsFolder');
var cacheFolder 		= Constants.fetch('cacheFolder');
Config.set('userHome', userHome);
Config.set('settingsFolder', userHome + '/' + ddmToolFolder + '/' + settingsFolder);
Config.set('projectsFolder', userHome + '/' + ddmToolFolder + '/' + settingsFolder + '/' + projectsFolder);
Config.set('cacheFolder', userHome + '/' + ddmToolFolder + '/' + cacheFolder);

saveArgs(argv);
LrClassNameConfig.loadCustomClassNames();
router(Constants.fetch('STEP_START'));
