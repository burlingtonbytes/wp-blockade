/*!
 *	Plugin Name: WP Blockade
 *	Plugin URI: http://www.burlingtonbytes.com
 *	Author: Burlington Bytes
 *	Author URI: http://www.burlingtonbytes.com
 *	Description: Blockade is the core plugin to the WPBlockade TinyMCE management suite.  It provides a simple visual pagebuilder within the TinyMCE Editor
 *	Editor Buttons: hideblockades,blockades
 *	Version: 0.9.5
*/
tinymce.PluginManager.add('blockade', function(editor, url) {
	// SECTION ---------------------------------------------------------- INITIALIZE
	// kill if older than IE8
	if (!window.NodeList) {
		alert("This Browser is incompatible with Blockade.  Please update or switch to a modern browser to continue.");
		return;
	}
	// this is the wp.media object for image uploading
	var media_frame = null;

	// add custom CSS to editor
	var protocol = (window.location.protocol == "https:")?'https:':'http:';
	editor.contentCSS.push(protocol + '//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css');
	editor.contentCSS.push(url+'/editorstyles.css');
	if(typeof editor.settings.wp_blockade_framework_css !== 'undefined' && editor.settings.wp_blockade_framework_css) {
		editor.contentCSS.push(editor.settings.wp_blockade_framework_css);
	}
	editor.contentCSS.push(url+'../../../assets/css/wp-blockade-defaults.css');

	// register public variables and functions
	var self = this;
	self.editor     = editor;
	self.document   = false;
	self.body       = false;
	self.wrapInUndo = function(callback) {
		// placeholder for the undo transaction function, until it is initialized
		callback();
	};
	self.idbase     = 'wp-blockade';
	self.classes    = {
		blockade    : self.idbase,
		html        : self.idbase + '-html',
		body        : self.idbase + '-body',
		showblocks  : self.idbase + '-showblocks',
		wrapper     : self.idbase + '-wrapper',
		editwrapper : self.idbase + '-editareawrapper',
		controlbox  : self.idbase + '-controls',
		comment     : self.idbase + "-comment",
		shortcode   : self.idbase + "-shortcode",
		rolebase    : self.idbase + '-role'
	};
	self.classes.usertypes = {
		admin          : self.classes.rolebase + '-admin',
		editor         : self.classes.rolebase + '-editor'
	};
	// controls
	self.classes.controls = {
		name          : self.classes.controlbox + '-name',
		options       : self.classes.controlbox + '-options',
		lockcontent   : self.classes.controlbox + '-lockcontent',
		lockposition  : self.classes.controlbox + '-lockposition',
		lockstructure : self.classes.controlbox + '-lockstructure',
		clone         : self.classes.controlbox + '-clone',
		deleteblock   : self.classes.controlbox + '-delete'
	};
	self.internalClasses = [
		self.classes.blockade,
		self.classes.comment
	];
	self.datafields = {
		role    : self.idbase + '-role',
		type    : self.idbase + '-type',
		flags   : self.idbase + '-flags',
		replace : self.idbase + '-replace'
	};
	// blocks
	self.roles = {
		editarea  : "editarea",
		container : "container",
	};
	// flags
	self.flags = {
		lockcontent   : 'lockcontent',
		lockposition  : 'lockposition',
		lockstructure : 'lockstructure',
	};
	// assets
	self.assets = {
		no_image : url + '/no-image-selected.png',
	}
	// block types
	self.contenttypes = {
		def : {
			name : "",
		},
		content : {
			name : "Content"
		},
		container : {
			name : "Container"
		},
		comment : {
			name: "Comment",
			parse_block_data : function( data, block ) {
				data.type_specific.content = block.textContent;
				return data;
			},
			render_options : function( data ) {
				return {
					'Comment': [
						'<label>',
							'<span>Comment Text: </span>',
							'<input type="text" name="comment" class="mce-textbox" value="' + data.type_specific.content + '"/>',
						'</label>',
					].join(''),
					'Spacing': null,
					'Background': null,
					'Custom': null
				};
			},
			apply_form_results : function( data, form_data, el ) {
				el.textContent = form_data.comment;
			}
		},
		spacer : {
			name: "Spacer",
			parse_block_data : function( data, block ) {
				var temp = [];
				data.type_specific.height = '';
				for( var i = 0; i < data.unknown.styles.length; i++ ) {
					var style_parts = data.unknown.styles[i].split(/:\s*(.+)\s*$/); // lets break the style into an array of [name, value]
					if( style_parts && style_parts.length > 1 && style_parts[0] == 'height' ) {
						data.type_specific.height = style_parts[1];
					} else {
						temp.push(data.unknown.styles[i]);
					}
				}
				data.unknown.styles = temp;

				return data;
			},
			render_html : function( data ) {
				return [
					'<label>',
						'<span>Height: </span>',
						'<input type="text" name="height" class="mce-textbox" value="' + data.type_specific.height + '"/>',
					'</label>',
				].join('');
			},
			apply_form_results : function( data, form_data, el ) {
				if(form_data.height) {
					if( !isNaN( form_data.height ) && form_data.height != '0' ) {
						form_data.height += 'px';
					}
					var styles = el.getAttribute('style');
					if(styles) {
						styles += ' ';
					}
					styles += 'height:' + form_data.height + ';';
					el.setAttribute('style', styles);
					el.setAttribute('data-mce-style', styles);
				}
			}
		},
	};
	var eventPrefix = self.idbase + '-event';
	self.events = {
		options : eventPrefix + 'options'
	};
	// Drag & Drop Helpers
	self.dnd = {
		placeholderclass : self.idbase + '-dnd-placeholder',
		movingclass      : self.idbase + '-dnd-inprogress',
		pxthreshold      : 15,
		clickednode      : null,
		movingnode       : null,
		initialposition  : [0,0],
		moved            : false
	}
	self.lastFocusedBlock = null;
	self.menu = [
		{
			text: 'Editable Content',
			onclick: function() {
				if(isPlaceable(self.body)) {
					placeBlock(createBlock("&nbsp;"));
					removeActiveEditor();
				}
			}
		},
		{
			text: 'Comment',
			onclick: function() {
				if(isPlaceable(self.body)) {
					var el = self.document.createElement('div');
					setData(el, self.datafields.type, 'comment');
					addClass(el, self.classes.comment);
					var block = convertToBlock( el );
					placeBlock(block);
					removeActiveEditor();
					self.editor.fire(self.events.options, {target: block});
				}
			}
		},
		{
			text: 'Structural Blocks',
			menu: [
				{
					text: 'Container',
					onclick: function() {
						if(isPlaceable(self.body)) {
							placeBlock(createBlockGroup());
							removeActiveEditor();
						}
					}
				},
				{
					text: 'Spacer',
					onclick: function() {
						if(isPlaceable(self.body)) {
							var el = self.document.createElement('div');
							setData(el, self.datafields.type, 'spacer');
							var block = convertToBlock(el);
							placeBlock(block);
							removeActiveEditor();
							self.editor.fire(self.events.options, {target: block});
						}
					}
				}
			]
		},
	];
	// public functions
	self.isPlaceable        = function(el       ) { return isPlaceable(el);       };
	self.isEmptyish         = function(el       ) { return isEmptyish(el);        };
	self.findInArray        = function(i, a     ) { return findInArray(i,a);      };
	self.removeActiveEditor = function(         ) { return removeActiveEditor()   };
	self.createBlock        = function(html     ) { return createBlock(html);     };
	self.convertToBlock     = function(el       ) { return convertToBlock(el);    };
	self.placeBlock         = function(el       ) { return placeBlock(el);        };
	self.hasClass           = function(el, a    ) { return hasClass(el, a);       };
	self.addClass           = function(el, a    ) { return addClass(el, a);       };
	self.removeClass        = function(el, a    ) { return removeClass(el, a);    };
	self.toggleClass        = function(el, a    ) { return toggleClass(el, a);    };
	self.getData            = function(el, a    ) { return setData(el, a   );     };
	self.setData            = function(el, a, b ) { return setData(el, a, b);     };
	self.getType            = function(el       ) { return getType(el       );    };
	self.setType            = function(el, a    ) { return setType(el, a    );    };
	self.getRole            = function(el       ) { return getRole(el       );    };
	self.setRole            = function(el, a    ) { return setRole(el, a    );    };
	self.getClassesByType   = function(el       ) { return getClassesByType(el);  };
	self.addToMenu          = function(a, b     ) { return addToMenu( a, b  );    };
	self.options_make_accordion_html      = function( title, content             ) { return options_make_accordion_html( title, content                ); };
	self.options_make_square_html         = function( name, slug, data           ) { return options_make_square_html( name, slug, data                 ); };
	self.options_make_image_uploader_html = function( name, slug, datastr, del   ) { return options_make_image_uploader_html( name, slug, datastr, del ); };
	self.options_make_color_picker_html   = function( name, slug, value          ) { return options_make_color_picker_html( name, slug, value          ); };
	self.options_make_select_box_html     = function( name, slug, options, value ) { return options_make_select_box_html( name, slug, options, value   ); };
	self.escapeHtml    = function( html ) { return escapeHtml( html   ); };
	self.unescapeHtml  = function( html ) { return unescapeHtml( html ); };
	self.build_shortcode_iframe = function( a, b ) { return build_shortcode_iframe( a, b ); };
	window.wp_blockade_resize_iframe = function( el   ) { return resize_iframe( el  ); }

	// SECTION ------------------------------------------------------------- INITIALIZE EDITOR
	editor.on('init', function() {
		self.editor     = tinymce.activeEditor;
		self.document   = editor.getDoc();
		self.body       = editor.getBody();
		// self.wrapInUndo = self.editor.undoManager.transact;
		// !! START NASTY HACK  <-- addresses the fact that undoManager is sometimes uninitialized when this runs... no idea why yet, might be YOAST related (or other plugins)?
		var waitForUndo = setInterval( function(){
			if( self.editor.undoManager && self.editor.undoManager.transact ) {
				self.wrapInUndo = self.editor.undoManager.transact;
				clearInterval(waitForUndo);
			}
		}, 100 );
		// !! END NASTY HACK
		removeActiveEditor();
		if(self.body.innerHTML === '<p><br data-mce-bogus="1"></p>' || self.body.innerHTML === '<p><br _moz_editor_bogus_node="TRUE"></p>' || self.body.innerHTML === "&nbsp;") {
			self.body.innerHTML = "";
		}
		addClass(self.document.documentElement, self.classes.html);
		addClass(self.body, self.classes.body);
		addClass(self.body, self.classes.blockade);
		addClass(self.body, self.classes.showblocks);
		// handler to add an editable block to empty containers on click
		self.body.addEventListener('click', function(e) {
			// if we are looking at an empty and unlocked container (or the body itself is empty and unlocked)
			if( isPlaceable(e.target) && e.target.innerHTML == "" ) {
				self.lastFocusedBlock = e.target;
				var el = placeBlock(createBlock("&nbsp;"));
				var editareas = selectChildrenByRole( el, self.roles.editarea );
				if( editareas && editareas.length > 0 ) {
					setActiveEditor( editareas[0] );
				}
			}
		});

		add_options_panel_events_and_styles();
		// remove some unwanted keyboard shortcuts
		self.editor.shortcuts.remove( 'access+t' ); // no read more link
		self.editor.shortcuts.remove( 'access+z' ); // no toggling toolbars
	});
	tinymce.activeEditor.on('focus', function(e) {
		self.editor     = tinymce.activeEditor;
		self.body       = self.editor.getBody();
		self.document   = self.editor.getDoc();
		self.wrapInUndo = self.editor.undoManager.transact;
	});

	// SECTION ---------------------------------------------------------------- BUTTONS
	editor.addButton('hideblocks', {
		text : 'Show/Hide Blocks',
		title: 'Show/Hide Blocks',
		icon : false,
		onclick: function(e) {
			this.active(!this.active());
			var state = this.active();
			if (state) {
				removeActiveEditor();
				removeClass(self.body, self.classes.showblocks);
			} else {
				addClass(self.body, self.classes.showblocks);
			}
			self.editor.nodeChanged();
		}
	});
	// add a new block
	editor.addButton('blockade', {
		text : 'Blockade',
		title: 'Blockade',
		icon : false,
		type : 'menubutton',
		menu : self.menu
	});

	// SECTION ------------------------------------------------------------ CLICK
	// trigger click actions (down)
	editor.on('mousedown', function(e) {
		var target = e.target;
		// who cares about rightclick!
		if (e.which === 3 || e.button === 2) {
			return;
		}

		// clicked a delete button
		if( editor.dom.hasClass(target, self.classes.controls.deleteblock) ) {
			var wrappers = editor.dom.getParents(target, '.'+self.classes.wrapper);
			if(wrappers[0] && canDelete(wrappers[0])) {
				var wrapper = wrappers[0];
				var confirmMessage = "Are you certain you want to delete this Block? (all contents will be lost)";
				editor.windowManager.confirm(confirmMessage, function(s) {
					if(s) {
						self.lastFocusedBlock = wrapper.previousSibling;
						self.wrapInUndo(function() {
							editor.dom.remove(wrapper);
						});
						self.editor.nodeChanged();
					}
				});
			}
			return killEvent(e);
		}

		// clicked a clone button
		if( editor.dom.hasClass(target, self.classes.controls.clone) ) {
			var wrappers = editor.dom.getParents(target, '.'+self.classes.wrapper);
			if(wrappers[0] && canClone(wrappers[0])) {
				self.wrapInUndo(function() {
					removeActiveEditor();
					var parent = wrappers[0];
					var clone  = deepClone(parent);
					editor.dom.insertAfter(clone, parent);
					self.editor.nodeChanged();
					self.lastFocusedBlock = clone;
				});
			}
			return killEvent(e);
		}

		// clicked a lockcontent button
		if( editor.dom.hasClass(target, self.classes.controls.lockcontent) ) {
			toggleFlag(target, self.flags.lockcontent)
			return killEvent(e);
		}
		// clicked a lockposition button
		if( editor.dom.hasClass(target, self.classes.controls.lockposition) ) {
			toggleFlag(target, self.flags.lockposition)
			return killEvent(e);
		}
		// clicked a lockstructure button
		if( editor.dom.hasClass(target, self.classes.controls.lockstructure) ) {
			toggleFlag(target, self.flags.lockstructure)
			return killEvent(e);
		}

		// clicked an edit button
		if( editor.dom.hasClass(target, self.classes.controls.options) ) {
			var blockParents = editor.dom.getParents(target, '.'+self.classes.wrapper);
			if(blockParents[0] && isEditable(blockParents[0])) {
				editor.fire(self.events.options, {target: blockParents[0]});
			}
			return killEvent(e);
		}

		// drag/drop handler
		var draggable = getDraggableWrapper(target);
		if(draggable) {
			removeActiveEditor();
			self.dnd.clickednode     = draggable;
			self.dnd.initialposition = [e.clientX, e.clientY];
			self.lastFocusedBlock = draggable;
			return killEvent(e);
		}

		//anything not an editor
		var editorParent = getParentByRole(target, self.roles.editarea, self.body);
		if(!(hasRole(target, self.roles.editarea) && isEditable(target)) &&
		   !(editorParent !== self.body && isEditable(editorParent))) {
			removeActiveEditor();
			return;
		}
	});
	editor.on('mousemove', function(e) {
		var point = [e.clientX, e.clientY];
		if(self.dnd.clickednode && !self.dnd.movingnode) {
			if(distanceBetween(point, self.dnd.initialposition) > self.dnd.pxthreshold) {
				self.editor.undoManager.add();
				self.dnd.movingnode = cloneAndReplaceWithPlaceholder(self.dnd.clickednode);
				self.dnd.moved      = true;
				addClass(self.document.documentElement, self.dnd.movingclass);
			}
		}
		if(self.dnd.movingnode) { /*move placeholder around the dom*/
			var hovered = self.document.elementFromPoint(point[0], point[1]);
			if(!hasClass(hovered, self.dnd.placeholderclass)) {
				var dropTarget = false;
				if(hasRole(hovered, self.roles.container) && isPlaceable(hovered)) {
					dropTarget = hovered;
				} else {
					var containerParents = getParentsByRole(hovered, self.roles.container, self.body);
					for(var i=0;i<containerParents.length;i++) {
						if(isPlaceable(containerParents[i])) {
							dropTarget = containerParents[i];
							break;
						}
					}
				}
				if(!dropTarget && isPlaceable(self.body)) {
					dropTarget = self.body;
				}
				if(dropTarget) {
					var dropBefore = getChildToInsertBefore(dropTarget, e.clientY);
					var placeholders = selectChildrenByClass(self.document, self.dnd.placeholderclass);
					if(placeholders) {
						var placeholder = placeholders[0];
						if(dropBefore) {
							dropTarget.insertBefore(placeholder, dropBefore);
						} else {
							dropTarget.appendChild(placeholder);
						}
					}
				}
			}
		}
	});
	editor.on('mouseup'  , function(e) {
		// who cares about rightclick!
		if (e.which === 3 || e.button === 2) {
			return;
		}
		self.dnd.clickednode = null;
		if(self.dnd.movingnode) {
			var el = replacePlaceholderWithElement(self.dnd.movingnode);
			self.dnd.moved       = false;
			self.dnd.movingnode  = null;
			removeClass(self.document.documentElement, self.dnd.movingclass);
			self.wrapInUndo(function(){});
			self.lastFocusedBlock = el;
			self.editor.nodeChanged();
			return killEvent(e);
		}
		// clicked an editor
		var target = e.target;
		if(hasRole(target, self.roles.editarea) && isEditable(target)) {
			setActiveEditor(target);
			return;
		}
		var editorParent = getParentByRole(target, self.roles.editarea, self.body);
		if(editorParent && editorParent !== self.body && isEditable(editorParent)) {
			setActiveEditor(editorParent);
			return;
		}
	});

	editor.on(self.events.options, function(e) {
		var el = e.target;
		if(isEditable(el)) {
			var block = el.firstChild;
			var type  = getData(block, self.datafields.type);
			if(!type || !self.contenttypes[type]) {
				type = 'def';
			}
			self.wrapInUndo(function() {
				open_edit_window( block, type );
			});
		}
		self.lastFocusedBlock = el;
		self.editor.nodeChanged();
	});

	function open_edit_window( block, type ) {
		var data = {
			unknown        : {},
			internal       : {},
			type_specific  : {},
			background     : {},
			margin_padding : {}
		};
		var type_options = self.contenttypes[type];
		data = parse_option_data( data, block, type_options );
		var options_tabs = {};
		if( type_options.render_options ) {
			options_tabs = type_options.render_options( data );
		} else if( type_options.render_html ) {
			options_tabs = {};
			options_tabs[ type_options.name ] = type_options.render_html( data );
		}
		var def_tabs = render_default_option_tabs( data );
		for( var key in def_tabs ) {
			if( typeof options_tabs[key] === 'undefined' ) {
				options_tabs[key] = def_tabs[key];
			}
		}
		var tabs = [];
		var tab_contents = [];
		var i = 1;
		for( var key in options_tabs ) {
			if( options_tabs[key] ) {
				var active = '';
				if( i == 1 ) {
					active = ' active';
				}
				tabs.push([
					'<li class="blockade-options-tab' + active + '" data-blockade-options-tab-index="' + i + '">',
						key,
					'</li>',
				].join(''));
				tab_contents.push([
					'<li class="blockade-options-tab blockade-options-tab-' + i + active + '">',
						options_tabs[key],
					'</li>',
				].join(''));
				i++;
			}
		}
		var options_html = [
			'<div class="blockade-options">',
				'<ul class="blockade-options-tab-headers">',
					tabs.join(''),
				'</ul>',
				'<ul class="blockade-options-tab-contents">',
					tab_contents.join(''),
				'</ul>',
			'</div>'
		].join('');

		var panel_title = ["Edit"];
		if( type_options.name ) {
			panel_title.push( type_options.name );
		}
		panel_title.push( "Block" );
		panel_title = panel_title.join(' ');

		editor.windowManager.open({
			title: panel_title,
			width : 520,
			height : 420,
			body: [
				{
					type : 'container',
					height: 500,
					html : options_html
				}
			],
			onsubmit: function(e) {
				var form_data = get_option_form_data(e);
				self.wrapInUndo(function() {
					apply_default_options_form_results( data, form_data, block );
					if( type_options.apply_form_results ) {
						 type_options.apply_form_results( data, form_data, block );
					}
				});
			}
		});
	}
	function parse_option_data( data, block, type_options ) {
		var temp = block.getAttribute('class');
		data.unknown.classes = (temp) ? temp.split(/\s+/) : [];
		temp = block.getAttribute('style');
		data.unknown.styles  = (temp ) ? temp.split(/\s*;\s*/) : [];
		temp = [];
		data.internal.classes = [];
		data.internal.styles = [];
		for( var i = 0; i < data.unknown.classes.length; i++ ) {
			if( findInArray( data.unknown.classes[i], self.internalClasses ) != -1 ) {
				data.internal.classes.push(data.unknown.classes[i]);
			} else {
				temp.push(data.unknown.classes[i]);
			}
		}
		data.unknown.classes = temp;
		temp = [];
		data.margin_padding.margin  = { top: '', right: '', bottom: '', left: '' };
		data.margin_padding.padding = { top: '', right: '', bottom: '', left: '' };
		data.background = { image: '', color: '', style: '' };
		for( var i = 0; i < data.unknown.styles.length; i++ ) {
			var style_parts = data.unknown.styles[i].split(/:\s*(.+)\s*$/); // lets break the style into an array of [name, value]
			if( style_parts.length > 1 ) {
				switch(style_parts[0]) {
					case 'margin' :
						data.margin_padding.margin = parse_option_trbl_style_string( style_parts[1] );
						break;
					case 'padding' :
						data.margin_padding.padding = parse_option_trbl_style_string( style_parts[1] );
						break;
					case 'background-image' :
						var image_url_regex = /url\('(.*)'\)$/;
						var results = image_url_regex.exec( style_parts[1] );
						if( results && results.length > 1 ) {
							data.background.image = results[1];
						}
						break;
					case 'background-color' :
						data.background.color = style_parts[1];
						break;
					case 'background-size' :
						if( style_parts[1] == 'contain' || style_parts[1] == 'cover' ) {
							data.background.style = style_parts[1];
						}
						break;
					case 'background-repeat' :
						if( !data.background.style && style_parts[1] == 'no-repeat' || style_parts[1] == 'repeat' ) {
							data.background.style = style_parts[1];
						} else {
							temp.push( data.unknown.styles[i] );
						}
						break;
					case 'background-position' :
					default :
						temp.push( data.unknown.styles[i] );
				}
			}
		}
		data.unknown.styles = temp;
		data.link = [];
		data.link.href = block.getAttribute('data-' + self.idbase + '-href');
		var target = block.getAttribute('data-' + self.idbase + '-target');
		data.link.new_win = false;
		if(target == '_blank') {
			data.link.new_win = true;
		}
		if( type_options.parse_block_data ) {
			data = type_options.parse_block_data( data, block );
		}
		return data;
	}
	function parse_option_trbl_style_string( str ) {
		var trbl_array = str.split(' ');
		var trbl = { top: '', right: '', bottom: '', left: '' };
		if( trbl_array.length == 4 ) {
			trbl = {
				top    : trbl_array[0],
				right  : trbl_array[1],
				bottom : trbl_array[2],
				left   : trbl_array[3]
			};
		} else if( trbl_array.length == 3 ) {
			trbl = {
				top    : trbl_array[0],
				right  : trbl_array[1],
				bottom : trbl_array[2],
				left   : trbl_array[1]
			};
		} else if( trbl_array.length == 2 ) {
			trbl = {
				top    : trbl_array[0],
				right  : trbl_array[1],
				bottom : trbl_array[0],
				left   : trbl_array[1]
			};
		} else if( trbl_array.length == 1 ) {
			trbl = {
				top    : trbl_array[0],
				right  : trbl_array[0],
				bottom : trbl_array[0],
				left   : trbl_array[0]
			};
		}
		return trbl;
	}
	function convert_data_to_trbl( data ) {
		if( !data.top && !data.right && !data.bottom && !data.left ) {
			return false;
		}
		if( !data.top    ){ data.top    = '0' }
		if( !data.right  ){ data.right  = '0' }
		if( !data.bottom ){ data.bottom = '0' }
		if( !data.left   ){ data.left   = '0' }
		if( !isNaN(data.top   ) && data.top    != 0 ) { data.top    += 'px'; }
		if( !isNaN(data.right ) && data.right  != 0 ) { data.right  += 'px'; }
		if( !isNaN(data.bottom) && data.bottom != 0 ) { data.bottom += 'px'; }
		if( !isNaN(data.left  ) && data.left   != 0 ) { data.left   += 'px'; }
		return data.top + ' ' + data.right + ' ' + data.bottom + ' ' + data.left;
	}
	function render_default_option_tabs( data ) {
		var styles = data.unknown.styles.join(';');
		if( styles ) {
			styles += ';';
		}
		var checked = '';
		if( data.link.new_win ) {
			checked = ' checked="checked"';
		}
		var href = '';
		if(data.link.href) {
			href = data.link.href;
		}
		var tabs = {
			'Spacing' : [
				'<div class="blockade-options-one-half">',
					options_make_square_html( 'Margin', 'margin', data.margin_padding.margin ),
				'</div>',
				'<div class="blockade-options-one-half">',
					options_make_square_html( 'Padding', 'padding', data.margin_padding.padding ),
				'</div>',
			].join(""),
			'Background' : [
				'<div class="blockade-options-one-half">',
					options_make_image_uploader_html( 'Background Image', 'bg_image', JSON.stringify( { url: data.background.image } ), true ),
				'</div>',
				'<div class="blockade-options-one-half">',
					'<h3>Background Options</h3>',
					options_make_color_picker_html( 'Color', 'bg_color', data.background.color ),
					options_make_select_box_html( 'Style', 'bg_style', {
						'default'  : 'Default',
						'cover'    : 'Cover',
						'contain'  : 'Contain',
						'norepeat' : 'No Repeat',
						'repeat'   : 'Repeat'
					}, data.background.style ),
				'</div>',
			].join(""),
			"Link" : [
				'<label>',
					'<span>URL: </span>',
					'<input type="text" name="link_href" class="mce-textbox" value="' + href + '"/>',
				'</label>',
				'<label>',
					'<input type="checkbox" name="link_newwin" value="1"' + checked + '>',
					' open in new window?',
				'</label>'
			].join(''),
			"Custom" : [
				'<label><span>Custom Classes: </span><input type="text" name="classes" class="mce-textbox" value="' + data.unknown.classes.join(' ') + '"/></label>',
				'<label><span>Custom Styles: </span><input type="text" name="styles" class="mce-textbox" value="' + styles + '"/></label>',
			].join(''),
		};
		return tabs;
	}
	function get_option_form_data( e ) {
		var $form = e.target.$el;
		var customdata = {};
		var $inputs = $form.find('.mce-container input,.mce-container select,.mce-container textarea').each(function() {
			var name = this.getAttribute('name');
			var type = this.getAttribute('type');
			var value = '';
			if( type && ( type == "checkbox" || type == "radio" ) ) {
				if( this.checked ) {
					value = this.value
				}
			} else {
				value = this.value;
			}
			if( name && !customdata[name] ) {
				customdata[name] = value;
			}
		});
		return customdata;
	}
	function apply_default_options_form_results( data, form_data, el ) {
		var customclasses = '',
			customstyles = '';
		if( typeof form_data.classes !== 'undefined' ) {
			var customclasses = form_data.classes.trim();
		}
		if( typeof form_data.styles !== 'undefined' ) {
			var customstyles  = form_data.styles.trim();
		}
		var classes = data.internal.classes.join(' ');
		if(classes && customclasses) {
			classes +=' ';
		}
		classes += customclasses;
		var styles = data.internal.styles.join(';');
		if(styles) {
			styles += ';';
		}
		if(customstyles) {
			styles += customstyles;
			if( customstyles.charAt(customstyles.length - 1) != ';' ) {
				styles += ';';
			}
		}

		// apply margins & padding
		var margin_padding_str = "";
		if( typeof form_data['margin-top'   ] !== 'undefined' ) {
			var margin = convert_data_to_trbl( {
				top    : form_data['margin-top'   ],
				right  : form_data['margin-right' ],
				bottom : form_data['margin-bottom'],
				left   : form_data['margin-left'  ],
			} );
			if( margin ) {
				margin_padding_str += 'margin:' + margin + ';';
			}
		}
		if( typeof form_data['padding-top'   ] !== 'undefined' ) {
			var padding = convert_data_to_trbl( {
				top    : form_data['padding-top'   ],
				right  : form_data['padding-right' ],
				bottom : form_data['padding-bottom'],
				left   : form_data['padding-left'  ],
			} );
			if( padding ) {
				margin_padding_str += 'padding:' + padding + ';';
			}
		}
		styles = margin_padding_str + styles;
		// apply background
		var bg_str = "";
		if( form_data['bg_color'] ) {
			bg_str += "background-color:" + form_data['bg_color'] + ";";
		}
		if( form_data['bg_image'] ) {
			var image_data = JSON.parse(form_data['bg_image']);
			if( image_data && image_data.url && image_data.url != self.assets.no_image ) {
				var image_url = image_data.url;
				if( image_data.size && image_data.sizes[image_data.size] && image_data.sizes[image_data.size].url ) {
					image_url = image_data.sizes[image_data.size].url;
				}
				bg_str += "background-image:url('" + image_url + "');";
			}
		}
		if( form_data['bg_style'] && form_data['bg_style'] != 'default' ) {
			switch( form_data['bg_style'] ) {
				case 'cover' :
					bg_str += "background-size:cover;";
					break;
				case 'contain' :
					bg_str += "background-size:contain;";
					break;
				case 'norepeat' :
					bg_str += "background-repeat:no-repeat;";
					break;
				case 'repeat' :
					bg_str += "background-repeat:repeat;";
					break;
			}
		}
		styles = bg_str + styles;
		if( form_data['link_href'] ) {
			el.setAttribute('data-' + self.idbase + '-href', form_data['link_href']);
		} else {
			el.removeAttribute('data-' + self.idbase + '-href');
		}
		if( form_data['link_newwin'] ) {
			el.setAttribute('data-' + self.idbase + '-target', '_blank');
		} else {
			el.removeAttribute('data-' + self.idbase + '-target');
		}
		el.setAttribute('class', classes);
		el.setAttribute('style', styles);
		el.setAttribute('data-mce-style', styles);
	}

	// SECTION ---------------------------------------------------------------------
	function addToMenu( item, submenu ) {
		if( typeof submenu == "undefined" ) {
			submenu = false;
		}
		if( submenu ) {
			var added = false;
			for( var i = 0; i < self.menu.length; i++ ) {
				if( self.menu[i].text == submenu ) {
					self.menu[i].menu.push( item );
					added = true;
					break;
				}
			}
			if( !added ) {
				self.menu.push( {
					text: submenu,
					menu: [ item ]
				} );
			}
		} else {
			self.menu.push( item );
		}
	}
	function add_options_panel_events_and_styles() {
		// make sure these only get registered once
		if( window.wp_blockade_options_panel_events_registered ) {
			return;
		}
		window.wp_blockade_options_panel_events_registered = true;
		// add option page stylesheet
		var styleEl = editor.dom.create('link');
		styleEl.setAttribute( 'rel' , 'stylesheet' );
		styleEl.setAttribute( 'type', 'text/css' );
		styleEl.setAttribute( 'href', url + '/tinymcestyles.css' );
		document.getElementsByTagName('head')[0].appendChild(styleEl);

		// add click handlers
		var media_frame = null;
		document.body.addEventListener('click', function(e){
			if( e.target ) {
				if( hasClass( e.target, "blockade-options-tab" ) && !hasClass( e.target, "active" ) ) {
					e.preventDefault();
					e.stopPropagation();
					var parent = e.target.parentElement;
					if( hasClass( parent, 'blockade-options-tab-headers' ) ) {
						var el = e.target;
						var index = el.getAttribute('data-blockade-options-tab-index');
						var tabs = parent.parentElement.querySelectorAll('.blockade-options-tab');
						if( tabs ) {
							for( var i = 0; i < tabs.length; i++ ) {
								removeClass( tabs[i], "active" );
							}
						}
						var contentel = parent.nextSibling.querySelector( '.blockade-options-tab-' + index );
						if( contentel ) {
							addClass( el, 'active' );
							addClass( contentel, 'active' );
						}
					}
				} else if ( hasClass( e.target, "blockade-options-accordion-header" ) ) {
					e.stopPropagation();
					e.preventDefault();
					var parent = e.target.parentElement;
					if( !( hasClass( parent, "blockade-options-accordion-open" ) ) ) {
						var accordions = document.body.querySelectorAll('.blockade-options-accordion');
						if( accordions ) {
							for( var i = 0; i < accordions.length; i++ ) {
								removeClass( accordions[i], "blockade-options-accordion-open" );
							}
						}
						addClass( parent, "blockade-options-accordion-open" );
					} else {
						removeClass( parent, "blockade-options-accordion-open" );
					}
				} else if( e.target.tagName == "BUTTON" && e.target.getAttribute('data-button-role') == "media_library" ) {
					e.stopPropagation();
					e.preventDefault();
					if( !media_frame ) {
						var insertImage = wp.media.controller.Library.extend({
							defaults :  _.defaults({
								id:        'insert-image',
								title:      'Select or Upload an Image',
								allowLocalEdits: true,
								displaySettings: true,
								displayUserSettings: true,
								multiple : false,
								type : 'image'//audio, video, application/pdf, ... etc
							}, wp.media.controller.Library.prototype.defaults )
						});
						media_frame = wp.media({
							button: {
								text: 'Insert Image'
							},
							state : 'insert-image',
							states : [
								new insertImage()
							]
						});
					}
					media_frame.once( 'open', function() {
						var selection    = media_frame.state().get('selection');
						var parent       = e.target.parentElement;
						var imagefield   = parent.querySelector('.blockade-options-image-data');
						var imageData    = JSON.parse(imagefield.value);
						if( imageData && imageData.id ) {
							attachment = wp.media.attachment(imageData.id);
							attachment.fetch();
							selection.add( attachment ? [ attachment ] : [] );
						}
					});
					media_frame.once( 'close', function() {
						var state = media_frame.state('insert-image');
						var parent       = e.target.parentElement;
						var previewwrap  = parent.querySelector('.blockade-options-image-preview');
						var imagefield   = parent.querySelector('.blockade-options-image-data');
						var del          = parent.querySelector('.blockade-options-image-remove');
						var attachment   = media_frame.state().get('selection').first();
						var selection    = attachment.toJSON();
						var display      = state.display( attachment ).toJSON();
						var value = _.defaults( selection, display );
						imagefield.value = JSON.stringify( value );
						previewwrap.innerHTML = '<img src="' + selection.url + '" alt="' + selection.caption + '" title="' + selection.title + '">';
						if( del ) {
							addClass( del, 'blockade-options-image-remove-visible' );
						}
					});
					media_frame.open();
				} else if( e.target.tagName == "SPAN" &&  hasClass( e.target, 'blockade-options-image-remove' ) ) {
					e.stopPropagation();
					e.preventDefault();
					var parent       = e.target.parentElement;
					var previewwrap  = parent.querySelector('.blockade-options-image-preview');
					var imagefield   = parent.querySelector('.blockade-options-image-data');
					imagefield.value = JSON.stringify( { url: '' } );
					previewwrap.innerHTML = '<img src="' + self.assets.no_image + '" alt="Default Image" title="">';
					removeClass( e.target, 'blockade-options-image-remove-visible' );
				} else if(
					( e.target.tagName == "SPAN" &&  hasClass( e.target, 'blockade-options-color-picker-preview' ) ) ||
					( e.target.tagName == "INPUT" &&  hasClass( e.target.parentElement, 'blockade-options-color-picker-input-container' ) )
			 	) {
					var parent = e.target.parentElement;
					toggleClass( parent, 'blockade-options-color-picker-open' );
				} else if( e.target.tagName == "DIV" &&  hasClass( e.target, 'blockade-options-color-picker-cell' ) ) {
					var color = e.target.getAttribute('data-mce-color');
					var wrapper = null;
					for ( var elem = e.target; elem && elem !== document; elem = elem.parentNode ) {
						if ( elem.tagName == 'DIV' && hasClass( elem, 'blockade-options-color-picker-input-container' ) ) {
							wrapper = elem;
							break;
						}
					}
					if(wrapper) {
						if( color ) {
							if(color == 'transparent') {
								color = '';
							}
							var input = wrapper.firstChild;
							var preview = input.nextSibling;
							input.value = color;
							if(color) {
								preview.setAttribute('style', 'background-color: ' + color );
							} else {
								preview.removeAttribute('style');
							}
						}
						removeClass( wrapper, 'blockade-options-color-picker-open' );
					}
				} else if( e.target.tagName == "BUTTON" &&  hasClass( e.target.parentElement, 'blockade-options-color-picker-cell-custom-color' ) ) {
					var wrapper = null;
					for ( var elem = e.target; elem && elem !== document; elem = elem.parentNode ) {
						if ( elem.tagName == 'DIV' && hasClass( elem, 'blockade-options-color-picker-input-container' ) ) {
							wrapper = elem;
							break;
						}
					}
					var input = wrapper.firstChild;
					var preview = input.nextSibling;
					function setDivColor(div, value) {
						div.style.background = value;
						div.setAttribute('data-mce-color', value);
					}
					removeClass( wrapper, 'blockade-options-color-picker-open' );
					editor.settings.color_picker_callback.call(editor, function(value) {
						var cols = editor.settings.textcolor_cols || 8;
						var tableElm = wrapper.getElementsByTagName('table')[0];
						var customColorCells, div, i;

						customColorCells = tinymce.map(tableElm.rows[tableElm.rows.length - 1].childNodes, function(elm) {
							return elm.firstChild;
						});
						for (i = 0; i < customColorCells.length; i++) {
							div = customColorCells[i];
							if (!div.getAttribute('data-mce-color')) {
								break;
							}
						}
						if (i == cols) {
							for (i = 0; i < cols - 1; i++) {
								setDivColor(customColorCells[i], customColorCells[i + 1].getAttribute('data-mce-color'));
							}
						}
						setDivColor(div, value);
						input.value = value;
						if(value) {
							preview.setAttribute('style', 'background-color: ' + value );
						} else {
							preview.removeAttribute('style');
						}
					}, input.value );
				}
			}
		});
		document.body.addEventListener('keyup', function(e){ change_event( e ); });
		document.body.addEventListener('paste', function(e){ change_event( e ); });
		function change_event( e ) {
			if( e.target ) {
				if( e.target.tagName == 'INPUT' && e.target.getAttribute('data-blockade-role') == 'colorpicker' ) {
					var value = e.target.value;
					var preview = e.target.parentElement.querySelector('.blockade-options-color-picker-preview');
					preview.setAttribute('style', 'background-color: ' + value );
				}
			}
		}
	}

	// SECTION --------------------------------------------------------------------- FILTER
	// this is how we preserve purely structural divs, so that they won't collapse
	editor.on('PreProcess', function(args) {
		if (args.get) {
			var containers = selectChildrenByRole(args.node, self.roles.container);
			for (var i=0; i < containers.length; i++) {
				if(containers[i].innerHTML === "") {
					containers[i].innerHTML = '&nbsp;';
				}
			}
		}
	});

	// filter the output
	editor.on('preInit', function() {
		editor.serializer.addAttributeFilter('class', function(nodes, name) {
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				var classes = node.attributes.map['class'];
				if( typeof classes != 'undefined' && classes ) {
					classes = classes.split(' ');
					if( classes.indexOf(self.classes.wrapper)>-1 || classes.indexOf(self.classes.editwrapper)>-1 ) {
						node.unwrap();
					}
					if( classes.indexOf(self.classes.controlbox)>-1 || classes.indexOf( self.classes.shortcode + '-preview' )>-1 ) {
						node.remove();
					}
					if( classes.indexOf(self.classes.comment) > -1 ) {
						var commentText = node.firstChild.value;
						var comment = new tinymce.html.Node('#comment', 8);
						comment.value = self.classes.comment + '::' + commentText;
						node.replace( comment );
					}
				}
			}
		});
		// insert blocklinks on save
		editor.serializer.addAttributeFilter('data-' + self.idbase + '-href', function(nodes, name) {
			for (var i = 0; i < nodes.length; i++) {
				var node    = nodes[i];
				var href    = node.attr('data-' + self.idbase +'-href');
				var target  = node.attr('data-' + self.idbase +'-target');
				if( !target ) {
					node.attr('data-' + self.idbase +'-target', null);
				}
				if( !href ) {
					node.attr('data-' + self.idbase +'-href', null);
					continue;
				}
				var newnode = new tinymce.html.Node('a', 1);
				newnode.attr('class', self.idbase + '-blocklink');
				newnode.attr('href', href);
				newnode.attr('target', target);
				node.wrap(newnode);
			}
		});
		editor.serializer.addAttributeFilter('contenteditable', function(nodes, name) {
			for (var i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				node.attr('contenteditable', null);
			}
		});
	});

	// filter the input
	editor.on('SetContent', function(e) {
		if(!self.body) {
			self.body     = editor.getBody();
			self.document = editor.getDoc();
		}

		if( isEmptyish( self.body ) ) {
			self.body.innerHTML = "";
			return;
		}
		// test if the content contains blocks, and if not, fix it
		if( !isBlockaded( self.body.innerHTML ) ) {
			var content = self.body.innerHTML;
			self.body.innerHTML = '';
			var block = createBlock( content );
			self.body.appendChild(block);
		}
		// kill the blocklink elements we inserted on save
		var blocklinks = selectChildrenByClass(self.body, self.idbase + '-blocklink');
		for (var i=0; i < blocklinks.length; i++) {
			var el = blocklinks[i];
			var parent = el.parentNode;
			while (el.firstChild) {
				parent.insertBefore(el.firstChild, el);
			}
			parent.removeChild(el);
		}
		var blocks = selectChildrenByClass(self.body, self.classes.blockade);
		blocks.reverse(); // reverse array so inside is processed first
		for (var i=0; i < blocks.length; i++) {
			if(!hasClass(blocks[i].parentNode, self.classes.wrapper)) {
				var newBlock = deepClone(blocks[i]);
				var wrapped  = convertToBlock(newBlock);
				replaceNode(blocks[i], wrapped);
			}
		}
		var comments = getComments(self.document);
		for(var i = 0; i < comments.length; i++) {
			var comment = comments[i];
			var text = comment.textContent;
			var commentprefix = self.classes.comment + '::';
			var shortcodeprefix = self.classes.shortcode + '::';
			if( text.indexOf(commentprefix) === 0 ) {
				text = text.slice(commentprefix.length);
				var el = self.document.createElement('div');
				el.textContent = text;
				setData(el, self.datafields.type, 'comment');
				addClass(el, self.classes.comment);
				var block = convertToBlock( el );
				comment.parentNode.replaceChild(block, comment);
			} else if( text.indexOf(shortcodeprefix) === 0 ) {
				shortcode = text.slice( shortcodeprefix.length );
				var el = build_shortcode_iframe( shortcode );
				comment.parentNode.insertBefore(el, comment);
			}
		}
		// get rid of cluttered &nbsp;s
		var cleanableAreas = selectChildrenByRole(self.body, self.roles.editable);
		var containers     = selectChildrenByRole(self.body, self.roles.container);
		Array.prototype.push.apply(cleanableAreas, containers); // adds containers to the end of cleanableAreas
		for (var i=0; i < cleanableAreas.length; i++) {
			if( isEmptyish(cleanableAreas[i]) ) {
				cleanableAreas[i].innerHTML = "";
			}
		}
		self.editor.nodeChanged();
	});

	// SECTION ------------------------------------------------------------------------------ HELPERS
	function isEmptyish(el) {
		var contents = el.innerHTML;
		if( !contents ||
			/^\s*<p>\s*<br\s+data-mce-bogus\s*=\s*"1"\s*>\s*<\/p>\s*$/gi.test(contents) ||
			/^\s*<p>\s*<br\s+_moz_editor_bogus_node\s*=\s*"TRUE"\s*>\s*<\/p>\s*$/gi.test(contents) ||
			/^\s*&nbsp;\s*(?:<br\/?>)?\s*$/gi.test(contents)) {
		   return true;
		}
		return false;
	}

	function placeBlock(el) {
		if(isPlaceable(self.body)) {
			var temp      = self.lastFocusedBlock;
			var lastChild = null;
			var target    = self.body;
			if(temp) {
				while(temp && temp !== self.body) {
					if(hasRole(temp, self.roles.container) && isPlaceable(temp)) {
						target = temp;
						break;
					}
					lastChild = temp;
					temp = temp.parentNode;
				}
			}
			var siblingafter = null;
			if(lastChild) {
				siblingafter = lastChild.nextSibling;
			}
			self.wrapInUndo(function() {
				target.insertBefore(el, siblingafter);
			});
			self.lastFocusedBlock = el;
			self.editor.nodeChanged();
			return el;
		}
		return null;
	}
	function createBlock(content) {
		var el    = wrapInContentBlock(content);
		var block = convertToBlock(el);
		return block;
	}
	function createBlockGroup() {
		var el = self.document.createElement('div');
		setRole(el, self.roles.container);
		setData(el, self.datafields.type, 'container');
		var block = convertToBlock(el);
		return block;
	}
	function convertToBlock(el) {
		var hasStructure = false;
		var structuralAreas = selectChildrenByRole(el, self.roles.container);
		if(hasRole(el, self.roles.container) || structuralAreas[0]) {
			hasStructure = true;
		}
		addClass(el, self.classes.blockade);
		wrap = self.document.createElement('div');
		addClass(wrap, self.classes.wrapper);
		var flags = getFlags(el);
		if(flags[0]) {
			for (var i=0; i<flags.length;i++) {
				addClass(wrap, self.datafields.flags+'-'+flags[i]);
			}
		}
		var contenttype = getData(el, self.datafields.type);
		if(contenttype) {
			addClass(wrap, self.datafields.type+'-'+contenttype);
		}

		wrap.appendChild(el);
		wrap.appendChild(getMCEBlockadeControls(hasStructure, contenttype));
		return wrap;
	}
	function isBlockaded( content ) {
		if(typeof content == 'undefined') {
			content = self.body.innerHTML;
		}
		// trivial check for blockade content (expand in the future)
		//\sclass\s*=\s*"(?:[^"]*\s+)*wp-blockade[\s"]
		var regex = "\\sclass\\s*=\\s*\"(?:[^\"]*\\s+)*" + self.classes.blockade + "[\\s\"]";
		regex = new RegExp(regex, 'gi');
		return regex.test(content);
	}
	function wrapInContentBlock(content) {
		var el = self.document.createElement('div');
		setRole(el, self.roles.editarea);
		setData(el, self.datafields.type, 'content');
		el.innerHTML = content;
		return el;
	}
	function getMCEBlockadeControls(hasStructure, contenttype) {
		var name = 'Block';
		var nameclass = '';
		if(typeof self.contenttypes[contenttype] !== 'undefined' ) {
			if(self.contenttypes[contenttype].name) {
				var name = self.contenttypes[contenttype].name;
				var nameclass = self.classes.controls.name + '-' + contenttype;
			}
		}
		controls = self.document.createElement('div');
		addClass(controls, self.classes.controlbox);
		var output = '';

		output += [
			'<span class="'+self.classes.controls.name+' '+nameclass+'">'+name+'</span>',
			'<div class="'+self.classes.controls.options      +'" title="Block Options"  >',
				'<span>Block Options</span>',
			'</div>'
		].join('');
		if(isBlockadeAdmin()) {
			output += [
				'<div class="'+self.classes.controls.lockcontent  +'" title="Lock Content"   >',
					'<span>Lock Content</span>',
				'</div>',
				'<div class="'+self.classes.controls.lockposition +'" title="Lock Position"  >',
					'<span>Lock Position</span>',
				'</div>'
			].join('');
			if(hasStructure) {
				output += [
					'<div class="'+self.classes.controls.lockstructure+'" title="Lock Structure" >',
						'<span>Lock Structure</span>',
					'</div>'
				].join('');
			}
		}
		output += [
			'<div class="'+self.classes.controls.clone        +'" title="Clone Block"    >',
				'<span>Clone Block</span>',
			'</div>',
			'<div class="'+self.classes.controls.deleteblock  +'" title="Delete Block"   >',
				'<span>Delete Block</span>',
			'</div>'
		].join('');
		controls.innerHTML = output;
		return controls;
	}
	function isBlockadeAdmin() {
		var isAdmin = true;
		var adminel = self.editor.getContainer();
		if(self.editor.dom.hasClass(adminel, self.classes.usertypes.admin)) {
			isAdmin = true;
		} else if(self.editor.dom.hasClass(self.body, self.classes.usertypes.editor)) {
			isAdmin = false;
		}

		return isAdmin;
	}
	function isActiveEditor(el) {
		return (el.getAttribute('contentEditable') === "true");
	}
	function getActiveEditor() {
		var activeEditor = false;
		var editareas    = selectChildrenByRole(self.body, self.roles.editarea);
		for(var i = 0; i < editareas.length; i++) {
			if(editareas[i].getAttribute('contentEditable') === "true") {
				activeEditor = editareas[i];
				break;
			}
		}
		return activeEditor;
	}
	function setActiveEditor(el) {
		if(isEditable(el) && !isActiveEditor(el)) {
			removeActiveEditor();
			if(!hasClass(el, self.classes.blockade)) {
				var wrapper = document.createElement('div');
				addClass(wrapper, self.classes.editwrapper);
				var clone = el.cloneNode(true);
				wrapper.appendChild(clone);
				el.parentNode.replaceChild(wrapper, el);
				el = clone;
			}
			el.setAttribute("contentEditable", "true");
			el.focus();
			if(el.innerHTML=="&nbsp;") {
				el.innerHTML="";
			}
			var blockParents = editor.dom.getParents(el, '.'+self.classes.wrapper);
			if(blockParents[0]) {
				self.lastFocusedBlock = blockParents[0];
			}
		}
	}
	function removeActiveEditor() {
		self.body.removeAttribute("contentEditable");
		var editareaElements = selectChildrenByRole(self.body, self.roles.editarea);
		if(editareaElements) {
			for (var i=0; i < editareaElements.length; i++) {
				editareaElements[i].removeAttribute("contentEditable");
				if(editareaElements[i].innerHTML=="") {
					editareaElements[i].innerHTML="&nbsp;";
				}
				if(hasClass(editareaElements[i].parentNode, self.classes.editwrapper)) {
					var el      = editareaElements[i].cloneNode(true);
					var wrapper = editareaElements[i].parentNode;
					wrapper.parentNode.replaceChild(el, wrapper);
				}
			}
		}
	}
	// type functions
	function getType(el) {
		return getData(el, self.datafields.type);
	}
	function setType(el, type) {
		self.wrapInUndo(function() {
			return setData(el, self.datafields.type, type);
		});
	}
	function hasType(el, type) {
		if(getType(el) === type) {
			return true;
		} else {
			return false;
		}
	}
	// role functions
	function getRole(el) {
		return getData(el, self.datafields.role);
	}
	function setRole(el, role) {
		self.wrapInUndo(function() {
			return setData(el, self.datafields.role, role);
		});
	}
	function hasRole(el, role) {
		if(getRole(el) === role) {
			return true;
		} else {
			return false;
		}
	}
	function selectChildrenByRole(el, role) {
		return selectChildrenByDataFieldValues(el, self.datafields.role, role)
	}
	function getParentByRole(el, role, fallback) {
		for ( ; el && el !== fallback; el = el.parentNode ) {
			if(el.nodeName == 'HTML') return false;
			if ( hasRole(el, role) ) {
				return el;
			}
		}
		return fallback;
	}
	function getParentsByRole(el, role, fallback) {
		var matches = [];
		for ( ; el && el !== fallback; el = el.parentNode ) {
			if(el.nodeName == 'HTML') return matches;
			if ( hasRole(el, role) ) {
				matches.push(el);
			}
		}
		return matches;
	}
	// flag functions
	function toggleFlag(el, flag) {
		if(isBlockadeAdmin()) {
			removeActiveEditor();
			var parentWrapper = getParentByClass(el, self.classes.wrapper, self.body);
			if(parentWrapper !== self.body) {
				var block     = parentWrapper.firstChild;
				var flagClass = self.datafields.flags+'-'+flag;
				self.wrapInUndo(function() {
					if(hasClass(parentWrapper, flagClass)) {
						removeClass(parentWrapper, flagClass);
						removeFlag(block, flag);
					} else {
						addClass(parentWrapper, flagClass);
						addFlag(block, flag);
					}
				});
				self.lastFocusedBlock = parentWrapper;
			}
		}
	}
	function addFlag(el, flag) {
		self.wrapInUndo(function() {
			return addDataFieldValue(el, self.datafields.flags, flag);
		});
	}
	function removeFlag(el, flag) {
		self.wrapInUndo(function() {
			return removeDataFieldValue(el, self.datafields.flags, flag);
		});
	}
	function hasFlag(el, flag) {
		return hasDataFieldValue(el, self.datafields.flags, flag);
	}
	function getFlags(el) {
		return getDataFieldValues(el, self.datafields.flags);
	}
	// data functions
	function addDataFieldValue(el, field, value) {
		if(!hasDataFieldValue(el, field, value)) {
			var values = getDataFieldValues(el, field);
			values.push(value);
			values = values.join(' ');
			setData(el, field, values);
		}
	}
	function removeDataFieldValue(el, field, value) {
		if(hasDataFieldValue(el, field, value)) {
			var values = getDataFieldValues(el, field);
			var index = findInArray(value, values);
			values.splice(index, 1);
			values = values.join(' ');
			setData(el, field, values);
		}
	}
	function hasDataFieldValue(el, field, value) {
		var values = getDataFieldValues(el, field);
		if(findInArray(value, values) >= 0) {
			return true;
		}
		return false;
	}
	function getDataFieldValues(el, field) {
		var values = getData(el, field);
		if(values) {
			values = values.split(" ");
		} else {
			values = []
		}
		return values;
	}
	function selectChildrenByDataFieldValues(el, field, value) {
		var elems = el.getElementsByTagName('*'), i;
		var matches = [];
		for(var i=0; i<elems.length; i++) {
			if(hasDataFieldValue(elems[i], field, value)) {
				matches.push(elems[i]);
			}
		}
		return matches;
	}
	// booleans
	function isEditable(el) {
		// if element or body have locked class
		var lockContentClass = self.datafields.flags+'-'+self.flags.lockcontent;
		if(!hasClass(self.body, self.classes.showblocks) ||
		   hasClass(el, lockContentClass) ||
		   hasClass(self.body, lockContentClass)) {
			return false;
		}
		var parentWithLockedContent = getParentByClass(el, lockContentClass, self.body);
		if(parentWithLockedContent !== self.body) {
			return false;
		}
		return true;
	}
	function isDraggable(el) {
		if(isActiveEditor(el)) {
			return false;
		}
		while(!hasClass(el, self.classes.wrapper)) {
			if(el === self.body || el === self.document || el.nodeName === "HTML") {
				return false;
			}
			el = el.parentNode;
		}
		var lockContentClass   = self.datafields.flags+'-'+self.flags.lockcontent;
		var lockPositionClass  = self.datafields.flags+'-'+self.flags.lockposition;
		var lockStructureClass = self.datafields.flags+'-'+self.flags.lockstructure;
		if(!hasClass(self.body, self.classes.showblocks) ||
		   hasClass(el, lockPositionClass) ||
		   hasClass(self.body, lockStructureClass) ||
		   hasClass(self.body, lockContentClass)) {
			return false;
		}
		var parentWithLockedStructure = getParentByClass(el, lockStructureClass, self.body);
		var parentWithLockedContent = getParentByClass(el, lockContentClass, self.body);
		if(parentWithLockedStructure !== self.body || parentWithLockedContent!== self.body) {
			return false;
		}

		return true;
	}
	function isPlaceable(el) {
		if( !( el === self.body || hasRole( el, self.roles.container ) ) ) {
			return false;
		}
		var lockContentClass   = self.datafields.flags+'-'+self.flags.lockcontent;
		var lockStructureClass = self.datafields.flags+'-'+self.flags.lockstructure;
		if(!hasClass(self.body, self.classes.showblocks) ||
		   hasClass(self.body, lockStructureClass) ||
		   hasClass(self.body, lockContentClass)) {
			return false;
		}
		var parentWithLockedStructure = getParentByClass(el, lockStructureClass, self.body);
		var parentWithLockedContent = getParentByClass(el, lockContentClass, self.body);
		if(parentWithLockedStructure !== self.body || parentWithLockedContent!== self.body) {
			return false;
		}

		return true;
	}
	function canDelete(el) {
		var lockContentClass   = self.datafields.flags+'-'+self.flags.lockcontent;
		var lockPositionClass  = self.datafields.flags+'-'+self.flags.lockposition;
		var lockStructureClass = self.datafields.flags+'-'+self.flags.lockstructure;
		if(!hasClass(self.body, self.classes.showblocks) ||
		   hasClass(el, lockPositionClass) ||
		   hasClass(self.body, lockStructureClass) ||
		   hasClass(self.body, lockContentClass)) {
			return false;
		}
		var parentWithLockedStructure = getParentByClass(el, lockStructureClass, self.body);
		var parentWithLockedContent = getParentByClass(el, lockContentClass, self.body);
		if(parentWithLockedStructure !== self.body || parentWithLockedContent!== self.body) {
			return false;
		}

		return true;
	}
	function canClone(el) {
		var parent = el.parentNode;
		return isPlaceable(parent);
	}

	function getDraggableWrapper(el) {
		if(!el || self.editor.dom.hasClass(el, self.classes.controlbox) ||
		   el === self.body || el == self.document || el.nodeName == "HTML") {
			return false;
		}

		if(hasRole(el,self.roles.editarea) && !isDraggable(el) ) {
			return false;
		}
		if(self.editor.dom.hasClass(el, self.classes.wrapper)) {
			if(isDraggable(el)) {
				return el;
			} else {
				return false;
			}
		}
		return(getDraggableWrapper(el.parentNode));
	}

	function cloneAndReplaceWithPlaceholder(el) {
		var height = el.offsetHeight;
		var clone = el.cloneNode(true);
		var placeholder = self.document.createElement('div');
		addClass(placeholder, self.dnd.placeholderclass);
		placeholder.style.height = ''+height+'px';
		el.parentNode.replaceChild(placeholder, el);
		return clone;
	}
	function replacePlaceholderWithElement(el) {
		var placeholders = selectChildrenByClass(self.body, self.dnd.placeholderclass);
		if(placeholders) {
			var placeholder = placeholders[0];
			placeholder.parentNode.replaceChild(el, placeholder);
			return el;
		}
		return false;
	}

	function getChildToInsertBefore(parent, y) {
		var box, height, posPercent, next, rel_y;
		var firstChildAfter = false;
		var el = parent.firstChild;
		if(el) {
			do {
				if(!hasClass(el, self.dnd.placeholderclass)) {
					box    = el.getBoundingClientRect();
					height = el.offsetHeight;
					rel_y  = y - box.top;
					if((y < 0) || (height && rel_y/height < 0.5)) {
						return el;
					}
				}
				next = el.nextSibling;
				if(next) {
					el = next;
				}
			} while(next);
		}
		return(false);
	}
	function distanceBetween(pointA, pointB) {
		return Math.sqrt(Math.pow((pointA[0] - pointB[0]), 2) + Math.pow((pointA[1] - pointB[1]), 2));
	}

	function getClassesByType(el) {
		var rawClasses = getClasses(el);
		var classes = {
			blockade: [],
			custom: []
		}
		if(!rawClasses) {
			return classes;
		}
		for( var i = 0; i < rawClasses.length; i++ ) {
			if( findInArray( rawClasses[i], self.internalClasses ) != -1 ) {
				classes.blockade.push(rawClasses[i]);
			} else {
				classes.custom.push(rawClasses[i]);
			}
		}
		return classes;
	}
	function build_shortcode_iframe( shortcode, wrapping_classes ) {
		if( typeof wrapping_classes === 'undefined' ) {
			wrapping_classes='';
		}
		var id = document.getElementById('post_ID').value;
		var uri = [
			ajaxurl.match( /.*\// ),
			'admin-post.php?action=wp-blockade-shortcode-render',
			'&shortcode=' + encodeURIComponent( shortcode ),
			'&id=' + id,
			'&classes=' + encodeURIComponent( wrapping_classes )
		].join('');
		var el = self.document.createElement('iframe');
		el.setAttribute( 'src', uri );
		el.setAttribute( 'class',  self.classes.shortcode + '-preview' );
		el.setAttribute( 'scrolling', 'no');
		el.setAttribute( 'onload', 'window.top.wp_blockade_resize_iframe(this);' );
		return el;
	}
	function resize_iframe(obj) {
		obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';
	}
	// options elements
	function options_make_accordion_html( title, content) {
		var str = [
			'<div class="blockade-options-accordion">',
				'<a href="#" class="blockade-options-accordion-header">' + title + '</a>',
				'<div class="blockade-options-accordion-body">' + content + '</div>',
			'</div>'
		].join('');
		return str;
	}
	function options_make_square_html( name, slug, data ) {
		var str = [
			'<div class="blockade-options-box-wrapper">',
				'<h3>' + name + ' (in px)</h3>',
				'<div class="blockade-options-box">',
					'<input type="text" name="' + slug + '-top"    value="' + data.top    + '" class="mce-textbox blockade-options-box-top"   >',
					'<input type="text" name="' + slug + '-right"  value="' + data.right  + '" class="mce-textbox blockade-options-box-right" >',
					'<input type="text" name="' + slug + '-bottom" value="' + data.bottom + '" class="mce-textbox blockade-options-box-bottom">',
					'<input type="text" name="' + slug + '-left"   value="' + data.left   + '" class="mce-textbox blockade-options-box-left"  >',
				'</div>',
			'</div>'
		].join('');
		return( str );
	}
	function options_make_image_uploader_html( name, slug, datastr, del ) {
		if( typeof del === 'undefined') {
			del = false;
		}
		var button_text = "Change Image";
		var data = null;
		if( datastr ) {
			var data = JSON.parse( datastr );
		}
		if( typeof data !== 'object' ) {
			data = {};
		}
		if( !data.url ) {
			data.url = self.assets.no_image;
		}
		if( data.url == self.assets.no_image ) {
			button_text = "Select Image";
		}
		if( !data.caption ) {
			data.caption = '';
		}
		if( !data.url ) {
			data.title = '';
		}
		var del_str = '';
		if( del ) {
			var is_vis = ' blockade-options-image-remove-visible';
			if( data.url == self.assets.no_image ) {
				is_vis = '';
			}
			del_str = [
				'<span class="blockade-options-image-remove dashicons dashicons-dismiss' + is_vis + '"></span>',
			].join('');
		}
		var str = [
			'<div class="blockade-options-image-wrapper">',
				'<h3>' + name + '</h3>',
				'<div class="blockade-options-image-inner-wrapper">',
					del_str,
					'<div class="blockade-options-image-preview">',
						'<img src="' + data.url + '" alt="' + data.caption + '" title="' + data.title + '">',
					'</div>',
					'<input type="hidden" value=\'' + datastr + '\' name="' + slug + '" class="blockade-options-image-data">',
					'<button data-button-role="media_library" class="mce-btn" style="width: 100%;">' + button_text + '</button>',
				'</div>',
			'</div>'
		].join('');
		return( str );
	}
	function options_make_color_picker_html( name, slug, value ) {
		// lifted with modification from tinymce textcolor plugin
		var cols, rows;
		rows = editor.settings.textcolor_rows || 5;
		cols = editor.settings.textcolor_cols || 8;
		function mapColors() {
			var i, colors = [], colorMap;
			colorMap = editor.settings.textcolor_map || [
				"000000", "Black",
				"993300", "Burnt orange",
				"333300", "Dark olive",
				"003300", "Dark green",
				"003366", "Dark azure",
				"000080", "Navy Blue",
				"333399", "Indigo",
				"333333", "Very dark gray",
				"800000", "Maroon",
				"FF6600", "Orange",
				"808000", "Olive",
				"008000", "Green",
				"008080", "Teal",
				"0000FF", "Blue",
				"666699", "Grayish blue",
				"808080", "Gray",
				"FF0000", "Red",
				"FF9900", "Amber",
				"99CC00", "Yellow green",
				"339966", "Sea green",
				"33CCCC", "Turquoise",
				"3366FF", "Royal blue",
				"800080", "Purple",
				"999999", "Medium gray",
				"FF00FF", "Magenta",
				"FFCC00", "Gold",
				"FFFF00", "Yellow",
				"00FF00", "Lime",
				"00FFFF", "Aqua",
				"00CCFF", "Sky blue",
				"993366", "Red violet",
				"FFFFFF", "White",
				"FF99CC", "Pink",
				"FFCC99", "Peach",
				"FFFF99", "Light yellow",
				"CCFFCC", "Pale green",
				"CCFFFF", "Pale cyan",
				"99CCFF", "Light sky blue",
				"CC99FF", "Plum"
			];
			for (i = 0; i < colorMap.length; i += 2) {
				colors.push({
					text: colorMap[i + 1],
					color: '#' + colorMap[i]
				});
			}
			return colors;
		}

		function renderColorPicker() {
			var ctrl = this, colors, color, html, last, x, y, i, cell_class='blockade-options-color-picker-cell', count = 0;
			function getColorCellHtml(color, title) {
				var isNoColor = color == 'transparent';
				return (
					'<td class="mce-grid-cell' + (isNoColor ? ' mce-colorbtn-trans' : '') + '">' +
						'<div class="' + cell_class + ' ' + cell_class + '-' + (count++) + '"' +
							' data-mce-color="' + (color ? color : '') + '"' +
							' role="option"' +
							' tabIndex="-1"' +
							' style="' + (color ? 'background-color: ' + color : '') + '"' +
							' title="' + tinymce.translate(title) + '">' +
							(isNoColor ? '&#215;' : '') +
						'</div>' +
					'</td>'
				);
			}
			colors = mapColors();
			colors.push({
				text: tinymce.translate("No color"),
				color: "transparent"
			});
			html = '<table class="mce-grid mce-grid-border mce-colorbutton-grid" role="list" cellspacing="0"><tbody>';
			last = colors.length - 1;
			for (y = 0; y < rows; y++) {
				html += '<tr>';
				for (x = 0; x < cols; x++) {
					i = y * cols + x;
					if (i > last) {
						html += '<td></td>';
					} else {
						color = colors[i];
						html += getColorCellHtml(color.color, color.text);
					}
				}
				html += '</tr>';
			}
			if (editor.settings.color_picker_callback) {
				html += (
					'<tr>' +
						'<td colspan="' + cols + '" class="mce-custom-color-btn">' +
							'<div class="mce-widget mce-btn mce-btn-small mce-btn-flat ' + cell_class + '-custom-color" ' +
								'role="button" tabindex="-1" aria-labelledby="' + cell_class + '-custom-color" style="width: 100%">' +
								'<button type="button" role="presentation" tabindex="-1">' + tinymce.translate('Custom...') + '</button>' +
							'</div>' +
						'</td>' +
					'</tr>'
				);
				html += '<tr>';
				for (x = 0; x < cols; x++) {
					html += getColorCellHtml('', 'Custom color');
				}
				html += '</tr>';
			}
			html += '</tbody></table>';
			return html;
		}

		var str = [
			'<label class="blockade-options-color-picker">',
				'<span>' + name + ': </span>',
				'<div class="blockade-options-color-picker-input-container">',
					'<input type="text" name="' + slug + '" value="' + value + '" disabled="disabled" class="mce-textbox" data-blockade-role="colorpicker">',
					'<span class="blockade-options-color-picker-preview" style="background-color: ' + value + ';"></span>',
					'<div class="blockade-options-color-picker-wrapper">',
						renderColorPicker(),
					'</div>',
				'</div>',
			'</label>',
		].join('');
		return str;
	}
	function options_make_select_box_html( name, slug, options, value ) {
		var str = [
			'<label class="blockade-options-select">',
				'<span>' + name + ': </span>',
				'<select name="' + slug + '" class="mce-textbox">',
		].join('');
		for (var key in options) {
			if (options.hasOwnProperty(key)) {
				var selected = "";
				if( key == value ) {
					selected = ' selected="selected"';
				}
				str += '<option value="' + key + '"' + selected + '>' + options[key] + '</option>';
			}
		}
		str += [
				'</select>',
			'</label>',
		].join('');
		return str;
	}

	// jQuery equivalents
	function getComments( parent ) {
		if(typeof parent === 'undefined') {
			parent = self.document;
		}
		function traverseDom(curr_element) {
			var comments = new Array();
			if (curr_element.nodeName == "#comment" || curr_element.nodeType == 8) {
				comments[comments.length] = curr_element;
			} else if(curr_element.childNodes.length>0) {
				for (var i = 0; i<curr_element.childNodes.length; i++) {
					comments = comments.concat(traverseDom(curr_element.childNodes[i]));
				}
			}
			return comments;
		}
		return traverseDom(parent);
	}
	function getData(el, datafield) {
		return el.getAttribute('data-'+datafield);
	}
	function setData(el, datafield, datavalue) {
		el.setAttribute('data-'+datafield, datavalue)
	}
	function findInArray(needle, haystack) {
		if(haystack.indexOf) {
			return haystack.indexOf(needle);
		} else {
			for (i = 0; i < haystack.length; i++) {
				if (haystack[i] === needle) {
					return i;
				}
			}
			return -1;
		}
	}
	function selectChildrenByClass(el, cls) {
		var elems = el.getElementsByTagName('*'), i;
		var matches = [];
		for (var i=0; i<elems.length; i++) {
			if((' ' + elems[i].className + ' ').indexOf(' ' + cls + ' ') > -1) {
				matches.push(elems[i]);
			}
		}
		return matches;
	}
	function getClasses(el) {
		if(el.classList) {
			var classes = el.classList;
		} else {
			var classes = el.className.split(' ');
		}
		return classes;
	}
	function hasClass(el, cls) {
		if (!el.className) {
			return false;
		}
		if(el.classList) {
			return el.classList.contains(cls);
		}
		var newElementClass = ' ' + el.className + ' ';
		var newClassName = ' ' + cls + ' ';
		return newElementClass.indexOf(newClassName) !== -1;
	}
	function addClass(el, cls) {
		if(!hasClass(el, cls)) {
			if(el.classList) {
				el.classList.add(cls);
			} else {
				if(el.className) {
					el.className = el.className + ' ' + cls;
				} else {
					el.className = cls;
				}
			}
			return true;
		}
		return false;
	}
	function removeClass(el, cls) {
		if(hasClass(el, cls)) {
			if(el.classList) {
				el.classList.remove(cls);
			} else {
				var classes = el.className.split(' ');
				var index   = findInArray(cls, classes);
				classes.splice(index, 1);
				el.className = classes.join(' ');
			}
		}
		return false;
	}
	function toggleClass(el, cls) {
		if(hasClass(el, cls)) {
			return removeClass(el, cls);
		}
		return addClass(el, cls);
	}
	function getParentByClass(el, cls, fallback) {
		for( ; el && el !== fallback; el = el.parentNode ) {
			if(el.nodeName == 'HTML') return false;
			if ( hasClass(el, cls) ) {
				return el;
			}
		}
		return fallback;
	}
	function getPathToParentByClass(el, cls, fallback) {
		var path = [];
		for ( ; el && el !== fallback; el = el.parentNode ) {
			if(el.nodeName == 'HTML') return path;
			path.push(el)
			if ( hasClass(el, cls) ) {
				return path;
			}
		}
		path.push(fallback);
		return path;
	}
	function killEvent(event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	}
	function replaceNode(oldEl, newEl) {
		oldEl.parentNode.replaceChild(newEl, oldEl);
	}
	function deepClone(node) {
		var clone = self.editor.dom.clone(node);
		if(node.nodeType != 3) {
			var child = node.firstChild;
			while(child) {
				// append a deepClone of the child to the clone
				var childClone = deepClone(child);
				clone.appendChild(childClone);
				// go to next child sibling
				child = child.nextSibling;
			}
		}
		return clone;
	}
	function escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	 }
	 function unescapeHtml(unsafe) {
		return unsafe
			.replace(/&amp;/g, "&")
			.replace(/&lt;/g, "<")
			.replace(/&gt;/g, ">")
			.replace(/&quot;/g, "\"")
			.replace(/&#039;/g, "'");
	 }
});
