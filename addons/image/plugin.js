/*
	Plugin Name: Blockade Image Block
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.0
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
			data.type_specific.link = {
				href    : "",
				new_win : false
			};
			var img_elem = block.querySelector('img.imageblock');
			data.type_specific.image.url     = img_elem.getAttribute('src'   );
			data.type_specific.image.caption = img_elem.getAttribute('alt'   );
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
						data.id = match[1];
						break;
					}
				}
			}

			var link_elem = block.querySelector('a.blocklink');
			if( link_elem ) {
				data.type_specific.link.href = link_elem.getAttribute('href');
				var target = link_elem.getAttribute('target');
				if( target ) {
					data.type_specific.link.new_win = true;
				} else {
					data.type_specific.link.new_win = false;
				}
			}
			return data;
		},
		render_html : function( data ) {
			var image_str = JSON.stringify( data.type_specific.image );
			var checked = '';
			if( data.type_specific.link.new_win ) {
				checked = ' checked="checked"';
			}
			var str = [
				blockade.options_make_image_uploader_html("", 'main_image', image_str ),
				blockade.options_make_accordion_html("Link", [
					'<label>',
						'<span>Address: </span>',
						'<input type="text" name="href" class="mce-textbox" value="' + data.type_specific.link.href + '"/>',
					'</label>',
					'<label>',
						'<input type="checkbox" name="newwin" value="true"' + checked + '/>',
						' open link in new window?',
					'</label>',
				].join('')),
			].join('');
			return str;
		},
		apply_form_results : function( data, form_data, block ) {
			attachmentData = JSON.parse( form_data.main_image );
			if( attachmentData && attachmentData.url ) {
				var image = [
					'<img',
					' src="' + attachmentData.url + '"',
					' alt="' + attachmentData.caption + '"',
					' title="' + attachmentData.title + '"',
					' width="' + attachmentData.width + '"',
					' height="' + attachmentData.height + '"',
					' class="imageblock size-full wp-image-' + attachmentData.id + '"',
					'>'
				].join('');
				var content = image;
				if( form_data.href ) {
					content = '<a href="' + form_data.href + '" class="blocklink"';
					if( form_data.newwin ) {
						content += ' target="_blank"';
					}
					content += '>' + image + "</a>";
				}
				block.innerHTML = content;
			}
		}
	};
});
