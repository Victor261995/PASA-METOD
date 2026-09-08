USE pasa;

INSERT INTO usuarios(nombre,apellido,email,password_hash,rol) VALUES
('Lucía','García','operador@pasa.local','$2y$12$l4vrEycPunZIRRkbKy.XTuXET1ALu0pX51i8R.jMyHG/v1Fnbn8tC','OPERADOR'),
('Martín','Pérez','validador@pasa.local','$2y$12$l4vrEycPunZIRRkbKy.XTuXET1ALu0pX51i8R.jMyHG/v1Fnbn8tC','VALIDADOR'),
('Ana','López','auditor@pasa.local','$2y$12$l4vrEycPunZIRRkbKy.XTuXET1ALu0pX51i8R.jMyHG/v1Fnbn8tC','AUDITOR'),
('Administrador','PASA','admin@pasa.local','$2y$12$l4vrEycPunZIRRkbKy.XTuXET1ALu0pX51i8R.jMyHG/v1Fnbn8tC','ADMIN');

INSERT INTO animales(codigo,nombre,especie,raza,edad_estimada,sexo,color,descripcion_fisica,refugio,sector,forma_ingreso,estado,created_by)
VALUES
('A-00341','Rocco','PERRO','Mestizo',2,'MACHO','Marrón','Perro mediano, activo y sociable.','Refugio Norte','Sector B','RESCATE','APTO_PARA_ADOPCION',1),
('A-00342','Luna','GATO','Europeo común',3,'HEMBRA','Negro','Gata tranquila y sociable.','Refugio Centro','Sector A','DONACION','APTO_PARA_ADOPCION',1),
('A-00343','Toby','PERRO','Mestizo',4,'MACHO','Blanco y marrón','Perro adulto de tamaño mediano.','Refugio Sur','Sector C','RESCATE','INGRESADO',1);

INSERT INTO protocolos_sanitarios(animal_id,control_parasitos,vacuna_antirrabica,porcentaje_cumplimiento,completo)
SELECT id,1,1,100,1 FROM animales WHERE codigo IN ('A-00341','A-00342');

INSERT INTO protocolos_sanitarios(animal_id)
SELECT id FROM animales WHERE codigo='A-00343';

INSERT INTO evidencias(animal_id,protocolo_id,tipo,fecha_emision,estado,uploaded_by)
SELECT a.id,p.id,'DESPARASITACION',CURDATE(),'VALIDA',1
FROM animales a JOIN protocolos_sanitarios p ON p.animal_id=a.id
WHERE a.codigo IN ('A-00341','A-00342');

INSERT INTO evidencias(animal_id,protocolo_id,tipo,fecha_emision,estado,uploaded_by)
SELECT a.id,p.id,'VACUNACION',CURDATE(),'VALIDA',1
FROM animales a JOIN protocolos_sanitarios p ON p.animal_id=a.id
WHERE a.codigo IN ('A-00341','A-00342');
