<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Tarjetas Maker de Acceso PIN - {{ $classroom->name }}</title>
    <style>
        @page {
            margin: 15mm 10mm;
            size: a4 portrait;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #ffffff;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .header h1 {
            font-size: 18px;
            margin: 0;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header p {
            font-size: 11px;
            margin: 4px 0 0 0;
            color: #64748b;
        }
        .cards-grid {
            width: 100%;
        }
        .card-cell {
            width: 50%;
            padding: 6px;
            vertical-align: top;
        }
        .card {
            border: 2px dashed #94a3b8;
            border-radius: 12px;
            padding: 12px;
            background: #f8fafc;
            page-break-inside: avoid;
        }
        .card-header {
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .card-title {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin: 0;
        }
        .card-squad {
            font-size: 10px;
            color: #0284c7;
            font-weight: bold;
        }
        .pin-box {
            background: #0f172a;
            color: #38bdf8;
            padding: 8px;
            border-radius: 8px;
            text-align: center;
            margin: 8px 0;
        }
        .pin-label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
            display: block;
        }
        .pin-code {
            font-size: 22px;
            font-family: 'Courier', monospace;
            font-weight: bold;
            letter-spacing: 4px;
        }
        .card-footer {
            font-size: 9px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            margin-top: 6px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>TARJETAS DE ACCESO AL TALLER MAKER</h1>
        <p>Aula: <strong>{{ $classroom->name }}</strong> • Código de Clase: <strong>{{ $classroom->access_code }}</strong> • Docente: {{ $classroom->teacher->name ?? 'Profesor' }}</p>
    </div>

    <table class="cards-grid" cellspacing="0" cellpadding="0">
        @php $students = $classroom->squads->flatMap->members; @endphp
        @foreach($students->chunk(2) as $row)
            <tr>
                @foreach($row as $student)
                    <td class="card-cell">
                        <div class="card">
                            <div class="card-header">
                                <p class="card-title">{{ $student->name }}</p>
                                <p class="card-squad">Escuadra: {{ $student->squads->first()->name ?? 'Escuadra Maker' }} • Rol: {{ $student->pivot->current_role ?? 'Maker' }}</p>
                            </div>

                            <div class="pin-box">
                                <span class="pin-label">CÓDIGO DE CLASE + TU PIN SECRETO</span>
                                <div class="pin-code">{{ $classroom->access_code }} • {{ $student->pin }}</div>
                            </div>

                            <div class="card-footer">
                                ✂️ Recortar por la línea punteada y llevar a la mesa de trabajo de la escuadra.
                            </div>
                        </div>
                    </td>
                @endforeach
                @if($row->count() == 1)
                    <td class="card-cell"></td>
                @endif
            </tr>
        @endforeach
    </table>

</body>
</html>
