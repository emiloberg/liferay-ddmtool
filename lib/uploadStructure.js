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

	var Constants   					= require('./Constants.js');
	var Structures						= require('./Structures.js');
	var Templates						= require('./Templates.js');

	var utilities						= require('./utilities.js');

	var deferred = Q.defer();

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
				newObj.isDLFileEntryType = true;
			} else if (filePathSplit[filePathSplit.length - 3] === Constants.fetch('pathSlugMetadataSets')) {
				newObj.toPayload.type = 0;
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
	var possibleStructures = Structures.fetch().filter(function (entry) {
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


	if (newObj.isUpdatingDDM) {
		var createUploadObjectUpdateStructure = require('./uploadStructureUpdate.js');
		createUploadObjectUpdateStructure(newObj).then(
			function (resp) {
				deferred.resolve(resp);
				return deferred.promise;
			},
			function (resp) {
				deferred.reject(resp);
				return deferred.promise;
			});
	} else if (newObj.isNewDDM) {

		if(newObj.isDLFileEntryType) {
			// TODO. Creating new DL Document Entry Type is not supported as of now (as they can not be uploaded as
			// all the other Structures but rather need a special call to '/dlfileentrytype/add-file-entry-type').
			// therefor, right now we're just returning an ignore flag.
			returnObj.ignore = true;
			returnObj.ignoreMsg = 'Creating new \'Document and Media - Document Types\' is not supported right now. You may however download them from server and update existing ones.';
			deferred.resolve(returnObj);
		} else {
			var createUploadObjectNewStructure = require('./uploadStructureNew.js');
			createUploadObjectNewStructure(newObj).then(
				function (resp) {
					deferred.resolve(resp);
					return deferred.promise;
				},
				function (resp) {
					deferred.reject(resp);
					return deferred.promise;
				});
		}
	} else {
		returnObj.exception = 'Could not figure out if I should update or create new Structure (Error 6004)';
		deferred.reject(returnObj);
	}


	return deferred.promise;
};

module.exports = coStructure;


