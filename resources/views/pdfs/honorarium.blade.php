<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 2cm;
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
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Honorarium Payment Record</div>
        <div>Generated on: {{ date('F d, Y') }}</div>
    </div>

    <div class="section">
        <div class="section-title">Panelist Information</div>
        <table>
            <tr>
                <th>Name</th>
                <td>{{ $panelist->pfirst_name }} {{ $panelist->pmiddle_name }} {{ $panelist->plast_name }}</td>
            </tr>
            <tr>
                <th>Role</th>
                <td>{{ $panelist->role }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Student Information</div>
        <table>
            <tr>
                <th>Name</th>
                <td>{{ $student->first_name }} {{ $student->middle_name }} {{ $student->last_name }}</td>
            </tr>
            <tr>
                <th>Program</th>
                <td>{{ $student->program }}</td>
            </tr>
            <tr>
                <th>Student ID</th>
                <td>{{ $student->student_id }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Payment Details</div>
        <table>
            <tr>
                <th>Payment Date</th>
                <td>{{ $payment->payment_date ? date('F d, Y', strtotime($payment->payment_date)) : 'N/A' }}</td>
            </tr>
            <tr>
                <th>Defense Type</th>
                <td>{{ $student->defense_type ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Defense Status</th>
                <td>{{ $payment->defense_status ?? 'N/A' }}</td>
            </tr>
            <tr>
                <th>Amount</th>
                <td>₱{{ number_format($payment->amount, 2) }}</td>
            </tr>
            <tr>
                <th>OR Number</th>
                <td>{{ $student->or_number ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>This is an official document of the Graduate School System.</p>
    </div>
</body>
</html>