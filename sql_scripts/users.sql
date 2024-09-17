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

CREATE TABLE `token` (
  `id` INT AUTO_INCREMENT UNIQUE KEY,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expire_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	type VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

--
-- Inserting data for table `users`
--
-- NOTE: The passwords are encrypted using BCrypt
--
-- A generation tool is avail at: https://www.luv2code.com/generate-bcrypt-password
--
-- Default passwords here are: name@123--
-- https://bcrypt-generator.com/

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
