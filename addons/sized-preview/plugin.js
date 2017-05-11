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
	var sizes = [
		{
			slug : 'desktop',
			title: 'Desktop',
			width: '1200'
		},
		{
			slug : 'tablet',
			title: 'Tablet',
			width: '768'
		},
		{
			slug : 'phone',
			title: 'Phone',
			width: '320'
		},
	];
	// add buttons to TinyMCE
	var size_buttons = [];
	for( var i = 0; i < sizes.length; i++ ) {
		add_size_button(sizes[i]);
	}
	function add_size_button(size) {
		editor.addButton('preview-' + size.slug, {
			text : '',
			title: size.title + ' Preview (' + size.width + 'px wide)',
			icon : false,
			onclick: function(e) {
				var $ = tinymce.dom.DomQuery;
				var container = editor.getContainer();
				var $edit_area = $(container).find('.mce-edit-area');
				if(this.active()) {
					this.active(false);
					$edit_area.css('width', 'auto');
				} else {
					for( var j = 0; j < size_buttons.length; j++ ) {
						size_buttons[j].active(false);
					}
					this.active(true);
					$edit_area.css('width', size.width + 'px');
				}
				editor.nodeChanged();
			},
			onPostRender: function(e) {
				size_buttons.push(this);
			}
		});
	}
});
