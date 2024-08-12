package com.creating.chatApplication.repository;

import com.creating.chatApplication.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {
    public User findByUsername(String username);
    public User findByEmail(String email);
    public User findByUsernameOrEmail(String username, String email);
    public User findByVerificationToken(String token);
}
