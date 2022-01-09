/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/


import { fileURLToPath } from 'url';
import * as vscode from 'vscode';

const pg = require('pg');
const vscodeVariables = require('vscode-variables');


let odooDatabaseSelectorStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	odooDatabaseSelectorStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	odooDatabaseSelectorStatusBarItem.tooltip = "Select target DB for odoo";
	odooDatabaseSelectorStatusBarItem.command = "config.commands.selectOdooDatabase";
	context.subscriptions.push(odooDatabaseSelectorStatusBarItem);

	updateOdooDatabaseSelectorStatusBar();
	odooDatabaseSelectorStatusBarItem.show();


	vscode.commands.registerCommand('config.commands.selectOdooConfigFile', async () => {
		const configuration = vscode.workspace.getConfiguration();

		const options: vscode.OpenDialogOptions = {
			canSelectMany: false,
			openLabel: 'Open',
			filters: {
				'Text files': ['conf'],
				'All files': ['*']
			}
		};
		vscode.window.showOpenDialog(options).then(fileUri => {
			if (fileUri && fileUri[0]) {
				configuration.update('conf.view.odoo.confFile', fileUri[0].fsPath, vscode.ConfigurationTarget.Workspace);
				setTimeout(function() {
					vscode.commands.executeCommand('config.commands.selectOdooDatabase');
				}, 3000);
			}
		});
	});

	vscode.commands.registerCommand('config.commands.selectOdooDatabase', async () => {
		const configuration = vscode.workspace.getConfiguration();
		const odoo_conf_file_path = vscodeVariables(configuration.get('conf.view.odoo.confFile'));

		let odoo_conf_file;
		const db_names = [];
		const conf_uri = vscode.Uri.file(odoo_conf_file_path);

		// Read odoo configuration file
		// await vscode.workspace.fs.writeFile(vscode.Uri.file('C:/Users/tkarpinski003/.vscode/extensions/ms-python.python-2021.12.1559732655/pythonFiles/visualstudio_py_testlauncher.py'), new TextEncoder().encode("asd"));
		try {
			odoo_conf_file = await vscode.workspace.fs.readFile(conf_uri);
		} catch(error) {
			vscode.window.showInformationMessage('Select odoo configuration file');
			vscode.commands.executeCommand('config.commands.selectOdooConfigFile');
			return;
		}

		// Parse odoo configuration file to dict
		let odoo_conf_text = new Buffer(odoo_conf_file).toString("utf-8");
		const odoo_conf_dict = odoo_conf_to_dict(odoo_conf_text);

		// Try to connect to postgres and get databases list
		try {
			const odoo_psql_connection = get_psql_connection(odoo_conf_dict);
			const res = await odoo_psql_connection.query('SELECT datname FROM pg_database;');
			for (const row of res.rows) {
				if (!['template0', 'template1', 'postgres'].includes(row.datname)) {
					db_names.push(row.datname);
				}
			}
		} catch(error) {
			vscode.window.showErrorMessage("Can't connect to postgres. Are psql credentials in odoo config ok?");
			vscode.commands.executeCommand('config.commands.selectOdooConfigFile');
			return;
		}

		// Show database selection
		let value = await vscode.window.showQuickPick(db_names, { placeHolder: 'Select the view to show when opening a window.' });
		if (vscode.workspace.workspaceFolders) {
				await configuration.update('conf.view.odoo.dbName', value, vscode.ConfigurationTarget.Workspace);
		} else {
			await configuration.update('conf.view.odoo.dbName', value, vscode.ConfigurationTarget.Global);
		}
		if (value == "All Databases") {
			value = "False";
		}

		// Replace odoo db_name and dbfilter in odoo conf file with db selected
		const match_db_name = odoo_conf_text.match("db_name.*");
		if (match_db_name) {odoo_conf_text = odoo_conf_text.replace(match_db_name[0], "db_name = " + value);}
		const match_dbfilter = odoo_conf_text.match("dbfilter.*");
		if (match_dbfilter) {odoo_conf_text = odoo_conf_text.replace(match_dbfilter[0], "dbfilter = " + value);}
		if (match_db_name || match_dbfilter) {await vscode.workspace.fs.writeFile(conf_uri, new TextEncoder().encode(odoo_conf_text));}
	});

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('conf.view.odoo.dbName')) {
			updateOdooDatabaseSelectorStatusBar();
		}
	}));
}

function get_psql_connection(odoo_conf_dict: { [key: string]: string }) {
	const odoo_psql_config = {
		user: odoo_conf_dict["db_user"] || "",
		database: 'template1',
		password: odoo_conf_dict["db_password"] || "",
		port: odoo_conf_dict["db_port"] || "",
		host: odoo_conf_dict["db_host"] || "",
	};
	return new pg.Pool(odoo_psql_config);
}

function odoo_conf_to_dict(odoo_conf_text: string) {
	const odoo_conf_dict: { [key: string]: string } = {};
	for (const match of odoo_conf_text.matchAll(RegExp("(.*)(\s*=\s*)(.*)",'g'))) {
		if (match) {
			if (match.length >= 2) {
				odoo_conf_dict[match[1].trim()] = match[3].trim() || "";
			}
		}
	}
	return odoo_conf_dict;
}

function updateOdooDatabaseSelectorStatusBar(): void {
	const configuration = vscode.workspace.getConfiguration();
	odooDatabaseSelectorStatusBarItem.text = String("$(database) " + configuration.get('conf.view.odoo.dbName'));
}

