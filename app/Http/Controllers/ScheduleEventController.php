<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Event;
use App\Models\DefenseRequest;
use Carbon\Carbon;

class ScheduleEventController extends Controller
{
    public function list(Request $r) {
        $user = Auth::user();
        if (!$user) abort(401);

        $from = Carbon::parse($r->query('from', now()->startOfMonth()))->startOfDay();
        $to   = Carbon::parse($r->query('to', now()->endOfMonth()))->endOfDay();

        $events = Event::between($from,$to)->get()->map(function($e){
            return [
                'id'       => 'ev-'.$e->id,
                'title'    => $e->title,
                // send local naive date-time strings (no Z / offset) to avoid client shift
                'start'    => $e->start_at?->format('Y-m-d H:i:00'),
                'end'      => $e->end_at?->format('Y-m-d H:i:00'),
                'allDay'   => $e->all_day,
                'editable' => false,
                'type'     => $e->type,
                'color'    => $e->color ?: '#2563eb',
                'origin'   => 'event',
                'description' => $e->description,          // <--- ADDED
            ];
        });

        $defQuery = DefenseRequest::query()
            ->whereNotNull('scheduled_date')
            ->whereIn('workflow_state',['scheduled','completed']);

        if ($user->role === 'Student') {
            $defQuery->where('submitted_by',$user->id);
        } elseif (in_array($user->role,['Faculty','Adviser'])) {
            $defQuery->where(function($q) use ($user){
                $q->where('adviser_user_id',$user->id)
                  ->orWhere('assigned_to_user_id',$user->id)
                  ->orWhere('submitted_by',$user->id);
            });
        }

        $defenses = $defQuery->get()->map(function($d){
            $startDate = $d->scheduled_date?->format('Y-m-d');
            if (!$startDate) return null;
            $startTime = $d->scheduled_time ?: '08:00:00';
            $endTime = $d->scheduled_end_time
                ?: Carbon::parse($startTime)->addHour()->format('H:i:s');

            return [
                'id'     => 'def-'.$d->id,
                'title'  => 'Defense: '.(mb_strimwidth($d->thesis_title ?? 'Untitled',0,60,'…')),
                'start'  => Carbon::parse("$startDate $startTime")->toIso8601String(),
                'end'    => Carbon::parse("$startDate $endTime")->toIso8601String(),
                'allDay' => false,
                'editable'=> false,
                'type'   => 'defense',
                'color'  => '#16a34a',
                'origin' => 'defense',
                'data'   => [
                    'defense_id'    => $d->id,
                    'student'       => $d->student_display_name ?? $d->user?->name,
                    'workflow_state'=> $d->workflow_state,
                    'status'        => $d->status,
                ]
            ];
        })->filter();

        return response()->json($events->merge($defenses)->values());
    }

    public function store(Request $r) {
        $user = Auth::user();
        if (!$user) abort(401);
        if (!in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['error'=>'Forbidden'],403);
        }

        $data = $r->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'start'       => 'required|date',
            'end'         => 'nullable|date|after_or_equal:start',
            'allDay'      => 'boolean',
            'color'       => 'nullable|string|max:20',
        ]);

        $tz = config('app.timezone', 'Asia/Manila');
        $start = \Carbon\Carbon::parse($data['start'], $tz);
        $end = isset($data['end'])
            ? \Carbon\Carbon::parse($data['end'], $tz)
            : (clone $start);

        $ev = Event::create([
            'title'      => $data['title'],
            'description'=> $data['description'] ?? null,
            'start_at'   => $start,
            'end_at'     => $end,
            'all_day'    => $data['allDay'] ?? false,
            'type'       => 'general',
            'color'      => $data['color'] ?? null,
            'created_by' => $user->id
        ]);

        return response()->json([
            'ok'=>true,
            'event_id'=>$ev->id,
            'color'=>$ev->color,
            'description'=>$ev->description,
        ]);
    }

    public function update(Request $r, Event $event) {
        $user = Auth::user();
        if (!$user) abort(401);
        if (!in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['error'=>'Forbidden'],403);
        }
        $data = $r->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'start'       => 'sometimes|date',
            'end'         => 'nullable|date|after_or_equal:start',
            'allDay'      => 'boolean',
            'color'       => 'nullable|string|max:20',
        ]);
        if (isset($data['color'])) $event->color = $data['color'];
        $event->fill([
            'title'=>$data['title'] ?? $event->title,
            'description'=>$data['description'] ?? $event->description,
        ]);
        if (isset($data['start'])) $event->start_at = $data['start'];
        if (array_key_exists('end',$data)) $event->end_at = $data['end'];
        if (isset($data['allDay'])) $event->all_day = $data['allDay'];
        $event->save();
        return response()->json([
            'ok'=>true,
            'description'=>$event->description,
            'color'=>$event->color
        ]);
    }

    public function move(Request $r, Event $event) {
        $user = Auth::user();
        if (!$user) abort(401);
        if (!in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['error'=>'Forbidden'],403);
        }
        $data = $r->validate([
            'start'=>'required|date',
            'end'=>'nullable|date|after_or_equal:start',
            'allDay'=>'boolean'
        ]);
        $event->start_at = $data['start'];
        $event->end_at = $data['end'] ?? $data['start'];
        $event->all_day = $data['allDay'] ?? false;
        $event->save();
        return response()->json(['ok'=>true]);
    }

    public function destroy(Event $event) {
        $user = Auth::user();
        if (!$user) abort(401);
        if (!in_array($user->role,['Coordinator','Administrative Assistant','Dean'])) {
            return response()->json(['error'=>'Forbidden'],403);
        }
        $event->delete();
        return response()->json(['ok'=>true]);
    }
}
