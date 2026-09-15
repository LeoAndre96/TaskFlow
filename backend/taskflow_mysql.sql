-- ==============================================================================
-- TASKFLOW - BASE DE DATOS MYSQL (100% FIEL AL DIAGRAMA)
-- Tablas: roles, usuarios, proyectos, sprints, tareas
-- Sin columna 'area' (se utiliza la relación normalizada con 'roles')
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `taskflow_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `taskflow_db`;

-- Deshabilitar chequeo de llaves foráneas para recrear de forma limpia
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `tareas`;
DROP TABLE IF EXISTS `sprints`;
DROP TABLE IF EXISTS `proyectos`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `roles`;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 1. TABLA: roles
-- ------------------------------------------------------------------------------
CREATE TABLE `roles` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABLA: usuarios
-- ------------------------------------------------------------------------------
CREATE TABLE `usuarios` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellidos` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(150) NOT NULL,
  `username` VARCHAR(60) DEFAULT NULL,
  `dni` VARCHAR(15) DEFAULT NULL,
  `telefono` VARCHAR(25) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rol_id` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_usuario_email` (`email`),
  UNIQUE KEY `uk_usuario_username` (`username`),
  KEY `fk_usuarios_roles_idx` (`rol_id`),
  CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) 
    REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABLA: proyectos
-- ------------------------------------------------------------------------------
CREATE TABLE `proyectos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lider_id` INT(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_proyectos_usuarios_idx` (`lider_id`),
  CONSTRAINT `fk_proyectos_usuarios` FOREIGN KEY (`lider_id`) 
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLA: sprints
-- ------------------------------------------------------------------------------
CREATE TABLE `sprints` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `proyecto_id` INT(11) NOT NULL,
  `fecha_inicio` DATE DEFAULT NULL,
  `fecha_fin` DATE DEFAULT NULL,
  `estado` ENUM('PLANIFICACION', 'ACTIVO', 'FINALIZADO') NOT NULL DEFAULT 'PLANIFICACION',
  PRIMARY KEY (`id`),
  KEY `fk_sprints_proyectos_idx` (`proyecto_id`),
  CONSTRAINT `fk_sprints_proyectos` FOREIGN KEY (`proyecto_id`) 
    REFERENCES `proyectos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABLA: tareas
-- (Sin 'area', exactamente con las columnas de tu diagrama)
-- ------------------------------------------------------------------------------
CREATE TABLE `tareas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `sprint_id` INT(11) NOT NULL,
  `responsable_id` INT(11) DEFAULT NULL,
  `estado` ENUM('Sin asignar', 'En curso', 'Finalizado') NOT NULL DEFAULT 'Sin asignar',
  `prioridad` INT(11) NOT NULL DEFAULT 1,
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tareas_sprints_idx` (`sprint_id`),
  KEY `fk_tareas_usuarios_idx` (`responsable_id`),
  CONSTRAINT `fk_tareas_sprints` FOREIGN KEY (`sprint_id`) 
    REFERENCES `sprints` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tareas_usuarios` FOREIGN KEY (`responsable_id`) 
    REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INSERCIÓN DE DATOS DE EJEMPLO
-- ==============================================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `nombre`) VALUES
(1, 'Admin'),
(2, 'Product Owner'),
(3, 'Scrum Master'),
(4, 'Lead Developer'),
(5, 'UX Designer'),
(6, 'QA Engineer');

-- 2. Usuarios
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol_id`) VALUES
(1, 'Carlos Admin', 'carlos.admin@taskflow.io', '$2a$10$w3j6/2k...hashEjemplo', 1),
(2, 'Mariana Product Owner', 'mariana.po@taskflow.io', '$2a$10$w3j6/2k...hashEjemplo', 2),
(3, 'Ana Scrum Master', 'ana.sm@taskflow.io', '$2a$10$w3j6/2k...hashEjemplo', 3),
(4, 'David Lead Developer', 'david.dev@taskflow.io', '$2a$10$w3j6/2k...hashEjemplo', 4),
(5, 'Lucía UX Designer', 'lucia.design@taskflow.io', '$2a$10$w3j6/2k...hashEjemplo', 5),
(6, 'Mateo QA Specialist', 'mateo.qa@taskflow.io', '$2a$10$w3j6/2k...hashEjemplo', 6);

-- 3. Proyectos
INSERT INTO `proyectos` (`id`, `nombre`, `descripcion`, `lider_id`) VALUES
(1, 'Pasarela de Pagos QR', 'Plataforma de procesamiento de cobros QR dinámicos con conciliación bancaria y liquidación automática.', 1),
(2, 'Banca Móvil 2.0', 'Aplicación móvil nativa para transferencias interbancarias inmediatas y token de seguridad.', 4),
(3, 'Portal Backoffice', 'Panel de control administrativo para supervisión de fraudes y reportería contable en tiempo real.', 2);

-- 4. Sprints
INSERT INTO `sprints` (`id`, `nombre`, `proyecto_id`, `fecha_inicio`, `fecha_fin`, `estado`) VALUES
(1, 'Sprint 01 - Fundaciones', 1, '2026-09-01', '2026-09-14', 'FINALIZADO'),
(2, 'Sprint 02 - Integración QR', 1, '2026-09-15', '2026-09-29', 'ACTIVO'),
(3, 'Sprint 01 - MVP Móvil', 2, '2026-09-10', '2026-09-24', 'ACTIVO'),
(4, 'Sprint 01 - Panel Admin', 3, '2026-08-15', '2026-08-30', 'FINALIZADO');

-- 5. Tareas (Sin 'area')
INSERT INTO `tareas` (`id`, `titulo`, `descripcion`, `sprint_id`, `responsable_id`, `estado`, `prioridad`) VALUES
(1, 'Integrar webhook para confirmación en tiempo real', 'Recepción y validación de firma criptográfica de pasarela QR.', 2, 1, 'En curso', 1),
(2, 'Diseño de interfaz de cobro con QR móvil', 'Crear componentes accesibles y diseño responsive.', 2, 5, 'Finalizado', 1),
(3, 'Optimización de consultas SQL en liquidaciones', 'Indexación y paginación en consultas pesadas de base de datos.', 2, 4, 'En curso', 2),
(4, 'Pruebas de estrés de 1,000 tx/segundo', 'Simulación de carga masiva para pasarela de pagos.', 2, 6, 'En curso', 1),
(5, 'Redacción de manual de integración para comercios', 'Guía paso a paso con ejemplos en cURL y Java 17.', 2, NULL, 'Sin asignar', 3),
(6, 'Definición del backlog para siguiente entrega', 'Priorización de requerimientos con stakeholders.', 2, 2, 'Finalizado', 2),
(7, 'Auditoría de seguridad y cifrado TLS 1.3', 'Revisión de certificados SSL y protección de endpoints.', 2, NULL, 'Sin asignar', 1);
