/*
	Plugin Name: Button Block
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
*/
tinymce.PluginManager.add('button_block', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add custom css
	editor.contentCSS.push(url+'/styles.css');
	editor.on('init', function() {
		var styleEl = editor.dom.create('link');
		styleEl.setAttribute( 'rel' , 'stylesheet' );
		styleEl.setAttribute( 'type', 'text/css' );
		styleEl.setAttribute( 'href', url + '/tinymcestyles.css' );
		document.getElementsByTagName('head')[0].appendChild(styleEl);
	});
	// define glyphicons
	var glyphicons = [
		{
			"id":"glyphicon-asterisk",
			"unicode":"2a"
		},
		{
			"id":"glyphicon-plus",
			"unicode":"2b"
		},
		{
			"id":"glyphicon-eur",
			"unicode":"20ac"
		},
		{
			"id":"glyphicon-euro",
			"unicode":"20ac"
		},
		{
			"id":"glyphicon-minus",
			"unicode":"2212"
		},
		{
			"id":"glyphicon-cloud",
			"unicode":"2601"
		},
		{
			"id":"glyphicon-envelope",
			"unicode":"2709"
		},
		{
			"id":"glyphicon-pencil",
			"unicode":"270f"
		},
		{
			"id":"glyphicon-glass",
			"unicode":"e001"
		},
		{
			"id":"glyphicon-music",
			"unicode":"e002"
		},
		{
			"id":"glyphicon-search",
			"unicode":"e003"
		},
		{
			"id":"glyphicon-heart",
			"unicode":"e005"
		},
		{
			"id":"glyphicon-star",
			"unicode":"e006"
		},
		{
			"id":"glyphicon-star-empty",
			"unicode":"e007"
		},
		{
			"id":"glyphicon-user",
			"unicode":"e008"
		},
		{
			"id":"glyphicon-film",
			"unicode":"e009"
		},
		{
			"id":"glyphicon-th-large",
			"unicode":"e010"
		},
		{
			"id":"glyphicon-th",
			"unicode":"e011"
		},
		{
			"id":"glyphicon-th-list",
			"unicode":"e012"
		},
		{
			"id":"glyphicon-ok",
			"unicode":"e013"
		},
		{
			"id":"glyphicon-remove",
			"unicode":"e014"
		},
		{
			"id":"glyphicon-zoom-in",
			"unicode":"e015"
		},
		{
			"id":"glyphicon-zoom-out",
			"unicode":"e016"
		},
		{
			"id":"glyphicon-off",
			"unicode":"e017"
		},
		{
			"id":"glyphicon-signal",
			"unicode":"e018"
		},
		{
			"id":"glyphicon-cog",
			"unicode":"e019"
		},
		{
			"id":"glyphicon-trash",
			"unicode":"e020"
		},
		{
			"id":"glyphicon-home",
			"unicode":"e021"
		},
		{
			"id":"glyphicon-file",
			"unicode":"e022"
		},
		{
			"id":"glyphicon-time",
			"unicode":"e023"
		},
		{
			"id":"glyphicon-road",
			"unicode":"e024"
		},
		{
			"id":"glyphicon-download-alt",
			"unicode":"e025"
		},
		{
			"id":"glyphicon-download",
			"unicode":"e026"
		},
		{
			"id":"glyphicon-upload",
			"unicode":"e027"
		},
		{
			"id":"glyphicon-inbox",
			"unicode":"e028"
		},
		{
			"id":"glyphicon-play-circle",
			"unicode":"e029"
		},
		{
			"id":"glyphicon-repeat",
			"unicode":"e030"
		},
		{
			"id":"glyphicon-refresh",
			"unicode":"e031"
		},
		{
			"id":"glyphicon-list-alt",
			"unicode":"e032"
		},
		{
			"id":"glyphicon-lock",
			"unicode":"e033"
		},
		{
			"id":"glyphicon-flag",
			"unicode":"e034"
		},
		{
			"id":"glyphicon-headphones",
			"unicode":"e035"
		},
		{
			"id":"glyphicon-volume-off",
			"unicode":"e036"
		},
		{
			"id":"glyphicon-volume-down",
			"unicode":"e037"
		},
		{
			"id":"glyphicon-volume-up",
			"unicode":"e038"
		},
		{
			"id":"glyphicon-qrcode",
			"unicode":"e039"
		},
		{
			"id":"glyphicon-barcode",
			"unicode":"e040"
		},
		{
			"id":"glyphicon-tag",
			"unicode":"e041"
		},
		{
			"id":"glyphicon-tags",
			"unicode":"e042"
		},
		{
			"id":"glyphicon-book",
			"unicode":"e043"
		},
		{
			"id":"glyphicon-bookmark",
			"unicode":"e044"
		},
		{
			"id":"glyphicon-print",
			"unicode":"e045"
		},
		{
			"id":"glyphicon-camera",
			"unicode":"e046"
		},
		{
			"id":"glyphicon-font",
			"unicode":"e047"
		},
		{
			"id":"glyphicon-bold",
			"unicode":"e048"
		},
		{
			"id":"glyphicon-italic",
			"unicode":"e049"
		},
		{
			"id":"glyphicon-text-height",
			"unicode":"e050"
		},
		{
			"id":"glyphicon-text-width",
			"unicode":"e051"
		},
		{
			"id":"glyphicon-align-left",
			"unicode":"e052"
		},
		{
			"id":"glyphicon-align-center",
			"unicode":"e053"
		},
		{
			"id":"glyphicon-align-right",
			"unicode":"e054"
		},
		{
			"id":"glyphicon-align-justify",
			"unicode":"e055"
		},
		{
			"id":"glyphicon-list",
			"unicode":"e056"
		},
		{
			"id":"glyphicon-indent-left",
			"unicode":"e057"
		},
		{
			"id":"glyphicon-indent-right",
			"unicode":"e058"
		},
		{
			"id":"glyphicon-facetime-video",
			"unicode":"e059"
		},
		{
			"id":"glyphicon-picture",
			"unicode":"e060"
		},
		{
			"id":"glyphicon-map-marker",
			"unicode":"e062"
		},
		{
			"id":"glyphicon-adjust",
			"unicode":"e063"
		},
		{
			"id":"glyphicon-tint",
			"unicode":"e064"
		},
		{
			"id":"glyphicon-edit",
			"unicode":"e065"
		},
		{
			"id":"glyphicon-share",
			"unicode":"e066"
		},
		{
			"id":"glyphicon-check",
			"unicode":"e067"
		},
		{
			"id":"glyphicon-move",
			"unicode":"e068"
		},
		{
			"id":"glyphicon-step-backward",
			"unicode":"e069"
		},
		{
			"id":"glyphicon-fast-backward",
			"unicode":"e070"
		},
		{
			"id":"glyphicon-backward",
			"unicode":"e071"
		},
		{
			"id":"glyphicon-play",
			"unicode":"e072"
		},
		{
			"id":"glyphicon-pause",
			"unicode":"e073"
		},
		{
			"id":"glyphicon-stop",
			"unicode":"e074"
		},
		{
			"id":"glyphicon-forward",
			"unicode":"e075"
		},
		{
			"id":"glyphicon-fast-forward",
			"unicode":"e076"
		},
		{
			"id":"glyphicon-step-forward",
			"unicode":"e077"
		},
		{
			"id":"glyphicon-eject",
			"unicode":"e078"
		},
		{
			"id":"glyphicon-chevron-left",
			"unicode":"e079"
		},
		{
			"id":"glyphicon-chevron-right",
			"unicode":"e080"
		},
		{
			"id":"glyphicon-plus-sign",
			"unicode":"e081"
		},
		{
			"id":"glyphicon-minus-sign",
			"unicode":"e082"
		},
		{
			"id":"glyphicon-remove-sign",
			"unicode":"e083"
		},
		{
			"id":"glyphicon-ok-sign",
			"unicode":"e084"
		},
		{
			"id":"glyphicon-question-sign",
			"unicode":"e085"
		},
		{
			"id":"glyphicon-info-sign",
			"unicode":"e086"
		},
		{
			"id":"glyphicon-screenshot",
			"unicode":"e087"
		},
		{
			"id":"glyphicon-remove-circle",
			"unicode":"e088"
		},
		{
			"id":"glyphicon-ok-circle",
			"unicode":"e089"
		},
		{
			"id":"glyphicon-ban-circle",
			"unicode":"e090"
		},
		{
			"id":"glyphicon-arrow-left",
			"unicode":"e091"
		},
		{
			"id":"glyphicon-arrow-right",
			"unicode":"e092"
		},
		{
			"id":"glyphicon-arrow-up",
			"unicode":"e093"
		},
		{
			"id":"glyphicon-arrow-down",
			"unicode":"e094"
		},
		{
			"id":"glyphicon-share-alt",
			"unicode":"e095"
		},
		{
			"id":"glyphicon-resize-full",
			"unicode":"e096"
		},
		{
			"id":"glyphicon-resize-small",
			"unicode":"e097"
		},
		{
			"id":"glyphicon-exclamation-sign",
			"unicode":"e101"
		},
		{
			"id":"glyphicon-gift",
			"unicode":"e102"
		},
		{
			"id":"glyphicon-leaf",
			"unicode":"e103"
		},
		{
			"id":"glyphicon-fire",
			"unicode":"e104"
		},
		{
			"id":"glyphicon-eye-open",
			"unicode":"e105"
		},
		{
			"id":"glyphicon-eye-close",
			"unicode":"e106"
		},
		{
			"id":"glyphicon-warning-sign",
			"unicode":"e107"
		},
		{
			"id":"glyphicon-plane",
			"unicode":"e108"
		},
		{
			"id":"glyphicon-calendar",
			"unicode":"e109"
		},
		{
			"id":"glyphicon-random",
			"unicode":"e110"
		},
		{
			"id":"glyphicon-comment",
			"unicode":"e111"
		},
		{
			"id":"glyphicon-magnet",
			"unicode":"e112"
		},
		{
			"id":"glyphicon-chevron-up",
			"unicode":"e113"
		},
		{
			"id":"glyphicon-chevron-down",
			"unicode":"e114"
		},
		{
			"id":"glyphicon-retweet",
			"unicode":"e115"
		},
		{
			"id":"glyphicon-shopping-cart",
			"unicode":"e116"
		},
		{
			"id":"glyphicon-folder-close",
			"unicode":"e117"
		},
		{
			"id":"glyphicon-folder-open",
			"unicode":"e118"
		},
		{
			"id":"glyphicon-resize-vertical",
			"unicode":"e119"
		},
		{
			"id":"glyphicon-resize-horizontal",
			"unicode":"e120"
		},
		{
			"id":"glyphicon-hdd",
			"unicode":"e121"
		},
		{
			"id":"glyphicon-bullhorn",
			"unicode":"e122"
		},
		{
			"id":"glyphicon-bell",
			"unicode":"e123"
		},
		{
			"id":"glyphicon-certificate",
			"unicode":"e124"
		},
		{
			"id":"glyphicon-thumbs-up",
			"unicode":"e125"
		},
		{
			"id":"glyphicon-thumbs-down",
			"unicode":"e126"
		},
		{
			"id":"glyphicon-hand-right",
			"unicode":"e127"
		},
		{
			"id":"glyphicon-hand-left",
			"unicode":"e128"
		},
		{
			"id":"glyphicon-hand-up",
			"unicode":"e129"
		},
		{
			"id":"glyphicon-hand-down",
			"unicode":"e130"
		},
		{
			"id":"glyphicon-circle-arrow-right",
			"unicode":"e131"
		},
		{
			"id":"glyphicon-circle-arrow-left",
			"unicode":"e132"
		},
		{
			"id":"glyphicon-circle-arrow-up",
			"unicode":"e133"
		},
		{
			"id":"glyphicon-circle-arrow-down",
			"unicode":"e134"
		},
		{
			"id":"glyphicon-globe",
			"unicode":"e135"
		},
		{
			"id":"glyphicon-wrench",
			"unicode":"e136"
		},
		{
			"id":"glyphicon-tasks",
			"unicode":"e137"
		},
		{
			"id":"glyphicon-filter",
			"unicode":"e138"
		},
		{
			"id":"glyphicon-briefcase",
			"unicode":"e139"
		},
		{
			"id":"glyphicon-fullscreen",
			"unicode":"e140"
		},
		{
			"id":"glyphicon-dashboard",
			"unicode":"e141"
		},
		{
			"id":"glyphicon-paperclip",
			"unicode":"e142"
		},
		{
			"id":"glyphicon-heart-empty",
			"unicode":"e143"
		},
		{
			"id":"glyphicon-link",
			"unicode":"e144"
		},
		{
			"id":"glyphicon-phone",
			"unicode":"e145"
		},
		{
			"id":"glyphicon-pushpin",
			"unicode":"e146"
		},
		{
			"id":"glyphicon-usd",
			"unicode":"e148"
		},
		{
			"id":"glyphicon-gbp",
			"unicode":"e149"
		},
		{
			"id":"glyphicon-sort",
			"unicode":"e150"
		},
		{
			"id":"glyphicon-sort-by-alphabet",
			"unicode":"e151"
		},
		{
			"id":"glyphicon-sort-by-alphabet-alt",
			"unicode":"e152"
		},
		{
			"id":"glyphicon-sort-by-order",
			"unicode":"e153"
		},
		{
			"id":"glyphicon-sort-by-order-alt",
			"unicode":"e154"
		},
		{
			"id":"glyphicon-sort-by-attributes",
			"unicode":"e155"
		},
		{
			"id":"glyphicon-sort-by-attributes-alt",
			"unicode":"e156"
		},
		{
			"id":"glyphicon-unchecked",
			"unicode":"e157"
		},
		{
			"id":"glyphicon-expand",
			"unicode":"e158"
		},
		{
			"id":"glyphicon-collapse-down",
			"unicode":"e159"
		},
		{
			"id":"glyphicon-collapse-up",
			"unicode":"e160"
		},
		{
			"id":"glyphicon-log-in",
			"unicode":"e161"
		},
		{
			"id":"glyphicon-flash",
			"unicode":"e162"
		},
		{
			"id":"glyphicon-log-out",
			"unicode":"e163"
		},
		{
			"id":"glyphicon-new-window",
			"unicode":"e164"
		},
		{
			"id":"glyphicon-record",
			"unicode":"e165"
		},
		{
			"id":"glyphicon-save",
			"unicode":"e166"
		},
		{
			"id":"glyphicon-open",
			"unicode":"e167"
		},
		{
			"id":"glyphicon-saved",
			"unicode":"e168"
		},
		{
			"id":"glyphicon-import",
			"unicode":"e169"
		},
		{
			"id":"glyphicon-export",
			"unicode":"e170"
		},
		{
			"id":"glyphicon-send",
			"unicode":"e171"
		},
		{
			"id":"glyphicon-floppy-disk",
			"unicode":"e172"
		},
		{
			"id":"glyphicon-floppy-saved",
			"unicode":"e173"
		},
		{
			"id":"glyphicon-floppy-remove",
			"unicode":"e174"
		},
		{
			"id":"glyphicon-floppy-save",
			"unicode":"e175"
		},
		{
			"id":"glyphicon-floppy-open",
			"unicode":"e176"
		},
		{
			"id":"glyphicon-credit-card",
			"unicode":"e177"
		},
		{
			"id":"glyphicon-transfer",
			"unicode":"e178"
		},
		{
			"id":"glyphicon-cutlery",
			"unicode":"e179"
		},
		{
			"id":"glyphicon-header",
			"unicode":"e180"
		},
		{
			"id":"glyphicon-compressed",
			"unicode":"e181"
		},
		{
			"id":"glyphicon-earphone",
			"unicode":"e182"
		},
		{
			"id":"glyphicon-phone-alt",
			"unicode":"e183"
		},
		{
			"id":"glyphicon-tower",
			"unicode":"e184"
		},
		{
			"id":"glyphicon-stats",
			"unicode":"e185"
		},
		{
			"id":"glyphicon-sd-video",
			"unicode":"e186"
		},
		{
			"id":"glyphicon-hd-video",
			"unicode":"e187"
		},
		{
			"id":"glyphicon-subtitles",
			"unicode":"e188"
		},
		{
			"id":"glyphicon-sound-stereo",
			"unicode":"e189"
		},
		{
			"id":"glyphicon-sound-dolby",
			"unicode":"e190"
		},
		{
			"id":"glyphicon-sound-5-1",
			"unicode":"e191"
		},
		{
			"id":"glyphicon-sound-6-1",
			"unicode":"e192"
		},
		{
			"id":"glyphicon-sound-7-1",
			"unicode":"e193"
		},
		{
			"id":"glyphicon-copyright-mark",
			"unicode":"e194"
		},
		{
			"id":"glyphicon-registration-mark",
			"unicode":"e195"
		},
		{
			"id":"glyphicon-cloud-download",
			"unicode":"e197"
		},
		{
			"id":"glyphicon-cloud-upload",
			"unicode":"e198"
		},
		{
			"id":"glyphicon-tree-conifer",
			"unicode":"e199"
		},
		{
			"id":"glyphicon-tree-deciduous",
			"unicode":"e200"
		},
		{
			"id":"glyphicon-cd",
			"unicode":"e201"
		},
		{
			"id":"glyphicon-save-file",
			"unicode":"e202"
		},
		{
			"id":"glyphicon-open-file",
			"unicode":"e203"
		},
		{
			"id":"glyphicon-level-up",
			"unicode":"e204"
		},
		{
			"id":"glyphicon-copy",
			"unicode":"e205"
		},
		{
			"id":"glyphicon-paste",
			"unicode":"e206"
		},
		{
			"id":"glyphicon-alert",
			"unicode":"e209"
		},
		{
			"id":"glyphicon-equalizer",
			"unicode":"e210"
		},
		{
			"id":"glyphicon-king",
			"unicode":"e211"
		},
		{
			"id":"glyphicon-queen",
			"unicode":"e212"
		},
		{
			"id":"glyphicon-pawn",
			"unicode":"e213"
		},
		{
			"id":"glyphicon-bishop",
			"unicode":"e214"
		},
		{
			"id":"glyphicon-knight",
			"unicode":"e215"
		},
		{
			"id":"glyphicon-baby-formula",
			"unicode":"e216"
		},
		{
			"id":"glyphicon-tent",
			"unicode":"26fa"
		},
		{
			"id":"glyphicon-blackboard",
			"unicode":"e218"
		},
		{
			"id":"glyphicon-bed",
			"unicode":"e219"
		},
		{
			"id":"glyphicon-apple",
			"unicode":"f8ff"
		},
		{
			"id":"glyphicon-erase",
			"unicode":"e221"
		},
		{
			"id":"glyphicon-hourglass",
			"unicode":"231b"
		},
		{
			"id":"glyphicon-lamp",
			"unicode":"e223"
		},
		{
			"id":"glyphicon-duplicate",
			"unicode":"e224"
		},
		{
			"id":"glyphicon-piggy-bank",
			"unicode":"e225"
		},
		{
			"id":"glyphicon-scissors",
			"unicode":"e226"
		},
		{
			"id":"glyphicon-bitcoin",
			"unicode":"e227"
		},
		{
			"id":"glyphicon-yen",
			"unicode":"00a5"
		},
		{
			"id":"glyphicon-ruble",
			"unicode":"20bd"
		},
		{
			"id":"glyphicon-scale",
			"unicode":"e230"
		},
		{
			"id":"glyphicon-ice-lolly",
			"unicode":"e231"
		},
		{
			"id":"glyphicon-ice-lolly-tasted",
			"unicode":"e232"
		},
		{
			"id":"glyphicon-education",
			"unicode":"e233"
		},
		{
			"id":"glyphicon-option-horizontal",
			"unicode":"e234"
		},
		{
			"id":"glyphicon-option-vertical",
			"unicode":"e235"
		},
		{
			"id":"glyphicon-menu-hamburger",
			"unicode":"e236"
		},
		{
			"id":"glyphicon-modal-window",
			"unicode":"e237"
		},
		{
			"id":"glyphicon-oil",
			"unicode":"e238"
		},
		{
			"id":"glyphicon-grain",
			"unicode":"e239"
		},
		{
			"id":"glyphicon-sunglasses",
			"unicode":"e240"
		},
		{
			"id":"glyphicon-text-size",
			"unicode":"e241"
		},
		{
			"id":"glyphicon-text-color",
			"unicode":"e242"
		},
		{
			"id":"glyphicon-text-background",
			"unicode":"e243"
		},
		{
			"id":"glyphicon-object-align-top",
			"unicode":"e244"
		},
		{
			"id":"glyphicon-object-align-bottom",
			"unicode":"e245"
		},
		{
			"id":"glyphicon-object-align-horizontal",
			"unicode":"e246"
		},
		{
			"id":"glyphicon-object-align-left",
			"unicode":"e247"
		},
		{
			"id":"glyphicon-object-align-vertical",
			"unicode":"e248"
		},
		{
			"id":"glyphicon-object-align-right",
			"unicode":"e249"
		},
		{
			"id":"glyphicon-triangle-right",
			"unicode":"e250"
		},
		{
			"id":"glyphicon-triangle-left",
			"unicode":"e251"
		},
		{
			"id":"glyphicon-triangle-bottom",
			"unicode":"e252"
		},
		{
			"id":"glyphicon-triangle-top",
			"unicode":"e253"
		},
		{
			"id":"glyphicon-console",
			"unicode":"e254"
		},
		{
			"id":"glyphicon-superscript",
			"unicode":"e255"
		},
		{
			"id":"glyphicon-subscript",
			"unicode":"e256"
		},
		{
			"id":"glyphicon-menu-left",
			"unicode":"e257"
		},
		{
			"id":"glyphicon-menu-right",
			"unicode":"e258"
		},
		{
			"id":"glyphicon-menu-down",
			"unicode":"e259"
		},
		{
			"id":"glyphicon-menu-up",
			"unicode":"e260"
		}
	];
	var glyphicon_select = {
		'' : "No Icon"
	};
	for( var i = 0; i < glyphicons.length; i++ ) {
		glyphicon_select[glyphicons[i].id] = "&#x" + glyphicons[i].unicode + ";" + " " + glyphicons[i].id.replace("glyphicon-", "");
	}

	// add menu item to main blockade menu
	var menu_item = {
		text: 'Button',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				el.innerHTML = [
					'<div class="wp-blockade-button-wrapper" style="text-align: center;">',
						'<a href="" class="btn btn-md btn-primary">',
							'<span class="button_text">Button Text</span>',
						'</a>',
					'</div>'
				].join('');
				blockade.setData(el, blockade.datafields.type, 'button');
				var el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
				blockade.editor.fire(blockade.events.options, {target: el});
			}
		}
	};
	blockade.addToMenu( menu_item );

	// register edit function
	blockade.contenttypes.button = {
		name : "Button",
		parse_block_data : function( data, block ) {
			var wrap = block.querySelector('.wp-blockade-button-wrapper');
			var link = wrap.querySelector('a');
			var icon = link.querySelector('i');
			var span = link.querySelector('span');
			data.type_specific = {
				text    : "Button Text",
				href    : "",
				new_win : false,
				icon    : "",
				iconpos : "left",
				type    : "btn-primary",
				size    : "btn-md",
				block   : false,
				align   : "center",
			};
			var href = link.getAttribute('href');
			if( href ) {
				data.type_specific.href = href;
			}
			data.type_specific.new_win = !!link.getAttribute('target');
			data.type_specific.text = span.textContent;
			if( span.nextSibling ) {
				data.type_specific.iconpos = "right";
			}
			var wrapStyle = wrap.getAttribute('style');
			if( wrapStyle ) {
				var styleParts = wrapStyle.replace( ';', '' ).split( ':' );
				if( styleParts && styleParts[1] ) {
					data.type_specific.align = styleParts[1].trim();
				}
			}

			var linkclasses = link.getAttribute('class').split(' ');
			for(var i = 0; i < linkclasses.length; i++) {
				if( linkclasses[i] == "btn" ) {
					continue;
				}
				switch( linkclasses[i] ) {
					case "btn-xs" :
						data.type_specific.size = 'xs';
						break;
					case "btn-sm" :
						data.type_specific.size = 'sm';
						break;
					case "btn-md" :
						data.type_specific.size = 'md';
						break;
					case "btn-lg" :
						data.type_specific.size = 'lg';
						break;
					case "btn-block" :
						data.type_specific.block = true;
						break;
					case "btn-default" :
						data.type_specific.type = 'default';
						break;
					case "btn-primary" :
						data.type_specific.type = 'primary';
						break;
					case "btn-success" :
						data.type_specific.type = 'success';
						break;
					case "btn-info" :
						data.type_specific.type = 'info';
						break;
					case "btn-warning" :
						data.type_specific.type = 'warning';
						break;
					case "btn-danger" :
						data.type_specific.type = 'danger';
						break;
					case "btn-link" :
						data.type_specific.type = 'link';
						break;
				}
			}
			if( icon ) {
				var glyphclasses = icon.getAttribute('class').split(' ');
				for(var i = 0; i < glyphclasses.length; i++) {
					if( glyphclasses[i] == "glyphicon" ) {
						continue;
					}
					data.type_specific.icon = glyphclasses[i];
					break;
				}
			}
			return data;
		},
		render_options : function( data ) {
			var win_checked = '';
			if( data.type_specific.new_win ) {
				win_checked = ' checked="checked"';
			}
			var block_checked = '';
			if( data.type_specific.block ) {
				block_checked = ' checked="checked"';
			}
			var str = [
				'<div class="wp-blockade-button-options">',
					'<label>',
						'<span>Button Text: </span>',
						'<input type="text" name="text" class="mce-textbox" value="' + data.type_specific.text + '"/>',
					'</label>',
					'<label>',
						'<span>Link To: </span>',
						'<input type="text" name="href" class="mce-textbox" value="' + data.type_specific.href + '"/>',
					'</label>',
					'<label>',
						'<input type="checkbox" name="new_win" value="true"' + win_checked + '/>',
						' open link in new window?',
					'</label>',
					blockade.options_make_accordion_html("Options", [
						blockade.options_make_select_box_html( 'Type', 'type', {
							'default' : 'Default',
							'primary' : 'Primary',
							'success' : 'Success',
							'info'    : 'Info',
							'warning' : 'Warning',
							'danger'  : 'Danger',
							'link'    : 'Link',
						}, data.type_specific.type ),
						blockade.options_make_select_box_html( 'Align', 'align', {
							'left'  : 'Left',
							'center': 'Center',
							'right' : 'Right'
						}, data.type_specific.align ),
						blockade.options_make_select_box_html( 'Size', 'size', {
							'xs': 'Extra-Small',
							'sm': 'Small',
							'md': 'Medium',
							'lg': 'Large',
						}, data.type_specific.size ),
						'<label>',
							'<input type="checkbox" name="block" value="true"' + block_checked + '/>',
							' full width?',
						'</label>',
						'<div class="icon-select">',
							blockade.options_make_select_box_html( 'Icon', 'icon', glyphicon_select, data.type_specific.icon ),
						'</div>',
						blockade.options_make_select_box_html( 'Icon Position', 'iconpos', {
							'left': 'left',
							'right': 'right',
						}, data.type_specific.iconpos ),
					].join('')),
				'</div>',
			].join('');
			return {
				'Button' : str,
				'Link': false
			};
		},
		apply_form_results : function( data, form_data, block ) {
			var content = '<span class="button_text">' + form_data.text + '</span>';
			if( form_data.icon ) {
				var icon = '<i class="glyphicon ' + form_data.icon + '"></i>';
				if( form_data.iconpos == 'left' ) {
					content = icon + ' ' + content;
				} else {
					content = content + ' ' + icon;
				}
			}
			var link_class = 'btn btn-' + form_data.size + ' btn-' + form_data.type;
			if( form_data.block ) {
				link_class += ' btn-block';
			}
			var target = "";
			if( form_data.new_win ) {
				target = ' target="_blank"';
			}
			content = [
				'<div class="wp-blockade-button-wrapper" style="text-align: ' + form_data.align + '">',
					'<a href="' + form_data.href + '"' + target + ' class="' + link_class + '">',
						content,
					'</a>',
				'</div>'
			].join('');

			block.innerHTML = content;
		}
	};
});
