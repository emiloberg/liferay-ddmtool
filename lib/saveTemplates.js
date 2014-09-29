"use strict";

var fs								= require('fs-extra');
var _								= require('underscore');

var utilities	                    = require('./utilities.js');
var Constants                       = require('./Constants.js');
var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var Table 							= require('cli-table');

var saveTemplates = function(e, filesRootPath, options) {

	var Structures					= require('./Structures.js');

	var filePath;
	var fileContent;

	var curStructureClassNameId = 0;
	var curStructureFilesPath;

	var friendlyName = '';

	var oldFile = '';
	var downloadStatuses = [];
	var outTable;
	var states = [
		{
			status: 'uptodate',
			heading: 'Already up to date'
		},
		{
			status: 'update',
			heading: 'Updated'
		},
		{
			status: 'create',
			heading: 'Created new'
		}
	];



	for (var i = 0; i < e.length; ++i) {

		// Check if template has a structure connected to it. If so, then we should grab the filesPath from the
		// structure.
		if (e[i].classPK > 0) {
			curStructureClassNameId = Structures.getSingleValue('structureId', e[i].classPK, 'classNameId');
			curStructureFilesPath = LrClassNameConfig.getSingleValue('id', curStructureClassNameId, 'filesPath');
			filePath = filesRootPath + '/' + curStructureFilesPath;
			friendlyName = LrClassNameConfig.getSingleValue('id', curStructureClassNameId, 'friendlyName');
		} else {
			// If template does NOT have a structure connected to it (such as ADT:s or journalTemplates without a structure
			// connected to it).
			filePath = filesRootPath + '/' + LrClassNameConfig.getSingleValue('id', e[i].classNameId, 'filesPath');
			friendlyName = LrClassNameConfig.getSingleValue('id', e[i].classNameId, 'friendlyName');
		}

		filePath = filePath + '/templates/' + e[i].nameCurrentValue + '.' + e[i].language;
		fileContent = e[i].script;



		// Check status (if file needs to be updated, if it doesn't or if it's new.)
		if (fs.existsSync(filePath)) {
			try {
				oldFile = fs.readFileSync(filePath, {encoding: Constants.fetch('filesEncoding')});

				if (oldFile === fileContent) {
					downloadStatuses.push({
						status: 'uptodate',
						name: e[i].nameCurrentValue,
						type: friendlyName
					});
				} else {
					downloadStatuses.push({
						status: 'update',
						name: e[i].nameCurrentValue,
						type: friendlyName
					});
					fs.outputFileSync(filePath, fileContent);
				}
			} catch(catchErr) {}
		} else {
			downloadStatuses.push({
				status: 'create',
				name: e[i].nameCurrentValue,
				type: friendlyName
			});
			fs.outputFileSync(filePath, fileContent);
		}
	}




	// Echo what has been saved
	if (!options.silent) {
		// Print already up to date
		var countAlreadyUpToDate = downloadStatuses.filter(function (entry) {
			return entry.status == states[0].status;
		});
		if (countAlreadyUpToDate.length > 0) {
			utilities.writeToScreen(utilities.pad(countAlreadyUpToDate.length, 3, 'left') + ' templates - ' + states[0].heading, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
		}

		// Print update and create new
		for (var z = 1; z < states.length; z++) {

			var outArr = downloadStatuses.filter(function (entry) {
				return entry.status == states[z].status;
			});

			if (outArr.length > 0) {
				utilities.writeToScreen(utilities.pad(outArr.length, 3, 'left') + ' templates - ' + states[z].heading, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
				outTable = new Table({
					head: ['Name', 'Type'],
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
					colWidths: [40]
				});

				for (var x = 0; x < outArr.length; x++) {
					outTable.push([
						outArr[x].name,
						outArr[x].type
					]);
				}
				utilities.writeToScreen(outTable.toString(), Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_INFO'));
			}
		}
	}

};

module.exports = saveTemplates;