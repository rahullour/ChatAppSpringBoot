package com.creating.chatApplication.security;

import javax.sql.DataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {


    @Bean
    public UserDetailsManager userDetails(DataSource dataSource) {
        JdbcUserDetailsManager jdbcUserDetailsManager = new JdbcUserDetailsManager(dataSource);
        jdbcUserDetailsManager.setUsersByUsernameQuery("SELECT username, password, enabled FROM user WHERE username=? OR email=?");
        jdbcUserDetailsManager.setAuthoritiesByUsernameQuery("SELECT username, authority FROM authority WHERE username=?");
        return jdbcUserDetailsManager;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/", "/loginPage").permitAll() // Allow access to login page and images
                        .requestMatchers("/static/**", "/css/**", "/js/**", "/images/**").permitAll() // Allow access to all static resources
                        .anyRequest().authenticated() // Require authentication for all other requests
                )
                .formLogin(form -> form
                        .loginPage("/loginPage")
                        .loginProcessingUrl("/authenticateTheUser")
                        .permitAll() // Allow all users to access the login page
                )
                .exceptionHandling(configurer -> configurer.accessDeniedPage("/access-denied")) // Custom access denied page
                .logout(logout -> logout.permitAll()) // Allow all users to access logout
                .oauth2Login(Customizer.withDefaults());
        return http.build();
    }

}
