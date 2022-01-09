# Odoo Database Selector

This is an extension for odoo framework. It allows user to select target database from vscode statusbar. This module requires user to select path to configuration file. Connects to postgres with credentials from this file and list all available databases with template0, template1, posgres excluded. After selection module replaces target databases in the config file: keys db_name and dbfilter. After this operation user can launch odoo from standard launch.json file without specifying target database.

Database selector position

![Screenshot](https://i.imgur.com/wlRKL5Q.png)

Replaced keys in odoo configuration

![Screenshot](https://i.imgur.com/2k7lzgC.png)
