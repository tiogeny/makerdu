<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentAuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Student/Login', [
            'defaultClassCode' => 'MK402',
            'demoPin' => '1234',
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'access_code' => ['required', 'string'],
            'pin' => ['required', 'string', 'size:4'],
        ]);

        $code = strtoupper(trim(str_replace('-', '', $request->access_code)));

        $classroom = Classroom::with(['squads.members'])->where('access_code', $code)->first();

        if (!$classroom) {
            return back()->withErrors(['access_code' => 'Código de clase no encontrado.']);
        }

        // Buscar alumno por PIN dentro de las escuadras del aula
        $matchedStudent = null;
        $matchedSquad = null;

        foreach ($classroom->squads as $squad) {
            foreach ($squad->members as $member) {
                if ($member->pin === $request->pin) {
                    $matchedStudent = $member;
                    $matchedSquad = $squad;
                    break 2;
                }
            }
        }

        if (!$matchedStudent) {
            return back()->withErrors(['pin' => 'PIN incorrecto para esta clase.']);
        }

        Auth::login($matchedStudent);
        session([
            'active_squad_id' => $matchedSquad->id,
            'active_student_id' => $matchedStudent->id,
        ]);

        return redirect()->route('student.hud');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('student.login');
    }
}