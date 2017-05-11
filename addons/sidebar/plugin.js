/*
	Plugin Name: Blockade Sidebar
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('blockade_sidebar', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }
	// add menu item to main blockade menu
	var menu_item = {
		text: 'Widget Area',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				var shortcode = "[wp_blockade_sidebar slug=\"\"]";
				el.appendChild( blockade.build_shortcode_iframe( shortcode ) );
				el.innerHTML += '<!--' + blockade.classes.shortcode + '::' + shortcode + '-->';
				blockade.setData(el, blockade.datafields.type, 'sidebar');
				el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
				blockade.editor.fire(blockade.events.options, {target: el});
			}
		}
	};
	blockade.addToMenu( menu_item, 'Dynamic Blocks' );
	// register edit function
	blockade.contenttypes.sidebar = {
		name : "Widget Area",
		parse_block_data : function( data, block ) {
			//lets get the widget area name from the contents
			var text = block.innerHTML;
			var pattern = /slug="(.*)"\]-->/;
			var matches = pattern.exec(text);
			data.type_specific.widget_area = matches[1];
			return data;
		},
		render_html : function( data ) {
			var widget_area = data.type_specific.widget_area;
			var widget_areas = {};
			var xhr = new XMLHttpRequest();
			xhr.open( 'GET', ajaxurl + '?action=wp-blockade-sidebar-list', false );
			xhr.send( null );
			if ( xhr.status === 200 ) {
				widget_areas = JSON.parse( xhr.responseText );
			}
			var str = [
				blockade.options_make_select_box_html( 'Widget Area', 'widget_area', widget_areas, widget_area ),
			].join('');
			return str;
		},
		apply_form_results : function( data, form_data, block ) {
			var shortcode = "[wp_blockade_sidebar slug=\"" + form_data.widget_area + "\"]";
			block.innerHTML ='';
			var el = blockade.build_shortcode_iframe( shortcode, form_data.classes );
			block.appendChild( el );
			block.innerHTML += '<!--' + blockade.classes.shortcode + '::' + shortcode + '-->'
		}
	};
});
