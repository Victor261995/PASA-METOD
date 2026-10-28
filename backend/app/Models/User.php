<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    protected $table = 'usuarios';
    public $timestamps = false;
    protected $hidden = ['password_hash'];
    protected $casts = ['activo' => 'boolean'];

    public function tokens(): HasMany { return $this->hasMany(AuthToken::class, 'user_id'); }
}
