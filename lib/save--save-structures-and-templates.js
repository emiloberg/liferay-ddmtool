var nprint		= require('node-print');
var fs			= require('fs-extra');
var _			= require('underscore');

var utilities	                    = require('./utilities.js');

var Config							= require('./SingleConfig.js');
var Fixed	                        = require('./SingleFixed.js');

var saveStructuresAndTemplatesToFile = function(e) {
	var filePath;
	var fileContent;
	var outCounter = {};

	var idDLFileEntryMetadata = utilities.getSingleValueFromLrClassNameConfig('clazz', 'com.liferay.portlet.documentlibrary.model.DLFileEntryMetadata', 'id');
	var friendlyName;

	for (var i = 0; i < e.length; ++i) {
//			filePath = Config.filesFolder + '/' + utilities.getFilesPathFromClassNameId(e[i].classNameId);
		filePath = Config.filesFolder + '/' + utilities.getSingleValueFromLrClassNameConfig('id', e[i].classNameId, 'filesPath');

		// Figure out what kind of data we're dealing with and get a filename/path and the content.
		if (e[i].hasOwnProperty('storageType') && e[i].hasOwnProperty('xsd')) {

			fileContent = e[i].xsd;

			// If the class is DLFileEntryMetadata, then check 'type'.
			// Depending on type, set different save paths for 'Document Type' and 'Metadata Set'
			if (e[i].classNameId === idDLFileEntryMetadata) {
				if (e[i].type === 1) {
					filePath = filePath + '/' + Fixed.pathSlugDocumentTypes + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
				} else {
					filePath = filePath + '/' + Fixed.pathSlugMetadataSets + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
				}
			} else {
				filePath = filePath + '/' + e[i].nameCurrentValue + '.' + e[i].storageType;
			}


		} else if (e[i].hasOwnProperty('script') && e[i].hasOwnProperty('language')) {
			filePath = filePath + '/' + e[i].nameCurrentValue + '.' + e[i].language;
			fileContent = e[i].script;
		} else {
			throw Error('Could not find content in entity ' + e[i].classNameId + ' (Script needs to be updated with this classNameId)');
		}

		// Save file
		fs.outputFileSync(filePath, fileContent);

		//  Count the different files to be able to tell the user what's saved.

		friendlyName = utilities.getSingleValueFromLrClassNameConfig('id', e[i].classNameId, 'friendlyName');

		if (outCounter.hasOwnProperty(friendlyName)) {
			outCounter[friendlyName] = outCounter[friendlyName] + 1;
		} else {
			outCounter[friendlyName] = 1;
		}
	}

	// Echo what has been saved
	var outKeys = _.keys(outCounter);
	for (var x = 0; x < outKeys.length; ++x) {
		nprint.pf('%10s   %10s', outCounter[outKeys[x]], outKeys[x]);
	}

};

module.exports = saveStructuresAndTemplatesToFile;