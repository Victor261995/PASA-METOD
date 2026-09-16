<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Model
{
    protected $table = 'usuarios';
    public $timestamps = false;
    protected $hidden = ['password_hash'];
    protected $casts = ['activo' => 'boolean'];

    public function tokens(): HasMany { return $this->hasMany(AuthToken::class, 'user_id'); }
}
