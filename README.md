### Project Config File
For each project, there's a project configuration in `USERHOME/.ddmtool/config/projects/project-name.json`.

#### Sample Project Setting File

```
{
  "projectName": "myproject",
  "filesPath": "/code/ddm-repo",
  "defaultLocale": "en_US",
  "externalDiff": "/usr/bin/opendiff %1 %2",
  "hosts": [
    {
      "name": "local",
      "host": "http://localhost:8080",
      "username": "test@liferay.com",
      "password": "test",
      "email": "test@liferay.com"
    },
    {
      "name": "prod1",
      "host": "http://123.123.123.123",
      "username": "admin",
      "password": "superstrongpassword",
      "email": "admin@company.com"
    }    
  ],
  "ignoreDDMs": [
    "EVENTS",
    "INVENTORY",
    "ISSUES TRACKING"
  ]
}
```
#### Project Settings
* `projectName`. Your project name. App may be called with command line argument `--project myproject` to skip the project selection menu.
* `filesPath`. Full path to where your DDMs are. This is typically the folder you want to have under versioning control.
* `defaultLocale`. New DDMs will be uploaded with the name/description in this locale.

##### Host(s)
* Array of Liferay servers, e.g your local development server, your test server, your production server etc.
	* `name`. Your name of the server. App may be called with command line argument `--server local` to skip the server selection menu. If `--server` is supplied, so must `--project`.
	* `host`. Host and port to the Liferay server.
	* `username` & `password`. The username and password with which you will log in to Liferay.
	* `email`. Often email is the same as username. However, if you're not using email to log in, change this to the email adress connected to your Liferay account. Email is only used to lookup your user id (For some reason, we can't ask Liferay for the user id for the current logged in user).


##### Optional

* `externalDiff`. Path to external diff tool. If externalDiff is supplied, you'll get a new choice to "open external diff tool" in the diff menu. Must have variables `%1` and `%2`. Like `/usr/bin/opendiff %1 %2`. `%1` will be replaced with "left" folder (local DDM repository) and `%2` will be replaced with "right" folder (server DDMs).
* `ignoreDDMs`. Array of structure/template ID:s to be ignored by the App. Typically Liferay default structures/templates (if you don't remove them from server).


### Custom Class Names Configuraiton
By default, the App will look for Liferay standard DDM entities (such as structures and templates for journal articles, ADTs, dynamic data lists, etc).

If you want the App to be able to handle custom structures and templates for custom DDM entities you may create a `customClassNameConfig.json` file in `USERHOME/.ddmtool/config/`.

1. Figure out the className of the new structure/template by searching the querying for `select value from classname_ where classNameId = 12345`. If the App finds a structure/template it does not recognize, it will tell you. It'll also tell you the server classNameId of that structure/template which you use in the query.
2. Create/update the `customClassNameConfig.json` file, like below:

#### Sample Custom Class Name Configuration
```
[
    {
        "filesPath": "generic_record_set",
        "friendlyName": "Generic Record Set",
        "clazz": "com.monator.moh.genericddm.model.GenericRecordSet",
        "getTemplate": false,
        "mayHaveTemplates": true,
        "mayHaveStructures": true,
        "structure": "com.liferay.portlet.dynamicdatamapping.model.DDMStructure"
    }
]
```

* `filesPath` [string]. Subfolder (inside the folder you defined as filesPath for the project) the files will be saved in. No slashes anywhere please, no leading, no trailing and no inside.
* `friendlyName` [string]. Name as it will be displayed in the user interface
* `clazz` [string]. Class Name you got from your database query.
* `getTemplate` [boolean]. Whether or not the class should be used when asking Liferay for all Templates.
* `mayHaveTemplates`
* `mayHaveStructures`
* `structure`