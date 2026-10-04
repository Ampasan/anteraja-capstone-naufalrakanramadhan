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
}
