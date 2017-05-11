/*
	Plugin Name: Blockade Video Block
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('map_block', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add custom css
	editor.contentCSS.push(url+'/styles.css');
	var default_api = 'AIzaSyBhnxgeWDftIwC9WTimnLytzSEmAZUJskY';
	var default_location = 'Burlington Bytes, 2 Church St, Burlington, VT, 05401';

	// add menu item to main blockade menu
	var menu_item = {
		text: 'Map',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				el.innerHTML = [
					'<div class="wp-blockade-map-wrapper" style="padding-bottom: 200px">',
						'<iframe src="//www.google.com/maps/embed/v1/place',
							'?q=' + encodeURI( default_location ),
							'&zoom=17',
							'&key=' + default_api,
							'&maptype=roadmap',
						'"></iframe>',
					'</div>'
				].join('');
				blockade.setData(el, blockade.datafields.type, 'map');
				var el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
				blockade.editor.fire(blockade.events.options, {target: el});
			}
		}
	};
	blockade.addToMenu( menu_item, 'Media Blocks' );

	// register edit function
	blockade.contenttypes.map = {
		name : "Map",
		parse_block_data : function( data, block ) {
			var wrapper   = block.querySelector('.wp-blockade-map-wrapper');
			var style     = wrapper.getAttribute('style');
			var height    = get_height_from_style(style);
			var iframe    = wrapper.querySelector('iframe');
			var uri       = iframe.getAttribute('src');
			var uri_parts = parseUri( uri );
			var key       = uri_parts.queryKey.key;
			if( key == default_api ) {
				key = "";
			}
			data.type_specific = {
				type     : uri_parts.path.split('/').pop(), // place or search
				query    : decodeURI(uri_parts.queryKey.q),
				zoom     : uri_parts.queryKey.zoom,
				maptype  : uri_parts.queryKey.maptype, // roadmap or satellite
				key      : key,
				height   : height,
			};
			console.log(data);
			return data;
		},
		render_html : function( data ) {
			var str = [
				blockade.options_make_select_box_html( 'Map Type', 'type', {
					'place':'Place',
					'search':'Search'
				}, data.type_specific.type ),
				'<label>',
					'<span>Location/Query: </span>',
					'<input type="text" name="query" class="mce-textbox" value="' + data.type_specific.query + '"/>',
				'</label>',
				blockade.options_make_select_box_html( 'Zoom', 'zoom', {
					'1':'1','2':'2','3':'3','4':'4',
					'5':'5','6':'6','7':'7','8':'8',
					'9':'9','10':'10','11':'11','12':'12',
					'13':'13','14':'14','15':'15','16':'16',
					'17':'17','18':'18','19':'19','20':'20',
					'21':'21'
				}, data.type_specific.zoom ),
				blockade.options_make_select_box_html( 'Display', 'maptype', {
					'roadmap'  : 'Roadmap',
					'satellite': 'Satellite'
				}, data.type_specific.maptype ),
				'<label>',
					'<span>Height: </span>',
					'<input type="text" name="height" class="mce-textbox" value="' + data.type_specific.height + '"/>',
				'</label>',
				'<label>',
					'<span>API Key (optional): </span>',
					'<input type="text" name="key" class="mce-textbox" value="' + data.type_specific.key + '"/>',
				'</label>',
			].join('');
			return str;
		},
		apply_form_results : function( data, form_data, block ) {
			var key = form_data.key;
			if( !key ) {
				key = default_api;
			}
			block.innerHTML = [
				'<div class="wp-blockade-map-wrapper" style="padding-bottom: ' + encodeURI(form_data.height) + '">',
					'<iframe src="//www.google.com/maps/embed/v1/' + form_data.type,
						'?q=' + encodeURI( form_data.query ),
						'&zoom=' + form_data.zoom,
						'&key=' + key,
						'&maptype=' + form_data.maptype,
					'"></iframe>',
				'</div>'
			].join('');
		}
	};
	function get_height_from_style(style) {
		var styles = style.split(';');
		var height = '';
		for(var i = 0; i < styles.length; i++) {
			var parts = styles[i].split(':');
			if( parts[0].trim() == 'padding-bottom') {
				height = parts[1].trim();
				break;
			}
		}
		return height;
	}
	// parseUri 1.2.2
	// (c) Steven Levithan <stevenlevithan.com>
	// MIT License
	function parseUri(str) {
		var	o   = parseUri.options,
			m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
			uri = {},
			i   = 14;

		while (i--) uri[o.key[i]] = m[i] || "";

		uri[o.q.name] = {};
		uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
			if ($1) uri[o.q.name][$1] = $2;
		});

		return uri;
	};
	parseUri.options = {
		strictMode: false,
		key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
		q:   {
			name:   "queryKey",
			parser: /(?:^|&)([^&=]*)=?([^&]*)/g
		},
		parser: {
			strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
			loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
		}
	};
});
