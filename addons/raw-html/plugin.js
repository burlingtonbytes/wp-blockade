/*
	Plugin Name: Blockade Raw HTML
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('blockade_raw_html', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add menu item to main blockade menu
	var menu_item = {
		text: 'Raw HTML',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				el.innerHTML = "&nbsp;";
				blockade.setData(el, blockade.datafields.type, 'rawhtml');
				el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
				blockade.editor.fire(blockade.events.options, {target: el});
			}
		}
	};
	blockade.addToMenu( menu_item );

	// register edit function
	blockade.contenttypes.rawhtml = {
		Name: "Raw HTML",
		parse_block_data: function( data, block ) {
			if( blockade.isEmptyish(block) ) {
				block.innerHTML = "";
			}
			data.type_specific = commentifyBlocks( block );
			return data;
		},
		render_html: function( data ) {
			var str = [
				'<div class="blockade-options-rawhtml-wrapper">',
					'<small><em>you can use the following template tags:</em><br>',
					'<strong>&lt;!--[[ROLE: EDITAREA]]--&gt;</strong> - inserts a WYSIWYG editable area<br/>',
					'<strong>&lt;!--[[ROLE: CONTAINER]]--&gt;</strong> - inserts a blockade container</small>',
					'<textarea name="rawhtml">',
						blockade.escapeHtml( data.type_specific.html ),
					'</textarea>',
				'</div>'
			].join('');
			return str;
		},
		apply_form_results: function( data, form_data, block ) {
			// Insert code into element when the window form is submitted
			var rawHtml = blockade.unescapeHtml( form_data.rawhtml );
			var html    = uncommentifyBlocks( data.type_specific, rawHtml );
			if(!html) {
				html = "&nbsp;";
			}
			block.innerHTML = html;
		}
	};

	function commentifyBlocks( el ) {
		var rawHTML = el.innerHTML;
		var parser = document.createElement("DIV");
		parser.innerHTML = el.innerHTML;
		var children = parser.children;
		var editareas  = [];
		var containers = [];
		var processChildren = function(children) {
			var children_a = [];
			for(var i = 0; i < children.length; i++) {
				children_a.push(children[i]);
			}
			for(var i = 0; i < children_a.length; i++) {
				var child = children_a[i];
				var role  = child.getAttribute('data-'+blockade.datafields.role);
				if( role && ( role == blockade.roles.editarea || role == blockade.roles.container ) ) {
					var comment;
					if( role == blockade.roles.editarea ) {
						editareas.push(child.outerHTML);
						comment = document.createComment('[[ROLE: EDITAREA]]');
					} else if( role == blockade.roles.container ) {
						containers.push(child.outerHTML);
						comment = document.createComment('[[ROLE: CONTAINER]]');
					}
					child.parentNode.replaceChild(comment, child);
				} else {
					processChildren(child.children);
				}
			}
		}
		processChildren(children);

		return {
			'raw'        : rawHTML,
			'html'       : parser.innerHTML,
			'editareas'  : editareas,
			'containers' : containers
		};
	}
	function uncommentifyBlocks( existingBlocks, html ) {
		var rawHTML = existingBlocks.raw;
		var editareas = existingBlocks.editareas;
		var containers = existingBlocks.containers;
		var i = 0;
		var temp = html;
		temp = temp.replace(/<!--\s*\[\[ROLE:\s*EDITAREA\]\]\s*-->/gi, function( match ) {
			var retval;
			if(i < editareas.length) {
				retval = editareas[i];
			} else {
				el = self.document.createElement('div');
				blockade.setRole(el, blockade.roles.editarea);
				el.innerHTML = '&nbsp;';
				retval = el.outerHTML;
			}
			i++;
			return retval;
		});
		if(editareas.length > i) {
			var confirmed = confirm("You have removed edit areas from the template.  Any content in these areas will be lost.  Are you sure you want to continue?");
			if(!confirmed) {
				return rawHTML;
			}
		}
		i=0;
		temp = temp.replace(/<!--\s*\[\[ROLE:\s*CONTAINER\]\]\s*-->/gi, function( match ) {
			var retval;
			if(i < containers.length) {
				retval = containers[i];
			} else {
				el = self.document.createElement('div');
				blockade.setRole(el, blockade.roles.container);
				el.innerHTML = '';
				retval = el.outerHTML;
			}
			i++;
			return retval;
		});
		if(containers.length > i) {
			var confirmed = confirm("You have removed containers from the template.  Any content in these areas will be lost.  Are you sure you want to continue?");
			if(!confirmed) {
				return rawHTML;
			}
		}
		return temp;
	}
});
