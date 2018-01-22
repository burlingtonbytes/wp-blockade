<?php if (!defined('ABSPATH')) {
	die();
} // Include in all php files, to prevent direct execution

if (!defined('PHP_INT_MIN')) {
	define('PHP_INT_MIN', (int)(PHP_INT_MAX + 1));
}
if (!class_exists('BBytesBetterExcerpts')) {
	class BBytesBetterExcerpts {
		private static $_this;

		public static function Instance() {
			static $instance = null;
			if ($instance === null) {
				$instance = new self();
			}
			return $instance;
		}

		private function __construct() {
// PHP_INT_MIN as priority ensures our filter runs first
			add_filter('wp_trim_words', array($this, 'wp_trim_words'), PHP_INT_MIN, 4);
		}

// Public Functions
		public function wp_trim_words($filtered_text, $num_words = 55, $more = null, $text) {
			if (null === $more) {
				$more = __('&hellip;');
			}

			$original_text = $text;
// THIS IS THE ONLY NOVEL LINE OF CODE IN THIS FUNCTION
			$text = $this->strip_all_tags($text);

			if (strpos(_x('words', 'Word count type. Do not translate!'), 'characters') === 0 && preg_match('/^utf\-?8$/i', get_option('blog_charset'))) {
				$text = trim(preg_replace("/[\n\r\t ]+/", ' ', $text), ' ');
				preg_match_all('/./u', $text, $words_array);
				$words_array = array_slice($words_array[0], 0, $num_words + 1);
				$sep = '';
			} else {
				$words_array = preg_split("/[\n\r\t ]+/", $text, $num_words + 1, PREG_SPLIT_NO_EMPTY);
				$sep = ' ';
			}

			if (count($words_array) > $num_words) {
				array_pop($words_array);
				$text = implode($sep, $words_array);
				$text = $text . $more;
			} else {
				$text = implode($sep, $words_array);
			}
			return $text;
		}

// Private Functions
		private function strip_all_tags($string, $remove_breaks = false) {
			$string = preg_replace('@<(script|style)[^>]*?>.*?</\\1>@si', '', $string);
// THIS IS THE ONLY NOVEL LINE OF CODE IN THIS FUNCTION
			$string = $this->prepend_space_to_block_elements($string);
			$string = strip_tags($string);

			if ($remove_breaks) {
				$string = preg_replace('/[\r\n\t ]+/', ' ', $string);
			}

			return trim($string);
		}

// This is the actual meat and potatos
		private function prepend_space_to_block_elements($string) {
			$block_elements = array(
				"address", "article", "aside", "blockquote",
				"br", "canvas", "dd", "div", "dl", "fieldset",
				"figcaption", "figure", "footer", "form",
				"h[1-6]", "header", "hgroup", "hr", "li", "main",
				"nav", "noscript", "ol", "output", "p", "pre",
				"section", "table", "tfoot", "ul", "video"
			);
			$block_elements = apply_filters('bbytes_block_elements', $block_elements);
			$block_elements = implode("|", $block_elements);
			$pattern = "/(?:\s*<\/?(?:" . $block_elements . ")[^>]*>\s*)+/i";
			$string = preg_replace($pattern, "\n \n$0", $string);
			$string = strip_tags($string);

			return $string;
		}
	}

	BBytesBetterExcerpts::Instance();
}
