<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "<h1>PHP GD Extension Check (Web Server)</h1>";

echo "<h2>PHP Version: " . PHP_VERSION . "</h2>";
echo "<p><strong>PHP Configuration File:</strong> " . php_ini_loaded_file() . "</p>";

echo "<h2>GD Extension Status:</h2>";

if (extension_loaded('gd')) {
    echo "<p style='color: green; font-weight: bold;'>✅ GD Extension is ENABLED</p>";
    
    $gdInfo = gd_info();
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>Feature</th><th>Status</th></tr>";
    echo "<tr><td>GD Version</td><td>" . $gdInfo['GD Version'] . "</td></tr>";
    echo "<tr><td>FreeType Support</td><td>" . ($gdInfo['FreeType Support'] ? 'Yes' : 'No') . "</td></tr>";
    echo "<tr><td>PNG Support</td><td>" . ($gdInfo['PNG Support'] ? 'Yes' : 'No') . "</td></tr>";
    echo "<tr><td>JPEG Support</td><td>" . ($gdInfo['JPEG Support'] ? 'Yes' : 'No') . "</td></tr>";
    echo "<tr><td>GIF Support</td><td>" . ($gdInfo['GIF Read Support'] || $gdInfo['GIF Create Support'] ? 'Yes' : 'No') . "</td></tr>";
    echo "<tr><td>WebP Support</td><td>" . (isset($gdInfo['WebP Support']) && $gdInfo['WebP Support'] ? 'Yes' : 'No') . "</td></tr>";
    echo "</table>";
    
    echo "<p style='color: green;'>✅ PDF generation should work!</p>";
} else {
    echo "<p style='color: red; font-weight: bold;'>❌ GD Extension is NOT ENABLED</p>";
    echo "<div style='background: #fee; padding: 15px; border-left: 4px solid red;'>";
    echo "<h3>To enable GD extension:</h3>";
    echo "<ol>";
    echo "<li>Open <code>C:\\xampp\\php\\php.ini</code> as Administrator</li>";
    echo "<li>Find the line: <code>;extension=gd</code></li>";
    echo "<li>Remove the semicolon: <code>extension=gd</code></li>";
    echo "<li>Save the file</li>";
    echo "<li>Restart Apache in XAMPP Control Panel</li>";
    echo "<li>Refresh this page to verify</li>";
    echo "</ol>";
    echo "</div>";
}

echo "<h2>All Loaded Extensions:</h2>";
echo "<pre>" . implode(", ", get_loaded_extensions()) . "</pre>";

// Test if we can create an image
echo "<h2>GD Function Test:</h2>";
if (extension_loaded('gd')) {
    try {
        $img = imagecreatetruecolor(100, 100);
        if ($img) {
            imagedestroy($img);
            echo "<p style='color: green;'>✅ Successfully created a test image with GD</p>";
        } else {
            echo "<p style='color: red;'>❌ Failed to create a test image</p>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
    }
}
