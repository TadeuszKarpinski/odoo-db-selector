![Screenshot](https://i.imgur.com/k9iT26B.png)

# Odoo Database Selector

Odoo Database Selector
This is an extension for  Odoo's framework. It allows the user to select target databases in the vscode statusbar. 
1. The User choses the required configuation file.
2. The module, using the file credentials, queries Postgresql Server and lists all available databases (excluding: template0, template1, postgres). 
3. The module replaces the keys (db_name, dbfilter) in the configuration file with the selected target databases. After this operation, the user can launch Odoo from standard launch.json file without specifying any target database.

Database selector position

![Screenshot](https://i.imgur.com/wlRKL5Q.png)

Replaced keys in odoo configuration

![Screenshot](https://i.imgur.com/2k7lzgC.png)
