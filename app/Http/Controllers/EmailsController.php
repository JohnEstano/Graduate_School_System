<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeMail;

class EmailsController extends Controller
{
    public function welcomeEmail()
    {
       Mail::to('jestano_230000001603@uic.edu.ph')->send(new WelcomeMail());
       return "Email Sent";
    }
}
