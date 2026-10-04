<?php

namespace App\Http\Controllers;

use App\Services\Async\TaskTracker;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller
{
    /**
     * GET /api/tasks/{id}
     * Status pekerjaan asinkron (notifikasi pengalihan, dsb.).
     *
     * 202 Accepted -> masih dikerjakan worker (accepted / processing)
     * 200 OK       -> sudah selesai (completed / failed)
     * 404          -> id tidak dikenal atau sudah kedaluwarsa
     */
    public function show(string $id): JsonResponse
    {
        $task = TaskTracker::get($id);

        if ($task === null) {
            return $this->error('Status tugas tidak ditemukan atau sudah kedaluwarsa.', 404);
        }

        return $this->success($task, (string) $task['message'], TaskTracker::isPending($task) ? 202 : 200);
    }
}