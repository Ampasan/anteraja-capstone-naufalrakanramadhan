<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Bootstrap\LoadConfiguration;
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
     * Bangun aplikasi uji, lalu tanam konfigurasi uji tepat setelah konfigurasi
     * dimuat — sebelum provider di-register dan di-boot.
     *
     * Kenapa harus sedini itu: phpunit.xml menyetel env uji (DB_CONNECTION=sqlite,
     * CACHE_STORE=array, QUEUE_CONNECTION=sync, ...), tapi nilainya lewat env().
     * `php artisan config:cache` membekukan hasil env() ke
     * bootstrap/cache/config.php, sehingga saat cache itu ada seluruh blok <php>
     * phpunit.xml diabaikan dan aplikasi boot dengan konfigurasi .env:
     *
     * - DB_CONNECTION jatuh ke postgres Supabase live, lalu RefreshDatabase
     *   menjalankan migrate:fresh di sana: semua tabel dijatuhkan dan data
     *   ter-seed hilang.
     * - CACHE_STORE jatuh ke redis, jadi cache datang/antre antar test.
     * - QUEUE_CONNECTION jatuh ke redis, jadi job dispatch-nya async dan
     *   test yang menunggu hasil job langsung gagal.
     * - SESSION_DRIVER, BROADCAST_CONNECTION, MAIL_MAILER ikut produksi.
     *
     * Penyetelan lama dilakukan di refreshApplication(), yaitu setelah bootstrap
     * selesai — dan itu terlambat untuk satu kasus: AppServiceProvider::boot
     * memanggil RateLimiter::for(), instance RateLimiter ter-resolve di sana
     * membawa store cache yang berlaku saat itu (redis). Limiter login lalu
     * menulis hit-nya ke redis: hit menumpuk antar test dan antar run sehingga
     * seluruh suite berikutnya gagal 429 "Too Many Attempts.".
     *
     * LoadConfiguration adalah bootstrapper yang mengisi repo config, jadi
     * callback sesudahnya sudah keburu dijangkau RegisterProviders/BootProviders.
     * Nilai yang sama dipakai lagi di refreshApplication() sebagai jaring
     * pengaman bila urutan bootstrap berubah di versi framework berikutnya.
     */
    public function createApplication()
    {
        $app = require Application::inferBasePath().'/bootstrap/app.php';

        $app->afterBootstrapping(
            LoadConfiguration::class,
            fn () => $this->applyTestingConfiguration($app),
        );

        $this->traitsUsedByTest = array_flip(class_uses_recursive(static::class));

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }

    protected function refreshApplication()
    {
        parent::refreshApplication();

        $this->applyTestingConfiguration($this->app);
    }

    /** Paksa seluruh nilai konfigurasi uji; tidak bergantung pada env(). */
    private function applyTestingConfiguration(Application $app): void
    {
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app['config']->set('database.connections.sqlite.prefix', '');
        $app['config']->set('database.connections.sqlite.url', null);

        // Supaya `config:cache`/`optimize` tidak mengubah perilaku suite.
        $app['config']->set('cache.default', 'array');
        $app['config']->set('cache.limiter', null);
        $app['config']->set('queue.default', 'sync');
        $app['config']->set('session.driver', 'array');
        $app['config']->set('broadcasting.default', null);
        $app['config']->set('mail.default', 'array');
        $app['config']->set('hashing.bcrypt.rounds', 4);
        $app['config']->set('logging.default', 'null');
        // APP_ENV=testing dari phpunit.xml ikut membekuk; tanpa ini suite
        // jalan dengan APP_ENV .env (local) sehingga cabang `environment()`
        // di SecurityHeaders dan bootstrap/app.php berbeda dari tanpa cache.
        $app['config']->set('app.env', 'testing');
        $app['config']->set('app.maintenance.driver', 'file');
    }
}
