package com.creating.chatApplication.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.ResultSet;
import java.sql.SQLException;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final DataSource dataSource;

    public CustomUserDetailsService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        try (var connection = dataSource.getConnection();
             var preparedStatement = connection.prepareStatement("SELECT username, password, enabled FROM user WHERE username = ? OR email = ?")) {
            preparedStatement.setString(1, usernameOrEmail);
            preparedStatement.setString(2, usernameOrEmail);
            try (var resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    String username = resultSet.getString("username");
                    String password = resultSet.getString("password");
                    boolean enabled = resultSet.getBoolean("enabled");
                    return org.springframework.security.core.userdetails.User.withUsername(username)
                            .password(password)
                            .disabled(!enabled)
                            .build();
                } else {
                    throw new UsernameNotFoundException("User not found: " + usernameOrEmail);
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error fetching user details", e);
        }
    }
}
