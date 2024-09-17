package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Token;
import com.creating.chatApplication.entity.User;

import java.time.LocalDateTime;

public interface TokenService {
    Token createToken(String type, String token, LocalDateTime expire_at, User user);
    Token findByUserTokenAndType(int user_id, String token, String type);
    void delete(int token_id);
}
