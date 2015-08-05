create table contacto(
	id integer primary key not null auto_increment,
	idusuario integer not null unique,
	nombre varchar(128) not null,
	apellido varchar(128) default '',
	foto text,
	tipo varchar(128) default 'Usuario',
	secuencia integer default 0
);
create table chat(
	id integer primary key not null auto_increment,
	nombre varchar(128) not null,
	foto text,
	grupo integer default 0,
	secuencia integer default 0

);
create table chat_contacto(
	id integer primary key not null auto_increment,
	chat integer not null,
	contacto integer not null,
	silenciado integer default 0,
	nombre varchar(128),
	secuencia integer default 0

);
create table mensaje(
	id bigint primary key not null auto_increment,
	message_id varchar(160),
	remitente int(10) references usuario(id) on delete cascade,
	mensaje text,
	fecha timestamp default CURRENT_TIMESTAMP,
	enviado int default 0,
	leido int default 0,
	chat integer not null,
	secuencia integer default 0
);
-- MENSAJE INSERT
DELIMITER $$
CREATE TRIGGER ins_secuencia_mensaje BEFORE INSERT ON mensaje
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM mensaje) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM mensaje)+1;
END IF;
END;$$
DELIMITER ;
-- MENSAJE UPDATE
DELIMITER $$
CREATE TRIGGER upd_secuencia_mensaje BEFORE UPDATE ON mensaje
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM mensaje) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM mensaje)+1;
END IF;
END;$$
-- CHAT INSERT
CREATE TRIGGER ins_secuencia_chat BEFORE INSERT ON chat
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM chat) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM chat)+1;
END IF;
END;$$
DELIMITER ;
-- CHAT UPDATE
DELIMITER $$
CREATE TRIGGER upd_secuencia_chat BEFORE UPDATE ON chat
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM chat) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM chat)+1;
END IF;
END;$$
-- CONTACTO INSERT
CREATE TRIGGER ins_secuencia_contacto BEFORE INSERT ON contacto
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM contacto) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM contacto)+1;
END IF;
END;$$
DELIMITER ;
-- CONTACTO UPDATE
DELIMITER $$
CREATE TRIGGER upd_secuencia_contacto BEFORE UPDATE ON contacto
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM contacto) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM contacto)+1;
END IF;
END;$$
-- CHAT_CONTACTO INSERT
CREATE TRIGGER ins_secuencia_chat_contacto BEFORE INSERT ON chat_contacto
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM chat_contacto) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM chat_contacto)+1;
END IF;
END;$$
DELIMITER ;
-- CHAT_CONTACTO UPDATE
DELIMITER $$
CREATE TRIGGER upd_secuencia_chat_contacto BEFORE UPDATE ON chat_contacto
FOR EACH ROW
BEGIN
IF (SELECT MAX(secuencia) FROM chat_contacto) is null then
SET NEW.secuencia = 0;
ELSE
SET NEW.secuencia = (SELECT MAX(secuencia) FROM chat_contacto)+1;
END IF;
END;$$
DELIMITER ;
