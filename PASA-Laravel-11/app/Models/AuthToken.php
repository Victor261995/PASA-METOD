<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuthToken extends Model
{
    protected $table = 'auth_tokens';
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = ['expires_at' => 'datetime'];

    public function user(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
}
