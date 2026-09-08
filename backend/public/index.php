<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/Http.php';
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../services/AuditService.php';
require_once __DIR__ . '/../services/RuleEngine.php';
require_once __DIR__ . '/../services/FtpService.php';
require_once __DIR__ . '/../services/StorageService.php';

$config = require __DIR__ . '/../config/config.php';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && ($config['cors_origin'] === '*' || $origin === $config['cors_origin'])) {
    header("Access-Control-Allow-Origin: $origin");
}
header('Vary: Origin');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

$db = Database::connect();
$auth = new AuthService($db);
$audit = new AuditService($db);
$storage = new StorageService($config);

$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = '/' . ltrim(substr($uri, strlen($base)), '/');
$method = $_SERVER['REQUEST_METHOD'];

function currentUser(AuthService $auth): array {
    $u = $auth->userFromToken(Http::bearer());
    if (!$u) Http::json(['error'=>'No autenticado.'],401);
    return $u;
}
function requireRole(array $u, array $roles): void {
    if (!in_array($u['rol'], $roles, true)) Http::json(['error'=>'No autorizado para esta operación.'],403);
}
function animalById(PDO $db, int $id, bool $public=false): array {
    $sql="SELECT * FROM animales WHERE id=?";
    if($public) $sql.=" AND estado='APTO_PARA_ADOPCION'";
    $st=$db->prepare($sql);$st->execute([$id]);$a=$st->fetch();
    if(!$a) Http::json(['error'=>'Animal no encontrado.'],404);
    return $a;
}
function protocol(PDO $db, int $animalId): array {
    $st=$db->prepare("SELECT * FROM protocolos_sanitarios WHERE animal_id=? LIMIT 1");
    $st->execute([$animalId]);$p=$st->fetch();
    if(!$p){
        $db->prepare("INSERT INTO protocolos_sanitarios(animal_id) VALUES(?)")->execute([$animalId]);
        $st->execute([$animalId]);$p=$st->fetch();
    }
    return $p;
}
function recomputeProtocol(PDO $db, int $animalId): array {
    $p=protocol($db,$animalId);
    $st=$db->prepare("SELECT tipo,fecha_vencimiento,estado FROM evidencias WHERE animal_id=?");
    $st->execute([$animalId]);$rows=$st->fetchAll();
    $parasitos=0;$rabia=0;
    foreach($rows as $e){
        $valid=$e['estado']==='VALIDA' && (!$e['fecha_vencimiento'] || $e['fecha_vencimiento']>=date('Y-m-d'));
        if(!$valid) continue;
        if($e['tipo']==='DESPARASITACION') $parasitos=1;
        if($e['tipo']==='VACUNACION') $rabia=1;
    }
    $pct=($parasitos+$rabia)*50;
    $complete=$pct===100?1:0;
    $db->prepare("UPDATE protocolos_sanitarios SET control_parasitos=?,vacuna_antirrabica=?,porcentaje_cumplimiento=?,completo=? WHERE animal_id=?")
       ->execute([$parasitos,$rabia,$pct,$complete,$animalId]);
    return protocol($db,$animalId);
}

