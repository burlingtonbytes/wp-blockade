/*
	Plugin Name: Blockade Video Block
	Plugin URI: http://www.burlingtonbytes.com
	Author: Burlington Bytes
	Author URI: http://www.burlingtonbytes.com
	Version: 0.9.5
*/
tinymce.PluginManager.add('video_block', function(editor, url) {
	// kill if older than IE8
	if (!window.NodeList) { return; }
	// load blockade object
	var blockade = editor.plugins.blockade;
	if(!blockade) { return; }

	// add custom css
	editor.contentCSS.push(url+'/styles.css');

	// selected from https://en.wikipedia.org/wiki/Aspect_ratio_(image)
	// padding (key) is calculated as height / width (e.g. 4:3 -> 3/4 -> 0.75 -> 75%)
	var aspectRatios = {
		'75%'      : '4:3 - SD Video',
		'56.25%'   : '16:9 - HD Video',
		'42.1875%' : '21:9 - Cinematic Widescreen',
		'100%'     : '1:1 - Square',
		'177.777%' : '9:16 - Vertical Video',
	};
	var defaultAspectRatio = '56.25%';

	// add menu item to main blockade menu
	var menu_item = {
		text: 'Video',
		onclick: function() {
			if(blockade.isPlaceable(blockade.body)) {
				var el = blockade.document.createElement('div');
				el.innerHTML = [
					'<div class="wp-blockade-video-wrapper" style="padding-bottom:' + defaultAspectRatio + '">',
						'<img class="video" src="' + blockade.assets.no_image + '" alt="No Video Selected"/>',
					'</div>'
				].join('');
				blockade.setData(el, blockade.datafields.type, 'video');
				var el = blockade.convertToBlock(el);
				blockade.placeBlock(el);
				blockade.removeActiveEditor();
				blockade.editor.fire(blockade.events.options, {target: el});
			}
		}
	};
	blockade.addToMenu( menu_item, 'Media Blocks' );

	// register edit function
	blockade.contenttypes.video = {
		name : "Video",
		parse_block_data : function( data, block ) {
			var tempData = block.getAttribute( 'data-wp-blockade-videoblockdata' );
			var tempDecoded = false;
			if( tempData ) {
				var tempDecoded = JSON.parse(tempData);
			}
			if( tempDecoded ) {
				data.type_specific = tempDecoded;
			} else {
				data.type_specific = {
					vidlink     : '',
					aspectRatio : defaultAspectRatio,
				};
			}

			return data;
		},
		render_html : function( data ) {
			var str = [
				'<p>Insert a video from YouTube or Vimeo.</p>',
				'<label>',
					'<span>Video URL: </span>',
					'<input type="text" name="vidlink" class="mce-textbox" value="' + data.type_specific.vidlink + '"/>',
				'</label>',
				blockade.options_make_select_box_html( 'Aspect Ratio', 'aspectRatio', aspectRatios, data.type_specific.aspectRatio ),
			].join('');
			return str;
		},
		apply_form_results : function( data, form_data, block ) {
			var video = parse_video_link( form_data.vidlink );
			if( !video.valid ) {
				return false;
			}
			var vidblock = [
				'<div class="wp-blockade-video-wrapper" style="padding-bottom: ' + form_data.aspectRatio + ';">',
					video.html,
				'</div>'
			].join('');
			block.innerHTML = vidblock;
			block.setAttribute( 'data-wp-blockade-videoblockdata', JSON.stringify( form_data ) );
		}
	};
	function parse_video_link(link) {
		var retval = {
			valid  : false,
			service: '',
			id     : '',
			html   : ''
		};
		if( link && validate_url(link) ) {
			if( link.indexOf('vimeo') !== -1 ) {
				retval.service = 'vimeo';
				retval.id      = vimeo_link_to_id( link );
				retval.html    = '<iframe src="https://player.vimeo.com/video/' + retval.id + '" allowfullscreen></iframe>';
			} else if( link.indexOf('youtu') !== -1 ) {
				retval.service = 'youtube';
				retval.id      = youtube_link_to_id( link );
				retval.html    = '<iframe src="https://www.youtube.com/embed/' + retval.id + '" allowfullscreen></iframe>';
			}
			if( retval.id ) {
				retval.valid = true;
			}
			return retval;
		}
	}
	function validate_url(str) {
	var pattern = new RegExp([
		'^(https?:\\/\\/)?',                                 // protocol
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|', // domain name
		'((\\d{1,3}\\.){3}\\d{1,3}))',                       // OR ip (v4) address
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*',                   // port and path
		'(\\?[;&a-z\\d%_.~+=-]*)?',                          // query string
		'(\\#[-a-z\\d_]*)?$'                                 // fragment locator
	].join(''),'i');
	return pattern.test(str);
	}
	function youtube_link_to_id( link ) {
		var matches = link.match( /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/ );
		var retval = false;
		if( matches && typeof matches[1] != 'undefined' && matches[1] ) {
			retval = matches[1];
		}
		return retval;
	}
	function vimeo_link_to_id( link ) {
		var matches = link.match( /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/ );
		var retval = false;
		if ( matches &&  typeof matches[5] != 'undefined' && matches[5] ){
			retval = matches[5];
		}
		return retval;
	}
});
