<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'description'];

    public $timestamps = true;

    /**
     * Get a setting value with type casting
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, $value, ?string $type = null, ?string $description = null): self
    {
        // Determine type if not provided
        if ($type === null) {
            $type = match (true) {
                is_bool($value) => 'boolean',
                is_int($value) => 'integer',
                is_array($value) => 'json',
                default => 'string'
            };
        }

        // Encode value for storage
        $encodedValue = match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value),
            default => (string)$value
        };

        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $encodedValue,
                'type' => $type,
                'description' => $description
            ]
        );
    }

    /**
     * Cast value to appropriate type
     */
    private static function castValue($value, ?string $type)
    {
        return match ($type) {
            'boolean' => (bool)$value || $value === '1',
            'integer' => (int)$value,
            'json' => json_decode($value, true),
            default => $value
        };
    }
}
