"use strict";

var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');

function findClassName(filePathSlug) {
	var possibleClassNames = LrClassNameConfig.getAllFilter('mayHaveStructures', true).filter(function (entry) {
		return entry.filesPath === filePathSlug;
	});

	if (possibleClassNames.length === 0) {
		return false;
	} else if (possibleClassNames.length === 1) {
		return possibleClassNames[0].id;
	} else {
		return false;
	}
}

var coStructure = function (file) {

	var Q           					= require('q');
	var fs								= require('fs-extra');
	var _								= require('underscore');

	var Constants   					= require('./SingleConstants.js');
	var globalStructures				= require('./SingleStructures.js');
	var globalTemplates					= require('./SingleTemplates.js');

	var utilities						= require('./utilities.js');

	var deferred = Q.defer();

	var possibleStructures = [];

	var newObj = {
		fileLanguageType: utilities.filenameToLanguageType(file),
		fileFriendlyName: utilities.filenameAndPathToFilename(file),
		file: file,
		isStructure: true,
		isNewDDM: false,
		isUpdatingDDM: false,
		toPayload: {
			type: 0
		}
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


	
	// FIGURE OUT WHAT KIND OF STRUCTURE IT IS
	var filePathSplit = file.split('/');
	newObj.classNameId = findClassName(filePathSplit[filePathSplit.length - 4] + '/' + filePathSplit[filePathSplit.length - 3]);
	if (!newObj.classNameId) {
		newObj.classNameId = findClassName(filePathSplit[filePathSplit.length - 3]);
	}
	if (!newObj.classNameId) {
		newObj.classNameId = findClassName(filePathSplit[filePathSplit.length - 4]);
		if(newObj.classNameId) {
			// If the structure is a document and media structure we need to
			// find out what type ('document type' or 'metadata set') it is.
			if (filePathSplit[filePathSplit.length - 3] === Constants.fetch('pathSlugDocumentTypes')) {
				newObj.toPayload.type = 1;
			} else if (filePathSplit[filePathSplit.length - 3] === Constants.fetch('pathSlugMetadataSets')) {
				newObj.toPayload.type = 1;
			} else {
				returnObj.exception = 'Could not figure out what type of Document and Media Structure it is. (Error 6002)';
				deferred.reject(returnObj);
				return deferred.promise;
			}
		}
	}
	if (!newObj.classNameId) {
		returnObj.exception = 'Could not find matching classNameId. (Error 6001)';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	// FIGURE OUT IF IT'S A NEW STRUCTURE OR AN ALREADY EXISTING ONE WE NEED TO UPDATE.

	// Get all structures or the same class
	possibleStructures = globalStructures.fetch().filter(function (entry) {
		return entry.classNameId === newObj.classNameId;
	});
	
	// Compare names
	possibleStructures = possibleStructures.filter(function (entry) {
		return entry.nameCurrentValue === newObj.fileFriendlyName;
	});
	if (possibleStructures.length === 1) {
		newObj.isUpdatingDDM = true;
		newObj.oldObj = possibleStructures[0];
	} else if (possibleStructures.length === 0) {
		newObj.isNewDDM = true;
	} else {
		returnObj.exception = 'More than one structure named the same thing. (Error 6003)';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	console.log('isNewDDM:		' + newObj.isNewDDM);
	console.log('isUpdatingDDM:	' + newObj.isUpdatingDDM);


	// TODO WORK HERE


//	userId long
//	groupId long
//	classNameId long
//	nameMap java.util.Map
//	descriptionMap java.util.Map
//	xsd java.lang.String
//	serviceContext com.liferay.portal.service.ServiceContext

//
//	// This is the classNameId of the structures we are allowed to bind the template to
//	newObj.validStructuresClassNameId = possibleClassNames[0].id;
//
//	// Get linked structure if needed
//	if (possibleClassNames[0].hasOwnProperty('structure')) {
//		newObj.classNameId = LrClassNameConfig.getSingleValue('clazz', possibleClassNames[0].structure, 'id');
//	}
//
//	// ADTs don't have a classPK, so we might just as well set it right here.
//	if (LrClassNameConfig.getSingleValue('id', newObj.classNameId, 'isADT')) {
//		newObj.classPK = 0;
//		newObj.isADT = true;
//	} else {
//		newObj.isADT = false;
//	}
//
//	if (!newObj.isADT) { // If "normal" template, such as journal or ddm
//		// These are all structures we are allowed to bind the template to
//		newObj.validStructures = globalStructures.getAllFilter('classNameId', newObj.validStructuresClassNameId);
//
//		// These are all templates of the same type as the one we're trying to upload,
//		// this is the array of templates we'll be looking in to see if it's a new template or we need to update
//		// an old template.
//		for (var z = 0; z < newObj.validStructures.length; z++) {
//			newObj.validStructures[z].validTemplates = globalTemplates.getAllFilter('classPK', newObj.validStructures[z].structureId);
//
//			// This is a bit dirty but I'm saving the templates again, this time as a flat
//			// array, to make it a bit easier to see if this is a new template or an old
//			// one which needs to be updated.
//			newObj.validStructures[z].validTemplates.forEach(function (entry) {
//				newObj.validTemplates.push(entry);
//			});
//
//		}
//
//	} else { // if ADT template.
//		newObj.validTemplates = globalTemplates.getAllFilter('classNameId', newObj.classNameId);
//	}
//
//	// Figure out if it's a new template or an already existing one we need to update.
//	newObj.fileFriendlyName = utilities.filenameAndPathToFilename(file);
//	var matchingTemplate = newObj.validTemplates.filter(function (entry) {
//		return entry.nameCurrentValue === newObj.fileFriendlyName;
//	});
//	if (matchingTemplate.length === 1) {
//		newObj.isUpdatingDDM = true;
//		newObj.oldObj = matchingTemplate[0];
//	} else if (matchingTemplate.length === 0) {
//		newObj.isNewDDM = true;
//	} else {
//		returnObj.exception = 'More than one template named the same thing: \''+ newObj.fileFriendlyName + '\' (Error 5004)';
//		deferred.reject(returnObj);
//		return deferred.promise;
//	}
//
//	// Set some friendly Output things we need to make a nice output to the user
//	newObj.className = LrClassNameConfig.getSingleValue('id', newObj.validStructuresClassNameId, 'friendlyName');
//
//	if (newObj.isUpdatingDDM) {
//		var createUploadObjectUpdateTemplate = require('./upload--co-template-update.js');
//		createUploadObjectUpdateTemplate(newObj).then(
//			function (resp) {
//				deferred.resolve(resp);
//				return deferred.promise;
//			},
//			function (resp) {
//				deferred.reject(resp);
//				return deferred.promise;
//			});
//	} else if (newObj.isNewDDM) {
//		var createUploadObjectCreateTemplate = require('./upload--co-template-new.js');
//		createUploadObjectCreateTemplate(newObj).then(
//			function (resp) {
//				deferred.resolve(resp);
//				return deferred.promise;
//			},
//			function (resp) {
//				deferred.reject(resp);
//				return deferred.promise;
//			});
//	}


//	utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));
//	console.log('Ny Template                    ' + file);
//	console.log('fileFriendlyName               ' + newObj.fileFriendlyName);
//	console.log('isADT                          ' + newObj.isADT);
//	console.log('isNewDDM                       ' + newObj.isNewDDM);
//	console.log('isUpdatingDDM                  ' + newObj.isUpdatingDDM);
//	console.log('status                         ' + newObj.status);
//	console.log('ClassNameId                    ' + newObj.classNameId + ' (' + LrClassNameConfig.getSingleValue('id', newObj.classNameId, 'friendlyName') + ')');
//	console.log('validStructuresClassNameId     ' + newObj.validStructuresClassNameId + ' (' + LrClassNameConfig.getSingleValue('id', newObj.validStructuresClassNameId, 'friendlyName') + ')');
//
//
//	if (!newObj.isADT) {
//		for (var y = 0; y < newObj.validStructures.length; y++) {
//			console.log('      ' + newObj.validStructures[y].nameCurrentValue + ' (' + newObj.validStructures[y].structureId + ')');
//			for (var x = 0; x < newObj.validStructures[y].validTemplates.length; x++) {
//				console.log('            ' + newObj.validStructures[y].validTemplates[x].nameCurrentValue);
//			}
//		}
//	} else {
//		console.log('IZ ADT');
//		for (var w = 0; w < newObj.validTemplates.length; w++) {
//			console.log('      ' + newObj.validTemplates[w].nameCurrentValue);
//		}
//	}
//	utilities.writeToScreen('-', Constants.fetch('SEVERITY_NORMAL'), Constants.fetch('SCREEN_PRINT_NORMAL'));

	return deferred.promise;
};

module.exports = coStructure;


