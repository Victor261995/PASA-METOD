<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}


    

    // PROTOCOL
    if (
    $method === 'GET' &&
    preg_match(
        '#^/api/animales/(\d+)/protocolo$#',
        $path,
        $m
    )
) {
    currentUser($auth);

    $animalId = (int)$m[1];

    animalById($db, $animalId);

    $protocolo = recomputeProtocol(
        $db,
        $animalId
    );

    $st = $db->prepare("
        SELECT
            e.*,
            u.nombre AS uploaded_by_nombre,
            u.apellido AS uploaded_by_apellido
        FROM evidencias e
        LEFT JOIN usuarios u
            ON u.id = e.uploaded_by
        WHERE e.animal_id = ?
        ORDER BY e.created_at DESC
    ");

    $st->execute([$animalId]);

    Http::json([
        'protocolo' => $protocolo,
        'evidencias' => $st->fetchAll()
    ]);
}

    if ($method === 'GET' && preg_match('#^/api/animales/(\d+)/evidencias$#', $path, $m)) {
        currentUser($auth);
        $animalId = (int)$m[1];
        animalById($db, $animalId);
        $stmt = $db->prepare("
            SELECT e.*, u.nombre AS uploaded_by_nombre, u.apellido AS uploaded_by_apellido 
            FROM evidencias e 
            LEFT JOIN usuarios u ON u.id = e.uploaded_by 
            WHERE e.animal_id = ? 
            ORDER BY e.created_at DESC
        ");
        $stmt->execute([$animalId]);
        Http::json(['evidencias' => $stmt->fetchAll()]);
    }
    
    if($method==='POST' && preg_match('#^/api/animales/(\d+)/evidencias$#',$path,$m)){
        $u=currentUser($auth);
        requireRole($u,['OPERADOR','ADMIN']);
        $a=animalById($db,(int)$m[1]);

        if(!in_array($a['estado'],['EVALUACION','PROTOCOLO_SANITARIO'],true)){
            Http::json([
                'error'=>'El animal no se encuentra en etapa de protocolo.'
            ],409);
        }

        $tipo=$_POST['tipo']??'OTRO';
        $allowed=['VACUNACION','DESPARASITACION','CERTIFICADO','FOTO','OTRO'];

        if(!in_array($tipo,$allowed,true)){
            Http::json(['error'=>'Tipo de evidencia inválido.'],422);
        }

        $route=null;

        if(isset($_FILES['archivo'])){
            $route=$storage->saveUploaded(
                $_FILES['archivo'],
                $a['codigo'],
                'evidencias'
            );
        }

        $status='VALIDA';
        $fv=$_POST['fecha_vencimiento']??null;

        if($fv && $fv<date('Y-m-d')){
            $status='VENCIDA';
        }

        $new='PROTOCOLO_SANITARIO';

        $db->beginTransaction();

        $st=$db->prepare("
            INSERT INTO evidencias(
                animal_id,
                protocolo_id,
                tipo,
                nombre_archivo,
                ruta_archivo,
                fecha_emision,
                fecha_vencimiento,
                estado,
                uploaded_by
            )
            VALUES(
                ?,
                (SELECT id FROM protocolos_sanitarios WHERE animal_id=?),
                ?,?,?,?,?,?,?
            )
        ");

        $st->execute([
            $a['id'],
            $a['id'],
            $tipo,
            $_FILES['archivo']['name']??null,
            $route,
            $_POST['fecha_emision']??null,
            $fv,
            $status,
            $u['id']
        ]);

        if($a['estado']!=='PROTOCOLO_SANITARIO'){
            $db->prepare("UPDATE animales SET estado=? WHERE id=?")
               ->execute([$new,$a['id']]);
        }

        $p=recomputeProtocol($db,(int)$a['id']);

        $audit->add(
            (int)$a['id'],
            (int)$u['id'],
            'EVIDENCIA_CARGADA',
            $a['estado'],
            $new,
            [
                'tipo'=>$tipo,
                'estado'=>$status,
                'ruta'=>$route
            ]
        );

        $db->commit();

        Http::json([
            'success'=>true,
            'protocolo'=>$p
        ],201);
    }

// Register the Auto Loader...
require __DIR__.'/../vendor/autoload.php';


// Bootstrap Laravel and handle the request...
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
