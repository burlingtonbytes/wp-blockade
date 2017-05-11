/*
	Plugin Name: Blockade Simple Columns
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('simple_columns', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }
	var bootstrap_version = '3';
	if( typeof editor.settings.wp_blockade_bootstrap_major_version !== 'undefined' && editor.settings.wp_blockade_bootstrap_major_version ) {
		bootstrap_version = editor.settings.wp_blockade_bootstrap_major_version;
	}

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
				text: '2 Columns (Left Sidebar)',
				icon: 'blockade-simplecols-3-9',
				onclick: function() { insertColumns([9,3], [3,-9]);}
			},
			{
				text: '2 Columns (Right Sidebar)',
				icon: 'blockade-simplecols-9-3',
				onclick: function() { insertColumns([9,3]);}
			},
			{
				text: '2 Columns (Feature Left)',
				icon: 'blockade-simplecols-8-4',
				onclick: function() { insertColumns([8,4]);}
			},
			{
				text: '2 Columns (Feature Right)',
				icon: 'blockade-simplecols-4-8',
				onclick: function() { insertColumns([8,4],[4,-8]);}
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
				onclick: function() { insertColumns([6,3,3],[3,-6,0]);}
			},
			{
				text: '3 Columns (Feature Right)',
				icon: 'blockade-simplecols-3-3-6',
				onclick: function() { insertColumns([6,3,3],[6,-6,-6]);}
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
		var colsets = [
			'6-6',
			'4-8',
			'8-4',
			'3-9',
			'9-3',
			'4-4-4',
			'6-3-3',
			'3-6-3',
			'3-3-6',
			'3-3-3-3'
		];
		var styleEl= editor.dom.create('style');
		for( var i = 0; i < colsets.length; i++ ) {
			styleEl.innerHTML += [
				".mce-i-blockade-simplecols-" + colsets[i] + " {",
				"	background: url('" + url + "/icons/cols-" + colsets[i] + ".png') center center no-repeat;",
				"	background-size: 16px 16px;",
				"	height: 16px;",
				"	width: 16px;",
				"	opacity: 0.75;",
				"}",
			].join("\n");
		}
		document.getElementsByTagName('head')[0].appendChild(styleEl);
	});

	// register edit function
	blockade.contenttypes.simplecolumns = {
		name: "Simple Columns"
	};

	// Helper Functions
	function insertColumns( cols, shifts ) {
		var col_prefix  = 'col-sm-';
		var push_prefix = 'col-sm-push-';
		var pull_prefix = 'col-sm-pull-';
		if( bootstrap_version == '4' ) {
			push_prefix = 'push-sm-';
			pull_prefix = 'pull-sm-';
		}
		if( typeof shifts === 'undefined' ) {
			shifts = [];
			for( var i = 0; i < cols.length; i++ ) {
				shifts.push(0);
			}
		}
		if( blockade.isPlaceable( blockade.body ) ) {
			if( !cols || cols.length == 0 ) return;
			var row = blockade.document.createElement('div');
			blockade.addClass( row, 'row' );
			var temp;
			for( var i = 0; i < cols.length; i++ ) {
				var shift = '';
				if( shifts[i] < 0 ) {
					shift = pull_prefix + Math.abs( shifts[i] );
				} else if( shifts[i] > 0 ) {
					shift = push_prefix + shifts[i];
				}
				temp = blockade.document.createElement('div');
				blockade.addClass( temp, col_prefix + cols[i] );
				if( shift ) {
					blockade.addClass( temp, shift );
				}
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
