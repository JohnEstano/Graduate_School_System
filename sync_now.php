<?php

use App\Models\DefenseRequest;
use App\Services\StudentRecordSyncService;

$defense = DefenseRequest::find(2);
$service = new StudentRecordSyncService();
$service->syncDefenseToStudentRecord($defense);

echo "Sync complete!";
