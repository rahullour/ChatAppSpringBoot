-- Drop user first if they exist
DROP USER if exists 'chatAppUser'@'%' ;

-- Now create user with prop privileges
CREATE USER 'chatAppUser'@'%' IDENTIFIED BY 'admin';

GRANT ALL PRIVILEGES ON * . * TO 'chatAppUser'@'%';

CREATE DATABASE chatAppDB;
USE `chatAppDB`;

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int AUTO_INCREMENT UNIQUE KEY,
  `username` varchar(50) NOT NULL,
  `password` char(68) NOT NULL,
  `enabled` tinyint NOT NULL,
  PRIMARY KEY (username)
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

INSERT INTO `users`  (username, password, enabled)
VALUES
('john','{bcrypt}$2a$10$B3IffY.kkIaOpkhmKz.6YuAFeOvqclMNAUg0XT9Ao6Mdc1srTE1aC',1),
('mary','{bcrypt}$2a$10$fb1UvXR8NBOSzOX9PfW70umhpr5wvjQVwTgdDnIqFnRUaPMPxK/uO',1),
('rahul','{bcrypt}$2a$10$f1YUEL87NiJc9Dz7WejrNeMa8uy0qjrqSUVQPUFZQSwGPor290QPy',1);


--
-- Table structure for table `authorities`

CREATE TABLE `authorities` (
  `username` varchar(50) NOT NULL,
  `authority` varchar(50) NOT NULL,
  UNIQUE KEY `authorities4_idx_1` (`username`,`authority`),
  CONSTRAINT `authorities4_ibfk_1` FOREIGN KEY (`username`) REFERENCES `users` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Inserting data for table `authorities`
--

INSERT INTO `authorities` 
VALUES 
('john','ROLE_USER'),
('mary','ROLE_USER'),
('mary','ROLE_ADMIN'),
('rahul','ROLE_USER'),
('rahul','ROLE_ADMIN'),
('rahul','ROLE_SU_ADMIN');