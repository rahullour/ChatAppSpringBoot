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
  `profile_picture_url` TEXT,
  `verification_token` VARCHAR(255),
  `token_expiration` DATETIME,
  PRIMARY KEY (username),
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
-- https://bcryptcalculator.com

INSERT INTO `user`  (username, password, enabled, email)
VALUES
('john','$2a$10$B3IffY.kkIaOpkhmKz.6YuAFeOvqclMNAUg0XT9Ao6Mdc1srTE1aC',1, "john@gmail.com"),
('mary','$2a$10$fb1UvXR8NBOSzOX9PfW70umhpr5wvjQVwTgdDnIqFnRUaPMPxK/uO',1, "mary@gmail.com"),
('rahul','$2a$10$f1YUEL87NiJc9Dz7WejrNeMa8uy0qjrqSUVQPUFZQSwGPor290QPy',1, "rahullour01@gmail.com");


--
-- Table structure for table `authorities`

CREATE TABLE `authority` (
  `username` varchar(50) NOT NULL,
  `authority` varchar(50) NOT NULL,
  CONSTRAINT `authorities4_ibfk_1` FOREIGN KEY (`username`) REFERENCES `user` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Inserting data for table `authorities`
--

INSERT INTO `authority` 
VALUES 
('john','ROLE_USER'),
('mary','ROLE_USER'),
('mary','ROLE_ADMIN'),
('rahul','ROLE_USER'),
('rahul','ROLE_ADMIN'),
('rahul','ROLE_SU_ADMIN');