try {
    // AUTH
    if($method==='POST' && $path==='/api/login'){
        $b=Http::body();
        if(empty($b['email'])||empty($b['password'])) Http::json(['error'=>'Email y contraseña son obligatorios.'],422);
        Http::json($auth->login(trim($b['email']),$b['password']));
    }
    if($method==='POST' && $path==='/api/logout'){
        $auth->logout(Http::bearer()); Http::json(['success'=>true]);
    }
    if($method==='GET' && $path==='/api/me'){
        Http::json(['user'=>currentUser($auth)]);
    }

    // PUBLIC
    if($method==='GET' && $path==='/api/public/animales'){
        $st=$db->query("SELECT id,codigo,nombre,especie,raza,edad_estimada,sexo,color,descripcion_fisica,refugio,foto_principal,estado FROM animales WHERE estado='APTO_PARA_ADOPCION' ORDER BY nombre");
        $rows=$st->fetchAll();
        foreach($rows as &$a){
            $a['foto_url']=$a['foto_principal'] ? rtrim(dirname($_SERVER['SCRIPT_NAME']),'/').$a['foto_principal'] : null;
        }
        Http::json(['data'=>$rows]);
    }
    if(
        $method === 'GET' &&
        preg_match(
            '#^/api/public/animales/(\d+)$#',
            $path,
            $m
        )
    ){
        $st=$db->prepare("
            SELECT
                id,
                codigo,
                nombre,
                especie,
                raza,
                edad_estimada,
                sexo,
                color,
                descripcion_fisica,
                refugio,
                foto_principal,
                estado
            FROM animales
            WHERE id=?
              AND estado='APTO_PARA_ADOPCION'
            LIMIT 1
        ");
        $st->execute([(int)$m[1]]);
        $a=$st->fetch();

        if(!$a){
            Http::json(['error'=>'Animal no encontrado.'],404);
        }

        $a['foto_url']=$a['foto_principal']
            ? rtrim(dirname($_SERVER['SCRIPT_NAME']),'/').$a['foto_principal']
            : null;

        Http::json(['animal'=>$a]);
    }

    if($method==='POST' && preg_match('#^/api/public/animales/(\d+)/solicitudes$#',$path,$m)){
        $a=animalById($db,(int)$m[1],true);
        $b=Http::body();

        $nombre=trim((string)($b['nombre']??''));
        $email=trim((string)($b['email']??''));

        if($nombre==='' || $email===''){
            Http::json(['error'=>'Nombre y email son obligatorios.'],422);
        }

        if(!filter_var($email,FILTER_VALIDATE_EMAIL)){
            Http::json(['error'=>'El email ingresado no es válido.'],422);
        }

        $st=$db->prepare("
            INSERT INTO solicitudes_adopcion(
                animal_id,
                nombre,
                telefono,
                email,
                tipo_vivienda,
                composicion_hogar,
                mensaje
            )
            VALUES(?,?,?,?,?,?,?)
        ");

        $st->execute([
            $a['id'],
            $nombre,
            ($b['telefono']??'')!=='' ? trim((string)$b['telefono']) : null,
            $email,
            ($b['tipo_vivienda']??'')!=='' ? $b['tipo_vivienda'] : null,
            ($b['composicion_hogar']??'')!=='' ? trim((string)$b['composicion_hogar']) : null,
            ($b['mensaje']??'')!=='' ? trim((string)$b['mensaje']) : null
        ]);

        Http::json([
            'success'=>true,
            'id'=>$db->lastInsertId()
        ],201);
    }

        // PRIVATE LIST
    if($method==='GET' && $path==='/api/animales'){
        currentUser($auth);
        $st=$db->query("SELECT * FROM animales ORDER BY created_at DESC");
        Http::json(['data'=>$st->fetchAll()]);
    }

    if($method==='POST' && $path==='/api/animales'){
        $u=currentUser($auth);requireRole($u,['OPERADOR','ADMIN']);$b=Http::body();
        if(empty($b['nombre'])||empty($b['especie'])||empty($b['refugio'])) Http::json(['error'=>'Nombre, especie y refugio son obligatorios.'],422);

        $db->beginTransaction();
        $st=$db->prepare("INSERT INTO animales(codigo,nombre,especie,raza,edad_estimada,sexo,color,descripcion_fisica,refugio,sector,forma_ingreso,observaciones_ingreso,estado,created_by) VALUES('',?,?,?,?,?,?,?,?,?,?,?,'INGRESADO',?)");
        $st->execute([
            trim($b['nombre']),$b['especie'],$b['raza']??null,$b['edad_estimada']??null,$b['sexo']??'DESCONOCIDO',
            $b['color']??null,$b['descripcion_fisica']??null,$b['refugio'],$b['sector']??null,
            $b['forma_ingreso']??'OTRO',$b['observaciones_ingreso']??null,$u['id']
        ]);
        $id=(int)$db->lastInsertId();$code='A-'.str_pad((string)$id,5,'0',STR_PAD_LEFT);
        $db->prepare("UPDATE animales SET codigo=? WHERE id=?")->execute([$code,$id]);
        $db->prepare("INSERT INTO protocolos_sanitarios(animal_id) VALUES(?)")->execute([$id]);
        $audit->add($id,(int)$u['id'],'REGISTRO_ANIMAL',null,'INGRESADO',['codigo'=>$code]);
        $db->commit();
        Http::json(['animal'=>animalById($db,$id)],201);
    }

    if($method==='GET' && preg_match('#^/api/animales/(\d+)$#',$path,$m)){
        currentUser($auth);Http::json(['animal'=>animalById($db,(int)$m[1])]);
    }

    if($method==='PUT' && preg_match('#^/api/animales/(\d+)$#',$path,$m)){
        $u=currentUser($auth);requireRole($u,['OPERADOR','ADMIN']);$a=animalById($db,(int)$m[1]);$b=Http::body();
        $st=$db->prepare("UPDATE animales SET nombre=?,raza=?,edad_estimada=?,sexo=?,color=?,descripcion_fisica=?,refugio=?,sector=? WHERE id=?");
        $st->execute([$b['nombre']??$a['nombre'],$b['raza']??$a['raza'],$b['edad_estimada']??$a['edad_estimada'],$b['sexo']??$a['sexo'],$b['color']??$a['color'],$b['descripcion_fisica']??$a['descripcion_fisica'],$b['refugio']??$a['refugio'],$b['sector']??$a['sector'],$a['id']]);
        $audit->add((int)$a['id'],(int)$u['id'],'ACTUALIZACION_ANIMAL',$a['estado'],$a['estado'],[]);
        Http::json(['animal'=>animalById($db,(int)$a['id'])]);
    }

    // EVALUATIONS
    if($method==='GET' && preg_match('#^/api/animales/(\d+)/evaluaciones$#',$path,$m)){
        currentUser($auth);animalById($db,(int)$m[1]);
        $st=$db->prepare("SELECT e.*,u.nombre operador_nombre FROM evaluaciones_clinicas e JOIN usuarios u ON u.id=e.operador_id WHERE e.animal_id=? ORDER BY e.created_at DESC");
        $st->execute([(int)$m[1]]);Http::json(['data'=>$st->fetchAll()]);
    }
    if($method==='POST' && preg_match('#^/api/animales/(\d+)/evaluaciones$#',$path,$m)){
        $u=currentUser($auth);
        requireRole($u,['OPERADOR','ADMIN']);
        $a=animalById($db,(int)$m[1]);
        $b=Http::body();

        if($a['estado']!=='INGRESADO'){
            Http::json([
                'error'=>'La evaluación inicial solo puede registrarse desde INGRESADO.'
            ],409);
        }

        $crit=$b['criterio_operador']??'APTO_PROTOCOLO';

        if($crit==='APTO_PROTOCOLO'){
            $new='EVALUACION';
        } elseif(in_array($crit,['REQUIERE_ATENCION','CUARENTENA'],true)){
            $new='CUARENTENA';
        } else {
            Http::json(['error'=>'Criterio clínico inválido.'],422);
        }

        $nullable=static function(array $data,string $key){
            if(!array_key_exists($key,$data) || $data[$key]===''){
                return null;
            }
            return $data[$key];
        };

        $db->beginTransaction();

        $st=$db->prepare("
            INSERT INTO evaluaciones_clinicas(
                animal_id,
                operador_id,
                peso,
                temperatura,
                frecuencia_cardiaca,
                frecuencia_respiratoria,
                condicion_corporal,
                comportamiento,
                socializacion_personas,
                socializacion_animales,
                estado_pelaje,
                estado_ojos,
                marcha,
                observaciones,
                criterio_operador
            )
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");

        $st->execute([
            $a['id'],
            $u['id'],
            $nullable($b,'peso'),
            $nullable($b,'temperatura'),
            $nullable($b,'frecuencia_cardiaca'),
            $nullable($b,'frecuencia_respiratoria'),
            $nullable($b,'condicion_corporal'),
            $nullable($b,'comportamiento'),
            $nullable($b,'socializacion_personas'),
            $nullable($b,'socializacion_animales'),
            $nullable($b,'estado_pelaje'),
            $nullable($b,'estado_ojos'),
            $nullable($b,'marcha'),
            $nullable($b,'observaciones'),
            $crit
        ]);

        $db->prepare("UPDATE animales SET estado=? WHERE id=?")
           ->execute([$new,$a['id']]);

        $audit->add(
            (int)$a['id'],
            (int)$u['id'],
            'EVALUACION_CLINICA',
            $a['estado'],
            $new,
            ['criterio_operador'=>$crit]
        );

        $db->commit();

        Http::json([
            'success'=>true,
            'estado'=>$new
        ],201);
    }

    if (
    $method === 'POST' &&
    preg_match(
        '#^/api/animales/(\d+)/foto$#',
        $path,
        $m
    )
) {
    $u = currentUser($auth);

    requireRole(
        $u,
        ['OPERADOR', 'ADMIN']
    );

    $a = animalById(
        $db,
        (int)$m[1]
    );

    if (!isset($_FILES['foto'])) {
        Http::json(
            [
                'error' =>
                    'No se recibió ninguna fotografía.'
            ],
            422
        );
    }

    $ruta = $storage->saveUploaded(
        $_FILES['foto'],
        $a['codigo'],
        'animales'
    );

    $db->prepare(
        "
        UPDATE animales
        SET foto_principal=?
        WHERE id=?
        "
    )->execute([
        $ruta,
        $a['id']
    ]);

    $audit->add(
        (int)$a['id'],
        (int)$u['id'],
        'FOTO_PRINCIPAL_CARGADA',
        $a['estado'],
        $a['estado'],
        [
            'ruta' => $ruta
        ]
    );

    Http::json([
        'success' => true,
        'foto_principal' => $ruta
    ]);
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

        if($method==='POST' && preg_match('#^/api/animales/(\d+)/solicitar-validacion$#',$path,$m)){
        $u=currentUser($auth);
        requireRole($u,['OPERADOR','ADMIN']);
        $a=animalById($db,(int)$m[1]);

        if($a['estado']!=='PROTOCOLO_SANITARIO'){
            Http::json([
                'error'=>'El animal debe estar en PROTOCOLO_SANITARIO para solicitar validación.'
            ],409);
        }

        $p=recomputeProtocol($db,(int)$a['id']);

        if(!(bool)$p['completo']){
            Http::json([
                'error'=>'El protocolo sanitario todavía no está completo.'
            ],409);
        }

        $check=RuleEngine::evaluate($p);

        if(!$check['valido']){
            Http::json([
                'error'=>implode(' ',$check['errores']),
                'reglas'=>$check
            ],409);
        }

        $exists=$db->prepare("
            SELECT id
            FROM validaciones
            WHERE animal_id=?
              AND decision='PENDIENTE'
            LIMIT 1
        ");

        $exists->execute([$a['id']]);

        if($exists->fetch()){
            Http::json([
                'error'=>'Ya existe una validación pendiente.'
            ],409);
        }

        $db->beginTransaction();

        $st=$db->prepare("
            INSERT INTO validaciones(
                animal_id,
                solicitante_id,
                estado_anterior,
                estado_solicitado
            )
            VALUES(?,?,?,'APTO_PARA_ADOPCION')
        ");

        $st->execute([
            $a['id'],
            $u['id'],
            $a['estado']
        ]);

        $validationId=(int)$db->lastInsertId();

        $db->prepare("
            UPDATE animales
            SET estado='VALIDACION'
            WHERE id=?
        ")->execute([$a['id']]);

        $audit->add(
            (int)$a['id'],
            (int)$u['id'],
            'SOLICITUD_VALIDACION',
            $a['estado'],
            'VALIDACION',
            [
                'protocolo'=>$check,
                'validacion_id'=>$validationId
            ]
        );

        $db->commit();

        Http::json([
            'success'=>true,
            'validacion_id'=>$validationId
        ],201);
    }

        // VALIDATOR
   if (
    $method === 'GET' &&
    $path === '/api/validaciones'
) {
    $u = currentUser($auth);

    requireRole(
        $u,
        ['VALIDADOR', 'ADMIN']
    );

    $st = $db->query("
        SELECT
            v.*,

            a.codigo,
            a.nombre,
            a.especie,
            a.raza,
            a.edad_estimada,
            a.sexo,
            a.color,
            a.refugio,
            a.sector,
            a.estado AS animal_estado,

            s.nombre AS solicitante_nombre,
            s.apellido AS solicitante_apellido,

            val.nombre AS validador_nombre,
            val.apellido AS validador_apellido

        FROM validaciones v

        JOIN animales a
            ON a.id = v.animal_id

        LEFT JOIN usuarios s
            ON s.id = v.solicitante_id

        LEFT JOIN usuarios val
            ON val.id = v.validador_id

        ORDER BY
            FIELD(
                v.decision,
                'PENDIENTE',
                'RECHAZADO',
                'APROBADO'
            ),
            v.created_at DESC
    ");

    Http::json([
        'data' => $st->fetchAll()
    ]);
}
    if($method==='POST' && preg_match('#^/api/validaciones/(\d+)/(aprobar|rechazar)$#',$path,$m)){
        $u=currentUser($auth);
        requireRole($u,['VALIDADOR','ADMIN']);

        $id=(int)$m[1];
        $action=$m[2];
        $b=Http::body();

        $st=$db->prepare("
            SELECT
                v.*,
                a.estado AS actual
            FROM validaciones v
            JOIN animales a
                ON a.id=v.animal_id
            WHERE v.id=?
            LIMIT 1
        ");

        $st->execute([$id]);
        $v=$st->fetch();

        if(!$v){
            Http::json(['error'=>'Validación no encontrada.'],404);
        }

        if($v['decision']!=='PENDIENTE'){
            Http::json([
                'error'=>'La validación ya fue resuelta.'
            ],409);
        }

        if($v['actual']!=='VALIDACION'){
            Http::json([
                'error'=>'El animal ya no se encuentra en estado VALIDACION.'
            ],409);
        }

        $decision=$action==='aprobar'
            ? 'APROBADO'
            : 'RECHAZADO';

        $new=$action==='aprobar'
            ? 'APTO_PARA_ADOPCION'
            : 'PROTOCOLO_SANITARIO';

        $db->beginTransaction();

        $db->prepare("
            UPDATE validaciones
            SET
                validador_id=?,
                decision=?,
                observaciones=?,
                fecha_decision=NOW()
            WHERE id=?
        ")->execute([
            $u['id'],
            $decision,
            $b['observaciones']??null,
            $id
        ]);

        $db->prepare("
            UPDATE animales
            SET estado=?
            WHERE id=?
        ")->execute([
            $new,
            $v['animal_id']
        ]);

        $audit->add(
            (int)$v['animal_id'],
            (int)$u['id'],
            $action==='aprobar'
                ? 'VALIDACION_APROBADA'
                : 'VALIDACION_RECHAZADA',
            $v['actual'],
            $new,
            [
                'validacion_id'=>$id,
                'observaciones'=>$b['observaciones']??null
            ]
        );

        $db->commit();

        Http::json([
            'success'=>true,
            'estado'=>$new
        ]);
    }

        // AUDIT
   if (
    $method === 'GET' &&
    $path === '/api/auditoria'
) {
    $u = currentUser($auth);

    requireRole(
        $u,
        ['AUDITOR', 'ADMIN']
    );

    $st = $db->query("
        SELECT
            au.*,

            a.codigo AS animal_codigo,
            a.nombre AS animal_nombre,
            a.especie AS animal_especie,
            a.estado AS animal_estado,

            u.nombre AS usuario_nombre,
            u.apellido AS usuario_apellido,
            u.rol AS usuario_rol

        FROM auditoria au

        LEFT JOIN animales a
            ON a.id = au.animal_id

        LEFT JOIN usuarios u
            ON u.id = au.usuario_id

        ORDER BY au.id DESC
        LIMIT 300
    ");

    Http::json([
        'data' => $st->fetchAll()
    ]);
}
   if (
    $method === 'GET' &&
    preg_match(
        '#^/api/animales/(\d+)/auditoria$#',
        $path,
        $m
    )
) {
    $u = currentUser($auth);

    requireRole(
        $u,
        ['AUDITOR', 'ADMIN']
    );

    $animalId = (int)$m[1];

    animalById(
        $db,
        $animalId
    );

    $st = $db->prepare("
        SELECT
            au.*,

            u.nombre AS usuario_nombre,
            u.apellido AS usuario_apellido,
            u.rol AS usuario_rol

        FROM auditoria au

        LEFT JOIN usuarios u
            ON u.id = au.usuario_id

        WHERE au.animal_id = ?

        ORDER BY au.id ASC
    ");

    $st->execute([
        $animalId
    ]);

    Http::json([
        'data' => $st->fetchAll()
    ]);
}
    if($method==='GET' && preg_match('#^/api/auditoria/verificar/(\d+)$#',$path,$m)){
        $u=currentUser($auth);requireRole($u,['AUDITOR','ADMIN']);
        Http::json(['integridad'=>$audit->verifyAnimal((int)$m[1])]);
    }

    Http::json(['error'=>'Ruta no encontrada.','path'=>$path],404);

} catch (Throwable $e) {
    if ($db->inTransaction()) $db->rollBack();
    error_log($e->__toString());
    Http::json(['error'=>'Error interno del servidor.','detail'=>$e->getMessage()],500);
}
