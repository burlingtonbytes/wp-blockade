<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Video Block
 * Slug: video_block
 * Author: Burlington Bytes, LLC
 * Description: Insert YouTube and Vimeo videos directly as block-level elements
 */
 if( !class_exists('BlockadeVideoBlock') ) {
	class BlockadeVideoBlock {
		private static $_this;
		private $addon_dir;
		private $addon_dir_url;

		public static function Instance() {
			static $instance = null;
			if ($instance === null) {
				$instance = new self();
			}
			return $instance;
		}

		private function __construct() {
			$this->addon_dir = dirname( __FILE__ );
			$this->addon_dir_url = plugin_dir_url( __FILE__ );
			add_filter( 'wp-blockade-tinymce-plugins', array( $this, "register_tinymce_plugin" ), 40 );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );

			add_filter( 'wp_kses_allowed_html', array( $this, 'whitelist_blockade_data_attributes' ), 100, 2);

			// add_filter( 'wp-blockade-top-level-buttons', array( $this, "register_tinymce_top_level_buttons" ) ); // this should rarely be used
		}
		// PUBLIC FUNCTIONS
		public function register_tinymce_plugin( $plugins ) {
			$plugins['video_block'] = $this->addon_dir_url . 'plugin.js?v=' . WP_Blockade::$version;
			return $plugins;
		}
		public function enqueue_styles() {
			wp_enqueue_style( 'wp-blockade-video-styles', $this->addon_dir_url . 'styles.css', array(), WP_Blockade::$version );
		}

		public function whitelist_blockade_data_attributes( $elements, $context ) {
			$data_attributes = array(
				'data-wp-blockade-videoblockdata',
				'data-wp-blockade-href',
			);
			$iframe_attributes = array(
				'src',
				'allowfullscreen',
				'width',
				'height',
				'frameborder',
				'id',
				'class',
				'allowtransparency',
				'style'
			);
			$data_atts = array();
			$iframe_atts = array();
			foreach( $data_attributes as $att ) {
				$data_atts[$att] = true;
  		}
			foreach( $iframe_attributes as $att){
				$iframe_atts[$att] = true;
			}
			if( !isset( $elements['iframe'] ) ) {
				$elements['iframe'] = $iframe_atts;
			}
			foreach( $elements as $el => $val ) {
				$elements[$el] = array_merge( $val, $data_atts );
			}
			return $elements;
		}

		/*
		// this should rarely be used
		public function register_tinymce_top_level_buttons( $buttons ) {
			$buttons[] = 'BUTTON_NAME!';
			return $buttons;
		}
		*/
	}
	BlockadeVideoBlock::Instance();
}
