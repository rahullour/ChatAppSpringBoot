package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Token;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.TokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TokenServiceImpl implements TokenService{

    @Autowired
    private TokenRepository tokenRepository;
    @Autowired
    private UserService userService;

    @Override
    public Token createToken(String type, String token, LocalDateTime expire_at, User user, String roomId) {
        Token t = new Token(expire_at, roomId, token, type);
        t.setUser(user);
        return tokenRepository.save(t);
    }

    @Override
    public Token findByUserTokenAndType(int user_id, String token, String type) {
        return tokenRepository.findByUserTokenAndType(user_id, token, type);
    }

    @Transactional
    @Override
    public void deleteBySenderEmailAndRoomId(String senderEmail, String roomId) {
        tokenRepository.deleteBySenderEmailAndRoomId(senderEmail, roomId);
    }

    @Transactional
    @Override
    public void deleteByRoomId(String roomId) {
        tokenRepository.deleteByRoomId(roomId);
    }

    @Override
    public void delete(int token_id) {
        tokenRepository.deleteById(token_id);
    }
}
