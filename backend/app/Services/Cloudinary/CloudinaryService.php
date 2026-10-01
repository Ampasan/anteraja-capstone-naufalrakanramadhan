<?php

namespace App\Services\Cloudinary;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;

class CloudinaryService
{
    private Cloudinary $cloudinary;

    public function __construct()
    {
        $credentials = $this->credentials();

        $this->cloudinary = new Cloudinary([
            'cloud' => $credentials,
        ]);
    }

    /**
     * Ambil kredensial Cloudinary dari config (bukan env() langsung,
     * karena env() tidak tersedia setelah `php artisan config:cache`).
     */
    private function credentials(): array
    {
        // Prioritas: nilai terpisah dulu, lalu parse dari CLOUDINARY_URL
        if (config('cloudinary.api_key') && config('cloudinary.api_secret')) {
            return [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key' => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
            ];
        }

        return [
            'cloud_name' => $this->extractCloudName(),
            'api_key' => $this->extractFromUrl('api_key'),
            'api_secret' => $this->extractFromUrl('api_secret'),
        ];
    }

    /**
     * Extract cloud name dari CLOUDINARY_URL.
     */
    private function extractCloudName(): string
    {
        $url = (string) config('cloudinary.cloud_url');
        if (preg_match('#cloudinary://[^:]+:[^@]+@([^/]+)#', $url, $matches)) {
            return $matches[1];
        }
        return (string) config('cloudinary.cloud_name');
    }

    /**
     * Extract api_key / api_secret dari CLOUDINARY_URL.
     * Format: cloudinary://{api_key}:{api_secret}@{cloud_name}
     */
    private function extractFromUrl(string $part): ?string
    {
        $url = (string) config('cloudinary.cloud_url');
        if (preg_match('#cloudinary://([^:]+):([^@]+)@#', $url, $matches)) {
            return $part === 'api_key' ? $matches[1] : $matches[2];
        }
        return config("cloudinary.{$part}");
    }

    /**
     * Upload foto bukti insiden ke Cloudinary.
     */
    public function uploadEvidence(UploadedFile $file, string $folder = 'foto_bukti'): array
    {
        $uploadResult = $this->cloudinary->uploadApi()->upload(
            $file->getRealPath(),
            [
                'folder' => $folder,
                'resource_type' => 'image',
                'overwrite' => false,
            ]
        );

        return [
            'secure_url' => $uploadResult['secure_url'],
            'public_id' => $uploadResult['public_id'],
            'format' => $uploadResult['format'] ?? null,
            'bytes' => $uploadResult['bytes'] ?? null,
        ];
    }

    /**
     * Hapus foto dari Cloudinary.
     */
    public function deleteEvidence(string $publicId): bool
    {
        try {
            $this->cloudinary->uploadApi()->destroy($publicId);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Generate URL transformasi untuk foto.
     */
    public function getTransformedUrl(string $publicId, array $options = []): string
    {
        $defaults = [
            'width' => 800,
            'height' => 600,
            'crop' => 'fill',
            'quality' => 'auto',
        ];

        $options = array_merge($defaults, $options);

        return $this->cloudinary->image($publicId)
            ->resize(\Cloudinary\Transformation\Resize::fill($options['width'], $options['height']))
            ->quality($options['quality'])
            ->toUrl();
    }
}
