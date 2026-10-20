<?php
$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';
$app = require $root . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
config(['app.key' => 'base64:' . base64_encode(random_bytes(32)), 'database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'cache.default' => 'array', 'session.driver' => 'array']);
Illuminate\Support\Facades\DB::purge('sqlite');
Illuminate\Support\Facades\Schema::create('users', function ($t) {
    $t->id(); $t->string('email'); $t->string('password'); $t->string('role'); $t->rememberToken();
});
$password = bin2hex(random_bytes(20));
Illuminate\Support\Facades\DB::table('users')->insert(['email'=>'deployment-smoke@uic.edu.ph', 'password'=>Illuminate\Support\Facades\Hash::make($password), 'role'=>'Adviser']);
Illuminate\Support\Facades\Http::preventStrayRequests();
$request = App\Http\Requests\Auth\LoginRequest::create('/login', 'POST', ['identifier'=>'deployment-smoke@uic.edu.ph','password'=>$password,'mode'=>'api']);
$request->setContainer($app);
$request->authenticate();
if (!Illuminate\Support\Facades\Auth::check() || Illuminate\Support\Facades\Auth::user()->role !== 'Adviser') throw new RuntimeException('UIC local password login failed');
echo "PASS: UIC local password works with the existing API-mode login form without external requests\n";
