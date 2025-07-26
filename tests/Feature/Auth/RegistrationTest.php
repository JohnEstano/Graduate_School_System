<?php

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function () {

    \Illuminate\Support\Facades\Event::fake();

    $response = $this->post('/register', [
        'first_name' => 'Test',
        'middle_name' => 'Mid',
        'last_name' => 'User',   
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'school_id' => '2023-12345',
        'role' => 'Student',
    ]);

    $this->assertAuthenticated(); 
    $response->assertRedirect(route('dashboard', absolute: false)); 
});
