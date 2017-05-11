/*
	Plugin Name: Blockade Image Block
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('image_block', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add custom css
	editor.contentCSS.push(url+'/editorstyles.css');

	// add menu item to main blockade menu
	var menu_item = {
		text: 'Image',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				el.innerHTML = '<img class="imageblock size-full wp-image-0" src="' + blockade.assets.no_image + '" alt="No Image Selected"/>';
				blockade.setData(el, blockade.datafields.type, 'image');
				var el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
				blockade.editor.fire(blockade.events.options, {target: el});
			}
		}
	};
	blockade.addToMenu( menu_item, 'Media Blocks' );

	// register edit function
	blockade.contenttypes.image = {
		name : "Image",
		parse_block_data : function( data, block ) {
			data.type_specific.image = {
				url     : blockade.assets.no_image,
				caption : 'Default Image',
				title   : '',
				width   : '',
				height  : '',
				id      : 0
			};
			var img_elem = block.querySelector('img.imageblock');
			data.type_specific.image.url     = img_elem.getAttribute('src'   );
			data.type_specific.image.alt     = img_elem.getAttribute('alt'   );
			data.type_specific.image.title   = img_elem.getAttribute('title' );
			data.type_specific.image.width   = img_elem.getAttribute('width' );
			data.type_specific.image.height  = img_elem.getAttribute('height');
			var classes  = img_elem.getAttribute('class' );
			if( classes ) {
				classes = classes.split(' ');
				var exp = /^wp-image-(\d+)$/;
				for( var i=0; i<classes.length; i++ ) {
					var match = classes[i].match(exp);
					if( match && match.length > 1 ) {
						data.type_specific.image.id = match[1];
						break;
					}
				}
			}
			return data;
		},
		render_html : function( data ) {
			var image_str = JSON.stringify( data.type_specific.image );
			var str = [
				blockade.options_make_image_uploader_html("", 'main_image', image_str )
			].join('');
			return str;
		},
		apply_form_results : function( data, form_data, block ) {
			attachmentData = JSON.parse( form_data.main_image );
			if( attachmentData && attachmentData.url ) {
				var image = attachmentData;
				var size = 'full';
				if(attachmentData.size) {
					size = attachmentData.size;
					if( attachmentData.sizes && attachmentData.sizes[size] ) {
						image = attachmentData.sizes[size];
					}
				}
				var alt = attachmentData.alt;
				if( !alt ) {
					alt = attachmentData.caption;
				}
				var image = [
					'<img',
					' src="' + image.url + '"',
					' alt="' + attachmentData.alt + '"',
					' title="' + attachmentData.title + '"',
					' width="' + image.width + '"',
					' height="' + image.height + '"',
					' class="imageblock size-' + size + ' wp-image-' + attachmentData.id + '"',
					'>'
				].join('');
				block.innerHTML = image;
			}
		}
	};
});
