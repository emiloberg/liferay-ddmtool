var fs			= require('fs-extra');
var _			= require('underscore');

var utilities	                    = require('./utilities.js');
var Constants                       = require('./SingleConstants.js');
var Config							= require('./SingleConfig.js');
var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var Table 							= require('cli-table');

var saveTemplates = function(e) {

	var globalStructures					= require('./SingleStructures.js');

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
			curStructureClassNameId = globalStructures.getSingleValue('structureId', e[i].classPK, 'classNameId');
			curStructureFilesPath = LrClassNameConfig.getSingleValue('id', curStructureClassNameId, 'filesPath');
			filePath = Config.fetch('filesFolder') + '/' + curStructureFilesPath;
			friendlyName = LrClassNameConfig.getSingleValue('id', curStructureClassNameId, 'friendlyName');
		} else {
			// If template does NOT have a structure connected to it (such as ADT:s or journalTemplates without a structure
			// connected to it).
			filePath = Config.fetch('filesFolder') + '/' + LrClassNameConfig.getSingleValue('id', e[i].classNameId, 'filesPath');
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

	// Print already up to date
	var countAlreadyUpToDate = downloadStatuses.filter(function(entry) {
		return entry.status == states[0].status;
	});
	if(countAlreadyUpToDate.length > 0) {
		utilities.writeToScreen(countAlreadyUpToDate.length + ' templates - ' + states[0].heading, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
	}

	// Print update and create new
	for (var i = 1; i < states.length; i++) {

		var outArr = downloadStatuses.filter(function(entry) {
			return entry.status == states[i].status;
		});

		if (outArr.length > 0) {
			utilities.writeToScreen(outArr.length + ' templates - ' + states[i].heading, Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_SAVE'));
			outTable = new Table({
				head: ['Name', 'Type'],
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

};

module.exports = saveTemplates;