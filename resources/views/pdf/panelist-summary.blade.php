<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $program->name }} - Honorarium Summary</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 5px; text-align: left; }
        th { background-color: #f0f0f0; }
    </style>
</head>
<body>
    <h2>{{ $program->name }} ({{ $program->program }})</h2>
    <p>Honorarium summary - Last updated: {{ $program->date_edited }}</p>

    @foreach ($program->panelistRecords as $panelist)
        <h3>{{ $panelist->pfirst_name }} {{ $panelist->pmiddle_name }} {{ $panelist->plast_name }}</h3>
        <p>Role: {{ $panelist->role ?? 'N/A' }} | Defense Type: {{ $panelist->defense_type ?? 'N/A' }} | Amount: ₱{{ number_format($panelist->amount, 2) }}</p>

        <table>
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Course/Section</th>
                    <th>School Year</th>
                    <th>Defense Status</th>
                    <th>Payment Date</th>
                    <th>Amount Paid</th>
                </tr>
            </thead>
            <tbody>
            @forelse ($panelist->students as $student)
                @forelse ($student->payments as $payment)
                    <tr>
                        <td>{{ $student->first_name }} {{ $student->middle_name }} {{ $student->last_name }}</td>
                        <td>{{ $student->course_section }}</td>
                        <td>{{ $student->school_year }}</td>
                        <td>{{ $payment->defense_status }}</td>
                        <td>{{ \Carbon\Carbon::parse($payment->payment_date)->format('m/d/Y') }}</td>
                        <td>₱{{ number_format($payment->amount, 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6">No payments found.</td>
                    </tr>
                @endforelse
            @empty
                <tr>
                    <td colspan="6">No students assigned.</td>
                </tr>
            @endforelse
            </tbody>
        </table>
    @endforeach
</body>
</html>
