USE `chatAppDB`;

-- Chat application specific tables
CREATE TABLE user_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	type VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE conversation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_group_chat BOOLEAN DEFAULT FALSE
);

CREATE TABLE message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversation(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE user_conversation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    conversation_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `user_conversation_idx` (`user_id`, `conversation_id`),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (conversation_id) REFERENCES conversation(id)
);

-- Indexes for better performance
CREATE INDEX idx_message_conversation_id ON message(conversation_id);
CREATE INDEX idx_message_user_id ON message(user_id);
CREATE INDEX idx_user_conversation_user_id ON user_conversation(user_id);
CREATE INDEX idx_user_conversation_conversation_id ON user_conversation(conversation_id);