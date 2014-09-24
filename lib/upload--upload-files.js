"use strict";

var Q           					= require('q');

var Constants                       = require('./SingleConstants.js');
var utilities	                    = require('./utilities.js');

var uploadObjects = [];


function createUploadObject(file) {

	var deferred = Q.defer();

	var returnObj = {
		fileLanguageType: utilities.filenameToLanguageType(file),
		exceptionFile: file,
		group: {}
	};

	// Figure out what kind of file it is based on it's path.
	var filePathSplit = file.split('/');
	if(filePathSplit[filePathSplit.length - 2] === 'templates') { // Is template
		var coTemplate = require('./upload--co-template.js');
		coTemplate(file).then(function (resp) {
			deferred.resolve(resp);
		},function (resp) {
			deferred.reject(resp);
		});
	} else if(filePathSplit[filePathSplit.length - 2] === 'structures') {
		var coStructure = require('./upload--co-structure.js');
		coStructure(file).then(function (resp) {
			deferred.resolve(resp);
		},function (resp) {
			deferred.reject(resp);
		});
	} else {
		returnObj.exception = 'File is not a structure nor a template';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	return deferred.promise;
}


var preparePayloads = function (i, files) {
	createUploadObject(files[i]).then(function (e){
		uploadObjects.push(e);
		if(i < files.length-1) {
			preparePayloads(++i, files);
		} else {
			doUploads(uploadObjects);
		}
	}, function(er) {
		utilities.writeToScreen('\nCould not upload file!\n', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_ERROR'));
		utilities.writeToScreen('Name:      ' + er.fileName, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_ERROR'));
		utilities.writeToScreen('Error:     ' + er.exception, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_ERROR'));
		utilities.writeToScreen('File Path: ' + er.exceptionFile, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_ERROR'));
	});
}

var uploadFiles = function (files) {
	preparePayloads(0, files);
};

var doUploads = function (uploadObjects) {

	var Table 		= require('cli-table');
	var inquirer	= require("inquirer");

	var globalStructures				= require('./SingleStructures.js');
	var globalTemplates					= require('./SingleTemplates.js');
	var Config							= require('./SingleConfig.js');

	var cache	                    	= require('./cache.js');
	var lrException                     = require('./error-exception.js');
	var getData	             			= require('./getData.js');
	var router	             			= require('./router.js');

	var fullPayload = [];
	var filteredUploadObjects = [];

	var friendlyTypeOutput = '';

	var states = [
		{
			status: 'uptodate',
			heading: 'Already up to date, will not update'
		},
		{
			status: 'update',
			heading: 'Update'
		},
		{
			status: 'create',
			heading: 'Create new'
		}
	];

	// Split the uploadObjects into 3, one with files that are already up to date,
	// one with files that needs updating and one with files that needs to be created,
	// to be able to present it to the user in a nice way (and avoid) updating things,
	// which does not need to be updated.
	utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
	for (var x = 0; x < states.length ; x++) {
		
		filteredUploadObjects = uploadObjects.filter(function(entry) {
			return entry.status == states[x].status;
		});

		states[x].table = new Table({
			head: ['Name', 'Type', 'GrpId', 'Group (Group Type)'],
			chars: {
				'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '',
				'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '',
				'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '',
				'right': '' , 'right-mid': '' , 'middle': ' '
			},
			style: {
				'padding-left': 2,
				'padding-right': 0,
				'head': ['magenta']
			},
			colWidths: [35, 55, 7]
		});

		for (var i = 0; i < filteredUploadObjects.length; i++) {

			if (filteredUploadObjects[i].isADT) {
				friendlyTypeOutput = filteredUploadObjects[i].className;;
			} else if (filteredUploadObjects[i].isTemplate) {
				friendlyTypeOutput = 'Template (Structure: ' + filteredUploadObjects[i].className + ')';
			} else if (filteredUploadObjects[i].isStructure) {
				friendlyTypeOutput = 'Structure (' + filteredUploadObjects[i].className + ')';
			}

			states[x].table.push([
				filteredUploadObjects[i].fileFriendlyName,
				friendlyTypeOutput,
				filteredUploadObjects[i].group.groupId,
				filteredUploadObjects[i].group.name + ' (' + filteredUploadObjects[i].group.type + ')'
			]);
		}

		if (states[x].table.length > 0) {
			utilities.writeToScreen(states[x].heading + ' (' + states[x].table.length + ')', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
			utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
			utilities.writeToScreen(states[x].table.toString(), Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
			utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		}

	}

	// Check to see that we actually have things which needs to be updated/created
	if (states[1].table.length > 0 || states[2].table.length > 0 ) {
		inquirer.prompt([
				{
					type: "list",
					name: "confirm",
					message: "Do you want to send this to the server?",
					choices: [
						{
							name: 'Send to server \'' + Config.fetch('hostFriendlyName').toUpperCase() + '\' (of project \'' + Config.fetch('projectName') + '\')',
							value: true
						},
						{
							name: 'Abort',
							value: false
						}
					]
				}
			], function( answers ) {
				if (answers.confirm === true) {



					// Remove every file which is already to date.
					uploadObjects = uploadObjects.filter(function(entry) {
						return entry.status != 'uptodate';
					});

					// Create a batch of all payloads.
					for (var i = 0; i < uploadObjects.length; i++) {
						fullPayload.push(uploadObjects[i].payload);
					}

					getData('[' + fullPayload.join() + ']').then(function (resp) {
						globalTemplates.updateAll(resp);
						globalStructures.updateAll(resp);
						cache.saveToCache(globalTemplates.fetch(), Constants.fetch('cacheTemplatesFilename'));
						cache.saveToCache(globalStructures.fetch(), Constants.fetch('cacheStructuresFilename'));
						utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
						utilities.writeToScreen('Files updated/created!', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
						router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
					}, function (e) {
						console.dir(e);
						lrException('Could not upload DDMs to server!\n');
					});

				} else {
					router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
				}
			}
		);


	} else {
		utilities.writeToScreen('Every file is already up to date\n', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
		router(Constants.fetch('STEP_JUST_UPLOADED_DDMS'));
	}

};

module.exports = uploadFiles;