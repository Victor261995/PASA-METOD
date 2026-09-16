<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProtocoloSanitario extends Model
{
    protected $table = 'protocolos_sanitarios';
    public $timestamps = false;
    protected $guarded = [];
    protected $casts = [
        'control_parasitos' => 'boolean',
        'vacuna_antirrabica' => 'boolean',
        'completo' => 'boolean',
        'porcentaje_cumplimiento' => 'integer',
    ];
}
