USE `chatAppDB`;
CREATE TABLE `invite` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_email VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted BOOLEAN DEFAULT FALSE,
    type INT,
    room_id VARCHAR(50),
    FOREIGN KEY (sender_email) REFERENCES user(email),
    FOREIGN KEY (recipient_email) REFERENCES user(email)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_group` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profile_picture_url LONGTEXT,
    room_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `invite_group` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invite_id INT,
    group_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invite_id) REFERENCES invite(id),
    FOREIGN KEY (group_id) REFERENCES user_group(id)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status_message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

