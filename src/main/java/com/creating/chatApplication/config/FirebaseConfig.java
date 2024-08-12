package com.creating.chatApplication.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Bean
    public Firestore firestore() throws IOException {
        FileInputStream serviceAccount = new FileInputStream("/home/rahullour/Documents/ChatAppSpringBoot/wechat-5e447-firebase-adminsdk-dcsei-e95bbc009b.json");

        // Initialize Firestore with the service account credentials
        FirestoreOptions options = FirestoreOptions.getDefaultInstance()
                .toBuilder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .build();

        return options.getService(); // Return the Firestore instance
    }
}
