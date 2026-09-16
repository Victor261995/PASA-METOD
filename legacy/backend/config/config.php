<?php
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => '3306',
        'name' => 'pasa',
        'user' => 'root',
        'pass' => '',
    ],
    'cors_origin' => 'http://localhost:5173',

    // local | ftp
    'storage_driver' => 'local',

    'local_storage' => __DIR__ . '/../storage/uploads',

    'ftp' => [
        'host' => '127.0.0.1',
        'port' => 21,
        'user' => 'pasa',
        'pass' => 'pasa',
        'ssl' => false,
        'base_dir' => '/pasa'
    ]
];
