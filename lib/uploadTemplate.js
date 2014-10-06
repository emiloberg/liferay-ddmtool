"use strict";

var coTemplate = function (file) {

	var Q           					= require('q');
	var fs								= require('fs-extra');
	var _								= require('underscore');

	var Constants   					= require('./Constants.js');
	var LrClassNameConfig	    		= require('./ClassNameConfig.js');
	var Structures				= require('./Structures.js');
	var Templates					= require('./Templates.js');

	var utilities						= require('./utilities.js');

	var deferred = Q.defer();

	var newObj = {
		fileLanguageType: utilities.filenameToLanguageType(file),
		file: file,
		validStructures: [],
		validTemplates: [],
		isTemplate: true,
		isStructure: false,
		isNewDDM: false,
		isUpdatingDDM: false,
		isADT: false
	};

	var returnObj = {
		exceptionFile: file,
		group: {}
	};

	try {
		newObj.newScript = fs.readFileSync(file, {encoding: Constants.fetch('filesEncoding')});
	} catch(catchErr) {
		returnObj.exception = 'Could not read file ';
		deferred.reject(returnObj);
		return deferred.promise;
	}


	var filePathSplit = file.split('/');
	var identifyingSingleFilePath = filePathSplit[filePathSplit.length - 3];
	var identifyingDoubleFilePath = filePathSplit[filePathSplit.length - 4] + '/' + filePathSplit[filePathSplit.length - 3];

	// FIGURE OUT WHAT KIND OF TEMPLATE IT IS

	// Check if the file path with two levels
	// (like 'application_display_template/asset_publisher') match a template
	var possibleClassNames = LrClassNameConfig.getAllFilter('mayHaveTemplates', true).filter(function (entry) {
		return entry.filesPath === identifyingDoubleFilePath;
	});

	if (possibleClassNames.length === 0) {
		// We didn't get a match when we tried to compare the two level file path,
		// now try with a single level file path instead.
		possibleClassNames = LrClassNameConfig.getAllFilter('mayHaveTemplates', true).filter(function (entry) {
			return entry.filesPath === identifyingSingleFilePath;
		});


		if (possibleClassNames.length === 1) {
			newObj.classNameId = possibleClassNames[0].id;
		} else if (possibleClassNames.length === 0) {
			returnObj.exception = 'Template didn\'t match structure. (Error 5001)';
			deferred.reject(returnObj);
			return deferred.promise;
		} else {
			returnObj.exception = 'Template matched more than one structure. (Error 5003)';
			deferred.reject(returnObj);
			return deferred.promise;
		}

	} else if (possibleClassNames.length === 1) {
		newObj.classNameId = possibleClassNames[0].id;
	} else {
		returnObj.exception = 'Template matched more than one structure. (Error 5002)';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	// This is the classNameId of the structures we are allowed to bind the template to
	newObj.validStructuresClassNameId = possibleClassNames[0].id;

	// Get linked structure if needed
	if (possibleClassNames[0].isNativeDDM) {
//		newObj.classNameId = LrClassNameConfig.getSingleValue('clazz', possibleClassNames[0].structure, 'id');
		newObj.classNameId = LrClassNameConfig.getSingleValue('thisIsTheNativeDDM', true, 'id');
	}

	// ADTs don't have a classPK, so we might just as well set it right here.
	if (LrClassNameConfig.getSingleValue('id', newObj.classNameId, 'isADT')) {
		newObj.classPK = 0;
		newObj.isADT = true;
	} else {
		newObj.isADT = false;
	}

	if (!newObj.isADT) { // If "normal" template, such as journal or ddm
		// These are all structures we are allowed to bind the template to
		newObj.validStructures = Structures.getAllFilter('classNameId', newObj.validStructuresClassNameId);

		// These are all templates of the same type as the one we're trying to upload,
		// this is the array of templates we'll be looking in to see if it's a new template or we need to update
		// an old template.
		for (var z = 0; z < newObj.validStructures.length; z++) {
			newObj.validStructures[z].validTemplates = Templates.getAllFilter('classPK', newObj.validStructures[z].structureId);

			// This is a bit dirty but I'm saving the templates again, this time as a flat
			// array, to make it a bit easier to see if this is a new template or an old
			// one which needs to be updated.
			/*jshint -W083 */
			newObj.validStructures[z].validTemplates.forEach(function (entry) {
				newObj.validTemplates.push(entry);
			});
			/*jshint +W083 */

		}

	} else { // if ADT template.
		newObj.validTemplates = Templates.getAllFilter('classNameId', newObj.classNameId);
	}

	// Figure out if it's a new template or an already existing one we need to update.
	newObj.fileFriendlyName = utilities.filenameAndPathToFilename(file);
	var matchingTemplate = newObj.validTemplates.filter(function (entry) {
		return entry.nameCurrentValue === newObj.fileFriendlyName;
	});
	if (matchingTemplate.length === 1) {
		newObj.isUpdatingDDM = true;
		newObj.oldObj = matchingTemplate[0];
	} else if (matchingTemplate.length === 0) {
		newObj.isNewDDM = true;
	} else {
		returnObj.exception = 'More than one template named the same thing: \''+ newObj.fileFriendlyName + '\' (Error 5004)';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	// Set some friendly Output things we need to make a nice output to the user
	newObj.className = LrClassNameConfig.getSingleValue('id', newObj.validStructuresClassNameId, 'friendlyName');

	if (newObj.isUpdatingDDM) {
		var createUploadObjectUpdateTemplate = require('./uploadTemplateUpdate.js');
		createUploadObjectUpdateTemplate(newObj).then(
			function (resp) {
				deferred.resolve(resp);
				return deferred.promise;
			},
			function (resp) {
				deferred.reject(resp);
				return deferred.promise;
		});
	} else if (newObj.isNewDDM) {
		var createUploadObjectCreateTemplate = require('./uploadTemplateNew.js');
		createUploadObjectCreateTemplate(newObj).then(
			function (resp) {
				deferred.resolve(resp);
				return deferred.promise;
			},
			function (resp) {
				deferred.reject(resp);
				return deferred.promise;
			});
	}

	return deferred.promise;
};

module.exports = coTemplate;
