<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Sized Preview
 * Slug: blockade_sized_preview
 * Author: Burlington Bytes, LLC
 * Description: Preview the editor at different widths
 * Version: 0.9.5
 */
 if( !class_exists('BlockadeSizedPreview') ) {
	class BlockadeSizedPreview {
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
			add_filter( 'wp-blockade-tinymce-plugins', array( $this, "register_tinymce_plugin" ), 50 );
			add_filter( 'wp-blockade-top-level-buttons', array( $this, "wp_blockade_top_level_buttons" ) );
			add_filter( 'admin_head', array( $this, "admin_head" ) );
		}
		// PUBLIC FUNCTIONS
		public function register_tinymce_plugin( $plugins ) {
			$plugins['blockade_sized_preview'] = $this->addon_dir_url . 'plugin.js?v=' . $this->version;
			return $plugins;
		}
		public function wp_blockade_top_level_buttons( $buttons ) {
			$buttons[] = "|";
			$buttons[] = "preview-desktop";
			$buttons[] = "preview-tablet";
			$buttons[] = "preview-phone";

			return $buttons;
		}
		public function admin_head() {
			?>
			<style>
			.mce-tinymce.mce-container {
				background-color: #eee;
			}
			.mce-tinymce .mce-edit-area {
				margin: 0 auto;
				box-shadow: 0 6px 10px rgba(0,0,0,0.19), 0 3px 3px rgba(0,0,0,0.23);
				max-width: 100%;
			}
			.mce-i-preview-desktop:before {
				font-family: "Dashicons";
				content: "\f472";
			}
			.mce-i-preview-tablet:before {
				font-family: "Dashicons";
				content: "\f471";
			}
			.mce-i-preview-phone:before {
				font-family: "Dashicons";
				content: "\f470";
			}
			</style>
			<?php
		}
	}
	BlockadeSizedPreview::Instance();
}
