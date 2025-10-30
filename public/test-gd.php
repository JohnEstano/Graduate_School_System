<?php
header('Content-Type: text/plain');

echo "=== PHP GD Extension Test ===\n\n";

if (extension_loaded('gd')) {
    echo "✓ GD Extension: LOADED\n";
    
    $info = gd_info();
    echo "\nGD Version: " . ($info['GD Version'] ?? 'Unknown') . "\n";
    echo "PNG Support: " . ($info['PNG Support'] ? 'YES' : 'NO') . "\n";
    echo "JPEG Support: " . ($info['JPEG Support'] ? 'YES' : 'NO') . "\n";
    echo "GIF Support: " . ($info['GIF Read Support'] ? 'YES' : 'NO') . "\n";
} else {
    echo "✗ GD Extension: NOT LOADED\n";
    echo "\nPlease enable GD extension:\n";
    echo "1. Edit C:\\xampp\\php\\php.ini\n";
    echo "2. Find ';extension=gd' and change to 'extension=gd'\n";
    echo "3. Restart Apache\n";
}

echo "\n=== Testing Image Creation ===\n\n";

try {
    $img = imagecreatetruecolor(100, 50);
    if ($img) {
        echo "✓ Can create images\n";
        imagedestroy($img);
    } else {
        echo "✗ Cannot create images\n";
    }
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
