/*
	Plugin Name: Blockade Breakout
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('blockade_breakout', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add custom css
	editor.contentCSS.push(url+'/editorstyles.css');

	blockade.internalClasses.push('wp-blockade-breakout');
	// add menu item to main blockade menu
	var menu_item = {
		text: 'Breakout',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				blockade.addClass(el, 'wp-blockade-breakout');
				blockade.setRole(el, blockade.roles.container);
				blockade.setData(el, blockade.datafields.type, 'breakout');
				el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
			}
		}
	};
	blockade.addToMenu( menu_item, 'Structural Blocks' );

	// register edit function
	blockade.contenttypes.breakout = {
		name : "Breakout",
		parse_block_data : function( data, block ) {
			data.type_specific.breakout = {

			};
			return data;
		},
		render_html : function( data ) {
			data.type_specific.breakout;
			var str = [
				'<p>',
					'Want to make some child blocks display at the original content width? ',
					'Just add the custom class <strong>wp-blockade-breakin</strong> to the blocks ',
					'that you want to break back in.',
				'</p>'
			].join('');
			return str;
		},
		apply_form_results : function( data, form_data, block ) {

		}
	};
});
