## Features

- ctrl + k -> t when text selected 
- Fill text key label in the input
- Text is replace y your template !

- parameters exemple :
- {
  "1": {
    "app": "appname",
    "project": "projectname",
    "targetPath": "",
    "templates": {
      "html": "{{ TXT.$VAR$ }}",
      "ts": "TXT.$VAR$"
    }
  },
  "2": {
    "app": "appname",
    "project": "projectname",
    "targetPath": "",
    "templates": {
      "html": "{{ TXT.$VAR$ }}",
      "ts": "TXT.$VAR$"
    }
  },
  "3": {
    "app": "appname",
    "targetPath": ",
    "templates": {
      "html": "{{ '$VAR$' | translate }}",
      "js": "$filter('translate')('$VAR$  ')"
    }
  }
}

**Enjoy!**
