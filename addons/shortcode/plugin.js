/*
	Plugin Name: Blockade Shortcode
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('blockade_shortcode', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add menu item to main blockade menu
	var menu_item = {
		text: 'Shortcode',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				var shortcode = "";
				el.appendChild( blockade.build_shortcode_iframe( shortcode ) );
				el.innerHTML += '<!--' + blockade.classes.shortcode + '::' + shortcode + '-->'
				blockade.setData(el, blockade.datafields.type, 'shortcode');
				el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
				blockade.editor.fire(blockade.events.options, {target: el});
			}
		}
	};
	blockade.addToMenu( menu_item, 'Dynamic Blocks' );

	// register edit function
	blockade.contenttypes.shortcode = {
		name : "Shortcode",
		parse_block_data : function( data, block ) {
			//lets get the widget area name from the contents
			var text = block.innerHTML;
			var pattern = '<!--' + blockade.classes.shortcode + '::(.*)-->';
			var pattern = new RegExp(pattern, 'm');
			var matches = pattern.exec(text);
			data.type_specific.shortcode = "";
			if( matches && matches.length ) {
				data.type_specific.shortcode = matches[1];
			}
			return data;
		},
		render_html : function( data ) {
			var shortcode = data.type_specific.shortcode.replace(/"/g, '&quot;');
			var str = [
				'<p>',
					'<strong>NOTE:</strong> Blockade\'s live shortcode functionality ',
					'currently only supports closed-form shortcodes. Adding a shortcode ',
					'that wraps content will result in unexpected behavior.',
				'</p>',
				'<label><span>Shortcode: </span><input type="text" name="shortcode" class="mce-textbox" value="' + shortcode + '"/></label>'
			].join('');
			return str;
		},
		apply_form_results : function( data, form_data, block ) {
			var shortcode = form_data.shortcode.replace(/&quot;/g, '"');
			block.innerHTML ='';
			var el = blockade.build_shortcode_iframe( shortcode, form_data.classes );
			block.appendChild( el );
			block.innerHTML += '<!--' + blockade.classes.shortcode + '::' + shortcode + '-->'
		}
	};
});
