<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private AuthService $authService
    ) {}

    /**
     * Login admin hub.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->login(
                $request->input('email'),
                $request->input('password'),
                $request->input('hub_id')
            );

            return $this->success($result, 'Login berhasil');
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Kredensial ditolak AuthService (email/password salah, akun tidak
            // aktif) — ini kegagalan autentikasi, jadi 401 sesuai tabel kode
            // error di API_DOCUMENTATION.md. Field yang kosong/format salah
            // tetap 422 karena divalidasi FormRequest sebelum sampai ke sini.
            $errors = $e->errors();
            $message = $errors['email'][0] ?? $errors['password'][0] ?? $errors['hub_id'][0] ?? 'Login gagal';
            return response()->json([
                'ok' => false,
                'data' => null,
                'message' => $message,
            ], 401);
        } catch (\Exception $e) {
            // Error tak terduga - log untuk debugging
            \Illuminate\Support\Facades\Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'ok' => false,
                'data' => null,
                'message' => 'Terjadi kesalahan pada server. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Logout admin.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return $this->success(null, 'Logout berhasil');
    }

    /**
     * Get data user yang sedang login.
     */
    public function me(Request $request): JsonResponse
    {
        return $this->success($this->authService->me($request->user()));
    }
}
