<?php

namespace App\Services\Async;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Penanda status pekerjaan asinkron (queue job).
 */
class TaskTracker
{
    /** Lamanya status disimpan — cukup untuk beberapa kali percobaan baca. */
    private const TTL_SECONDS = 3600;

    private static function key(string $taskId): string
    {
        return "task_status_{$taskId}";
    }

    /**
     * Catat permintaan yang baru diterima dan belum dikerjakan worker.
     *
     * @param  array<string, mixed>  $meta
     * @return array<string, mixed>
     */
    public static function accepted(string $type, array $meta = []): array
    {
        $taskId = (string) Str::uuid();

        $task = [
            'id' => $taskId,
            'type' => $type,
            'status' => 'accepted',
            'message' => 'Permintaan diterima, menunggu diproses.',
            'meta' => $meta,
            'created_at' => now()->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ];

        Cache::put(self::key($taskId), $task, self::TTL_SECONDS);

        return $task;
    }

    /**
     * Perbarui status tugas. Aman dipanggil dari worker queue.
     *
     * @param  array<string, mixed>  $meta
     */
    public static function update(string $taskId, string $status, string $message, array $meta = []): void
    {
        $task = self::get($taskId);
        if ($task === null) {
            return;
        }

        $task['status'] = $status;
        $task['message'] = $message;
        $task['updated_at'] = now()->toIso8601String();
        $task['meta'] = array_merge($task['meta'] ?? [], $meta);

        Cache::put(self::key($taskId), $task, self::TTL_SECONDS);
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function get(string $taskId): ?array
    {
        if (! Str::isUuid($taskId)) {
            return null;
        }

        $task = Cache::get(self::key($taskId));

        return is_array($task) ? $task : null;
    }

    /** Status yang masih dikerjakan — layak dijawab dengan HTTP 202. */
    public static function isPending(?array $task): bool
    {
        return in_array($task['status'] ?? '', ['accepted', 'processing'], true);
    }
}