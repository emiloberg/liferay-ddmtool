"use strict";

var ArticleFolders = [];

function add(entry) {
	ArticleFolders.push(entry);
}

function truncate() {
	ArticleFolders = [];
}


function getAll(){
	return ArticleFolders;
}

function getListOfFolderIdsByGroupId(groupId) {
	var filteredFolders = ArticleFolders.filter(function (group) {
		return group.groupId === groupId;
	});
	
	return filteredFolders.map(function (group) {
		//return folderId;
		return group.folderId;
		
	});
}

function getSingleValue(lookForProperty, lookForValue, returnProperty) {
	var ret = ArticleFolders.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});

	if (ret.length === 1) {
		return ret[0][returnProperty];
	} else {
		return undefined;
	}
}

function getFolderId(groupId, folderName, parentFolderId) {
	var ret = ArticleFolders.filter(function(folder) {
		// TODO, for some reason folder.name === folderName does not work with exotic characters such as ÅÄÖ.
		return (folder.groupId === groupId && folder.name == folderName && folder.parentFolderId === parentFolderId);
	});

	if (ret.length === 1) {
		return ret[0].folderId;
	} else {
		return undefined;
	}
}

module.exports.add = add;
module.exports.truncate = truncate;
module.exports.getAll = getAll;
module.exports.getListOfFolderIdsByGroupId = getListOfFolderIdsByGroupId;
module.exports.getSingleValue = getSingleValue;
module.exports.getFolderId = getFolderId;
