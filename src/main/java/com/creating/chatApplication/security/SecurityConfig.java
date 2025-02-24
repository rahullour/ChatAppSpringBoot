package com.creating.chatApplication.security;

import com.creating.chatApplication.service.CustomUserDetailsService;
import com.creating.chatApplication.service.NotificationManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.*;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import javax.sql.DataSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final DataSource dataSource;

    @Autowired
    public SecurityConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return new CustomUserDetailsService(dataSource);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    private NotificationManager notificationManager;

    @Bean
    public AuthenticationSuccessHandler customAuthenticationSuccessHandler() {
        return (request, response, authentication) -> {
            request.getSession().removeAttribute("error");
            response.sendRedirect("/");
        };
    }

    @Bean
    public AuthenticationFailureHandler customAuthenticationFailureHandler() {
        return (request, response, exception) -> {
            String errorMessage = "Invalid username or password";
            String notificationType = "alert-danger";
            String notificationDuration = "short-noty";
            if (exception instanceof BadCredentialsException) {
                errorMessage = "Invalid username or password";
            } else if (exception instanceof LockedException) {
                errorMessage = "Account is locked";
            } else if (exception instanceof DisabledException) {
                notificationDuration = "medium-noty";
                errorMessage = "Your account is disabled for now, have you verified your email via the link we sent you?, else please contact admin support wechatcorporations@gmail.com.";
            }
            notificationManager.sendFlashNotification(errorMessage, notificationType, notificationDuration);
            response.sendRedirect("/loginPage");
        };
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/loginPage", "/signup-form", "/signup", "/verifyEmail", "/verifyInviteUser", "/verifyResetEmail", "/resetPassword", "/passwordResetFormSubmit").permitAll()
                        .requestMatchers("/static/**", "/css/**", "/js/**", "/images/**").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/loginPage")
                        .loginProcessingUrl("/authenticateTheUser")
                        .successHandler(customAuthenticationSuccessHandler())
                        .failureHandler(customAuthenticationFailureHandler())
                        .permitAll()
                )
                .exceptionHandling(configurer -> configurer.accessDeniedPage("/access-denied"))
                .logout(logout -> logout.permitAll())
                .oauth2Login(oauth2 -> oauth2
                .loginPage("/loginPage")
                .defaultSuccessUrl("/", true)
                .failureUrl("/loginPage?error")
                .authorizationEndpoint(authorization -> authorization
                        .baseUri("/oauth2/authorization"))
                )
                .csrf(csrf -> csrf
                        .ignoringRequestMatchers("/api/files/upload", "/api/files/delete")
                );
        return http.build();
    }
}