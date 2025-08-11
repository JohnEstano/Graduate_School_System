<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MessageController extends Controller
{
    /**
     * Display the main messaging interface with performance optimization.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Cache user's conversations to improve performance
        $cacheKey = "user_conversations_{$user->id}";
        $conversations = cache()->remember($cacheKey, now()->addMinutes(10), function () use ($user) {
            return $user->conversations()
                ->with([
                    'latestMessage.user:id,first_name,middle_name,last_name,role,avatar',
                    'users:id,first_name,middle_name,last_name,role,avatar'
                ])
                ->select(['conversations.id', 'conversations.type', 'conversations.title', 'conversations.last_message_at'])
                ->get()
                ->map(function ($conversation) use ($user) {
                    $latestMessage = $conversation->latestMessage->first();
                    $unreadCount = $conversation->getUnreadCountForUser($user->id);
                    
                    // Get other participants (exclude current user)
                    $otherParticipants = $conversation->users->where('id', '!=', $user->id);
                    
                    return [
                        'id' => $conversation->id,
                        'type' => $conversation->type,
                        'title' => $conversation->title ?: $otherParticipants->pluck('name')->join(', '),
                        'participants' => $otherParticipants->map(function ($participant) {
                            return [
                                'id' => $participant->id,
                                'name' => $participant->name,
                                'role' => $participant->role,
                                'avatar' => $participant->avatar ?? null,
                            ];
                        }),
                        'latest_message' => $latestMessage ? [
                            'content' => $latestMessage->content,
                            'user_name' => $latestMessage->user->name,
                            'created_at' => $latestMessage->created_at,
                            'formatted_time' => $latestMessage->formatted_time,
                        ] : null,
                        'unread_count' => $unreadCount,
                        'last_message_at' => $conversation->last_message_at,
                    ];
                });
        });

        // Cache all users for starting new conversations
        $usersCacheKey = "all_users_for_messaging_{$user->id}";
        $users = cache()->remember($usersCacheKey, now()->addMinutes(15), function () use ($user) {
            return User::where('id', '!=', $user->id)
                ->select('id', 'first_name', 'middle_name', 'last_name', 'role', 'email')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'role' => $user->role,
                        'email' => $user->email,
                    ];
                });
        });

        return Inertia::render('messaging/Index', [
            'conversations' => $conversations,
            'users' => $users,
        ]);
    }

    /**
     * Get messages for a specific conversation.
     */
    public function getMessages(Conversation $conversation)
    {
        $user = Auth::user();
        
        // Check if user is participant
        if (!$conversation->hasParticipant($user->id)) {
            abort(403, 'Unauthorized');
        }

        $messages = $conversation->messages()
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) use ($user) {
                return [
                    'id' => $message->id,
                    'content' => $message->content,
                    'type' => $message->type,
                    'metadata' => $message->metadata,
                    'user' => [
                        'id' => $message->user->id,
                        'name' => $message->user->name,
                        'role' => $message->user->role,
                    ],
                    'is_own' => $message->user_id === $user->id,
                    'created_at' => $message->created_at,
                    'formatted_time' => $message->formatted_time,
                    'formatted_date' => $message->formatted_date,
                ];
            });

        // Mark conversation as read
        $conversation->markAsReadForUser($user->id);

        return response()->json([
            'messages' => $messages,
            'conversation' => [
                'id' => $conversation->id,
                'type' => $conversation->type,
                'title' => $conversation->title,
                'participants' => $conversation->users->where('id', '!=', $user->id)->map(function ($participant) {
                    return [
                        'id' => $participant->id,
                        'name' => $participant->name,
                        'role' => $participant->role,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Send a new message.
     */
    public function store(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'content' => 'required|string|max:1000',
            'type' => 'in:text,file,image',
        ]);

        $user = Auth::user();
        $conversation = Conversation::findOrFail($request->conversation_id);

        // Check if user is participant
        if (!$conversation->hasParticipant($user->id)) {
            abort(403, 'Unauthorized');
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
            'content' => $request->content,
            'type' => $request->type ?? 'text',
            'metadata' => $request->metadata,
        ]);

        // Update conversation's last message timestamp
        $conversation->update(['last_message_at' => now()]);

        return response()->json([
            'message' => [
                'id' => $message->id,
                'content' => $message->content,
                'type' => $message->type,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                ],
                'is_own' => true,
                'created_at' => $message->created_at,
                'formatted_time' => $message->formatted_time,
                'formatted_date' => $message->formatted_date,
            ],
        ]);
    }

    /**
     * Start a new conversation.
     */
    public function createConversation(Request $request)
    {
        $request->validate([
            'participants' => 'required|array|min:1',
            'participants.*' => 'exists:users,id',
            'message' => 'required|string|max:1000',
            'type' => 'in:private,group',
            'title' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();
        $participantIds = $request->participants;
        
        // Add current user to participants
        if (!in_array($user->id, $participantIds)) {
            $participantIds[] = $user->id;
        }

        // For private conversations, check if conversation already exists
        if ($request->type === 'private' && count($participantIds) === 2) {
            $existingConversation = Conversation::where('type', 'private')
                ->where(function ($query) use ($participantIds) {
                    $query->whereJsonContains('participants', $participantIds[0])
                          ->whereJsonContains('participants', $participantIds[1]);
                })
                ->first();

            if ($existingConversation) {
                return response()->json([
                    'conversation_id' => $existingConversation->id,
                    'exists' => true,
                ]);
            }
        }

        DB::beginTransaction();
        try {
            // Create conversation
            $conversation = Conversation::create([
                'type' => $request->type ?? 'private',
                'title' => $request->title,
                'participants' => $participantIds,
                'last_message_at' => now(),
            ]);

            // Add participants
            foreach ($participantIds as $participantId) {
                $conversation->users()->attach($participantId, [
                    'is_admin' => $participantId === $user->id,
                    'joined_at' => now(),
                ]);
            }

            // Create initial message
            $message = Message::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'content' => $request->message,
                'type' => 'text',
            ]);

            DB::commit();

            return response()->json([
                'conversation_id' => $conversation->id,
                'exists' => false,
            ]);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to create conversation'], 500);
        }
    }

    /**
     * Get unread message count for user.
     */
    public function getUnreadCount()
    {
        $user = Auth::user();
        
        $totalUnread = $user->conversations->sum(function ($conversation) use ($user) {
            return $conversation->getUnreadCountForUser($user->id);
        });

        return response()->json(['count' => $totalUnread]);
    }

    /**
     * Search users for new conversations.
     */
    public function searchUsers(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2',
            'role' => 'nullable|string',
        ]);

        $user = Auth::user();
        $query = $request->query('query');
        $roleFilter = $request->query('role');

        $usersQuery = User::where('id', '!=', $user->id)
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                  ->orWhere('last_name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('role', 'like', "%{$query}%")
                  ->orWhere('school_id', 'like', "%{$query}%")
                  ->orWhere('program', 'like', "%{$query}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$query}%"])
                  ->orWhereRaw("CONCAT(first_name, ' ', middle_name, ' ', last_name) LIKE ?", ["%{$query}%"]);
            });

        // Apply role filter if provided
        if ($roleFilter && $roleFilter !== 'all') {
            $usersQuery->where('role', $roleFilter);
        }

        $users = $usersQuery
            ->select('id', 'first_name', 'middle_name', 'last_name', 'role', 'email', 'school_id', 'program')
            ->orderBy('role')
            ->orderBy('first_name')
            ->limit(50) // Increased limit for better UX
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'email' => $user->email,
                    'school_id' => $user->school_id,
                    'program' => $user->program,
                ];
            });

        return response()->json(['users' => $users]);
    }
}
