<?php

namespace Tests\Support;

use App\Models\Hub;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\HubSeeder;

/**
 * Akses ke data seeder yang deterministik: hub Halim dan admin bawaan seeder.
 *
 * Password admin selalu 'Anteraja2026!' (lihat UserSeeder) bila sebuah uji
 * perlu login sungguhan lewat POST /api/auth/login.
 */
trait SeedsHalim
{
    /** Panel cukup ditanam sekali per uji; penanaman ulang menimpa data yang sudah diubah. */
    private bool $panelSeeded = false;

    /** Seed seluruh data panel (hub, user, kurir, order, insiden, audit). */
    protected function seedPanel(): void
    {
        if ($this->panelSeeded) {
            return;
        }

        $this->seed(DatabaseSeeder::class);
        $this->panelSeeded = true;
    }

    protected function halimHub(): Hub
    {
        if (Hub::count() === 0) {
            $this->seed(HubSeeder::class);
        }

        return Hub::where('hub_code', 'HUB-JAKTIM-HALIM')->firstOrFail();
    }

    protected function halimAdmin(): User
    {
        $this->seedPanel();

        return User::where('email', 'siti.admin@anteraja.id')->firstOrFail();
    }

    /**
     * Pasang token asli tanpa login lewat HTTP.
     *
     * Sanctum::actingAs tidak bisa dipakai: App\Models\User tidak mengimplement
     * Authenticatable sehingga guard menolak setUser().
     */
    protected function actingAsAdmin(?User $user = null): User
    {
        $user ??= $this->halimAdmin();
        $token = $user->createToken('phpunit')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token);

        return $user;
    }
}
