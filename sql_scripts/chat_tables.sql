use chatappdb;
CREATE TABLE `invite` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_email) REFERENCES user(email)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status_message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE `user_room` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `room_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_room_unique` (`user_id`, `room_id`),
  FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

