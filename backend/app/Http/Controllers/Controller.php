<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseController;

class Controller extends BaseController
{
    /**
     * Response sukses dengan format envelope yang konsisten.
     */
    protected function success(mixed $data = null, string $message = 'OK', int $code = 200): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'data' => $data,
            'message' => $message,
        ], $code);
    }

    /**
     * Response error dengan format envelope yang konsisten.
     */
    protected function error(string $message, int $code = 400): JsonResponse
    {
        return response()->json([
            'ok' => false,
            'data' => null,
            'message' => $message,
        ], $code);
    }
}
