package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.Invite;
import com.creating.chatApplication.entity.Token;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TokenRepository extends JpaRepository<Token, Integer> {
    @Query("SELECT t FROM Token t WHERE t.user.id = :user_id AND t.token = :token AND t.type = :type")
    Token findByUserTokenAndType(@Param("user_id") int userId,
                                 @Param("token") String token,
                                 @Param("type") String type);
}