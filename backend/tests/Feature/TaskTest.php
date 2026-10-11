<?php

namespace Tests\Feature;

use App\Services\Async\TaskTracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Endpoint tugas menjawab 202 selama worker masih memproses dan 200 begitu
 * statusnya tuntas; id yang tak dikenal (termasuk bukan uuid) menjawab 404.
 */
class TaskTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api/tasks';

    protected function setUp(): void
    {
        parent::setUp();

        $this->actingAsAdmin();
    }

    public function test_unknown_uuid_returns_404(): void
    {
        $this->getJson(self::BASE . '/' . Str::uuid())
            ->assertStatus(404)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_non_uuid_id_returns_404(): void
    {
        $this->getJson(self::BASE . '/bukan-uuid')
            ->assertStatus(404)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_accepted_task_answers_202(): void
    {
        $task = TaskTracker::accepted('notifikasi_pengganti', ['courier' => 'Budi']);

        $this->getJson(self::BASE . '/' . $task['id'])
            ->assertStatus(202)
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.message', 'Permintaan diterima, menunggu diproses.');
    }

    public function test_processing_task_answers_202(): void
    {
        $task = TaskTracker::accepted('notifikasi_pengganti');
        TaskTracker::update($task['id'], 'processing', 'Sedang dikirim.');

        $this->getJson(self::BASE . '/' . $task['id'])
            ->assertStatus(202)
            ->assertJsonPath('data.status', 'processing');
    }

    public function test_completed_task_answers_200(): void
    {
        $task = TaskTracker::accepted('notifikasi_pengganti');
        TaskTracker::update($task['id'], 'completed', 'Notifikasi terkirim.');

        $this->getJson(self::BASE . '/' . $task['id'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.message', 'Notifikasi terkirim.');
    }

    public function test_failed_task_answers_200(): void
    {
        $task = TaskTracker::accepted('notifikasi_pengganti');
        TaskTracker::update($task['id'], 'failed', 'Notifikasi gagal.');

        $this->getJson(self::BASE . '/' . $task['id'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'failed');
    }
}
