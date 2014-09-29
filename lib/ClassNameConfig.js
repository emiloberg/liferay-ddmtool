"use strict";

var LrClassNameConfig = [
    {
        filesPath: 'application_display_template/asset_publisher',
        friendlyName: 'ADT - Asset Publisher',
        clazz: 'com.liferay.portlet.asset.model.AssetEntry',
        // type: 'template',
		mayHaveTemplates: true,
        getTemplate: true,
		isADT: true
    },
    {
        filesPath: 'application_display_template/blogs',
        friendlyName: 'ADT - Blogs',
        clazz: 'com.liferay.portlet.blogs.model.BlogsEntry',
        // type: 'template',
		mayHaveTemplates: true,
        getTemplate: true,
		isADT: true
    },
    {
        filesPath: 'application_display_template/categories_navigation',
        friendlyName: 'ADT - Categories Navigation',
        clazz: 'com.liferay.portlet.asset.model.AssetCategory',
        // type: 'template',
		mayHaveTemplates: true,
        getTemplate: true,
		isADT: true
    },
    {
        filesPath: 'application_display_template/documents_and_media',
        friendlyName: 'ADT - Documents and Media',
        clazz: 'com.liferay.portal.kernel.repository.model.FileEntry',
        // type: 'template',
		mayHaveTemplates: true,
        getTemplate: true,
		isADT: true
    },
    {
        filesPath: 'application_display_template/site_map',
        friendlyName: 'ADT - Site Map',
        clazz: 'com.liferay.portal.model.LayoutSet',
        // type: 'template',
		mayHaveTemplates: true,
        getTemplate: true,
		isADT: true
    },
    {
        filesPath: 'application_display_template/tags_navigation',
        friendlyName: 'ADT - Tags Navigation',
        clazz: 'com.liferay.portlet.asset.model.AssetTag',
        // type: 'template',
		mayHaveTemplates: true,
        getTemplate: true,
		isADT: true
    },
    {
        filesPath: 'application_display_template/wiki',
        friendlyName: 'ADT - Wiki',
        clazz: 'com.liferay.portlet.wiki.model.WikiPage',
        // type: 'template',
		mayHaveTemplates: true,
        getTemplate: true,
		isADT: true
    },
    {
        filesPath: 'journal', // This is only used if the journalTemplate does not have a structure connected to it.
        friendlyName: 'Journal Article Template',
        clazz: 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure',
        // type: 'template',
        getTemplate: true,
		thisIsTheNativeDDM: true
    },
    {
        filesPath: 'journal',
        friendlyName: 'Journal Article Structure',
        clazz: 'com.liferay.portlet.journal.model.JournalArticle',
		mayHaveTemplates: true,
		mayHaveStructures: true,
//		structure: 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure',
		isNativeDDM: true
        // type: 'journalStructure'
    },
    {
        filesPath: 'document_and_media',
        friendlyName: 'Document Types',
        clazz: 'com.liferay.portlet.documentlibrary.model.DLFileEntryMetadata',
		mayHaveStructures: true
        // type: 'documentAndMedia'
    },
    {
        filesPath: 'internal',
        friendlyName: 'Liferay Internal - RAW Metadata Processor',
        clazz: 'com.liferay.portlet.documentlibrary.util.RawMetadataProcessor'
    },
    {
        filesPath: 'dynamic_data_lists',
        friendlyName: 'Dynamic Data List (DDL) Definition',
        clazz: 'com.liferay.portlet.dynamicdatalists.model.DDLRecordSet',
		mayHaveStructures: true
    },
    {
        friendlyName: 'User site',
        clazz: 'com.liferay.portal.model.User',
        // type: 'group',
        containsDDMs: false
    },
    {
        friendlyName: 'Group',
        clazz: 'com.liferay.portal.model.Group',
        // type: 'group',
        containsDDMs: true
    },
    {
        friendlyName: 'Organization',
        clazz: 'com.liferay.portal.model.Organization',
        // type: 'group',
        containsDDMs: true
    },
    {
        friendlyName: 'Company/Global',
        clazz: 'com.liferay.portal.model.Company',
        // type: 'group',
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

function checkExist(lookForProperty, lookForValue) {
	var ret = LrClassNameConfig.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});

	return ret.length > 0;
}

function getAllFilter(lookForProperty, lookForValue) {
	return LrClassNameConfig.filter(function(entry) {
		return entry[lookForProperty] == lookForValue;
	});
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
	var Constants                       = require('./Constants.js');
	var Config							= require('./Config.js');
	var lrException                     = require('./errorException.js');
	var customClassNameConfig;
	var customClassNameConfigFile = Config.fetch('settingsFolder') + '/' + Constants.fetch('customClassNameConfig');
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
module.exports.checkExist = checkExist;
module.exports.getAllFilter = getAllFilter;
module.exports.getSingleValue = getSingleValue;
module.exports.loadCustomClassNames = loadCustomClassNames;