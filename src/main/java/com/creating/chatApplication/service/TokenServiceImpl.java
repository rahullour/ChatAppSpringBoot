package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Token;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.TokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TokenServiceImpl implements TokenService{

    @Autowired
    private TokenRepository tokenRepository;

    @Override
    public Token createToken(String type, String token, LocalDateTime expire_at, User user) {
        Token t = new Token(type, token, expire_at);
        t.setUser(user);
        return tokenRepository.save(t);
    }

    @Override
    public Token findByUserTokenAndType(int user_id, String token, String type) {
        return tokenRepository.findByUserTokenAndType(user_id, token, type);
    }

    @Override
    public void delete(int token_id) {
        tokenRepository.deleteById(token_id);
    }
}
