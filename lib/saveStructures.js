"use strict";

var fs			= require('fs-extra');
var _			= require('underscore');

var utilities	                    = require('./utilities.js');
var Constants                       = require('./Constants.js');
var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var Table 							= require('cli-table');

var saveStructures = function(e, filesRootPath, options) {
	var filePath;
	var fileContent;

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

		filePath = filesRootPath + '/' + LrClassNameConfig.getSingleValue('id', e[i].classNameId, 'filesPath');

		fileContent = e[i].xsd;

		// If the class is DLFileEntryMetadata, then check 'type'.
		// Depending on type, set different save paths for 'Document Type' and 'Metadata Set'
		if (e[i].classNameId === LrClassNameConfig.getSingleValue('clazz', 'com.liferay.portlet.documentlibrary.model.DLFileEntryMetadata', 'id')) {
			if (e[i].type === 1) {
				filePath = filePath + '/' + Constants.fetch('pathSlugDocumentTypes') + '/structures/' + e[i].nameCurrentValue + '.' + e[i].storageType;
			} else {
				filePath = filePath + '/' + Constants.fetch('pathSlugMetadataSets') + '/structures/' + e[i].nameCurrentValue + '.' + e[i].storageType;
			}
		} else {
			filePath = filePath + '/structures/' + e[i].nameCurrentValue + '.' + e[i].storageType;
		}


		// Check status (if file needs to be updated, if it doesn't or if it's new.)
		if (fs.existsSync(filePath)) {
			try {
				oldFile = fs.readFileSync(filePath, {encoding: Constants.fetch('filesEncoding')});

				if (oldFile === fileContent) {
					downloadStatuses.push({
						status: 'uptodate',
						name: e[i].nameCurrentValue,
						type: LrClassNameConfig.getSingleValue('id', e[i].classNameId, 'friendlyName')
					});
				} else {
					downloadStatuses.push({
						status: 'update',
						name: e[i].nameCurrentValue,
						type: LrClassNameConfig.getSingleValue('id', e[i].classNameId, 'friendlyName')
						});
					fs.outputFileSync(filePath, fileContent);
				}
			} catch(catchErr) {}
		} else {
			downloadStatuses.push({
				status: 'create',
				name: e[i].nameCurrentValue,
				type: LrClassNameConfig.getSingleValue('id', e[i].classNameId, 'friendlyName')
				});
			fs.outputFileSync(filePath, fileContent);
		}


	}

	if (!options.silent) {
		// Echo what has been saved
		utilities.writeToScreen('', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_HEADING'));
		// Print already up to date
		var countAlreadyUpToDate = downloadStatuses.filter(function (entry) {
			return entry.status == states[0].status;
		});
		if (countAlreadyUpToDate.length > 0) {
			utilities.writeToScreen(utilities.pad(countAlreadyUpToDate.length, 3, 'left') + ' structures - ' + states[0].heading, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
		}

		// Print update and create new
		for (var z = 1; z < states.length; z++) {

			var outArr = downloadStatuses.filter(function (entry) {
				return entry.status == states[z].status;
			});

			if (outArr.length > 0) {
				utilities.writeToScreen(utilities.pad(outArr.length, 3, 'left') + ' structures - ' + states[z].heading, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));

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

module.exports = saveStructures;