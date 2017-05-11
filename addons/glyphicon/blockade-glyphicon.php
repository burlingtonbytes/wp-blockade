<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Glyphicon Block
 * Slug: glyphicon_block
 * Author: Burlington Bytes, LLC
 * Description: Insert glyphicons directly as block-level elements
 * Version: 0.9.5
 */
 if( !class_exists('BlockadeGlyphiconBlock') ) {
	class BlockadeGlyphiconBlock {
		private $version = 'v0.9.5';
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
			add_filter( 'wp-blockade-tinymce-plugins', array( $this, "register_tinymce_plugin" ), 60 );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
			// add_filter( 'wp-blockade-top-level-buttons', array( $this, "register_tinymce_top_level_buttons" ) ); // this should rarely be used
		}
		// PUBLIC FUNCTIONS
		public function register_tinymce_plugin( $plugins ) {
			$plugins['glyphicon_block'] = $this->addon_dir_url . 'plugin.js?v=' . $this->version;
			return $plugins;
		}
		public function enqueue_styles() {
			wp_enqueue_style( 'glyphicon-halflings', $this->addon_dir_url . 'font/glyphicons-halflings.css', array(), $this->version );
			wp_enqueue_style( 'wp-blockade-glyphicon-styles', $this->addon_dir_url . 'styles.css', array(), $this->version );
		}
		/*
		// this should rarely be used
		public function register_tinymce_top_level_buttons( $buttons ) {
			$buttons[] = 'BUTTON_NAME!';
			return $buttons;
		}
		*/
	}
	BlockadeGlyphiconBlock::Instance();
}
