<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Breakout
 * Slug: blockade_breakout
 * Author: Burlington Bytes, LLC
 * Description: break out of the container to full width
 * Version: 0.9.5
 */
 if( !class_exists('BlockadeBreakout') ) {
	class BlockadeBreakout {
		private $version = 'v0.9.5';
		private static $_this;
		private $addon_dir;
		private $addon_dir_url;
		private $hide_sidebar = false;

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
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles_and_scripts' ) );
			add_filter( 'wp-blockade-tinymce-plugins', array( $this, "register_tinymce_plugin" ), 10 );
			// add_filter( 'wp-blockade-top-level-buttons', array( $this, "register_tinymce_top_level_buttons" ) ); // this should rarely be used
		}
		// PUBLIC FUNCTIONS
		public function enqueue_styles_and_scripts() {
			wp_enqueue_script( 'jquery' );
			wp_enqueue_script( 'blockade-breakout', $this->addon_dir_url . 'blockade-breakout.js', array('jquery'), $this->version );
		}

		public function register_tinymce_plugin( $plugins ) {
			$plugins['blockade_breakout'] = $this->addon_dir_url . 'plugin.js?v=' . $this->version;
			return $plugins;
		}
	}
	BlockadeBreakout::Instance();
}
