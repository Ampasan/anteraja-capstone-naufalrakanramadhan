<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Guard Sanctum menyimpan user hasil resolve pertama dan tidak mereset diri
     * antar request, sehingga request kedua dalam satu uji masih memakai token
     * request sebelumnya. Guard dibuang tiap panggilan supaya tiap request
     * memverifikasi token-nya sendiri.
     */
    public function call($method, $uri, $parameters = [], $cookies = [], $files = [], $server = [], $content = null)
    {
        $this->app['auth']->forgetGuards();

        return parent::call($method, $uri, $parameters, $cookies, $files, $server, $content);
    }

    /**
     * Kunci keselamatan: suite SELALU jalan di konfigurasi uji, bukan
     * konfigurasi produksi yang tertinggal di cache.
     *
     * phpunit.xml sudah menyetel env uji (DB_CONNECTION=sqlite,
     * CACHE_STORE=array, QUEUE_CONNECTION=sync, ...), tapi nilainya lewat
     * env() — dan `php artisan config:cache` membekukan hasil env() ke
     * bootstrap/cache/config.php. Saat cache itu ada, seluruh blok <php>
     * phpunit.xml diabaikan sepenuhnya:
     *
     * - DB_CONNECTION jatuh ke postgres Supabase live, lalu RefreshDatabase
     *   menjalankan migrate:fresh di sana: semua tabel dijatuhkan dan data
     *   ter-seed hilang.
     * - CACHE_STORE jatuh ke redis, jadi cache datang/antre antar test.
     * - QUEUE_CONNECTION jatuh ke redis, jadi job dispatch-nya async dan
     *   test yang menunggu hasil job langsung gagal.
     * - SESSION_DRIVER, BROADCAST_CONNECTION, MAIL_MAILER ikut produksi.
     *
     * Karena itu semua nilainya dipaksa ulang di sini, tidak hanya database.
     * refreshApplication() dipanggil tepat sebelum setUpTraits()
     * (lihat InteractsWithTestCaseLifecycle), jadi belum ada migrasi,
     * job, maupun request yang sempat berjalan dengan nilai cache.
     */
    protected function refreshApplication()
    {
        parent::refreshApplication();

        $this->app['config']->set('database.default', 'sqlite');
        $this->app['config']->set('database.connections.sqlite.database', ':memory:');
        $this->app['config']->set('database.connections.sqlite.prefix', '');
        $this->app['config']->set('database.connections.sqlite.url', null);

        // Supaya `config:cache`/`optimize` tidak mengubah perilaku suite.
        $this->app['config']->set('cache.default', 'array');
        $this->app['config']->set('queue.default', 'sync');
        $this->app['config']->set('session.driver', 'array');
        $this->app['config']->set('broadcasting.default', null);
        $this->app['config']->set('mail.default', 'array');
        $this->app['config']->set('hashing.bcrypt.rounds', 4);
        $this->app['config']->set('logging.default', 'null');
        // APP_ENV=testing dari phpunit.xml ikut membekuk; tanpa ini suite
        // jalan dengan APP_ENV .env (local) sehingga cabang `environment()`
        // di SecurityHeaders dan bootstrap/app.php berbeda dari tanpa cache.
        $this->app['config']->set('app.env', 'testing');
        $this->app['config']->set('app.maintenance.driver', 'file');
    }
}
