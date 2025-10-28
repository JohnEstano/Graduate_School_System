<?php

echo "\n=== PHP GD EXTENSION CHECK ===\n\n";

// Check if GD is loaded
if (extension_loaded('gd')) {
    echo "✅ GD Extension is ENABLED\n\n";
    
    // Get GD info
    $gdInfo = gd_info();
    echo "GD Version: " . $gdInfo['GD Version'] . "\n";
    echo "FreeType Support: " . ($gdInfo['FreeType Support'] ? 'Yes' : 'No') . "\n";
    echo "PNG Support: " . ($gdInfo['PNG Support'] ? 'Yes' : 'No') . "\n";
    echo "JPEG Support: " . ($gdInfo['JPEG Support'] ? 'Yes' : 'No') . "\n";
    echo "GIF Support: " . ($gdInfo['GIF Read Support'] || $gdInfo['GIF Create Support'] ? 'Yes' : 'No') . "\n";
    echo "WebP Support: " . ($gdInfo['WebP Support'] ? 'Yes' : 'No') . "\n\n";
    
    echo "✅ PDF generation should work now!\n\n";
} else {
    echo "❌ GD Extension is NOT ENABLED\n\n";
    echo "To enable GD extension:\n";
    echo "1. Open C:\\xampp\\php\\php.ini as Administrator\n";
    echo "2. Find the line: ;extension=gd\n";
    echo "3. Remove the semicolon: extension=gd\n";
    echo "4. Save the file\n";
    echo "5. Restart Apache in XAMPP Control Panel\n";
    echo "6. Run this script again to verify\n\n";
}

// Check PHP version
echo "PHP Version: " . PHP_VERSION . "\n";
echo "PHP Configuration File: " . php_ini_loaded_file() . "\n\n";
