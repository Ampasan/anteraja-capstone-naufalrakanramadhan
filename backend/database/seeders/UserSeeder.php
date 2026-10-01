<?php

namespace Database\Seeders;

use App\Models\Hub;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Seed 3 user admin untuk Hub Halim - Jakarta Timur.
     * Password default: Anteraja2026!
     */
    public function run(): void
    {
        $hub = Hub::where('hub_code', 'HUB-JAKTIM-HALIM')->firstOrFail();

        $users = [
            [
                'name' => 'Siti Rahmawati',
                'email' => 'siti.admin@anteraja.id',
            ],
            [
                'name' => 'Reza Bramantyo',
                'email' => 'reza.bramantyo@anteraja.id',
            ],
            [
                'name' => 'Dewi Lestari',
                'email' => 'dewi.cc@anteraja.id',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'hub_id' => $hub->id,
                    'name' => $userData['name'],
                    'password_hash' => Hash::make('Anteraja2026!'),
                    'role' => 'ADMIN',
                    'status' => 'ACTIVE',
                ]
            );
        }
    }
}
