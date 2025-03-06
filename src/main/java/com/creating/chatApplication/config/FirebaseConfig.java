package com.creating.chatApplication.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Autowired
    private ResourceLoader resourceLoader;

    public Resource getResourceFromPath() throws IOException {
        return resourceLoader.getResource("classpath:wechat-ec503-4b309cc2015a.json");
    }

    @Bean
    public Firestore firestore() throws IOException {
        // Path to your service account key file
//        String serviceAccountPath = "/src/main/resources/wechat-ec503-4b309cc2015a.json";

        // Use a service account
        try (InputStream serviceAccount = getResourceFromPath().getInputStream()) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setCredentials(credentials)
                    .build();

            // Initialize Firebase App
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }

            // Create Firestore instance
            FirestoreOptions firestoreOptions = FirestoreOptions.getDefaultInstance()
                    .toBuilder()
                    .setCredentials(credentials)
                    .build();

            return firestoreOptions.getService(); // Return the Firestore instance
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize Firestore: " + e.getMessage(), e);
        }
    }
}
