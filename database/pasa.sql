CREATE DATABASE IF NOT EXISTS pasa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pasa;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS auth_tokens;
DROP TABLE IF EXISTS solicitudes_adopcion;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS validaciones;
DROP TABLE IF EXISTS evidencias;
DROP TABLE IF EXISTS protocolos_sanitarios;
DROP TABLE IF EXISTS evaluaciones_clinicas;
DROP TABLE IF EXISTS animales;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('OPERADOR','VALIDADOR','AUDITOR','ADMIN') NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE auth_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tokens_user FOREIGN KEY(user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE animales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    especie ENUM('PERRO','GATO','OTRO') NOT NULL,
    raza VARCHAR(100) NULL,
    edad_estimada INT NULL,
    sexo ENUM('MACHO','HEMBRA','DESCONOCIDO') DEFAULT 'DESCONOCIDO',
    color VARCHAR(100) NULL,
    descripcion_fisica TEXT NULL,
    refugio VARCHAR(150) NOT NULL,
    sector VARCHAR(100) NULL,
    forma_ingreso ENUM('RESCATE','DONACION','TRASLADO','DECOMISO','OTRO') DEFAULT 'OTRO',
    observaciones_ingreso TEXT NULL,
    foto_principal VARCHAR(255) NULL,
    estado ENUM('INGRESADO','EVALUACION','PROTOCOLO_SANITARIO','VALIDACION','APTO_PARA_ADOPCION','CUARENTENA','RECHAZADO','ADOPTADO') NOT NULL DEFAULT 'INGRESADO',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_animal_user FOREIGN KEY(created_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE evaluaciones_clinicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    operador_id INT NOT NULL,
    peso DECIMAL(6,2) NULL,
    temperatura DECIMAL(4,1) NULL,
    frecuencia_cardiaca INT NULL,
    frecuencia_respiratoria INT NULL,
    condicion_corporal TINYINT NULL,
    comportamiento ENUM('DOCIL','ANSIOSO','AGRESIVO') NULL,
    socializacion_personas VARCHAR(100) NULL,
    socializacion_animales VARCHAR(100) NULL,
    estado_pelaje VARCHAR(100) NULL,
    estado_ojos VARCHAR(100) NULL,
    marcha VARCHAR(100) NULL,
    observaciones TEXT NULL,
    criterio_operador ENUM('APTO_PROTOCOLO','REQUIERE_ATENCION','CUARENTENA') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_animal FOREIGN KEY(animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_user FOREIGN KEY(operador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE protocolos_sanitarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL UNIQUE,
    control_parasitos BOOLEAN NOT NULL DEFAULT FALSE,
    vacuna_antirrabica BOOLEAN NOT NULL DEFAULT FALSE,
    porcentaje_cumplimiento TINYINT NOT NULL DEFAULT 0,
    completo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_protocol_animal FOREIGN KEY(animal_id) REFERENCES animales(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE evidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    protocolo_id INT NULL,
    tipo ENUM('VACUNACION','DESPARASITACION','CERTIFICADO','FOTO','OTRO') NOT NULL,
    nombre_archivo VARCHAR(255) NULL,
    ruta_archivo VARCHAR(500) NULL,
    fecha_emision DATE NULL,
    fecha_vencimiento DATE NULL,
    estado ENUM('VALIDA','VENCIDA','RECHAZADA') NOT NULL DEFAULT 'VALIDA',
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evid_animal FOREIGN KEY(animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    CONSTRAINT fk_evid_protocol FOREIGN KEY(protocolo_id) REFERENCES protocolos_sanitarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_evid_user FOREIGN KEY(uploaded_by) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE validaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    solicitante_id INT NOT NULL,
    validador_id INT NULL,
    estado_anterior VARCHAR(50) NOT NULL,
    estado_solicitado VARCHAR(50) NOT NULL,
    decision ENUM('PENDIENTE','APROBADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    observaciones TEXT NULL,
    fecha_decision DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_val_animal FOREIGN KEY(animal_id) REFERENCES animales(id) ON DELETE CASCADE,
    CONSTRAINT fk_val_requester FOREIGN KEY(solicitante_id) REFERENCES usuarios(id),
    CONSTRAINT fk_val_validator FOREIGN KEY(validador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NULL,
    usuario_id INT NULL,
    tipo_evento VARCHAR(100) NOT NULL,
    estado_anterior VARCHAR(50) NULL,
    estado_nuevo VARCHAR(50) NULL,
    detalle JSON NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hash_anterior CHAR(64) NULL,
    hash_actual CHAR(64) NOT NULL,
    INDEX idx_audit_animal(animal_id, id),
    CONSTRAINT fk_audit_animal FOREIGN KEY(animal_id) REFERENCES animales(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE solicitudes_adopcion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(50) NULL,
    email VARCHAR(150) NOT NULL,
    tipo_vivienda VARCHAR(100) NULL,
    composicion_hogar TEXT NULL,
    mensaje TEXT NULL,
    estado ENUM('PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_adop_animal FOREIGN KEY(animal_id) REFERENCES animales(id)
) ENGINE=InnoDB;
