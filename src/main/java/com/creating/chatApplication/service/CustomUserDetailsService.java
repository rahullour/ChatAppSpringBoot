//package com.creating.chatApplication.service;
//
//import com.creating.chatApplication.entity.User;
//import com.creating.chatApplication.repository.UserRepository;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.security.core.userdetails.UserDetailsService;
//import org.springframework.security.core.userdetails.UsernameNotFoundException;
//import org.springframework.stereotype.Service;
//import java.util.Collections;
//
//@Service
//public class CustomUserDetailsService implements UserDetailsService {
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Override
//    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
//        User user = userRepository.findByUsernameOrEmail(identifier, identifier);
//        if (user == null) {
//            throw new UsernameNotFoundException("User not found with username or email: " + identifier);
//        }
//        // Return a Spring Security UserDetails instance
//        return new org.springframework.security.core.userdetails.User(
//                user.getUsername(),
//                user.getPassword(),
//                Collections.emptyList()
//        );
//    }
//}
