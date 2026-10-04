<?php

namespace Tests\Unit;

use App\Services\Async\TaskTracker;
use Tests\TestCase;

/**
 * TaskTracker menyimpan status pekerjaan asinkron di Cache; status accepted
 * dan processing adalah alasan endpoint /tasks menjawab 202.
 */
class TaskTrackerTest extends TestCase
{
    public function test_accepted_task_is_retrievable_and_pending(): void
    {
        $task = TaskTracker::accepted('notifikasi_pengganti', ['courier' => 'Budi']);

        $stored = TaskTracker::get($task['id']);

        $this->assertNotNull($stored);
        $this->assertSame('accepted', $stored['status']);
        $this->assertSame('notifikasi_pengganti', $stored['type']);
        $this->assertSame('Budi', $stored['meta']['courier']);
        $this->assertTrue(TaskTracker::isPending($stored));
        $this->assertTrue(TaskTracker::isPending(['status' => 'processing']));
        $this->assertFalse(TaskTracker::isPending(['status' => 'failed']));
    }

    public function test_update_persists_status_message_and_merges_meta(): void
    {
        $task = TaskTracker::accepted('notifikasi_pengganti', ['courier' => 'Budi']);
        TaskTracker::update($task['id'], 'completed', 'Selesai.', ['attempts' => 1]);

        $stored = TaskTracker::get($task['id']);

        $this->assertSame('completed', $stored['status']);
        $this->assertSame('Selesai.', $stored['message']);
        $this->assertSame('Budi', $stored['meta']['courier']);
        $this->assertSame(1, $stored['meta']['attempts']);
        $this->assertFalse(TaskTracker::isPending($stored));
    }

    public function test_update_of_unknown_task_does_nothing(): void
    {
        $unknown = (string) \Illuminate\Support\Str::uuid();

        TaskTracker::update($unknown, 'failed', 'Gagal.');

        $this->assertNull(TaskTracker::get($unknown));
    }

    public function test_get_rejects_id_that_is_not_a_uuid(): void
    {
        $this->assertNull(TaskTracker::get('bukan-uuid'));
        $this->assertNull(TaskTracker::get((string) \Illuminate\Support\Str::uuid()));
    }
}
