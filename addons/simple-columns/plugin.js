/*
	Plugin Name: Blockade Simple Columns
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.1
*/
tinymce.PluginManager.add('simple_columns', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add menu item to main blockade menu
	var menu_item = {
		text: 'Simple Columns',
		menu: [
			{
				text: '2 Columns (Even)',
				icon: 'blockade-simplecols-6-6',
				onclick: function() { insertColumns([6,6]);}
			},
			{
				text: '2 Columns (Feature Left)',
				icon: 'blockade-simplecols-8-4',
				onclick: function() { insertColumns([8,4]);}
			},
			{
				text: '2 Columns (Feature Right)',
				icon: 'blockade-simplecols-4-8',
				onclick: function() { insertColumns([4,8]);}
			},
			{
				text: '3 Columns (Even)',
				icon: 'blockade-simplecols-4-4-4',
				onclick: function() { insertColumns([4,4,4]);}
			},
			{
				text: '3 Columns (Feature Left)',
				icon: 'blockade-simplecols-6-3-3',
				onclick: function() { insertColumns([6,3,3]);}
			},
			{
				text: '3 Columns (Feature Center)',
				icon: 'blockade-simplecols-3-6-3',
				onclick: function() { insertColumns([3,6,3]);}
			},
			{
				text: '3 Columns (Feature Right)',
				icon: 'blockade-simplecols-3-3-6',
				onclick: function() { insertColumns([3,3,6]);}
			},
			{
				text: '4 Columns',
				icon: 'blockade-simplecols-3-3-3-3',
				onclick: function() { insertColumns([3,3,3,3]);}
			}
		]
	};
	blockade.addToMenu( menu_item, 'Structural Blocks' );

	// register stylesheet for menu icons
	editor.on('init', function() {
		var styleEl= editor.dom.create('style');
		styleEl.innerHTML = [
			".mce-i-blockade-simplecols-6-6 {",
			"	background: url('" + url + "/icons/cols-6-6.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
			".mce-i-blockade-simplecols-4-8 {",
			"	background: url('" + url + "/icons/cols-4-8.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
			".mce-i-blockade-simplecols-8-4 {",
			"	background: url('" + url + "/icons/cols-8-4.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
			".mce-i-blockade-simplecols-4-4-4 {",
			"	background: url('" + url + "/icons/cols-4-4-4.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
			".mce-i-blockade-simplecols-6-3-3 {",
			"	background: url('" + url + "/icons/cols-6-3-3.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
			".mce-i-blockade-simplecols-3-6-3 {",
			"	background: url('" + url + "/icons/cols-3-6-3.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
			".mce-i-blockade-simplecols-3-3-6 {",
			"	background: url('" + url + "/icons/cols-3-3-6.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
			".mce-i-blockade-simplecols-3-3-3-3 {",
			"	background: url('" + url + "/icons/cols-3-3-3-3.png') center center no-repeat;",
			"	background-size: 16px 16px;",
			"	height: 16px;",
			"	width: 16px;",
			"	opacity: 0.75;",
			"}",
		].join("\n");
		document.getElementsByTagName('head')[0].appendChild(styleEl);
	});

	// register edit function
	blockade.contenttypes.simplecolumns = {
		name: "Simple Columns"
	};

	// Helper Functions
	function insertColumns( cols ) {
		if( blockade.isPlaceable( blockade.body ) ) {
			if( !cols || cols.length == 0 ) return;
			var row = blockade.document.createElement('div');
			blockade.addClass( row, 'row' );
			var temp;
			for( var i = 0; i < cols.length; i++ ) {
				temp = blockade.document.createElement('div');
				blockade.addClass( temp, 'col-sm-' + cols[i] );
				blockade.setRole( temp, blockade.roles.container );
				row.appendChild( temp );
			}
			var el = blockade.document.createElement('div');
			el.appendChild( row );
			blockade.setData(el, blockade.datafields.type, 'simplecolumns');
			blockade.placeBlock( blockade.convertToBlock( el ) );
			blockade.removeActiveEditor();
		}
	}
});
