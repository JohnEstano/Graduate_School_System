<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Honorarium Summary</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            margin: 30px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Honorarium Summary Report</div>
        <div class="subtitle">{{ $record->name }}</div>
        <div>Generated on: {{ now()->format('F d, Y') }}</div>
    </div>

    <div class="section">
        <div class="section-title">Program Details</div>
        <table>
            <tr>
                <th width="30%">Program Name</th>
                <td>{{ $record->name }}</td>
            </tr>
            <tr>
                <th>Last Updated</th>
                <td>{{ $record->date_edited ? date('F d, Y', strtotime($record->date_edited)) : 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Panelist Summary</div>
        <table>
            <thead>
                <tr>
                    <th>Panelist Name</th>
                    <th>Role</th>
                    {{-- <th>Defense Type</th> --}}
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($panelists as $panelist)
                <tr>
                    <td>{{ $panelist->pfirst_name }} {{ $panelist->pmiddle_name }} {{ $panelist->plast_name }}</td>
                    <td>{{ $panelist->role ?? 'N/A' }}</td>
                    {{-- <td>{{ collect($panelist->students ?? [])->pluck('defense_type')->filter()->unique()->implode(', ') ?: 'N/A' }}</td> --}}
                    <td>₱{{ number_format(collect($panelist->students ?? [])->flatMap(fn($student) => collect($student->payments ?? []))->sum('amount') ?? 0, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    
</body>
</html>