CREATE DATABASE chatAppDB;
USE `chatAppDB`;

--
-- Table structure for table `users`
--

CREATE TABLE `user` (
  `id` int AUTO_INCREMENT UNIQUE KEY,
  `username` varchar(50) NOT NULL,
  `password` char(68) NOT NULL,
  `enabled` boolean NOT NULL default false,
  `email` VARCHAR(255) UNIQUE,
  `fcm_token` VARCHAR(255),
  `profile_picture_url` LONGTEXT,
  `verification_token` VARCHAR(255),
  `token_expiration` DATETIME,
  PRIMARY KEY (email),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Inserting data for table `users`
--
-- NOTE: The passwords are encrypted using BCrypt
--
-- A generation tool is avail at: https://www.luv2code.com/generate-bcrypt-password
--
-- Default passwords here are: name@123--
-- https://bcrypt-generator.com/

INSERT INTO `user`  (username, password, enabled, email)
VALUES
('john','$2a$10$B3IffY.kkIaOpkhmKz.6YuAFeOvqclMNAUg0XT9Ao6Mdc1srTE1aC',1, "john@gmail.com"),
('mary','$2a$10$fb1UvXR8NBOSzOX9PfW70umhpr5wvjQVwTgdDnIqFnRUaPMPxK/uO',1, "mary@gmail.com"),
('rahul','$2a$10$f1YUEL87NiJc9Dz7WejrNeMa8uy0qjrqSUVQPUFZQSwGPor290QPy',1, "rahullour01@gmail.com");


--
-- Table structure for table `authorities`

CREATE TABLE `authority` (
  `id` int AUTO_INCREMENT UNIQUE KEY,
  `user_id` int,
  `authority` varchar(50) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT `authorities4_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Inserting data for table `authorities`
--

INSERT INTO `authority` (user_id, authority) VALUES 
(1,'ROLE_USER'),
(2,'ROLE_USER'),
(2,'ROLE_ADMIN'),
(3,'ROLE_USER'),
(3,'ROLE_ADMIN'),
(3,'ROLE_SU_ADMIN');
