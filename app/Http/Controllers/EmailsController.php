<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeMail;

class EmailsController extends Controller
{
    public function welcomeEmail()
    {
       Mail::to('japzdiapana@gmail.com')->queue(new WelcomeMail());
       return "Email Queued";
    }
}
