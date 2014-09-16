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
        filesPath: 'journal/templates',
        friendlyName: 'Journal Article Template',
        clazz: 'com.liferay.portlet.dynamicdatamapping.model.DDMStructure',
        type: 'template',
        getTemplate: true
    },
    {
        filesPath: 'journal/structures',
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
        filesPath: 'dynamic_data_lists/structures',
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

module.exports = LrClassNameConfig;