package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Integer> {
    public User findByUsername(String username);
    public User findByEmail(String email);
    public User findByUsernameOrEmail(String username, String email);
    public User findByVerificationToken(String token);
    @Query("SELECT u.email FROM User u WHERE LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<String> findEmailsByQuery(@Param("query") String query);}
