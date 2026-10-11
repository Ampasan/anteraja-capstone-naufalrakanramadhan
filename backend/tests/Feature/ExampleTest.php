<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * Halaman pembuka backend tetap menjawab 200.
     *
     * URL ditulis absolut: helper uji menempelkan path `APP_URL` (subfolder
     * XAMPP) di depan URI relatif, sehingga `/` akan terbaca sebagai
     * `/anteraja-capstone/backend/public` dan berakhir 404.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('http://localhost/');

        $response->assertStatus(200);
    }
}
