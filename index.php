<?php define('exqrsion', true);

//
// Exqrsion (ex'QR'sion, pronounce as ex'cur'sion) is a web application
// for QR code backed didactic trails such as nature trails. Virtual trails
// consist of a set of spots, each spot refered to by a unique ID used in
// links placed in QR code badges situated in the landscape.
// By visiting the obfuscated URLs (prevent cheating) provided by QR code 
// badges, spots can be logged. The spots' page can be revisited as long as
// the encrypted cookie is valid.
// 

define('primary_url', 'trail.example.org'); // primary application URL
define('gateway_url', 'qrc.example.org'); // used for QR code URLs, can be the same as primary_url
define('encrypt_key', ''); // encryption key, use only appropriate keys
define('cookie_name', 'qr_trail'); // cookie name
define('cookie_lifetime', 86400 * 30); // lifetime in seconds for for cookie
define('trails_dir', 'trails'); // location if XML trails

// Load trail from XML file and perform some simple consistency checks.
function load_xml_trail($id) {
  $trail = simplexml_load_file(trails_dir."/{$id}.xml");
  if (empty($trail->title)) {
    throw new Exception("missing tag 'title', required as child of tag 'trail'.");
  }
  if (empty($trail->spots)) {
    throw new Exception("missing tag 'spots', required as child of tag 'trail'.");
  }
  if (empty($trail->spots->spot)) {
    throw new Exception("missing tag 'spot', required as child of tag 'spots'.");
  }
  foreach ($trail->spots->spot as $spot) {
    if (empty($spot->title)) {
      throw new Exception("missing tag 'title', required as child of tag 'spot'.");
    }
    if (empty($spot->content)) {
      throw new Exception("missing tag 'content', required as child of tag 'spot'.");
    }
  }
  return $trail;
}

// process
