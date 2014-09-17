"use strict";

var Q           					= require('q');
var fs								= require('fs-extra');

var Constants   					= require('./SingleConstants.js');
var LrClassNameConfig	    		= require('./SingleLrClassNameConfig.js');
var globalStructures				= require('./SingleStructures.js');
var globalTemplates					= require('./SingleTemplates.js');

var utilities						= require('./utilities.js');

var createUploadObject = function (file) {

	var deferred = Q.defer();

    var currentDDMs = [];
    var thisDDM = [];
    var oldDDMObject = {};
	var newScript = '';
	var fileClassObj = LrClassNameConfig.getSingleClassNameObjFromFilePath(file);
	var fileName = utilities.filenameAndPathToFilename(file);
	var fileLanguageType = utilities.filenameToLanguageType(file);
	var isNewDDM = false;
	var returnObj = {
		exceptionFile: file,
		group: {}
	};


    // If file actually is a DDM
    if (fileClassObj === 'undefined') {
		returnObj.exception = 'File is not a DDM';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	returnObj.fileClassObj = fileClassObj;
	returnObj.fileName = fileName;

	try {
		newScript = fs.readFileSync(file, {encoding: Constants.fetch('filesEncoding')});
	} catch(catchErr) {
		returnObj.exception = 'Could not read file';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	// DO MAGIC TO FIGURE OUT IF IT'S A NEW DDM OR AN OLD ONE WE WANT TO UPDATE

	// Get list of templates or structures depending on what data we're dealing with.
	if(fileClassObj.type === 'template') {
		currentDDMs =  globalTemplates.fetch();
	} else if (fileClassObj.type === 'journalStructure') {
		currentDDMs = globalStructures.fetch();
	} else {
		returnObj.exception = 'Not a template nor a structure';
		deferred.reject(returnObj);
		return deferred.promise;
	}

	// Filter the array to only contain the structures/templates
	// of the same type (classNameId) as the file we're uploading
	currentDDMs = currentDDMs.filter(function(entry) {
		return entry.classNameId === fileClassObj.id;
	});

	// Search the array by DDM name.
	// If we find a match, we're *updating* that DDM. If we don't
	// Find a match, we're *creating a new* DDM.
	if (currentDDMs.length > 0) {
		thisDDM = currentDDMs.filter(function(entry) {
			return entry.nameCurrentValue === fileName;
		});
		if(thisDDM.length === 1) {
			isNewDDM = false;
			oldDDMObject = thisDDM[0];
		} else if (thisDDM.length > 1) {
			returnObj.exception = 'There are more than one structures/templates with the same name.\nName: ' + fileName + '\nDDM: ' + fileClassObj.friendlyName;
			deferred.reject(returnObj);
			return deferred.promise;
		} else {
			returnObj.status = 'create';
			isNewDDM = true;
		}
	} else {
		isNewDDM = true;
	}

	if (isNewDDM) {
		// New Journal Template
		if (returnObj.fileClassObj.clazz === 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure') {
			var createUploadObjectNewJournalTemplate = require('./upload--create-object--new--journal-template.js');
			createUploadObjectNewJournalTemplate(newScript, fileClassObj, fileName, fileLanguageType, isNewDDM, returnObj).then(function (resp) {
				deferred.resolve(resp);
			}, function (er) {
				deferred.reject(er);
			});
		}
	} else {
		// Update Template
		if(fileClassObj.type === 'template') {
			var createUploadObjectUpdateTemplate = require('./upload--create-object--update--template.js');
			createUploadObjectUpdateTemplate(newScript, fileClassObj, fileName, fileLanguageType, isNewDDM, oldDDMObject, returnObj).then(function (resp) {
				deferred.resolve(resp);
			}, function (er) {
				deferred.reject(er);
			});
		}

		// Update structure
		// Todo: Make this work with all structures.
		if(fileClassObj.type === 'journalStructure') {
			var createUploadObjectUpdateStructure = require('./upload--create-object--update--structure.js');
			createUploadObjectUpdateStructure(newScript, fileClassObj, fileName, fileLanguageType, isNewDDM, oldDDMObject, returnObj).then(function (resp) {
				deferred.resolve(resp);
			}, function (er) {
				deferred.reject(er);
			});
		}

	}

    return deferred.promise;

};

module.exports = createUploadObject;