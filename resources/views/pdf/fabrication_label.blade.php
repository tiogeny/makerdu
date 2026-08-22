<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Hoja de Rotulado de Fabricación - Makerdu</title>
    <style>
        body { font-family: sans-serif; margin: 20px; font-size: 11px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 18px; font-weight: bold; color: #0f172a; }
        .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
        .grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .grid th, .grid td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        .grid th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
        .card { border: 2px dashed #0284c7; padding: 10px; margin-bottom: 12px; page-break-inside: avoid; border-radius: 6px; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; }
        .badge-fc { background: #fef3c7; color: #92400e; }
        .badge-status { background: #e0f2fe; color: #0369a1; }
        .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">MAKERDU - ORQUESTADOR DE FABRICACIÓN DIGITAL</div>
        <div class="subtitle">Hoja de Rotulado y Orden de Impresión 3D / Corte Láser (Lote #{{ $batch->id }})</div>
        <div style="margin-top: 6px; font-size: 10px;">
            <strong>Aula:</strong> {{ $classroom->name }} | <strong>Código:</strong> {{ $classroom->access_code }} | <strong>Fecha:</strong> {{ date('d/m/Y H:i') }}
        </div>
    </div>

    @foreach($squads as $squad)
        <div class="card">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 70%; vertical-align: top;">
                        <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #0284c7;">ESCUADRA: {{ $squad->name }}</h3>
                        <p style="margin: 0 0 4px 0;"><strong>Integrantes:</strong> {{ $squad->members->pluck('name')->implode(', ') }}</p>
                        <p style="margin: 0 0 4px 0;"><strong>Proyecto:</strong> {{ $project->title_json['es'] ?? 'Sellos 2.5D' }}</p>
                        <p style="margin: 0;"><strong>Parámetros FabLab:</strong> Material: PLA 1.75mm | Relleno: 20% | Boquilla: 0.4mm</p>
                    </td>
                    <td style="width: 30%; vertical-align: top; text-align: right;">
                        <span class="badge badge-fc">CONSUMO: 25 FC</span><br>
                        <span class="badge badge-status" style="margin-top: 4px;">ESTADO: LISTO PARA IMPRIMIR</span>
                        <p style="font-family: monospace; font-size: 9px; margin-top: 8px; color: #64748b;">ID REF: MK-BAT-{{ $batch->id }}-SQ{{ $squad->id }}</p>
                    </td>
                </tr>
            </table>
        </div>
    @endforeach

    <div class="footer">
        Documento generado automáticamente por el Engine de Fabricación Makerdu v2.6 para el Técnico del FabLab.
    </div>
</body>
</html>