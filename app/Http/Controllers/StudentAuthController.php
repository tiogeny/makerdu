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
        $demoFabbers = [
            ['name' => 'Henry Sánchez', 'short_name' => 'Henry', 'pin' => '1010', 'code' => 'MK2026', 'avatar' => 'HS'],
            ['name' => 'Benito Juarez', 'short_name' => 'Benito', 'pin' => '1001', 'code' => 'MK2026', 'avatar' => 'BJ'],
            ['name' => 'María Angela Mejía', 'short_name' => 'María Angela', 'pin' => '1002', 'code' => 'MK2026', 'avatar' => 'MM'],
            ['name' => 'Delia Barriga', 'short_name' => 'Delia', 'pin' => '1003', 'code' => 'MK2026', 'avatar' => 'DB'],
            ['name' => 'Grace Schwan', 'short_name' => 'Grace', 'pin' => '1004', 'code' => 'MK2026', 'avatar' => 'GS'],
            ['name' => 'Silvana Espinoza', 'short_name' => 'Silvana', 'pin' => '1005', 'code' => 'MK2026', 'avatar' => 'SE'],
            ['name' => 'Hayashi Mateo', 'short_name' => 'Hayashi', 'pin' => '1006', 'code' => 'MK2026', 'avatar' => 'HM'],
            ['name' => 'Esteban Valladares', 'short_name' => 'Esteban', 'pin' => '1007', 'code' => 'MK2026', 'avatar' => 'EV'],
            ['name' => 'Evelyn Cuadrado', 'short_name' => 'Evelyn', 'pin' => '1008', 'code' => 'MK2026', 'avatar' => 'EC'],
            ['name' => 'Victor Freundt', 'short_name' => 'Victor', 'pin' => '1009', 'code' => 'MK2026', 'avatar' => 'VF'],
        ];

        return Inertia::render('Student/Login', [
            'defaultClassCode' => 'MK2026',
            'demoPin' => '1010',
            'demoFabbers' => $demoFabbers,
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

        return redirect()->route('student.studio');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('student.login');
    }
}