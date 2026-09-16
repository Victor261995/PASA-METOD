<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SolicitudAdopcion extends Model
{
    protected $table = 'solicitudes_adopcion';
    public $timestamps = false;
    protected $guarded = [];
}
