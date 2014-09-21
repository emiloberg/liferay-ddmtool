"use strict";

var LrClassNameConfig = [
    {
        filesPath: 'application_display_template/asset_publisher',
        friendlyName: 'ADT - Asset Publisher',
        clazz: 'com.liferay.portlet.asset.model.AssetEntry',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'application_display_template/blogs',
        friendlyName: 'ADT - Blogs',
        clazz: 'com.liferay.portlet.blogs.model.BlogsEntry',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'application_display_template/categories_navigation',
        friendlyName: 'ADT - Categories Navigation',
        clazz: 'com.liferay.portlet.asset.model.AssetCategory',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'application_display_template/documents_and_media',
        friendlyName: 'ADT - Documents and Media',
        clazz: 'com.liferay.portal.kernel.repository.model.FileEntry',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'application_display_template/site_map',
        friendlyName: 'ADT - Site Map',
        clazz: 'com.liferay.portal.model.LayoutSet',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'application_display_template/tags_navigation',
        friendlyName: 'ADT - Tags Navigation',
        clazz: 'com.liferay.portlet.asset.model.AssetTag',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'application_display_template/wiki',
        friendlyName: 'ADT - Wiki',
        clazz: 'com.liferay.portlet.wiki.model.WikiPage',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'journal', // This is only used if the journalTemplate does not have a structure connected to it.
        friendlyName: 'Journal Article Template',
        clazz: 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'journal',
        friendlyName: 'Journal Article Structure',
        clazz: 'com.liferay.portlet.journal.model.JournalArticle',
        type: 'journalStructure'
    },
    {
        filesPath: 'document_and_media',
        friendlyName: 'Document Types',
        clazz: 'com.liferay.portlet.documentlibrary.model.DLFileEntryMetadata',
        type: 'documentAndMedia'
    },
    {
        filesPath: 'internal',
        friendlyName: 'Liferay Internal - RAW Metadata Processor',
        clazz: 'com.liferay.portlet.documentlibrary.util.RawMetadataProcessor'
    },
    {
        filesPath: 'dynamic_data_lists',
        friendlyName: 'Dynamic Data List (DDL) Definition',
        clazz: 'com.liferay.portlet.dynamicdatalists.model.DDLRecordSet'
    },
    {
        friendlyName: 'User site',
        clazz: 'com.liferay.portal.model.User',
        type: 'group',
        containsDDMs: false
    },
    {
        friendlyName: 'Group',
        clazz: 'com.liferay.portal.model.Group',
        type: 'group',
        containsDDMs: true
    },
    {
        friendlyName: 'Organization',
        clazz: 'com.liferay.portal.model.Organization',
        type: 'group',
        containsDDMs: true
    },
    {
        friendlyName: 'Company/Global',
        clazz: 'com.liferay.portal.model.Company',
        type: 'group',
        containsDDMs: true
    }
];


function fetch(entry, prop) {
	if (typeof prop === 'undefined') {
		return LrClassNameConfig;
	} else {
		return LrClassNameConfig[entry][prop];
	}
}


function setAll(arr) {
	LrClassNameConfig = arr;
}

function addToEntry(entry, prop, val) {
	LrClassNameConfig[entry][prop] = val;
}

function add(entry) {
	LrClassNameConfig.push(entry);
}


function getSingleClassNameObjFromFilePath(file) {
	// TODO - Se till att vi får med *alla* saker vi kan ladda upp, t.ex. document/media osv.
	file = file.split('/');
	var filesPath = file[file.length - 3] + '/' + file[file.length - 2];

	var classNameIds = LrClassNameConfig.filter(function(entry) {
		return entry.filesPath === filesPath;
	});

	if(classNameIds.length === 1) {
		return classNameIds[0];
	} else {
		return undefined;
	}
}

function checkExist(lookForProperty, lookForValue) {
	var ret = LrClassNameConfig.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});

	if (ret.length > 0) {
		return true;
	} else {
		return false;
	}
}

function getSingleValue(lookForProperty, lookForValue, returnProperty) {
	var ret = LrClassNameConfig.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});

	if (ret.length === 1) {
		return ret[0][returnProperty];
	} else {
		return undefined;
	}
}

function loadCustomClassNames() {
	var fs								= require('fs-extra');
	var Constants                       = require('./SingleConstants.js');
	var lrException                     = require('./error-exception.js');
	var customClassNameConfig;
	var customClassNameConfigFile = Constants.fetch('settingsFolder') + '/' + Constants.fetch('customClassNameConfig');
	if (fs.existsSync(customClassNameConfigFile)) {
		try {
			customClassNameConfig = fs.readJsonSync(customClassNameConfigFile, {encoding: Constants.fetch('filesEncoding')});
			for (var i = 0; i < customClassNameConfig.length; i++) {
				customClassNameConfig[i].custom = true;
				add(customClassNameConfig[i]);
			}
		} catch(er) {
			lrException('Found ' + customClassNameConfigFile + ' but could not understand it!\n' + er );
		}
	}
}

module.exports.fetch = fetch;
module.exports.setAll = setAll;
module.exports.addToEntry = addToEntry;
module.exports.add = add;
module.exports.getSingleClassNameObjFromFilePath = getSingleClassNameObjFromFilePath;
module.exports.checkExist = checkExist;
module.exports.getSingleValue = getSingleValue;
module.exports.loadCustomClassNames = loadCustomClassNames;