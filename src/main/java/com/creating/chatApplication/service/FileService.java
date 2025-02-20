package com.creating.chatApplication.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.S3Object;
import com.amazonaws.services.s3.model.S3ObjectInputStream;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.apache.tomcat.util.http.fileupload.ByteArrayOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;


@Service
public class FileService {
    private static final Logger logger = LoggerFactory.getLogger(FileService.class);

    @Autowired
    private AmazonS3 r2Client;  // R2 Storage Client

    @Value("${r2.bucket}")
    private String bucket;

    @Value("${r2.public-sub-domain}")
    private String publicSubDomain;

    @Autowired
    private AmazonS3 s3Client; // You can remove this if not needed

    public String uploadFile(MultipartFile file) {
        try {
            String key = UUID.randomUUID() + "-" + file.getOriginalFilename();
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            r2Client.putObject(bucket, key, file.getInputStream(), metadata);
            return publicSubDomain + "/" + key; // Public R2 endpoint

        } catch (IOException e) {
            logger.error("Upload failed", e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    public byte[] downloadFile(String fileUrl) {
        try {
            // Extract the object key from the URL
            String objectKey = extractObjectKeyFromUrl(fileUrl);

            // Download the file from R2
            S3Object s3Object = r2Client.getObject(new GetObjectRequest(bucket, objectKey));
            S3ObjectInputStream inputStream = s3Object.getObjectContent();

            // Read the content into a byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; // Adjust buffer size if needed
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }

            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error downloading file: " + e.getMessage(), e);
        }
    }

    // Getter for r2Client
    public AmazonS3 getR2Client() {
        return r2Client;
    }

    // Getter for bucket
    public String getBucket() {
        return bucket;
    }

    // Extract object key from the URL
    public String extractObjectKeyFromUrl(String fileUrl) {
        return fileUrl.replace(publicSubDomain + "/", "");
    }

    public String getFilenameFromUrl(String fileUrl) {
        return fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    }

    public String getObjectKeyFromFileName(String fileName) {
        try {
            // Query Firebase Attachments collection to find the attachment with the given fileName
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection("Attachments")
                    .whereEqualTo("fileName", fileName)
                    .limit(1)
                    .get();

            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            if (!documents.isEmpty()) {
                String downloadUrl = documents.get(0).getString("downloadUrl");
                return extractObjectKeyFromUrl(downloadUrl);
            } else {
                throw new RuntimeException("No attachment found with fileName: " + fileName);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving object key for file: " + fileName, e);
        }
    }

}
