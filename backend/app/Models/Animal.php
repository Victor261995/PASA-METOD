<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Animal extends Model
{
    protected $table = 'animales';
    public $timestamps = false;
    protected $guarded = [];

    public function evaluaciones(): HasMany { return $this->hasMany(EvaluacionClinica::class, 'animal_id'); }
    public function protocolo(): HasOne { return $this->hasOne(ProtocoloSanitario::class, 'animal_id'); }
    public function evidencias(): HasMany { return $this->hasMany(Evidencia::class, 'animal_id'); }
    public function validaciones(): HasMany { return $this->hasMany(Validacion::class, 'animal_id'); }
    public function auditoria(): HasMany { return $this->hasMany(Auditoria::class, 'animal_id'); }
}
